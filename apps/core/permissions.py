"""
Custom permissions for ShopOnline Uganda E-commerce Platform.

Provides role-based access control and custom permission classes:
- Admin-only permissions
- Client-only permissions
- Owner-based permissions
- Email domain validation
- Action-based permissions
- Resource-specific permissions
"""

from rest_framework import permissions
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied

from .constants import ADMIN_EMAIL_DOMAIN, CLIENT_EMAIL_DOMAIN, USER_ROLES

User = get_user_model()


class BasePermission(permissions.BasePermission):
    """
    Base permission class with common utility methods.
    """
    
    def has_permission(self, request, view):
        """
        Default permission check - authenticated users only.
        """
        return request.user and request.user.is_authenticated

    def get_user_role(self, user):
        """Get user role based on email domain."""
        if not user or not user.is_authenticated:
            return None
        
        if user.email.endswith(ADMIN_EMAIL_DOMAIN):
            return 'admin'
        elif user.email.endswith(CLIENT_EMAIL_DOMAIN):
            return 'client'
        return None

    def is_admin(self, user):
        """Check if user is an admin."""
        return self.get_user_role(user) == 'admin'

    def is_client(self, user):
        """Check if user is a client."""
        return self.get_user_role(user) == 'client'

    def is_owner(self, user, obj):
        """Check if user owns the object."""
        if hasattr(obj, 'user'):
            return obj.user == user
        elif hasattr(obj, 'created_by'):
            return obj.created_by == user
        elif hasattr(obj, 'owner'):
            return obj.owner == user
        return False


class IsAuthenticated(BasePermission):
    """
    Permission that requires user to be authenticated.
    """
    message = "Authentication required to access this resource."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)


class IsAdmin(BasePermission):
    """
    Permission that allows access only to admin users.
    Admin users must have emails ending with @shoponline.com
    """
    message = "Admin access required. You must be logged in with an admin account."

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return self.is_admin(request.user)

    def has_object_permission(self, request, view, obj):
        return self.is_admin(request.user)


class IsAdminUser(BasePermission):
    """
    Permission that allows access only to admin users.
    Admin users must have emails ending with @shoponline.com
    This is an alias for IsAdmin to maintain compatibility.
    """
    message = "Admin access required. You must be logged in with an admin account."

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return self.is_admin(request.user)

    def has_object_permission(self, request, view, obj):
        return self.is_admin(request.user)


class IsClient(BasePermission):
    """
    Permission that allows access only to client users.
    Client users must have emails ending with @gmail.com
    """
    message = "Client access required. You must be logged in with a client account."

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return self.is_client(request.user)

    def has_object_permission(self, request, view, obj):
        return self.is_client(request.user)


class IsOwnerOrAdmin(BasePermission):
    """
    Permission that allows access to object owners or admin users.
    """
    message = "You can only access your own resources or be an admin."

    def has_permission(self, request, view):
        return super().has_permission(request, view)

    def has_object_permission(self, request, view, obj):
        if not self.has_permission(request, view):
            return False
        
        # Admin users can access everything
        if self.is_admin(request.user):
            return True
        
        # Check if user owns the object
        return self.is_owner(request.user, obj)


class IsOwnerOrReadOnly(BasePermission):
    """
    Permission that allows read access to anyone, but write access only to owners.
    """
    message = "You can only modify your own resources."

    def has_permission(self, request, view):
        # Read permissions for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return super().has_permission(request, view)
        
        # Write permissions only for authenticated users
        return super().has_permission(request, view)

    def has_object_permission(self, request, view, obj):
        # Read permissions for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions only for owners
        return self.is_owner(request.user, obj)


class IsAdminOrReadOnly(BasePermission):
    """
    Permission that allows read access to anyone, but write access only to admins.
    """
    message = "Admin access required for write operations."

    def has_permission(self, request, view):
        # Read permissions for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return super().has_permission(request, view)
        
        # Write permissions only for admins
        return super().has_permission(request, view) and self.is_admin(request.user)


class AdminInvitationPermission(BasePermission):
    """
    Permission for admin invitation system.
    Only admins can send invitations.
    """
    message = "Only admins can send invitations to other admins."

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        
        # Only admins can access invitation endpoints
        return self.is_admin(request.user)


