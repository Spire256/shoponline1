# apps/orders/utils.py

import re
import random
import string
from decimal import Decimal
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from django.utils import timezone
from django.core.cache import cache
from django.db.models import Q
from django.contrib.auth import get_user_model

User = get_user_model()


def validate_uganda_phone_number(phone: str) -> bool:
    """
    Validate Uganda phone number format
    Accepts: 0712345678, 256712345678, +256712345678
    """
    patterns = [
        r'^256[0-9]{9}$',       # International format
        r'^0[0-9]{9}$',         # Local format
        r'^\+256[0-9]{9}$',     # International with +
        r'^256\s[0-9]{9}$',     # International with space
        r'^0[0-9]{3}\s[0-9]{6}$' # Local with space
    ]
    
    # Clean the phone number
    clean_phone = re.sub(r'\s+', '', phone.strip())
    
    return any(re.match(pattern, clean_phone) for pattern in patterns)


def normalize_uganda_phone_number(phone: str) -> str:
    """
    Normalize Uganda phone number to international format
    Returns: 256712345678
    """
    # Remove all spaces and special characters
    clean_phone = re.sub(r'[\s\-\(\)]+', '', phone.strip())
    
    # Remove + if present
    if clean_phone.startswith('+'):
        clean_phone = clean_phone[1:]
    
    # Convert local format to international
    if clean_phone.startswith('0') and len(clean_phone) == 10:
        clean_phone = '256' + clean_phone[1:]
    
    # Validate and return
    if validate_uganda_phone_number(clean_phone):
        return clean_phone
    
    raise ValueError(f"Invalid Uganda phone number: {phone}")


def validate_uganda_district(district: str) -> bool:
    """
    Validate Uganda district name
    """
    uganda_districts = [
        # Central Region
        'Kampala', 'Wakiso', 'Mpigi', 'Mukono', 'Luweero', 'Nakaseke',
        'Butambala', 'Gomba', 'Kalangala', 'Kalungu', 'Kyankwanzi',
        'Lwengo', 'Lyantonde', 'Masaka', 'Mityana', 'Mubende',
        'Nakasongola', 'Rakai', 'Sembabule', 'Buikwe', 'Buvuma',
        
        # Eastern Region
        'Jinja', 'Mbale', 'Soroti', 'Tororo', 'Busia', 'Iganga',
        'Kamuli', 'Kapchorwa', 'Katakwi', 'Kumi', 'Mayuge',
        'Pallisa', 'Sironko', 'Budaka', 'Bududa', 'Bukedea',
        'Bukwo', 'Butaleja', 'Kaliro', 'Kibuku', 'Manafwa',
        'Namayingo', 'Namutumba', 'Ngora', 'Serere',
        
        # Northern Region
        'Gulu', 'Lira', 'Arua', 'Kitgum', 'Moroto', 'Kotido',
        'Adjumani', 'Apac', 'Dokolo', 'Kaabong', 'Koboko',
        'Maracha', 'Nakapiripirit', 'Nebbi', 'Oyam', 'Pader',
        'Yumbe', 'Abim', 'Agago', 'Alebtong', 'Amudat',
        'Amolatar', 'Amuru', 'Buliisa', 'Zombo',
        
        # Western Region
        'Mbarara', 'Fort Portal', 'Kasese', 'Kabale', 'Hoima',
        'Masindi', 'Bundibugyo', 'Bushenyi', 'Ibanda', 'Isingiro',
        'Kanungu', 'Kabarole', 'Kamwenge', 'Kibaale', 'Kiruhura',
        'Kisoro', 'Kyegegwa', 'Kyenjojo', 'Ntungamo', 'Rukungiri',
        'Bunyangabu', 'Kagadi', 'Kakumiro', 'Mitooma', 'Ntoroko',
        'Rubanda', 'Rubirizi', 'Sheema'
    ]
    
    return district in uganda_districts


def get_uganda_districts() -> List[str]:
    """Get list of all Uganda districts"""
    return [
        'Kampala', 'Wakiso', 'Mpigi', 'Mukono', 'Luweero', 'Nakaseke',
        'Jinja', 'Mbale', 'Soroti', 'Tororo', 'Busia', 'Iganga',
        'Gulu', 'Lira', 'Arua', 'Kitgum', 'Moroto', 'Kotido',
        'Mbarara', 'Fort Portal', 'Kasese', 'Kabale', 'Hoima', 'Masindi',
        # Add more as needed
    ]


