# apps/flash_sales/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from .models import FlashSale, FlashSaleProduct


@receiver(post_save, sender=FlashSale)
def flash_sale_saved(sender, instance, created, **kwargs):
    """Handle flash sale save"""
    # Clear flash sales cache
    cache.delete_many([
        'active_flash_sales',
        'upcoming_flash_sales',
        f'flash_sale_{instance.id}'
    ])
    
    if created:
        # Log flash sale creation
        from apps.notifications.services.notification_service import NotificationService
        NotificationService.notify_admins(
            title="New Flash Sale Created",
            message=f"Flash sale '{instance.name}' has been created",
            flash_sale=instance
        )


@receiver(post_delete, sender=FlashSale)
def flash_sale_deleted(sender, instance, **kwargs):
    """Handle flash sale deletion"""
    # Clear cache
    cache.delete_many([
        'active_flash_sales',
        'upcoming_flash_sales',
        f'flash_sale_{instance.id}'
    ])


@receiver(post_save, sender=FlashSaleProduct)
def flash_sale_product_saved(sender, instance, created, **kwargs):
    """Handle flash sale product save"""
    # Clear related caches
    cache.delete_many([
        f'flash_sale_{instance.flash_sale.id}',
        f'product_{instance.product.id}_flash_sale'
    ])

