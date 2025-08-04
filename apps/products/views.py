from django.shortcuts import render

# Create your views here.
"""
Products App Views
Handles all product-related API endpoints and business logic
"""

import csv
import io
from decimal import Decimal
from django.db import transaction
from django.db.models import Q, Count, Avg, Sum, F
from django.http import HttpResponse
from django.utils import timezone
from django.core.cache import cache
from rest_framework import status, generics, viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .models import Product, ProductImage, ProductAttribute, ProductVariant
from .serializers import (
    ProductListSerializer, ProductDetailSerializer, ProductCreateUpdateSerializer,
    ProductSearchSerializer, ProductBulkUpdateSerializer, ProductStatsSerializer,
    ProductImageSerializer, ProductImageUploadSerializer, ProductImageUpdateSerializer,
    ProductAttributeSerializer, ProductVariantSerializer, ProductExportSerializer,
    ProductImportSerializer, ProductQuickEditSerializer
)
from .filters import ProductFilter
from .pagination import ProductPagination
from .services.product_service import ProductService
from .services.image_service import ImageService
from apps.core.permissions import IsAdminUser, IsAdminOrReadOnly
from apps.core.exceptions import ValidationError
from apps.categories.models import Category


class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet for product CRUD operations
    Provides endpoints for listing, creating, updating, and deleting products
    """
    
    queryset = Product.objects.select_related('category').prefetch_related(
        'images', 'attributes', 'variants'
    )
    pagination_class = ProductPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description', 'short_description', 'tags', 'sku']
    ordering_fields = ['name', 'price', 'created_at', 'view_count', 'rating_average']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return ProductListSerializer
        elif self.action == 'retrieve':
            return ProductDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ProductCreateUpdateSerializer
        elif self.action == 'search':
            return ProductSearchSerializer
        elif self.action == 'bulk_update':
            return ProductBulkUpdateSerializer
        elif self.action == 'quick_edit':
            return ProductQuickEditSerializer
        return ProductDetailSerializer
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['list', 'retrieve', 'search']:
            permission_classes = [AllowAny]
        elif self.action in ['create', 'update', 'partial_update', 'destroy', 'bulk_update', 'quick_edit']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filter queryset based on user permissions"""
        queryset = super().get_queryset()
        
        # For non-admin users, only show active products
        if not (self.request.user.is_authenticated and self.request.user.is_admin):
            queryset = queryset.filter(is_active=True, status='published')
        
        return queryset
    
    def retrieve(self, request, *args, **kwargs):
        """Get single product and increment view count"""
        instance = self.get_object()
        
        # Increment view count for active products
        if instance.is_active:
            ProductService.increment_view_count(instance)
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Search products",
        description="Search products by name, description, or tags",
        parameters=[
            OpenApiParameter(name='q', description='Search query', required=True, type=str),
            OpenApiParameter(name='category', description='Category ID filter', required=False, type=str),
            OpenApiParameter(name='min_price', description='Minimum price filter', required=False, type=float),
            OpenApiParameter(name='max_price', description='Maximum price filter', required=False, type=float),
        ]
    )
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search products with advanced filtering"""
        query = request.query_params.get('q', '').strip()
        
        if not query:
            return Response(
                {'error': 'Search query is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get base queryset
        queryset = self.get_queryset()
        
        # Apply search
        queryset = ProductService.search_products(queryset, query)
        
        # Apply additional filters
        category_id = request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        min_price = request.query_params.get('min_price')
        if min_price:
            try:
                queryset = queryset.filter(price__gte=Decimal(min_price))
            except (ValueError, TypeError):
                pass
        
        max_price = request.query_params.get('max_price')
        if max_price:
            try:
                queryset = queryset.filter(price__lte=Decimal(max_price))
            except (ValueError, TypeError):
                pass
        
        # Cache search results for 5 minutes
        cache_key = f"product_search_{hash(str(request.query_params))}"
        cached_results = cache.get(cache_key)
        
        if cached_results:
            return Response(cached_results)
        
        # Paginate and serialize
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            paginated_response = self.get_paginated_response(serializer.data)
            cache.set(cache_key, paginated_response.data, 300)  # 5 minutes
            return paginated_response
        
        serializer = self.get_serializer(queryset, many=True)
        cache.set(cache_key, serializer.data, 300)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Bulk update products",
        description="Perform bulk operations on multiple products"
    )
    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def bulk_update(self, request):
        """Bulk update multiple products"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            result = ProductService.bulk_update_products(serializer.validated_data)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @extend_schema(
        summary="Quick edit product",
        description="Quick edit of essential product fields"
    )
    @action(detail=True, methods=['patch'], permission_classes=[IsAdminUser])
    def quick_edit(self, request, pk=None):
        """Quick edit essential product fields"""
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(
            ProductDetailSerializer(instance, context={'request': request}).data
        )
    
    @extend_schema(
        summary="Get product statistics",
        description="Get comprehensive product statistics for admin dashboard"
    )
    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def stats(self, request):
        """Get product statistics"""
        stats = ProductService.get_product_stats()
        serializer = ProductStatsSerializer(stats)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Export products",
        description="Export products to CSV format"
    )
    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def export(self, request):
        """Export products to CSV"""
        queryset = self.get_queryset()
        
        # Apply filters if any
        filtered_queryset = self.filter_queryset(queryset)
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="products_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'
        
        # Create CSV writer
        writer = csv.writer(response)
        
        # Write headers
        headers = [
            'ID', 'Name', 'Slug', 'Description', 'Short Description', 'Category',
            'Tags', 'Price', 'Original Price', 'Cost Price', 'SKU', 'Stock Quantity',
            'Low Stock Threshold', 'Track Inventory', 'Allow Backorders', 'Weight',
            'Dimensions', 'Color', 'Size', 'Material', 'Brand', 'Model', 'Condition',
            'Status', 'Is Active', 'Is Featured', 'Is Digital', 'Requires Shipping',
            'View Count', 'Order Count', 'Rating Average', 'Review Count',
            'Created At', 'Updated At'
        ]
        writer.writerow(headers)
        
        # Write data
        for product in filtered_queryset:
            writer.writerow([
                product.id, product.name, product.slug, product.description,
                product.short_description, product.category.name, product.tags,
                product.price, product.original_price, product.cost_price,
                product.sku, product.stock_quantity, product.low_stock_threshold,
                product.track_inventory, product.allow_backorders, product.weight,
                product.dimensions, product.color, product.size, product.material,
                product.brand, product.model, product.condition, product.status,
                product.is_active, product.is_featured, product.is_digital,
                product.requires_shipping, product.view_count, product.order_count,
                product.rating_average, product.review_count, product.created_at,
                product.updated_at
            ])
        
        return response
    
    @extend_schema(
        summary="Import products",
        description="Import products from CSV file"
    )
    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser], parser_classes=[MultiPartParser])
    def import_products(self, request):
        """Import products from CSV file"""
        if 'file' not in request.FILES:
            return Response(
                {'error': 'No file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        csv_file = request.FILES['file']
        
        if not csv_file.name.endswith('.csv'):
            return Response(
                {'error': 'File must be a CSV'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Read CSV file
            decoded_file = csv_file.read().decode('utf-8')
            csv_data = csv.DictReader(io.StringIO(decoded_file))
            
            results = ProductService.import_products(csv_data)
            
            return Response(results, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Error processing file: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @extend_schema(
        summary="Get featured products",
        description="Get list of featured products"
    )
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured products"""
        queryset = self.get_queryset().filter(is_featured=True)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = ProductListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = ProductListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    
    @extend_schema(
        summary="Get products by category",
        description="Get products filtered by category"
    )
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get products by category"""
        category_id = request.query_params.get('category_id')
        category_slug = request.query_params.get('category_slug')
        
        if not category_id and not category_slug:
            return Response(
                {'error': 'Either category_id or category_slug is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            if category_id:
                category = Category.objects.get(id=category_id)
            else:
                category = Category.objects.get(slug=category_slug)
        except Category.DoesNotExist:
            return Response(
                {'error': 'Category not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        queryset = self.get_queryset().filter(category=category)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = ProductListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = ProductListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)


class ProductImageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for product image management
    """
    
    serializer_class = ProductImageSerializer
    permission_classes = [IsAdminOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_queryset(self):
        """Filter images by product"""
        product_id = self.kwargs.get('product_pk')
        if product_id:
            return ProductImage.objects.filter(product_id=product_id)
        return ProductImage.objects.none()
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return ProductImageUploadSerializer
        elif self.action in ['update', 'partial_update']:
            return ProductImageUpdateSerializer
        return ProductImageSerializer
    
    def get_serializer_context(self):
        """Add product_id to serializer context"""
        context = super().get_serializer_context()
        context['product_id'] = self.kwargs.get('product_pk')
        return context
    
    @extend_schema(
        summary="Reorder product images",
        description="Update the order/position of product images"
    )
    @action(detail=False, methods=['post'])
    def reorder(self, request, product_pk=None):
        """Reorder product images"""
        image_orders = request.data.get('image_orders', [])
        
        if not image_orders:
            return Response(
                {'error': 'image_orders is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                for item in image_orders:
                    image_id = item.get('id')
                    position = item.get('position')
                    
                    if image_id and position is not None:
                        ProductImage.objects.filter(
                            id=image_id, 
                            product_id=product_pk
                        ).update(position=position)
            
            # Return updated images
            queryset = self.get_queryset().order_by('position')
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @extend_schema(
        summary="Set main image",
        description="Set an image as the main product image"
    )
    @action(detail=True, methods=['post'])
    def set_main(self, request, pk=None, product_pk=None):
        """Set image as main"""
        image = self.get_object()
        
        try:
            with transaction.atomic():
                # Unset other main images for this product
                ProductImage.objects.filter(
                    product_id=product_pk, 
                    is_main=True
                ).update(is_main=False)
                
                # Set this image as main
                image.is_main = True
                image.save(update_fields=['is_main'])
            
            serializer = self.get_serializer(image)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class ProductAttributeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for product attribute management
    """
    
    serializer_class = ProductAttributeSerializer
    permission_classes = [IsAdminOrReadOnly]
    
    def get_queryset(self):
        """Filter attributes by product"""
        product_id = self.kwargs.get('product_pk')
        if product_id:
            return ProductAttribute.objects.filter(product_id=product_id)
        return ProductAttribute.objects.none()
    
    def perform_create(self, serializer):
        """Associate attribute with product"""
        product_id = self.kwargs.get('product_pk')
        try:
            product = Product.objects.get(id=product_id)
            serializer.save(product=product)
        except Product.DoesNotExist:
            raise ValidationError("Product not found")


class ProductVariantViewSet(viewsets.ModelViewSet):
    """
    ViewSet for product variant management
    """
    
    serializer_class = ProductVariantSerializer
    permission_classes = [IsAdminOrReadOnly]
    
    def get_queryset(self):
        """Filter variants by product"""
        product_id = self.kwargs.get('product_pk')
        if product_id:
            return ProductVariant.objects.filter(product_id=product_id)
        return ProductVariant.objects.none()
    
    def perform_create(self, serializer):
        """Associate variant with product"""
        product_id = self.kwargs.get('product_pk')
        try:
            product = Product.objects.get(id=product_id)
            serializer.save(product=product)
        except Product.DoesNotExist:
            raise ValidationError("Product not found")


class ProductAnalyticsView(generics.GenericAPIView):
    """
    View for product analytics and insights
    """
    
    permission_classes = [IsAdminUser]
    
    @extend_schema(
        summary="Get product analytics",
        description="Get detailed analytics for products including sales, views, and performance metrics"
    )
    def get(self, request):
        """Get product analytics"""
        time_period = request.query_params.get('period', '30')  # days
        category_id = request.query_params.get('category')
        
        try:
            days = int(time_period)
        except ValueError:
            days = 30
        
        analytics = ProductService.get_product_analytics(
            days=days,
            category_id=category_id
        )
        
        return Response(analytics)


class TopProductsView(generics.ListAPIView):
    """
    View for getting top performing products
    """
    
    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]
    pagination_class = ProductPagination
    
    def get_queryset(self):
        """Get top products based on different criteria"""
        criteria = self.request.query_params.get('criteria', 'sales')
        limit = self.request.query_params.get('limit', 10)
        
        try:
            limit = int(limit)
            limit = min(limit, 50)  # Max 50 products
        except ValueError:
            limit = 10
        
        queryset = Product.objects.filter(is_active=True, status='published')
        
        if criteria == 'sales':
            # Top selling products
            queryset = queryset.order_by('-order_count')
        elif criteria == 'views':
            # Most viewed products
            queryset = queryset.order_by('-view_count')
        elif criteria == 'rating':
            # Highest rated products
            queryset = queryset.filter(review_count__gt=0).order_by('-rating_average')
        elif criteria == 'recent':
            # Recently added products
            queryset = queryset.order_by('-created_at')
        elif criteria == 'featured':
            # Featured products
            queryset = queryset.filter(is_featured=True).order_by('-created_at')
        else:
            # Default to most recent
            queryset = queryset.order_by('-created_at')
        
        return queryset[:limit]


class ProductRecommendationView(generics.ListAPIView):
    """
    View for getting product recommendations
    """
    
    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        """Get recommended products"""
        product_id = self.request.query_params.get('product_id')
        user_id = self.request.query_params.get('user_id')
        limit = self.request.query_params.get('limit', 6)
        
        try:
            limit = int(limit)
            limit = min(limit, 20)  # Max 20 recommendations
        except ValueError:
            limit = 6
        
        if product_id:
            # Product-based recommendations
            try:
                product = Product.objects.get(id=product_id, is_active=True)
                recommendations = ProductService.get_product_recommendations(
                    product, limit=limit
                )
                return recommendations
            except Product.DoesNotExist:
                pass
        
        elif user_id and self.request.user.is_authenticated:
            # User-based recommendations
            recommendations = ProductService.get_user_recommendations(
                user_id, limit=limit
            )
            return recommendations
        
        # Fallback to popular products
        return Product.objects.filter(
            is_active=True, 
            status='published'
        ).order_by('-view_count', '-order_count')[:limit]


class ProductPriceHistoryView(generics.GenericAPIView):
    """
    View for getting product price history
    """
    
    permission_classes = [AllowAny]
    
    @extend_schema(
        summary="Get product price history",
        description="Get historical price data for a product"
    )
    def get(self, request, pk=None):
        """Get product price history"""
        try:
            product = Product.objects.get(id=pk, is_active=True)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        days = request.query_params.get('days', 30)
        try:
            days = int(days)
        except ValueError:
            days = 30
        
        price_history = ProductService.get_price_history(product, days=days)
        
        return Response({
            'product_id': product.id,
            'product_name': product.name,
            'current_price': product.price,
            'price_history': price_history
        })


class ProductInventoryView(generics.GenericAPIView):
    """
    View for product inventory management
    """
    
    permission_classes = [IsAdminUser]
    
    @extend_schema(
        summary="Update product inventory",
        description="Update stock levels for products"
    )
    def post(self, request):
        """Update product inventory"""
        inventory_updates = request.data.get('updates', [])
        
        if not inventory_updates:
            return Response(
                {'error': 'No inventory updates provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            results = ProductService.bulk_inventory_update(inventory_updates)
            return Response(results)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @extend_schema(
        summary="Get low stock products",
        description="Get products that are low in stock"
    )
    def get(self, request):
        """Get low stock products"""
        threshold = request.query_params.get('threshold')
        
        queryset = Product.objects.filter(
            track_inventory=True,
            is_active=True
        )
        
        if threshold:
            try:
                threshold = int(threshold)
                queryset = queryset.filter(stock_quantity__lte=threshold)
            except ValueError:
                queryset = queryset.filter(
                    stock_quantity__lte=F('low_stock_threshold')
                )
        else:
            queryset = queryset.filter(
                stock_quantity__lte=F('low_stock_threshold')
            )
        
        serializer = ProductListSerializer(
            queryset, 
            many=True, 
            context={'request': request}
        )
        
        return Response({
            'count': queryset.count(),
            'products': serializer.data
        })


class ProductDuplicateView(generics.GenericAPIView):
    """
    View for duplicating products
    """
    
    permission_classes = [IsAdminUser]
    
    @extend_schema(
        summary="Duplicate product",
        description="Create a copy of an existing product"
    )
    def post(self, request, pk=None):
        """Duplicate a product"""
        try:
            original_product = Product.objects.get(id=pk)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get optional customizations
        name_suffix = request.data.get('name_suffix', ' (Copy)')
        copy_images = request.data.get('copy_images', True)
        copy_attributes = request.data.get('copy_attributes', True)
        copy_variants = request.data.get('copy_variants', False)
        
        try:
            duplicated_product = ProductService.duplicate_product(
                original_product,
                name_suffix=name_suffix,
                copy_images=copy_images,
                copy_attributes=copy_attributes,
                copy_variants=copy_variants
            )
            
            serializer = ProductDetailSerializer(
                duplicated_product, 
                context={'request': request}
            )
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class ProductCompareView(generics.GenericAPIView):
    """
    View for comparing products
    """
    
    permission_classes = [AllowAny]
    
    @extend_schema(
        summary="Compare products",
        description="Compare multiple products side by side"
    )
    def post(self, request):
        """Compare multiple products"""
        product_ids = request.data.get('product_ids', [])
        
        if not product_ids or len(product_ids) < 2:
            return Response(
                {'error': 'At least 2 product IDs are required for comparison'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(product_ids) > 5:
            return Response(
                {'error': 'Maximum 5 products can be compared at once'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            products = Product.objects.filter(
                id__in=product_ids,
                is_active=True,
                status='published'
            ).prefetch_related('images', 'attributes')
            
            if products.count() != len(product_ids):
                return Response(
                    {'error': 'One or more products not found or not available'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            comparison_data = ProductService.compare_products(products)
            
            return Response(comparison_data)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class ProductReviewSummaryView(generics.GenericAPIView):
    """
    View for product review summaries
    """
    
    permission_classes = [AllowAny]
    
    @extend_schema(
        summary="Get product review summary",
        description="Get aggregated review data for a product"
    )
    def get(self, request, pk=None):
        """Get product review summary"""
        try:
            product = Product.objects.get(id=pk, is_active=True)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # This would integrate with a reviews app when implemented
        summary = {
            'product_id': product.id,
            'average_rating': product.rating_average,
            'total_reviews': product.review_count,
            'rating_distribution': {
                '5': 0,
                '4': 0,
                '3': 0,
                '2': 0,
                '1': 0
            },
            'recent_reviews': [],
            'review_highlights': []
        }
        
        return Response(summary)
