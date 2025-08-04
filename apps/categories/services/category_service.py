# apps/categories/services/category_service.py

from django.db import transaction
from django.db.models import Q, Count, Avg
from django.core.exceptions import ValidationError
from django.utils import timezone
from ..models import Category
import logging

logger = logging.getLogger(__name__)


class CategoryService:
    """
    Service class for category business logic
    """

    @staticmethod
    @transaction.atomic
    def create_category(user, **validated_data):
        """
        Create a new category with validation
        """
        try:
            # Extract and validate data
            name = validated_data['name']
            parent = validated_data.get('parent')
            
            # Additional business logic validation
            if parent and parent.subcategories.count() >= 20:
                raise ValidationError("Parent category cannot have more than 20 subcategories")
            
            # Create category
            category = Category.objects.create(**validated_data)
            
            logger.info(f"Category '{name}' created by user {user.email}")
            return category

        except Exception as e:
            logger.error(f"Error creating category: {str(e)}")
            raise ValidationError(f"Failed to create category: {str(e)}")

    @staticmethod
    @transaction.atomic
    def update_category(category, user, **validated_data):
        """
        Update an existing category
        """
        try:
            old_name = category.name
            
            # Update category fields
            for field, value in validated_data.items():
                setattr(category, field, value)
            
            category.save()
            
            logger.info(f"Category '{old_name}' updated by user {user.email}")
            return category

        except Exception as e:
            logger.error(f"Error updating category: {str(e)}")
            raise ValidationError(f"Failed to update category: {str(e)}")

    @staticmethod
    @transaction.atomic
    def delete_category(category, user):
        """
        Delete a category with proper validation
        """
        try:
            if not category.can_be_deleted():
                raise ValidationError(
                    "Cannot delete category with existing products or subcategories"
                )
            
            category_name = category.name
            category.delete()
            
            logger.info(f"Category '{category_name}' deleted by user {user.email}")

        except Exception as e:
            logger.error(f"Error deleting category: {str(e)}")
            raise ValidationError(f"Failed to delete category: {str(e)}")

    @staticmethod
    @transaction.atomic
    def bulk_action(category_ids, action, user):
        """
        Perform bulk actions on multiple categories
        """
        try:
            categories = Category.objects.filter(id__in=category_ids)
            updated_count = 0
            errors = []

            for category in categories:
                try:
                    if action == 'activate':
                        category.is_active = True
                        category.save()
                        updated_count += 1
                    
                    elif action == 'deactivate':
                        category.is_active = False
                        category.save()
                        updated_count += 1
                    
                    elif action == 'feature':
                        category.featured = True
                        category.save()
                        updated_count += 1
                    
                    elif action == 'unfeature':
                        category.featured = False
                        category.save()
                        updated_count += 1
                    
                    elif action == 'delete':
                        if category.can_be_deleted():
                            category.delete()
                            updated_count += 1
                        else:
                            errors.append(f"Cannot delete {category.name} - has products or subcategories")

                except Exception as e:
                    errors.append(f"Error processing {category.name}: {str(e)}")

            result = {
                'success': True,
                'updated_count': updated_count,
                'total_count': len(category_ids),
                'errors': errors
            }

            logger.info(f"Bulk action '{action}' performed by user {user.email}: {updated_count}/{len(category_ids)} categories processed")
            return result

        except Exception as e:
            logger.error(f"Error performing bulk action: {str(e)}")
            raise ValidationError(f"Failed to perform bulk action: {str(e)}")

    @staticmethod
    def search_categories(**filters):
        """
        Advanced category search with filters
        """
        try:
            queryset = Category.objects.all()

            # Apply filters
            search_term = filters.get('q')
            if search_term:
                queryset = queryset.filter(
                    Q(name__icontains=search_term) |
                    Q(description__icontains=search_term)
                )

            parent = filters.get('parent')
            if parent:
                queryset = queryset.filter(parent_id=parent)

            featured = filters.get('featured')
            if featured is not None:
                queryset = queryset.filter(featured=featured)

            is_active = filters.get('is_active')
            if is_active is not None:
                queryset = queryset.filter(is_active=is_active)

            # Apply sorting
            sort_by = filters.get('sort_by', 'sort_order')
            if sort_by == 'product_count':
                queryset = queryset.annotate(
                    product_count=Count('products', filter=Q(products__is_active=True))
                ).order_by('-product_count')
            else:
                queryset = queryset.order_by(sort_by)

            return queryset.select_related('parent').prefetch_related('subcategories')

        except Exception as e:
            logger.error(f"Error searching categories: {str(e)}")
            return Category.objects.none()

    @staticmethod
    def get_category_stats():
        """
        Get comprehensive category statistics
        """
        try:
            from apps.products.models import Product
            
            # Basic counts
            total_categories = Category.objects.count()
            active_categories = Category.objects.filter(is_active=True).count()
            featured_categories = Category.objects.filter(featured=True).count()
            root_categories = Category.objects.filter(parent=None).count()

            # Category depth analysis
            max_depth = CategoryService._calculate_max_depth()
            
            # Product distribution
            categories_with_products = Category.objects.annotate(
                product_count=Count('products', filter=Q(products__is_active=True))
            ).filter(product_count__gt=0).count()

            empty_categories = total_categories - categories_with_products

            # Top categories by product count
            top_categories = Category.objects.annotate(
                product_count=Count('products', filter=Q(products__is_active=True))
            ).filter(product_count__gt=0).order_by('-product_count')[:5]

            top_categories_data = [
                {
                    'id': cat.id,
                    'name': cat.name,
                    'product_count': cat.product_count
                }
                for cat in top_categories
            ]

            # Recent activity
            recent_categories = Category.objects.filter(
                created_at__gte=timezone.now() - timezone.timedelta(days=30)
            ).count()

            stats = {
                'overview': {
                    'total_categories': total_categories,
                    'active_categories': active_categories,
                    'featured_categories': featured_categories,
                    'root_categories': root_categories,
                    'inactive_categories': total_categories - active_categories
                },
                'structure': {
                    'max_depth': max_depth,
                    'categories_with_products': categories_with_products,
                    'empty_categories': empty_categories
                },
                'top_categories': top_categories_data,
                'recent_activity': {
                    'new_categories_this_month': recent_categories
                }
            }

            return stats

        except Exception as e:
            logger.error(f"Error getting category stats: {str(e)}")
            return {'error': 'Failed to retrieve statistics'}

    @staticmethod
    def _calculate_max_depth():
        """
        Calculate the maximum depth of category hierarchy
        """
        try:
            max_depth = 0
            root_categories = Category.objects.filter(parent=None)

            def get_depth(category, current_depth=1):
                nonlocal max_depth
                max_depth = max(max_depth, current_depth)
                
                for subcategory in category.subcategories.all():
                    get_depth(subcategory, current_depth + 1)

            for root_category in root_categories:
                get_depth(root_category)

            return max_depth

        except Exception as e:
            logger.error(f"Error calculating category depth: {str(e)}")
            return 0

    @staticmethod
    def reorder_categories(category_orders, user):
        """
        Reorder categories based on provided order data
        """
        try:
            with transaction.atomic():
                for order_data in category_orders:
                    category_id = order_data['id']
                    new_order = order_data['sort_order']
                    
                    Category.objects.filter(id=category_id).update(sort_order=new_order)

                logger.info(f"Categories reordered by user {user.email}")
                return {'success': True, 'message': 'Categories reordered successfully'}

        except Exception as e:
            logger.error(f"Error reordering categories: {str(e)}")
            raise ValidationError(f"Failed to reorder categories: {str(e)}")

    @staticmethod
    def get_category_hierarchy(category):
        """
        Get complete hierarchy information for a category
        """
        try:
            # Get ancestors
            ancestors = []
            current = category.parent
            while current:
                ancestors.append({
                    'id': current.id,
                    'name': current.name,
                    'slug': current.slug
                })
                current = current.parent
            ancestors.reverse()

            # Get descendants
            descendants = CategoryService._get_all_descendants(category)

            # Get siblings
            if category.parent:
                siblings = category.parent.subcategories.exclude(id=category.id)
            else:
                siblings = Category.objects.filter(parent=None).exclude(id=category.id)

            siblings_data = [
                {
                    'id': sibling.id,
                    'name': sibling.name,
                    'slug': sibling.slug
                }
                for sibling in siblings
            ]

            return {
                'ancestors': ancestors,
                'descendants': descendants,
                'siblings': siblings_data
            }

        except Exception as e:
            logger.error(f"Error getting category hierarchy: {str(e)}")
            return {'ancestors': [], 'descendants': [], 'siblings': []}

    @staticmethod
    def _get_all_descendants(category):
        """
        Recursively get all descendants of a category
        """
        descendants = []
        
        def collect_descendants(cat, level=1):
            for subcategory in cat.subcategories.all():
                descendants.append({
                    'id': subcategory.id,
                    'name': subcategory.name,
                    'slug': subcategory.slug,
                    'level': level
                })
                collect_descendants(subcategory, level + 1)
        
        collect_descendants(category)
        return descendants

    @staticmethod
    def validate_category_move(category, new_parent):
        """
        Validate if a category can be moved to a new parent
        """
        try:
            # Prevent self-referencing
            if new_parent == category:
                return False, "Category cannot be its own parent"

            # Prevent circular references
            current = new_parent
            while current:
                if current == category:
                    return False, "Moving category would create circular reference"
                current = current.parent

            # Check depth limits (max 5 levels)
            depth = 1
            current = new_parent
            while current:
                depth += 1
                current = current.parent
                if depth > 5:
                    return False, "Category hierarchy cannot exceed 5 levels"

            return True, "Move is valid"

        except Exception as e:
            logger.error(f"Error validating category move: {str(e)}")
            return False, "Validation failed"