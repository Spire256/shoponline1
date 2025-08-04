# apps/admin_dashboard/management/commands/clear_dashboard_cache.py
from django.core.management.base import BaseCommand
from django.core.cache import cache

class Command(BaseCommand):
    help = 'Clear all dashboard-related cache entries'

    def handle(self, *args, **options):
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
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully cleared {len(cache_keys)} cache entries')
            )
            
            # List cleared keys
            self.stdout.write(
                self.style.SUCCESS('Cleared cache keys:')
            )
            for key in cache_keys:
                self.stdout.write(f'  - {key}')
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error clearing dashboard cache: {str(e)}')
            )
