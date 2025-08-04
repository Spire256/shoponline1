#from django.contrib import admin

# Register your models here.
# apps/flash_sales/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import FlashSale, FlashSaleProduct


@admin.register(FlashSale)
class FlashSaleAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'discount_percentage', 'status_badge', 'start_time', 
        'end_time', 'products_count', 'priority', 'created_by'
    ]
    list_filter = ['is_active', 'start_time', 'end_time', 'created_by']
    search_fields = ['name', 'description']
    ordering = ['-priority', '-start_time']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'banner_image')
        }),
        ('Sale Details', {
            'fields': ('discount_percentage', 'max_discount_amount', 'priority')
        }),
        ('Timing', {
            'fields': ('start_time', 'end_time', 'is_active')
        }),
        ('Metadata', {
            'fields': ('id', 'created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def status_badge(self, obj):
        """Display status badge"""
        if obj.is_running:
            return format_html(
                '<span style="color: green; font-weight: bold;">● ACTIVE</span>'
            )
        elif obj.is_upcoming:
            return format_html(
                '<span style="color: orange; font-weight: bold;">● UPCOMING</span>'
            )
        elif obj.is_expired:
            return format_html(
                '<span style="color: red; font-weight: bold;">● EXPIRED</span>'
            )
        else:
            return format_html(
                '<span style="color: gray; font-weight: bold;">● INACTIVE</span>'
            )
    
    status_badge.short_description = 'Status'

    def save_model(self, request, obj, form, change):
        """Set created_by field when creating new flash sale"""
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(FlashSaleProduct)
class FlashSaleProductAdmin(admin.ModelAdmin):
    list_display = [
        'product', 'flash_sale', 'original_price', 'flash_sale_price',
        'discount_percentage', 'stock_limit', 'sold_quantity', 'is_active'
    ]
    list_filter = ['flash_sale', 'is_active', 'added_by']
    search_fields = ['product__name', 'flash_sale__name']
    ordering = ['-created_at']
    readonly_fields = ['id', 'flash_sale_price', 'original_price', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Product & Sale', {
            'fields': ('flash_sale', 'product', 'is_active')
        }),
        ('Pricing', {
            'fields': ('original_price', 'custom_discount_percentage', 'flash_sale_price')
        }),
        ('Stock Management', {
            'fields': ('stock_limit', 'sold_quantity')
        }),
        ('Metadata', {
            'fields': ('id', 'added_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def save_model(self, request, obj, form, change):
        """Set added_by field when creating new flash sale product"""
        if not change:
            obj.added_by = request.user
        super().save_model(request, obj, form, change)


