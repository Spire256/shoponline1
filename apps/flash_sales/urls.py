
# apps/flash_sales/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FlashSaleViewSet, FlashSaleProductViewSet

app_name = 'flash_sales'

router = DefaultRouter()
router.register(r'sales', FlashSaleViewSet, basename='flashsale')
router.register(r'products', FlashSaleProductViewSet, basename='flashsaleproduct')

urlpatterns = [
    path('api/v1/flash-sales/', include(router.urls)),
]
