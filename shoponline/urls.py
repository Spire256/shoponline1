# shoponline_project/urls.py
"""
Main URL configuration for Ugandan E-commerce Platform.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from rest_framework.routers import DefaultRouter
from rest_framework.documentation import include_docs_urls

# API version prefix
API_VERSION = 'v1'

urlpatterns = [
    # Admin interface
    path('admin/', admin.site.urls),
    
    # API documentation
    path('api/docs/', include_docs_urls(title='ShopOnline Uganda API')),
    
    # Authentication endpoints
    path(f'api/{API_VERSION}/auth/', include('apps.accounts.urls')),
    
    # Core API endpoints
    path(f'api/{API_VERSION}/products/', include('apps.products.urls')),
    path(f'api/{API_VERSION}/categories/', include('apps.categories.urls')),
    path(f'api/{API_VERSION}/flash-sales/', include('apps.flash_sales.urls')),
    path(f'api/{API_VERSION}/orders/', include('apps.orders.urls')),
    path(f'api/{API_VERSION}/payments/', include('apps.payments.urls')),
    path(f'api/{API_VERSION}/notifications/', include('apps.notifications.urls')),
    
    # Admin dashboard endpoints
    path(f'api/{API_VERSION}/admin/', include('apps.admin_dashboard.urls')),
    
    # Health check endpoint
    path('health/', TemplateView.as_view(
        template_name='health_check.html',
        extra_context={'status': 'OK'}
    ), name='health_check'),
    
    # API root endpoint
    path(f'api/{API_VERSION}/', TemplateView.as_view(
        template_name='api_root.html',
        extra_context={
            'title': 'ShopOnline Uganda API',
            'version': API_VERSION,
            'description': 'RESTful API for Ugandan E-commerce Platform'
        }
    ), name='api_root'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    
    # Debug toolbar URLs
    if 'debug_toolbar' in settings.INSTALLED_APPS:
        import debug_toolbar
        urlpatterns = [
            path('__debug__/', include(debug_toolbar.urls)),
        ] + urlpatterns

# Custom error handlers
handler400 = 'apps.core.views.bad_request_view'
handler403 = 'apps.core.views.permission_denied_view'
handler404 = 'apps.core.views.not_found_view'
handler500 = 'apps.core.views.server_error_view'

# Admin site customization
admin.site.site_header = 'ShopOnline Uganda Administration'
admin.site.site_title = 'ShopOnline Admin'
admin.site.index_title = 'Welcome to ShopOnline Uganda Administration'
