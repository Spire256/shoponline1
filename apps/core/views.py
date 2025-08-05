"""
Core views for handling HTTP errors and common functionality
Aligned with Uganda E-commerce Platform architecture
"""
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from django.template import TemplateDoesNotExist
from django.conf import settings
from django.utils import timezone
from django.contrib.auth import get_user_model
import logging
import json

logger = logging.getLogger(__name__)
User = get_user_model()


def bad_request_view(request, exception=None):
    """
    Custom 400 Bad Request error handler
    Enhanced for e-commerce platform with proper API/Web distinction
    """
    context = {
        'error_code': 400,
        'error_title': 'Invalid Request',
        'error_message': 'Your request could not be processed due to invalid data or parameters.',
        'show_home_link': True,
        'platform_name': 'ShopOnline Uganda',
        'support_email': 'support@shoponline.com',
        'timestamp': timezone.now().isoformat(),
    }
    
    # Enhanced API detection for e-commerce endpoints
    is_api_request = (
        request.path.startswith('/api/') or 
        'application/json' in request.META.get('HTTP_ACCEPT', '') or
        request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest' or
        request.path.startswith('/admin/api/')
    )
    
    if is_api_request:
        error_response = {
            'error': 'Bad Request',
            'message': 'Invalid request data or parameters',
            'status_code': 400,
            'timestamp': context['timestamp'],
            'path': request.path,
            'method': request.method
        }
        
        # Add specific guidance for common e-commerce API errors
        if 'products' in request.path:
            error_response['hint'] = 'Check product ID format and required fields'
        elif 'payments' in request.path:
            error_response['hint'] = 'Verify payment method and amount format (UGX)'
        elif 'orders' in request.path:
            error_response['hint'] = 'Ensure all required order fields are provided'
        elif 'flash_sales' in request.path:
            error_response['hint'] = 'Check flash sale timing and product availability'
            
        return JsonResponse(error_response, status=400)
    
    # Enhanced context for web requests
    context.update({
        'current_path': request.path,
        'is_authenticated': request.user.is_authenticated if hasattr(request, 'user') else False,
        'user_type': _get_user_type(request),
        'suggested_actions': _get_suggested_actions_400(request),
    })
    
    return _render_error_template(request, 'errors/400.html', context, 400)


def permission_denied_view(request, exception=None):
    """
    Custom 403 Permission Denied error handler
    Enhanced for admin/client role separation
    """
    context = {
        'error_code': 403,
        'error_title': 'Access Denied',
        'error_message': 'You do not have permission to access this resource.',
        'show_login_link': not (hasattr(request, 'user') and request.user.is_authenticated),
        'show_home_link': True,
        'platform_name': 'ShopOnline Uganda',
        'support_email': 'support@shoponline.com',
        'timestamp': timezone.now().isoformat(),
    }
    
    # Enhanced API detection
    is_api_request = (
        request.path.startswith('/api/') or 
        'application/json' in request.META.get('HTTP_ACCEPT', '') or
        request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest'
    )
    
    if is_api_request:
        error_response = {
            'error': 'Permission Denied',
            'message': 'You do not have permission to access this resource',
            'status_code': 403,
            'timestamp': context['timestamp'],
            'path': request.path,
            'method': request.method
        }
        
        # Add specific guidance for role-based access
        if request.path.startswith('/api/admin/') or '/admin/' in request.path:
            error_response['hint'] = 'Admin access required. Ensure your account ends with @shoponline.com'
            error_response['required_role'] = 'admin'
        elif 'invitation' in request.path:
            error_response['hint'] = 'Valid admin invitation token required'
        else:
            error_response['hint'] = 'Authentication required or insufficient permissions'
            
        return JsonResponse(error_response, status=403)
    
    # Enhanced context for web requests
    user_type = _get_user_type(request)
    context.update({
        'current_path': request.path,
        'is_authenticated': request.user.is_authenticated if hasattr(request, 'user') else False,
        'user_type': user_type,
        'suggested_actions': _get_suggested_actions_403(request, user_type),
        'is_admin_area': '/admin/' in request.path or request.path.startswith('/admin'),
    })
    
    return _render_error_template(request, 'errors/403.html', context, 403)


