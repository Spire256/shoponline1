#from django.contrib import admin

# Register your models here.
# apps/orders/admin.py

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from django.db.models import Sum, Count
from .models import Order, OrderItem, OrderStatusHistory, OrderNote, CODVerification


class OrderItemInline(admin.TabularInline):
    """Inline for order items"""
    model = OrderItem
    extra = 0
    readonly_fields = ('product_id', 'product_name', 'unit_price', 'total_price', 'flash_sale_savings')
    fields = (
        'product_name', 'product_sku', 'unit_price', 'quantity', 'total_price',
        'is_flash_sale_item', 'flash_sale_savings'
    )
    
    def has_add_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False


class OrderStatusHistoryInline(admin.TabularInline):
    """Inline for order status history"""
    model = OrderStatusHistory
    extra = 0
    readonly_fields = ('previous_status', 'new_status', 'changed_by', 'notes', 'created_at')
    fields = ('previous_status', 'new_status', 'changed_by', 'notes', 'created_at')
    
    def has_add_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False


class OrderNoteInline(admin.StackedInline):
    """Inline for order notes"""
    model = OrderNote
    extra = 1
    fields = ('note_type', 'note', 'is_internal')
    readonly_fields = ('created_by', 'created_at')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    """Admin interface for orders"""
    
    list_display = (
        'order_number', 'customer_display', 'status_badge', 'payment_method_badge',
        'total_amount_display', 'cod_badge', 'created_at_display'
    )
    
    list_filter = (
        'status', 'payment_method', 'is_cash_on_delivery', 'cod_verified',
        'has_flash_sale_items', 'created_at', 'district'
    )
    
    search_fields = (
        'order_number', 'email', 'first_name', 'last_name', 'phone',
        'user__email', 'user__first_name', 'user__last_name'
    )
    
    readonly_fields = (
        'id', 'order_number', 'user', 'subtotal', 'total_amount',
        'flash_sale_savings', 'has_flash_sale_items', 'is_cash_on_delivery',
        'created_at', 'updated_at', 'confirmed_at', 'delivered_at', 'cancelled_at'
    )
    
    fieldsets = (
        ('Order Information', {
            'fields': (
                'id', 'order_number', 'user', 'status', 'created_at', 'updated_at'
            )
        }),
        ('Customer Details', {
            'fields': (
                'first_name', 'last_name', 'email', 'phone'
            )
        }),
        ('Delivery Address', {
            'fields': (
                'address_line_1', 'address_line_2', 'city', 'district',
                'postal_code', 'delivery_notes'
            )
        }),
        ('Financial Details', {
            'fields': (
                'subtotal', 'tax_amount', 'delivery_fee', 'discount_amount',
                'total_amount', 'flash_sale_savings', 'has_flash_sale_items'
            )
        }),
        ('Payment Information', {
            'fields': (
                'payment_method', 'payment_status', 'payment_reference',
                'transaction_id', 'is_cash_on_delivery', 'cod_verified'
            )
        }),
        ('Fulfillment', {
            'fields': (
                'tracking_number', 'estimated_delivery', 'delivery_date',
                'confirmed_at', 'delivered_at', 'cancelled_at'
            )
        }),
        ('Notes', {
            'fields': ('admin_notes',),
            'classes': ('collapse',)
        })
    )
    
    inlines = [OrderItemInline, OrderStatusHistoryInline, OrderNoteInline]
    
    actions = ['mark_as_confirmed', 'mark_as_delivered', 'mark_as_cancelled']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user').prefetch_related('items')
    
    def customer_display(self, obj):
        """Display customer name and email"""
        return f"{obj.get_customer_name()} ({obj.email})"
    customer_display.short_description = 'Customer'
    
    def status_badge(self, obj):
        """Display status with color coding"""
        colors = {
            'pending': '#fbbf24',      # yellow
            'confirmed': '#3b82f6',    # blue
            'processing': '#8b5cf6',   # purple
            'out_for_delivery': '#f59e0b',  # amber
            'delivered': '#10b981',    # green
            'cancelled': '#ef4444',    # red
            'refunded': '#6b7280'      # gray
        }
        color = colors.get(obj.status, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 12px; font-size: 11px; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def payment_method_badge(self, obj):
        """Display payment method with icons"""
        icons = {
            'mtn_momo': '📱',
            'airtel_money': '📱',
            'cash_on_delivery': '💵'
        }
        icon = icons.get(obj.payment_method, '💳')
        return f"{icon} {obj.get_payment_method_display()}"
    payment_method_badge.short_description = 'Payment Method'
    
    def total_amount_display(self, obj):
        """Display total amount in UGX format"""
        return f"UGX {obj.total_amount:,.0f}"
    total_amount_display.short_description = 'Total Amount'
    
    def cod_badge(self, obj):
        """Display COD verification status"""
        if not obj.is_cash_on_delivery:
            return '-'
        
        if obj.cod_verified:
            return format_html(
                '<span style="background-color: #10b981; color: white; padding: 2px 6px; '
                'border-radius: 8px; font-size: 10px;">✓ Verified</span>'
            )
        else:
            return format_html(
                '<span style="background-color: #f59e0b; color: white; padding: 2px 6px; '
                'border-radius: 8px; font-size: 10px;">⏳ Pending</span>'
            )
    cod_badge.short_description = 'COD Status'
    
    def created_at_display(self, obj):
        """Display formatted creation date"""
        return obj.created_at.strftime('%Y-%m-%d %H:%M')
    created_at_display.short_description = 'Order Date'
    
    def mark_as_confirmed(self, request, queryset):
        """Bulk action to confirm orders"""
        updated = 0
        for order in queryset.filter(status='pending'):
            order.mark_as_confirmed()
            updated += 1
        
        self.message_user(request, f"{updated} orders marked as confirmed.")
    mark_as_confirmed.short_description = "Mark selected orders as confirmed"
    
    def mark_as_delivered(self, request, queryset):
        """Bulk action to mark orders as delivered"""
        updated = 0
        for order in queryset.filter(status__in=['confirmed', 'processing', 'out_for_delivery']):
            order.mark_as_delivered()
            updated += 1
        
        self.message_user(request, f"{updated} orders marked as delivered.")
    mark_as_delivered.short_description = "Mark selected orders as delivered"
    
    def mark_as_cancelled(self, request, queryset):
        """Bulk action to cancel orders"""
        updated = 0
        for order in queryset.filter(status__in=['pending', 'confirmed']):
            order.cancel_order("Bulk cancellation from admin")
            updated += 1
        
        self.message_user(request, f"{updated} orders cancelled.")
    mark_as_cancelled.short_description = "Cancel selected orders"
    
    def get_urls(self):
        """Add custom URLs"""
        urls = super().get_urls()
        from django.urls import path
        custom_urls = [
            path('analytics/', self.admin_site.admin_view(self.analytics_view), name='orders_analytics'),
        ]
        return custom_urls + urls
    
    def analytics_view(self, request):
        """Custom analytics view"""
        from django.shortcuts import render
        from datetime import timedelta
        
        # Get analytics data
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        analytics = {
            'total_orders': Order.objects.count(),
            'orders_last_30_days': Order.objects.filter(created_at__gte=thirty_days_ago).count(),
            'total_revenue': Order.objects.aggregate(Sum('total_amount'))['total_amount__sum'] or 0,
            'pending_orders': Order.objects.filter(status='pending').count(),
            'cod_orders': Order.objects.filter(is_cash_on_delivery=True).count(),
            'orders_by_status': dict(Order.objects.values_list('status').annotate(Count('id'))),
            'orders_by_district': list(
                Order.objects.values('district')
                .annotate(count=Count('id'), revenue=Sum('total_amount'))
                .order_by('-count')[:10]
            )
        }
        
        context = {
            'title': 'Order Analytics',
            'analytics': analytics,
            'opts': self.model._meta,
        }
        
        return render(request, 'admin/orders/analytics.html', context)


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    """Admin interface for order items"""
    
    list_display = (
        'order_number', 'product_name', 'quantity', 'unit_price',
        'total_price', 'flash_sale_badge'
    )
    
    list_filter = ('is_flash_sale_item', 'product_category', 'created_at')
    
    search_fields = (
        'order__order_number', 'product_name', 'product_sku'
    )
    
    readonly_fields = (
        'order', 'product_id', 'product_name', 'product_sku', 'unit_price',
        'total_price', 'flash_sale_savings', 'created_at'
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('order')
    
    def order_number(self, obj):
        """Display order number with link"""
        url = reverse('admin:orders_order_change', args=[obj.order.pk])
        return format_html('<a href="{}">{}</a>', url, obj.order.order_number)
    order_number.short_description = 'Order Number'
    
    def flash_sale_badge(self, obj):
        """Display flash sale indicator"""
        if obj.is_flash_sale_item:
            return format_html(
                '<span style="background-color: #ef4444; color: white; padding: 2px 6px; '
                'border-radius: 8px; font-size: 10px;">⚡ Flash Sale</span>'
            )
        return '-'
    flash_sale_badge.short_description = 'Flash Sale'
    
    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(OrderStatusHistory)
class OrderStatusHistoryAdmin(admin.ModelAdmin):
    """Admin interface for order status history"""
    
    list_display = (
        'order_number', 'previous_status', 'new_status', 'changed_by', 'created_at'
    )
    
    list_filter = ('previous_status', 'new_status', 'created_at')
    
    search_fields = ('order__order_number', 'changed_by__email')
    
    readonly_fields = ('order', 'previous_status', 'new_status', 'changed_by', 'notes', 'created_at')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('order', 'changed_by')
    
    def order_number(self, obj):
        """Display order number with link"""
        url = reverse('admin:orders_order_change', args=[obj.order.pk])
        return format_html('<a href="{}">{}</a>', url, obj.order.order_number)
    order_number.short_description = 'Order Number'
    
    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(OrderNote)
class OrderNoteAdmin(admin.ModelAdmin):
    """Admin interface for order notes"""
    
    list_display = (
        'order_number', 'note_type', 'note_preview', 'created_by', 'is_internal', 'created_at'
    )
    
    list_filter = ('note_type', 'is_internal', 'created_at')
    
    search_fields = ('order__order_number', 'note', 'created_by__email')
    
    readonly_fields = ('order', 'created_by', 'created_at')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('order', 'created_by')
    
    def order_number(self, obj):
        """Display order number with link"""
        url = reverse('admin:orders_order_change', args=[obj.order.pk])
        return format_html('<a href="{}">{}</a>', url, obj.order.order_number)
    order_number.short_description = 'Order Number'
    
    def note_preview(self, obj):
        """Display truncated note preview"""
        return obj.note[:50] + "..." if len(obj.note) > 50 else obj.note
    note_preview.short_description = 'Note Preview'


@admin.register(CODVerification)
class CODVerificationAdmin(admin.ModelAdmin):
    """Admin interface for COD verification"""
    
    list_display = (
        'order_number', 'verification_status_badge', 'customer_phone_verified',
        'delivery_confirmed', 'payment_received', 'verified_by', 'created_at'
    )
    
    list_filter = (
        'verification_status', 'customer_phone_verified', 'delivery_confirmed',
        'payment_received', 'created_at'
    )
    
    search_fields = ('order__order_number', 'order__email', 'verified_by__email')
    
    readonly_fields = ('order', 'verified_by', 'verification_date', 'created_at')
    
    fieldsets = (
        ('Order Information', {
            'fields': ('order', 'created_at')
        }),
        ('Verification Status', {
            'fields': (
                'verification_status', 'verified_by', 'verification_date', 'verification_notes'
            )
        }),
        ('Verification Checks', {
            'fields': (
                'customer_phone_verified', 'delivery_confirmed', 'payment_received'
            )
        })
    )
    
    actions = ['mark_as_verified', 'mark_as_delivered_and_paid']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('order', 'verified_by')
    
    def order_number(self, obj):
        """Display order number with link"""
        url = reverse('admin:orders_order_change', args=[obj.order.pk])
        return format_html('<a href="{}">{}</a>', url, obj.order.order_number)
    order_number.short_description = 'Order Number'
    
    def verification_status_badge(self, obj):
        """Display verification status with color coding"""
        colors = {
            'pending': '#f59e0b',           # amber
            'verified': '#3b82f6',         # blue
            'rejected': '#ef4444',         # red
            'delivered_paid': '#10b981'    # green
        }
        color = colors.get(obj.verification_status, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 12px; font-size: 11px; font-weight: bold;">{}</span>',
            color, obj.get_verification_status_display()
        )
    verification_status_badge.short_description = 'Status'
    
    def mark_as_verified(self, request, queryset):
        """Bulk action to verify COD orders"""
        updated = 0
        for cod_verification in queryset.filter(verification_status='pending'):
            cod_verification.mark_as_verified(request.user, "Bulk verification from admin")
            updated += 1
        
        self.message_user(request, f"{updated} COD orders marked as verified.")
    mark_as_verified.short_description = "Mark selected as verified"
    
    def mark_as_delivered_and_paid(self, request, queryset):
        """Bulk action to mark as delivered and paid"""
        updated = 0
        for cod_verification in queryset.filter(verification_status='verified'):
            cod_verification.mark_as_delivered_and_paid()
            updated += 1
        
        self.message_user(request, f"{updated} COD orders marked as delivered and paid.")
    mark_as_delivered_and_paid.short_description = "Mark selected as delivered & paid"


# Custom admin site configuration
from django.contrib.admin import AdminSite
from django.utils.translation import gettext_lazy as _


class OrdersAdminSite(AdminSite):
    """Custom admin site for orders management"""
    site_header = _('ShopOnline Orders Management')
    site_title = _('Orders Admin')
    index_title = _('Orders Dashboard')
    
    def index(self, request, extra_context=None):
        """Custom admin index with orders overview"""
        from datetime import timedelta
        
        extra_context = extra_context or {}
        
        # Get quick stats
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        this_week_start = today - timedelta(days=today.weekday())
        
        stats = {
            'total_orders': Order.objects.count(),
            'today_orders': Order.objects.filter(created_at__date=today).count(),
            'yesterday_orders': Order.objects.filter(created_at__date=yesterday).count(),
            'week_orders': Order.objects.filter(created_at__date__gte=this_week_start).count(),
            'pending_orders': Order.objects.filter(status='pending').count(),
            'cod_pending': Order.objects.filter(
                is_cash_on_delivery=True, 
                cod_verified=False
            ).count(),
            'total_revenue': Order.objects.aggregate(
                total=Sum('total_amount')
            )['total'] or 0,
        }
        
        # Recent orders
        recent_orders = Order.objects.select_related('user').order_by('-created_at')[:10]
        
        extra_context.update({
            'orders_stats': stats,
            'recent_orders': recent_orders,
        })
        
        return super().index(request, extra_context)


# Register models with the custom admin site
orders_admin_site = OrdersAdminSite(name='orders_admin')
orders_admin_site.register(Order, OrderAdmin)
orders_admin_site.register(OrderItem, OrderItemAdmin)
orders_admin_site.register(OrderStatusHistory, OrderStatusHistoryAdmin)
orders_admin_site.register(OrderNote, OrderNoteAdmin)
orders_admin_site.register(CODVerification, CODVerificationAdmin)
