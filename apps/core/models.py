"""
Abstract base models for ShopOnline Uganda E-commerce Platform.

Provides common model functionality that can be inherited by all apps:
- Base model with common fields (created_at, updated_at, etc.)
- Timestamp model for tracking creation and modification
- User tracking model for audit trails
- Soft delete functionality
- UUID primary key support
- Common model methods and managers
"""

import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey

from .constants import CURRENCY_CODE
from .utils import generate_secure_token


class TimestampMixin(models.Model):
    """
    Abstract model that provides timestamp fields for creation and modification.
    """
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this record was created"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When this record was last updated"
    )

    class Meta:
        abstract = True


class UUIDMixin(models.Model):
    """
    Abstract model that provides UUID primary key.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier for this record"
    )

    class Meta:
        abstract = True


class UserTrackingMixin(models.Model):
    """
    Abstract model that tracks which user created and modified the record.
    """
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_created',
        help_text="User who created this record"
    )
    updated_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_updated',
        help_text="User who last updated this record"
    )

    class Meta:
        abstract = True


class SoftDeleteManager(models.Manager):
    """
    Manager that excludes soft-deleted records by default.
    """
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

    def deleted(self):
        """Return only soft-deleted records."""
        return super().get_queryset().filter(is_deleted=True)

    def with_deleted(self):
        """Return all records including soft-deleted ones."""
        return super().get_queryset()


class SoftDeleteMixin(models.Model):
    """
    Abstract model that provides soft delete functionality.
    """
    is_deleted = models.BooleanField(
        default=False,
        help_text="Whether this record has been soft deleted"
    )
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this record was deleted"
    )
    deleted_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_deleted',
        help_text="User who deleted this record"
    )

    objects = SoftDeleteManager()
    all_objects = models.Manager()  # Manager that includes deleted records

    class Meta:
        abstract = True

    def delete(self, user=None, using=None, keep_parents=False):
        """
        Soft delete the record instead of actually deleting it.
        """
        self.is_deleted = True
        self.deleted_at = timezone.now()
        if user:
            self.deleted_by = user
        self.save(using=using)

    def hard_delete(self, using=None, keep_parents=False):
        """
        Actually delete the record from the database.
        """
        super().delete(using=using, keep_parents=keep_parents)

    def restore(self, user=None):
        """
        Restore a soft-deleted record.
        """
        self.is_deleted = False
        self.deleted_at = None
        self.deleted_by = None
        if user:
            self.updated_by = user
        self.save()


class StatusMixin(models.Model):
    """
    Abstract model that provides status field with common choices.
    """
    STATUS_ACTIVE = 'active'
    STATUS_INACTIVE = 'inactive'
    STATUS_DRAFT = 'draft'

    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_INACTIVE, 'Inactive'),
        (STATUS_DRAFT, 'Draft'),
    ]

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_ACTIVE,
        help_text="Status of this record"
    )

    class Meta:
        abstract = True

    def is_active(self):
        """Check if the record is active."""
        return self.status == self.STATUS_ACTIVE

    def activate(self):
        """Set status to active."""
        self.status = self.STATUS_ACTIVE
        self.save(update_fields=['status', 'updated_at'])

    def deactivate(self):
        """Set status to inactive."""
        self.status = self.STATUS_INACTIVE
        self.save(update_fields=['status', 'updated_at'])


class SlugMixin(models.Model):
    """
    Abstract model that provides slug field functionality.
    """
    slug = models.SlugField(
        max_length=255,
        unique=True,
        help_text="URL-friendly identifier"
    )

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        """
        Auto-generate slug if not provided.
        Subclasses should override get_slug_source() method.
        """
        if not self.slug and hasattr(self, 'get_slug_source'):
            from django.utils.text import slugify
            base_slug = slugify(self.get_slug_source())
            slug = base_slug
            counter = 1
            
            while self.__class__.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            
            self.slug = slug
        
        super().save(*args, **kwargs)


class MetaMixin(models.Model):
    """
    Abstract model that provides SEO meta fields.
    """
    meta_title = models.CharField(
        max_length=255,
        blank=True,
        help_text="SEO meta title"
    )
    meta_description = models.TextField(
        max_length=500,
        blank=True,
        help_text="SEO meta description"
    )
    meta_keywords = models.CharField(
        max_length=255,
        blank=True,
        help_text="SEO meta keywords (comma-separated)"
    )

    class Meta:
        abstract = True


class BaseModel(TimestampMixin, StatusMixin, SoftDeleteMixin):
    """
    Base model that combines common functionality.
    Most models in the platform should inherit from this.
    """
    
    class Meta:
        abstract = True

    def __str__(self):
        """
        String representation - subclasses should override this.
        """
        if hasattr(self, 'name'):
            return self.name
        elif hasattr(self, 'title'):
            return self.title
        else:
            return f"{self.__class__.__name__} #{self.pk}"

    def get_absolute_url(self):
        """
        Get the absolute URL for this model instance.
        Subclasses should override this method.
        """
        return f"/{self._meta.model_name}/{self.pk}/"

    @property
    def is_new(self):
        """Check if this is a newly created record (within last 24 hours)."""
        if self.created_at:
            return (timezone.now() - self.created_at).days == 0
        return False

    @property
    def is_recently_updated(self):
        """Check if this record was recently updated (within last hour)."""
        if self.updated_at:
            return (timezone.now() - self.updated_at).seconds < 3600
        return False


class BaseModelWithUser(BaseModel, UserTrackingMixin):
    """
    Base model that includes user tracking functionality.
    Use this for models that need to track who created/modified them.
    """
    
    class Meta:
        abstract = True


class BaseModelWithUUID(BaseModel, UUIDMixin):
    """
    Base model with UUID primary key.
    Use this for models that need UUID identifiers.
    """
    
    class Meta:
        abstract = True


class BaseModelWithSlug(BaseModel, SlugMixin, MetaMixin):
    """
    Base model with slug and SEO meta fields.
    Use this for models that need URL-friendly identifiers and SEO.
    """
    
    class Meta:
        abstract = True


class MoneyMixin(models.Model):
    """
    Abstract model for handling money amounts in Uganda Shillings.
    """
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=0,  # UGX doesn't use decimal places
        help_text=f"Amount in {CURRENCY_CODE}"
    )
    currency = models.CharField(
        max_length=3,
        default=CURRENCY_CODE,
        help_text="Currency code"
    )

    class Meta:
        abstract = True

    def format_amount(self):
        """Format amount with currency symbol."""
        from .utils import format_ugx_currency
        return format_ugx_currency(self.amount)

    @property
    def amount_in_currency(self):
        """Get formatted amount with currency."""
        return self.format_amount()


class AddressMixin(models.Model):
    """
    Abstract model for handling Uganda addresses.
    """
    address_line_1 = models.CharField(
        max_length=255,
        help_text="Street address, building name, etc."
    )
    address_line_2 = models.CharField(
        max_length=255,
        blank=True,
        help_text="Apartment, suite, unit, etc."
    )
    city = models.CharField(
        max_length=100,
        help_text="City or town"
    )
    region = models.CharField(
        max_length=100,
        help_text="Region or district"
    )
    postal_code = models.CharField(
        max_length=10,
        blank=True,
        help_text="Postal code (if applicable)"
    )
    country = models.CharField(
        max_length=100,
        default='Uganda',
        help_text="Country"
    )

    class Meta:
        abstract = True

    @property
    def full_address(self):
        """Get formatted full address."""
        parts = [self.address_line_1]
        if self.address_line_2:
            parts.append(self.address_line_2)
        parts.extend([self.city, self.region])
        if self.postal_code:
            parts.append(self.postal_code)
        parts.append(self.country)
        return ', '.join(parts)


class ContactMixin(models.Model):
    """
    Abstract model for contact information with Uganda phone validation.
    """
    phone_number = models.CharField(
        max_length=20,
        help_text="Phone number (Uganda format: +256XXXXXXXXX)"
    )
    email = models.EmailField(
        blank=True,
        help_text="Email address"
    )

    class Meta:
        abstract = True

    def clean(self):
        """Validate phone number format."""
        super().clean()
        if self.phone_number:
            from .validators import validate_uganda_phone_number
            validate_uganda_phone_number(self.phone_number)

    @property
    def formatted_phone(self):
        """Get formatted phone number."""
        from .utils import format_phone_number
        return format_phone_number(self.phone_number)


class TokenMixin(models.Model):
    """
    Abstract model for token-based functionality (invitations, resets, etc.).
    """
    token = models.CharField(
        max_length=255,
        unique=True,
        help_text="Secure token"
    )
    expires_at = models.DateTimeField(
        help_text="When this token expires"
    )
    used_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this token was used"
    )

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        """Auto-generate token if not provided."""
        if not self.token:
            self.token = generate_secure_token()
        super().save(*args, **kwargs)

    def is_expired(self):
        """Check if token has expired."""
        return timezone.now() > self.expires_at

    def is_used(self):
        """Check if token has been used."""
        return self.used_at is not None

    def is_valid(self):
        """Check if token is valid (not expired and not used)."""
        return not self.is_expired() and not self.is_used()

    def mark_as_used(self):
        """Mark token as used."""
        self.used_at = timezone.now()
        self.save(update_fields=['used_at'])


class ActivityLog(BaseModel):
    """
    Model for logging user activities and system events.
    """
    ACTIVITY_TYPES = [
        ('login', 'User Login'),
        ('logout', 'User Logout'),
        ('create', 'Create Record'),
        ('update', 'Update Record'),
        ('delete', 'Delete Record'),
        ('payment', 'Payment Action'),
        ('order', 'Order Action'),
        ('admin_action', 'Admin Action'),
        ('security', 'Security Event'),
    ]

    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="User who performed the activity"
    )
    activity_type = models.CharField(
        max_length=50,
        choices=ACTIVITY_TYPES,
        help_text="Type of activity"
    )
    description = models.TextField(
        help_text="Description of the activity"
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="IP address of the user"
    )
    user_agent = models.TextField(
        blank=True,
        help_text="User agent string"
    )
    
    # Generic foreign key for linking to any model
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="Content type of the related object"
    )
    object_id = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="ID of the related object"
    )
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Additional metadata
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional metadata about the activity"
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'activity_type']),
            models.Index(fields=['created_at']),
            models.Index(fields=['content_type', 'object_id']),
        ]

    def __str__(self):
        return f"{self.get_activity_type_display()} by {self.user} at {self.created_at}"


class Setting(BaseModel):
    """
    Model for storing application settings and configurations.
    """
    SETTING_TYPES = [
        ('string', 'String'),
        ('integer', 'Integer'),
        ('float', 'Float'),
        ('boolean', 'Boolean'),
        ('json', 'JSON'),
        ('text', 'Text'),
    ]

    key = models.CharField(
        max_length=255,
        unique=True,
        help_text="Setting key (unique identifier)"
    )
    value = models.TextField(
        help_text="Setting value"
    )
    setting_type = models.CharField(
        max_length=20,
        choices=SETTING_TYPES,
        default='string',
        help_text="Type of the setting value"
    )
    description = models.TextField(
        blank=True,
        help_text="Description of what this setting does"
    )
    is_public = models.BooleanField(
        default=False,
        help_text="Whether this setting can be accessed by non-admin users"
    )
    group = models.CharField(
        max_length=100,
        blank=True,
        help_text="Setting group for organization"
    )

    class Meta:
        ordering = ['group', 'key']
        indexes = [
            models.Index(fields=['key']),
            models.Index(fields=['group']),
            models.Index(fields=['is_public']),
        ]

    def __str__(self):
        return f"{self.key} = {self.value[:50]}..."

    def get_typed_value(self):
        """Return the value cast to the appropriate type."""
        if self.setting_type == 'integer':
            return int(self.value)
        elif self.setting_type == 'float':
            return float(self.value)
        elif self.setting_type == 'boolean':
            return self.value.lower() in ('true', '1', 'yes', 'on')
        elif self.setting_type == 'json':
            import json
            return json.loads(self.value)
        else:
            return self.value

    @classmethod
    def get_setting(cls, key, default=None):
        """Get a setting value by key."""
        try:
            setting = cls.objects.get(key=key)
            return setting.get_typed_value()
        except cls.DoesNotExist:
            return default

    @classmethod
    def set_setting(cls, key, value, setting_type='string', description='', group=''):
        """Set a setting value."""
        setting, created = cls.objects.get_or_create(
            key=key,
            defaults={
                'value': str(value),
                'setting_type': setting_type,
                'description': description,
                'group': group,
            }
        )
        if not created:
            setting.value = str(value)
            setting.setting_type = setting_type
            if description:
                setting.description = description
            if group:
                setting.group = group
            setting.save()
        return setting


class CacheEntry(models.Model):
    """
    Model for custom caching with metadata.
    """
    key = models.CharField(
        max_length=255,
        unique=True,
        help_text="Cache key"
    )
    value = models.TextField(
        help_text="Cached value (JSON serialized)"
    )
    expires_at = models.DateTimeField(
        help_text="When this cache entry expires"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    hit_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of times this cache entry was accessed"
    )
    tags = models.CharField(
        max_length=500,
        blank=True,
        help_text="Cache tags for bulk invalidation (comma-separated)"
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['key']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['tags']),
        ]

    def __str__(self):
        return f"Cache: {self.key}"

    def is_expired(self):
        """Check if cache entry has expired."""
        return timezone.now() > self.expires_at

    def increment_hit_count(self):
        """Increment the hit count."""
        self.hit_count += 1
        self.save(update_fields=['hit_count'])

    @classmethod
    def get_cached(cls, key):
        """Get cached value if not expired."""
        try:
            entry = cls.objects.get(key=key)
            if entry.is_expired():
                entry.delete()
                return None
            entry.increment_hit_count()
            import json
            return json.loads(entry.value)
        except cls.DoesNotExist:
            return None

    @classmethod
    def set_cached(cls, key, value, timeout_seconds, tags=None):
        """Set cached value with expiration."""
        import json
        expires_at = timezone.now() + timezone.timedelta(seconds=timeout_seconds)
        tags_str = ','.join(tags) if tags else ''
        
        entry, created = cls.objects.get_or_create(
            key=key,
            defaults={
                'value': json.dumps(value),
                'expires_at': expires_at,
                'tags': tags_str,
            }
        )
        if not created:
            entry.value = json.dumps(value)
            entry.expires_at = expires_at
            entry.tags = tags_str
            entry.save()
        return entry

    @classmethod
    def invalidate_by_tags(cls, tags):
        """Invalidate all cache entries with given tags."""
        if not tags:
            return 0
        
        count = 0
        for tag in tags:
            entries = cls.objects.filter(tags__icontains=tag)
            count += entries.count()
            entries.delete()
        return count

    @classmethod
    def cleanup_expired(cls):
        """Remove expired cache entries."""
        expired_count = cls.objects.filter(expires_at__lt=timezone.now()).count()
        cls.objects.filter(expires_at__lt=timezone.now()).delete()
        return expired_count


class FileUpload(BaseModelWithUUID, UserTrackingMixin):
    """
    Model for tracking file uploads with metadata.
    """
    FILE_TYPES = [
        ('image', 'Image'),
        ('document', 'Document'),
        ('video', 'Video'),
        ('audio', 'Audio'),
        ('other', 'Other'),
    ]

    original_filename = models.CharField(
        max_length=255,
        help_text="Original filename"
    )
    filename = models.CharField(
        max_length=255,
        help_text="Stored filename"
    )
    file_path = models.CharField(
        max_length=500,
        help_text="File path in storage"
    )
    file_url = models.URLField(
        blank=True,
        help_text="Public URL to access the file"
    )
    file_type = models.CharField(
        max_length=20,
        choices=FILE_TYPES,
        help_text="Type of file"
    )
    mime_type = models.CharField(
        max_length=100,
        help_text="MIME type of the file"
    )
    file_size = models.PositiveIntegerField(
        help_text="File size in bytes"
    )
    width = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Image width (for images)"
    )
    height = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Image height (for images)"
    )
    
    # Generic foreign key for linking to any model
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="Content type of the related object"
    )
    object_id = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="ID of the related object"
    )
    content_object = GenericForeignKey('content_type', 'object_id')

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['file_type']),
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['created_by']),
        ]

    def __str__(self):
        return f"{self.original_filename} ({self.get_file_type_display()})"

    @property
    def is_image(self):
        """Check if file is an image."""
        return self.file_type == 'image'

    @property
    def formatted_file_size(self):
        """Get human-readable file size."""
        if self.file_size < 1024:
            return f"{self.file_size} bytes"
        elif self.file_size < 1024 * 1024:
            return f"{self.file_size / 1024:.1f} KB"
        else:
            return f"{self.file_size / (1024 * 1024):.1f} MB"

    def delete(self, *args, **kwargs):
        """Delete file from storage when model is deleted."""
        # Note: Actual file deletion should be handled by storage backend
        # This is just a placeholder for the logic
        super().delete(*args, **kwargs)