"""
Product Service
Business logic for product operations, analytics, and complex queries
"""

import csv
from decimal import Decimal
from datetime import datetime, timedelta
from django.db import transaction, models
from django.db.models import Q, Count, Sum, Avg, F, Max, Min
from django.core.cache import cache
from django.utils import timezone
from django.contrib.auth import get_user_model

from ..models import Product, ProductImage, ProductAttribute, ProductVariant
from apps.categories.models import Category

User = get_user_model()


class ProductService:
    """Service class for product-related business logic"""
    
    @staticmethod
    def increment_view_count(product):
        """
        Increment product view count efficiently
        """
        Product.objects.filter(id=product.id).update(
            view_count=F('view_count') + 1
        )
    
    @staticmethod
    def search_products(queryset, query):
        """
        Advanced product search with ranking
        """
        if not query:
            return queryset
        
        # Split query into terms
        terms = query.lower().split()
        
        # Build search query with relevance ranking
        search_query = Q()
        
        for term in terms:
            term_query = (
                Q(name__icontains=term) |
                Q(description__icontains=term) |
                Q(short_description__icontains=term) |
                Q(tags__icontains=term) |
                Q(brand__icontains=term) |
                Q(category__name__icontains=term) |
                Q(sku__icontains=term)
            )
            search_query &= term_query
        
        # Apply search and add relevance annotations
        results = queryset.filter(search_query).annotate(
            # Simple relevance scoring
            name_match=models.Case(
                models.When(name__icontains=query, then=models.Value(10)),
                default=models.Value(0),
                output_field=models.IntegerField()
            ),
            exact_name_match=models.Case(
                models.When(name__iexact=query, then=models.Value(20)),
                default=models.Value(0),
                output_field=models.IntegerField()
            ),
            brand_match=models.Case(
                models.When(brand__icontains=query, then=models.Value(5)),
                default=models.Value(0),
                output_field=models.IntegerField()
            ),
            relevance_score=F('exact_name_match') + F('name_match') + F('brand_match')
        ).order_by('-relevance_score', '-view_count', 'name')
        
        return results.distinct()
    
    @staticmethod
    def bulk_update_products(bulk_data):
        """
        Perform bulk operations on products
        """
        product_ids = bulk_data['product_ids']
        action = bulk_data['action']
        
        # Get products
        products = Product.objects.filter(id__in=product_ids)
        
        if not products.exists():
            raise ValueError("No products found with the provided IDs")
        
        updated_count = 0
        
        with transaction.atomic():
            if action == 'activate':
                updated_count = products.update(is_active=True)
                
            elif action == 'deactivate':
                updated_count = products.update(is_active=False)
                
            elif action == 'feature':
                updated_count = products.update(is_featured=True, is_active=True)
                
            elif action == 'unfeature':
                updated_count = products.update(is_featured=False)
                
            elif action == 'delete':
                deleted_count, _ = products.delete()
                updated_count = deleted_count
                
            elif action == 'update_category':
                category_id = bulk_data.get('category_id')
                if not category_id:
                    raise ValueError("Category ID is required for category update")
                
                try:
                    category = Category.objects.get(id=category_id)
                    updated_count = products.update(category=category)
                except Category.DoesNotExist:
                    raise ValueError("Category not found")
                    
            elif action == 'update_price':
                price_adjustment = bulk_data.get('price_adjustment')
                adjustment_type = bulk_data.get('price_adjustment_type')
                
                if adjustment_type == 'fixed':
                    # Add fixed amount to price
                    products.update(price=F('price') + price_adjustment)
                elif adjustment_type == 'percentage':
                    # Apply percentage change
                    multiplier = Decimal('1') + (price_adjustment / Decimal('100'))
                    products.update(price=F('price') * multiplier)
                
                updated_count = products.count()
                
            elif action == 'update_stock':
                stock_adjustment = bulk_data.get('stock_adjustment')
                adjustment_type = bulk_data.get('stock_adjustment_type')
                
                if adjustment_type == 'set':
                    updated_count = products.update(stock_quantity=stock_adjustment)
                elif adjustment_type == 'add':
                    products.update(stock_quantity=F('stock_quantity') + stock_adjustment)
                    updated_count = products.count()
                elif adjustment_type == 'subtract':
                    products.update(
                        stock_quantity=models.Case(
                            models.When(
                                stock_quantity__gte=stock_adjustment,
                                then=F('stock_quantity') - stock_adjustment
                            ),
                            default=0,
                            output_field=models.PositiveIntegerField()
                        )
                    )
                    updated_count = products.count()
            
            else:
                raise ValueError(f"Unknown action: {action}")
        
        # Clear relevant caches
        ProductService._clear_bulk_update_caches(product_ids)
        
        return {
            'action': action,
            'products_affected': updated_count,
            'success': True
        }
    
    @staticmethod
    def get_product_stats():
        """
        Get comprehensive product statistics
        """
        cache_key = 'product_stats'
        cached_stats = cache.get(cache_key)
        
        if cached_stats:
            return cached_stats
        
        # Base queryset
        products = Product.objects.all()
        active_products = products.filter(is_active=True)
        
        # Calculate statistics
        stats = {
            'total_products': products.count(),
            'active_products': active_products.count(),
            'featured_products': active_products.filter(is_featured=True).count(),
            'out_of_stock_products': products.filter(
                track_inventory=True,
                stock_quantity=0
            ).count(),
            'low_stock_products': products.filter(
                track_inventory=True,
                stock_quantity__lte=F('low_stock_threshold'),
                stock_quantity__gt=0
            ).count(),
            'total_value': active_products.aggregate(
                total=Sum(F('price') * F('stock_quantity'))
            )['total'] or Decimal('0'),
            'average_price': active_products.aggregate(
                avg=Avg('price')
            )['avg'] or Decimal('0'),
        }
        
        # Top categories by product count
        top_categories = Category.objects.annotate(
            product_count=Count('products', filter=Q(products__is_active=True))
        ).order_by('-product_count')[:5]
        
        stats['top_categories'] = [
            {
                'id': cat.id,
                'name': cat.name,
                'product_count': cat.product_count
            }
            for cat in top_categories
        ]
        
        # Recent products
        recent_products = active_products.order_by('-created_at')[:5]
        stats['recent_products'] = recent_products
        
        # Cache for 15 minutes
        cache.set(cache_key, stats, 900)
        
        return stats
    
    @staticmethod
    def get_product_analytics(days=30, category_id=None):
        """
        Get detailed product analytics
        """
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        # Base queryset
        products = Product.objects.filter(created_at__gte=start_date)
        
        if category_id:
            products = products.filter(category_id=category_id)
        
        analytics = {
            'period': {
                'days': days,
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            },
            'overview': {
                'total_products': products.count(),
                'active_products': products.filter(is_active=True).count(),
                'featured_products': products.filter(is_featured=True).count(),
                'products_with_images': products.annotate(
                    image_count=Count('images')
                ).filter(image_count__gt=0).count(),
            },
            'performance': {
                'top_viewed': products.order_by('-view_count')[:10].values(
                    'id', 'name', 'view_count'
                ),
                'top_ordered': products.order_by('-order_count')[:10].values(
                    'id', 'name', 'order_count'
                ),
                'highest_rated': products.filter(
                    review_count__gt=0
                ).order_by('-rating_average')[:10].values(
                    'id', 'name', 'rating_average', 'review_count'
                ),
            },
            'inventory': {
                'total_stock_value': products.aggregate(
                    total=Sum(F('price') * F('stock_quantity'))
                )['total'] or Decimal('0'),
                'low_stock_count': products.filter(
                    track_inventory=True,
                    stock_quantity__lte=F('low_stock_threshold'),
                    stock_quantity__gt=0
                ).count(),
                'out_of_stock_count': products.filter(
                    track_inventory=True,
                    stock_quantity=0
                ).count(),
            }
        }
        
        return analytics
    
    @staticmethod
    def import_products(csv_data):
        """
        Import products from CSV data
        """
        results = {
            'success_count': 0,
            'error_count': 0,
            'errors': [],
            'created_products': []
        }
        
        with transaction.atomic():
            for row_num, row in enumerate(csv_data, start=1):
                try:
                    # Validate and get category
                    category_name = row.get('category_name', '').strip()
                    if not category_name:
                        raise ValueError("Category name is required")
                    
                    try:
                        category = Category.objects.get(name__iexact=category_name)
                    except Category.DoesNotExist:
                        raise ValueError(f"Category '{category_name}' does not exist")
                    
                    # Create product
                    product_data = {
                        'name': row.get('name', '').strip(),
                        'description': row.get('description', '').strip(),
                        'short_description': row.get('short_description', '').strip(),
                        'category': category,
                        'tags': row.get('tags', '').strip(),
                        'price': Decimal(row.get('price', '0')),
                        'original_price': Decimal(row.get('original_price', '0')) if row.get('original_price') else None,
                        'cost_price': Decimal(row.get('cost_price', '0')) if row.get('cost_price') else None,
                        'sku': row.get('sku', '').strip(),
                        'stock_quantity': int(row.get('stock_quantity', '0')),
                        'low_stock_threshold': int(row.get('low_stock_threshold', '10')),
                        'track_inventory': row.get('track_inventory', 'true').lower() == 'true',
                        'allow_backorders': row.get('allow_backorders', 'false').lower() == 'true',
                        'weight': Decimal(row.get('weight', '0')) if row.get('weight') else None,
                        'dimensions': row.get('dimensions', '').strip(),
                        'color': row.get('color', '').strip(),
                        'size': row.get('size', '').strip(),
                        'material': row.get('material', '').strip(),
                        'brand': row.get('brand', '').strip(),
                        'model': row.get('model', '').strip(),
                        'condition': row.get('condition', 'new'),
                        'status': row.get('status', 'draft'),
                        'is_active': row.get('is_active', 'true').lower() == 'true',
                        'is_featured': row.get('is_featured', 'false').lower() == 'true',
                        'is_digital': row.get('is_digital', 'false').lower() == 'true',
                        'requires_shipping': row.get('requires_shipping', 'true').lower() == 'true',
                    }
                    
                    # Validate required fields
                    if not product_data['name']:
                        raise ValueError("Product name is required")
                    
                    if product_data['price'] <= 0:
                        raise ValueError("Price must be greater than 0")
                    
                    # Check SKU uniqueness if provided
                    if product_data['sku'] and Product.objects.filter(sku=product_data['sku']).exists():
                        raise ValueError(f"SKU '{product_data['sku']}' already exists")
                    
                    # Create product
                    product = Product.objects.create(**product_data)
                    
                    results['success_count'] += 1
                    results['created_products'].append({
                        'id': str(product.id),
                        'name': product.name,
                        'sku': product.sku
                    })
                    
                except Exception as e:
                    results['error_count'] += 1
                    results['errors'].append({
                        'row': row_num,
                        'error': str(e),
                        'data': dict(row)
                    })
        
        return results
    
    @staticmethod
    def get_product_recommendations(product, limit=6):
        """
        Get product recommendations based on a given product
        """
        if not product:
            return Product.objects.none()
        
        # Get products from same category
        same_category = Product.objects.filter(
            category=product.category,
            is_active=True,
            status='published'
        ).exclude(id=product.id)
        
        # Get products with similar tags
        similar_tags = Product.objects.none()
        if product.tags:
            tag_list = [tag.strip() for tag in product.tags.split(',')]
            tag_query = Q()
            for tag in tag_list:
                tag_query |= Q(tags__icontains=tag)
            
            similar_tags = Product.objects.filter(
                tag_query,
                is_active=True,
                status='published'
            ).exclude(id=product.id).exclude(category=product.category)
        
        # Get products with similar price range (±20%)
        price_min = product.price * Decimal('0.8')
        price_max = product.price * Decimal('1.2')
        
        similar_price = Product.objects.filter(
            price__gte=price_min,
            price__lte=price_max,
            is_active=True,
            status='published'
        ).exclude(id=product.id)
        
        # Combine and order by relevance
        recommendations = (
            same_category.union(similar_tags, similar_price)
            .order_by('-view_count', '-order_count', '-rating_average')
            .distinct()
        )
        
        return recommendations[:limit]
    
    @staticmethod
    def get_user_recommendations(user_id, limit=6):
        """
        Get personalized product recommendations for a user
        """
        # This would be based on user's order history, viewed products, etc.
        # For now, return popular products
        return Product.objects.filter(
            is_active=True,
            status='published'
        ).order_by('-view_count', '-order_count')[:limit]
    
    @staticmethod
    def get_price_history(product, days=30):
        """
        Get price history for a product
        Note: This would require a separate PriceHistory model in a real implementation
        """
        # Placeholder implementation
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        # In a real implementation, you'd query a price history table
        # For now, return current price as a single data point
        return [
            {
                'date': end_date.isoformat(),
                'price': float(product.price),
                'original_price': float(product.original_price) if product.original_price else None
            }
        ]
    
    @staticmethod
    def bulk_inventory_update(inventory_updates):
        """
        Update inventory for multiple products
        """
        results = {
            'success_count': 0,
            'error_count': 0,
            'errors': []
        }
        
        with transaction.atomic():
            for update in inventory_updates:
                try:
                    product_id = update.get('product_id')
                    new_quantity = update.get('quantity')
                    operation = update.get('operation', 'set')  # set, add, subtract
                    
                    if not product_id or new_quantity is None:
                        raise ValueError("Product ID and quantity are required")
                    
                    product = Product.objects.get(id=product_id, track_inventory=True)
                    
                    if operation == 'set':
                        product.stock_quantity = new_quantity
                    elif operation == 'add':
                        product.stock_quantity += new_quantity
                    elif operation == 'subtract':
                        product.stock_quantity = max(0, product.stock_quantity - new_quantity)
                    
                    product.save(update_fields=['stock_quantity'])
                    results['success_count'] += 1
                    
                except Exception as e:
                    results['error_count'] += 1
                    results['errors'].append({
                        'product_id': update.get('product_id'),
                        'error': str(e)
                    })
        
        return results
    
    @staticmethod
    def duplicate_product(original_product, name_suffix=' (Copy)', copy_images=True, 
                         copy_attributes=True, copy_variants=False):
        """
        Create a duplicate of an existing product
        """
        with transaction.atomic():
            # Create duplicate product
            duplicate = Product()
            
            # Copy all fields except unique ones
            for field in Product._meta.fields:
                if field.name not in ['id', 'slug', 'sku', 'created_at', 'updated_at']:
                    setattr(duplicate, field.name, getattr(original_product, field.name))
            
            # Modify name and clear unique fields
            duplicate.name = original_product.name + name_suffix
            duplicate.slug = ''  # Will be auto-generated
            duplicate.sku = ''   # Will be auto-generated
            duplicate.is_active = False  # Start as inactive
            duplicate.view_count = 0
            duplicate.order_count = 0
            
            duplicate.save()
            
            # Copy images if requested
            if copy_images:
                for image in original_product.images.all():
                    ProductImage.objects.create(
                        product=duplicate,
                        image=image.image,
                        alt_text=image.alt_text,
                        caption=image.caption,
                        position=image.position,
                        is_main=image.is_main
                    )
            
            # Copy attributes if requested
            if copy_attributes:
                for attr in original_product.attributes.all():
                    ProductAttribute.objects.create(
                        product=duplicate,
                        name=attr.name,
                        value=attr.value,
                        position=attr.position
                    )
            
            # Copy variants if requested
            if copy_variants:
                for variant in original_product.variants.all():
                    ProductVariant.objects.create(
                        product=duplicate,
                        name=variant.name,
                        price=variant.price,
                        stock_quantity=0,  # Start with 0 stock
                        is_active=variant.is_active,
                        color=variant.color,
                        size=variant.size,
                        weight=variant.weight
                    )
            
            return duplicate
    
    @staticmethod
    def compare_products(products):
        """
        Compare multiple products and return comparison data
        """
        comparison_data = {
            'products': [],
            'comparison_attributes': [],
            'price_comparison': {},
            'feature_comparison': {}
        }
        
        # Basic product info
        for product in products:
            comparison_data['products'].append({
                'id': str(product.id),
                'name': product.name,
                'price': float(product.price),
                'original_price': float(product.original_price) if product.original_price else None,
                'brand': product.brand,
                'rating': float(product.rating_average),
                'review_count': product.review_count,
                'image_url': product.image_url,
                'in_stock': product.is_in_stock
            })
        
        # Collect all unique attributes
        all_attributes = {}
        for product in products:
            for attr in product.attributes.all():
                if attr.name not in all_attributes:
                    all_attributes[attr.name] = {}
                all_attributes[attr.name][str(product.id)] = attr.value
        
        # Format attribute comparison
        for attr_name, values in all_attributes.items():
            comparison_data['comparison_attributes'].append({
                'name': attr_name,
                'values': values
            })
        
        # Price comparison
        prices = [float(p.price) for p in products]
        comparison_data['price_comparison'] = {
            'min_price': min(prices),
            'max_price': max(prices),
            'average_price': sum(prices) / len(prices)
        }
        
        # Feature comparison (basic product features)
        comparison_data['feature_comparison'] = {
            'brands': list(set(p.brand for p in products if p.brand)),
            'categories': list(set(p.category.name for p in products)),
            'conditions': list(set(p.condition for p in products)),
            'shipping_required': [p.requires_shipping for p in products]
        }
        
        return comparison_data
    
    @staticmethod
    def _clear_bulk_update_caches(product_ids):
        """
        Clear caches related to bulk updated products
        """
        cache_keys = ['product_stats', 'featured_products', 'recent_products']
        
        # Add individual product caches
        for product_id in product_ids:
            cache_keys.append(f'product_{product_id}')
        
        cache.delete_many(cache_keys)
    
    @staticmethod
    def get_trending_products(days=7, limit=10):
        """
        Get trending products based on recent view/order activity
        """
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        # This would require tracking views/orders by date in a real implementation
        # For now, return products with high view count
        return Product.objects.filter(
            is_active=True,
            status='published',
            updated_at__gte=start_date
        ).order_by('-view_count', '-order_count')[:limit]
    
    @staticmethod
    def get_seasonal_products(season=None):
        """
        Get products marked for specific seasons
        Note: This would require season tags or attributes
        """
        if not season:
            # Default to current season based on month
            current_month = timezone.now().month
            if current_month in [12, 1, 2]:
                season = 'winter'
            elif current_month in [3, 4, 5]:
                season = 'spring'
            elif current_month in [6, 7, 8]:
                season = 'summer'
            else:
                season = 'autumn'
        
        return Product.objects.filter(
            tags__icontains=season,
            is_active=True,
            status='published'
        ).order_by('-created_at')
    
    @staticmethod
    def get_related_categories(product):
        """
        Get categories related to a product's category
        """
        # Get sibling categories (same parent)
        related_categories = []
        
        if hasattr(product.category, 'parent') and product.category.parent:
            related_categories = Category.objects.filter(
                parent=product.category.parent
            ).exclude(id=product.category.id)
        else:
            # Get categories with similar names or products
            related_categories = Category.objects.annotate(
                product_count=Count('products')
            ).filter(
                product_count__gt=0
            ).exclude(id=product.category.id)[:5]
        
        return related_categories
                        