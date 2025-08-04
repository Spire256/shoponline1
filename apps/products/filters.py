"""
Products App Filters
Custom filters for product queries and advanced filtering
"""

import django_filters
from django.db.models import Q, Count
from decimal import Decimal

from .models import Product
from apps.categories.models import Category


class ProductFilter(django_filters.FilterSet):
    """
    Filter class for Product model with advanced filtering options
    """
    
    # Basic filters
    name = django_filters.CharFilter(lookup_expr='icontains')
    category = django_filters.ModelChoiceFilter(queryset=Category.objects.all())
    category_slug = django_filters.CharFilter(field_name='category__slug', lookup_expr='exact')
    is_featured = django_filters.BooleanFilter()
    is_active = django_filters.BooleanFilter()
    status = django_filters.ChoiceFilter(choices=Product.STATUS_CHOICES)
    condition = django_filters.ChoiceFilter(choices=Product.CONDITION_CHOICES)
    
    # Price filters
    price = django_filters.RangeFilter()
    price_min = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    price_max = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    price_exact = django_filters.NumberFilter(field_name='price', lookup_expr='exact')
    
    # Stock filters
    in_stock = django_filters.BooleanFilter(method='filter_in_stock')
    low_stock = django_filters.BooleanFilter(method='filter_low_stock')
    stock_quantity = django_filters.RangeFilter()
    stock_min = django_filters.NumberFilter(field_name='stock_quantity', lookup_expr='gte')
    stock_max = django_filters.NumberFilter(field_name='stock_quantity', lookup_expr='lte')
    
    # Product attributes
    brand = django_filters.CharFilter(lookup_expr='icontains')
    material = django_filters.CharFilter(lookup_expr='icontains')
    color = django_filters.CharFilter(lookup_expr='icontains')
    size = django_filters.CharFilter(lookup_expr='icontains')
    weight = django_filters.RangeFilter()
    
    # Sale and discount filters
    on_sale = django_filters.BooleanFilter(method='filter_on_sale')
    discount_min = django_filters.NumberFilter(method='filter_discount_min')
    discount_max = django_filters.NumberFilter(method='filter_discount_max')
    
    # Rating and review filters
    rating_min = django_filters.NumberFilter(field_name='rating_average', lookup_expr='gte')
    rating_max = django_filters.NumberFilter(field_name='rating_average', lookup_expr='lte')
    has_reviews = django_filters.BooleanFilter(method='filter_has_reviews')
    
    # Date filters
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    updated_after = django_filters.DateTimeFilter(field_name='updated_at', lookup_expr='gte')
    updated_before = django_filters.DateTimeFilter(field_name='updated_at', lookup_expr='lte')
    
    # Tag filter
    tags = django_filters.CharFilter(method='filter_by_tags')
    
    # SKU filter
    sku = django_filters.CharFilter(lookup_expr='icontains')
    
    # Multiple category filter
    categories = django_filters.BaseInFilter(field_name='category__id')
    
    # Search filter (combines multiple fields)
    search = django_filters.CharFilter(method='filter_search')
    
    # Ordering
    ordering = django_filters.OrderingFilter(
        fields=(
            ('name', 'name'),
            ('price', 'price'),
            ('created_at', 'created_at'),
            ('updated_at', 'updated_at'),
            ('view_count', 'view_count'),
            ('order_count', 'order_count'),
            ('rating_average', 'rating_average'),
            ('stock_quantity', 'stock_quantity'),
        ),
        field_labels={
            'name': 'Name',
            'price': 'Price',
            'created_at': 'Date Created',
            'updated_at': 'Date Updated',
            'view_count': 'Views',
            'order_count': 'Orders',
            'rating_average': 'Rating',
            'stock_quantity': 'Stock',
        }
    )
    
    class Meta:
        model = Product
        fields = [
            'name', 'category', 'category_slug', 'is_featured', 'is_active',
            'status', 'condition', 'price', 'brand', 'material', 'color',
            'size', 'weight', 'sku', 'tags', 'stock_quantity'
        ]
    
    def filter_in_stock(self, queryset, name, value):
        """Filter products that are in stock"""
        if value is True:
            return queryset.filter(
                Q(track_inventory=False) | 
                Q(track_inventory=True, stock_quantity__gt=0)
            )
        elif value is False:
            return queryset.filter(
                track_inventory=True, 
                stock_quantity=0
            )
        return queryset
    
    def filter_low_stock(self, queryset, name, value):
        """Filter products with low stock"""
        if value is True:
            return queryset.filter(
                track_inventory=True,
                stock_quantity__lte=F('low_stock_threshold'),
                stock_quantity__gt=0
            )
        elif value is False:
            return queryset.filter(
                Q(track_inventory=False) |
                Q(track_inventory=True, stock_quantity__gt=F('low_stock_threshold'))
            )
        return queryset
    
    def filter_on_sale(self, queryset, name, value):
        """Filter products that are on sale"""
        if value is True:
            return queryset.filter(
                original_price__isnull=False,
                price__lt=F('original_price')
            )
        elif value is False:
            return queryset.filter(
                Q(original_price__isnull=True) |
                Q(price__gte=F('original_price'))
            )
        return queryset
    
    def filter_discount_min(self, queryset, name, value):
        """Filter products with minimum discount percentage"""
        if value is not None:
            # Calculate discount percentage and filter
            return queryset.filter(
                original_price__isnull=False,
                price__lt=F('original_price')
            ).extra(
                where=[
                    "(original_price - price) / original_price * 100 >= %s"
                ],
                params=[value]
            )
        return queryset
    
    def filter_discount_max(self, queryset, name, value):
        """Filter products with maximum discount percentage"""
        if value is not None:
            return queryset.filter(
                original_price__isnull=False,
                price__lt=F('original_price')
            ).extra(
                where=[
                    "(original_price - price) / original_price * 100 <= %s"
                ],
                params=[value]
            )
        return queryset
    
    def filter_has_reviews(self, queryset, name, value):
        """Filter products that have reviews"""
        if value is True:
            return queryset.filter(review_count__gt=0)
        elif value is False:
            return queryset.filter(review_count=0)
        return queryset
    
    def filter_by_tags(self, queryset, name, value):
        """Filter products by tags (comma-separated)"""
        if value:
            tag_list = [tag.strip() for tag in value.split(',')]
            query = Q()
            for tag in tag_list:
                query |= Q(tags__icontains=tag)
            return queryset.filter(query)
        return queryset
    
    def filter_search(self, queryset, name, value):
        """
        Global search across multiple fields
        Searches in: name, description, short_description, tags, brand, sku
        """
        if value:
            return queryset.filter(
                Q(name__icontains=value) |
                Q(description__icontains=value) |
                Q(short_description__icontains=value) |
                Q(tags__icontains=value) |
                Q(brand__icontains=value) |
                Q(sku__icontains=value) |
                Q(category__name__icontains=value)
            ).distinct()
        return queryset


