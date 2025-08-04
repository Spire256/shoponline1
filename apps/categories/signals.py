# apps/categories/signals.py

from django.db.models.signals import post_save, post_delete, pre_delete
from django.dispatch import receiver
from django.core.cache import cache
from django.core.files.storage import default_storage
from .models import Category
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Category)
def category_post_save(sender, instance, created, **kwargs):
    """
    Handle category post-save operations
    """
    try:
        # Clear cache
        clear_category_cache()
        
        # Log the action
        action = "created" if created else "updated"
        logger.info(f"Category '{instance.name}' {action}")
        
        # Update parent category's subcategory count cache if applicable
        if instance.parent:
            cache.delete(f"category_subcategory_count_{instance.parent.id}")
        
        # Clear homepage cache if category is featured
        if instance.featured:
            cache.delete('homepage_featured_categories')
            cache.delete('homepage_content')

    except Exception as e:
        logger.error(f"Error in category post_save signal: {str(e)}")


@receiver(pre_delete, sender=Category)
def category_pre_delete(sender, instance, **kwargs):
    """
    Handle category pre-delete operations
    """
    try:
        # Store category info for logging
        instance._category_name = instance.name
        instance._parent_id = instance.parent_id if instance.parent else None
        
        # Check if category can be deleted
        if not instance.can_be_deleted():
            logger.warning(f"Attempt to delete category '{instance.name}' with existing products or subcategories")

    except Exception as e:
        logger.error(f"Error in category pre_delete signal: {str(e)}")


@receiver(post_delete, sender=Category)
def category_post_delete(sender, instance, **kwargs):
    """
    Handle category post-delete operations
    """
    try:
        # Clear cache
        clear_category_cache()
        
        # Delete category image if it exists
        if hasattr(instance, 'image') and instance.image:
            try:
                if default_storage.exists(instance.image.name):
                    default_storage.delete(instance.image.name)
                    logger.info(f"Deleted image for category '{instance._category_name}'")
            except Exception as e:
                logger.warning(f"Failed to delete image for category '{instance._category_name}': {str(e)}")
        
        # Update parent category's subcategory count cache
        if hasattr(instance, '_parent_id') and instance._parent_id:
            cache.delete(f"category_subcategory_count_{instance._parent_id}")
        
        # Log the deletion
        logger.info(f"Category '{instance._category_name}' deleted")
        
        # Clear homepage cache if category was featured
        cache.delete('homepage_featured_categories')
        cache.delete('homepage_content')

    except Exception as e:
        logger.error(f"Error in category post_delete signal: {str(e)}")


def clear_category_cache():
    """
    Clear all category-related cache
    """
    try:
        cache_keys = [
            'categories_list',
            'category_tree',
            'featured_categories',
            'root_categories',
            'category_stats'
        ]
        
        # Clear specific cache keys
        for key in cache_keys:
            cache.delete(key)
        
        # Clear pattern-based cache keys
        try:
            # This would require a cache backend that supports pattern deletion
            # For Redis: cache.delete_pattern('category_*')
            # For now, we'll clear known patterns
            pass
        except AttributeError:
            # Fallback for cache backends that don't support pattern deletion
            pass
        
        logger.debug("Category cache cleared")

    except Exception as e:
        logger.warning(f"Failed to clear category cache: {str(e)}")


# Signal to handle product changes that affect category statistics
@receiver(post_save, sender='products.Product')
def product_category_update(sender, instance, created, **kwargs):
    """
    Handle product changes that affect category statistics
    """
    try:
        if instance.category:
            # Clear category product count cache
            cache.delete(f"category_product_count_{instance.category.id}")
            
            # Clear parent categories' product count cache
            current = instance.category.parent
            while current:
                cache.delete(f"category_product_count_{current.id}")
                current = current.parent
            
            # Clear category stats cache
            cache.delete('category_stats')

    except Exception as e:
        logger.error(f"Error in product category update signal: {str(e)}")


@receiver(post_delete, sender='products.Product')
def product_category_delete(sender, instance, **kwargs):
    """
    Handle product deletion that affects category statistics
    """
    try:
        if instance.category:
            # Clear category product count cache
            cache.delete(f"category_product_count_{instance.category.id}")
            
            # Clear parent categories' product count cache
            current = instance.category.parent
            while current:
                cache.delete(f"category_product_count_{current.id}")
                current = current.parent
            
            # Clear category stats cache
            cache.delete('category_stats')

    except Exception as e:
        logger.error(f"Error in product category delete signal: {str(e)}")