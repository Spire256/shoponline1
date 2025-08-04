# apps/orders/signals.py

from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from django.core.cache import cache
import logging

from .models import Order, OrderItem, OrderStatusHistory, CODVerification
from .tasks import (
    send_order_confirmation_email,
    send_cod_admin_notification,
    send_status_update_notification
)

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Order)
def order_post_save_handler(sender, instance, created, **kwargs):
    """Handle order creation and updates"""
    
    if created:
        # New order created
        logger.info(f"New order created: {instance.order_number}")
        
        # Send confirmation email asynchronously
        send_order_confirmation_email.delay(str(instance.id))
        
        # Send COD notification to admins if applicable
        if instance.is_cash_on_delivery:
            send_cod_admin_notification.delay(str(instance.id))
        
        # Clear cache for order statistics
        cache.delete_many([
            'orders_stats_today',
            'orders_stats_week',
            'orders_stats_month',
            'pending_orders_count',
            'cod_orders_count'
        ])
        
        # Log order creation for analytics
        logger.info(
            f"Order {instance.order_number} created - "
            f"Customer: {instance.get_customer_name()}, "
            f"Total: UGX {instance.total_amount}, "
            f"Payment: {instance.payment_method}"
        )
    
    else:
        # Order updated
        logger.info(f"Order updated: {instance.order_number}")
        
        # Clear cache when order is updated
        cache.delete_many([
            f'order_{instance.id}',
            'orders_stats_today',
            'pending_orders_count'
        ])


@receiver(pre_save, sender=Order)
def order_pre_save_handler(sender, instance, **kwargs):
    """Handle order updates before saving"""
    
    if instance.pk:  # Only for existing orders
        try:
            old_instance = Order.objects.get(pk=instance.pk)
            
            # Track status changes
            if old_instance.status != instance.status:
                logger.info(
                    f"Order {instance.order_number} status changed: "
                    f"{old_instance.status} → {instance.status}"
                )
                
                # Send status update notification asynchronously
                send_status_update_notification.delay(str(instance.id), old_instance.status)
                
                # Special handling for delivered status
                if instance.status == 'delivered' and old_instance.status != 'delivered':
                    instance.delivered_at = timezone.now()
                    
                    # Complete COD payment if applicable
                    if instance.is_cash_on_delivery:
                        instance.payment_status = 'completed'
                
                # Special handling for confirmed status
                elif instance.status == 'confirmed' and old_instance.status != 'confirmed':
                    instance.confirmed_at = timezone.now()
                
                # Special handling for cancelled status
                elif instance.status == 'cancelled' and old_instance.status != 'cancelled':
                    instance.cancelled_at = timezone.now()
            
            # Track payment status changes
            if old_instance.payment_status != instance.payment_status:
                logger.info(
                    f"Order {instance.order_number} payment status changed: "
                    f"{old_instance.payment_status} → {instance.payment_status}"
                )
        
        except Order.DoesNotExist:
            # This shouldn't happen, but handle it gracefully
            pass


@receiver(post_save, sender=OrderItem)
def order_item_post_save_handler(sender, instance, created, **kwargs):
    """Handle order item creation and updates"""
    
    if created:
        logger.info(
            f"Order item created: {instance.product_name} x {instance.quantity} "
            f"for order {instance.order.order_number}"
        )
        
        # Update order totals if needed
        order = instance.order
        order.save()  # This will trigger recalculation in the order model
        
        # Clear product cache
        cache.delete(f'product_{instance.product_id}')


@receiver(post_delete, sender=OrderItem)
def order_item_post_delete_handler(sender, instance, **kwargs):
    """Handle order item deletion"""
    
    logger.info(
        f"Order item deleted: {instance.product_name} "
        f"from order {instance.order.order_number}"
    )
    
    # Restore stock when order item is deleted
    try:
        from apps.products.models import Product
        product = Product.objects.get(id=instance.product_id)
        product.stock_quantity += instance.quantity
        product.save(update_fields=['stock_quantity'])
        
        logger.info(f"Stock restored for product {instance.product_id}: +{instance.quantity}")
        
    except Product.DoesNotExist:
        logger.warning(f"Product {instance.product_id} not found for stock restoration")
    
    # Clear caches
    cache.delete_many([
        f'product_{instance.product_id}',
        f'order_{instance.order.id}'
    ])


