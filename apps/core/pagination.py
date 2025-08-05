"""
Custom pagination classes for ShopOnline Uganda E-commerce Platform.

Provides pagination functionality with:
- Custom page size limits
- Pagination metadata
- Search-friendly pagination
- Performance optimizations
- Mobile-friendly pagination
"""

from rest_framework.pagination import PageNumberPagination, LimitOffsetPagination
from rest_framework.response import Response
from collections import OrderedDict
from django.core.paginator import InvalidPage
from django.conf import settings
import math

from .constants import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, PAGE_SIZE_OPTIONS


class StandardResultsPagination(PageNumberPagination):
    """
    Standard pagination class for most API endpoints.
    """
    page_size = DEFAULT_PAGE_SIZE
    page_size_query_param = 'page_size'
    max_page_size = MAX_PAGE_SIZE
    page_query_param = 'page'

    def get_paginated_response(self, data):
        """
        Return paginated response with additional metadata.
        """
        return Response(OrderedDict([
            ('pagination', OrderedDict([
                ('count', self.page.paginator.count),
                ('next', self.get_next_link()),
                ('previous', self.get_previous_link()),
                ('page', self.page.number),
                ('page_size', self.get_page_size(self.request)),
                ('total_pages', self.page.paginator.num_pages),
                ('has_next', self.page.has_next()),
                ('has_previous', self.page.has_previous()),
                ('start_index', self.page.start_index()),
                ('end_index', self.page.end_index()),
            ])),
            ('results', data)
        ]))

    def get_page_size(self, request):
        """
        Get page size from request with validation.
        """
        if self.page_size_query_param:
            try:
                page_size = int(request.query_params[self.page_size_query_param])
                if page_size > 0:
                    return min(page_size, self.max_page_size)
            except (KeyError, ValueError):
                pass
        
        return self.page_size


class StandardResultsSetPagination(StandardResultsPagination):
    """
    Standard pagination class for most API endpoints.
    This is an alias for StandardResultsPagination to maintain compatibility.
    """
    pass


class ProductPagination(StandardResultsPagination):
    """
    Pagination for product listings with category-specific optimization.
    """
    page_size = 20
    max_page_size = 50

    def get_paginated_response(self, data):
        """
        Enhanced response with product-specific metadata.
        """
        response = super().get_paginated_response(data)
        
        # Add product-specific metadata
        response.data['pagination'].update({
            'available_page_sizes': PAGE_SIZE_OPTIONS,
            'showing_text': self.get_showing_text(),
            'category_count': getattr(self, 'category_count', None),
        })
        
        return response

    def get_showing_text(self):
        """
        Get human-readable text showing current page info.
        """
        start = self.page.start_index()
        end = self.page.end_index()
        total = self.page.paginator.count
        
        return f"Showing {start}-{end} of {total} products"


class SearchResultsPagination(StandardResultsPagination):
    """
    Pagination for search results with relevance scoring.
    """
    page_size = 15
    max_page_size = 50

    def get_paginated_response(self, data):
        """
        Enhanced response with search-specific metadata.
        """
        response = super().get_paginated_response(data)
        
        # Add search-specific metadata
        response.data['pagination'].update({
            'search_query': getattr(self, 'search_query', ''),
            'search_time': getattr(self, 'search_time', None),
            'suggested_page_size': self.get_suggested_page_size(),
        })
        
        return response

    def get_suggested_page_size(self):
        """
        Suggest optimal page size based on total results.
        """
        total = self.page.paginator.count
        
        if total <= 10:
            return 10
        elif total <= 20:
            return 20
        elif total <= 50:
            return 25
        else:
            return 20


class AdminPagination(StandardResultsPagination):
    """
    Pagination for admin interfaces with higher page sizes.
    """
    page_size = 50
    max_page_size = 200

    def get_paginated_response(self, data):
        """
        Enhanced response with admin-specific metadata.
        """
        response = super().get_paginated_response(data)
        
        # Add admin-specific metadata
        response.data['pagination'].update({
            'bulk_actions_available': True,
            'export_available': True,
            'admin_page_sizes': [25, 50, 100, 200],
        })
        
        return response


