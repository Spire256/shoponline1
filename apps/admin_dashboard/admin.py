#from django.contrib import admin

# Register your models here.

# apps/admin_dashboard/admin.py
from django.contrib import admin
from .models import HomepageContent, Banner, FeaturedProduct, SiteSettings

@admin.register(HomepageContent)
class HomepageContentAdmin(admin.ModelAdmin):
    list_display = ['title', 'is_active', 'updated_by', 'updated_at']
    list_filter = ['is_active', 'created_at', 'updated_at']
    search_fields = ['title', 'subtitle', 'hero_text']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Content', {
            'fields': ('title', 'subtitle', 'hero_text')
        }),
        ('SEO', {
            'fields': ('meta_description', 'meta_keywords')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Metadata', {
            'fields': ('updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def save_model(self, request, obj, form, change):
        if not change:  # Creating new object
            obj.updated_by = request.user
        else:  # Updating existing object
            obj.updated_by = request.user
        super().save_model(request, obj, form, change)

@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ['title', 'banner_type', 'is_active', 'order', 'start_date', 'end_date', 'created_by']
    list_filter = ['banner_type', 'is_active', 'created_at', 'start_date', 'end_date']
    search_fields = ['title', 'description']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['order', '-created_at']
    
    fieldsets = (
        ('Banner Content', {
            'fields': ('title', 'description', 'image', 'banner_type')
        }),
        ('Link Settings', {
            'fields': ('link_url', 'link_text')
        }),
        ('Display Settings', {
            'fields': ('order', 'is_active', 'start_date', 'end_date')
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def save_model(self, request, obj, form, change):
        if not change:  # Creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

@admin.register(FeaturedProduct)
class FeaturedProductAdmin(admin.ModelAdmin):
    list_display = ['product', 'order', 'is_active', 'featured_until', 'created_by']
    list_filter = ['is_active', 'created_at', 'featured_until']
    search_fields = ['product__name', 'product__description']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['order', '-created_at']
    
    fieldsets = (
        ('Product Selection', {
            'fields': ('product',)
        }),
        ('Display Settings', {
            'fields': ('order', 'is_active', 'featured_until')
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def save_model(self, request, obj, form, change):
        if not change:  # Creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = ['site_name', 'contact_email', 'maintenance_mode', 'updated_by']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('site_name', 'site_logo', 'site_favicon')
        }),
        ('Contact Information', {
            'fields': ('contact_email', 'contact_phone', 'contact_address')
        }),
        ('Social Media', {
            'fields': ('social_facebook', 'social_twitter', 'social_instagram', 'social_whatsapp')
        }),
        ('Payment Settings', {
            'fields': ('enable_mtn_momo', 'enable_airtel_money', 'enable_cod')
        }),
        ('Feature Settings', {
            'fields': ('enable_flash_sales',)
        }),
        ('Maintenance', {
            'fields': ('maintenance_mode', 'maintenance_message')
        }),
        ('Metadata', {
            'fields': ('updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def save_model(self, request, obj, form, change):
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)

    def has_add_permission(self, request):
        # Only allow one instance
        return not SiteSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        # Don't allow deletion of site settings
        return False

