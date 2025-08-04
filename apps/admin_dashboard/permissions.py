# apps/admin_dashboard/permissions.py
from rest_framework import permissions
from django.contrib.auth import get_user_model

User = get_user_model()

class IsAdminUserPermission(permissions.BasePermission):
    """
    Custom permission to only allow admin users to access admin dashboard endpoints.
    Admin users are identified by having email ending with @shoponline.com
    """

    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.email.endswith('@shoponline.com') and
            request.user.is_staff
        )

class IsOwnerOrAdminPermission(permissions.BasePermission):
    """
    Custom permission to allow owners or admin users to modify objects.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions for any authenticated admin user
        if request.method in permissions.SAFE_METHODS:
            return (
                request.user and 
                request.user.is_authenticated and 
                request.user.email.endswith('@shoponline.com')
            )

        # Write permissions only for owner or superuser
        return (
            obj.created_by == request.user or 
            obj.updated_by == request.user or 
            request.user.is_superuser
        )
