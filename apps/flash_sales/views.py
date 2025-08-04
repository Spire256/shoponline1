from django.shortcuts import render

# Create your views here.
# apps/flash_sales/views.py
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q, Count, Sum
from django.shortcuts import get_object_or_404
from apps.core.permissions import IsAdminUser
from apps.core.pagination import CustomPageNumberPagination
from .models import FlashSale, FlashSaleProduct
from .serializers import (
    FlashSaleSerializer, FlashSaleWithProductsSerializer,
    FlashSaleProductSerializer, CreateFlashSaleProductSerializer
)
from .services.flash_sale_service import FlashSaleService


class FlashSaleViewSet(viewsets.ModelViewSet):
    """ViewSet for Flash Sale management"""
    
    queryset = FlashSale.objects.all()
    serializer_class = FlashSaleSerializer
    pagination_class = CustomPageNumberPagination
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['list', 'retrieve', 'active_sales', 'upcoming_sales']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """Filter queryset based on user and action"""
        queryset = FlashSale.objects.all()
        
        # Filter for public endpoints
        if self.action in ['list', 'active_sales', 'upcoming_sales']:
            queryset = queryset.filter(is_active=True)
        
        return queryset

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action in ['retrieve', 'with_products']:
            return FlashSaleWithProductsSerializer
        return FlashSaleSerializer

    def perform_create(self, serializer):
        """Create flash sale with current user as creator"""
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def active_sales(self, request):
        """Get currently active flash sales"""
        now = timezone.now()
        active_sales = self.get_queryset().filter(
            start_time__lte=now,
            end_time__gt=now,
            is_active=True
        ).order_by('-priority', 'end_time')
        
        serializer = self.get_serializer(active_sales, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def upcoming_sales(self, request):
        """Get upcoming flash sales"""
        now = timezone.now()
        upcoming_sales = self.get_queryset().filter(
            start_time__gt=now,
            is_active=True
        ).order_by('start_time')
        
        serializer = self.get_serializer(upcoming_sales, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def with_products(self, request, pk=None):
        """Get flash sale with all its products"""
        flash_sale = self.get_object()
        serializer = FlashSaleWithProductsSerializer(flash_sale)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_products(self, request, pk=None):
        """Add products to flash sale"""
        flash_sale = self.get_object()
        products_data = request.data.get('products', [])
        
        if not products_data:
            return Response(
                {'error': 'No products provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created_products = []
        errors = []
        
        for product_data in products_data:
            serializer = CreateFlashSaleProductSerializer(
                data=product_data,
                context={'flash_sale': flash_sale, 'request': request}
            )
            
            if serializer.is_valid():
                product = serializer.save()
                created_products.append(
                    FlashSaleProductSerializer(product).data
                )
            else:
                errors.append({
                    'product_id': product_data.get('product'),
                    'errors': serializer.errors
                })
        
        return Response({
            'created_products': created_products,
            'errors': errors,
            'success_count': len(created_products),
            'error_count': len(errors)
        })

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate flash sale"""
        flash_sale = self.get_object()
        flash_sale.is_active = True
        flash_sale.save()
        
        serializer = self.get_serializer(flash_sale)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate flash sale"""
        flash_sale = self.get_object()
        flash_sale.is_active = False
        flash_sale.save()
        
        serializer = self.get_serializer(flash_sale)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        """Get flash sale analytics"""
        flash_sale = self.get_object()
        service = FlashSaleService()
        analytics_data = service.get_flash_sale_analytics(flash_sale)
        
        return Response(analytics_data)


class FlashSaleProductViewSet(viewsets.ModelViewSet):
    """ViewSet for Flash Sale Product management"""
    
    queryset = FlashSaleProduct.objects.all()
    serializer_class = FlashSaleProductSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        """Filter queryset by flash sale if provided"""
        queryset = FlashSaleProduct.objects.select_related(
            'flash_sale', 'product', 'added_by'
        )
        
        flash_sale_id = self.request.query_params.get('flash_sale')
        if flash_sale_id:
            queryset = queryset.filter(flash_sale_id=flash_sale_id)
        
        return queryset

    def perform_create(self, serializer):
        """Create flash sale product with current user as creator"""
        serializer.save(added_by=self.request.user)