class FlashSalePermission(BasePermission):
    """
    Permission for flash sale management.
    Admins can manage, clients can view.
    """
    message = "Permission denied for flash sale operations."

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        
        # Clients can view flash sales
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Only admins can create/modify flash sales
        return self.is_admin(request.user)


class OrderPermission(BasePermission):
    """
    Permission for order management.
    Clients can create and view their orders, admins can view/modify all orders.
    """
    message = "Permission denied for order operations."

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        
        action = getattr(view, 'action', None)
        
        # Clients can create orders
        if action == 'create' and self.is_client(request.user):
            return True
        
        # Admins can do everything
        if self.is_admin(request.user):
            return True
        
        # Clients can list their own orders
        if action in ['list', 'retrieve'] and self.is_client(request.user):
            return True
        
        return False

    def has_object_permission(self, request, view, obj):
        if not self.has_permission(request, view):
            return False
        
        # Admins can access all orders
        if self.is_admin(request.user):
            return True
        
        # Clients can only access their own orders
        if self.is_client(request.user):
            return self.is_owner(request.user, obj)
        
        return False


class PaymentPermission(BasePermission):
    """
    Permission for payment operations.
    Clients can make payments for their orders, admins can view all payments.
    """
    message = "Permission denied for payment operations."

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        
        # Admins can do everything
        if self.is_admin(request.user):
            return True
        
        # Clients can make payments
        if self.is_client(request.user):
            return True
        
        return False

    def has_object_permission(self, request, view, obj):
        if not self.has_permission(request, view):
            return False
        
        # Admins can access all payments
        if self.is_admin(request.user):
            return True
        
        # Clients can only access their own payments
        if self.is_client(request.user):
            # Check if payment belongs to user's order
            if hasattr(obj, 'order') and hasattr(obj.order, 'user'):
                return obj.order.user == request.user
        
        return False


class ProductPermission(BasePermission):
    """
    Permission for product management.
    Anyone can view products, only admins can manage them.
    """
    message = "Admin access required for product management."

    def has_permission(self, request, view):
        # Anyone can view products (including unauthenticated users for public API)
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Only authenticated admins can create/modify products
        return super().has_permission(request, view) and self.is_admin(request.user)


class CategoryPermission(BasePermission):
    """
    Permission for category management.
    Anyone can view categories, only admins can manage them.
    """
    message = "Admin access required for category management."

    def has_permission(self, request, view):
        # Anyone can view categories
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Only authenticated admins can create/modify categories
        return super().has_permission(request, view) and self.is_admin(request.user)


class HomepageContentPermission(BasePermission):
    """
    Permission for homepage content management.
    Anyone can view content, only admins can manage it.
    """
    message = "Admin access required for homepage content management."

    def has_permission(self, request, view):
        # Anyone can view homepage content
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Only authenticated admins can modify homepage content
        return super().has_permission(request, view) and self.is_admin(request.user)


class UserManagementPermission(BasePermission):
    """
    Permission for user management.
    Users can view/edit their own profile, admins can manage all users.
    """
    message = "Permission denied for user management operations."

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        
        action = getattr(view, 'action', None)
        
        # Admins can do everything
        if self.is_admin(request.user):
            return True
        
        # Users can view their own profile
        if action in ['retrieve', 'update', 'partial_update']:
            return True
        
        return False

    def has_object_permission(self, request, view, obj):
        if not self.has_permission(request, view):
            return False
        
        # Admins can access all user profiles
        if self.is_admin(request.user):
            return True
        
        # Users can only access their own profile
        return obj == request.user


class NotificationPermission(BasePermission):
    """
    Permission for notification management.
    Users can view their own notifications, admins can manage all notifications.
    """
    message = "Permission denied for notification operations."

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        
        # Admins can manage all notifications
        if self.is_admin(request.user):
            return True
        
        # Users can view their own notifications
        return True

    def has_object_permission(self, request, view, obj):
        if not self.has_permission(request, view):
            return False
        
        # Admins can access all notifications
        if self.is_admin(request.user):
            return True
        
        # Users can only access their own notifications
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        return False


class FileUploadPermission(BasePermission):
    """
    Permission for file upload operations.
    """
    message = "Permission denied for file upload operations."

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        
        # Authenticated users can upload files
        return True

    def has_object_permission(self, request, view, obj):
        if not self.has_permission(request, view):
            return False
        
        # Admins can access all files
        if self.is_admin(request.user):
            return True
        
        # Users can only access files they uploaded
        return self.is_owner(request.user, obj)


