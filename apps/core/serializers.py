"""
Base serializers for ShopOnline Uganda E-commerce Platform.

Provides common serializer functionality:
- Base serializers with common fields
- Timestamp serializer mixin
- User tracking serializer mixin
- Money amount serialization
- Address serialization
- File upload serialization
- Common validation methods
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.files.base import ContentFile
import base64
import uuid

from .constants import CURRENCY_CODE, ALLOWED_IMAGE_EXTENSIONS, MAX_IMAGE_SIZE
from .utils import format_ugx_currency, validate_phone_number
from .validators import validate_uganda_phone_number

User = get_user_model()


class TimestampSerializerMixin(serializers.Serializer):
    """
    Mixin for serializing timestamp fields.
    """
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def to_representation(self, instance):
        """Add formatted timestamp fields."""
        data = super().to_representation(instance)
        
        if hasattr(instance, 'created_at') and instance.created_at:
            data['created_at_formatted'] = instance.created_at.strftime('%B %d, %Y at %I:%M %p')
            data['created_at_relative'] = self.get_relative_time(instance.created_at)
        
        if hasattr(instance, 'updated_at') and instance.updated_at:
            data['updated_at_formatted'] = instance.updated_at.strftime('%B %d, %Y at %I:%M %p')
            data['updated_at_relative'] = self.get_relative_time(instance.updated_at)
        
        return data

    def get_relative_time(self, dt):
        """Get relative time string (e.g., '2 hours ago')."""
        now = timezone.now()
        diff = now - dt
        
        if diff.days > 0:
            if diff.days == 1:
                return "1 day ago"
            return f"{diff.days} days ago"
        
        hours = diff.seconds // 3600
        if hours > 0:
            if hours == 1:
                return "1 hour ago"
            return f"{hours} hours ago"
        
        minutes = diff.seconds // 60
        if minutes > 0:
            if minutes == 1:
                return "1 minute ago"
            return f"{minutes} minutes ago"
        
        return "Just now"


class UserTrackingSerializerMixin(serializers.Serializer):
    """
    Mixin for serializing user tracking fields.
    """
    created_by = serializers.StringRelatedField(read_only=True)
    updated_by = serializers.StringRelatedField(read_only=True)
    
    created_by_details = serializers.SerializerMethodField()
    updated_by_details = serializers.SerializerMethodField()

    def get_created_by_details(self, obj):
        """Get created by user details."""
        if hasattr(obj, 'created_by') and obj.created_by:
            return {
                'id': obj.created_by.id,
                'name': obj.created_by.get_full_name() or obj.created_by.email,
                'email': obj.created_by.email,
                'role': getattr(obj.created_by, 'role', 'client')
            }
        return None

    def get_updated_by_details(self, obj):
        """Get updated by user details."""
        if hasattr(obj, 'updated_by') and obj.updated_by:
            return {
                'id': obj.updated_by.id,
                'name': obj.updated_by.get_full_name() or obj.updated_by.email,
                'email': obj.updated_by.email,
                'role': getattr(obj.updated_by, 'role', 'client')
            }
        return None


class StatusSerializerMixin(serializers.Serializer):
    """
    Mixin for serializing status fields.
    """
    status = serializers.CharField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_active = serializers.SerializerMethodField()

    def get_is_active(self, obj):
        """Check if the object is active."""
        return hasattr(obj, 'is_active') and obj.is_active()


class MoneySerializerMixin(serializers.Serializer):
    """
    Mixin for serializing money amounts.
    """
    amount = serializers.DecimalField(max_digits=12, decimal_places=0)
    currency = serializers.CharField(default=CURRENCY_CODE, read_only=True)
    formatted_amount = serializers.SerializerMethodField()

    def get_formatted_amount(self, obj):
        """Get formatted amount with currency."""
        if hasattr(obj, 'amount'):
            return format_ugx_currency(obj.amount)
        return None


class AddressSerializerMixin(serializers.Serializer):
    """
    Mixin for serializing address fields.
    """
    address_line_1 = serializers.CharField(max_length=255)
    address_line_2 = serializers.CharField(max_length=255, required=False, allow_blank=True)
    city = serializers.CharField(max_length=100)
    region = serializers.CharField(max_length=100)
    postal_code = serializers.CharField(max_length=10, required=False, allow_blank=True)
    country = serializers.CharField(max_length=100, default='Uganda')
    full_address = serializers.SerializerMethodField()

    def get_full_address(self, obj):
        """Get formatted full address."""
        if hasattr(obj, 'full_address'):
            return obj.full_address
        return None


class ContactSerializerMixin(serializers.Serializer):
    """
    Mixin for serializing contact information.
    """
    phone_number = serializers.CharField(max_length=20)
    email = serializers.EmailField(required=False, allow_blank=True)
    formatted_phone = serializers.SerializerMethodField()

    def get_formatted_phone(self, obj):
        """Get formatted phone number."""
        if hasattr(obj, 'formatted_phone'):
            return obj.formatted_phone
        return None

    def validate_phone_number(self, value):
        """Validate Uganda phone number format."""
        if value:
            validate_uganda_phone_number(value)
        return value


class Base64ImageField(serializers.ImageField):
    """
    A Django REST framework field for handling image-uploads through base64-encoded strings.
    """
    
    def to_internal_value(self, data):
        # Check if this is a base64 string
        if isinstance(data, str) and data.startswith('data:image'):
            # Break out the header from the base64 content
            format, imgstr = data.split(';base64,')
            ext = format.split('/')[-1]
            
            # Validate file extension
            if ext.lower() not in ALLOWED_IMAGE_EXTENSIONS:
                raise serializers.ValidationError(
                    f"Unsupported image format. Allowed formats: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
                )
            
            # Decode the base64 string
            try:
                decoded_data = base64.b64decode(imgstr)
            except Exception:
                raise serializers.ValidationError("Invalid base64 image data")
            
            # Check file size
            if len(decoded_data) > MAX_IMAGE_SIZE:
                raise serializers.ValidationError(
                    f"Image file too large. Maximum size is {MAX_IMAGE_SIZE / (1024*1024):.1f}MB"
                )
            
            # Generate a unique filename
            filename = f"{uuid.uuid4()}.{ext}"
            data = ContentFile(decoded_data, name=filename)

        return super().to_internal_value(data)


class FileUploadSerializer(serializers.Serializer):
    """
    Serializer for file upload information.
    """
    id = serializers.UUIDField(read_only=True)
    original_filename = serializers.CharField(read_only=True)
    filename = serializers.CharField(read_only=True)
    file_url = serializers.URLField(read_only=True)
    file_type = serializers.CharField(read_only=True)
    file_size = serializers.IntegerField(read_only=True)
    formatted_file_size = serializers.CharField(read_only=True)
    width = serializers.IntegerField(read_only=True)
    height = serializers.IntegerField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)


class BaseModelSerializer(
    TimestampSerializerMixin,
    StatusSerializerMixin,
    serializers.ModelSerializer
):
    """
    Base model serializer that includes common functionality.
    Most serializers should inherit from this.
    """
    id = serializers.IntegerField(read_only=True)
    
    class Meta:
        abstract = True
        fields = [
            'id',
            'created_at',
            'updated_at',
            'created_at_formatted',
            'created_at_relative',
            'updated_at_formatted',
            'updated_at_relative',
            'status',
            'status_display',
            'is_active'
        ]

    def create(self, validated_data):
        """Create instance with current user tracking."""
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            if hasattr(self.Meta.model, 'created_by'):
                validated_data['created_by'] = request.user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Update instance with current user tracking."""
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            if hasattr(instance, 'updated_by'):
                validated_data['updated_by'] = request.user
        return super().update(instance, validated_data)


