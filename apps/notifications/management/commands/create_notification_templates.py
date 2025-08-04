# apps/notifications/management/commands/create_notification_templates.py
from django.core.management.base import BaseCommand
from apps.notifications.models import NotificationTemplate, NotificationType, NotificationMethod

class Command(BaseCommand):
    help = 'Create default notification templates'

    def handle(self, *args, **options):
        templates = [
            {
                'name': 'Order Created Email',
                'notification_type': NotificationType.ORDER_CREATED,
                'method': NotificationMethod.EMAIL,
                'subject_template': 'Order #{order_number} Created - ShopOnline Uganda',
                'body_template': 'Your order #{order_number} has been created successfully. Total: UGX {total_amount}',
                'html_template': '<h2>Order Confirmation</h2><p>Your order #{order_number} has been created.</p>',
                'priority': 'medium'
            },
            {
                'name': 'COD Order Alert',
                'notification_type': NotificationType.COD_ORDER,
                'method': NotificationMethod.EMAIL,
                'subject_template': 'URGENT: New COD Order #{order_number}',
                'body_template': 'New Cash on Delivery order requires attention. Customer: {customer_name}, Amount: UGX {total_amount}',
                'html_template': '<h2>🚨 New COD Order</h2><p>Customer: {customer_name}</p><p>Amount: UGX {total_amount}</p>',
                'priority': 'high'
            },
            {
                'name': 'Payment Received',
                'notification_type': NotificationType.PAYMENT_RECEIVED,
                'method': NotificationMethod.EMAIL,
                'subject_template': 'Payment Received - Order #{order_number}',
                'body_template': 'Payment of UGX {amount} has been received for order #{order_number}',
                'html_template': '<h2>Payment Confirmed</h2><p>Amount: UGX {amount}</p>',
                'priority': 'medium'
            },
            {
                'name': 'Flash Sale Started',
                'notification_type': NotificationType.FLASH_SALE_STARTED,
                'method': NotificationMethod.EMAIL,
                'subject_template': '🔥 Flash Sale Started: {sale_name}',
                'body_template': 'Flash sale "{sale_name}" has started with {discount}% off selected items!',
                'html_template': '<h2>🔥 Flash Sale Alert!</h2><p>{sale_name} - {discount}% OFF</p>',
                'priority': 'low'
            },
            {
                'name': 'Low Stock Alert',
                'notification_type': NotificationType.LOW_STOCK,
                'method': NotificationMethod.EMAIL,
                'subject_template': 'Low Stock Alert: {product_name}',
                'body_template': 'Product "{product_name}" is running low on stock. Current quantity: {quantity}',
                'html_template': '<h2>⚠️ Low Stock Alert</h2><p>{product_name}: {quantity} remaining</p>',
                'priority': 'medium'
            }
        ]

        created_count = 0
        for template_data in templates:
            template, created = NotificationTemplate.objects.get_or_create(
                name=template_data['name'],
                defaults=template_data
            )
            if created:
                created_count += 1
                self.stdout.write(f'Created template: {template.name}')

        self.stdout.write(
            self.style.SUCCESS(f'Created {created_count} notification templates')
        )
