
# apps/admin_dashboard/serializers.py
from rest_framework import serializers
from .models import HomepageContent, Banner, FeaturedProduct, SiteSettings
from apps.products.serializers import ProductSerializer

class HomepageContentSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)

    class Meta:
        model = HomepageContent
        fields = [
            'id', 'title', 'subtitle', 'hero_text', 'meta_description',
            'meta_keywords', 'is_active', 'updated_by', 'updated_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'updated_by_name']

class BannerSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    banner_type_display = serializers.CharField(source='get_banner_type_display', read_only=True)

    class Meta:
        model = Banner
        fields = [
            'id', 'title', 'description', 'image', 'banner_type', 'banner_type_display',
            'link_url', 'link_text', 'order', 'is_active', 'start_date', 'end_date',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by_name', 'banner_type_display']

class FeaturedProductSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source='product', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = FeaturedProduct
        fields = [
            'id', 'product', 'product_details', 'order', 'is_active',
            'featured_until', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by_name', 'product_details']

class SiteSettingsSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)

    class Meta:
        model = SiteSettings
        fields = [
            'id', 'site_name', 'site_logo', 'site_favicon', 'contact_email',
            'contact_phone', 'contact_address', 'social_facebook', 'social_twitter',
            'social_instagram', 'social_whatsapp', 'enable_flash_sales', 'enable_cod',
            'enable_mtn_momo', 'enable_airtel_money', 'maintenance_mode',
            'maintenance_message', 'updated_by', 'updated_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'updated_by_name']
