# apps/categories/utils.py

from django.core.exceptions import ValidationError
from django.utils.text import slugify
from django.core.files.storage import default_storage
from PIL import Image
import os
import uuid


def generate_category_slug(name, category_id=None):
    """
    Generate a unique slug for a category
    """
    from .models import Category
    
    base_slug = slugify(name)
    if not base_slug:
        base_slug = 'category'
    
    slug = base_slug
    counter = 1
    
    while True:
        queryset = Category.objects.filter(slug=slug)
        if category_id:
            queryset = queryset.exclude(id=category_id)
        
        if not queryset.exists():
            break
        
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    return slug


def validate_category_image(image):
    """
    Validate category image file
    """
    if not image:
        return True
    
    # Check file size (max 5MB)
    if image.size > 5 * 1024 * 1024:
        raise ValidationError("Image file size cannot exceed 5MB")
    
    # Check file format
    valid_formats = ['JPEG', 'JPG', 'PNG', 'WEBP']
    
    try:
        with Image.open(image) as img:
            if img.format not in valid_formats:
                raise ValidationError(
                    f"Invalid image format. Supported formats: {', '.join(valid_formats)}"
                )
            
            # Check image dimensions (min 200x200, max 2000x2000)
            width, height = img.size
            if width < 200 or height < 200:
                raise ValidationError("Image dimensions must be at least 200x200 pixels")
            
            if width > 2000 or height > 2000:
                raise ValidationError("Image dimensions cannot exceed 2000x2000 pixels")
    
    except Exception as e:
        if isinstance(e, ValidationError):
            raise
        raise ValidationError("Invalid image file")
    
    return True


def process_category_image(image, category_name):
    """
    Process and optimize category image
    """
    if not image:
        return None
    
    try:
        # Generate unique filename
        ext = os.path.splitext(image.name)[1].lower()
        filename = f"category_{slugify(category_name)}_{uuid.uuid4()}{ext}"
        
        # Open and process image
        with Image.open(image) as img:
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')
            
            # Resize image if too large
            max_size = (800, 800)
            if img.size[0] > max_size[0] or img.size[1] > max_size[1]:
                img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Save optimized image
            from io import BytesIO
            output = BytesIO()
            img.save(output, format='JPEG', quality=85, optimize=True)
            output.seek(0)
            
            # Save to storage
            path = default_storage.save(f'categories/{filename}', output)
            return path
    
    except Exception as e:
        raise ValidationError(f"Error processing image: {str(e)}")


def get_category_tree_data(categories=None):
    """
    Convert category queryset to tree structure for frontend
    """
    from .models import Category
    
    if categories is None:
        categories = Category.objects.filter(is_active=True).select_related('parent')
    
    # Build category lookup
    category_dict = {cat.id: cat for cat in categories}
    tree = []
    
    def build_tree_node(category):
        node = {
            'id': category.id,
            'name': category.name,
            'slug': category.slug,
            'product_count': getattr(category, 'product_count', 0),
            'children': []
        }
        
        # Add children
        for child_cat in categories:
            if child_cat.parent_id == category.id:
                node['children'].append(build_tree_node(child_cat))
        
        # Sort children by sort_order and name
        node['children'].sort(key=lambda x: (x.get('sort_order', 0), x['name']))
        
        return node
    
    # Find root categories and build tree
    for category in categories:
        if category.parent_id is None:
            tree.append(build_tree_node(category))
    
    # Sort root categories
    tree.sort(key=lambda x: (x.get('sort_order', 0), x['name']))
    
    return tree


def validate_category_hierarchy(category, parent):
    """
    Validate category hierarchy to prevent issues
    """
    if not parent:
        return True
    
    # Check for self-referencing
    if parent == category:
        raise ValidationError("Category cannot be its own parent")
    
    # Check for circular references
    current = parent
    depth = 1
    while current:
        if current == category:
            raise ValidationError("Circular reference detected in category hierarchy")
        current = current.parent
        depth += 1
        
        # Prevent infinite loops and too deep hierarchies
        if depth > 10:
            raise ValidationError("Category hierarchy is too deep (max 10 levels)")
    
    return True


