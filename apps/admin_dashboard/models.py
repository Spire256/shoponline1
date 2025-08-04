#from django.db import models

# Create your models here.
# apps/admin_dashboard/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import URLValidator
from apps.core.models import TimeStampedModel
from apps.products.models import Product

User = get_user_model()

class HomepageContent(TimeStampedModel):
    """Model for managing homepage content"""
    title = models.CharField(max_length=200, default="Welcome to ShopOnline")
    subtitle = models.CharField(max_length=300, blank=True)
    hero_text = models.TextField(blank=True)
    meta_description = models.TextField(max_length=160, blank=True)
    meta_keywords = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        db_table = 'homepage_content'
        verbose_name = 'Homepage Content'
        verbose_name_plural = 'Homepage Contents'

    def __str__(self):
        return f"Homepage Content - {self.title}"

class Banner(TimeStampedModel):
    """Model for homepage banners"""
    BANNER_TYPES = [
        ('hero', 'Hero Banner'),
        ('promo', 'Promotional Banner'),
        ('category', 'Category Banner'),
        ('flash_sale', 'Flash Sale Banner'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='banners/', max_length=255)
    banner_type = models.CharField(max_length=20, choices=BANNER_TYPES, default='promo')
    link_url = models.URLField(blank=True, validators=[URLValidator()])
    link_text = models.CharField(max_length=50, blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        db_table = 'banners'
        ordering = ['order', '-created_at']
        verbose_name = 'Banner'
        verbose_name_plural = 'Banners'

    def __str__(self):
        return f"{self.get_banner_type_display()} - {self.title}"

class FeaturedProduct(TimeStampedModel):
    """Model for featured products on homepage"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    featured_until = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        db_table = 'featured_products'
        ordering = ['order', '-created_at']
        unique_together = ['product', 'is_active']
        verbose_name = 'Featured Product'
        verbose_name_plural = 'Featured Products'

    def __str__(self):
        return f"Featured: {self.product.name}"

class SiteSettings(TimeStampedModel):
    """Model for site-wide settings"""
    site_name = models.CharField(max_length=100, default="ShopOnline Uganda")
    site_logo = models.ImageField(upload_to='site/', blank=True)
    site_favicon = models.ImageField(upload_to='site/', blank=True)
    contact_email = models.EmailField(default="info@shoponline.com")
    contact_phone = models.CharField(max_length=20, blank=True)
    contact_address = models.TextField(blank=True)
    social_facebook = models.URLField(blank=True)
    social_twitter = models.URLField(blank=True)
    social_instagram = models.URLField(blank=True)
    social_whatsapp = models.CharField(max_length=20, blank=True)
    enable_flash_sales = models.BooleanField(default=True)
    enable_cod = models.BooleanField(default=True)
    enable_mtn_momo = models.BooleanField(default=True)
    enable_airtel_money = models.BooleanField(default=True)
    maintenance_mode = models.BooleanField(default=False)
    maintenance_message = models.TextField(blank=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        db_table = 'site_settings'
        verbose_name = 'Site Settings'
        verbose_name_plural = 'Site Settings'

    def __str__(self):
        return f"Site Settings - {self.site_name}"

    def save(self, *args, **kwargs):
        # Ensure only one instance exists
        if not self.pk and SiteSettings.objects.exists():
            raise ValueError("Only one SiteSettings instance allowed")
        super().save(*args, **kwargs)


