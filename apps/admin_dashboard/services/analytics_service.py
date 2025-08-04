# apps/admin_dashboard/services/analytics_service.py
from django.db.models import Count, Sum, Q, Avg
from django.db.models.functions import TruncDate, TruncMonth, TruncWeek
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Any, Optional

class AnalyticsService:
    """Service for handling dashboard analytics and reporting"""

    def __init__(self):
        self.timezone = timezone.get_current_timezone()

    def get_dashboard_overview(self) -> Dict[str, Any]:
        """Get comprehensive dashboard overview statistics"""
        from apps.orders.models import Order
        from apps.products.models import Product
        from apps.accounts.models import User
        from apps.flash_sales.models import FlashSale
        
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        this_month = today.replace(day=1)
        last_month = (this_month - timedelta(days=1)).replace(day=1)
        
        # Total counts
        total_orders = Order.objects.count()
        total_products = Product.objects.filter(is_active=True).count()
        total_users = User.objects.filter(email__endswith='@gmail.com').count()
        active_flash_sales = FlashSale.objects.filter(
            is_active=True,
            start_time__lte=timezone.now(),
            end_time__gte=timezone.now()
        ).count()

        # Today's statistics
        today_orders = Order.objects.filter(created_at__date=today).count()
        today_revenue = Order.objects.filter(
            created_at__date=today,
            status='completed'
        ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0')

        # Yesterday's statistics for comparison
        yesterday_orders = Order.objects.filter(created_at__date=yesterday).count()
        yesterday_revenue = Order.objects.filter(
            created_at__date=yesterday,
            status='completed'
        ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0')

        # This month's statistics
        month_orders = Order.objects.filter(created_at__date__gte=this_month).count()
        month_revenue = Order.objects.filter(
            created_at__date__gte=this_month,
            status='completed'
        ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0')

        # Last month's statistics for comparison
        last_month_orders = Order.objects.filter(
            created_at__date__gte=last_month,
            created_at__date__lt=this_month
        ).count()
        last_month_revenue = Order.objects.filter(
            created_at__date__gte=last_month,
            created_at__date__lt=this_month,
            status='completed'
        ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0')

        # Pending orders (require attention)
        pending_orders = Order.objects.filter(status='pending').count()
        cod_orders = Order.objects.filter(
            payment_method='cod',
            status__in=['pending', 'confirmed']
        ).count()

        # Low stock products
        low_stock_products = Product.objects.filter(
            is_active=True,
            stock_quantity__lte=10
        ).count()

        # Calculate percentage changes
        def calculate_percentage_change(current, previous):
            if previous == 0:
                return 100 if current > 0 else 0
            return round(((current - previous) / previous) * 100, 2)

        orders_change = calculate_percentage_change(today_orders, yesterday_orders)
        revenue_change = calculate_percentage_change(float(today_revenue), float(yesterday_revenue))
        month_orders_change = calculate_percentage_change(month_orders, last_month_orders)
        month_revenue_change = calculate_percentage_change(float(month_revenue), float(last_month_revenue))

        return {
            'totals': {
                'orders': total_orders,
                'products': total_products,
                'users': total_users,
                'active_flash_sales': active_flash_sales
            },
            'today': {
                'orders': today_orders,
                'revenue': float(today_revenue),
                'orders_change': orders_change,
                'revenue_change': revenue_change
            },
            'month': {
                'orders': month_orders,
                'revenue': float(month_revenue),
                'orders_change': month_orders_change,
                'revenue_change': month_revenue_change
            },
            'alerts': {
                'pending_orders': pending_orders,
                'cod_orders': cod_orders,
                'low_stock_products': low_stock_products
            }
        }

    def get_sales_chart_data(self, period: str = '7days') -> Dict[str, Any]:
        """Get sales chart data for specified period"""
        from apps.orders.models import Order
        
        end_date = timezone.now()
        
        if period == '7days':
            start_date = end_date - timedelta(days=7)
            trunc_func = TruncDate
            date_format = '%Y-%m-%d'
        elif period == '30days':
            start_date = end_date - timedelta(days=30)
            trunc_func = TruncDate
            date_format = '%Y-%m-%d'
        elif period == '12months':
            start_date = end_date - timedelta(days=365)
            trunc_func = TruncMonth
            date_format = '%Y-%m'
        else:
            start_date = end_date - timedelta(days=7)
            trunc_func = TruncDate
            date_format = '%Y-%m-%d'

        sales_data = Order.objects.filter(
            created_at__gte=start_date,
            status='completed'
        ).annotate(
            period=trunc_func('created_at')
        ).values('period').annotate(
            orders=Count('id'),
            revenue=Sum('total_amount')
        ).order_by('period')

        # Format data for chart
        chart_data = []
        for item in sales_data:
            chart_data.append({
                'date': item['period'].strftime(date_format),
                'orders': item['orders'],
                'revenue': float(item['revenue'] or 0)
            })

        return {
            'period': period,
            'data': chart_data
        }

    def get_product_performance(self) -> Dict[str, Any]:
        """Get product performance analytics"""
        from apps.orders.models import OrderItem
        from apps.products.models import Product
        
        # Top selling products (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        top_products = OrderItem.objects.filter(
            order__created_at__gte=thirty_days_ago,
            order__status='completed'
        ).values(
            'product__id',
            'product__name',
            'product__price'
        ).annotate(
            total_quantity=Sum('quantity'),
            total_revenue=Sum('price')
        ).order_by('-total_quantity')[:10]

        # Low stock products
        low_stock = Product.objects.filter(
            is_active=True,
            stock_quantity__lte=10
        ).values(
            'id', 'name', 'stock_quantity', 'price'
        ).order_by('stock_quantity')[:10]

        # Out of stock products
        out_of_stock = Product.objects.filter(
            is_active=True,
            stock_quantity=0
        ).count()

        return {
            'top_selling': list(top_products),
            'low_stock': list(low_stock),
            'out_of_stock_count': out_of_stock
        }

    def get_recent_orders(self, limit: int = 10) -> Dict[str, Any]:
        """Get recent orders for dashboard display"""
        from apps.orders.models import Order
        
        recent_orders = Order.objects.select_related('user').prefetch_related(
            'orderitem_set__product'
        ).order_by('-created_at')[:limit]

        orders_data = []
        for order in recent_orders:
            orders_data.append({
                'id': order.id,
                'order_number': order.order_number,
                'customer_name': order.user.get_full_name() if order.user else 'Guest',
                'customer_email': order.user.email if order.user else order.email,
                'total_amount': float(order.total_amount),
                'status': order.status,
                'payment_method': order.payment_method,
                'created_at': order.created_at.isoformat(),
                'items_count': order.orderitem_set.count()
            })

        return {
            'orders': orders_data
        }

    def get_flash_sales_performance(self) -> Dict[str, Any]:
        """Get flash sales performance analytics"""
        from apps.flash_sales.models import FlashSale, FlashSaleProduct
        from apps.orders.models import OrderItem
        
        # Active flash sales
        active_sales = FlashSale.objects.filter(
            is_active=True,
            start_time__lte=timezone.now(),
            end_time__gte=timezone.now()
        ).count()

        # Flash sales revenue (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        flash_sale_products = FlashSaleProduct.objects.filter(
            flash_sale__start_time__gte=thirty_days_ago
        ).values_list('product_id', flat=True)

        flash_sales_revenue = OrderItem.objects.filter(
            product_id__in=flash_sale_products,
            order__created_at__gte=thirty_days_ago,
            order__status='completed'
        ).aggregate(
            total_revenue=Sum('price'),
            total_quantity=Sum('quantity')
        )

        # Top performing flash sales
        top_flash_sales = FlashSale.objects.filter(
            start_time__gte=thirty_days_ago
        ).annotate(
            products_count=Count('flashsaleproduct'),
            total_orders=Count('flashsaleproduct__product__orderitem')
        ).order_by('-total_orders')[:5]

        top_sales_data = []
        for sale in top_flash_sales:
            top_sales_data.append({
                'id': sale.id,
                'name': sale.name,
                'discount_percentage': float(sale.discount_percentage),
                'products_count': sale.products_count,
                'total_orders': sale.total_orders,
                'start_time': sale.start_time.isoformat(),
                'end_time': sale.end_time.isoformat(),
                'is_active': sale.is_active
            })

        return {
            'active_sales': active_sales,
            'revenue': {
                'total_revenue': float(flash_sales_revenue['total_revenue'] or 0),
                'total_quantity': flash_sales_revenue['total_quantity'] or 0
            },
            'top_sales': top_sales_data
        }

    def get_user_analytics(self) -> Dict[str, Any]:
        """Get user analytics data"""
        from apps.accounts.models import User
        from apps.orders.models import Order
        
        # User registrations (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        new_users = User.objects.filter(
            date_joined__gte=thirty_days_ago,
            email__endswith='@gmail.com'
        ).count()

        # Active users (users who placed orders in last 30 days)
        active_users = User.objects.filter(
            order__created_at__gte=thirty_days_ago,
            email__endswith='@gmail.com'
        ).distinct().count()

        # Top customers by order value
        top_customers = User.objects.filter(
            email__endswith='@gmail.com'
        ).annotate(
            total_spent=Sum('order__total_amount'),
            total_orders=Count('order')
        ).filter(
            total_spent__isnull=False
        ).order_by('-total_spent')[:10]

        customers_data = []
        for customer in top_customers:
            customers_data.append({
                'id': customer.id,
                'name': customer.get_full_name(),
                'email': customer.email,
                'total_spent': float(customer.total_spent or 0),
                'total_orders': customer.total_orders,
                'date_joined': customer.date_joined.isoformat()
            })

        return {
            'new_users': new_users,
            'active_users': active_users,
            'top_customers': customers_data
        }

    def get_payment_method_analytics(self) -> Dict[str, Any]:
        """Get payment method usage analytics"""
        from apps.orders.models import Order
        
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        payment_stats = Order.objects.filter(
            created_at__gte=thirty_days_ago,
            status='completed'
        ).values('payment_method').annotate(
            count=Count('id'),
            revenue=Sum('total_amount')
        ).order_by('-count')

        payment_data = []
        for stat in payment_stats:
            payment_data.append({
                'method': stat['payment_method'],
                'count': stat['count'],
                'revenue': float(stat['revenue'] or 0)
            })

        return {
            'payment_methods': payment_data
        }