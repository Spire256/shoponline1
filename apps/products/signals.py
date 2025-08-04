"""
Products App Signals
Signal handlers for product-related events and automatic updates
"""

import os
from django.db.models.signals import post_save, pre_delete, post_delete, pre_save
from django.dispatch import receiver
from django.core.cache import cache
from django.utils import timezone
from django.db import transaction

from .models import Product, ProductImage, ProductAttribute, ProductVariant


@receiver(pre_save, sender=Product)
def product_pre_save(sender, instance, **kwargs):
    """
    Handle product pre-save operations
    """
    # Set published_at timestamp when status changes to published
    if instance.status == 'published' and not instance.published_at:
        instance.published_at = timezone.now()
    
    # Clear published_at if status changes from published
    if instance.status != 'published' and instance.published_at:
        instance.published_at = None
    
    # Ensure featured products are active
    if instance.is_featured and not instance.is_active:
        instance.is_active = True
    
    # Auto-generate short description if empty
    if not instance.short_description and instance.description:
        # Take first 200 characters of description
        instance.short_description = instance.description[:200]
        if len(instance.description) > 200:
            instance.short_description += '...'


@receiver(post_save, sender=Product)
def product_post_save(sender, instance, created, **kwargs):
    """
    Handle product post-save operations
    """
    # Clear related caches
    cache_keys_to_clear = [
        f'product_{instance.id}',
        f'product_slug_{instance.slug}',
        'featured_products',
        f'category_{instance.category.id}_products',
        'product_stats',
        'recent_products'
    ]
    
    cache.delete_many(cache_keys_to_clear)
    
    # Clear category-specific caches
    cache.delete_many([
        f'category_{instance.category.id}_product_count',
        f'category_{instance.category.slug}_products'
    ])
    
    # If this is a new product and it's featured, clear featured products cache
    if created and instance.is_featured:
        cache.delete('featured_products_homepage')
    
    # Create initial product attributes for certain categories (if needed)
    if created:
        _create_default_attributes(instance)
    
    # Log product creation/update for analytics
    if created:
        _log_product_creation(instance)
    else:
        _log_product_update(instance)


@receiver(pre_delete, sender=Product)
def product_pre_delete(sender, instance, **kwargs):
    """
    Handle product pre-delete operations
    """
    # Store product info for cleanup after deletion
    instance._cleanup_data = {
        'id': instance.id,
        'slug': instance.slug,
        'category_id': instance.category.id,
        'image_files': [img.image.path for img in instance.images.all() if img.image]
    }


@receiver(post_delete, sender=Product)
def product_post_delete(sender, instance, **kwargs):
    """
    Handle product post-delete operations
    """
    cleanup_data = getattr(instance, '_cleanup_data', {})
    
    # Clear caches
    cache_keys_to_clear = [
        f'product_{cleanup_data.get("id")}',
        f'product_slug_{cleanup_data.get("slug")}',
        'featured_products',
        f'category_{cleanup_data.get("category_id")}_products',
        'product_stats',
        'recent_products'
    ]
    
    cache.delete_many(cache_keys_to_clear)
    
    # Clean up orphaned image files
    for file_path in cleanup_data.get('image_files', []):
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass  # File might already be deleted or permission issue
    
    # Log product deletion
    _log_product_deletion(cleanup_data)


@receiver(post_save, sender=ProductImage)
def product_image_post_save(sender, instance, created, **kwargs):
    """
    Handle product image post-save operations
    """
    # Clear product caches when images are updated
    cache_keys_to_clear = [
        f'product_{instance.product.id}',
        f'product_slug_{instance.product.slug}'
    ]
    cache.delete_many(cache_keys_to_clear)
    
    # If this is the first image for the product, make it main
    if created:
        product_images_count = ProductImage.objects.filter(
            product=instance.product
        ).count()
        
        if product_images_count == 1:
            instance.is_main = True
            instance.save(update_fields=['is_main'])
    
    # Update product's updated_at timestamp
    instance.product.save(update_fields=['updated_at'])


@receiver(post_delete, sender=ProductImage)
def product_image_post_delete(sender, instance, **kwargs):
    """
    Handle product image post-delete operations
    """
    # Delete physical image files
    if instance.image:
        if os.path.exists(instance.image.path):
            try:
                os.remove(instance.image.path)
            except OSError:
                pass
    
    if instance.thumbnail:
        if os.path.exists(instance.thumbnail.path):
            try:
                os.remove(instance.thumbnail.path)
            except OSError:
                pass
    
    # Clear product caches
    cache_keys_to_clear = [
        f'product_{instance.product.id}',
        f'product_slug_{instance.product.slug}'
    ]
    cache.delete_many(cache_keys_to_clear)
    
    # If deleted image was main, assign new main image
    if instance.is_main:
        next_image = ProductImage.objects.filter(
            product=instance.product
        ).first()
        
        if next_image:
            next_image.is_main = True
            next_image.save(update_fields=['is_main'])
    
    # Update product's updated_at timestamp
    try:
        instance.product.save(update_fields=['updated_at'])
    except Product.DoesNotExist:
        pass  # Product might have been deleted


