from django.shortcuts import render

# Create your views here.

# apps/admin_dashboard/views.py
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Sum, Q
from django.db.models.functions import TruncDate
from datetime import datetime, timedelta
from .models import HomepageContent, Banner, FeaturedProduct, SiteSettings
from .serializers import (
    HomepageContentSerializer, BannerSerializer,
    FeaturedProductSerializer, SiteSettingsSerializer
)
from .services.analytics_service import AnalyticsService
from .services.homepage_service import HomepageService
from apps.core.permissions import IsAdminUser

class HomepageContentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing homepage content"""
    queryset = HomepageContent.objects.all()
    serializer_class = HomepageContentSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def perform_create(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=False, methods=['get'])
    def active_content(self, request):
        """Get active homepage content"""
        content = HomepageContent.objects.filter(is_active=True).first()
        if content:
            serializer = self.get_serializer(content)
            return Response(serializer.data)
        return Response({'message': 'No active homepage content found'}, 
                       status=status.HTTP_404_NOT_FOUND)

class BannerViewSet(viewsets.ModelViewSet):
    """ViewSet for managing banners"""
    queryset = Banner.objects.all()
    serializer_class = BannerSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        queryset = Banner.objects.all()
        banner_type = self.request.query_params.get('type', None)
        is_active = self.request.query_params.get('active', None)

        if banner_type:
            queryset = queryset.filter(banner_type=banner_type)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def active_banners(self, request):
        """Get active banners for public display"""
        now = timezone.now()
        banners = Banner.objects.filter(
            is_active=True
        ).filter(
            Q(start_date__isnull=True) | Q(start_date__lte=now)
        ).filter(
            Q(end_date__isnull=True) | Q(end_date__gte=now)
        ).order_by('order', '-created_at')

        serializer = self.get_serializer(banners, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def reorder_banners(self, request):
        """Reorder banners"""
        banner_orders = request.data.get('banner_orders', [])
        
        for item in banner_orders:
            banner_id = item.get('id')
            order = item.get('order')
            try:
                banner = Banner.objects.get(id=banner_id)
                banner.order = order
                banner.save()
            except Banner.DoesNotExist:
                continue

        return Response({'message': 'Banners reordered successfully'})

class FeaturedProductViewSet(viewsets.ModelViewSet):
    """ViewSet for managing featured products"""
    queryset = FeaturedProduct.objects.all()
    serializer_class = FeaturedProductSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        queryset = FeaturedProduct.objects.select_related('product', 'created_by')
        is_active = self.request.query_params.get('active', None)

        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def active_featured(self, request):
        """Get active featured products for public display"""
        now = timezone.now()
        featured = FeaturedProduct.objects.filter(
            is_active=True,
            product__is_active=True,
            product__stock_quantity__gt=0
        ).filter(
            Q(featured_until__isnull=True) | Q(featured_until__gte=now)
        ).select_related('product').order_by('order', '-created_at')

        serializer = self.get_serializer(featured, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def reorder_featured(self, request):
        """Reorder featured products"""
        featured_orders = request.data.get('featured_orders', [])
        
        for item in featured_orders:
            featured_id = item.get('id')
            order = item.get('order')
            try:
                featured = FeaturedProduct.objects.get(id=featured_id)
                featured.order = order
                featured.save()
            except FeaturedProduct.DoesNotExist:
                continue

        return Response({'message': 'Featured products reordered successfully'})

class SiteSettingsViewSet(viewsets.ModelViewSet):
    """ViewSet for managing site settings"""
    queryset = SiteSettings.objects.all()
    serializer_class = SiteSettingsSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def perform_create(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=False, methods=['get'])
    def current_settings(self, request):
        """Get current site settings"""
        settings = SiteSettings.objects.first()
        if settings:
            serializer = self.get_serializer(settings)
            return Response(serializer.data)
        return Response({'message': 'No site settings found'}, 
                       status=status.HTTP_404_NOT_FOUND)

class DashboardAnalyticsViewSet(viewsets.ViewSet):
    """ViewSet for dashboard analytics"""
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.analytics_service = AnalyticsService()

    @action(detail=False, methods=['get'])
    def overview(self, request):
        """Get dashboard overview statistics"""
        try:
            data = self.analytics_service.get_dashboard_overview()
            return Response(data)
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch dashboard overview: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def sales_chart(self, request):
        """Get sales chart data"""
        period = request.query_params.get('period', '7days')
        try:
            data = self.analytics_service.get_sales_chart_data(period)
            return Response(data)
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch sales chart data: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def product_performance(self, request):
        """Get product performance data"""
        try:
            data = self.analytics_service.get_product_performance()
            return Response(data)
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch product performance data: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def recent_orders(self, request):
        """Get recent orders for dashboard"""
        try:
            data = self.analytics_service.get_recent_orders()
            return Response(data)
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch recent orders: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def flash_sales_performance(self, request):
        """Get flash sales performance data"""
        try:
            data = self.analytics_service.get_flash_sales_performance()
            return Response(data)
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch flash sales performance: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

