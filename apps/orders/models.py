#from django.db import models

# Create your models here.
# apps/orders/models.py

from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from decimal import Decimal
import uuid
from django.utils import timezone
from apps.core.models import TimestampedModel

User = get_user_model()


class Order(TimestampedModel):
    """Order model for managing customer orders"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('processing', 'Processing'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('mtn_momo', 'MTN Mobile Money'),
        ('airtel_money', 'Airtel Money'),
        ('cash_on_delivery', 'Cash on Delivery'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]
    
    # Order identification
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_number = models.CharField(max_length=20, unique=True, blank=True)
    
    # Customer information
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders', null=True, blank=True)
    guest_email = models.EmailField(null=True, blank=True)  # For guest checkout
    
    # Customer details
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    
    # Delivery address
    address_line_1 = models.CharField(max_length=255)
    address_line_2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100)
    district = models.CharField(max_length=100)  # Uganda districts
    postal_code = models.CharField(max_length=20, blank=True)
    delivery_notes = models.TextField(blank=True)
    
    # Order financial details
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    delivery_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    
    # Order status and payment
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    
    # Payment reference (for mobile money)
    payment_reference = models.CharField(max_length=100, blank=True)
    transaction_id = models.CharField(max_length=100, blank=True)
    
    # Special fields for Uganda context
    is_cash_on_delivery = models.BooleanField(default=False)
    cod_verified = models.BooleanField(default=False)  # Admin verification for COD
    delivery_date = models.DateTimeField(null=True, blank=True)
    
    # Flash sale tracking
    has_flash_sale_items = models.BooleanField(default=False)
    flash_sale_savings = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Admin notes and tracking
    admin_notes = models.TextField(blank=True)
    tracking_number = models.CharField(max_length=50, blank=True)
    estimated_delivery = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    confirmed_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order_number']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['payment_status']),
            models.Index(fields=['is_cash_on_delivery']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Order {self.order_number} - {self.get_customer_name()}"
    
    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = self.generate_order_number()
        
        # Set COD flag based on payment method
        self.is_cash_on_delivery = self.payment_method == 'cash_on_delivery'
        
        # Calculate if order has flash sale items
        if self.pk:
            self.has_flash_sale_items = self.items.filter(is_flash_sale_item=True).exists()
            self.flash_sale_savings = sum(
                item.flash_sale_savings for item in self.items.filter(is_flash_sale_item=True)
            )
        
        super().save(*args, **kwargs)
    
    def generate_order_number(self):
        """Generate unique order number"""
        import random
        import string
        
        prefix = 'SHO'  # SHopOnline
        timestamp = timezone.now().strftime('%Y%m%d')
        random_suffix = ''.join(random.choices(string.digits, k=4))
        
        order_number = f"{prefix}{timestamp}{random_suffix}"
        
        # Ensure uniqueness
        while Order.objects.filter(order_number=order_number).exists():
            random_suffix = ''.join(random.choices(string.digits, k=4))
            order_number = f"{prefix}{timestamp}{random_suffix}"
        
        return order_number
    
    def get_customer_name(self):
        """Get full customer name"""
        return f"{self.first_name} {self.last_name}"
    
    def get_customer_display(self):
        """Get customer display name (with email)"""
        return f"{self.get_customer_name()} ({self.email})"
    
    def can_be_cancelled(self):
        """Check if order can be cancelled"""
        return self.status in ['pending', 'confirmed']
    
    def can_be_refunded(self):
        """Check if order can be refunded"""
        return self.status == 'delivered' and self.payment_status == 'completed'
    
    def is_completed(self):
        """Check if order is completed"""
        return self.status == 'delivered'
    
    def get_delivery_address(self):
        """Get formatted delivery address"""
        address_parts = [self.address_line_1]
        if self.address_line_2:
            address_parts.append(self.address_line_2)
        address_parts.extend([self.city, self.district])
        if self.postal_code:
            address_parts.append(self.postal_code)
        return ', '.join(address_parts)
    
    def mark_as_confirmed(self):
        """Mark order as confirmed"""
        self.status = 'confirmed'
        self.confirmed_at = timezone.now()
        self.save(update_fields=['status', 'confirmed_at'])
    
    def mark_as_delivered(self):
        """Mark order as delivered"""
        self.status = 'delivered'
        self.delivered_at = timezone.now()
        if self.is_cash_on_delivery:
            self.payment_status = 'completed'
        self.save(update_fields=['status', 'delivered_at', 'payment_status'])
    
    def cancel_order(self, reason=""):
        """Cancel the order"""
        self.status = 'cancelled'
        self.cancelled_at = timezone.now()
        if reason:
            self.admin_notes += f"\nCancellation reason: {reason}"
        self.save(update_fields=['status', 'cancelled_at', 'admin_notes'])


class OrderItem(TimestampedModel):
    """Individual items within an order"""
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    
    # Product information (stored to preserve order history)
    product_id = models.UUIDField()  # Reference to original product
    product_name = models.CharField(max_length=255)
    product_sku = models.CharField(max_length=100, blank=True)
    product_image = models.URLField(blank=True)
    
    # Pricing information at time of order
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    total_price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    
    # Flash sale information
    is_flash_sale_item = models.BooleanField(default=False)
    original_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    flash_sale_discount = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # Percentage
    flash_sale_savings = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Additional product details
    product_category = models.CharField(max_length=100, blank=True)
    product_brand = models.CharField(max_length=100, blank=True)
    
    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['order', 'created_at']),
            models.Index(fields=['product_id']),
            models.Index(fields=['is_flash_sale_item']),
        ]
    
    def __str__(self):
        return f"{self.product_name} x {self.quantity} - Order {self.order.order_number}"
    
    def save(self, *args, **kwargs):
        # Calculate total price
        self.total_price = self.unit_price * self.quantity
        
        # Calculate flash sale savings if applicable
        if self.is_flash_sale_item and self.original_price:
            savings_per_item = self.original_price - self.unit_price
            self.flash_sale_savings = savings_per_item * self.quantity
        
        super().save(*args, **kwargs)
    
    def get_savings_display(self):
        """Get formatted savings amount"""
        if self.flash_sale_savings > 0:
            return f"UGX {self.flash_sale_savings:,.0f}"
        return "UGX 0"
    
    def get_discount_percentage_display(self):
        """Get discount percentage for display"""
        if self.flash_sale_discount > 0:
            return f"{self.flash_sale_discount}%"
        return "0%"


class OrderStatusHistory(TimestampedModel):
    """Track order status changes"""
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    previous_status = models.CharField(max_length=20, choices=Order.STATUS_CHOICES)
    new_status = models.CharField(max_length=20, choices=Order.STATUS_CHOICES)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Order status histories"
    
    def __str__(self):
        return f"Order {self.order.order_number}: {self.previous_status} → {self.new_status}"


class OrderNote(TimestampedModel):
    """Additional notes for orders (admin and system notes)"""
    
    NOTE_TYPES = [
        ('admin', 'Admin Note'),
        ('system', 'System Note'),
        ('customer', 'Customer Note'),
        ('delivery', 'Delivery Note'),
    ]
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='notes')
    note_type = models.CharField(max_length=20, choices=NOTE_TYPES, default='admin')
    note = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    is_internal = models.BooleanField(default=True)  # Whether note is visible to customer
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Note for Order {self.order.order_number} - {self.note_type}"


class CODVerification(TimestampedModel):
    """Special model for Cash on Delivery verification"""
    
    VERIFICATION_STATUS = [
        ('pending', 'Pending Verification'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
        ('delivered_paid', 'Delivered & Paid'),
    ]
    
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='cod_verification')
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_STATUS, default='pending')
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    verification_notes = models.TextField(blank=True)
    customer_phone_verified = models.BooleanField(default=False)
    delivery_confirmed = models.BooleanField(default=False)
    payment_received = models.BooleanField(default=False)
    verification_date = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"COD Verification for Order {self.order.order_number}"
    
    def mark_as_verified(self, user, notes=""):
        """Mark COD order as verified"""
        self.verification_status = 'verified'
        self.verified_by = user
        self.verification_date = timezone.now()
        if notes:
            self.verification_notes = notes
        self.save()
        
        # Update order status
        self.order.cod_verified = True
        self.order.save(update_fields=['cod_verified'])
    
    def mark_as_delivered_and_paid(self):
        """Mark COD as delivered and payment received"""
        self.verification_status = 'delivered_paid'
        self.delivery_confirmed = True
        self.payment_received = True
        self.save()
        
        # Update order
        self.order.mark_as_delivered()
