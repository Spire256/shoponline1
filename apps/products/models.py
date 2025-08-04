#from django.db import models

# Create your models here.
"""
Products App Models
Handles product and product image management for the e-commerce platform
"""

import uuid
import os
from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.text import slugify
from django.urls import reverse
from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile
import sys

from apps.core.models import TimeStampedModel
from apps.categories.models import Category


def product_image_upload_path(instance, filename):
    """Generate upload path for product images"""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('products', 'images', filename)


def product_thumbnail_upload_path(instance, filename):
    """Generate upload path for product thumbnails"""
    ext = filename.split('.')[-1]
    filename = f"thumb_{uuid.uuid4()}.{ext}"
    return os.path.join('products', 'thumbnails', filename)


class ProductManager(models.Manager):
    """Custom manager for Product model"""
    
    def active(self):
        """Return only active products"""
        return self.filter(is_active=True)
    
    def featured(self):
        """Return featured products"""
        return self.filter(is_featured=True, is_active=True)
    
    def in_stock(self):
        """Return products that are in stock"""
        return self.filter(stock_quantity__gt=0, is_active=True)
    
    def by_category(self, category):
        """Return products by category"""
        return self.filter(category=category, is_active=True)
    
    def search(self, query):
        """Search products by name or description"""
        return self.filter(
            models.Q(name__icontains=query) | 
            models.Q(description__icontains=query),
            is_active=True
        )
    
    def price_range(self, min_price=None, max_price=None):
        """Filter products by price range"""
        queryset = self.active()
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        return queryset


