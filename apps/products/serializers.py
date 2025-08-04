"""
Products App Serializers
Handles serialization of product-related models for API responses
"""

from rest_framework import serializers
from django.db import transaction
from django.utils.text import slugify
from decimal import Decimal

from .models import Product, ProductImage, ProductAttribute, ProductVariant
from apps.categories.serializers import CategoryBasicSerializer


class ProductImageSerializer(serializers.ModelSerializer):
    """Serializer for product images"""
    
    image_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductImage
        fields = [
            'id', 'image', 'thumbnail', 'image_url', 'thumbnail_url',
            'alt_text', 'caption', 'position', 'is_main', 'created_at'
        ]
        read_only_fields = ['id', 'thumbnail', 'created_at']
    
    def get_image_url(self, obj):
        """Get full image URL"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
    def get_thumbnail_url(self, obj):
        """Get thumbnail URL"""
        if obj.thumbnail:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.thumbnail.url)
            return obj.thumbnail.url
        return None


class ProductAttributeSerializer(serializers.ModelSerializer):
    """Serializer for product attributes"""
    
    class Meta:
        model = ProductAttribute
        fields = ['id', 'name', 'value', 'position']
        read_only_fields = ['id']


class ProductVariantSerializer(serializers.ModelSerializer):
    """Serializer for product variants"""
    
    is_in_stock = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductVariant
        fields = [
            'id', 'name', 'sku', 'price', 'stock_quantity', 
            'is_active', 'color', 'size', 'weight', 'is_in_stock'
        ]
        read_only_fields = ['id', 'sku']
    
    def get_is_in_stock(self, obj):
        """Check if variant is in stock"""
        return obj.stock_quantity > 0


class ProductListSerializer(serializers.ModelSerializer):
    """Serializer for product list view (minimal fields)"""
    
    category = CategoryBasicSerializer(read_only=True)
    main_image = ProductImageSerializer(read_only=True)
    is_in_stock = serializers.ReadOnlyField()
    is_on_sale = serializers.ReadOnlyField()
    discount_percentage = serializers.ReadOnlyField()
    image_url = serializers.ReadOnlyField()
    thumbnail_url = serializers.ReadOnlyField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'short_description', 'price', 
            'original_price', 'category', 'is_featured', 'is_in_stock',
            'is_on_sale', 'discount_percentage', 'rating_average',
            'review_count', 'main_image', 'image_url', 'thumbnail_url',
            'created_at'
        ]


class ProductDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed product view"""
    
    category = CategoryBasicSerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    attributes = ProductAttributeSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    
    # Computed fields
    is_in_stock = serializers.ReadOnlyField()
    is_low_stock = serializers.ReadOnlyField()
    is_on_sale = serializers.ReadOnlyField()
    discount_percentage = serializers.ReadOnlyField()
    profit_margin = serializers.ReadOnlyField()
    image_url = serializers.ReadOnlyField()
    thumbnail_url = serializers.ReadOnlyField()
    
    # Related products
    related_products = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'short_description',
            'category', 'tags', 'price', 'original_price', 'cost_price',
            'sku', 'stock_quantity', 'low_stock_threshold', 'track_inventory',
            'allow_backorders', 'weight', 'dimensions', 'color', 'size',
            'material', 'brand', 'model', 'condition', 'meta_title',
            'meta_description', 'meta_keywords', 'status', 'is_active',
            'is_featured', 'is_digital', 'requires_shipping', 'published_at',
            'view_count', 'order_count', 'rating_average', 'review_count',
            'images', 'attributes', 'variants', 'is_in_stock', 'is_low_stock',
            'is_on_sale', 'discount_percentage', 'profit_margin', 'image_url',
            'thumbnail_url', 'related_products', 'created_at', 'updated_at'
        ]
    
    def get_related_products(self, obj):
        """Get related products"""
        related = obj.get_related_products(limit=4)
        return ProductListSerializer(
            related, 
            many=True, 
            context=self.context
        ).data


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating products"""
    
    images_data = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False,
        allow_empty=True
    )
    attributes_data = ProductAttributeSerializer(
        many=True, 
        write_only=True, 
        required=False
    )
    variants_data = ProductVariantSerializer(
        many=True, 
        write_only=True, 
        required=False
    )
    
    # Include nested data in response
    images = ProductImageSerializer(many=True, read_only=True)
    attributes = ProductAttributeSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'short_description',
            'category', 'tags', 'price', 'original_price', 'cost_price',
            'sku', 'stock_quantity', 'low_stock_threshold', 'track_inventory',
            'allow_backorders', 'weight', 'dimensions', 'color', 'size',
            'material', 'brand', 'model', 'condition', 'meta_title',
            'meta_description', 'meta_keywords', 'status', 'is_active',
            'is_featured', 'is_digital', 'requires_shipping',
            'images_data', 'attributes_data', 'variants_data',
            'images', 'attributes', 'variants'
        ]
        read_only_fields = ['id', 'sku', 'slug', 'view_count', 'order_count']
    
    def validate(self, data):
        """Custom validation"""
        # Validate price relationships
        price = data.get('price')
        original_price = data.get('original_price')
        cost_price = data.get('cost_price')
        
        if original_price and price and original_price < price:
            raise serializers.ValidationError(
                "Original price cannot be less than current price"
            )
        
        if cost_price and price and cost_price > price:
            raise serializers.ValidationError(
                "Cost price cannot be greater than selling price"
            )
        
        # Validate stock settings
        track_inventory = data.get('track_inventory', True)
        stock_quantity = data.get('stock_quantity', 0)
        
        if track_inventory and stock_quantity < 0:
            raise serializers.ValidationError(
                "Stock quantity cannot be negative when inventory tracking is enabled"
            )
        
        return data
    
    def validate_name(self, value):
        """Validate product name"""
        if len(value.strip()) < 3:
            raise serializers.ValidationError(
                "Product name must be at least 3 characters long"
            )
        return value.strip()
    
    def validate_price(self, value):
        """Validate price"""
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than 0")
        return value
    
    @transaction.atomic
    def create(self, validated_data):
        """Create product with related objects"""
        images_data = validated_data.pop('images_data', [])
        attributes_data = validated_data.pop('attributes_data', [])
        variants_data = validated_data.pop('variants_data', [])
        
        # Create product
        product = Product.objects.create(**validated_data)
        
        # Create images
        self._create_images(product, images_data)
        
        # Create attributes
        self._create_attributes(product, attributes_data)
        
        # Create variants
        self._create_variants(product, variants_data)
        
        return product
    
    @transaction.atomic
    def update(self, instance, validated_data):
        """Update product with related objects"""
        images_data = validated_data.pop('images_data', None)
        attributes_data = validated_data.pop('attributes_data', None)
        variants_data = validated_data.pop('variants_data', None)
        
        # Update product fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update images if provided
        if images_data is not None:
            # Delete existing images
            instance.images.all().delete()
            # Create new images
            self._create_images(instance, images_data)
        
        # Update attributes if provided
        if attributes_data is not None:
            # Delete existing attributes
            instance.attributes.all().delete()
            # Create new attributes
            self._create_attributes(instance, attributes_data)
        
        # Update variants if provided
        if variants_data is not None:
            # Delete existing variants
            instance.variants.all().delete()
            # Create new variants
            self._create_variants(instance, variants_data)
        
        return instance
    
    def _create_images(self, product, images_data):
        """Create product images"""
        for index, image_file in enumerate(images_data):
            ProductImage.objects.create(
                product=product,
                image=image_file,
                position=index,
                is_main=(index == 0)  # First image is main
            )
    
    def _create_attributes(self, product, attributes_data):
        """Create product attributes"""
        for index, attr_data in enumerate(attributes_data):
            ProductAttribute.objects.create(
                product=product,
                position=index,
                **attr_data
            )
    
    def _create_variants(self, product, variants_data):
        """Create product variants"""
        for variant_data in variants_data:
            ProductVariant.objects.create(
                product=product,
                **variant_data
            )


class ProductSearchSerializer(serializers.ModelSerializer):
    """Serializer for product search results"""
    
    category_name = serializers.CharField(source='category.name', read_only=True)
    image_url = serializers.ReadOnlyField()
    is_in_stock = serializers.ReadOnlyField()
    is_on_sale = serializers.ReadOnlyField()
    discount_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'short_description', 'price',
            'original_price', 'category_name', 'is_featured',
            'is_in_stock', 'is_on_sale', 'discount_percentage',
            'rating_average', 'image_url'
        ]


class ProductBulkUpdateSerializer(serializers.Serializer):
    """Serializer for bulk product updates"""
    
    ACTION_CHOICES = [
        ('activate', 'Activate'),
        ('deactivate', 'Deactivate'),
        ('feature', 'Feature'),
        ('unfeature', 'Unfeature'),
        ('delete', 'Delete'),
        ('update_category', 'Update Category'),
        ('update_price', 'Update Price'),
        ('update_stock', 'Update Stock'),
    ]
    
    product_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1,
        max_length=100
    )
    action = serializers.ChoiceField(choices=ACTION_CHOICES)
    
    # Optional fields for specific actions
    category_id = serializers.UUIDField(required=False, allow_null=True)
    price_adjustment = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        required=False,
        allow_null=True
    )
    price_adjustment_type = serializers.ChoiceField(
        choices=[('fixed', 'Fixed Amount'), ('percentage', 'Percentage')],
        required=False
    )
    stock_adjustment = serializers.IntegerField(required=False, allow_null=True)
    stock_adjustment_type = serializers.ChoiceField(
        choices=[('set', 'Set To'), ('add', 'Add'), ('subtract', 'Subtract')],
        required=False
    )
    
    def validate(self, data):
        """Validate bulk update data"""
        action = data.get('action')
        
        # Validate required fields for specific actions
        if action == 'update_category' and not data.get('category_id'):
            raise serializers.ValidationError(
                "Category ID is required for category update action"
            )
        
        if action == 'update_price':
            if not data.get('price_adjustment'):
                raise serializers.ValidationError(
                    "Price adjustment is required for price update action"
                )
            if not data.get('price_adjustment_type'):
                raise serializers.ValidationError(
                    "Price adjustment type is required for price update action"
                )
        
        if action == 'update_stock':
            if data.get('stock_adjustment') is None:
                raise serializers.ValidationError(
                    "Stock adjustment is required for stock update action"
                )
            if not data.get('stock_adjustment_type'):
                raise serializers.ValidationError(
                    "Stock adjustment type is required for stock update action"
                )
        
        return data


class ProductStatsSerializer(serializers.Serializer):
    """Serializer for product statistics"""
    
    total_products = serializers.IntegerField()
    active_products = serializers.IntegerField()
    featured_products = serializers.IntegerField()
    out_of_stock_products = serializers.IntegerField()
    low_stock_products = serializers.IntegerField()
    total_value = serializers.DecimalField(max_digits=15, decimal_places=2)
    average_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    top_categories = serializers.ListField()
    recent_products = ProductListSerializer(many=True)


class ProductImageUploadSerializer(serializers.ModelSerializer):
    """Serializer for individual image upload"""
    
    class Meta:
        model = ProductImage
        fields = ['image', 'alt_text', 'caption', 'position', 'is_main']
    
    def create(self, validated_data):
        """Create product image"""
        product_id = self.context.get('product_id')
        if not product_id:
            raise serializers.ValidationError("Product ID is required")
        
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found")
        
        validated_data['product'] = product
        return super().create(validated_data)


class ProductImageUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating product image details"""
    
    class Meta:
        model = ProductImage
        fields = ['alt_text', 'caption', 'position', 'is_main']
    
    def validate_is_main(self, value):
        """Validate main image setting"""
        if value and self.instance:
            # Check if trying to unset the only main image
            other_main_images = ProductImage.objects.filter(
                product=self.instance.product,
                is_main=True
            ).exclude(id=self.instance.id)
            
            if not other_main_images.exists() and not value:
                raise serializers.ValidationError(
                    "At least one image must be set as main"
                )
        
        return value


