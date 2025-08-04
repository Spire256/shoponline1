#from django.contrib import admin

# Register your models here.
# apps/payments/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from django.db.models import Count, Sum
from django.http import HttpResponse
import csv

from .models import (
    Payment, MobileMoneyPayment, CashOnDeliveryPayment,
    Transaction, PaymentWebhook, PaymentMethodConfig,
    PaymentStatus, PaymentMethod
)

@admin.register(PaymentMethodConfig)
class PaymentMethodConfigAdmin(admin.ModelAdmin):
    list_display = [
        'payment_method', 'display_name', 'is_active', 'is_test_mode',
        'min_amount', 'max_amount', 'fixed_fee', 'percentage_fee'
    ]
    list_filter = ['is_active', 'is_test_mode', 'payment_method']
    search_fields = ['display_name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('payment_method', 'display_name', 'description', 'icon')
        }),
        ('Status', {
            'fields': ('is_active', 'is_test_mode')
        }),
        ('Limits', {
            'fields': ('min_amount', 'max_amount')
        }),
        ('Fees', {
            'fields': ('fixed_fee', 'percentage_fee')
        }),
        ('Configuration', {
            'fields': ('config',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

class TransactionInline(admin.TabularInline):
    model = Transaction
    extra = 0
    readonly_fields = ['id', 'transaction_type', 'amount', 'status', 'processed_at']
    can_delete = False
    
    def has_add_permission(self, request, obj=None):
        return False

class MobileMoneyPaymentInline(admin.StackedInline):
    model = MobileMoneyPayment
    extra = 0
    readonly_fields = [
        'provider_request_id', 'provider_transaction_id', 'provider_status',
        'callback_received', 'callback_at', 'retry_count', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Customer Information', {
            'fields': ('phone_number', 'customer_name')
        }),
        ('Provider Details', {
            'fields': ('provider_request_id', 'provider_transaction_id', 'provider_status')
        }),
        ('Callback Information', {
            'fields': ('callback_received', 'callback_at', 'callback_payload'),
            'classes': ('collapse',)
        }),
        ('Retry Information', {
            'fields': ('retry_count', 'max_retries', 'next_retry_at')
        }),
        ('Raw Data', {
            'fields': ('request_payload', 'response_payload'),
            'classes': ('collapse',)
        })
    )

class CashOnDeliveryPaymentInline(admin.StackedInline):
    model = CashOnDeliveryPayment
    extra = 0
    readonly_fields = [
        'admin_notification_sent_at', 'collected_at', 'last_attempt_at',
        'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Delivery Information', {
            'fields': ('delivery_address', 'delivery_phone', 'delivery_notes')
        }),
        ('Collection Details', {
            'fields': ('cash_received', 'change_given', 'collection_notes')
        }),
        ('Assignment & Processing', {
            'fields': ('assigned_to', 'collected_by')
        }),
        ('Status Tracking', {
            'fields': ('admin_notified', 'admin_notification_sent_at', 'delivery_attempted', 
                      'delivery_attempts', 'last_attempt_at', 'collected_at')
        })
    )

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        'reference_number', 'order_link', 'user_email', 'payment_method_display',
        'amount_display', 'status_display', 'created_at', 'processed_at'
    ]
    list_filter = [
        'payment_method', 'status', 'currency',
        ('created_at', admin.DateFieldListFilter),
        ('processed_at', admin.DateFieldListFilter)
    ]
    search_fields = [
        'reference_number', 'transaction_id', 'external_transaction_id',
        'user__email', 'order__order_number'
    ]
    readonly_fields = [
        'id', 'reference_number', 'transaction_id', 'external_transaction_id',
        'created_at', 'updated_at', 'processed_at'
    ]
    raw_id_fields = ['user', 'order']
    
    inlines = [MobileMoneyPaymentInline, CashOnDeliveryPaymentInline, TransactionInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'reference_number', 'order', 'user')
        }),
        ('Payment Details', {
            'fields': ('payment_method', 'amount', 'currency', 'status')
        }),
        ('Transaction Information', {
            'fields': ('transaction_id', 'external_transaction_id', 'provider_fee')
        }),
        ('Status & Notes', {
            'fields': ('failure_reason', 'notes')
        }),
        ('Provider Response', {
            'fields': ('provider_response',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'processed_at', 'expires_at')
        })
    )
    
    actions = ['export_payments_csv', 'mark_as_completed', 'mark_as_failed']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'order')
    
    def order_link(self, obj):
        if obj.order:
            url = reverse('admin:orders_order_change', args=[obj.order.pk])
            return format_html('<a href="{}">{}</a>', url, obj.order.order_number)
        return '-'
    order_link.short_description = 'Order'
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User'
    
    def payment_method_display(self, obj):
        colors = {
            PaymentMethod.MTN_MOMO: 'orange',
            PaymentMethod.AIRTEL_MONEY: 'red',
            PaymentMethod.CASH_ON_DELIVERY: 'green'
        }
        color = colors.get(obj.payment_method, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_payment_method_display()
        )
    payment_method_display.short_description = 'Method'
    
    def amount_display(self, obj):
        return f"UGX {obj.amount:,.0f}"
    amount_display.short_description = 'Amount'
    
    def status_display(self, obj):
        colors = {
            PaymentStatus.PENDING: 'orange',
            PaymentStatus.PROCESSING: 'blue',
            PaymentStatus.COMPLETED: 'green',
            PaymentStatus.FAILED: 'red',
            PaymentStatus.CANCELLED: 'gray',
            PaymentStatus.REFUNDED: 'purple'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_display.short_description = 'Status'
    
    def export_payments_csv(self, request, queryset):
        """Export selected payments to CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="payments.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Reference Number', 'Order Number', 'User Email', 'Payment Method',
            'Amount', 'Currency', 'Status', 'Transaction ID', 'Created At',
            'Processed At', 'Failure Reason'
        ])
        
        for payment in queryset:
            writer.writerow([
                payment.reference_number,
                payment.order.order_number if payment.order else '',
                payment.user.email,
                payment.get_payment_method_display(),
                payment.amount,
                payment.currency,
                payment.get_status_display(),
                payment.transaction_id or '',
                payment.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                payment.processed_at.strftime('%Y-%m-%d %H:%M:%S') if payment.processed_at else '',
                payment.failure_reason or ''
            ])
        
        return response
    export_payments_csv.short_description = "Export selected payments to CSV"
    
    def mark_as_completed(self, request, queryset):
        """Mark selected payments as completed"""
        updated = queryset.filter(
            status__in=[PaymentStatus.PENDING, PaymentStatus.PROCESSING]
        ).update(
            status=PaymentStatus.COMPLETED,
            processed_at=timezone.now()
        )
        self.message_user(request, f'{updated} payments marked as completed.')
    mark_as_completed.short_description = "Mark selected payments as completed"
    
    def mark_as_failed(self, request, queryset):
        """Mark selected payments as failed"""
        updated = queryset.filter(
            status__in=[PaymentStatus.PENDING, PaymentStatus.PROCESSING]
        ).update(
            status=PaymentStatus.FAILED,
            processed_at=timezone.now(),
            failure_reason='Manually marked as failed by admin'
        )
        self.message_user(request, f'{updated} payments marked as failed.')
    mark_as_failed.short_description = "Mark selected payments as failed"

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'payment_reference', 'transaction_type', 'amount_display',
        'status', 'processed_at'
    ]
    list_filter = ['transaction_type', 'status', 'currency', 'processed_at']
    search_fields = ['payment__reference_number', 'external_reference', 'description']
    readonly_fields = ['id', 'processed_at']
    raw_id_fields = ['payment', 'processed_by']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('payment')
    
    def payment_reference(self, obj):
        return obj.payment.reference_number
    payment_reference.short_description = 'Payment Reference'
    
    def amount_display(self, obj):
        return f"{obj.currency} {obj.amount:,.2f}"
    amount_display.short_description = 'Amount'

@admin.register(PaymentWebhook)
class PaymentWebhookAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'provider', 'event_type', 'payment_reference',
        'processed_status', 'signature_valid', 'created_at'
    ]
    list_filter = [
        'provider', 'processed', 'signature_valid',
        ('created_at', admin.DateFieldListFilter)
    ]
    search_fields = ['payment__reference_number', 'event_type', 'ip_address']
    readonly_fields = [
        'id', 'created_at', 'processed_at', 'ip_address', 'user_agent'
    ]
    raw_id_fields = ['payment']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'provider', 'event_type', 'payment')
        }),
        ('Processing Status', {
            'fields': ('processed', 'processing_error', 'signature_valid')
        }),
        ('Request Information', {
            'fields': ('ip_address', 'user_agent')
        }),
        ('Data', {
            'fields': ('headers', 'payload', 'raw_body'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'processed_at')
        })
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('payment')
    
    def payment_reference(self, obj):
        if obj.payment:
            return obj.payment.reference_number
        return '-'
    payment_reference.short_description = 'Payment Reference'
    
    def processed_status(self, obj):
        if obj.processed:
            return format_html('<span style="color: green;">✓ Processed</span>')
        else:
            return format_html('<span style="color: red;">✗ Failed</span>')
    processed_status.short_description = 'Status'

# Custom admin site configurations
class PaymentAdminSite(admin.AdminSite):
    site_header = 'ShopOnline Payment Administration'
    site_title = 'Payment Admin'
    index_title = 'Payment Management Dashboard'
    
    def index(self, request, extra_context=None):
        """Custom admin index with payment statistics"""
        extra_context = extra_context or {}
        
        # Get payment statistics
        from django.utils import timezone
        from datetime import timedelta
        
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Today's stats
        today_payments = Payment.objects.filter(created_at__date=today)
        today_stats = {
            'count': today_payments.count(),
            'amount': today_payments.aggregate(Sum('amount'))['amount__sum'] or 0,
            'completed': today_payments.filter(status=PaymentStatus.COMPLETED).count()
        }
        
        # Weekly stats
        week_payments = Payment.objects.filter(created_at__date__gte=week_ago)
        week_stats = {
            'count': week_payments.count(),
            'amount': week_payments.aggregate(Sum('amount'))['amount__sum'] or 0,
            'completed': week_payments.filter(status=PaymentStatus.COMPLETED).count()
        }
        
        # Monthly stats
        month_payments = Payment.objects.filter(created_at__date__gte=month_ago)
        month_stats = {
            'count': month_payments.count(),
            'amount': month_payments.aggregate(Sum('amount'))['amount__sum'] or 0,
            'completed': month_payments.filter(status=PaymentStatus.COMPLETED).count()
        }
        
        # Payment method breakdown
        method_stats = Payment.objects.values('payment_method').annotate(
            count=Count('id'),
            amount=Sum('amount')
        ).order_by('-count')
        
        # Recent failed payments
        recent_failed = Payment.objects.filter(
            status=PaymentStatus.FAILED,
            created_at__gte=week_ago
        ).select_related('user', 'order')[:10]
        
        # Pending COD payments
        pending_cod = Payment.objects.filter(
            payment_method=PaymentMethod.CASH_ON_DELIVERY,
            status__in=[PaymentStatus.PENDING, PaymentStatus.PROCESSING]
        ).count()
        
        extra_context.update({
            'today_stats': today_stats,
            'week_stats': week_stats,
            'month_stats': month_stats,
            'method_stats': method_stats,
            'recent_failed': recent_failed,
            'pending_cod': pending_cod,
        })
        
        return super().index(request, extra_context)

# Create custom admin site instance
payment_admin_site = PaymentAdminSite(name='payment_admin')

# Register models with custom admin site
payment_admin_site.register(Payment, PaymentAdmin)
payment_admin_site.register(Transaction, TransactionAdmin)
payment_admin_site.register(PaymentWebhook, PaymentWebhookAdmin)
payment_admin_site.register(PaymentMethodConfig, PaymentMethodConfigAdmin)

# Also register with default admin site
admin.site.register(MobileMoneyPayment)
admin.site.register(CashOnDeliveryPayment)
