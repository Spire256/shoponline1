
# apps/notifications/tasks.py
from celery import shared_task
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.contrib.auth import get_user_model
from .models import Notification, NotificationTemplate, NotificationSettings
from .services.email_service import EmailNotificationService
from .services.sms_service import SMSNotificationService
from .services.websocket_service import WebSocketNotificationService

User = get_user_model()

@shared_task
def send_notification_task(notification_id):
    """
    Celery task to send notifications asynchronously
    """
    try:
        notification = Notification.objects.get(id=notification_id)
        
        # Get user's notification settings
        settings_obj, _ = NotificationSettings.objects.get_or_create(
            user=notification.recipient
        )
        
        # Send based on method and user preferences
        if notification.method == 'email' and settings_obj.email_enabled:
            EmailNotificationService.send_email_notification(notification)
        
        elif notification.method == 'sms' and settings_obj.sms_enabled:
            SMSNotificationService.send_sms_notification(notification)
        
        elif notification.method == 'websocket' and settings_obj.websocket_enabled:
            WebSocketNotificationService.send_websocket_notification(notification)
        
        # Mark as sent
        notification.mark_as_sent()
        
    except Notification.DoesNotExist:
        pass

@shared_task
def send_bulk_notifications(user_ids, title, message, notification_type, priority='medium'):
    """
    Send notifications to multiple users
    """
    users = User.objects.filter(id__in=user_ids)
    
    for user in users:
        notification = Notification.objects.create(
            recipient=user,
            title=title,
            message=message,
            notification_type=notification_type,
            priority=priority,
            method='in_app'
        )
        
        # Queue for async sending
        send_notification_task.delay(notification.id)

@shared_task
def send_admin_cod_alert(order_id):
    """
    Send immediate alert to all admins about COD orders
    """
    from apps.orders.models import Order
    
    try:
        order = Order.objects.get(id=order_id)
        admins = User.objects.filter(is_staff=True)
        
        for admin in admins:
            notification = Notification.objects.create(
                recipient=admin,
                title=f"New COD Order #{order.order_number}",
                message=f"Cash on Delivery order for UGX {order.total_amount:,.0f} requires attention. Customer: {order.customer_name}",
                notification_type='cod_order',
                priority='high',
                method='websocket',
                data={
                    'order_id': order.id,
                    'order_number': order.order_number,
                    'total_amount': str(order.total_amount),
                    'customer_name': order.customer_name,
                    'customer_phone': order.customer_phone
                }
            )
            
            # Send immediately via WebSocket
            WebSocketNotificationService.send_websocket_notification(notification)
            notification.mark_as_sent()
    
    except Order.DoesNotExist:
        pass

@shared_task
def cleanup_old_notifications():
    """
    Clean up old read notifications (older than 30 days)
    """
    from django.utils import timezone
    from datetime import timedelta
    
    cutoff_date = timezone.now() - timedelta(days=30)
    old_notifications = Notification.objects.filter(
        is_read=True,
        read_at__lt=cutoff_date
    )
    
    count = old_notifications.count()
    old_notifications.delete()
    
    return f"Cleaned up {count} old notifications"
