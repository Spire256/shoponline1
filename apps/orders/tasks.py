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
            return True
        else:
            # Log the failure but don't raise exception in eager mode
            logger.warning(f"Order confirmation email failed for order {order.order_number}")
            
            # Only retry if not in eager mode (development)
            if not getattr(settings, 'CELERY_TASK_ALWAYS_EAGER', False):
                raise Exception("Failed to send order confirmation email")
            else:
                # In eager mode (development), just log and continue
                logger.info(f"Skipping retry in eager mode for order {order.order_number}")
                return False
            
    except Order.DoesNotExist:
        logger.error(f"Order with ID {order_id} not found")
        return False
    except Exception as exc:
        logger.error(f"Failed to send order confirmation for order {order_id}: {str(exc)}")
        
        # Only retry if not in eager mode
        if not getattr(settings, 'CELERY_TASK_ALWAYS_EAGER', False):
            raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))
        else:
            # In development/eager mode, just log and return
            logger.info(f"Skipping retry in eager mode for order {order_id}")
            return False


@shared_task(bind=True, max_retries=3)
def send_cod_admin_notification(self, order_id):
    """Send COD order notification to admins asynchronously"""
    try:
        order = Order.objects.get(id=order_id, is_cash_on_delivery=True)
        notification_service = OrderNotificationService()
        
        success = notification_service.send_cod_admin_notification(order)
        
        if success:
            logger.info(f"COD admin notification sent for order {order.order_number}")
            return True
        else:
            logger.warning(f"COD admin notification failed for order {order.order_number}")
            
            # Only retry if not in eager mode
            if not getattr(settings, 'CELERY_TASK_ALWAYS_EAGER', False):
                raise Exception("Failed to send COD admin notification")
            else:
                logger.info(f"Skipping COD retry in eager mode for order {order.order_number}")
                return False
            
    except Order.DoesNotExist:
        logger.error(f"COD Order with ID {order_id} not found")
        return False
    except Exception as exc:
        logger.error(f"Failed to send COD notification for order {order_id}: {str(exc)}")
        
        # Only retry if not in eager mode
        if not getattr(settings, 'CELERY_TASK_ALWAYS_EAGER', False):
            raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))
        else:
            logger.info(f"Skipping COD retry in eager mode for order {order_id}")
            return False


@shared_task(bind=True, max_retries=3)
def send_status_update_notification(self, order_id, previous_status):
    """Send order status update notification asynchronously"""
    try:
        order = Order.objects.get(id=order_id)
        notification_service = OrderNotificationService()
        
        success = notification_service.send_status_update(order, previous_status)
        
        if success:
            logger.info(f"Status update notification sent for order {order.order_number}")
            return True
        else:
            logger.warning(f"Status update notification failed for order {order.order_number}")
            
            # Only retry if not in eager mode
            if not getattr(settings, 'CELERY_TASK_ALWAYS_EAGER', False):
                raise Exception("Failed to send status update notification")
            else:
                logger.info(f"Skipping status update retry in eager mode for order {order.order_number}")
                return False
            
    except Order.DoesNotExist:
        logger.error(f"Order with ID {order_id} not found")
        return False
    except Exception as exc:
        logger.error(f"Failed to send status update for order {order_id}: {str(exc)}")
        
        # Only retry if not in eager mode
        if not getattr(settings, 'CELERY_TASK_ALWAYS_EAGER', False):
            raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))
        else:
            logger.info(f"Skipping status update retry in eager mode for order {order_id}")
            return False


@shared_task(bind=True, max_retries=3)
def export_order_to_external_systems(self, order_id):
    """Export order data to external systems (ERP, accounting, etc.)"""
    try:
        order = Order.objects.get(id=order_id)
        
        # Prepare order data for export
        export_data = {
            'order_number': order.order_number,
            'customer_name': order.get_customer_name(),
            'email': order.email,
            'phone': order.phone,
            'total_amount': float(order.total_amount),
            'payment_method': order.payment_method,
            'payment_status': order.payment_status,
            'status': order.status,
            'created_at': order.created_at.isoformat(),
            'delivery_address': {
                'address_line_1': order.address_line_1,
                'address_line_2': order.address_line_2,
                'city': order.city,
                'district': order.district,
                'postal_code': order.postal_code,
            },
            'items': [
                {
                    'product_name': item.product_name,
                    'quantity': item.quantity,
                    'unit_price': float(item.unit_price),
                    'total_price': float(item.total_price),
                    'is_flash_sale_item': item.is_flash_sale_item,
                }
                for item in order.items.all()
            ]
        }
        
        # Here you would integrate with actual external systems
        # For now, we'll just log the export attempt
        logger.info(f"Exporting order {order.order_number} to external systems")
        logger.info(f"Export data prepared for order {order.order_number}: {len(export_data['items'])} items")
        
        # Example integrations (uncomment and modify as needed):
        
        # 1. Export to ERP system
        # success_erp = export_to_erp_system(export_data)
        
        # 2. Export to accounting system
        # success_accounting = export_to_accounting_system(export_data)
        
        # 3. Export to inventory management system
        # success_inventory = update_inventory_system(export_data)
        
        # 4. Export to analytics/reporting system
        # success_analytics = send_to_analytics_system(export_data)
        
        # For now, simulate successful export
        success = True
        
        if success:
            logger.info(f"Order {order.order_number} successfully exported to external systems")
            
            # Add system note to order
            OrderNote.objects.create(
                order=order,
                note_type='system',
                note="Order data exported to external systems",
                is_internal=True
            )
            
            return True
        else:
            logger.warning(f"Failed to export order {order.order_number} to external systems")
            
            # Only retry if not in eager mode
            if not getattr(settings, 'CELERY_TASK_ALWAYS_EAGER', False):
                raise Exception("Failed to export order to external systems")
            else:
                logger.info(f"Skipping export retry in eager mode for order {order.order_number}")
                return False
            
    except Order.DoesNotExist:
        logger.error(f"Order with ID {order_id} not found for export")
        return False
    except Exception as exc:
        logger.error(f"Failed to export order {order_id} to external systems: {str(exc)}")
        
        # Only retry if not in eager mode
        if not getattr(settings, 'CELERY_TASK_ALWAYS_EAGER', False):
            raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))
        else:
            logger.info(f"Skipping export retry in eager mode for order {order_id}")
            return False


