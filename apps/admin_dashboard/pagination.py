# apps/admin_dashboard/pagination.py
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

class DashboardPagination(PageNumberPagination):
    """Custom pagination for dashboard views"""
    
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'links': {
                'next': self.get_next_link(),
                'previous': self.get_previous_link()
            },
            'count': self.page.paginator.count,
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
            'page_size': self.page_size,
            'results': data
        })

class AnalyticsPagination(PageNumberPagination):
    """Custom pagination for analytics data"""
    
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200