def not_found_view(request, exception=None):
    """
    Custom 404 Not Found error handler
    Enhanced for e-commerce with helpful navigation suggestions
    """
    context = {
        'error_code': 404,
        'error_title': 'Page Not Found',
        'error_message': 'The page you are looking for could not be found.',
        'show_home_link': True,
        'platform_name': 'ShopOnline Uganda',
        'support_email': 'support@shoponline.com',
        'timestamp': timezone.now().isoformat(),
        'requested_path': request.path,
    }
    
    # Enhanced API detection
    is_api_request = (
        request.path.startswith('/api/') or 
        'application/json' in request.META.get('HTTP_ACCEPT', '') or
        request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest'
    )
    
    if is_api_request:
        error_response = {
            'error': 'Not Found',
            'message': f'The requested resource at {request.path} was not found',
            'status_code': 404,
            'timestamp': context['timestamp'],
            'path': request.path,
            'method': request.method
        }
        
        # Add API version and endpoint suggestions
        api_version = _extract_api_version(request.path)
        if api_version:
            error_response['api_version'] = api_version
            error_response['available_endpoints'] = _get_available_endpoints(api_version)
        
        # Specific suggestions for e-commerce endpoints
        if 'products' in request.path:
            error_response['hint'] = 'Check product ID or browse /api/v1/products/'
        elif 'categories' in request.path:
            error_response['hint'] = 'Check category ID or browse /api/v1/categories/'
        elif 'flash_sales' in request.path:
            error_response['hint'] = 'Check flash sale ID or browse /api/v1/flash_sales/'
        elif 'orders' in request.path:
            error_response['hint'] = 'Check order ID or browse your order history'
            
        return JsonResponse(error_response, status=404)
    
    # Enhanced context for web requests
    context.update({
        'is_authenticated': request.user.is_authenticated if hasattr(request, 'user') else False,
        'user_type': _get_user_type(request),
        'suggested_pages': _get_suggested_pages_404(request),
        'popular_categories': _get_popular_categories(),
        'current_flash_sales': _get_current_flash_sales(),
    })
    
    return _render_error_template(request, 'errors/404.html', context, 404)


def server_error_view(request):
    """
    Custom 500 Internal Server Error handler
    Enhanced with proper logging and e-commerce context
    """
    # Log the error with request context
    logger.error(
        f"500 Internal Server Error - Path: {request.path}, "
        f"Method: {request.method}, "
        f"User: {getattr(request.user, 'email', 'Anonymous') if hasattr(request, 'user') else 'Unknown'}, "
        f"IP: {_get_client_ip(request)}, "
        f"User-Agent: {request.META.get('HTTP_USER_AGENT', 'Unknown')}"
    )
    
    context = {
        'error_code': 500,
        'error_title': 'Server Error',
        'error_message': 'An internal server error occurred. Our team has been notified.',
        'show_home_link': True,
        'show_support_contact': True,
        'platform_name': 'ShopOnline Uganda',
        'support_email': 'support@shoponline.com',
        'support_phone': '+256 XXX XXX XXX',  # Add your Uganda support number
        'timestamp': timezone.now().isoformat(),
    }
    
    # Enhanced API detection
    is_api_request = (
        request.path.startswith('/api/') or 
        'application/json' in request.META.get('HTTP_ACCEPT', '') or
        request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest'
    )
    
    if is_api_request:
        error_response = {
            'error': 'Internal Server Error',
            'message': 'An internal server error occurred. Please try again later.',
            'status_code': 500,
            'timestamp': context['timestamp'],
            'path': request.path,
            'method': request.method,
            'support_contact': context['support_email']
        }
        
        # Add specific guidance for e-commerce operations
        if 'payments' in request.path:
            error_response['hint'] = 'Payment processing issue. Please contact support immediately.'
            error_response['urgent'] = True
        elif 'orders' in request.path:
            error_response['hint'] = 'Order processing issue. Your order may still be valid.'
        elif 'flash_sales' in request.path:
            error_response['hint'] = 'Flash sale system issue. Prices may be temporarily unavailable.'
            
        return JsonResponse(error_response, status=500)
    
    # Enhanced context for web requests
    context.update({
        'is_authenticated': request.user.is_authenticated if hasattr(request, 'user') else False,
        'user_type': _get_user_type(request),
        'error_id': f"ERR-{timezone.now().strftime('%Y%m%d%H%M%S')}",  # Unique error ID for support
        'alternative_actions': _get_alternative_actions_500(request),
    })
    
    return _render_error_template(request, 'errors/500.html', context, 500)


# Utility views for the platform
def health_check_view(request):
    """
    Enhanced health check endpoint for e-commerce platform monitoring
    """
    try:
        # Basic database connectivity check
        user_count = User.objects.count()
        
        # Basic system checks
        health_status = {
            'status': 'healthy',
            'timestamp': timezone.now().isoformat(),
            'database': 'connected',
            'user_count': user_count,
            'version': getattr(settings, 'APP_VERSION', '1.0.0'),
            'environment': getattr(settings, 'ENVIRONMENT', 'development'),
        }
        
        # Add e-commerce specific health indicators
        try:
            # Check if we can import key models (indicates apps are loaded correctly)
            from apps.products.models import Product
            from apps.orders.models import Order
            from apps.flash_sales.models import FlashSale
            
            health_status.update({
                'apps_loaded': True,
                'models_accessible': True,
            })
        except ImportError as e:
            health_status.update({
                'apps_loaded': False,
                'models_accessible': False,
                'import_error': str(e),
                'status': 'degraded'
            })
        
        status_code = 200 if health_status['status'] == 'healthy' else 503
        return JsonResponse(health_status, status=status_code)
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JsonResponse({
            'status': 'unhealthy',
            'error': 'Database connectivity or system issue',
            'timestamp': timezone.now().isoformat(),
        }, status=503)


