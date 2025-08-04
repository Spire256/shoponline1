
# apps/admin_dashboard/utils.py
from django.core.cache import cache
from django.utils import timezone
from django.db.models import Q
from .models import HomepageContent, Banner, FeaturedProduct, SiteSettings

def get_cached_homepage_content():
    """Get cached active homepage content"""
    cache_key = 'homepage_content_active'
    content = cache.get(cache_key)
    
    if content is None:
        content = HomepageContent.objects.filter(is_active=True).first()
        if content:
            cache.set(cache_key, content, 3600)  # Cache for 1 hour
    
    return content

def get_cached_active_banners(banner_type=None):
    """Get cached active banners"""
    cache_key = f'banners_active_{banner_type or "all"}'
    banners = cache.get(cache_key)
    
    if banners is None:
        now = timezone.now()
        queryset = Banner.objects.filter(
            is_active=True
        ).filter(
            Q(start_date__isnull=True) | Q(start_date__lte=now)
        ).filter(
            Q(end_date__isnull=True) | Q(end_date__gte=now)
        )
        
        if banner_type:
            queryset = queryset.filter(banner_type=banner_type)
        
        banners = list(queryset.order_by('order', '-created_at'))
        cache.set(cache_key, banners, 1800)  # Cache for 30 minutes
    
    return banners

def get_cached_featured_products():
    """Get cached active featured products"""
    cache_key = 'featured_products_active'
    featured = cache.get(cache_key)
    
    if featured is None:
        now = timezone.now()
        featured = list(FeaturedProduct.objects.filter(
            is_active=True,
            product__is_active=True,
            product__stock_quantity__gt=0
        ).filter(
            Q(featured_until__isnull=True) | Q(featured_until__gte=now)
        ).select_related('product').order_by('order', '-created_at'))
        
        cache.set(cache_key, featured, 1800)  # Cache for 30 minutes
    
    return featured

def get_cached_site_settings():
    """Get cached site settings"""
    cache_key = 'site_settings'
    settings = cache.get(cache_key)
    
    if settings is None:
        settings = SiteSettings.objects.first()
        if settings:
            cache.set(cache_key, settings, 7200)  # Cache for 2 hours
    
    return settings

def clear_all_dashboard_cache():
    """Clear all dashboard-related cache"""
    cache_keys = [
        'homepage_content_active',
        'homepage_content_all',
        'banners_active_all',
        'banners_active_hero',
        'banners_active_promo',
        'banners_active_category',
        'banners_active_flash_sale',
        'featured_products_active',
        'homepage_featured_products',
        'site_settings',
        'payment_settings',
        'social_media_settings'
    ]
    
    for key in cache_keys:
        cache.delete(key)

def validate_banner_dates(start_date, end_date):
    """Validate banner start and end dates"""
    if start_date and end_date:
        if start_date >= end_date:
            raise ValueError("Start date must be before end date")
    
    if start_date and start_date < timezone.now():
        raise ValueError("Start date cannot be in the past")

def generate_cache_key(model_name, filters=None):
    """Generate cache key for dynamic caching"""
    key = f"{model_name}"
    if filters:
        filter_str = "_".join([f"{k}_{v}" for k, v in sorted(filters.items())])
        key += f"_{filter_str}"
    return key