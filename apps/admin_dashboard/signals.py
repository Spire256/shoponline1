
# apps/admin_dashboard/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from .models import HomepageContent, Banner, FeaturedProduct, SiteSettings

@receiver(post_save, sender=HomepageContent)
@receiver(post_delete, sender=HomepageContent)
def clear_homepage_content_cache(sender, **kwargs):
    """Clear homepage content cache when content is updated"""
    cache.delete('homepage_content_active')
    cache.delete('homepage_content_all')

@receiver(post_save, sender=Banner)
@receiver(post_delete, sender=Banner)
def clear_banner_cache(sender, **kwargs):
    """Clear banner cache when banners are updated"""
    cache.delete('banners_active')
    cache.delete('banners_hero')
    cache.delete('banners_promo')

@receiver(post_save, sender=FeaturedProduct)
@receiver(post_delete, sender=FeaturedProduct)
def clear_featured_products_cache(sender, **kwargs):
    """Clear featured products cache when featured products are updated"""
    cache.delete('featured_products_active')
    cache.delete('homepage_featured_products')

@receiver(post_save, sender=SiteSettings)
def clear_site_settings_cache(sender, **kwargs):
    """Clear site settings cache when settings are updated"""
    cache.delete('site_settings')
    cache.delete('payment_settings')
    cache.delete('social_media_settings')