def format_ugx_currency(amount: Decimal, include_symbol: bool = True) -> str:
    """
    Format amount as Uganda Shillings
    Returns: UGX 50,000 or 50,000
    """
    formatted = f"{amount:,.0f}"
    
    if include_symbol:
        return f"UGX {formatted}"
    
    return formatted


def calculate_delivery_fee(subtotal: Decimal, district: str) -> Decimal:
    """
    Calculate delivery fee based on order value and location
    """
    # Free delivery for orders above UGX 100,000
    if subtotal >= Decimal('100000'):
        return Decimal('0.00')
    
    # Remote areas have higher delivery fees
    remote_districts = [
        'Moroto', 'Kotido', 'Kaabong', 'Nakapiripirit', 'Amudat',
        'Kasese', 'Bundibugyo', 'Ntoroko', 'Kisoro', 'Kanungu'
    ]
    
    if district in remote_districts:
        return Decimal('10000.00')  # UGX 10,000
    
    # Standard delivery fee
    return Decimal('5000.00')  # UGX 5,000


def generate_order_reference() -> str:
    """Generate unique order reference"""
    timestamp = datetime.now().strftime('%Y%m%d%H%M')
    random_suffix = ''.join(random.choices(string.digits, k=4))
    return f"SHO{timestamp}{random_suffix}"


def calculate_estimated_delivery_date(district: str, order_date: datetime = None) -> datetime:
    """
    Calculate estimated delivery date based on location
    """
    if order_date is None:
        order_date = timezone.now()
    
    # Base delivery time
    base_days = 2
    
    # Remote areas take longer
    remote_districts = [
        'Moroto', 'Kotido', 'Kaabong', 'Nakapiripirit', 'Amudat',
        'Kasese', 'Bundibugyo', 'Ntoroko', 'Kisoro', 'Kanungu',
        'Arua', 'Koboko', 'Maracha', 'Yumbe', 'Zombo'
    ]
    
    if district in remote_districts:
        base_days += 2
    
    # Weekend adjustments
    estimated_date = order_date + timedelta(days=base_days)
    
    # Skip weekends (Saturday = 5, Sunday = 6)
    while estimated_date.weekday() >= 5:
        estimated_date += timedelta(days=1)
    
    return estimated_date


def get_order_status_color(status: str) -> str:
    """Get color code for order status"""
    colors = {
        'pending': '#f59e0b',           # amber
        'confirmed': '#3b82f6',         # blue
        'processing': '#8b5cf6',        # purple
        'out_for_delivery': '#f59e0b',  # amber
        'delivered': '#10b981',         # green
        'cancelled': '#ef4444',         # red
        'refunded': '#6b7280'           # gray
    }
    return colors.get(status, '#6b7280')


def get_payment_method_icon(payment_method: str) -> str:
    """Get icon for payment method"""
    icons = {
        'mtn_momo': '📱',
        'airtel_money': '📱',
        'cash_on_delivery': '💵'
    }
    return icons.get(payment_method, '💳')


def validate_order_data(order_data: Dict) -> List[str]:
    """
    Validate order data and return list of errors
    """
    errors = []
    
    # Required fields
    required_fields = [
        'first_name', 'last_name', 'email', 'phone',
        'address_line_1', 'city', 'district', 'payment_method'
    ]
    
    for field in required_fields:
        if not order_data.get(field):
            errors.append(f"{field.replace('_', ' ').title()} is required")
    
    # Email validation
    email = order_data.get('email', '')
    if email and not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
        errors.append("Invalid email format")
    
    # Phone validation
    phone = order_data.get('phone', '')
    if phone and not validate_uganda_phone_number(phone):
        errors.append("Invalid Uganda phone number")
    
    # District validation
    district = order_data.get('district', '')
    if district and not validate_uganda_district(district):
        errors.append("Invalid Uganda district")
    
    # Payment method validation
    valid_payment_methods = ['mtn_momo', 'airtel_money', 'cash_on_delivery']
    payment_method = order_data.get('payment_method', '')
    if payment_method and payment_method not in valid_payment_methods:
        errors.append("Invalid payment method")
    
    return errors