def api_not_found_view(request):
    """
    Custom API endpoint not found handler for e-commerce platform
    """
    api_version = _extract_api_version(request.path)
    
    response_data = {
        'error': 'API Endpoint Not Found',
        'message': f'The API endpoint {request.path} does not exist',
        'status_code': 404,
        'timestamp': timezone.now().isoformat(),
        'method': request.method,
        'available_versions': ['v1'],  # Update with your actual API versions
    }
    
    if api_version:
        response_data['available_endpoints'] = _get_available_endpoints(api_version)
    
    return JsonResponse(response_data, status=404)


# Helper functions
def _get_user_type(request):
    """Determine user type based on email domain and authentication"""
    if not hasattr(request, 'user') or not request.user.is_authenticated:
        return 'anonymous'
    
    user_email = request.user.email
    if user_email.endswith('@shoponline.com'):
        return 'admin'
    elif user_email.endswith('@gmail.com'):
        return 'client'
    else:
        return 'unknown'


def _get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def _extract_api_version(path):
    """Extract API version from path"""
    import re
    match = re.search(r'/api/v(\d+)/', path)
    return f"v{match.group(1)}" if match else None


def _get_available_endpoints(api_version):
    """Get available endpoints for API version"""
    endpoints = {
        'v1': [
            f'/api/{api_version}/products/',
            f'/api/{api_version}/categories/',
            f'/api/{api_version}/flash_sales/',
            f'/api/{api_version}/orders/',
            f'/api/{api_version}/payments/',
            f'/api/{api_version}/auth/',
            f'/api/{api_version}/admin/',
        ]
    }
    return endpoints.get(api_version, [])


def _get_suggested_actions_400(request):
    """Get suggested actions for 400 errors"""
    actions = ['Check your input data', 'Verify required fields']
    
    if 'form' in request.path:
        actions.append('Ensure all form fields are properly filled')
    if 'payment' in request.path:
        actions.append('Verify payment details and amount format')
    
    return actions


def _get_suggested_actions_403(request, user_type):
    """Get suggested actions for 403 errors"""
    if user_type == 'anonymous':
        return ['Login to your account', 'Register if you don\'t have an account']
    elif user_type == 'client' and '/admin/' in request.path:
        return ['This area is for administrators only', 'Return to the main shopping area']
    elif user_type == 'admin':
        return ['Check if you have the required admin permissions', 'Contact system administrator']
    else:
        return ['Verify your account type', 'Contact support for assistance']


def _get_suggested_pages_404(request):
    """Get suggested pages for 404 errors"""
    suggestions = [
        {'name': 'Home', 'url': '/', 'description': 'Return to homepage'},
        {'name': 'Products', 'url': '/products/', 'description': 'Browse all products'},
        {'name': 'Categories', 'url': '/categories/', 'description': 'Shop by category'},
    ]
    
    if '/admin/' in request.path:
        suggestions = [
            {'name': 'Admin Dashboard', 'url': '/admin/', 'description': 'Admin homepage'},
            {'name': 'Product Management', 'url': '/admin/products/', 'description': 'Manage products'},
            {'name': 'Order Management', 'url': '/admin/orders/', 'description': 'Manage orders'},
        ]
    
    return suggestions


def _get_popular_categories():
    """Get popular categories for 404 page suggestions"""
    try:
        from apps.categories.models import Category
        return Category.objects.filter(is_active=True)[:5]
    except:
        return []


def _get_current_flash_sales():
    """Get current flash sales for 404 page suggestions"""
    try:
        from apps.flash_sales.models import FlashSale
        return FlashSale.objects.filter(
            is_active=True,
            start_time__lte=timezone.now(),
            end_time__gte=timezone.now()
        )[:3]
    except:
        return []


def _get_alternative_actions_500(request):
    """Get alternative actions for 500 errors"""
    actions = [
        'Refresh the page and try again',
        'Clear your browser cache and cookies',
        'Try again in a few minutes',
    ]
    
    if 'cart' in request.path or 'checkout' in request.path:
        actions.append('Your cart items should still be saved')
    if 'payment' in request.path:
        actions.append('Check your payment status or contact support')
    
    return actions


def _render_error_template(request, template_name, context, status_code):
    """Render error template with fallback to generic template"""
    try:
        return render(request, template_name, context, status=status_code)
    except TemplateDoesNotExist:
        # Fallback to generic error template
        try:
            return render(request, 'errors/generic_error.html', context, status=status_code)
        except TemplateDoesNotExist:
            # Final fallback to simple HTTP response
            return HttpResponse(
                f"<h1>{context['error_code']} - {context['error_title']}</h1>"
                f"<p>{context['error_message']}</p>"
                f"<p><a href='/'>Return to Homepage</a></p>",
                status=status_code,
                content_type='text/html'
            )