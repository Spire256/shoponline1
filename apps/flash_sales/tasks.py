# apps/flash_sales/tasks.py
from celery import shared_task
from django.utils import timezone
from django.core.cache import cache
from .models import FlashSale, FlashSaleProduct
from .services.flash_sale_service import FlashSaleService
from apps.notifications.services.notification_service import NotificationService


@shared_task
def cleanup_expired_flash_sales():
    """Celery task to cleanup expired flash sales"""
    updated_count = FlashSaleService.cleanup_expired_flash_sales()
    return f"Deactivated {updated_count} expired flash sales"


@shared_task
def notify_flash_sale_starting(flash_sale_id):
    """Notify admins when flash sale is starting"""
    try:
        flash_sale = FlashSale.objects.get(id=flash_sale_id)
        
        if flash_sale.is_running:
            NotificationService.notify_admins(
                title="Flash Sale Started",
                message=f"Flash sale '{flash_sale.name}' has started!",
                flash_sale=flash_sale
            )
            
            # Clear cache to ensure fresh data
            cache.delete_many([
                'active_flash_sales',
                'upcoming_flash_sales'
            ])
            
        return f"Notified flash sale start: {flash_sale.name}"
    except FlashSale.DoesNotExist:
        return f"Flash sale {flash_sale_id} not found"


@shared_task
def notify_flash_sale_ending_soon(flash_sale_id, minutes_before=30):
    """Notify admins when flash sale is ending soon"""
    try:
        flash_sale = FlashSale.objects.get(id=flash_sale_id)
        
        if flash_sale.is_running:
            time_remaining = flash_sale.time_remaining
            if time_remaining <= (minutes_before * 60):
                NotificationService.notify_admins(
                    title="Flash Sale Ending Soon",
                    message=f"Flash sale '{flash_sale.name}' ends in {minutes_before} minutes!",
                    flash_sale=flash_sale
                )
                
        return f"Checked flash sale ending notification: {flash_sale.name}"
    except FlashSale.DoesNotExist:
        return f"Flash sale {flash_sale_id} not found"


@shared_task
def update_flash_sale_analytics():
    """Update flash sale analytics data"""
    active_sales = FlashSale.objects.filter(
        is_active=True,
        start_time__lte=timezone.now(),
        end_time__gt=timezone.now()
    )
    
    updated_count = 0
    for flash_sale in active_sales:
        analytics = FlashSaleService.get_flash_sale_analytics(flash_sale)
        cache.set(f'flash_sale_analytics_{flash_sale.id}', analytics, 3600)
        updated_count += 1
    
    return f"Updated analytics for {updated_count} flash sales"