def get_cached_order_stats(cache_key: str, calculation_func, timeout: int = 3600):
    """
    Get cached order statistics or calculate and cache
    """
    cached_data = cache.get(cache_key)
    
    if cached_data is None:
        cached_data = calculation_func()
        cache.set(cache_key, cached_data, timeout)
    
    return cached_data


def search_orders(query: str, user=None):
    """
    Search orders by various criteria
    """
    from .models import Order
    
    if not query:
        return Order.objects.none()
    
    # Build search filters
    search_filters = Q()
    
    # Search by order number
    search_filters |= Q(order_number__icontains=query)
    
    # Search by customer details
    search_filters |= Q(first_name__icontains=query)
    search_filters |= Q(last_name__icontains=query)
    search_filters |= Q(email__icontains=query)
    search_filters |= Q(phone__icontains=query)
    
    # Search by address
    search_filters |= Q(address_line_1__icontains=query)
    search_filters |= Q(city__icontains=query)
    search_filters |= Q(district__icontains=query)
    
    # Base queryset
    queryset = Order.objects.filter(search_filters)
    
    # Filter by user permissions
    if user and not user.is_admin:
        queryset = queryset.filter(user=user)
    
    return queryset.distinct()


def bulk_update_order_status(order_ids: List[str], new_status: str, user, notes: str = "") -> int:
    """
    Bulk update order status for multiple orders
    """
    from .models import Order, OrderStatusHistory
    
    # Validate status
    valid_statuses = dict(Order.STATUS_CHOICES).keys()
    if new_status not in valid_statuses:
        raise ValueError(f"Invalid status: {new_status}")
    
    orders = Order.objects.filter(id__in=order_ids)
    updated_count = 0
    
    for order in orders:
        old_status = order.status
        
        if old_status != new_status:
            order.status = new_status
            order.save()
            
            # Create status history
            OrderStatusHistory.objects.create(
                order=order,
                previous_status=old_status,
                new_status=new_status,
                changed_by=user,
                notes=notes or f"Bulk update: {old_status} → {new_status}"
            )
            
            updated_count += 1
    
    return updated_count


def get_order_timeline(order) -> List[Dict]:
    """
    Get order timeline with all status changes and events
    """
    timeline = []
    
    # Order created
    timeline.append({
        'event': 'Order Created',
        'status': 'pending',
        'timestamp': order.created_at,
        'description': f'Order {order.order_number} was created',
        'icon': '🛒',
        'user': order.user.get_full_name() if order.user else 'Guest'
    })
    
    # Status history
    for history in order.status_history.all():
        timeline.append({
            'event': f'Status Changed',
            'status': history.new_status,
            'timestamp': history.created_at,
            'description': f'Status changed from {history.previous_status} to {history.new_status}',
            'icon': get_status_icon(history.new_status),
            'user': history.changed_by.get_full_name() if history.changed_by else 'System',
            'notes': history.notes
        })
    
    # Payment events
    if order.payment_status == 'completed':
        timeline.append({
            'event': 'Payment Completed',
            'status': 'payment_completed',
            'timestamp': order.confirmed_at or order.created_at,
            'description': f'Payment completed via {order.get_payment_method_display()}',
            'icon': '💳',
            'user': 'System'
        })
    
    # COD verification
    if order.is_cash_on_delivery and hasattr(order, 'cod_verification'):
        cod_verification = order.cod_verification
        if cod_verification.verification_status == 'verified':
            timeline.append({
                'event': 'COD Verified',
                'status': 'cod_verified',
                'timestamp': cod_verification.verification_date,
                'description': 'Cash on Delivery order verified by admin',
                'icon': '✅',
                'user': cod_verification.verified_by.get_full_name() if cod_verification.verified_by else 'Admin'
            })
    
    # Sort by timestamp
    timeline.sort(key=lambda x: x['timestamp'])
    
    return timeline


def get_status_icon(status: str) -> str:
    """Get icon for order status"""
    icons = {
        'pending': '⏳',
        'confirmed': '✅',
        'processing': '🔄',
        'out_for_delivery': '🚚',
        'delivered': '📦',
        'cancelled': '❌',
        'refunded': '💰'
    }
    return icons.get(status, '📋')


