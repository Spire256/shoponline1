# apps/flash_sales/services/flash_sale_service.py
from django.utils import timezone
from django.db.models import Sum, Count, Q, Avg
from django.core.cache import cache
from decimal import Decimal
from ..models import FlashSale, FlashSaleProduct
from apps.orders.models import Order, OrderItem


class FlashSaleService:
    """Service for flash sale business logic"""
    
    @staticmethod
    def get_active_flash_sales():
        """Get all currently active flash sales"""
        cache_key = 'active_flash_sales'
        cached_sales = cache.get(cache_key)
        
        if cached_sales is None:
            now = timezone.now()
            active_sales = FlashSale.objects.filter(
                is_active=True,
                start_time__lte=now,
                end_time__gt=now
            ).select_related('created_by').prefetch_related(
                'flash_sale_products__product'
            ).order_by('-priority', 'end_time')
            
            cached_sales = list(active_sales)
            cache.set(cache_key, cached_sales, 300)  # Cache for 5 minutes
        
        return cached_sales
    
    @staticmethod
    def get_upcoming_flash_sales():
        """Get upcoming flash sales"""
        cache_key = 'upcoming_flash_sales'
        cached_sales = cache.get(cache_key)
        
        if cached_sales is None:
            now = timezone.now()
            upcoming_sales = FlashSale.objects.filter(
                is_active=True,
                start_time__gt=now
            ).select_related('created_by').prefetch_related(
                'flash_sale_products__product'
            ).order_by('start_time')
            
            cached_sales = list(upcoming_sales)
            cache.set(cache_key, cached_sales, 600)  # Cache for 10 minutes
        
        return cached_sales
    
    @staticmethod
    def get_product_flash_sale_price(product):
        """Get flash sale price for a product if in active flash sale"""
        now = timezone.now()
        
        flash_sale_product = FlashSaleProduct.objects.filter(
            product=product,
            is_active=True,
            flash_sale__is_active=True,
            flash_sale__start_time__lte=now,
            flash_sale__end_time__gt=now
        ).select_related('flash_sale').first()
        
        if flash_sale_product:
            return {
                'flash_sale_price': flash_sale_product.flash_sale_price,
                'original_price': flash_sale_product.original_price,
                'discount_percentage': flash_sale_product.discount_percentage,
                'flash_sale': flash_sale_product.flash_sale,
                'savings': flash_sale_product.savings_amount
            }
        
        return None
    
    @staticmethod
    def is_product_in_flash_sale(product):
        """Check if product is currently in a flash sale"""
        flash_sale_info = FlashSaleService.get_product_flash_sale_price(product)
        return flash_sale_info is not None
    
    @staticmethod
    def get_flash_sale_analytics(flash_sale):
        """Get comprehensive analytics for a flash sale"""
        products = flash_sale.flash_sale_products.filter(is_active=True)
        
        # Basic metrics
        total_products = products.count()
        total_orders = 0
        total_revenue = Decimal('0.00')
        total_savings = Decimal('0.00')
        
        # Calculate order-based metrics
        flash_sale_orders = Order.objects.filter(
            order_items__product__in=[p.product for p in products],
            created_at__gte=flash_sale.start_time,
            created_at__lte=flash_sale.end_time,
            status__in=['confirmed', 'delivered', 'completed']
        ).distinct()
        
        total_orders = flash_sale_orders.count()
        
        # Calculate revenue and savings
        for product in products:
            order_items = OrderItem.objects.filter(
                product=product.product,
                order__in=flash_sale_orders
            )
            
            product_revenue = order_items.aggregate(
                revenue=Sum('price')
            )['revenue'] or Decimal('0.00')
            
            product_quantity = order_items.aggregate(
                quantity=Sum('quantity')
            )['quantity'] or 0
            
            total_revenue += product_revenue
            total_savings += (product.savings_amount * product_quantity)
            
            # Update sold quantity
            product.sold_quantity = product_quantity
            product.save(update_fields=['sold_quantity'])
        
        # Top performing products
        top_products = []
        for product in products:
            product_orders = OrderItem.objects.filter(
                product=product.product,
                order__in=flash_sale_orders
            ).aggregate(
                quantity=Sum('quantity'),
                revenue=Sum('price')
            )
            
            top_products.append({
                'product': product.product,
                'quantity_sold': product_orders['quantity'] or 0,
                'revenue': product_orders['revenue'] or Decimal('0.00'),
                'discount_percentage': product.discount_percentage
            })
        
        # Sort by quantity sold
        top_products.sort(key=lambda x: x['quantity_sold'], reverse=True)
        
        # Performance metrics
        conversion_rate = 0
        if total_products > 0:
            products_with_sales = len([p for p in top_products if p['quantity_sold'] > 0])
            conversion_rate = (products_with_sales / total_products) * 100
        
        return {
            'flash_sale_id': str(flash_sale.id),
            'flash_sale_name': flash_sale.name,
            'status': 'active' if flash_sale.is_running else 'expired' if flash_sale.is_expired else 'upcoming',
            'total_products': total_products,
            'total_orders': total_orders,
            'total_revenue': float(total_revenue),
            'total_savings': float(total_savings),
            'conversion_rate': round(conversion_rate, 2),
            'top_products': top_products[:10],  # Top 10 products
            'duration_hours': int((flash_sale.end_time - flash_sale.start_time).total_seconds() / 3600),
            'time_remaining': flash_sale.time_remaining if flash_sale.is_running else 0
        }
    
    @staticmethod
    def update_flash_sale_stock(product, quantity_sold):
        """Update flash sale stock when order is placed"""
        flash_sale_product = FlashSaleProduct.objects.filter(
            product=product,
            is_active=True,
            flash_sale__is_active=True,
            flash_sale__start_time__lte=timezone.now(),
            flash_sale__end_time__gt=timezone.now()
        ).first()
        
        if flash_sale_product:
            flash_sale_product.sold_quantity += quantity_sold
            flash_sale_product.save(update_fields=['sold_quantity'])
            
            # Check if sold out and deactivate if needed
            if flash_sale_product.is_sold_out:
                flash_sale_product.is_active = False
                flash_sale_product.save(update_fields=['is_active'])
    
    @staticmethod
    def cleanup_expired_flash_sales():
        """Cleanup expired flash sales (called by Celery task)"""
        now = timezone.now()
        expired_sales = FlashSale.objects.filter(
            end_time__lt=now,
            is_active=True
        )
        
        updated_count = expired_sales.update(is_active=False)
        
        # Clear caches
        cache.delete_many([
            'active_flash_sales',
            'upcoming_flash_sales'
        ])
        
        return updated_count


