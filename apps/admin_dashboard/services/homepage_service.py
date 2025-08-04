# apps/admin_dashboard/services/homepage_service.py
from django.core.cache import cache
from django.utils import timezone
from django.db.models import Q
from typing import Dict, List, Any, Optional
from ..models import HomepageContent, Banner, FeaturedProduct, SiteSettings

class HomepageService:
    """Service for managing homepage content and display"""

    def __init__(self):
        self.cache_timeout = 1800  # 30 minutes

    def get_homepage_data(self) -> Dict[str, Any]:
        """Get all homepage data for public display"""
        return {
            'content': self.get_active_content(),
            'banners': self.get_active_banners(),
            'featured_products': self.get_featured_products(),
            'hero_banner': self.get_hero_banner(),
            'promo_banners': self.get_promo_banners()
        }

    def get_active_content(self) -> Optional[Dict[str, Any]]:
        """Get active homepage content with caching"""
        cache_key = 'homepage_content_active'
        content = cache.get(cache_key)
        
        if content is None:
            content_obj = HomepageContent.objects.filter(is_active=True).first()
            if content_obj:
                content = {
                    'id': content_obj.id,
                    'title': content_obj.title,
                    'subtitle': content_obj.subtitle,
                    'hero_text': content_obj.hero_text,
                    'meta_description': content_obj.meta_description,
                    'meta_keywords': content_obj.meta_keywords
                }
                cache.set(cache_key, content, self.cache_timeout)
        
        return content

    def get_active_banners(self, banner_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get active banners with caching"""
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
            
            banner_objects = queryset.order_by('order', '-created_at')
            
            banners = []
            for banner in banner_objects:
                banners.append({
                    'id': banner.id,
                    'title': banner.title,
                    'description': banner.description,
                    'image': banner.image.url if banner.image else None,
                    'banner_type': banner.banner_type,
                    'link_url': banner.link_url,
                    'link_text': banner.link_text,
                    'order': banner.order
                })
            
            cache.set(cache_key, banners, self.cache_timeout)
        
        return banners

    def get_hero_banner(self) -> Optional[Dict[str, Any]]:
        """Get the main hero banner"""
        hero_banners = self.get_active_banners('hero')
        return hero_banners[0] if hero_banners else None

    def get_promo_banners(self) -> List[Dict[str, Any]]:
        """Get promotional banners"""
        return self.get_active_banners('promo')

    def get_featured_products(self, limit: int = 8) -> List[Dict[str, Any]]:
        """Get featured products with caching"""
        cache_key = f'featured_products_limit_{limit}'
        featured = cache.get(cache_key)
        
        if featured is None:
            from apps.products.models import Product
            
            now = timezone.now()
            featured_objects = FeaturedProduct.objects.filter(
                is_active=True,
                product__is_active=True,
                product__stock_quantity__gt=0
            ).filter(
                Q(featured_until__isnull=True) | Q(featured_until__gte=now)
            ).select_related('product').order_by('order', '-created_at')[:limit]
            
            featured = []
            for item in featured_objects:
                product = item.product
                featured.append({
                    'id': item.id,
                    'product': {
                        'id': product.id,
                        'name': product.name,
                        'description': product.description,
                        'price': float(product.price),
                        'image': product.main_image.url if product.main_image else None,
                        'slug': product.slug,
                        'stock_quantity': product.stock_quantity,
                        'category': {
                            'id': product.category.id,
                            'name': product.category.name,
                            'slug': product.category.slug
                        } if product.category else None
                    },
                    'order': item.order,
                    'featured_until': item.featured_until.isoformat() if item.featured_until else None
                })
            
            cache.set(cache_key, featured, self.cache_timeout)
        
        return featured

    def update_banner_order(self, banner_orders: List[Dict[str, Any]]) -> bool:
        """Update banner display order"""
        try:
            for item in banner_orders:
                banner_id = item.get('id')
                order = item.get('order')
                
                Banner.objects.filter(id=banner_id).update(order=order)
            
            # Clear relevant caches
            self._clear_banner_cache()
            return True
        except Exception:
            return False

    def update_featured_order(self, featured_orders: List[Dict[str, Any]]) -> bool:
        """Update featured products display order"""
        try:
            for item in featured_orders:
                featured_id = item.get('id')
                order = item.get('order')
                
                FeaturedProduct.objects.filter(id=featured_id).update(order=order)
            
            # Clear relevant caches
            self._clear_featured_cache()
            return True
        except Exception:
            return False

    def _clear_banner_cache(self):
        """Clear all banner-related cache"""
        cache_keys = [
            'banners_active_all',
            'banners_active_hero',
            'banners_active_promo',
            'banners_active_category',
            'banners_active_flash_sale'
        ]
        for key in cache_keys:
            cache.delete(key)

    def _clear_featured_cache(self):
        """Clear all featured products cache"""
        # Clear various limits of featured products
        for limit in [4, 8, 12, 16]:
            cache.delete(f'featured_products_limit_{limit}')

    def get_seo_data(self) -> Dict[str, str]:
        """Get SEO data for homepage"""
        content = self.get_active_content()
        settings = self.get_site_settings()
        
        return {
            'title': content.get('title', 'ShopOnline Uganda') if content else 'ShopOnline Uganda',
            'description': content.get('meta_description', '') if content else '',
            'keywords': content.get('meta_keywords', '') if content else '',
            'site_name': settings.get('site_name', 'ShopOnline Uganda') if settings else 'ShopOnline Uganda'
        }

    def get_site_settings(self) -> Optional[Dict[str, Any]]:
        """Get site settings with caching"""
        cache_key = 'site_settings'
        settings = cache.get(cache_key)
        
        if settings is None:
            settings_obj = SiteSettings.objects.first()
            if settings_obj:
                settings = {
                    'site_name': settings_obj.site_name,
                    'site_logo': settings_obj.site_logo.url if settings_obj.site_logo else None,
                    'contact_email': settings_obj.contact_email,
                    'contact_phone': settings_obj.contact_phone,
                    'social_facebook': settings_obj.social_facebook,
                    'social_twitter': settings_obj.social_twitter,
                    'social_instagram': settings_obj.social_instagram,
                    'social_whatsapp': settings_obj.social_whatsapp,
                    'enable_flash_sales': settings_obj.enable_flash_sales,
                    'enable_cod': settings_obj.enable_cod,
                    'enable_mtn_momo': settings_obj.enable_mtn_momo,
                    'enable_airtel_money': settings_obj.enable_airtel_money,
                    'maintenance_mode': settings_obj.maintenance_mode,
                    'maintenance_message': settings_obj.maintenance_message
                }
                cache.set(cache_key, settings, 7200)  # 2 hours
        
        return settings