def calculate_category_metrics(category):
    """
    Calculate various metrics for a category
    """
    try:
        from apps.products.models import Product
        from django.db.models import Sum, Avg, Count
        
        # Direct product count
        direct_products = category.products.filter(is_active=True).count()
        
        # Total products (including subcategories)
        descendant_ids = category.get_descendant_ids()
        descendant_ids.append(category.id)
        total_products = Product.objects.filter(
            category_id__in=descendant_ids,
            is_active=True
        ).count()
        
        # Subcategory count
        subcategories = category.subcategories.filter(is_active=True).count()
        
        # Price statistics
        products = Product.objects.filter(
            category_id__in=descendant_ids,
            is_active=True
        )
        
        price_stats = products.aggregate(
            avg_price=Avg('price'),
            min_price=Sum('price'),
            max_price=Sum('price'),
            total_value=Sum('price')
        )
        
        # Featured products count
        featured_products = products.filter(featured=True).count()
        
        return {
            'direct_products': direct_products,
            'total_products': total_products,
            'subcategories': subcategories,
            'featured_products': featured_products,
            'avg_price': price_stats['avg_price'] or 0,
            'min_price': price_stats['min_price'] or 0,
            'max_price': price_stats['max_price'] or 0,
            'total_value': price_stats['total_value'] or 0,
        }
    
    except Exception as e:
        return {
            'direct_products': 0,
            'total_products': 0,
            'subcategories': 0,
            'featured_products': 0,
            'avg_price': 0,
            'min_price': 0,
            'max_price': 0,
            'total_value': 0,
        }


def optimize_category_images():
    """
    Utility function to optimize existing category images
    """
    from .models import Category
    
    categories = Category.objects.exclude(image='')
    processed = 0
    errors = []
    
    for category in categories:
        try:
            if category.image and default_storage.exists(category.image.name):
                # Process the existing image
                with default_storage.open(category.image.name, 'rb') as image_file:
                    optimized_path = process_category_image(image_file, category.name)
                    
                    if optimized_path:
                        # Delete old image
                        old_path = category.image.name
                        category.image = optimized_path
                        category.save()
                        
                        if old_path != optimized_path:
                            default_storage.delete(old_path)
                        
                        processed += 1
        
        except Exception as e:
            errors.append(f"Error processing {category.name}: {str(e)}")
    
    return {
        'processed': processed,
        'errors': errors
    }


def bulk_update_category_slugs():
    """
    Utility function to regenerate slugs for all categories
    """
    from .models import Category
    
    categories = Category.objects.all()
    updated = 0
    errors = []
    
    for category in categories:
        try:
            old_slug = category.slug
            new_slug = generate_category_slug(category.name, category.id)
            
            if old_slug != new_slug:
                category.slug = new_slug
                category.save()
                updated += 1
        
        except Exception as e:
            errors.append(f"Error updating slug for {category.name}: {str(e)}")
    
    return {
        'updated': updated,
        'errors': errors
    }


def validate_category_data(data):
    """
    Comprehensive validation for category data
    """
    errors = {}
    
    # Validate name
    name = data.get('name', '').strip()
    if not name:
        errors['name'] = 'Category name is required'
    elif len(name) < 2:
        errors['name'] = 'Category name must be at least 2 characters long'
    elif len(name) > 100:
        errors['name'] = 'Category name cannot exceed 100 characters'
    
    # Validate description
    description = data.get('description', '')
    if description and len(description) > 1000:
        errors['description'] = 'Description cannot exceed 1000 characters'
    
    # Validate sort order
    sort_order = data.get('sort_order')
    if sort_order is not None:
        try:
            sort_order = int(sort_order)
            if sort_order < 0:
                errors['sort_order'] = 'Sort order cannot be negative'
        except (ValueError, TypeError):
            errors['sort_order'] = 'Sort order must be a valid number'
    
    # Validate meta fields
    meta_title = data.get('meta_title', '')
    if meta_title and len(meta_title) > 200:
        errors['meta_title'] = 'Meta title cannot exceed 200 characters'
    
    meta_description = data.get('meta_description', '')
    if meta_description and len(meta_description) > 500:
        errors['meta_description'] = 'Meta description cannot exceed 500 characters'
    
    # Validate image
    image = data.get('image')
    if image:
        try:
            validate_category_image(image)
        except ValidationError as e:
            errors['image'] = str(e)
    
    return errors


