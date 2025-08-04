# apps/accounts/permissions.py
from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    """Permission class for admin users only"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.is_admin
        )


class IsClientUser(permissions.BasePermission):
    """Permission class for client users only"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.is_client
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """Permission to allow owners or admin users"""
    
    def has_object_permission(self, request, view, obj):
        # Admin users can access everything
        if request.user.is_admin:
            return True
        
        # Check if user owns the object
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        # For user objects
        if hasattr(obj, 'id') and hasattr(request.user, 'id'):
            return obj.id == request.user.id
        
        return False

