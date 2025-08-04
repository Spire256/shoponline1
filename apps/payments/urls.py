# apps/payments/urls.py
from django.urls import path
from . import views

app_name = 'payments'

urlpatterns = [
    # Public endpoints
    path('methods/', views.PaymentMethodConfigListView.as_view(), name='payment-methods'),
    
    # Payment management endpoints
    path('create/', views.PaymentCreateView.as_view(), name='create-payment'),
    path('<uuid:pk>/', views.PaymentDetailView.as_view(), name='payment-detail'),
    path('', views.PaymentListView.as_view(), name='payment-list'),
    path('<uuid:payment_id>/verify/', views.verify_payment, name='verify-payment'),
    path('<uuid:payment_id>/cancel/', views.cancel_payment, name='cancel-payment'),
    path('<uuid:payment_id>/receipt/', views.payment_receipt, name='payment-receipt'),
    
    # Utility endpoints
    path('check-phone/', views.check_phone_number, name='check-phone'),
    
    # Webhook endpoints
    path('webhooks/mtn/', views.mtn_momo_webhook, name='mtn-webhook'),
    path('webhooks/airtel/', views.airtel_money_webhook, name='airtel-webhook'),
    
    # Admin endpoints
    path('admin/payments/', views.AdminPaymentListView.as_view(), name='admin-payment-list'),
    path('admin/<uuid:payment_id>/update-status/', views.admin_update_payment_status, name='admin-update-payment-status'),
    path('admin/cod/', views.admin_cod_payments, name='admin-cod-payments'),
    path('admin/cod/<uuid:payment_id>/assign/', views.admin_assign_cod_payment, name='admin-assign-cod'),
    path('admin/cod/<uuid:payment_id>/delivery-attempt/', views.admin_record_delivery_attempt, name='admin-delivery-attempt'),
    path('admin/cod/<uuid:payment_id>/complete/', views.admin_complete_cod_payment, name='admin-complete-cod'),
    path('admin/cod/bulk-assign/', views.admin_bulk_assign_cod, name='admin-bulk-assign-cod'),
    path('admin/analytics/', views.admin_payment_analytics, name='admin-payment-analytics'),
    path('admin/webhooks/', views.admin_webhook_logs, name='admin-webhook-logs'),
    path('admin/<uuid:payment_id>/retry/', views.admin_retry_failed_payment, name='admin-retry-payment'),
    
    # Payment method configuration
    path('admin/methods/', views.admin_payment_method_configs, name='admin-payment-methods'),
    path('admin/methods/<str:method>/', views.admin_update_payment_method_config, name='admin-update-payment-method'),
]