def calculate_order_metrics(orders_queryset) -> Dict:
    """
    Calculate various metrics for a set of orders
    """
    from django.db.models import Sum, Avg, Count
    
    metrics = {
        'total_orders': orders_queryset.count(),
        'total_revenue': orders_queryset.aggregate(
            total=Sum('total_amount')
        )['total'] or Decimal('0.00'),
        'average_order_value': orders_queryset.aggregate(
            avg=Avg('total_amount')
        )['avg'] or Decimal('0.00'),
        'orders_by_status': dict(
            orders_queryset.values_list('status').annotate(Count('id'))
        ),
        'orders_by_payment_method': dict(
            orders_queryset.values_list('payment_method').annotate(Count('id'))
        ),
        'cod_orders': orders_queryset.filter(is_cash_on_delivery=True).count(),
        'mobile_money_orders': orders_queryset.filter(is_cash_on_delivery=False).count(),
        'flash_sale_orders': orders_queryset.filter(has_flash_sale_items=True).count(),
        'total_flash_savings': orders_queryset.aggregate(
            savings=Sum('flash_sale_savings')
        )['savings'] or Decimal('0.00'),
    }
    
    # Calculate percentages
    total = metrics['total_orders']
    if total > 0:
        metrics['cod_percentage'] = (metrics['cod_orders'] / total) * 100
        metrics['mobile_money_percentage'] = (metrics['mobile_money_orders'] / total) * 100
        metrics['flash_sale_percentage'] = (metrics['flash_sale_orders'] / total) * 100
    else:
        metrics['cod_percentage'] = 0
        metrics['mobile_money_percentage'] = 0
        metrics['flash_sale_percentage'] = 0
    
    return metrics


def export_orders_to_csv(orders_queryset, filename: str = None) -> str:
    """
    Export orders to CSV format
    """
    import csv
    import io
    from django.http import HttpResponse
    
    if filename is None:
        filename = f"orders_export_{timezone.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write headers
    headers = [
        'Order Number', 'Customer Name', 'Email', 'Phone',
        'Address', 'City', 'District', 'Total Amount',
        'Payment Method', 'Status', 'Created Date', 'Delivered Date'
    ]
    writer.writerow(headers)
    
    # Write data
    for order in orders_queryset:
        writer.writerow([
            order.order_number,
            order.get_customer_name(),
            order.email,
            order.phone,
            order.get_delivery_address(),
            order.city,
            order.district,
            float(order.total_amount),
            order.get_payment_method_display(),
            order.get_status_display(),
            order.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            order.delivered_at.strftime('%Y-%m-%d %H:%M:%S') if order.delivered_at else ''
        ])
    
    return output.getvalue()


def get_order_recommendations(user=None) -> Dict:
    """
    Get order-based recommendations for customers
    """
    from .models import Order, OrderItem
    from django.db.models import Count
    
    recommendations = {
        'popular_products': [],
        'trending_categories': [],
        'suggested_for_user': []
    }
    
    # Popular products based on orders
    popular_products = (
        OrderItem.objects
        .values('product_id', 'product_name')
        .annotate(order_count=Count('order'))
        .order_by('-order_count')[:10]
    )
    recommendations['popular_products'] = list(popular_products)
    
    # Trending categories
    trending_categories = (
        OrderItem.objects
        .exclude(product_category='')
        .values('product_category')
        .annotate(order_count=Count('order'))
        .order_by('-order_count')[:5]
    )
    recommendations['trending_categories'] = list(trending_categories)
    
    # User-specific recommendations
    if user and user.is_authenticated:
        user_orders = Order.objects.filter(user=user)
        if user_orders.exists():
            # Get categories user has ordered from
            user_categories = (
                OrderItem.objects
                .filter(order__user=user)
                .exclude(product_category='')
                .values_list('product_category', flat=True)
                .distinct()
            )
            
            # Find popular products in those categories
            suggested_products = (
                OrderItem.objects
                .filter(product_category__in=user_categories)
                .exclude(order__user=user)  # Exclude products user already ordered
                .values('product_id', 'product_name', 'product_category')
                .annotate(order_count=Count('order'))
                .order_by('-order_count')[:5]
            )
            recommendations['suggested_for_user'] = list(suggested_products)
    
    return recommendations


def notify_low_stock_from_order(product_id: str, current_stock: int):
    """
    Notify admins when product stock is low due to orders
    """
    if current_stock <= 5:  # Low stock threshold
        from .tasks import send_low_stock_alert
        send_low_stock_alert.delay(product_id, current_stock)


