#from django.contrib import admin

# Register your models here.
# apps/categories/admin.py

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.db.models import Count
from .models import Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """
    Admin interface for Category model with enhanced functionality
    """
    list_display = [
        'name', 'parent', 'product_count_display', 'subcategory_count_display',
        'is_active', 'featured', 'sort_order', 'created_at'
    ]
    list_filter = [
        'is_active', 'featured', 'parent', 'created_at', 'updated_at'
    ]
    search_fields = ['name', 'description', 'meta_title']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = [
        'id', 'slug', 'created_at', 'updated_at', 'product_count_display',
        'subcategory_count_display', 'breadcrumb_display', 'image_preview'
    ]
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'description', 'parent')
        }),
        ('Media', {
            'fields': ('image', 'image_preview'),
            'classes': ('collapse',)
        }),
        ('Settings', {
            'fields': ('is_active', 'featured', 'sort_order')
        }),
        ('SEO', {
            'fields': ('meta_title', 'meta_description'),
            'classes': ('collapse',)
        }),
        ('Statistics', {
            'fields': ('product_count_display', 'subcategory_count_display', 'breadcrumb_display'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    ordering = ['sort_order', 'name']
    list_per_page = 25
    actions = [
        'make_active', 'make_inactive', 'make_featured', 'make_unfeatured'
    ]

    def get_queryset(self, request):
        """Optimize queryset with annotations"""
        queryset = super().get_queryset(request)
        return queryset.select_related('parent').annotate(
            product_count=Count('products', distinct=True),
            subcategory_count=Count('subcategories', distinct=True)
        )

    def product_count_display(self, obj):
        """Display product count with link"""
        if hasattr(obj, 'product_count'):
            count = obj.product_count
        else:
            count = obj.products.count()
        
        if count > 0:
            url = reverse('admin:products_product_changelist')
            return format_html(
                '<a href="{}?category__id__exact={}">{} products</a>',
                url, obj.id, count
            )
        return "0 products"
    product_count_display.short_description = "Products"
    product_count_display.admin_order_field = 'product_count'

    def subcategory_count_display(self, obj):
        """Display subcategory count with link"""
        if hasattr(obj, 'subcategory_count'):
            count = obj.subcategory_count
        else:
            count = obj.subcategories.count()
        
        if count > 0:
            url = reverse('admin:categories_category_changelist')
            return format_html(
                '<a href="{}?parent__id__exact={}">{} subcategories</a>',
                url, obj.id, count
            )
        return "0 subcategories"
    subcategory_count_display.short_description = "Subcategories"
    subcategory_count_display.admin_order_field = 'subcategory_count'

    def breadcrumb_display(self, obj):
        """Display breadcrumb trail"""
        trail = obj.breadcrumb_trail
        breadcrumbs = []
        
        for category in trail:
            url = reverse('admin:categories_category_change', args=[category.id])
            breadcrumbs.append(f'<a href="{url}">{category.name}</a>')
        
        return mark_safe(' → '.join(breadcrumbs)) if breadcrumbs else "Root Category"
    breadcrumb_display.short_description = "Breadcrumb Trail"

    def image_preview(self, obj):
        """Display image preview"""
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 100px; max-width: 200px;" />',
                obj.image.url
            )
        return "No image"
    image_preview.short_description = "Image Preview"

    def get_form(self, request, obj=None, **kwargs):
        """Customize form based on user permissions"""
        form = super().get_form(request, obj, **kwargs)
        
        # Limit parent choices to prevent circular references
        if obj:
            form.base_fields['parent'].queryset = Category.objects.exclude(
                id__in=[obj.id] + list(obj.get_descendant_ids())
            )
        
        return form

    # Admin actions
    def make_active(self, request, queryset):
        """Activate selected categories"""
        updated = queryset.update(is_active=True)
        self.message_user(
            request,
            f'{updated} categories were successfully activated.'
        )
    make_active.short_description = "Activate selected categories"

    def make_inactive(self, request, queryset):
        """Deactivate selected categories"""
        updated = queryset.update(is_active=False)
        self.message_user(
            request,
            f'{updated} categories were successfully deactivated.'
        )
    make_inactive.short_description = "Deactivate selected categories"

    def make_featured(self, request, queryset):
        """Feature selected categories"""
        updated = queryset.update(featured=True)
        self.message_user(
            request,
            f'{updated} categories were successfully featured.'
        )
    make_featured.short_description = "Feature selected categories"

    def make_unfeatured(self, request, queryset):
        """Unfeature selected categories"""
        updated = queryset.update(featured=False)
        self.message_user(
            request,
            f'{updated} categories were successfully unfeatured.'
        )
    make_unfeatured.short_description = "Unfeature selected categories"

    def has_delete_permission(self, request, obj=None):
        """Check if category can be deleted"""
        if obj and not obj.can_be_deleted():
            return False
        return super().has_delete_permission(request, obj)

    def delete_model(self, request, obj):
        """Custom delete with validation"""
        if not obj.can_be_deleted():
            from django.contrib import messages
            messages.error(
                request,
                f'Cannot delete "{obj.name}" because it has products or subcategories.'
            )
            return
        super().delete_model(request, obj)

    def save_model(self, request, obj, form, change):
        """Custom save with validation"""
        try:
            super().save_model(request, obj, form, change)
        except Exception as e:
            from django.contrib import messages
            messages.error(request, f'Error saving category: {str(e)}')

    class Media:
        css = {
            'all': ('admin/css/categories.css',)
        }
        js = ('admin/js/categories.js',)