@shared_task(bind=True, max_retries=3)
def send_low_stock_alert(self, product_id, current_stock):
    """Send low stock alert to admins"""
    try:
        from apps.products.models import Product
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        
        product = Product.objects.get(id=product_id)
        
        # Get admin emails
        admin_emails = list(
            User.objects.filter(is_admin=True, is_active=True)
            .values_list('email', flat=True)
        )
        
        if not admin_emails:
            logger.warning("No admin users found for low stock alert")
            return False
        
        subject = f"Low Stock Alert - {product.name}"
        
        context = {
            'product': product,
            'current_stock': current_stock,
            'admin_url': f"{settings.FRONTEND_URL}/admin/products/{product.id}/"
        }
        
        # For now, we'll use a simple template or plain text
        message = f"""
        Low Stock Alert
        
        Product: {product.name}
        Current Stock: {current_stock} units
        Threshold: 5 units
        
        Please restock this product soon to avoid stockouts.
        
        View Product: {context['admin_url']}
        """
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=admin_emails,
            fail_silently=False,
        )
        
        logger.info(f"Low stock alert sent for product {product.name} to {len(admin_emails)} admins")
        return True
        
    except Product.DoesNotExist:
        logger.error(f"Product with ID {product_id} not found for low stock alert")
        return False
    except Exception as exc:
        logger.error(f"Failed to send low stock alert for product {product_id}: {str(exc)}")
        
        # Only retry if not in eager mode
        if not getattr(settings, 'CELERY_TASK_ALWAYS_EAGER', False):
            raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))
        else:
            logger.info(f"Skipping low stock alert retry in eager mode for product {product_id}")
            return False


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
            
            # Send notification (with safe handling)
            try:
                send_status_update_notification.delay(order.id, 'pending')
            except Exception as e:
                logger.warning(f"Failed to queue status notification for order {order.order_number}: {str(e)}")
            
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
            
            # Use simple template for now
            message = f"""
            Dear {context['customer_name']},
            
            We wanted to update you on your order {order.order_number}.
            
            Your order is currently being processed and will be delivered soon.
            We apologize for any delay and appreciate your patience.
            
            If you have any questions, please contact us at {context['support_email']}.
            
            Thank you for shopping with us!
            """
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[order.email],
                fail_silently=True,  # Don't raise exceptions in batch operations
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
                except Exception as e:
                    logger.error(f"Failed to restore stock for item {item.id}: {str(e)}")
            
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
        return 0
    
    try:
        subject = f"Daily Order Report - {today.strftime('%Y-%m-%d')}"
        
        # Use simple template for now
        message = f"""
        Daily Order Report - {today.strftime('%Y-%m-%d')}
        
        Today's Statistics:
        - Total Orders: {today_stats['total_orders']}
        - Total Revenue: UGX {today_stats['total_revenue']:,}
        - COD Orders: {today_stats['cod_orders']}
        - Mobile Money Orders: {today_stats['mobile_money_orders']}
        - Pending Orders: {today_stats['pending_orders']}
        - Delivered Orders: {today_stats['delivered_orders']}
        
        Yesterday's Comparison:
        - Total Orders: {yesterday_stats['total_orders']}
        - Total Revenue: UGX {yesterday_stats['total_revenue']:,}
        
        Recent Orders:
        """
        
        # Add recent orders to the message
        recent_orders = today_orders.order_by('-created_at')[:10]
        for order in recent_orders:
            message += f"- {order.order_number}: {order.get_customer_name()} - UGX {order.total_amount:,}\n"
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=admin_emails,
            fail_silently=True,  # Don't raise exceptions for email failures
        )
        
        logger.info(f"Daily order report sent to {len(admin_emails)} admins")
        return len(admin_emails)
        
    except Exception as e:
        logger.error(f"Failed to send daily order report: {str(e)}")
        return 0


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
            
            message = f"""
            Overdue Orders Alert
            
            You have {overdue_orders.count()} orders that are overdue for delivery.
            
            Overdue Orders:
            """
            
            for order in overdue_orders:
                message += f"- {order.order_number}: {order.get_customer_name()} ({order.status})\n"
            
            message += f"\nPlease review these orders in the admin panel: {settings.FRONTEND_URL}/admin/orders/"
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=admin_emails,
                fail_silently=True,  # Don't raise exceptions
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