class BaseModelWithUserSerializer(
    BaseModelSerializer,
    UserTrackingSerializerMixin
):
    """
    Base model serializer with user tracking fields.
    """
    
    class Meta:
        abstract = True
        fields = BaseModelSerializer.Meta.fields + [
            'created_by',
            'updated_by',
            'created_by_details',
            'updated_by_details'
        ]


class BaseModelWithUUIDSerializer(BaseModelSerializer):
    """
    Base model serializer with UUID primary key.
    """
    id = serializers.UUIDField(read_only=True)
    
    class Meta:
        abstract = True


class SlugSerializerMixin(serializers.Serializer):
    """
    Mixin for serializing slug fields.
    """
    slug = serializers.SlugField(read_only=True)


class MetaSerializerMixin(serializers.Serializer):
    """
    Mixin for serializing SEO meta fields.
    """
    meta_title = serializers.CharField(max_length=255, required=False, allow_blank=True)
    meta_description = serializers.CharField(max_length=500, required=False, allow_blank=True)
    meta_keywords = serializers.CharField(max_length=255, required=False, allow_blank=True)


class PaginationSerializer(serializers.Serializer):
    """
    Serializer for pagination metadata.
    """
    count = serializers.IntegerField()
    next = serializers.URLField(allow_null=True)
    previous = serializers.URLField(allow_null=True)
    page = serializers.IntegerField()
    page_size = serializers.IntegerField()
    total_pages = serializers.IntegerField()
    has_next = serializers.BooleanField()
    has_previous = serializers.BooleanField()


class PaginatedResponseSerializer(serializers.Serializer):
    """
    Generic serializer for paginated responses.
    """
    pagination = PaginationSerializer()
    results = serializers.ListField()


class ErrorSerializer(serializers.Serializer):
    """
    Serializer for error responses.
    """
    error_code = serializers.CharField()
    message = serializers.CharField()
    details = serializers.DictField(required=False)
    timestamp = serializers.DateTimeField()


class SuccessSerializer(serializers.Serializer):
    """
    Serializer for success responses.
    """
    success = serializers.BooleanField(default=True)
    message = serializers.CharField()
    data = serializers.DictField(required=False)
    timestamp = serializers.DateTimeField()


