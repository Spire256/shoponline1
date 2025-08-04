# apps/orders/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'orders'

urlpatterns = [
    # Order CRUD operations
    path('', views.OrderListCreateView.as_view(), name='order-list-create'),
    path('<uuid:pk>/', views.OrderDetailView.as_view(), name='order-detail'),
    
    # Order actions
    path('<uuid:order_id>/cancel/', views.cancel_order, name='cancel-order'),
    path('<uuid:order_id>/confirm/', views.confirm_order, name='confirm-order'),
    path('<uuid:order_id>/deliver/', views.mark_delivered, name='mark-delivered'),
    
    # Order notes
    path('<uuid:order_id>/notes/', views.OrderNotesListCreateView.as_view(), name='order-notes'),
    
    # Cash on Delivery specific endpoints
    path('cod/', views.CODOrdersListView.as_view(), name='cod-orders'),
    path('<uuid:order_id>/verify-cod/', views.verify_cod_order, name='verify-cod'),
    
    # Analytics and reporting
    path('analytics/', views.order_analytics, name='order-analytics'),
    path('customer-summary/', views.customer_order_summary, name='customer-summary'),
    
    # Bulk operations
    path('bulk-update/', views.bulk_update_orders, name='bulk-update'),
    
    # Order tracking
    path('track/<str:order_number>/', views.order_tracking, name='order-tracking'),
]