class Product(TimeStampedModel):
    """Product model for e-commerce platform"""
    
    CONDITION_CHOICES = [
        ('new', 'New'),
        ('used', 'Used'),
        ('refurbished', 'Refurbished'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]
    
    # Basic Information
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    description = models.TextField()
    short_description = models.CharField(max_length=500, blank=True)
    
    # Categorization
    category = models.ForeignKey(
        Category, 
        on_delete=models.CASCADE, 
        related_name='products'
    )
    tags = models.CharField(max_length=500, blank=True, help_text='Comma-separated tags')
    
    # Pricing
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    original_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text='Original price before any discounts'
    )
    cost_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text='Cost price for profit calculations'
    )
    
    # Inventory
    sku = models.CharField(max_length=100, unique=True, blank=True)
    stock_quantity = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=10)
    track_inventory = models.BooleanField(default=True)
    allow_backorders = models.BooleanField(default=False)
    
    # Product Details
    weight = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        blank=True, 
        null=True,
        help_text='Weight in kg'
    )
    dimensions = models.CharField(
        max_length=100, 
        blank=True,
        help_text='Dimensions in cm (L x W x H)'
    )
    color = models.CharField(max_length=50, blank=True)
    size = models.CharField(max_length=50, blank=True)
    material = models.CharField(max_length=100, blank=True)
    brand = models.CharField(max_length=100, blank=True)
    model = models.CharField(max_length=100, blank=True)
    condition = models.CharField(
        max_length=20, 
        choices=CONDITION_CHOICES, 
        default='new'
    )
    
    # SEO
    meta_title = models.CharField(max_length=150, blank=True)
    meta_description = models.CharField(max_length=300, blank=True)
    meta_keywords = models.CharField(max_length=255, blank=True)
    
    # Status and Visibility
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='draft'
    )
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    is_digital = models.BooleanField(default=False)
    requires_shipping = models.BooleanField(default=True)
    
    # Timestamps
    published_at = models.DateTimeField(blank=True, null=True)
    
    # Statistics (updated via signals)
    view_count = models.PositiveIntegerField(default=0)
    order_count = models.PositiveIntegerField(default=0)
    rating_average = models.DecimalField(
        max_digits=3, 
        decimal_places=2, 
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(5)]
    )
    review_count = models.PositiveIntegerField(default=0)
    
    objects = ProductManager()
    
    class Meta:
        db_table = 'products'
        verbose_name = 'Product'
        verbose_name_plural = 'Products'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['category']),
            models.Index(fields=['price']),
            models.Index(fields=['is_active']),
            models.Index(fields=['is_featured']),
            models.Index(fields=['stock_quantity']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        """Override save to generate slug and SKU"""
        if not self.slug:
            self.slug = slugify(self.name)
            # Ensure slug uniqueness
            original_slug = self.slug
            counter = 1
            while Product.objects.filter(slug=self.slug).exists():
                self.slug = f"{original_slug}-{counter}"
                counter += 1
        
        if not self.sku:
            self.sku = self.generate_sku()
        
        # Set meta fields if empty
        if not self.meta_title:
            self.meta_title = self.name[:150]
        
        if not self.meta_description:
            self.meta_description = self.short_description or self.description[:300]
        
        super().save(*args, **kwargs)
    
    def generate_sku(self):
        """Generate unique SKU for product"""
        import random
        import string
        
        # Get category code (first 3 letters of category name)
        category_code = self.category.name[:3].upper() if self.category else 'PRD'
        
        # Generate random alphanumeric code
        random_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        
        # Combine to create SKU
        sku = f"{category_code}-{random_code}"
        
        # Ensure uniqueness
        while Product.objects.filter(sku=sku).exists():
            random_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            sku = f"{category_code}-{random_code}"
        
        return sku
    
    def get_absolute_url(self):
        """Return product detail URL"""
        return reverse('products:detail', kwargs={'slug': self.slug})
    
    @property
    def is_in_stock(self):
        """Check if product is in stock"""
        if not self.track_inventory:
            return True
        return self.stock_quantity > 0
    
    @property
    def is_low_stock(self):
        """Check if product is low in stock"""
        if not self.track_inventory:
            return False
        return self.stock_quantity <= self.low_stock_threshold
    
    @property
    def is_on_sale(self):
        """Check if product is on sale"""
        return (
            self.original_price and 
            self.price < self.original_price
        )
    
    @property
    def discount_percentage(self):
        """Calculate discount percentage"""
        if not self.is_on_sale:
            return 0
        return round(((self.original_price - self.price) / self.original_price) * 100)
    
    @property
    def profit_margin(self):
        """Calculate profit margin"""
        if not self.cost_price:
            return 0
        return round(((self.price - self.cost_price) / self.price) * 100, 2)
    
    @property
    def main_image(self):
        """Get main product image"""
        return self.images.filter(is_main=True).first()
    
    @property
    def image_url(self):
        """Get main image URL or placeholder"""
        main_img = self.main_image
        if main_img and main_img.image:
            return main_img.image.url
        return '/static/images/placeholders/product-placeholder.jpg'
    
    @property
    def thumbnail_url(self):
        """Get thumbnail URL"""
        main_img = self.main_image
        if main_img and main_img.thumbnail:
            return main_img.thumbnail.url
        return '/static/images/placeholders/product-placeholder.jpg'
    
    def get_gallery_images(self):
        """Get all product images ordered by position"""
        return self.images.all().order_by('position')
    
    def get_related_products(self, limit=4):
        """Get related products from same category"""
        return Product.objects.filter(
            category=self.category,
            is_active=True
        ).exclude(id=self.id)[:limit]
    
    def increment_view_count(self):
        """Increment product view count"""
        self.view_count += 1
        self.save(update_fields=['view_count'])
    
    def can_be_purchased(self, quantity=1):
        """Check if product can be purchased"""
        if not self.is_active:
            return False, "Product is not available"
        
        if not self.track_inventory:
            return True, ""
        
        if self.stock_quantity < quantity:
            if self.allow_backorders:
                return True, "Item will be backordered"
            else:
                return False, "Insufficient stock"
        
        return True, ""
    
    def reduce_stock(self, quantity):
        """Reduce stock quantity"""
        if self.track_inventory:
            self.stock_quantity = max(0, self.stock_quantity - quantity)
            self.save(update_fields=['stock_quantity'])
    
    def increase_stock(self, quantity):
        """Increase stock quantity"""
        if self.track_inventory:
            self.stock_quantity += quantity
            self.save(update_fields=['stock_quantity'])


class ProductImageManager(models.Manager):
    """Custom manager for ProductImage model"""
    
    def main_images(self):
        """Return main images only"""
        return self.filter(is_main=True)


class ProductImage(TimeStampedModel):
    """Product image model"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE, 
        related_name='images'
    )
    image = models.ImageField(upload_to=product_image_upload_path)
    thumbnail = models.ImageField(
        upload_to=product_thumbnail_upload_path, 
        blank=True, 
        null=True
    )
    alt_text = models.CharField(max_length=255, blank=True)
    caption = models.CharField(max_length=500, blank=True)
    position = models.PositiveIntegerField(default=0)
    is_main = models.BooleanField(default=False)
    
    objects = ProductImageManager()
    
    class Meta:
        db_table = 'product_images'
        verbose_name = 'Product Image'
        verbose_name_plural = 'Product Images'
        ordering = ['position', 'created_at']
        indexes = [
            models.Index(fields=['product', 'position']),
            models.Index(fields=['is_main']),
        ]
    
    def __str__(self):
        return f"{self.product.name} - Image {self.position}"
    
    def save(self, *args, **kwargs):
        """Override save to handle main image logic and create thumbnails"""
        # Ensure only one main image per product
        if self.is_main:
            ProductImage.objects.filter(
                product=self.product, 
                is_main=True
            ).exclude(id=self.id).update(is_main=False)
        
        # If this is the first image for the product, make it main
        if not ProductImage.objects.filter(product=self.product).exists():
            self.is_main = True
        
        # Set alt text if empty
        if not self.alt_text:
            self.alt_text = f"{self.product.name} image"
        
        super().save(*args, **kwargs)
        
        # Create thumbnail after saving
        if self.image and not self.thumbnail:
            self.create_thumbnail()
    
    def create_thumbnail(self, size=(300, 300)):
        """Create thumbnail from main image"""
        if not self.image:
            return
        
        try:
            # Open image
            image = Image.open(self.image)
            
            # Convert to RGB if necessary
            if image.mode not in ('RGB', 'RGBA'):
                image = image.convert('RGB')
            
            # Create thumbnail
            image.thumbnail(size, Image.Resampling.LANCZOS)
            
            # Save thumbnail
            output = BytesIO()
            image.save(output, format='JPEG', quality=85)
            output.seek(0)
            
            # Generate filename
            filename = f"thumb_{self.image.name.split('/')[-1]}"
            if not filename.lower().endswith('.jpg'):
                filename = filename.rsplit('.', 1)[0] + '.jpg'
            
            # Save to thumbnail field
            self.thumbnail.save(
                filename,
                InMemoryUploadedFile(
                    output, 'ImageField', filename, 'image/jpeg',
                    sys.getsizeof(output), None
                ),
                save=False
            )
            
            # Save the model
            super().save(update_fields=['thumbnail'])
            
        except Exception as e:
            print(f"Error creating thumbnail: {e}")
    
    def delete(self, *args, **kwargs):
        """Override delete to handle main image reassignment"""
        was_main = self.is_main
        product = self.product
        
        super().delete(*args, **kwargs)
        
        # If deleted image was main, assign new main image
        if was_main:
            next_image = ProductImage.objects.filter(product=product).first()
            if next_image:
                next_image.is_main = True
                next_image.save(update_fields=['is_main'])


class ProductAttribute(TimeStampedModel):
    """Product attribute model for custom attributes"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE, 
        related_name='attributes'
    )
    name = models.CharField(max_length=100)
    value = models.TextField()
    position = models.PositiveIntegerField(default=0)
    
    class Meta:
        db_table = 'product_attributes'
        verbose_name = 'Product Attribute'
        verbose_name_plural = 'Product Attributes'
        ordering = ['position', 'name']
        unique_together = ['product', 'name']
    
    def __str__(self):
        return f"{self.product.name} - {self.name}: {self.value}"


class ProductVariant(TimeStampedModel):
    """Product variant model for products with variations"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE, 
        related_name='variants'
    )
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, unique=True, blank=True)
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    stock_quantity = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    # Variant-specific attributes
    color = models.CharField(max_length=50, blank=True)
    size = models.CharField(max_length=50, blank=True)
    weight = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        blank=True, 
        null=True
    )
    
    class Meta:
        db_table = 'product_variants'
        verbose_name = 'Product Variant'
        verbose_name_plural = 'Product Variants'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.product.name} - {self.name}"
    
    def save(self, *args, **kwargs):
        """Override save to generate SKU"""
        if not self.sku:
            self.sku = f"{self.product.sku}-{self.id or uuid.uuid4().hex[:6].upper()}"
        super().save(*args, **kwargs)