class BulkActionSerializer(serializers.Serializer):
    """
    Serializer for bulk actions.
    """
    ACTION_CHOICES = [
        ('activate', 'Activate'),
        ('deactivate', 'Deactivate'),
        ('delete', 'Delete'),
        ('restore', 'Restore'),
    ]
    
    ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        help_text="List of IDs to perform action on"
    )
    action = serializers.ChoiceField(
        choices=ACTION_CHOICES,
        help_text="Action to perform"
    )
    confirm = serializers.BooleanField(
        default=False,
        help_text="Confirmation flag for destructive actions"
    )

    def validate(self, data):
        """Validate bulk action data."""
        if data['action'] in ['delete'] and not data.get('confirm'):
            raise serializers.ValidationError(
                "Confirmation required for destructive actions"
            )
        return data


class SearchSerializer(serializers.Serializer):
    """
    Serializer for search queries.
    """
    query = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
        help_text="Search query string"
    )
    category = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
        help_text="Filter by category"
    )
    min_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=0,
        required=False,
        help_text="Minimum price filter"
    )
    max_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=0,
        required=False,
        help_text="Maximum price filter"
    )
    sort_by = serializers.ChoiceField(
        choices=[
            ('name', 'Name'),
            ('price', 'Price'),
            ('created_at', 'Date Created'),
            ('popularity', 'Popularity'),
        ],
        required=False,
        default='name',
        help_text="Sort results by field"
    )
    sort_order = serializers.ChoiceField(
        choices=[
            ('asc', 'Ascending'),
            ('desc', 'Descending'),
        ],
        required=False,
        default='asc',
        help_text="Sort order"
    )


class FilterSerializer(serializers.Serializer):
    """
    Base serializer for filtering data.
    """
    status = serializers.ChoiceField(
        choices=[('active', 'Active'), ('inactive', 'Inactive'), ('all', 'All')],
        required=False,
        default='active',
        help_text="Filter by status"
    )
    created_after = serializers.DateTimeField(
        required=False,
        help_text="Filter records created after this date"
    )
    created_before = serializers.DateTimeField(
        required=False,
        help_text="Filter records created before this date"
    )
    search = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
        help_text="Search in text fields"
    )


class ExportSerializer(serializers.Serializer):
    """
    Serializer for data export options.
    """
    FORMAT_CHOICES = [
        ('csv', 'CSV'),
        ('excel', 'Excel'),
        ('json', 'JSON'),
        ('pdf', 'PDF'),
    ]
    
    format = serializers.ChoiceField(
        choices=FORMAT_CHOICES,
        default='csv',
        help_text="Export format"
    )
    fields = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="Specific fields to export (optional)"
    )
    filters = serializers.DictField(
        required=False,
        help_text="Filters to apply to exported data"
    )
    include_deleted = serializers.BooleanField(
        default=False,
        help_text="Include soft-deleted records"
    )


class AnalyticsSerializer(serializers.Serializer):
    """
    Serializer for analytics data.
    """
    period = serializers.ChoiceField(
        choices=[
            ('day', 'Day'),
            ('week', 'Week'),
            ('month', 'Month'),
            ('quarter', 'Quarter'),
            ('year', 'Year'),
        ],
        default='month',
        help_text="Time period for analytics"
    )
    start_date = serializers.DateField(
        required=False,
        help_text="Start date for custom period"
    )
    end_date = serializers.DateField(
        required=False,
        help_text="End date for custom period"
    )
    group_by = serializers.CharField(
        max_length=50,
        required=False,
        help_text="Field to group results by"
    )

    def validate(self, data):
        """Validate analytics parameters."""
        if data.get('start_date') and data.get('end_date'):
            if data['start_date'] > data['end_date']:
                raise serializers.ValidationError(
                    "Start date must be before end date"
                )
        return data


class NotificationSerializer(TimestampSerializerMixin, serializers.Serializer):
    """
    Serializer for notifications.
    """
    id = serializers.IntegerField(read_only=True)
    title = serializers.CharField(max_length=255)
    message = serializers.TextField()
    notification_type = serializers.CharField(max_length=50)
    is_read = serializers.BooleanField(default=False)
    url = serializers.URLField(required=False, allow_blank=True)
    metadata = serializers.DictField(required=False)


class ActivityLogSerializer(TimestampSerializerMixin, serializers.Serializer):
    """
    Serializer for activity logs.
    """
    id = serializers.IntegerField(read_only=True)
    user = serializers.StringRelatedField()
    activity_type = serializers.CharField()
    activity_type_display = serializers.CharField(source='get_activity_type_display')
    description = serializers.CharField()
    ip_address = serializers.IPAddressField()
    metadata = serializers.DictField()


class HealthCheckSerializer(serializers.Serializer):
    """
    Serializer for system health check.
    """
    status = serializers.CharField()
    timestamp = serializers.DateTimeField()
    version = serializers.CharField()
    database = serializers.BooleanField()
    cache = serializers.BooleanField()
    storage = serializers.BooleanField()
    external_services = serializers.DictField()
    performance = serializers.DictField()