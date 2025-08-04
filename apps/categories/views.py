#from django.shortcuts import render

# Create your views here.
# apps/categories/views.py

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from apps.core.permissions import IsAdminOrReadOnly, IsAdmin
from apps.core.pagination import StandardResultsSetPagination
from .models import Category
from .serializers import (
    CategorySerializer, CategoryDetailSerializer, CategoryListSerializer,
    CategoryTreeSerializer, CategoryCreateUpdateSerializer,
    CategoryBulkActionSerializer, CategorySearchSerializer
)
from .services.category_service import CategoryService
import logging

logger = logging.getLogger(__name__)


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing categories with full CRUD operations
    """
    queryset = Category.objects.all()
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = StandardResultsSetPagination
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    lookup_field = 'slug'

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return CategoryListSerializer
        elif self.action == 'retrieve':
            return CategoryDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return CategoryCreateUpdateSerializer
        elif self.action == 'bulk_action':
            return CategoryBulkActionSerializer
        elif self.action == 'search':
            return CategorySearchSerializer
        return CategorySerializer

    def get_queryset(self):
        """Get filtered queryset based on user permissions"""
        queryset = Category.objects.select_related('parent').prefetch_related('subcategories')
        
        # For non-admin users, only show active categories
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True)
        
        return queryset

    def list(self, request, *args, **kwargs):
        """
        List categories with optional filtering
        """
        try:
            # Check cache first
            cache_key = f"categories_list_{request.GET.urlencode()}"
            cached_data = cache.get(cache_key)
            
            if cached_data and not request.user.is_staff:
                return Response(cached_data)

            queryset = self.filter_queryset(self.get_queryset())
            
            # Apply filters
            parent_id = request.query_params.get('parent')
            featured = request.query_params.get('featured')
            search = request.query_params.get('search')
            
            if parent_id:
                if parent_id.lower() == 'root':
                    queryset = queryset.filter(parent=None)
                else:
                    queryset = queryset.filter(parent_id=parent_id)
            
            if featured is not None:
                queryset = queryset.filter(featured=featured.lower() == 'true')
            
            if search:
                queryset = queryset.filter(
                    Q(name__icontains=search) | Q(description__icontains=search)
                )

            # Annotate with product count
            queryset = queryset.annotate(
                product_count=Count('products', filter=Q(products__is_active=True))
            )

            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                result = self.get_paginated_response(serializer.data)
                
                # Cache for non-admin users
                if not request.user.is_staff:
                    cache.set(cache_key, result.data, 300)  # 5 minutes
                
                return result

            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)

        except Exception as e:
            logger.error(f"Error listing categories: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve categories'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve a single category with detailed information
        """
        try:
            instance = self.get_object()
            
            # Check cache for non-admin users
            if not request.user.is_staff:
                cache_key = f"category_detail_{instance.slug}"
                cached_data = cache.get(cache_key)
                if cached_data:
                    return Response(cached_data)

            serializer = self.get_serializer(instance)
            data = serializer.data
            
            # Cache for non-admin users
            if not request.user.is_staff:
                cache.set(f"category_detail_{instance.slug}", data, 600)  # 10 minutes
            
            return Response(data)

        except Exception as e:
            logger.error(f"Error retrieving category: {str(e)}")
            return Response(
                {'error': 'Category not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    def create(self, request, *args, **kwargs):
        """
        Create a new category
        """
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            category = CategoryService.create_category(
                user=request.user,
                **serializer.validated_data
            )
            
            # Clear cache
            self._clear_category_cache()
            
            response_serializer = CategoryDetailSerializer(category)
            return Response(
                response_serializer.data,
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            logger.error(f"Error creating category: {str(e)}")
            return Response(
                {'error': 'Failed to create category'},
                status=status.HTTP_400_BAD_REQUEST
            )

    def update(self, request, *args, **kwargs):
        """
        Update an existing category
        """
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            
            category = CategoryService.update_category(
                category=instance,
                user=request.user,
                **serializer.validated_data
            )
            
            # Clear cache
            self._clear_category_cache()
            
            response_serializer = CategoryDetailSerializer(category)
            return Response(response_serializer.data)

        except Exception as e:
            logger.error(f"Error updating category: {str(e)}")
            return Response(
                {'error': 'Failed to update category'},
                status=status.HTTP_400_BAD_REQUEST
            )

    def destroy(self, request, *args, **kwargs):
        """
        Delete a category
        """
        try:
            instance = self.get_object()
            
            if not instance.can_be_deleted():
                return Response(
                    {'error': 'Cannot delete category with products or subcategories'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            CategoryService.delete_category(instance, request.user)
            
            # Clear cache
            self._clear_category_cache()
            
            return Response(status=status.HTTP_204_NO_CONTENT)

        except Exception as e:
            logger.error(f"Error deleting category: {str(e)}")
            return Response(
                {'error': 'Failed to delete category'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    @method_decorator(cache_page(60 * 15))  # Cache for 15 minutes
    def tree(self, request):
        """
        Get category tree structure
        """
        try:
            root_categories = Category.get_root_categories()
            serializer = CategoryTreeSerializer(root_categories, many=True)
            return Response(serializer.data)

        except Exception as e:
            logger.error(f"Error getting category tree: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve category tree'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    @method_decorator(cache_page(60 * 30))  # Cache for 30 minutes
    def featured(self, request):
        """
        Get featured categories for homepage
        """
        try:
            limit = int(request.query_params.get('limit', 6))
            featured_categories = Category.get_featured_categories(limit=limit)
            serializer = CategoryListSerializer(featured_categories, many=True)
            return Response(serializer.data)

        except Exception as e:
            logger.error(f"Error getting featured categories: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve featured categories'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def products(self, request, slug=None):
        """
        Get products for a specific category
        """
        try:
            category = self.get_object()
            from apps.products.models import Product
            from apps.products.serializers import ProductListSerializer
            
            # Get products from this category and subcategories
            descendant_ids = category.get_descendant_ids()
            descendant_ids.append(category.id)
            
            products = Product.objects.filter(
                category_id__in=descendant_ids,
                is_active=True
            ).select_related('category').prefetch_related('images')
            
            # Apply filters
            featured = request.query_params.get('featured')
            min_price = request.query_params.get('min_price')
            max_price = request.query_params.get('max_price')
            sort_by = request.query_params.get('sort_by', '-created_at')
            
            if featured is not None:
                products = products.filter(featured=featured.lower() == 'true')
            
            if min_price:
                products = products.filter(price__gte=min_price)
            
            if max_price:
                products = products.filter(price__lte=max_price)
            
            # Apply sorting
            valid_sort_fields = ['name', '-name', 'price', '-price', 'created_at', '-created_at']
            if sort_by in valid_sort_fields:
                products = products.order_by(sort_by)
            
            page = self.paginate_queryset(products)
            if page is not None:
                serializer = ProductListSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = ProductListSerializer(products, many=True)
            return Response(serializer.data)

        except Exception as e:
            logger.error(f"Error getting category products: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve category products'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'], permission_classes=[IsAdmin])
    def bulk_action(self, request):
        """
        Perform bulk actions on categories
        """
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            result = CategoryService.bulk_action(
                category_ids=serializer.validated_data['category_ids'],
                action=serializer.validated_data['action'],
                user=request.user
            )
            
            # Clear cache
            self._clear_category_cache()
            
            return Response(result)

        except Exception as e:
            logger.error(f"Error performing bulk action: {str(e)}")
            return Response(
                {'error': 'Failed to perform bulk action'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Advanced category search
        """
        try:
            search_serializer = CategorySearchSerializer(data=request.query_params)
            search_serializer.is_valid(raise_exception=True)
            
            filters = search_serializer.validated_data
            categories = CategoryService.search_categories(**filters)
            
            page = self.paginate_queryset(categories)
            if page is not None:
                serializer = CategoryListSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = CategoryListSerializer(categories, many=True)
            return Response(serializer.data)

        except Exception as e:
            logger.error(f"Error searching categories: {str(e)}")
            return Response(
                {'error': 'Failed to search categories'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def toggle_featured(self, request, slug=None):
        """
        Toggle category featured status
        """
        try:
            category = self.get_object()
            category.featured = not category.featured
            category.save()
            
            # Clear cache
            self._clear_category_cache()
            
            return Response({
                'message': f'Category {"featured" if category.featured else "unfeatured"} successfully',
                'featured': category.featured
            })

        except Exception as e:
            logger.error(f"Error toggling category featured status: {str(e)}")
            return Response(
                {'error': 'Failed to update category status'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def toggle_active(self, request, slug=None):
        """
        Toggle category active status
        """
        try:
            category = self.get_object()
            category.is_active = not category.is_active
            category.save()
            
            # Clear cache
            self._clear_category_cache()
            
            return Response({
                'message': f'Category {"activated" if category.is_active else "deactivated"} successfully',
                'is_active': category.is_active
            })

        except Exception as e:
            logger.error(f"Error toggling category active status: {str(e)}")
            return Response(
                {'error': 'Failed to update category status'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def stats(self, request):
        """
        Get category statistics for admin dashboard
        """
        try:
            stats = CategoryService.get_category_stats()
            return Response(stats)

        except Exception as e:
            logger.error(f"Error getting category stats: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve category statistics'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _clear_category_cache(self):
        """Clear category-related cache"""
        try:
            cache_patterns = [
                'categories_list_*',
                'category_detail_*',
                'featured_categories',
                'category_tree'
            ]
            
            for pattern in cache_patterns:
                cache.delete_many(cache.keys(pattern))
                
        except Exception as e:
            logger.warning(f"Failed to clear category cache: {str(e)}")
