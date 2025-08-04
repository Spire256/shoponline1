
# apps/admin_dashboard/tasks.py
from celery import shared_task
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

@shared_task
def clear_expired_banners():
    """Remove expired banners from active status"""
    from .models import Banner
    
    try:
        now = timezone.now()
        expired_banners = Banner.objects.filter(
            is_active=True,
            end_date__lt=now
        )
        
        count = expired_banners.count()
        expired_banners.update(is_active=False)
        
        # Clear banner cache
        cache_keys = [
            'banners_active_all',
            'banners_active_hero',
            'banners_active_promo',
            'banners_active_category',
            'banners_active_flash_sale'
        ]
        for key in cache_keys:
            cache.delete(key)
        
        logger.info(f"Deactivated {count} expired banners")
        return f"Deactivated {count} expired banners"
        
    except Exception as e:
        logger.error(f"Error clearing expired banners: {str(e)}")
        raise

@shared_task
def clear_expired_featured_products():
    """Remove expired featured products from active status"""
    from .models import FeaturedProduct
    
    try:
        now = timezone.now()
        expired_featured = FeaturedProduct.objects.filter(
            is_active=True,
            featured_until__lt=now
        )
        
        count = expired_featured.count()
        expired_featured.update(is_active=False)
        
        # Clear featured products cache
        for limit in [4, 8, 12, 16, 20]:
            cache.delete(f'featured_products_limit_{limit}')
        
        logger.info(f"Deactivated {count} expired featured products")
        return f"Deactivated {count} expired featured products"
        
    except Exception as e:
        logger.error(f"Error clearing expired featured products: {str(e)}")
        raise

@shared_task
def generate_daily_analytics():
    """Generate and cache daily analytics data"""
    from .services.analytics_service import AnalyticsService
    
    try:
        analytics_service = AnalyticsService()
        
        # Generate dashboard overview
        overview_data = analytics_service.get_dashboard_overview()
        cache.set('daily_analytics_overview', overview_data, 86400)  # 24 hours
        
        # Generate sales chart data
        sales_data = analytics_service.get_sales_chart_data('30days')
        cache.set('daily_sales_chart', sales_data, 86400)
        
        # Generate product performance
        product_data = analytics_service.get_product_performance()
        cache.set('daily_product_performance', product_data, 86400)
        
        logger.info("Daily analytics generated successfully")
        return "Daily analytics generated successfully"
        
    except Exception as e:
        logger.error(f"Error generating daily analytics: {str(e)}")
        raise

@shared_task
def cleanup_dashboard_cache():
    """Clean up old dashboard cache entries"""
    try:
        # List of cache keys to clear
        cache_keys = [
            'homepage_content_active',
            'homepage_content_all',
            'site_settings',
            'payment_settings',
            'social_media_settings'
        ]
        
        # Clear banner caches
        banner_types = ['all', 'hero', 'promo', 'category', 'flash_sale']
        for banner_type in banner_types:
            cache_keys.append(f'banners_active_{banner_type}')
        
        # Clear featured product caches
        for limit in range(4, 25, 4):
            cache_keys.append(f'featured_products_limit_{limit}')
        
        # Clear analytics caches
        analytics_keys = [
            'daily_analytics_overview',
            'daily_sales_chart',
            'daily_product_performance',
            'weekly_analytics',
            'monthly_analytics'
        ]
        cache_keys.extend(analytics_keys)
        
        # Delete all cache keys
        cache.delete_many(cache_keys)
        
        logger.info(f"Cleaned up {len(cache_keys)} cache entries")
        return f"Cleaned up {len(cache_keys)} cache entries"
        
    except Exception as e:
        logger.error(f"Error cleaning up dashboard cache: {str(e)}")
        raise
