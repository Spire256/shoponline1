"""
Products App Pagination
Custom pagination classes for product listings
"""

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from collections import OrderedDict


class ProductPagination(PageNumberPagination):
    """
    Custom pagination for product listings
    """
    
    page_size = 12  # Default products per page
    page_size_query_param = 'page_size'
    max_page_size = 100
    page_query_param = 'page'
    
    def get_paginated_response(self, data):
        """
        Return custom paginated response with additional metadata
        """
        return Response(OrderedDict([
            ('count', self.page.paginator.count),
            ('total_pages', self.page.paginator.num_pages),
            ('current_page', self.page.number),
            ('page_size', self.get_page_size(self.request)),
            ('next', self.get_next_link()),
            ('previous', self.get_previous_link()),
            ('results', data)
        ]))
    
    def get_page_size(self, request):
        """
        Get the page size for the current request
        """
        if self.page_size_query_param:
            try:
                page_size = int(request.query_params[self.page_size_query_param])
                if page_size > 0:
                    return min(page_size, self.max_page_size)
            except (KeyError, ValueError):
                pass
        
        return self.page_size


class ProductSearchPagination(PageNumberPagination):
    """
    Pagination for product search results
    """
    
    page_size = 20  # More results for search
    page_size_query_param = 'page_size'
    max_page_size = 50
    page_query_param = 'page'
    
    def get_paginated_response(self, data):
        """
        Return search-specific paginated response
        """
        return Response(OrderedDict([
            ('query', self.request.query_params.get('q', '')),
            ('count', self.page.paginator.count),
            ('total_pages', self.page.paginator.num_pages),
            ('current_page', self.page.number),
            ('page_size', self.get_page_size(self.request)),
            ('next', self.get_next_link()),
            ('previous', self.get_previous_link()),
            ('results', data),
            ('search_time', getattr(self, 'search_time', None))
        ]))


class ProductAdminPagination(PageNumberPagination):
    """
    Pagination for admin product management
    """
    
    page_size = 25  # Standard admin table size
    page_size_query_param = 'page_size'
    max_page_size = 200  # Allow larger page sizes for admin
    page_query_param = 'page'
    
    def get_paginated_response(self, data):
        """
        Return admin-specific paginated response with bulk action support
        """
        return Response(OrderedDict([
            ('count', self.page.paginator.count),
            ('total_pages', self.page.paginator.num_pages),
            ('current_page', self.page.number),
            ('page_size', self.get_page_size(self.request)),
            ('next', self.get_next_link()),
            ('previous', self.get_previous_link()),
            ('results', data),
            ('bulk_actions_available', True),
            ('filters_applied', self._get_applied_filters())
        ]))
    
    def _get_applied_filters(self):
        """
        Get list of applied filters from request
        """
        filter_params = [
            'category', 'is_active', 'is_featured', 'status', 'condition',
            'price_min', 'price_max', 'in_stock', 'low_stock', 'search'
        ]
        
        applied_filters = {}
        for param in filter_params:
            value = self.request.query_params.get(param)
            if value:
                applied_filters[param] = value
        
        return applied_filters


class ProductExportPagination(PageNumberPagination):
    """
    Pagination for product export (larger page sizes)
    """
    
    page_size = 1000  # Large page size for export
    page_size_query_param = 'page_size'
    max_page_size = 5000  # Very large for export operations
    page_query_param = 'page'
    
    def get_paginated_response(self, data):
        """
        Return export-specific paginated response
        """
        return Response(OrderedDict([
            ('count', self.page.paginator.count),
            ('total_pages', self.page.paginator.num_pages),
            ('current_page', self.page.number),
            ('page_size', self.get_page_size(self.request)),
            ('next', self.get_next_link()),
            ('previous', self.get_previous_link()),
            ('results', data),
            ('export_format', 'json'),
            ('generated_at', self.request._request_time if hasattr(self.request, '_request_time') else None)
        ]))


class ProductCatalogPagination(PageNumberPagination):
    """
    Pagination for product catalog (client-facing)
    """
    
    page_size = 16  # Good for grid layouts (4x4)
    page_size_query_param = 'page_size'
    max_page_size = 48  # Maximum for client performance
    page_query_param = 'page'
    
    def get_paginated_response(self, data):
        """
        Return catalog-specific paginated response with view metadata
        """
        return Response(OrderedDict([
            ('count', self.page.paginator.count),
            ('total_pages', self.page.paginator.num_pages),
            ('current_page', self.page.number),
            ('page_size', self.get_page_size(self.request)),
            ('next', self.get_next_link()),
            ('previous', self.get_previous_link()),
            ('results', data),
            ('view_type', self.request.query_params.get('view', 'grid')),
            ('sort_by', self.request.query_params.get('ordering', '-created_at')),
            ('has_filters', self._has_active_filters())
        ]))
    
    def _has_active_filters(self):
        """
        Check if any filters are currently applied
        """
        filter_params = [
            'category', 'category_slug', 'price_min', 'price_max', 
            'brand', 'color', 'size', 'on_sale', 'in_stock', 'search'
        ]
        
        return any(
            self.request.query_params.get(param) 
            for param in filter_params
        )


class ProductComparisonPagination(PageNumberPagination):
    """
    Pagination for product comparison results
    """
    
    page_size = 8  # Smaller size for comparison
    page_size_query_param = 'page_size'
    max_page_size = 20  # Limit for comparison performance
    page_query_param = 'page'
    
    def get_paginated_response(self, data):
        """
        Return comparison-specific paginated response
        """
        return Response(OrderedDict([
            ('count', self.page.paginator.count),
            ('total_pages', self.page.paginator.num_pages),
            ('current_page', self.page.number),
            ('page_size', self.get_page_size(self.request)),
            ('next', self.get_next_link()),
            ('previous', self.get_previous_link()),
            ('results', data),
            ('comparison_enabled', True),
            ('max_compare_items', 5)
        ]))


class ProductRecommendationPagination(PageNumberPagination):
    """
    Pagination for product recommendations
    """
    
    page_size = 6  # Small size for recommendations
    page_size_query_param = 'page_size'
    max_page_size = 12  # Keep recommendations focused
    page_query_param = 'page'
    
    def get_paginated_response(self, data):
        """
        Return recommendation-specific paginated response
        """
        return Response(OrderedDict([
            ('count', self.page.paginator.count),
            ('total_pages', self.page.paginator.num_pages),
            ('current_page', self.page.number),
            ('page_size', self.get_page_size(self.request)),
            ('next', self.get_next_link()),
            ('previous', self.get_previous_link()),
            ('results', data),
            ('recommendation_type', self.request.query_params.get('type', 'similar')),
            ('based_on', self.request.query_params.get('product_id', 'user_behavior'))
        ]))