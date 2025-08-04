#from django.contrib import admin

# Register your models here.
"""
Products App Admin
Django admin configuration for product management
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.db.models import Count, Sum, F
from django.utils import timezone
from datetime import timedelta

from .models import Product, ProductImage, ProductAttribute, ProductVariant
from .utils import ProductUtils


class ProductImageInline(admin.TabularInline):
    """Inline admin for product images"""
    model = ProductImage
    extra = 1
    fields = ('image', 'alt_text', 'position', 'is_main', 'image_preview')
    readonly_fields = ('image_preview',)
    
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="100" height="100" style="object-fit: cover;" />',
                obj.image.url
            )
        return "No image"
    image_preview.short_description = "Preview"


class ProductAttributeInline(admin.TabularInline):
    """Inline admin for product attributes"""
    model = ProductAttribute
    extra = 1
    fields = ('name', 'value', 'position')


class ProductVariantInline(admin.TabularInline):
    """Inline admin for product variants"""
    model = ProductVariant
    extra = 0
    fields = ('name', 'sku', 'price', 'stock_quantity', 'color', 'size', 'is_active')
    readonly_fields = ('sku',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """Admin configuration for Product model"""
    
    list_display = [
        'name', 'category', 'price', 'stock_status', 'is_active', 
        'is_featured', 'view_count', 'order_count', 'created_at'
    ]
    
    list_filter = [
        'is_active', 'is_featured', 'status', 'condition', 'category',
        'track_inventory', 'requires_shipping', 'is_digital', 'created_at'
    ]
    
    search_fields = ['name', 'description', 'sku', 'brand', 'tags']
    
    readonly_fields = [
        'id', 'slug', 'sku', 'view_count', 'order_count', 'rating_average',
        'review_count', 'created_at', 'updated_at', 'product_stats',
        'main_image_preview', 'profit_info'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'name', 'slug', 'description', 'short_description',
                'category', 'tags'
            )
        }),
        ('Pricing', {
            'fields': (
                'price', 'original_price', 'cost_price', 'profit_info'
            )
        }),
        ('Inventory', {
            'fields': (
                'sku', 'stock_quantity', 'low_stock_threshold',
                'track_inventory', 'allow_backorders'
            )
        }),
        ('Product Details', {
            'fields': (
                'weight', 'dimensions', 'color', 'size', 'material',
                'brand', 'model', 'condition'
            ),
            'classes': ('collapse',)
        }),
        ('SEO & Meta', {
            'fields': (
                'meta_title', 'meta_description', 'meta_keywords'
            ),
            'classes': ('collapse',)
        }),
        ('Status & Visibility', {
            'fields': (
                'status', 'is_active', 'is_featured', 'is_digital',
                'requires_shipping', 'published_at'
            )
        }),
        ('Statistics', {
            'fields': (
                'view_count', 'order_count', 'rating_average',
                'review_count', 'product_stats'
            ),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
        ('Preview', {
            'fields': ('main_image_preview',),
            'classes': ('collapse',)
        })
    )
    
    inlines = [ProductImageInline, ProductAttributeInline, ProductVariantInline]
    
    actions = [
        'make_active', 'make_inactive', 'make_featured', 'remove_featured',
        'export_selected_products', 'duplicate_products'
    ]
    
    list_per_page = 50
    date_hierarchy = 'created_at'
    save_on_top = True
    
    def get_queryset(self, request):
        """Optimize queryset with select_related and prefetch_related"""
        return super().get_queryset(request).select_related(
            'category'
        ).prefetch_related(
            'images', 'attributes', 'variants'
        )
    
    def stock_status(self, obj):
        """Display stock status with color coding"""
        status = ProductUtils.format_stock_status(obj)
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            status['color'],
            status['message']
        )
    stock_status.short_description = "Stock Status"
    
    def main_image_preview(self, obj):
        """Display main product image preview"""
        main_image = obj.main_image
        if main_image and main_image.image:
            return format_html(
                '<img src="{}" width="200" height="200" style="object-fit: cover;" />',
                main_image.image.url
            )
        return "No main image"
    main_image_preview.short_description = "Main Image"
    
    def profit_info(self, obj):
        """Display profit information"""
        if obj.cost_price:
            margin = ProductUtils.calculate_profit_margin(obj.cost_price, obj.price)
            profit = obj.price - obj.cost_price
            return format_html(
                '<strong>Profit:</strong> {} UGX<br>'
                '<strong>Margin:</strong> {}%',
                ProductUtils.format_price(profit),
                margin
            )
        return "Cost price not set"
    profit_info.short_description = "Profit Information"
    
    def product_stats(self, obj):
        """Display product statistics"""
        stats_html = f"""
        <strong>Popularity Score:</strong> {ProductUtils.calculate_popularity_score(obj)}<br>
        <strong>Discount:</strong> {obj.discount_percentage}%<br>
        <strong>Images:</strong> {obj.images.count()}<br>
        <strong>Attributes:</strong> {obj.attributes.count()}<br>
        <strong>Variants:</strong> {obj.variants.count()}
        """
        return format_html(stats_html)
    product_stats.short_description = "Statistics"
    
    def make_active(self, request, queryset):
        """Bulk action to activate products"""
        updated = queryset.update(is_active=True)
        self.message_user(
            request,
            f"Successfully activated {updated} product(s)."
        )
    make_active.short_description = "Activate selected products"
    
    def make_inactive(self, request, queryset):
        """Bulk action to deactivate products"""
        updated = queryset.update(is_active=False)
        self.message_user(
            request,
            f"Successfully deactivated {updated} product(s)."
        )
    make_inactive.short_description = "Deactivate selected products"
    
    def make_featured(self, request, queryset):
        """Bulk action to feature products"""
        updated = queryset.update(is_featured=True, is_active=True)
        self.message_user(
            request,
            f"Successfully featured {updated} product(s)."
        )
    make_featured.short_description = "Feature selected products"
    
    def remove_featured(self, request, queryset):
        """Bulk action to remove featured status"""
        updated = queryset.update(is_featured=False)
        self.message_user(
            request,
            f"Successfully removed featured status from {updated} product(s)."
        )
    remove_featured.short_description = "Remove featured status"
    
    def export_selected_products(self, request, queryset):
        """Export selected products to CSV"""
        # This would redirect to export view
        selected = queryset.values_list('id', flat=True)
        ids = ','.join(str(id) for id in selected)
        
        from django.http import HttpResponseRedirect
        return HttpResponseRedirect(f"/admin/export-products/?ids={ids}")
    export_selected_products.short_description = "Export selected products"
    
    def duplicate_products(self, request, queryset):
        """Duplicate selected products"""
        from .services.product_service import ProductService
        
        duplicated_count = 0
        for product in queryset:
            try:
                ProductService.duplicate_product(
                    product,
                    name_suffix=' (Copy)',
                    copy_images=True,
                    copy_attributes=True
                )
                duplicated_count += 1
            except Exception:
                pass  # Skip if duplication fails
        
        self.message_user(
            request,
            f"Successfully duplicated {duplicated_count} product(s)."
        )
    duplicate_products.short_description = "Duplicate selected products"


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    """Admin configuration for ProductImage model"""
    
    list_display = ['product', 'image_preview', 'alt_text', 'position', 'is_main', 'created_at']
    list_filter = ['is_main', 'created_at']
    search_fields = ['product__name', 'alt_text', 'caption']
    readonly_fields = ['image_preview', 'thumbnail_preview', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Image Information', {
            'fields': ('product', 'image', 'thumbnail', 'alt_text', 'caption')
        }),
        ('Settings', {
            'fields': ('position', 'is_main')
        }),
        ('Preview', {
            'fields': ('image_preview', 'thumbnail_preview'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="150" height="150" style="object-fit: cover;" />',
                obj.image.url
            )
        return "No image"
    image_preview.short_description = "Image Preview"
    
    def thumbnail_preview(self, obj):
        if obj.thumbnail:
            return format_html(
                '<img src="{}" width="100" height="100" style="object-fit: cover;" />',
                obj.thumbnail.url
            )
        return "No thumbnail"
    thumbnail_preview.short_description = "Thumbnail Preview"


@admin.register(ProductAttribute)
class ProductAttributeAdmin(admin.ModelAdmin):
    """Admin configuration for ProductAttribute model"""
    
    list_display = ['product', 'name', 'value', 'position']
    list_filter = ['name', 'created_at']
    search_fields = ['product__name', 'name', 'value']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Attribute Information', {
            'fields': ('product', 'name', 'value', 'position')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    """Admin configuration for ProductVariant model"""
    
    list_display = [
        'product', 'name', 'sku', 'price', 'stock_quantity', 
        'color', 'size', 'is_active', 'created_at'
    ]
    list_filter = ['is_active', 'color', 'size', 'created_at']
    search_fields = ['product__name', 'name', 'sku', 'color', 'size']
    readonly_fields = ['sku', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Variant Information', {
            'fields': ('product', 'name', 'sku', 'price', 'stock_quantity')
        }),
        ('Variant Details', {
            'fields': ('color', 'size', 'weight', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


# Custom admin site configuration
admin.site.site_header = "ShopOnline Admin"
admin.site.site_title = "ShopOnline Admin Portal"
admin.site.index_title = "Welcome to ShopOnline Administration"

# Register custom admin actions
def export_all_products(modeladmin, request, queryset):
    """Export all products"""
    from django.http import HttpResponseRedirect
    return HttpResponseRedirect("/admin/export-products/")

export_all_products.short_description = "Export all products to CSV"

# Add to Product admin
ProductAdmin.actions.append(export_all_products)