def validate_order_cancellation(order) -> tuple[bool, str]:
    """
    Validate if an order can be cancelled
    Returns (can_cancel, reason)
    """
    if order.status not in ['pending', 'confirmed']:
        return False, "Order cannot be cancelled at this stage"
    
    if order.status == 'confirmed' and order.confirmed_at:
        # Check if confirmed more than 2 hours ago
        time_since_confirmation = timezone.now() - order.confirmed_at
        if time_since_confirmation.total_seconds() > 7200:  # 2 hours
            return False, "Order has been confirmed for too long to cancel"
    
    return True, "Order can be cancelled"


def get_delivery_zones() -> Dict[str, List[str]]:
    """
    Get delivery zones for Uganda districts
    """
    return {
        'central': [
            'Kampala', 'Wakiso', 'Mpigi', 'Mukono', 'Entebbe',
            'Luweero', 'Nakaseke', 'Butambala', 'Gomba'
        ],
        'eastern': [
            'Jinja', 'Mbale', 'Soroti', 'Tororo', 'Busia',
            'Iganga', 'Kamuli', 'Pallisa', 'Sironko'
        ],
        'northern': [
            'Gulu', 'Lira', 'Arua', 'Kitgum', 'Moroto',
            'Kotido', 'Adjumani', 'Apac', 'Dokolo'
        ],
        'western': [
            'Mbarara', 'Fort Portal', 'Kasese', 'Kabale',
            'Hoima', 'Masindi', 'Bundibugyo', 'Bushenyi'
        ]
    }


def calculate_loyalty_points(order) -> int:
    """
    Calculate loyalty points for an order
    1 point per UGX 1,000 spent
    """
    if order.status == 'delivered':
        return int(order.total_amount / 1000)
    return 0


def get_order_summary_text(order) -> str:
    """
    Generate a summary text for an order (useful for SMS/notifications)
    """
    summary = f"Order {order.order_number}: "
    summary += f"{order.items.count()} items, "
    summary += f"Total: UGX {order.total_amount:,.0f}, "
    summary += f"Status: {order.get_status_display()}, "
    summary += f"Payment: {order.get_payment_method_display()}"
    
    if order.estimated_delivery:
        summary += f", Est. Delivery: {order.estimated_delivery.strftime('%Y-%m-%d')}"
    
    return summary


class OrderStatusTransition:
    """
    Helper class for managing order status transitions
    """
    
    VALID_TRANSITIONS = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['processing', 'cancelled'],
        'processing': ['out_for_delivery', 'cancelled'],
        'out_for_delivery': ['delivered', 'cancelled'],
        'delivered': ['refunded'],
        'cancelled': [],
        'refunded': []
    }
    
    @classmethod
    def can_transition(cls, current_status: str, new_status: str) -> bool:
        """Check if status transition is valid"""
        return new_status in cls.VALID_TRANSITIONS.get(current_status, [])
    
    @classmethod
    def get_next_statuses(cls, current_status: str) -> List[str]:
        """Get list of valid next statuses"""
        return cls.VALID_TRANSITIONS.get(current_status, [])
    
    @classmethod
    def get_status_description(cls, status: str) -> str:
        """Get human-readable status description"""
        descriptions = {
            'pending': 'Order received and awaiting confirmation',
            'confirmed': 'Order confirmed and being prepared',
            'processing': 'Order is being processed and packed',
            'out_for_delivery': 'Order is out for delivery',
            'delivered': 'Order has been delivered successfully',
            'cancelled': 'Order has been cancelled',
            'refunded': 'Order has been refunded'
        }
        return descriptions.get(status, 'Unknown status')


def log_order_event(order, event_type: str, description: str, user=None):
    """
    Log an order event for audit trail
    """
    import logging
    
    logger = logging.getLogger('orders.events')
    
    log_data = {
        'order_id': str(order.id),
        'order_number': order.order_number,
        'event_type': event_type,
        'description': description,
        'user': user.email if user else 'System',
        'timestamp': timezone.now().isoformat()
    }
    
    logger.info(f"Order Event: {log_data}")
    
    # Also cache recent events for quick access
    cache_key = f'order_events_{order.id}'
    recent_events = cache.get(cache_key, [])
    recent_events.append(log_data)
    
    # Keep only last 50 events
    if len(recent_events) > 50:
        recent_events = recent_events[-50:]
    
    cache.set(cache_key, recent_events, timeout=86400)  # 24 hours