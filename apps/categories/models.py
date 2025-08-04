# apps/categories/models.py

from django.db import models
from django.core.validators import MinLengthValidator
from django.urls import reverse
from django.utils.text import slugify
from apps.core.models import BaseModel
import uuid


class Category(BaseModel):
    """
    Category model for organizing products in the e-commerce platform
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(
        max_length=100,
        unique=True,
        validators=[MinLengthValidator(2)],
        help_text="Category name (must be unique)"
    )
    slug = models.SlugField(
        max_length=120,
        unique=True,
        blank=True,
        help_text="URL-friendly version of the name (auto-generated)"
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Detailed description of the category"
    )
    image = models.ImageField(
        upload_to='categories/',
        blank=True,
        null=True,
        help_text="Category image for display"
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name='subcategories',
        help_text="Parent category for creating hierarchy"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this category is active and visible"
    )
    sort_order = models.PositiveIntegerField(
        default=0,
        help_text="Order in which categories should be displayed"
    )
    featured = models.BooleanField(
        default=False,
        help_text="Whether this category should be featured on homepage"
    )
    meta_title = models.CharField(
        max_length=200,
        blank=True,
        help_text="SEO meta title"
    )
    meta_description = models.TextField(
        blank=True,
        help_text="SEO meta description"
    )

    class Meta:
        db_table = 'categories'
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
        ordering = ['sort_order', 'name']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['is_active']),
            models.Index(fields=['featured']),
            models.Index(fields=['parent']),
            models.Index(fields=['sort_order']),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        """Auto-generate slug if not provided"""
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Category.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        
        # Set meta_title if not provided
        if not self.meta_title:
            self.meta_title = self.name
            
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        """Return the URL for this category"""
        return reverse('categories:category-detail', kwargs={'slug': self.slug})

    @property
    def product_count(self):
        """Return the number of active products in this category"""
        return self.products.filter(is_active=True).count()

    @property
    def subcategory_count(self):
        """Return the number of active subcategories"""
        return self.subcategories.filter(is_active=True).count()

    @property
    def is_parent(self):
        """Check if this category has subcategories"""
        return self.subcategories.exists()

    @property
    def breadcrumb_trail(self):
        """Return breadcrumb trail for this category"""
        trail = []
        current = self
        while current:
            trail.append(current)
            current = current.parent
        return list(reversed(trail))

    @property
    def all_products_count(self):
        """Return total products including those in subcategories"""
        from apps.products.models import Product
        
        # Get all descendant categories
        descendant_ids = self.get_descendant_ids()
        descendant_ids.append(self.id)
        
        return Product.objects.filter(
            category_id__in=descendant_ids,
            is_active=True
        ).count()

    def get_descendant_ids(self):
        """Get all descendant category IDs recursively"""
        descendant_ids = []
        
        def collect_descendants(category):
            for subcategory in category.subcategories.filter(is_active=True):
                descendant_ids.append(subcategory.id)
                collect_descendants(subcategory)
        
        collect_descendants(self)
        return descendant_ids

    def get_active_subcategories(self):
        """Get all active subcategories"""
        return self.subcategories.filter(is_active=True).order_by('sort_order', 'name')

    def get_featured_products(self, limit=8):
        """Get featured products from this category"""
        return self.products.filter(
            is_active=True,
            featured=True
        ).order_by('-created_at')[:limit]

    def can_be_deleted(self):
        """Check if category can be safely deleted"""
        return not self.products.exists() and not self.subcategories.exists()

    @classmethod
    def get_root_categories(cls):
        """Get all root categories (no parent)"""
        return cls.objects.filter(parent=None, is_active=True).order_by('sort_order', 'name')

    @classmethod
    def get_featured_categories(cls, limit=6):
        """Get featured categories for homepage"""
        return cls.objects.filter(
            is_active=True,
            featured=True
        ).order_by('sort_order', 'name')[:limit]

    def clean(self):
        """Custom validation"""
        from django.core.exceptions import ValidationError
        
        # Prevent self-referencing
        if self.parent == self:
            raise ValidationError("Category cannot be its own parent")
        
        # Prevent circular references
        if self.parent:
            current = self.parent
            while current:
                if current == self:
                    raise ValidationError("Circular reference detected in category hierarchy")
                current = current.parent