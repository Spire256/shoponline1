
# apps/flash_sales/permissions.py
from rest_framework import permissions
from .models import FlashSale


class FlashSalePermission(permissions.BasePermission):
    """Custom permission for flash sale operations"""
    
    def has_permission(self, request, view):
        """Check if user has permission for the action"""
        if view.action in ['list', 'retrieve', 'active_sales', 'upcoming_sales']:
            return True
        
        # Admin required for create, update, delete
        return request.user.is_authenticated and request.user.user_type == 'admin'
    
    def has_object_permission(self, request, view, obj):
        """Check if user has permission for specific object"""
        if view.action in ['retrieve']:
            return True
        
        # Admin required for modify operations
        if request.user.is_authenticated and request.user.user_type == 'admin':
            return True
        
        return False
