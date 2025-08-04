# apps/admin_dashboard/filters.py
import django_filters
from django.db.models import Q
from .models import Banner, FeaturedProduct

class BannerFilter(django_filters.FilterSet):
    """Filter class for Banner model"""
    
    banner_type = django_filters.ChoiceFilter(
        choices=Banner.BANNER_TYPES,
        field_name='banner_type'
    )
    
    is_active = django_filters.BooleanFilter(
        field_name='is_active'
    )
    
    date_range = django_filters.DateFromToRangeFilter(
        field_name='created_at',
        lookup_expr='date'
    )
    
    search = django_filters.CharFilter(
        method='filter_search',
        label='Search in title and description'
    )

    class Meta:
        model = Banner
        fields = ['banner_type', 'is_active', 'date_range', 'search']

    def filter_search(self, queryset, name, value):
        """Custom search filter for title and description"""
        return queryset.filter(
            Q(title__icontains=value) | Q(description__icontains=value)
        )

class FeaturedProductFilter(django_filters.FilterSet):
    """Filter class for FeaturedProduct model"""
    
    is_active = django_filters.BooleanFilter(
        field_name='is_active'
    )
    
    product_category = django_filters.CharFilter(
        field_name='product__category__slug',
        lookup_expr='iexact'
    )
    
    featured_until = django_filters.DateFilter(
        field_name='featured_until',
        lookup_expr='gte'
    )
    
    search = django_filters.CharFilter(
        method='filter_search',
        label='Search in product name'
    )

    class Meta:
        model = FeaturedProduct
        fields = ['is_active', 'product_category', 'featured_until', 'search']

    def filter_search(self, queryset, name, value):
        """Custom search filter for product name"""
        return queryset.filter(product__name__icontains=value)
