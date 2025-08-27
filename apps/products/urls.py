"""
Products App URLs
URL configuration for product-related endpoints
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers

from .views import (
    ProductViewSet, ProductImageViewSet, ProductAttributeViewSet,
    ProductVariantViewSet, ProductAnalyticsView, TopProductsView,
    ProductRecommendationView, ProductPriceHistoryView, ProductInventoryView,
    ProductDuplicateView, ProductCompareView, ProductReviewSummaryView
)

app_name = 'products'

# Main router for products - use empty string since 'products' is already in main URL
router = DefaultRouter()
router.register(r'', ProductViewSet, basename='product')

# Nested routers for product-related resources
products_router = routers.NestedDefaultRouter(router, r'', lookup='product')
products_router.register(r'images', ProductImageViewSet, basename='product-images')
products_router.register(r'attributes', ProductAttributeViewSet, basename='product-attributes')
products_router.register(r'variants', ProductVariantViewSet, basename='product-variants')

urlpatterns = [
    # Main product routes
    path('', include(router.urls)),
    path('', include(products_router.urls)),
    
    # Analytics and insights
    path('analytics/', ProductAnalyticsView.as_view(), name='product-analytics'),
    
    # Top products by different criteria
    path('top/', TopProductsView.as_view(), name='top-products'),
    
    # Product recommendations
    path('recommendations/', ProductRecommendationView.as_view(), name='product-recommendations'),
    
    # Price history - this pattern needs to be updated to avoid conflict
    path('<uuid:pk>/price-history/', ProductPriceHistoryView.as_view(), name='product-price-history'),
    
    # Inventory management
    path('inventory/', ProductInventoryView.as_view(), name='product-inventory'),
    
    # Product duplication - this pattern needs to be updated to avoid conflict
    path('<uuid:pk>/duplicate/', ProductDuplicateView.as_view(), name='product-duplicate'),
    
    # Product comparison
    path('compare/', ProductCompareView.as_view(), name='product-compare'),
    
    # Review summary - this pattern needs to be updated to avoid conflict
    path('<uuid:pk>/reviews/summary/', ProductReviewSummaryView.as_view(), name='product-review-summary'),
]