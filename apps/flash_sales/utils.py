# apps/flash_sales/utils.py
from django.utils import timezone
from decimal import Decimal


def calculate_flash_sale_price(original_price, discount_percentage, max_discount=None):
    """Calculate flash sale price with optional maximum discount"""
    discount_amount = (original_price * discount_percentage) / 100
    
    if max_discount:
        discount_amount = min(discount_amount, max_discount)
    
    flash_price = original_price - discount_amount
    return max(flash_price, Decimal('0.00'))


def format_currency(amount, currency='UGX'):
    """Format currency amount for display"""
    if currency == 'UGX':
        return f"UGX {amount:,.0f}"
    return f"{currency} {amount:,.2f}"


def get_flash_sale_badge_text(flash_sale):
    """Get appropriate badge text for flash sale"""
    if flash_sale.is_running:
        return "FLASH SALE"
    elif flash_sale.is_upcoming:
        return "COMING SOON"
    else:
        return "ENDED"


def validate_flash_sale_overlap(start_time, end_time, exclude_id=None):
    """Check for overlapping flash sales"""
    from .models import FlashSale
    from django.db.models import Q
    
    query = Q(
        start_time__lt=end_time,
        end_time__gt=start_time,
        is_active=True
    )
    
    if exclude_id:
        query &= ~Q(id=exclude_id)
    
    return FlashSale.objects.filter(query).exists()