class FlashSalePagination(StandardResultsPagination):
    """
    Pagination for flash sale products.
    """
    page_size = 12  # Grid-friendly number
    max_page_size = 24

    def get_paginated_response(self, data):
        """
        Enhanced response with flash sale metadata.
        """
        response = super().get_paginated_response(data)
        
        # Add flash sale specific metadata
        response.data['pagination'].update({
            'grid_layout': True,
            'time_sensitive': True,
            'auto_refresh': getattr(self, 'auto_refresh', 30),  # seconds
        })
        
        return response


class OrderPagination(StandardResultsPagination):
    """
    Pagination for order listings.
    """
    page_size = 25
    max_page_size = 100

    def get_paginated_response(self, data):
        """
        Enhanced response with order-specific metadata.
        """
        response = super().get_paginated_response(data)
        
        # Add order-specific metadata
        response.data['pagination'].update({
            'date_range': getattr(self, 'date_range', None),
            'status_filter': getattr(self, 'status_filter', None),
            'total_value': getattr(self, 'total_value', None),
        })
        
        return response


class OptimizedLimitOffsetPagination(LimitOffsetPagination):
    """
    Optimized limit/offset pagination for large datasets.
    """
    default_limit = DEFAULT_PAGE_SIZE
    limit_query_param = 'limit'
    offset_query_param = 'offset'
    max_limit = MAX_PAGE_SIZE

    def get_paginated_response(self, data):
        """
        Return paginated response with metadata.
        """
        count = self.count
        limit = self.get_limit(self.request)
        offset = self.offset
        
        # Calculate page information
        current_page = (offset // limit) + 1 if limit > 0 else 1
        total_pages = math.ceil(count / limit) if limit > 0 else 1
        
        return Response(OrderedDict([
            ('pagination', OrderedDict([
                ('count', count),
                ('next', self.get_next_link()),
                ('previous', self.get_previous_link()),
                ('limit', limit),
                ('offset', offset),
                ('current_page', current_page),
                ('total_pages', total_pages),
                ('has_next', self.get_next_link() is not None),
                ('has_previous', self.get_previous_link() is not None),
            ])),
            ('results', data)
        ]))


class CursorPagination(PageNumberPagination):
    """
    Cursor-based pagination for real-time data (notifications, activity logs).
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    cursor_query_param = 'cursor'
    ordering = '-created_at'

    def paginate_queryset(self, queryset, request, view=None):
        """
        Paginate queryset using cursor-based pagination.
        """
        self.request = request
        cursor = request.query_params.get(self.cursor_query_param)
        
        if cursor:
            # Decode cursor and filter queryset
            try:
                from django.utils import timezone
                import base64
                import json
                
                decoded = base64.b64decode(cursor.encode()).decode()
                cursor_data = json.loads(decoded)
                
                if 'created_at' in cursor_data:
                    created_at = timezone.datetime.fromisoformat(cursor_data['created_at'])
                    queryset = queryset.filter(created_at__lt=created_at)
                    
            except (ValueError, json.JSONDecodeError):
                pass  # Invalid cursor, ignore
        
        # Apply ordering
        queryset = queryset.order_by(self.ordering)
        
        # Get page size
        page_size = self.get_page_size(request)
        
        # Get one extra item to check if there's a next page
        items = list(queryset[:page_size + 1])
        
        # Check if there are more items
        has_next = len(items) > page_size
        if has_next:
            items = items[:-1]
        
        # Store pagination info
        self.items = items
        self.has_next_page = has_next
        
        return items

    def get_paginated_response(self, data):
        """
        Return paginated response with cursor metadata.
        """
        next_cursor = None
        
        if self.has_next_page and self.items:
            # Generate cursor for next page
            last_item = self.items[-1]
            if hasattr(last_item, 'created_at'):
                import base64
                import json
                
                cursor_data = {
                    'created_at': last_item.created_at.isoformat()
                }
                cursor_json = json.dumps(cursor_data)
                next_cursor = base64.b64encode(cursor_json.encode()).decode()
        
        return Response(OrderedDict([
            ('pagination', OrderedDict([
                ('has_next', self.has_next_page),
                ('next_cursor', next_cursor),
                ('page_size', len(data)),
                ('max_page_size', self.max_page_size),
            ])),
            ('results', data)
        ]))


class MobilePagination(StandardResultsPagination):
    """
    Mobile-optimized pagination with smaller page sizes.
    """
    page_size = 10
    max_page_size = 25

    def get_paginated_response(self, data):
        """
        Mobile-optimized response with minimal metadata.
        """
        return Response(OrderedDict([
            ('pagination', OrderedDict([
                ('count', self.page.paginator.count),
                ('has_next', self.page.has_next()),
                ('has_previous', self.page.has_previous()),
                ('page', self.page.number),
                ('total_pages', self.page.paginator.num_pages),
                ('next_url', self.get_next_link()),
                ('previous_url', self.get_previous_link()),
            ])),
            ('results', data)
        ]))


class InfinitePagination(StandardResultsPagination):
    """
    Infinite scroll pagination for mobile apps and modern UIs.
    """
    page_size = 20

    def get_paginated_response(self, data):
        """
        Response optimized for infinite scroll.
        """
        return Response(OrderedDict([
            ('has_more', self.page.has_next()),
            ('next_page', self.page.next_page_number() if self.page.has_next() else None),
            ('total_count', self.page.paginator.count),
            ('current_count', len(data)),
            ('results', data)
        ]))


class AnalyticsPagination(StandardResultsPagination):
    """
    Pagination for analytics data with aggregation support.
    """
    page_size = 100
    max_page_size = 1000

    def get_paginated_response(self, data):
        """
        Enhanced response with analytics metadata.
        """
        response = super().get_paginated_response(data)
        
        # Add analytics-specific metadata
        response.data['pagination'].update({
            'aggregation_level': getattr(self, 'aggregation_level', 'day'),
            'date_range': getattr(self, 'date_range', None),
            'metrics_included': getattr(self, 'metrics_included', []),
            'export_formats': ['csv', 'excel', 'json'],
        })
        
        return response


class CustomPageNumberPagination(PageNumberPagination):
    """
    Highly customizable pagination class.
    """
    
    def __init__(self, page_size=None, max_page_size=None, **kwargs):
        """
        Initialize with custom parameters.
        """
        if page_size:
            self.page_size = page_size
        if max_page_size:
            self.max_page_size = max_page_size
        
        super().__init__(**kwargs)

    def get_paginated_response(self, data):
        """
        Customizable paginated response.
        """
        return Response(OrderedDict([
            ('pagination', self.get_pagination_metadata()),
            ('results', data)
        ]))

    def get_pagination_metadata(self):
        """
        Get pagination metadata that can be customized per view.
        """
        return OrderedDict([
            ('count', self.page.paginator.count),
            ('next', self.get_next_link()),
            ('previous', self.get_previous_link()),
            ('page', self.page.number),
            ('page_size', self.get_page_size(self.request)),
            ('total_pages', self.page.paginator.num_pages),
            ('has_next', self.page.has_next()),
            ('has_previous', self.page.has_previous()),
        ])


class PaginationMixin:
    """
    Mixin to add pagination utilities to views.
    """
    
    def get_pagination_context(self):
        """
        Get additional context for pagination.
        """
        paginator = getattr(self, 'paginator', None)
        if not paginator:
            return {}
        
        page = getattr(paginator, 'page', None)
        if not page:
            return {}
        
        return {
            'is_first_page': page.number == 1,
            'is_last_page': page.number == page.paginator.num_pages,
            'page_range': self.get_page_range(page),
            'showing_text': self.get_showing_text(page),
        }

    def get_page_range(self, page, window=5):
        """
        Get a range of page numbers around the current page.
        """
        current = page.number
        total_pages = page.paginator.num_pages
        
        # Calculate start and end of the window
        start = max(1, current - window // 2)
        end = min(total_pages + 1, start + window)
        
        # Adjust start if we're near the end
        if end - start < window:
            start = max(1, end - window)
        
        return list(range(start, end))

    def get_showing_text(self, page):
        """
        Get text showing current page information.
        """
        start = page.start_index()
        end = page.end_index()
        total = page.paginator.count
        
        return f"Showing {start} to {end} of {total} entries"


class SmartPagination(StandardResultsPagination):
    """
    Smart pagination that adapts page size based on data type and user preferences.
    """
    
    def get_page_size(self, request):
        """
        Smart page size calculation based on various factors.
        """
        # Get user preference if available
        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            user_preference = getattr(user, 'preferred_page_size', None)
            if user_preference and user_preference <= self.max_page_size:
                return user_preference
        
        # Get device type from user agent
        user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
        is_mobile = any(device in user_agent for device in ['mobile', 'android', 'iphone'])
        
        # Adjust page size for mobile devices
        if is_mobile:
            return min(self.page_size // 2, 15)
        
        # Check if this is an API request (vs web request)
        is_api = request.path.startswith('/api/') or 'application/json' in request.META.get('HTTP_ACCEPT', '')
        
        if is_api:
            return super().get_page_size(request)
        
        # Default page size for web requests
        return self.page_size

    def get_paginated_response(self, data):
        """
        Enhanced response with smart pagination metadata.
        """
        response = super().get_paginated_response(data)
        
        # Add smart pagination metadata
        response.data['pagination'].update({
            'pagination_type': 'smart',
            'auto_adjusted': getattr(self, 'auto_adjusted', False),
            'user_preference': getattr(self, 'user_preference', None),
            'device_optimized': getattr(self, 'device_optimized', False),
        })
        
        return response


class CachedPagination(StandardResultsPagination):
    """
    Pagination with caching support for better performance.
    """
    cache_timeout = 300  # 5 minutes
    
    def paginate_queryset(self, queryset, request, view=None):
        """
        Paginate queryset with caching.
        """
        # Generate cache key based on queryset and pagination parameters
        cache_key = self.get_cache_key(queryset, request)
        
        # Try to get cached result
        cached_result = self.get_cached_result(cache_key)
        if cached_result:
            return cached_result
        
        # Get fresh result and cache it
        result = super().paginate_queryset(queryset, request, view)
        self.cache_result(cache_key, result)
        
        return result

    def get_cache_key(self, queryset, request):
        """
        Generate cache key for the current pagination request.
        """
        import hashlib
        
        # Build key from query parameters
        query_params = sorted(request.query_params.items())
        query_string = '&'.join([f"{k}={v}" for k, v in query_params])
        
        # Add queryset info (model name, filters, etc.)
        model_name = queryset.model._meta.label_lower
        
        # Create hash
        key_string = f"pagination:{model_name}:{query_string}"
        return hashlib.md5(key_string.encode()).hexdigest()

    def get_cached_result(self, cache_key):
        """
        Get cached pagination result.
        """
        from django.core.cache import cache
        return cache.get(cache_key)

    def cache_result(self, cache_key, result):
        """
        Cache pagination result.
        """
        from django.core.cache import cache
        cache.set(cache_key, result, self.cache_timeout)


# Utility functions for pagination

def get_pagination_class(view_type='standard'):
    """
    Get appropriate pagination class based on view type.
    """
    pagination_classes = {
        'standard': StandardResultsPagination,
        'standard_set': StandardResultsSetPagination,  # Added for compatibility
        'product': ProductPagination,
        'search': SearchResultsPagination,
        'admin': AdminPagination,
        'flash_sale': FlashSalePagination,
        'order': OrderPagination,
        'mobile': MobilePagination,
        'infinite': InfinitePagination,
        'analytics': AnalyticsPagination,
        'cursor': CursorPagination,
        'cached': CachedPagination,
        'smart': SmartPagination,
    }
    
    return pagination_classes.get(view_type, StandardResultsPagination)


def paginate_queryset(queryset, request, page_size=None, pagination_class=None):
    """
    Utility function to manually paginate a queryset.
    """
    if not pagination_class:
        pagination_class = StandardResultsPagination
    
    paginator = pagination_class()
    if page_size:
        paginator.page_size = page_size
    
    return paginator.paginate_queryset(queryset, request)


def get_page_info(page):
    """
    Get comprehensive page information.
    """
    if not page:
        return {}
    
    return {
        'number': page.number,
        'total_pages': page.paginator.num_pages,
        'count': page.paginator.count,
        'per_page': page.paginator.per_page,
        'start_index': page.start_index(),
        'end_index': page.end_index(),
        'has_next': page.has_next(),
        'has_previous': page.has_previous(),
        'next_page_number': page.next_page_number() if page.has_next() else None,
        'previous_page_number': page.previous_page_number() if page.has_previous() else None,
    }


def calculate_pagination_stats(total_items, page_size, current_page=1):
    """
    Calculate pagination statistics.
    """
    total_pages = math.ceil(total_items / page_size) if page_size > 0 else 1
    start_index = ((current_page - 1) * page_size) + 1
    end_index = min(current_page * page_size, total_items)
    
    return {
        'total_items': total_items,
        'page_size': page_size,
        'current_page': current_page,
        'total_pages': total_pages,
        'start_index': start_index,
        'end_index': end_index,
        'has_next': current_page < total_pages,
        'has_previous': current_page > 1,
        'items_on_page': end_index - start_index + 1 if total_items > 0 else 0,
    }