class ProductExportSerializer(serializers.ModelSerializer):
    """Serializer for product export"""
    
    category_name = serializers.CharField(source='category.name', read_only=True)
    images_count = serializers.SerializerMethodField()
    attributes_count = serializers.SerializerMethodField()
    variants_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'short_description',
            'category_name', 'tags', 'price', 'original_price', 'cost_price',
            'sku', 'stock_quantity', 'low_stock_threshold', 'track_inventory',
            'allow_backorders', 'weight', 'dimensions', 'color', 'size',
            'material', 'brand', 'model', 'condition', 'status', 'is_active',
            'is_featured', 'is_digital', 'requires_shipping', 'view_count',
            'order_count', 'rating_average', 'review_count', 'images_count',
            'attributes_count', 'variants_count', 'created_at', 'updated_at'
        ]
    
    def get_images_count(self, obj):
        """Get number of images"""
        return obj.images.count()
    
    def get_attributes_count(self, obj):
        """Get number of attributes"""
        return obj.attributes.count()
    
    def get_variants_count(self, obj):
        """Get number of variants"""
        return obj.variants.count()


class ProductImportSerializer(serializers.Serializer):
    """Serializer for product import validation"""
    
    name = serializers.CharField(max_length=255)
    description = serializers.CharField()
    short_description = serializers.CharField(max_length=500, required=False, allow_blank=True)
    category_name = serializers.CharField(max_length=100)
    tags = serializers.CharField(required=False, allow_blank=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    original_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    cost_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    sku = serializers.CharField(max_length=100, required=False, allow_blank=True)
    stock_quantity = serializers.IntegerField(default=0)
    low_stock_threshold = serializers.IntegerField(default=10)
    track_inventory = serializers.BooleanField(default=True)
    allow_backorders = serializers.BooleanField(default=False)
    weight = serializers.DecimalField(max_digits=8, decimal_places=2, required=False, allow_null=True)
    dimensions = serializers.CharField(max_length=100, required=False, allow_blank=True)
    color = serializers.CharField(max_length=50, required=False, allow_blank=True)
    size = serializers.CharField(max_length=50, required=False, allow_blank=True)
    material = serializers.CharField(max_length=100, required=False, allow_blank=True)
    brand = serializers.CharField(max_length=100, required=False, allow_blank=True)
    model = serializers.CharField(max_length=100, required=False, allow_blank=True)
    condition = serializers.ChoiceField(choices=Product.CONDITION_CHOICES, default='new')
    status = serializers.ChoiceField(choices=Product.STATUS_CHOICES, default='draft')
    is_active = serializers.BooleanField(default=True)
    is_featured = serializers.BooleanField(default=False)
    is_digital = serializers.BooleanField(default=False)
    requires_shipping = serializers.BooleanField(default=True)
    
    def validate_category_name(self, value):
        """Validate category exists"""
        from apps.categories.models import Category
        try:
            Category.objects.get(name__iexact=value.strip())
            return value.strip()
        except Category.DoesNotExist:
            raise serializers.ValidationError(f"Category '{value}' does not exist")
    
    def validate_sku(self, value):
        """Validate SKU uniqueness"""
        if value and Product.objects.filter(sku=value).exists():
            raise serializers.ValidationError(f"SKU '{value}' already exists")
        return value
    
    def validate(self, data):
        """Custom validation for import data"""
        # Validate price relationships
        price = data.get('price')
        original_price = data.get('original_price')
        cost_price = data.get('cost_price')
        
        if original_price and price and original_price < price:
            raise serializers.ValidationError(
                "Original price cannot be less than current price"
            )
        
        if cost_price and price and cost_price > price:
            raise serializers.ValidationError(
                "Cost price cannot be greater than selling price"
            )
        
        return data


class ProductQuickEditSerializer(serializers.ModelSerializer):
    """Serializer for quick product edits (limited fields)"""
    
    class Meta:
        model = Product
        fields = [
            'name', 'price', 'original_price', 'stock_quantity',
            'is_active', 'is_featured', 'status'
        ]
    
    def validate_price(self, value):
        """Validate price"""
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than 0")
        return value