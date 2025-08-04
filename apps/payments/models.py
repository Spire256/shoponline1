#from django.db import models

# Create your models here.
# apps/payments/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from decimal import Decimal
import uuid

User = get_user_model()

class PaymentMethod(models.TextChoices):
    MTN_MOMO = 'mtn_momo', 'MTN Mobile Money'
    AIRTEL_MONEY = 'airtel_money', 'Airtel Money'
    CASH_ON_DELIVERY = 'cod', 'Cash on Delivery'

class PaymentStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    PROCESSING = 'processing', 'Processing'
    COMPLETED = 'completed', 'Completed'
    FAILED = 'failed', 'Failed'
    CANCELLED = 'cancelled', 'Cancelled'
    REFUNDED = 'refunded', 'Refunded'

class TransactionType(models.TextChoices):
    PAYMENT = 'payment', 'Payment'
    REFUND = 'refund', 'Refund'
    PARTIAL_REFUND = 'partial_refund', 'Partial Refund'

class Payment(models.Model):
    """Main payment model for all payment types"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='payments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    
    # Payment details
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    currency = models.CharField(max_length=3, default='UGX')
    status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    
    # Transaction details
    transaction_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    external_transaction_id = models.CharField(max_length=100, null=True, blank=True)
    reference_number = models.CharField(max_length=50, unique=True)
    
    # Payment provider details
    provider_response = models.JSONField(default=dict, blank=True)
    provider_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    failure_reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['reference_number']),
            models.Index(fields=['transaction_id']),
            models.Index(fields=['external_transaction_id']),
            models.Index(fields=['status', 'payment_method']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Payment {self.reference_number} - {self.get_payment_method_display()}"
    
    def save(self, *args, **kwargs):
        if not self.reference_number:
            self.reference_number = self.generate_reference_number()
        super().save(*args, **kwargs)
    
    def generate_reference_number(self):
        """Generate unique reference number"""
        import random
        import string
        timestamp = str(int(self.created_at.timestamp() if self.created_at else timezone.now().timestamp()))
        random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        return f"PAY{timestamp[-6:]}{random_str}"

class MobileMoneyPayment(models.Model):
    """Specific details for Mobile Money payments (MTN & Airtel)"""
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name='mobile_money_details')
    
    # Customer details
    phone_number = models.CharField(max_length=15)
    customer_name = models.CharField(max_length=100, blank=True)
    
    # Provider specific fields
    provider_request_id = models.CharField(max_length=100, blank=True)
    provider_transaction_id = models.CharField(max_length=100, blank=True)
    provider_status = models.CharField(max_length=50, blank=True)
    
    # Payment request details
    request_payload = models.JSONField(default=dict, blank=True)
    response_payload = models.JSONField(default=dict, blank=True)
    
    # Callback details
    callback_received = models.BooleanField(default=False)
    callback_payload = models.JSONField(default=dict, blank=True)
    callback_at = models.DateTimeField(null=True, blank=True)
    
    # Retry mechanism
    retry_count = models.IntegerField(default=0)
    max_retries = models.IntegerField(default=3)
    next_retry_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'mobile_money_payments'
        indexes = [
            models.Index(fields=['phone_number']),
            models.Index(fields=['provider_request_id']),
            models.Index(fields=['provider_transaction_id']),
        ]
    
    def __str__(self):
        return f"MoMo Payment {self.payment.reference_number} - {self.phone_number}"

class CashOnDeliveryPayment(models.Model):
    """Specific details for Cash on Delivery payments"""
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name='cod_details')
    
    # Delivery details
    delivery_address = models.TextField()
    delivery_phone = models.CharField(max_length=15)
    delivery_notes = models.TextField(blank=True)
    
    # COD specific fields
    cash_received = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    change_given = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    
    # Admin handling
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                   related_name='assigned_cod_payments')
    admin_notified = models.BooleanField(default=False)
    admin_notification_sent_at = models.DateTimeField(null=True, blank=True)
    
    # Collection details
    collected_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name='collected_cod_payments')
    collected_at = models.DateTimeField(null=True, blank=True)
    collection_notes = models.TextField(blank=True)
    
    # Status tracking
    delivery_attempted = models.BooleanField(default=False)
    delivery_attempts = models.IntegerField(default=0)
    last_attempt_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'cod_payments'
        indexes = [
            models.Index(fields=['delivery_phone']),
            models.Index(fields=['assigned_to']),
            models.Index(fields=['collected_by']),
            models.Index(fields=['admin_notified']),
        ]
    
    def __str__(self):
        return f"COD Payment {self.payment.reference_number} - {self.delivery_phone}"

class Transaction(models.Model):
    """Transaction log for all payment activities"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='transactions')
    
    # Transaction details
    transaction_type = models.CharField(max_length=20, choices=TransactionType.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='UGX')
    
    # Status and references
    status = models.CharField(max_length=20, choices=PaymentStatus.choices)
    external_reference = models.CharField(max_length=100, blank=True)
    
    # Metadata
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    # Tracking
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    processed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'payment_transactions'
        ordering = ['-processed_at']
        indexes = [
            models.Index(fields=['payment', 'transaction_type']),
            models.Index(fields=['status']),
            models.Index(fields=['external_reference']),
        ]
    
    def __str__(self):
        return f"Transaction {self.id} - {self.get_transaction_type_display()}"

class PaymentWebhook(models.Model):
    """Log all webhook calls from payment providers"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Webhook details
    provider = models.CharField(max_length=20, choices=[
        ('mtn', 'MTN Mobile Money'),
        ('airtel', 'Airtel Money'),
    ])
    event_type = models.CharField(max_length=50)
    
    # Request details
    headers = models.JSONField(default=dict, blank=True)
    payload = models.JSONField(default=dict, blank=True)
    raw_body = models.TextField(blank=True)
    
    # Processing
    payment = models.ForeignKey(Payment, on_delete=models.SET_NULL, null=True, blank=True,
                               related_name='webhooks')
    processed = models.BooleanField(default=False)
    processing_error = models.TextField(blank=True)
    
    # Verification
    signature_valid = models.BooleanField(default=False)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'payment_webhooks'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['provider', 'event_type']),
            models.Index(fields=['processed']),
            models.Index(fields=['payment']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Webhook {self.provider} - {self.event_type}"

class PaymentMethodConfig(models.Model):
    """Configuration for payment methods"""
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, unique=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    is_test_mode = models.BooleanField(default=False)
    
    # Configuration
    config = models.JSONField(default=dict, blank=True)
    
    # Fee configuration
    fixed_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    percentage_fee = models.DecimalField(max_digits=5, decimal_places=4, default=Decimal('0.0000'))
    
    # Limits
    min_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('100.00'))
    max_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('5000000.00'))
    
    # Display
    display_name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.ImageField(upload_to='payment_icons/', blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payment_method_configs'
        verbose_name = 'Payment Method Configuration'
        verbose_name_plural = 'Payment Method Configurations'
    
    def __str__(self):
        return f"{self.display_name} - {'Active' if self.is_active else 'Inactive'}"