@receiver(post_save, sender=OrderStatusHistory)
def order_status_history_post_save_handler(sender, instance, created, **kwargs):
    """Handle order status history creation"""
    
    if created:
        logger.info(
            f"Status history created for order {instance.order.order_number}: "
            f"{instance.previous_status} → {instance.new_status} "
            f"by {instance.changed_by.get_full_name() if instance.changed_by else 'System'}"
        )
        
        # Clear order cache
        cache.delete(f'order_{instance.order.id}_history')


@receiver(post_save, sender=CODVerification)
def cod_verification_post_save_handler(sender, instance, created, **kwargs):
    """Handle COD verification updates"""
    
    if created:
        logger.info(f"COD verification created for order {instance.order.order_number}")
    
    else:
        # COD verification updated
        logger.info(
            f"COD verification updated for order {instance.order.order_number}: "
            f"Status - {instance.verification_status}"
        )
        
        # If verification is completed, update the order
        if instance.verification_status == 'verified':
            order = instance.order
            order.cod_verified = True
            order.save(update_fields=['cod_verified'])
        
        # Clear cache
        cache.delete_many([
            f'order_{instance.order.id}',
            'cod_orders_pending',
            'cod_orders_count'
        ])


# Custom signal for order analytics
from django.dispatch import Signal

order_analytics_update = Signal()


@receiver(order_analytics_update)
def update_order_analytics_cache(sender, **kwargs):
    """Update order analytics cache"""
    
    # Clear all analytics caches
    cache_keys = [
        'orders_analytics_today',
        'orders_analytics_week',
        'orders_analytics_month',
        'orders_by_status',
        'orders_by_payment_method',
        'orders_by_district',
        'revenue_analytics',
        'flash_sale_analytics'
    ]
    
    cache.delete_many(cache_keys)
    logger.info("Order analytics cache cleared")


# Signal to track product popularity based on orders
@receiver(post_save, sender=OrderItem)
def track_product_popularity(sender, instance, created, **kwargs):
    """Track product popularity for analytics"""
    
    if created:
        # Increment product order count in cache
        cache_key = f'product_orders_{instance.product_id}'
        current_count = cache.get(cache_key, 0)
        cache.set(cache_key, current_count + instance.quantity, timeout=86400)  # 24 hours
        
        # Track flash sale item popularity
        if instance.is_flash_sale_item:
            flash_cache_key = f'flash_sale_orders_{instance.product_id}'
            flash_count = cache.get(flash_cache_key, 0)
            cache.set(flash_cache_key, flash_count + instance.quantity, timeout=86400)


# Signal for automatic order status progression
@receiver(post_save, sender=Order)
def auto_progress_order_status(sender, instance, created, **kwargs):
    """Automatically progress order status based on certain conditions"""
    
    if not created:  # Only for updates, not new orders
        
        # Auto-progress from confirmed to processing for mobile money orders
        if (instance.status == 'confirmed' and 
            instance.payment_status == 'completed' and 
            not instance.is_cash_on_delivery):
            
            from datetime import timedelta
            
            # Check if order was confirmed more than 2 hours ago
            if (instance.confirmed_at and 
                timezone.now() - instance.confirmed_at > timedelta(hours=2)):
                
                instance.status = 'processing'
                instance.save(update_fields=['status'])
                
                logger.info(f"Order {instance.order_number} auto-progressed to processing")


# Signal for low stock alerts when orders reduce inventory
@receiver(post_save, sender=OrderItem)
def check_low_stock_alert(sender, instance, created, **kwargs):
    """Check for low stock and send alerts"""
    
    if created:
        try:
            from apps.products.models import Product
            product = Product.objects.get(id=instance.product_id)
            
            # Check if stock is below threshold (e.g., 5 units)
            low_stock_threshold = 5
            
            if product.stock_quantity <= low_stock_threshold:
                # Send low stock alert
                from .tasks import send_low_stock_alert
                send_low_stock_alert.delay(str(product.id), product.stock_quantity)
                
                logger.warning(
                    f"Low stock alert: Product {product.name} has {product.stock_quantity} units left"
                )
        
        except Product.DoesNotExist:
            pass


