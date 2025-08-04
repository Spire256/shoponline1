# apps/admin_dashboard/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    HomepageContentViewSet, BannerViewSet, FeaturedProductViewSet,
    SiteSettingsViewSet, DashboardAnalyticsViewSet
)

router = DefaultRouter()
router.register(r'homepage-content', HomepageContentViewSet, basename='homepage-content')
router.register(r'banners', BannerViewSet, basename='banners')
router.register(r'featured-products', FeaturedProductViewSet, basename='featured-products')
router.register(r'site-settings', SiteSettingsViewSet, basename='site-settings')
router.register(r'analytics', DashboardAnalyticsViewSet, basename='analytics')

app_name = 'admin_dashboard'

urlpatterns = [
    path('', include(router.urls)),
]