class FlashSaleValidationService:
    """Service for flash sale validation logic"""
    
    @staticmethod
    def validate_flash_sale_timing(start_time, end_time):
        """Validate flash sale timing"""
        errors = []
        now = timezone.now()
        
        if start_time >= end_time:
            errors.append("End time must be after start time")
        
        if end_time <= now:
            errors.append("End time must be in the future")
        
        # Check for overlapping flash sales (optional business rule)
        # You can uncomment this if you want to prevent overlapping sales
        # overlapping_sales = FlashSale.objects.filter(
        #     Q(start_time__lt=end_time, end_time__gt=start_time),
        #     is_active=True
        # )
        # if overlapping_sales.exists():
        #     errors.append("Flash sale overlaps with existing active sale")
        
        return errors
    
    @staticmethod
    def validate_product_eligibility(product, flash_sale):
        """Validate if product can be added to flash sale"""
        errors = []
        
        # Check if product is already in an active flash sale
        existing_flash_sale = FlashSaleProduct.objects.filter(
            product=product,
            is_active=True,
            flash_sale__is_active=True,
            flash_sale__start_time__lte=timezone.now(),
            flash_sale__end_time__gt=timezone.now()
        ).exclude(flash_sale=flash_sale).first()
        
        if existing_flash_sale:
            errors.append(f"Product is already in flash sale: {existing_flash_sale.flash_sale.name}")
        
        # Check if product has sufficient stock
        if product.stock_quantity <= 0:
            errors.append("Product is out of stock")
        
        # Check if product is active
        if not product.is_active:
            errors.append("Product is not active")
        
        return errors
