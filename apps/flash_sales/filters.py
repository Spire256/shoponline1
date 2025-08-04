# apps/flash_sales/filters.py
import django_filters
from django.utils import timezone
from .models import FlashSale, FlashSaleProduct


class FlashSaleFilter(django_filters.FilterSet):
    """Filter for Flash Sales"""
    
    name = django_filters.CharFilter(lookup_expr='icontains')
    is_active = django_filters.BooleanFilter()
    discount_min = django_filters.NumberFilter(field_name='discount_percentage', lookup_expr='gte')
    discount_max = django_filters.NumberFilter(field_name='discount_percentage', lookup_expr='lte')
    start_date = django_filters.DateFilter(field_name='start_time', lookup_expr='date__gte')
    end_date = django_filters.DateFilter(field_name='end_time', lookup_expr='date__lte')
    created_by = django_filters.CharFilter(field_name='created_by__email')
    
    # Custom filters
    status = django_filters.ChoiceFilter(
        choices=[
            ('active', 'Active'),
            ('upcoming', 'Upcoming'),
            ('expired', 'Expired'),
        ],
        method='filter_by_status'
    )
    
    class Meta:
        model = FlashSale
        fields = [
            'name', 'is_active', 'discount_min', 'discount_max',
            'start_date', 'end_date', 'created_by', 'status'
        ]
    
    def filter_by_status(self, queryset, name, value):
        """Filter by flash sale status"""
        now = timezone.now()
        
        if value == 'active':
            return queryset.filter(
                is_active=True,
                start_time__lte=now,
                end_time__gt=now
            )
        elif value == 'upcoming':
            return queryset.filter(
                is_active=True,
                start_time__gt=now
            )
        elif value == 'expired':
            return queryset.filter(
                end_time__lt=now
            )
        
        return queryset


class FlashSaleProductFilter(django_filters.FilterSet):
    """Filter for Flash Sale Products"""
    
    flash_sale = django_filters.UUIDFilter()
    product_name = django_filters.CharFilter(field_name='product__name', lookup_expr='icontains')
    is_active = django_filters.BooleanFilter()
    price_min = django_filters.NumberFilter(field_name='flash_sale_price', lookup_expr='gte')
    price_max = django_filters.NumberFilter(field_name='flash_sale_price', lookup_expr='lte')
    discount_min = django_filters.NumberFilter(method='filter_discount_min')
    discount_max = django_filters.NumberFilter(method='filter_discount_max')
    
    class Meta:
        model = FlashSaleProduct
        fields = [
            'flash_sale', 'product_name', 'is_active',
            'price_min', 'price_max', 'discount_min', 'discount_max'
        ]
    
    def filter_discount_min(self, queryset, name, value):
        """Filter by minimum discount percentage"""
        return queryset.filter(
            models.Q(custom_discount_percentage__gte=value) |
            models.Q(
                custom_discount_percentage__isnull=True,
                flash_sale__discount_percentage__gte=value
            )
        )
    
    def filter_discount_max(self, queryset, name, value):
        """Filter by maximum discount percentage"""
        return queryset.filter(
            models.Q(custom_discount_percentage__lte=value) |
            models.Q(
                custom_discount_percentage__isnull=True,
                flash_sale__discount_percentage__lte=value
            )
        )
