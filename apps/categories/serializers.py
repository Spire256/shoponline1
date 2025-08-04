# apps/categories/serializers.py

from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer for Category model with basic information
    """
    product_count = serializers.ReadOnlyField()
    subcategory_count = serializers.ReadOnlyField()
    is_parent = serializers.ReadOnlyField()
    breadcrumb_trail = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'description', 'image', 'parent',
            'is_active', 'sort_order', 'featured', 'product_count',
            'subcategory_count', 'is_parent', 'breadcrumb_trail',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']

    def get_breadcrumb_trail(self, obj):
        """Get breadcrumb trail for the category"""
        trail = []
        for category in obj.breadcrumb_trail:
            trail.append({
                'id': category.id,
                'name': category.name,
                'slug': category.slug
            })
        return trail

    def validate(self, data):
        """Custom validation for category data"""
        # Check for circular references
        parent = data.get('parent')
        if parent and self.instance:
            current = parent
            while current:
                if current == self.instance:
                    raise serializers.ValidationError(
                        "Cannot set parent - would create circular reference"
                    )
                current = current.parent
        
        return data

    def validate_name(self, value):
        """Validate category name"""
        if len(value.strip()) < 2:
            raise serializers.ValidationError(
                "Category name must be at least 2 characters long"
            )
        
        # Check for uniqueness (excluding current instance)
        queryset = Category.objects.filter(name__iexact=value.strip())
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError(
                "A category with this name already exists"
            )
        
        return value.strip()


class CategoryDetailSerializer(CategorySerializer):
    """
    Detailed serializer for Category with additional information
    """
    subcategories = serializers.SerializerMethodField()
    all_products_count = serializers.ReadOnlyField()
    featured_products = serializers.SerializerMethodField()
    parent_details = serializers.SerializerMethodField()

    class Meta(CategorySerializer.Meta):
        fields = CategorySerializer.Meta.fields + [
            'meta_title', 'meta_description', 'subcategories',
            'all_products_count', 'featured_products', 'parent_details'
        ]

    def get_subcategories(self, obj):
        """Get active subcategories"""
        subcategories = obj.get_active_subcategories()
        return CategoryListSerializer(subcategories, many=True).data

    def get_featured_products(self, obj):
        """Get featured products from this category"""
        from apps.products.serializers import ProductListSerializer
        featured_products = obj.get_featured_products(limit=8)
        return ProductListSerializer(featured_products, many=True).data

    def get_parent_details(self, obj):
        """Get parent category details"""
        if obj.parent:
            return {
                'id': obj.parent.id,
                'name': obj.parent.name,
                'slug': obj.parent.slug
            }
        return None


class CategoryListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for category lists
    """
    product_count = serializers.ReadOnlyField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'description', 'image_url',
            'product_count', 'featured', 'sort_order'
        ]

    def get_image_url(self, obj):
        """Get full URL for category image"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class CategoryTreeSerializer(serializers.ModelSerializer):
    """
    Serializer for category tree structure
    """
    subcategories = serializers.SerializerMethodField()
    product_count = serializers.ReadOnlyField()

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'product_count',
            'subcategories', 'sort_order'
        ]

    def get_subcategories(self, obj):
        """Recursively get subcategories"""
        subcategories = obj.get_active_subcategories()
        return CategoryTreeSerializer(subcategories, many=True).data


class CategoryCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating categories
    """
    class Meta:
        model = Category
        fields = [
            'name', 'description', 'image', 'parent', 'is_active',
            'sort_order', 'featured', 'meta_title', 'meta_description'
        ]

    def validate_name(self, value):
        """Validate category name"""
        if len(value.strip()) < 2:
            raise serializers.ValidationError(
                "Category name must be at least 2 characters long"
            )
        
        # Check for uniqueness
        queryset = Category.objects.filter(name__iexact=value.strip())
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError(
                "A category with this name already exists"
            )
        
        return value.strip()

    def validate(self, data):
        """Custom validation"""
        parent = data.get('parent')
        
        # Prevent self-referencing
        if parent and self.instance and parent == self.instance:
            raise serializers.ValidationError({
                'parent': "Category cannot be its own parent"
            })
        
        # Prevent circular references
        if parent and self.instance:
            current = parent
            while current:
                if current == self.instance:
                    raise serializers.ValidationError({
                        'parent': "Cannot set parent - would create circular reference"
                    })
                current = current.parent
        
        return data

    def create(self, validated_data):
        """Create new category"""
        try:
            return super().create(validated_data)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))

    def update(self, instance, validated_data):
        """Update existing category"""
        try:
            return super().update(instance, validated_data)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))


class CategoryBulkActionSerializer(serializers.Serializer):
    """
    Serializer for bulk actions on categories
    """
    ACTION_CHOICES = [
        ('activate', 'Activate'),
        ('deactivate', 'Deactivate'),
        ('feature', 'Feature'),
        ('unfeature', 'Unfeature'),
        ('delete', 'Delete'),
    ]

    category_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1,
        help_text="List of category IDs to perform action on"
    )
    action = serializers.ChoiceField(
        choices=ACTION_CHOICES,
        help_text="Action to perform on selected categories"
    )

    def validate_category_ids(self, value):
        """Validate that all category IDs exist"""
        existing_ids = Category.objects.filter(id__in=value).values_list('id', flat=True)
        missing_ids = set(value) - set(existing_ids)
        
        if missing_ids:
            raise serializers.ValidationError(
                f"Categories with IDs {list(missing_ids)} do not exist"
            )
        
        return value

    def validate(self, data):
        """Additional validation for bulk actions"""
        action = data.get('action')
        category_ids = data.get('category_ids', [])
        
        if action == 'delete':
            # Check if categories can be deleted
            categories = Category.objects.filter(id__in=category_ids)
            undeletable = []
            
            for category in categories:
                if not category.can_be_deleted():
                    undeletable.append(category.name)
            
            if undeletable:
                raise serializers.ValidationError(
                    f"Cannot delete categories with products or subcategories: {', '.join(undeletable)}"
                )
        
        return data


class CategorySearchSerializer(serializers.Serializer):
    """
    Serializer for category search parameters
    """
    q = serializers.CharField(
        required=False,
        help_text="Search term for category name or description"
    )
    parent = serializers.UUIDField(
        required=False,
        help_text="Parent category ID to filter by"
    )
    featured = serializers.BooleanField(
        required=False,
        help_text="Filter by featured status"
    )
    is_active = serializers.BooleanField(
        required=False,
        help_text="Filter by active status"
    )
    sort_by = serializers.ChoiceField(
        choices=[
            ('name', 'Name'),
            ('-name', 'Name (descending)'),
            ('created_at', 'Created date'),
            ('-created_at', 'Created date (descending)'),
            ('sort_order', 'Sort order'),
            ('product_count', 'Product count'),
        ],
        required=False,
        default='sort_order',
        help_text="Field to sort by"
    )

    def validate_parent(self, value):
        """Validate parent category exists"""
        if value and not Category.objects.filter(id=value).exists():
            raise serializers.ValidationError("Parent category does not exist")
        return value