def generate_category_breadcrumbs(category, include_self=True):
    """
    Generate breadcrumb navigation for a category
    """
    breadcrumbs = []
    
    # Add ancestors
    current = category.parent
    while current:
        breadcrumbs.append({
            'id': current.id,
            'name': current.name,
            'slug': current.slug,
            'url': f'/categories/{current.slug}/'
        })
        current = current.parent
    
    # Reverse to get correct order
    breadcrumbs.reverse()
    
    # Add self if requested
    if include_self:
        breadcrumbs.append({
            'id': category.id,
            'name': category.name,
            'slug': category.slug,
            'url': f'/categories/{category.slug}/',
            'current': True
        })
    
    return breadcrumbs


def export_categories_to_csv():
    """
    Export categories data to CSV format
    """
    from .models import Category
    import csv
    from io import StringIO
    
    output = StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        'ID', 'Name', 'Slug', 'Description', 'Parent', 'Is Active',
        'Featured', 'Sort Order', 'Product Count', 'Created At', 'Updated At'
    ])
    
    # Write data
    categories = Category.objects.select_related('parent').all()
    for category in categories:
        writer.writerow([
            str(category.id),
            category.name,
            category.slug,
            category.description or '',
            category.parent.name if category.parent else '',
            category.is_active,
            category.featured,
            category.sort_order,
            category.product_count,
            category.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            category.updated_at.strftime('%Y-%m-%d %H:%M:%S')
        ])
    
    return output.getvalue()


def import_categories_from_csv(csv_content):
    """
    Import categories from CSV content
    """
    from .models import Category
    import csv
    from io import StringIO
    
    results = {
        'created': 0,
        'updated': 0,
        'errors': []
    }
    
    try:
        csv_file = StringIO(csv_content)
        reader = csv.DictReader(csv_file)
        
        for row_num, row in enumerate(reader, start=2):
            try:
                name = row.get('Name', '').strip()
                if not name:
                    results['errors'].append(f"Row {row_num}: Name is required")
                    continue
                
                # Check if category exists
                category, created = Category.objects.get_or_create(
                    name=name,
                    defaults={
                        'description': row.get('Description', ''),
                        'is_active': row.get('Is Active', 'True').lower() == 'true',
                        'featured': row.get('Featured', 'False').lower() == 'true',
                        'sort_order': int(row.get('Sort Order', 0)),
                    }
                )
                
                if created:
                    results['created'] += 1
                else:
                    # Update existing category
                    category.description = row.get('Description', category.description)
                    category.is_active = row.get('Is Active', str(category.is_active)).lower() == 'true'
                    category.featured = row.get('Featured', str(category.featured)).lower() == 'true'
                    category.sort_order = int(row.get('Sort Order', category.sort_order))
                    category.save()
                    results['updated'] += 1
            
            except Exception as e:
                results['errors'].append(f"Row {row_num}: {str(e)}")
    
    except Exception as e:
        results['errors'].append(f"CSV parsing error: {str(e)}")
    
    return results


def cleanup_unused_category_images():
    """
    Clean up category images that are no longer referenced
    """
    from .models import Category
    import os
    
    # Get all category image paths
    used_images = set()
    for category in Category.objects.exclude(image=''):
        if category.image:
            used_images.add(category.image.name)
    
    # Find all images in category directory
    category_dir = 'categories/'
    if default_storage.exists(category_dir):
        all_images = set()
        dirs, files = default_storage.listdir(category_dir)
        
        for file in files:
            if file.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                all_images.add(os.path.join(category_dir, file))
    
        # Delete unused images
        unused_images = all_images - used_images
        deleted_count = 0
        
        for image_path in unused_images:
            try:
                default_storage.delete(image_path)
                deleted_count += 1
            except Exception:
                pass  # Ignore errors for individual file deletions
        
        return {
            'total_images': len(all_images),
            'used_images': len(used_images),
            'deleted_images': deleted_count
        }
    
    return {'total_images': 0, 'used_images': 0, 'deleted_images': 0}