# Signal for order fraud detection
@receiver(post_save, sender=Order)
def fraud_detection_check(sender, instance, created, **kwargs):
    """Basic fraud detection for new orders"""
    
    if created:
        suspicious_flags = []
        
        # Check for multiple orders from same email in short time
        from datetime import timedelta
        recent_orders = Order.objects.filter(
            email=instance.email,
            created_at__gte=timezone.now() - timedelta(hours=1)
        ).count()
        
        if recent_orders > 3:
            suspicious_flags.append("Multiple orders from same email within 1 hour")
        
        # Check for unusually large order value
        if instance.total_amount > 1000000:  # UGX 1M
            suspicious_flags.append("Unusually large order value")
        
        # Check for many items in single order
        if instance.items.count() > 20:
            suspicious_flags.append("Large number of items in single order")
        
        # Log suspicious activity
        if suspicious_flags:
            logger.warning(
                f"Suspicious order detected: {instance.order_number} - "
                f"Flags: {', '.join(suspicious_flags)}"
            )
            
            # Add admin note
            from .models import OrderNote
            OrderNote.objects.create(
                order=instance,
                note_type='system',
                note=f"Fraud detection flags: {', '.join(suspicious_flags)}",
                is_internal=True
            )


# Signal for order completion rewards/loyalty points
@receiver(post_save, sender=Order)
def award_loyalty_points(sender, instance, created, **kwargs):
    """Award loyalty points when order is completed"""
    
    if not created and instance.status == 'delivered':
        try:
            old_instance = Order.objects.get(pk=instance.pk)
            
            # Only award points once when status changes to delivered
            if old_instance.status != 'delivered' and instance.user:
                # Calculate points (1 point per UGX 1000 spent)
                points = int(instance.total_amount / 1000)
                
                # Award points to user (assuming you have a loyalty system)
                # This would integrate with a separate loyalty app
                logger.info(f"Awarded {points} loyalty points to user {instance.user.email}")
                
                # Cache the points for quick access
                cache_key = f'user_points_{instance.user.id}'
                current_points = cache.get(cache_key, 0)
                cache.set(cache_key, current_points + points, timeout=86400)
        
        except Order.DoesNotExist:
            pass


# Signal for inventory management integration
@receiver(post_save, sender=OrderItem)
def update_inventory_system(sender, instance, created, **kwargs):
    """Update external inventory management system"""
    
    if created:
        # This could integrate with an external inventory management system
        # For now, we'll just log the inventory change
        logger.info(
            f"Inventory update: Product {instance.product_id} "
            f"quantity reduced by {instance.quantity} "
            f"due to order {instance.order.order_number}"
        )
        
        # Clear product analytics cache
        cache.delete_many([
            f'product_analytics_{instance.product_id}',
            'products_low_stock',
            'inventory_summary'
        ])


# Signal for order export/reporting
@receiver(post_save, sender=Order)
def trigger_order_export(sender, instance, created, **kwargs):
    """Trigger order data export for external systems"""
    
    if created:
        # Schedule order export to external systems (ERP, accounting, etc.)
        from .tasks import export_order_to_external_systems
        export_order_to_external_systems.delay(str(instance.id))


# Cleanup signals
@receiver(post_delete, sender=Order)
def order_cleanup_handler(sender, instance, **kwargs):
    """Clean up related data when order is deleted"""
    
    logger.info(f"Order deleted: {instance.order_number}")
    
    # Clear all related caches
    cache.delete_many([
        f'order_{instance.id}',
        f'order_{instance.id}_history',
        'orders_stats_today',
        'orders_stats_week',
        'orders_stats_month'
    ])
    
    # Restore stock for all items (safety measure)
    for item in instance.items.all():
        try:
            from apps.products.models import Product
            product = Product.objects.get(id=item.product_id)
            product.stock_quantity += item.quantity
            product.save(update_fields=['stock_quantity'])
        except Product.DoesNotExist:
            pass