class AnalyticsPermission(BasePermission):
    """
    Permission for analytics and reporting.
    Only admins can access analytics.
    """
    message = "Admin access required for analytics and reporting."

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        
        return self.is_admin(request.user)


class BulkActionPermission(BasePermission):
    """
    Permission for bulk actions.
    Only admins can perform bulk actions.
    """
    message = "Admin access required for bulk actions."

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        
        return self.is_admin(request.user)


class CODOrderPermission(BasePermission):
    """
    Permission for Cash on Delivery order management.
    Clients can place COD orders, admins get notifications and manage them.
    """
    message = "Permission denied for COD order operations."

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        
        # Both admins and clients can work with COD orders
        return self.is_admin(request.user) or self.is_client(request.user)

    def has_object_permission(self, request, view, obj):
        if not self.has_permission(request, view):
            return False
        
        # Admins can access all COD orders
        if self.is_admin(request.user):
            return True
        
        # Clients can only access their own COD orders
        return self.is_owner(request.user, obj)


class DynamicPermission(BasePermission):
    """
    Dynamic permission class that can be configured per view.
    """
    
    def __init__(self, admin_actions=None, client_actions=None, public_actions=None):
        """
        Initialize with allowed actions for different user types.
        
        Args:
            admin_actions: List of actions allowed for admins
            client_actions: List of actions allowed for clients
            public_actions: List of actions allowed for unauthenticated users
        """
        self.admin_actions = admin_actions or []
        self.client_actions = client_actions or []
        self.public_actions = public_actions or []

    def has_permission(self, request, view):
        action = getattr(view, 'action', None)
        
        # Check public actions first
        if action in self.public_actions:
            return True
        
        # Require authentication for other actions
        if not super().has_permission(request, view):
            return False
        
        # Check admin actions
        if self.is_admin(request.user) and action in self.admin_actions:
            return True
        
        # Check client actions
        if self.is_client(request.user) and action in self.client_actions:
            return True
        
        return False


class RateLimitPermission(BasePermission):
    """
    Permission class that implements rate limiting.
    """
    
    def __init__(self, rate_limit_key=None, max_requests=None, time_window=None):
        """
        Initialize with rate limiting parameters.
        
        Args:
            rate_limit_key: Key to use for rate limiting (e.g., 'login', 'payment')
            max_requests: Maximum number of requests allowed
            time_window: Time window in seconds
        """
        self.rate_limit_key = rate_limit_key
        self.max_requests = max_requests
        self.time_window = time_window

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        
        # Rate limiting logic would be implemented here
        # This is a placeholder for actual rate limiting implementation
        # You would typically use Redis or Django cache framework
        
        return True


class EmailDomainPermission(BasePermission):
    """
    Permission that validates user email domain.
    """
    message = "Invalid email domain for this operation."

    def __init__(self, allowed_domains=None, required_domain=None):
        """
        Initialize with domain restrictions.
        
        Args:
            allowed_domains: List of allowed email domains
            required_domain: Specific domain required
        """
        self.allowed_domains = allowed_domains or []
        self.required_domain = required_domain

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        
        user_email = request.user.email
        
        if self.required_domain:
            return user_email.endswith(self.required_domain)
        
        if self.allowed_domains:
            return any(user_email.endswith(domain) for domain in self.allowed_domains)
        
        return True


# Convenience permission combinations
AdminOnly = IsAdmin
AdminUserOnly = IsAdminUser  # Added for compatibility
ClientOnly = IsClient
AdminOrOwner = IsOwnerOrAdmin
AdminOrReadOnly = IsAdminOrReadOnly

# Permission mixins for common use cases
class AdminPermissionMixin:
    """Mixin to add admin-only permission to views."""
    permission_classes = [IsAdmin]

class AdminUserPermissionMixin:
    """Mixin to add admin-user-only permission to views."""
    permission_classes = [IsAdminUser]

class ClientPermissionMixin:
    """Mixin to add client-only permission to views."""
    permission_classes = [IsClient]

class AuthenticatedPermissionMixin:
    """Mixin to add authenticated-only permission to views."""
    permission_classes = [IsAuthenticated]

class OwnerOrAdminPermissionMixin:
    """Mixin to add owner-or-admin permission to views."""
    permission_classes = [IsOwnerOrAdmin]