@receiver(post_save, sender=ProductAttribute)
def product_attribute_post_save(sender, instance, created, **kwargs):
    """
    Handle product attribute post-save operations
    """
    # Clear product caches
    cache_keys_to_clear = [
        f'product_{instance.product.id}',
        f'product_slug_{instance.product.slug}'
    ]
    cache.delete_many(cache_keys_to_clear)
    
    # Update product's updated_at timestamp
    instance.product.save(update_fields=['updated_at'])


@receiver(post_delete, sender=ProductAttribute)
def product_attribute_post_delete(sender, instance, **kwargs):
    """
    Handle product attribute post-delete operations
    """
    # Clear product caches
    cache_keys_to_clear = [
        f'product_{instance.product.id}',
        f'product_slug_{instance.product.slug}'
    ]
    cache.delete_many(cache_keys_to_clear)
    
    # Update product's updated_at timestamp
    try:
        instance.product.save(update_fields=['updated_at'])
    except Product.DoesNotExist:
        pass


@receiver(post_save, sender=ProductVariant)
def product_variant_post_save(sender, instance, created, **kwargs):
    """
    Handle product variant post-save operations
    """
    # Clear product caches
    cache_keys_to_clear = [
        f'product_{instance.product.id}',
        f'product_slug_{instance.product.slug}'
    ]
    cache.delete_many(cache_keys_to_clear)
    
    # Update product's updated_at timestamp
    instance.product.save(update_fields=['updated_at'])
    
    # Update parent product's stock if needed
    if instance.product.track_inventory:
        _update_parent_product_stock(instance.product)


@receiver(post_delete, sender=ProductVariant)
def product_variant_post_delete(sender, instance, **kwargs):
    """
    Handle product variant post-delete operations
    """
    # Clear product caches
    cache_keys_to_clear = [
        f'product_{instance.product.id}',
        f'product_slug_{instance.product.slug}'
    ]
    cache.delete_many(cache_keys_to_clear)
    
    # Update product's updated_at timestamp
    try:
        instance.product.save(update_fields=['updated_at'])
        
        # Update parent product's stock if needed
        if instance.product.track_inventory:
            _update_parent_product_stock(instance.product)
    except Product.DoesNotExist:
        pass


def _create_default_attributes(product):
    """
    Create default attributes for certain product categories
    """
    # This can be customized based on category requirements
    default_attributes = {
        'electronics': [
            {'name': 'Warranty', 'value': '1 Year'},
            {'name': 'Brand', 'value': product.brand or 'Unknown'},
        ],
        'clothing': [
            {'name': 'Material', 'value': product.material or 'Cotton'},
            {'name': 'Care Instructions', 'value': 'Machine wash cold'},
        ],
        'books': [
            {'name': 'Language', 'value': 'English'},
            {'name': 'Format', 'value': 'Paperback'},
        ]
    }
    
    category_slug = product.category.slug.lower()
    
    # Check if category matches any default attribute sets
    for category_key, attributes in default_attributes.items():
        if category_key in category_slug:
            for index, attr_data in enumerate(attributes):
                ProductAttribute.objects.get_or_create(
                    product=product,
                    name=attr_data['name'],
                    defaults={
                        'value': attr_data['value'],
                        'position': index
                    }
                )
            break


def _update_parent_product_stock(product):
    """
    Update parent product stock based on variants
    """
    if product.variants.exists():
        total_variant_stock = sum(
            variant.stock_quantity 
            for variant in product.variants.filter(is_active=True)
        )
        
        # Update parent product stock to sum of variants
        if product.stock_quantity != total_variant_stock:
            product.stock_quantity = total_variant_stock
            product.save(update_fields=['stock_quantity'])


def _log_product_creation(product):
    """
    Log product creation for analytics
    """
    # This would integrate with your logging/analytics system
    pass


def _log_product_update(product):
    """
    Log product update for analytics
    """
    # This would integrate with your logging/analytics system
    pass


def _log_product_deletion(cleanup_data):
    """
    Log product deletion for analytics
    """
    # This would integrate with your logging/analytics system
    pass


# Cache warming signals
@receiver(post_save, sender=Product)
def warm_product_cache(sender, instance, created, **kwargs):
    """
    Warm up frequently accessed caches after product changes
    """
    if not created:  # Only for updates, not creation
        # Warm up product detail cache
        from django.core.cache import cache
        cache.set(
            f'product_{instance.id}',
            instance,
            timeout=3600  # 1 hour
        )
        
        # If product is featured, warm up featured products cache
        if instance.is_featured and instance.is_active:
            from .models import Product
            featured_products = Product.objects.filter(
                is_featured=True,
                is_active=True,
                status='published'
            )[:10]
            
            cache.set(
                'featured_products_homepage',
                featured_products,
                timeout=1800  # 30 minutes
            )