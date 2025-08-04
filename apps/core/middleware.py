"""
Custom middleware for ShopOnline Uganda E-commerce Platform.

Provides middleware for:
- Request/response logging
- Performance monitoring
- User activity tracking
- CORS handling
- Rate limiting
- Security headers
- API versioning
- Request ID tracking
"""

import time
import uuid
import logging
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from django.core.cache import cache
from django.utils import timezone
from django.conf import settings
from django.contrib.auth import get_user_model

from .constants import API_RATE_LIMITS, CORS_ALLOWED_ORIGINS
from .exceptions import RateLimitError
from .models import ActivityLog

logger = logging.getLogger(__name__)
User = get_user_model()


class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Middleware to log all API requests and responses.
    """
    
    def process_request(self, request):
        """Log incoming request details."""
        request.start_time = time.time()
        request.request_id = str(uuid.uuid4())
        
        # Skip logging for certain paths
        skip_paths = ['/health/', '/admin/static/', '/static/', '/media/']
        if any(request.path.startswith(path) for path in skip_paths):
            return None
        
        logger.info(
            f"Request {request.request_id}: {request.method} {request.path}",
            extra={
                'request_id': request.request_id,
                'method': request.method,
                'path': request.path,
                'user': getattr(request.user, 'email', 'Anonymous') if hasattr(request, 'user') else 'Anonymous',
                'ip_address': self.get_client_ip(request),
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            }
        )
        
        return None

    def process_response(self, request, response):
        """Log response details and performance metrics."""
        if not hasattr(request, 'start_time'):
            return response
        
        duration = time.time() - request.start_time
        
        # Skip logging for certain paths
        skip_paths = ['/health/', '/admin/static/', '/static/', '/media/']
        if any(request.path.startswith(path) for path in skip_paths):
            return response
        
        logger.info(
            f"Response {getattr(request, 'request_id', 'unknown')}: "
            f"{response.status_code} in {duration:.3f}s",
            extra={
                'request_id': getattr(request, 'request_id', 'unknown'),
                'status_code': response.status_code,
                'duration': duration,
                'content_length': len(response.content) if hasattr(response, 'content') else 0,
            }
        )
        
        # Add request ID to response headers
        if hasattr(request, 'request_id'):
            response['X-Request-ID'] = request.request_id
        
        return response

    def get_client_ip(self, request):
        """Get client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class PerformanceMonitoringMiddleware(MiddlewareMixin):
    """
    Middleware to monitor API performance and detect slow requests.
    """
    SLOW_REQUEST_THRESHOLD = 2.0  # seconds
    
    def process_request(self, request):
        """Start performance monitoring."""
        request.perf_start = time.time()
        return None

    def process_response(self, request, response):
        """Monitor performance and log slow requests."""
        if not hasattr(request, 'perf_start'):
            return response
        
        duration = time.time() - request.perf_start
        
        # Log slow requests
        if duration > self.SLOW_REQUEST_THRESHOLD:
            logger.warning(
                f"Slow request detected: {request.method} {request.path} "
                f"took {duration:.3f}s",
                extra={
                    'request_id': getattr(request, 'request_id', 'unknown'),
                    'duration': duration,
                    'method': request.method,
                    'path': request.path,
                    'user': getattr(request.user, 'email', 'Anonymous') if hasattr(request, 'user') else 'Anonymous',
                }
            )
        
        # Add performance headers
        response['X-Response-Time'] = f"{duration:.3f}s"
        
        return response


