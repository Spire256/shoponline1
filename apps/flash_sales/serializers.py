# apps/flash_sales/serializers.py
from rest_framework import serializers
from django.utils import timezone
from .models import FlashSale, FlashSaleProduct
from apps.products.serializers import ProductSerializer


class FlashSaleSerializer(serializers.ModelSerializer):
    """Serializer for Flash Sale model"""
    
    is_running = serializers.ReadOnlyField()
    is_upcoming = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField()
    time_remaining = serializers.ReadOnlyField()
    products_count = serializers.ReadOnlyField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = FlashSale
        fields = [
            'id', 'name', 'description', 'discount_percentage',
            'start_time', 'end_time', 'is_active', 'max_discount_amount',
            'banner_image', 'priority', 'created_by', 'created_by_name',
            'is_running', 'is_upcoming', 'is_expired', 'time_remaining',
            'products_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        """Validate flash sale data"""
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        
        if start_time and end_time:
            if start_time >= end_time:
                raise serializers.ValidationError("End time must be after start time")
            
            if end_time <= timezone.now():
                raise serializers.ValidationError("End time must be in the future")
        
        return data


class FlashSaleProductSerializer(serializers.ModelSerializer):
    """Serializer for Flash Sale Product model"""
    
    product_detail = ProductSerializer(source='product', read_only=True)
    discount_percentage = serializers.ReadOnlyField()
    savings_amount = serializers.ReadOnlyField()
    is_sold_out = serializers.ReadOnlyField()
    added_by_name = serializers.CharField(source='added_by.get_full_name', read_only=True)

    class Meta:
        model = FlashSaleProduct
        fields = [
            'id', 'flash_sale', 'product', 'product_detail',
            'custom_discount_percentage', 'flash_sale_price', 'original_price',
            'stock_limit', 'sold_quantity', 'is_active', 'added_by', 'added_by_name',
            'discount_percentage', 'savings_amount', 'is_sold_out',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'flash_sale_price', 'original_price', 'created_at', 'updated_at']

    def validate_stock_limit(self, value):
        """Validate stock limit"""
        if value is not None and value <= 0:
            raise serializers.ValidationError("Stock limit must be positive")
        return value


class FlashSaleWithProductsSerializer(FlashSaleSerializer):
    """Flash Sale serializer with products included"""
    
    flash_sale_products = FlashSaleProductSerializer(many=True, read_only=True)

    class Meta(FlashSaleSerializer.Meta):
        fields = FlashSaleSerializer.Meta.fields + ['flash_sale_products']


class CreateFlashSaleProductSerializer(serializers.ModelSerializer):
    """Serializer for creating flash sale products"""
    
    class Meta:
        model = FlashSaleProduct
        fields = [
            'product', 'custom_discount_percentage', 'stock_limit', 'is_active'
        ]

    def create(self, validated_data):
        """Create flash sale product with calculated prices"""
        flash_sale = self.context['flash_sale']
        user = self.context['request'].user
        
        validated_data['flash_sale'] = flash_sale
        validated_data['added_by'] = user
        validated_data['original_price'] = validated_data['product'].price
        
        return super().create(validated_data)

