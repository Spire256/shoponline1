#from django.db import models

# Create your models here.
# apps/flash_sales/models.py
from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.core.models import BaseModel
from apps.products.models import Product
import uuid


class FlashSale(BaseModel):
    """
    Flash Sale model for creating time-limited promotional sales
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, help_text="Flash sale name")
    description = models.TextField(blank=True, help_text="Flash sale description")
    discount_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Discount percentage (0-100)"
    )
    start_time = models.DateTimeField(help_text="Flash sale start time")
    end_time = models.DateTimeField(help_text="Flash sale end time")
    is_active = models.BooleanField(default=True, help_text="Whether the flash sale is active")
    max_discount_amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Maximum discount amount in UGX"
    )
    banner_image = models.ImageField(
        upload_to='flash_sales/banners/', 
        null=True, 
        blank=True,
        help_text="Flash sale banner image"
    )
    priority = models.IntegerField(
        default=0, 
        help_text="Display priority (higher numbers shown first)"
    )
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='created_flash_sales',
        help_text="Admin who created this flash sale"
    )

    class Meta:
        db_table = 'flash_sales'
        verbose_name = 'Flash Sale'
        verbose_name_plural = 'Flash Sales'
        ordering = ['-priority', '-start_time']
        indexes = [
            models.Index(fields=['is_active', 'start_time', 'end_time']),
            models.Index(fields=['priority']),
        ]

    def __str__(self):
        return f"{self.name} ({self.discount_percentage}% off)"

    @property
    def is_running(self):
        """Check if flash sale is currently running"""
        now = timezone.now()
        return (
            self.is_active and 
            self.start_time <= now <= self.end_time
        )

    @property
    def is_upcoming(self):
        """Check if flash sale is upcoming"""
        now = timezone.now()
        return self.is_active and self.start_time > now

    @property
    def is_expired(self):
        """Check if flash sale has expired"""
        now = timezone.now()
        return self.end_time < now

    @property
    def time_remaining(self):
        """Get time remaining in seconds"""
        if self.is_expired:
            return 0
        now = timezone.now()
        if self.is_upcoming:
            return int((self.start_time - now).total_seconds())
        elif self.is_running:
            return int((self.end_time - now).total_seconds())
        return 0

    @property
    def products_count(self):
        """Get count of products in this flash sale"""
        return self.flash_sale_products.filter(is_active=True).count()

    def clean(self):
        """Validate flash sale data"""
        from django.core.exceptions import ValidationError
        
        if self.start_time and self.end_time:
            if self.start_time >= self.end_time:
                raise ValidationError("End time must be after start time")
            
            if self.end_time <= timezone.now():
                raise ValidationError("End time must be in the future")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class FlashSaleProduct(BaseModel):
    """
    Products included in flash sales with their specific flash sale prices
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    flash_sale = models.ForeignKey(
        FlashSale,
        on_delete=models.CASCADE,
        related_name='flash_sale_products'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='flash_sales'
    )
    custom_discount_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Custom discount for this product (overrides flash sale discount)"
    )
    flash_sale_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Calculated flash sale price in UGX"
    )
    original_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Original product price when added to flash sale"
    )
    stock_limit = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Limited stock for flash sale (optional)"
    )
    sold_quantity = models.PositiveIntegerField(
        default=0,
        help_text="Quantity sold during flash sale"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this product is active in the flash sale"
    )
    added_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='added_flash_sale_products'
    )

    class Meta:
        db_table = 'flash_sale_products'
        verbose_name = 'Flash Sale Product'
        verbose_name_plural = 'Flash Sale Products'
        unique_together = ['flash_sale', 'product']
        indexes = [
            models.Index(fields=['flash_sale', 'is_active']),
            models.Index(fields=['product', 'is_active']),
        ]

    def __str__(self):
        return f"{self.product.name} in {self.flash_sale.name}"

    @property
    def discount_percentage(self):
        """Get the effective discount percentage"""
        return self.custom_discount_percentage or self.flash_sale.discount_percentage

    @property
    def savings_amount(self):
        """Calculate savings amount"""
        return self.original_price - self.flash_sale_price

    @property
    def is_sold_out(self):
        """Check if flash sale stock is sold out"""
        if self.stock_limit is None:
            return False
        return self.sold_quantity >= self.stock_limit

    def calculate_flash_sale_price(self):
        """Calculate and return the flash sale price"""
        discount_percent = self.discount_percentage
        discount_amount = (self.original_price * discount_percent) / 100
        
        # Apply max discount limit if set
        if self.flash_sale.max_discount_amount:
            discount_amount = min(discount_amount, self.flash_sale.max_discount_amount)
        
        flash_price = self.original_price - discount_amount
        return max(flash_price, 0)  # Ensure price doesn't go negative

    def clean(self):
        """Validate flash sale product data"""
        from django.core.exceptions import ValidationError
        
        if self.product and self.original_price != self.product.price:
            # Update original price to current product price
            self.original_price = self.product.price
        
        # Calculate flash sale price
        self.flash_sale_price = self.calculate_flash_sale_price()
        
        if self.stock_limit and self.stock_limit <= 0:
            raise ValidationError("Stock limit must be positive")

    def save(self, *args, **kwargs):
        if not self.original_price:
            self.original_price = self.product.price
        
        self.flash_sale_price = self.calculate_flash_sale_price()
        self.full_clean()
        super().save(*args, **kwargs)


