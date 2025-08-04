from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from apps.orders.models import Order
from .models import NotificationSettings
from .tasks import send_admin_cod_alert
from .utils import create_notification, notify_admins

User = get_user_model()

# User-related signal handlers
@receiver(post_save, sender=User)
def create_notification_settings(sender, instance, created, **kwargs):
    """
    Create notification settings when a new user is created.
    """
    if created:
        NotificationSettings.objects.create(user=instance)

# Order-related signal handlers
@receiver(post_save, sender=Order)
def handle_order_created(sender, instance, created, **kwargs):
    """
    Handle order creation notifications.
    """
    if created:
        # Notify customer
        create_notification(
            recipient=instance.user if instance.user else None,
            title=f'Order #{instance.order_number} Created',
            message=f'Your order has been created successfully. Total: UGX {instance.total_amount:,.0f}',
            notification_type='order_created',
            priority='medium',
            method='email',
            data={
                'order_id': instance.id,
                'order_number': instance.order_number,
                'total_amount': str(instance.total_amount)
            },
            related_object=instance
        )
        
        # If COD order, send urgent alert to admins
        if instance.payment_method == 'cod':
            send_admin_cod_alert.delay(instance.id)
        
        # Notify admins about new order
        notify_admins(
            title=f'New Order #{instance.order_number}',
            message=f'New order placed. Payment: {instance.get_payment_method_display()}, Amount: UGX {instance.total_amount:,.0f}',
            notification_type='order_created',
            priority='high' if instance.payment_method == 'cod' else 'medium',
            data={
                'order_id': instance.id,
                'order_number': instance.order_number,
                'payment_method': instance.payment_method,
                'total_amount': str(instance.total_amount),
                'customer_name': instance.customer_name
            }
        )