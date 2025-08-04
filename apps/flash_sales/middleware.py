
# apps/flash_sales/middleware.py
from django.utils.deprecation import MiddlewareMixin
from django.core.cache import cache
from .services.flash_sale_service import FlashSaleService


class FlashSaleMiddleware(MiddlewareMixin):
    """Middleware to handle flash sale related functionality"""
    
    def process_request(self, request):
        """Add flash sale context to request"""
        # Add active flash sales to request context for easy access
        if not hasattr(request, 'active_flash_sales'):
            cache_key = 'middleware_active_flash_sales'
            active_sales = cache.get(cache_key)
            
            if active_sales is None:
                active_sales = FlashSaleService.get_active_flash_sales()
                cache.set(cache_key, active_sales, 300)  # Cache for 5 minutes
            
            request.active_flash_sales = active_sales
        
        return None

