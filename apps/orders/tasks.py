# apps/orders/tasks.py

from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from datetime import timedelta
import logging

from .models import Order, OrderStatusHistory, OrderNote
from .services.notification_service import OrderNotificationService

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def send_order_confirmation_email(self, order_id):
    """Send order confirmation email asynchronously"""
    try:
        order = Order.objects.get(id=order_id)
        notification_service = OrderNotificationService()
        
        success = notification_service.send_order_confirmation(order)
        
        if success:
            logger.info(f"Order confirmation email sent for order {order.order_number}")
        else:
            raise Exception("Failed to send order confirmation email")
            
    except Order.DoesNotExist:
        logger.error(f"Order with ID {order_id} not found")
    except Exception as exc:
        logger.error(f"Failed to send order confirmation for order {order_id}: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))


@shared_task(bind=True, max_retries=3)
def send_cod_admin_notification(self, order_id):
    """Send COD order notification to admins asynchronously"""
    try:
        order = Order.objects.get(id=order_id, is_cash_on_delivery=True)
        notification_service = OrderNotificationService()
        
        success = notification_service.send_cod_admin_notification(order)
        
        if success:
            logger.info(f"COD admin notification sent for order {order.order_number}")
        else:
            raise Exception("Failed to send COD admin notification")
            
    except Order.DoesNotExist:
        logger.error(f"COD Order with ID {order_id} not found")
    except Exception as exc:
        logger.error(f"Failed to send COD notification for order {order_id}: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))


@shared_task(bind=True, max_retries=3)
def send_status_update_notification(self, order_id, previous_status):
    """Send order status update notification asynchronously"""
    try:
        order = Order.objects.get(id=order_id)
        notification_service = OrderNotificationService()
        
        success = notification_service.send_status_update(order, previous_status)
        
        if success:
            logger.info(f"Status update notification sent for order {order.order_number}")
        else:
            raise Exception("Failed to send status update notification")
            
    except Order.DoesNotExist:
        logger.error(f"Order with ID {order_id} not found")
    except Exception as exc:
        logger.error(f"Failed to send status update for order {order_id}: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))


@shared_task
def auto_confirm_cod_orders():
    """Automatically confirm COD orders after 24 hours"""
    cutoff_time = timezone.now() - timedelta(hours=24)
    
    pending_cod_orders = Order.objects.filter(
        status='pending',
        is_cash_on_delivery=True,
        created_at__lte=cutoff_time
    )
    
    confirmed_count = 0
    
    for order in pending_cod_orders:
        try:
            order.mark_as_confirmed()
            
            # Add system note
            OrderNote.objects.create(
                order=order,
                note_type='system',
                note="Order auto-confirmed after 24 hours (COD)",
                is_internal=True
            )
            
            # Send notification
            send_status_update_notification.delay(order.id, 'pending')
            
            confirmed_count += 1
            
        except Exception as e:
            logger.error(f"Failed to auto-confirm order {order.order_number}: {str(e)}")
    
    logger.info(f"Auto-confirmed {confirmed_count} COD orders")
    return confirmed_count


@shared_task
def send_delivery_reminder():
    """Send delivery reminders for orders pending delivery"""
    # Orders confirmed more than 2 days ago but not yet delivered
    cutoff_time = timezone.now() - timedelta(days=2)
    
    orders_pending_delivery = Order.objects.filter(
        status__in=['confirmed', 'processing'],
        confirmed_at__lte=cutoff_time
    ).select_related('user')
    
    reminded_count = 0
    
    for order in orders_pending_delivery:
        try:
            subject = f"Delivery Update - Order {order.order_number}"
            
            context = {
                'order': order,
                'customer_name': order.get_customer_name(),
                'support_email': settings.DEFAULT_FROM_EMAIL,
            }
            
            html_message = render_to_string('emails/delivery_reminder.html', context)
            plain_message = render_to_string('emails/delivery_reminder.txt', context)
            
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[order.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            # Add system note
            OrderNote.objects.create(
                order=order,
                note_type='system',
                note="Delivery reminder sent to customer",
                is_internal=True
            )
            
            reminded_count += 1
            
        except Exception as e:
            logger.error(f"Failed to send delivery reminder for order {order.order_number}: {str(e)}")
    
    logger.info(f"Sent delivery reminders for {reminded_count} orders")
    return reminded_count


@shared_task
def cleanup_cancelled_orders():
    """Clean up old cancelled orders and restore stock if needed"""
    # Orders cancelled more than 30 days ago
    cutoff_time = timezone.now() - timedelta(days=30)
    
    old_cancelled_orders = Order.objects.filter(
        status='cancelled',
        cancelled_at__lte=cutoff_time
    ).prefetch_related('items')
    
    processed_count = 0
    
    for order in old_cancelled_orders:
        try:
            # Double-check stock restoration for cancelled orders
            for item in order.items.all():
                try:
                    from apps.products.models import Product
                    product = Product.objects.get(id=item.product_id)
                    
                    # Check if stock was already restored
                    # This is a safety check to prevent double restoration
                    if not hasattr(item, 'stock_restored'):
                        product.stock_quantity += item.quantity
                        product.save(update_fields=['stock_quantity'])
                        
                        # Mark as restored (you might want to add this field to OrderItem)
                        OrderNote.objects.create(
                            order=order,
                            note_type='system',
                            note=f"Stock restored for {item.product_name} (Qty: {item.quantity})",
                            is_internal=True
                        )
                
                except Product.DoesNotExist:
                    # Product was deleted, skip stock restoration
                    pass
            
            processed_count += 1
            
        except Exception as e:
            logger.error(f"Failed to cleanup cancelled order {order.order_number}: {str(e)}")
    
    logger.info(f"Processed cleanup for {processed_count} cancelled orders")
    return processed_count


@shared_task
def generate_daily_order_report():
    """Generate daily order report for admins"""
    from django.contrib.auth import get_user_model
    from django.db.models import Count, Sum
    
    User = get_user_model()
    
    today = timezone.now().date()
    yesterday = today - timedelta(days=1)
    
    # Get today's stats
    today_orders = Order.objects.filter(created_at__date=today)
    yesterday_orders = Order.objects.filter(created_at__date=yesterday)
    
    today_stats = {
        'total_orders': today_orders.count(),
        'total_revenue': today_orders.aggregate(Sum('total_amount'))['total_amount__sum'] or 0,
        'cod_orders': today_orders.filter(is_cash_on_delivery=True).count(),
        'mobile_money_orders': today_orders.filter(is_cash_on_delivery=False).count(),
        'pending_orders': today_orders.filter(status='pending').count(),
        'delivered_orders': today_orders.filter(status='delivered').count(),
    }
    
    yesterday_stats = {
        'total_orders': yesterday_orders.count(),
        'total_revenue': yesterday_orders.aggregate(Sum('total_amount'))['total_amount__sum'] or 0,
    }
    
    # Get admin emails
    admin_emails = list(
        User.objects.filter(is_admin=True, is_active=True)
        .values_list('email', flat=True)
    )
    
    if not admin_emails:
        logger.warning("No admin users found for daily report")
        return
    
    try:
        subject = f"Daily Order Report - {today.strftime('%Y-%m-%d')}"
        
        context = {
            'date': today,
            'today_stats': today_stats,
            'yesterday_stats': yesterday_stats,
            'recent_orders': today_orders.order_by('-created_at')[:10]
        }
        
        html_message = render_to_string('emails/daily_order_report.html', context)
        plain_message = render_to_string('emails/daily_order_report.txt', context)
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=admin_emails,
            html_message=html_message,
            fail_silently=False,
        )
        
        logger.info(f"Daily order report sent to {len(admin_emails)} admins")
        
    except Exception as e:
        logger.error(f"Failed to send daily order report: {str(e)}")


@shared_task
def update_estimated_delivery_dates():
    """Update estimated delivery dates for confirmed orders"""
    confirmed_orders = Order.objects.filter(
        status='confirmed',
        estimated_delivery__isnull=True
    )
    
    updated_count = 0
    
    for order in confirmed_orders:
        try:
            # Calculate estimated delivery based on location and order date
            base_days = 2  # Base delivery time in Uganda
            
            # Add extra days for remote districts
            remote_districts = ['Karamoja', 'Kotido', 'Moroto', 'Nakapiripirit']
            if order.district in remote_districts:
                base_days += 2
            
            # Weekend adjustment
            estimated_delivery = order.confirmed_at + timedelta(days=base_days)
            
            # Skip weekends (Saturday = 5, Sunday = 6)
            while estimated_delivery.weekday() >= 5:
                estimated_delivery += timedelta(days=1)
            
            order.estimated_delivery = estimated_delivery
            order.save(update_fields=['estimated_delivery'])
            
            updated_count += 1
            
        except Exception as e:
            logger.error(f"Failed to update delivery date for order {order.order_number}: {str(e)}")
    
    logger.info(f"Updated estimated delivery dates for {updated_count} orders")
    return updated_count


@shared_task
def monitor_overdue_orders():
    """Monitor and alert for overdue orders"""
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    # Orders that are overdue for delivery
    overdue_cutoff = timezone.now() - timedelta(days=5)
    
    overdue_orders = Order.objects.filter(
        status__in=['confirmed', 'processing', 'out_for_delivery'],
        created_at__lte=overdue_cutoff
    )
    
    if not overdue_orders.exists():
        return 0
    
    # Send alert to admins
    admin_emails = list(
        User.objects.filter(is_admin=True, is_active=True)
        .values_list('email', flat=True)
    )
    
    if admin_emails:
        try:
            subject = f"Overdue Orders Alert - {overdue_orders.count()} orders"
            
            context = {
                'overdue_orders': overdue_orders,
                'count': overdue_orders.count(),
                'admin_url': f"{settings.FRONTEND_URL}/admin/orders/"
            }
            
            html_message = render_to_string('emails/overdue_orders_alert.html', context)
            plain_message = render_to_string('emails/overdue_orders_alert.txt', context)
            
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=admin_emails,
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"Overdue orders alert sent for {overdue_orders.count()} orders")
            
        except Exception as e:
            logger.error(f"Failed to send overdue orders alert: {str(e)}")
    
    return overdue_orders.count()


# Periodic task registration (add to celery beat schedule)
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    'auto-confirm-cod-orders': {
        'task': 'apps.orders.tasks.auto_confirm_cod_orders',
        'schedule': crontab(hour=10, minute=0),  # Daily at 10 AM
    },
    'send-delivery-reminders': {
        'task': 'apps.orders.tasks.send_delivery_reminder',
        'schedule': crontab(hour=9, minute=0),  # Daily at 9 AM
    },
    'cleanup-cancelled-orders': {
        'task': 'apps.orders.tasks.cleanup_cancelled_orders',
        'schedule': crontab(hour=2, minute=0, day_of_week=1),  # Weekly on Monday at 2 AM
    },
    'generate-daily-order-report': {
        'task': 'apps.orders.tasks.generate_daily_order_report',
        'schedule': crontab(hour=8, minute=0),  # Daily at 8 AM
    },
    'update-estimated-delivery-dates': {
        'task': 'apps.orders.tasks.update_estimated_delivery_dates',
        'schedule': crontab(minute='*/30'),  # Every 30 minutes
    },
    'monitor-overdue-orders': {
        'task': 'apps.orders.tasks.monitor_overdue_orders',
        'schedule': crontab(hour=14, minute=0),  # Daily at 2 PM
    },
}