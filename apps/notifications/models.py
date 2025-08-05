#from django.db import models

# Create your models here.

# apps/notifications/models.py
from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.core.models import TimestampedModel

User = get_user_model()

class NotificationType(models.TextChoices):
    ORDER_CREATED = 'order_created', 'Order Created'
    ORDER_UPDATED = 'order_updated', 'Order Updated'
    COD_ORDER = 'cod_order', 'Cash on Delivery Order'
    PAYMENT_RECEIVED = 'payment_received', 'Payment Received'
    ADMIN_INVITATION = 'admin_invitation', 'Admin Invitation'
    FLASH_SALE_STARTED = 'flash_sale_started', 'Flash Sale Started'
    FLASH_SALE_ENDING = 'flash_sale_ending', 'Flash Sale Ending Soon'
    LOW_STOCK = 'low_stock', 'Low Stock Alert'
    SYSTEM_ALERT = 'system_alert', 'System Alert'

class NotificationPriority(models.TextChoices):
    LOW = 'low', 'Low'
    MEDIUM = 'medium', 'Medium'
    HIGH = 'high', 'High'
    CRITICAL = 'critical', 'Critical'

class NotificationMethod(models.TextChoices):
    IN_APP = 'in_app', 'In-App'
    EMAIL = 'email', 'Email'
    SMS = 'sms', 'SMS'
    WEBSOCKET = 'websocket', 'WebSocket'

class Notification(TimestampedModel):
    recipient = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='notifications'
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=50, 
        choices=NotificationType.choices,
        default=NotificationType.SYSTEM_ALERT
    )
    priority = models.CharField(
        max_length=20, 
        choices=NotificationPriority.choices,
        default=NotificationPriority.MEDIUM
    )
    method = models.CharField(
        max_length=20, 
        choices=NotificationMethod.choices,
        default=NotificationMethod.IN_APP
    )
    
    # Metadata
    data = models.JSONField(default=dict, blank=True)
    
    # Status tracking
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    # Related objects
    content_type = models.ForeignKey(
        'contenttypes.ContentType', 
        on_delete=models.CASCADE,
        null=True, 
        blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    #content_object = models.GenericForeignKey('content_type', 'object_id')
    content_object = GenericForeignKey('content_type', 'object_id')


    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['notification_type', '-created_at']),
            models.Index(fields=['is_read', '-created_at']),
            models.Index(fields=['priority', '-created_at']),
        ]

    def __str__(self):
        return f"{self.title} - {self.recipient.email}"

    def mark_as_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])

    def mark_as_sent(self):
        if not self.is_sent:
            self.is_sent = True
            self.sent_at = timezone.now()
            self.save(update_fields=['is_sent', 'sent_at'])

class NotificationTemplate(TimestampedModel):
    name = models.CharField(max_length=100, unique=True)
    notification_type = models.CharField(
        max_length=50, 
        choices=NotificationType.choices
    )
    method = models.CharField(
        max_length=20, 
        choices=NotificationMethod.choices
    )
    
    # Template content
    subject_template = models.CharField(max_length=200)
    body_template = models.TextField()
    html_template = models.TextField(blank=True)
    
    # Settings
    is_active = models.BooleanField(default=True)
    priority = models.CharField(
        max_length=20, 
        choices=NotificationPriority.choices,
        default=NotificationPriority.MEDIUM
    )
    
    class Meta:
        unique_together = ['notification_type', 'method']

    def __str__(self):
        return f"{self.name} ({self.get_method_display()})"

class NotificationSettings(TimestampedModel):
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='notification_settings'
    )
    
    # In-app notifications
    in_app_enabled = models.BooleanField(default=True)
    
    # Email notifications
    email_enabled = models.BooleanField(default=True)
    order_updates_email = models.BooleanField(default=True)
    admin_alerts_email = models.BooleanField(default=True)
    flash_sales_email = models.BooleanField(default=False)
    
    # SMS notifications
    sms_enabled = models.BooleanField(default=False)
    sms_phone_number = models.CharField(max_length=20, blank=True)
    
    # WebSocket notifications (for admins)
    websocket_enabled = models.BooleanField(default=True)
    
    def __str__(self):
        return f"Notification Settings - {self.user.email}"