class ProductAdminFilter(ProductFilter):
    """
    Extended filter for admin interface with additional admin-only filters
    """
    
    # Admin-specific filters
    has_images = django_filters.BooleanFilter(method='filter_has_images')
    has_attributes = django_filters.BooleanFilter(method='filter_has_attributes')
    has_variants = django_filters.BooleanFilter(method='filter_has_variants')
    track_inventory = django_filters.BooleanFilter()
    allow_backorders = django_filters.BooleanFilter()
    requires_shipping = django_filters.BooleanFilter()
    is_digital = django_filters.BooleanFilter()
    
    # Performance filters
    view_count_min = django_filters.NumberFilter(field_name='view_count', lookup_expr='gte')
    view_count_max = django_filters.NumberFilter(field_name='view_count', lookup_expr='lte')
    order_count_min = django_filters.NumberFilter(field_name='order_count', lookup_expr='gte')
    order_count_max = django_filters.NumberFilter(field_name='order_count', lookup_expr='lte')
    
    # Cost and profit filters
    cost_price = django_filters.RangeFilter()
    profit_margin_min = django_filters.NumberFilter(method='filter_profit_margin_min')
    profit_margin_max = django_filters.NumberFilter(method='filter_profit_margin_max')
    
    def filter_has_images(self, queryset, name, value):
        """Filter products that have images"""
        if value is True:
            return queryset.annotate(
                image_count=Count('images')
            ).filter(image_count__gt=0)
        elif value is False:
            return queryset.annotate(
                image_count=Count('images')
            ).filter(image_count=0)
        return queryset
    
    def filter_has_attributes(self, queryset, name, value):
        """Filter products that have attributes"""
        if value is True:
            return queryset.annotate(
                attribute_count=Count('attributes')
            ).filter(attribute_count__gt=0)
        elif value is False:
            return queryset.annotate(
                attribute_count=Count('attributes')
            ).filter(attribute_count=0)
        return queryset
    
    def filter_has_variants(self, queryset, name, value):
        """Filter products that have variants"""
        if value is True:
            return queryset.annotate(
                variant_count=Count('variants')
            ).filter(variant_count__gt=0)
        elif value is False:
            return queryset.annotate(
                variant_count=Count('variants')
            ).filter(variant_count=0)
        return queryset
    
    def filter_profit_margin_min(self, queryset, name, value):
        """Filter products with minimum profit margin"""
        if value is not None:
            return queryset.filter(
                cost_price__isnull=False,
                cost_price__lt=F('price')
            ).extra(
                where=[
                    "(price - cost_price) / price * 100 >= %s"
                ],
                params=[value]
            )
        return queryset
    
    def filter_profit_margin_max(self, queryset, name, value):
        """Filter products with maximum profit margin"""
        if value is not None:
            return queryset.filter(
                cost_price__isnull=False,
                cost_price__lt=F('price')
            ).extra(
                where=[
                    "(price - cost_price) / price * 100 <= %s"
                ],
                params=[value]
            )
        return queryset


class ProductExportFilter(django_filters.FilterSet):
    """
    Simplified filter for product export functionality
    """
    
    category = django_filters.ModelMultipleChoiceFilter(queryset=Category.objects.all())
    is_active = django_filters.BooleanFilter()
    is_featured = django_filters.BooleanFilter()
    status = django_filters.MultipleChoiceFilter(choices=Product.STATUS_CHOICES)
    created_after = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')
    price_min = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    price_max = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    
    class Meta:
        model = Product
        fields = ['category', 'is_active', 'is_featured', 'status']