class UserActivityTrackingMiddleware(MiddlewareMixin):
    """
    Middleware to track user activities for audit and analytics.
    """
    
    def process_request(self, request):
        """Track user activity."""
        # Skip for static files and admin
        skip_paths = ['/admin/static/', '/static/', '/media/', '/favicon.ico']
        if any(request.path.startswith(path) for path in skip_paths):
            return None
        
        # Track authenticated user activities
        if hasattr(request, 'user') and request.user.is_authenticated:
            self.track_user_activity(request)
        
        return None

    def track_user_activity(self, request):
        """Track specific user activity."""
        try:
            # Determine activity type based on request
            activity_type = self.get_activity_type(request)
            
            if activity_type:
                ActivityLog.objects.create(
                    user=request.user,
                    activity_type=activity_type,
                    description=f"{request.method} {request.path}",
                    ip_address=self.get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    metadata={
                        'method': request.method,
                        'path': request.path,
                        'query_params': dict(request.GET),
                    }
                )
        except Exception as e:
            logger.error(f"Failed to track user activity: {e}")

    def get_activity_type(self, request):
        """Determine activity type based on request."""
        path = request.path.lower()
        method = request.method.upper()
        
        # Map paths to activity types
        if '/api/auth/login' in path:
            return 'login'
        elif '/api/auth/logout' in path:
            return 'logout'
        elif '/api/orders/' in path and method == 'POST':
            return 'order'
        elif '/api/payments/' in path:
            return 'payment'
        elif '/api/admin/' in path:
            return 'admin_action'
        elif method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            return 'update'
        
        return None

    def get_client_ip(self, request):
        """Get client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class RateLimitingMiddleware(MiddlewareMixin):
    """
    Middleware to implement rate limiting for API endpoints.
    """
    
    def process_request(self, request):
        """Check rate limits for the request."""
        # Skip rate limiting for certain paths
        skip_paths = ['/admin/', '/static/', '/media/', '/health/']
        if any(request.path.startswith(path) for path in skip_paths):
            return None
        
        # Determine rate limit key
        rate_limit_key = self.get_rate_limit_key(request)
        if not rate_limit_key:
            return None
        
        # Check rate limit
        if self.is_rate_limited(request, rate_limit_key):
            return JsonResponse(
                {
                    'error_code': 'SHO_004',
                    'message': 'Rate limit exceeded. Please try again later.',
                    'timestamp': timezone.now().isoformat(),
                },
                status=429
            )
        
        return None

    def get_rate_limit_key(self, request):
        """Get rate limit key based on request path."""
        path = request.path.lower()
        
        # Map paths to rate limit keys
        if '/api/auth/login' in path:
            return 'login'
        elif '/api/auth/register' in path:
            return 'register'
        elif '/api/auth/password-reset' in path:
            return 'password_reset'
        elif '/api/payments/' in path:
            return 'payment'
        elif '/api/orders/' in path and request.method == 'POST':
            return 'order_create'
        elif '/api/admin/invitations/' in path:
            return 'admin_invitation'
        
        return None

    def is_rate_limited(self, request, rate_limit_key):
        """Check if request exceeds rate limit."""
        if rate_limit_key not in API_RATE_LIMITS:
            return False
        
        rate_limit = API_RATE_LIMITS[rate_limit_key]
        limit, window = self.parse_rate_limit(rate_limit)
        
        # Create cache key based on user or IP
        if hasattr(request, 'user') and request.user.is_authenticated:
            cache_key = f"rate_limit:{rate_limit_key}:user:{request.user.id}"
        else:
            ip = self.get_client_ip(request)
            cache_key = f"rate_limit:{rate_limit_key}:ip:{ip}"
        
        # Get current count
        current_count = cache.get(cache_key, 0)
        
        if current_count >= limit:
            return True
        
        # Increment counter
        cache.set(cache_key, current_count + 1, window)
        
        return False

    def parse_rate_limit(self, rate_limit):
        """Parse rate limit string (e.g., '5/minute' -> (5, 60))."""
        parts = rate_limit.split('/')
        limit = int(parts[0])
        
        unit = parts[1].lower()
        if unit == 'second':
            window = 1
        elif unit == 'minute':
            window = 60
        elif unit == 'hour':
            window = 3600
        elif unit == 'day':
            window = 86400
        else:
            window = 60  # Default to minute
        
        return limit, window

    def get_client_ip(self, request):
        """Get client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Middleware to add security headers to responses.
    """
    
    def process_response(self, request, response):
        """Add security headers to response."""
        # Add security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Add HSTS header for HTTPS
        if request.is_secure():
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        # Add CSP header for API responses
        if request.path.startswith('/api/'):
            response['Content-Security-Policy'] = "default-src 'none'"
        
        return response


class CORSMiddleware(MiddlewareMixin):
    """
    Custom CORS middleware for handling cross-origin requests.
    """
    
    def process_request(self, request):
        """Handle preflight requests."""
        if request.method == 'OPTIONS':
            response = JsonResponse({})
            self.add_cors_headers(request, response)
            return response
        
        return None

    def process_response(self, request, response):
        """Add CORS headers to response."""
        self.add_cors_headers(request, response)
        return response

    def add_cors_headers(self, request, response):
        """Add CORS headers to response."""
        origin = request.META.get('HTTP_ORIGIN')
        
        # Check if origin is allowed
        if origin and self.is_origin_allowed(origin):
            response['Access-Control-Allow-Origin'] = origin
        
        response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        response['Access-Control-Allow-Headers'] = (
            'Accept, Authorization, Content-Type, X-Requested-With, X-Request-ID'
        )
        response['Access-Control-Expose-Headers'] = 'X-Request-ID, X-Response-Time'
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Max-Age'] = '86400'

    def is_origin_allowed(self, origin):
        """Check if origin is in allowed list."""
        return origin in CORS_ALLOWED_ORIGINS


class APIVersioningMiddleware(MiddlewareMixin):
    """
    Middleware to handle API versioning.
    """
    DEFAULT_VERSION = 'v1'
    SUPPORTED_VERSIONS = ['v1']
    
    def process_request(self, request):
        """Add API version to request."""
        if not request.path.startswith('/api/'):
            return None
        
        # Get version from header or URL
        version = self.get_api_version(request)
        
        # Validate version
        if version not in self.SUPPORTED_VERSIONS:
            return JsonResponse(
                {
                    'error_code': 'SHO_010',
                    'message': f'Unsupported API version: {version}',
                    'supported_versions': self.SUPPORTED_VERSIONS,
                    'timestamp': timezone.now().isoformat(),
                },
                status=400
            )
        
        request.api_version = version
        return None

    def get_api_version(self, request):
        """Get API version from request."""
        # Try header first
        version = request.META.get('HTTP_API_VERSION')
        if version:
            return version
        
        # Try URL path
        path_parts = request.path.strip('/').split('/')
        if len(path_parts) >= 2 and path_parts[1].startswith('v'):
            return path_parts[1]
        
        # Default version
        return self.DEFAULT_VERSION

    def process_response(self, request, response):
        """Add API version to response headers."""
        if hasattr(request, 'api_version'):
            response['API-Version'] = request.api_version
        
        return response


class MaintenanceModeMiddleware(MiddlewareMixin):
    """
    Middleware to handle maintenance mode.
    """
    
    def process_request(self, request):
        """Check if site is in maintenance mode."""
        # Check maintenance mode setting
        from .models import Setting
        
        try:
            maintenance_mode = Setting.get_setting('maintenance_mode', False)
            if not maintenance_mode:
                return None
        except Exception:
            return None  # If we can't check, assume not in maintenance
        
        # Allow admin access during maintenance
        if hasattr(request, 'user') and request.user.is_authenticated:
            from .permissions import BasePermission
            permission = BasePermission()
            if permission.is_admin(request.user):
                return None
        
        # Allow health check during maintenance
        if request.path in ['/health/', '/api/health/']:
            return None
        
        # Return maintenance response
        maintenance_message = Setting.get_setting(
            'maintenance_message',
            'Site is currently under maintenance. Please try again later.'
        )
        
        return JsonResponse(
            {
                'error_code': 'SHO_011',
                'message': maintenance_message,
                'maintenance_mode': True,
                'timestamp': timezone.now().isoformat(),
            },
            status=503
        )


class TimezoneMiddleware(MiddlewareMixin):
    """
    Middleware to handle Uganda timezone.
    """
    
    def process_request(self, request):
        """Set timezone for the request."""
        from django.utils import timezone
        from .constants import UGANDA_TIMEZONE
        
        # Set timezone to Uganda time
        timezone.activate(UGANDA_TIMEZONE)
        return None


class UserSessionMiddleware(MiddlewareMixin):
    """
    Middleware to manage user sessions and track online users.
    """
    
    def process_request(self, request):
        """Update user session information."""
        if hasattr(request, 'user') and request.user.is_authenticated:
            self.update_user_session(request)
        
        return None

    def update_user_session(self, request):
        """Update user's last activity and session info."""
        try:
            cache_key = f"user_session:{request.user.id}"
            session_data = {
                'user_id': request.user.id,
                'last_activity': timezone.now().isoformat(),
                'ip_address': self.get_client_ip(request),
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                'path': request.path,
            }
            
            # Cache for 30 minutes
            cache.set(cache_key, session_data, 1800)
            
        except Exception as e:
            logger.error(f"Failed to update user session: {e}")

    def get_client_ip(self, request):
        """Get client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class RequestSizeLimitMiddleware(MiddlewareMixin):
    """
    Middleware to limit request size.
    """
    MAX_REQUEST_SIZE = 10 * 1024 * 1024  # 10MB
    
    def process_request(self, request):
        """Check request size limit."""
        content_length = request.META.get('CONTENT_LENGTH')
        
        if content_length and int(content_length) > self.MAX_REQUEST_SIZE:
            return JsonResponse(
                {
                    'error_code': 'SHO_012',
                    'message': 'Request size too large.',
                    'max_size': self.MAX_REQUEST_SIZE,
                    'timestamp': timezone.now().isoformat(),
                },
                status=413
            )
        
        return None


class HealthCheckMiddleware(MiddlewareMixin):
    """
    Middleware to handle health check requests.
    """
    
    def process_request(self, request):
        """Handle health check requests."""
        if request.path in ['/health/', '/api/health/']:
            return JsonResponse({
                'status': 'healthy',
                'timestamp': timezone.now().isoformat(),
                'version': getattr(settings, 'APP_VERSION', '1.0.0'),
            })
        
        return None