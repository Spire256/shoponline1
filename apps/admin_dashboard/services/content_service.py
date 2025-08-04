# apps/admin_dashboard/services/content_service.py
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from PIL import Image
from io import BytesIO
import os
from typing import Dict, Any, Optional, Tuple

class ContentService:
    """Service for managing content and media files"""

    def __init__(self):
        self.allowed_image_formats = ['JPEG', 'PNG', 'WEBP']
        self.max_image_size = (1920, 1080)  # Max resolution
        self.max_file_size = 5 * 1024 * 1024  # 5MB

    def process_banner_image(self, image_file, banner_type: str) -> Tuple[str, Dict[str, Any]]:
        """Process banner image upload with optimization"""
        # Validate file size
        if image_file.size > self.max_file_size:
            raise ValueError("Image file too large. Maximum size is 5MB.")

        # Process image
        try:
            # Open and validate image
            img = Image.open(image_file)
            
            if img.format not in self.allowed_image_formats:
                raise ValueError(f"Unsupported image format. Allowed: {', '.join(self.allowed_image_formats)}")

            # Optimize image based on banner type
            if banner_type == 'hero':
                # Hero banners can be larger
                max_size = (1920, 800)
            else:
                # Other banners are smaller
                max_size = (800, 400)

            # Resize if necessary
            if img.size[0] > max_size[0] or img.size[1] > max_size[1]:
                img.thumbnail(max_size, Image.Resampling.LANCZOS)

            # Convert to RGB if necessary
            if img.mode not in ('RGB', 'RGBA'):
                img = img.convert('RGB')

            # Save optimized image
            output = BytesIO()
            img.save(output, format='JPEG', quality=85, optimize=True)
            output.seek(0)

            # Generate filename
            filename = f"banners/{banner_type}_{image_file.name}"
            
            # Save to storage
            path = default_storage.save(filename, ContentFile(output.read()))
            
            return path, {
                'original_size': image_file.size,
                'processed_size': len(output.getvalue()),
                'dimensions': img.size,
                'format': 'JPEG'
            }

        except Exception as e:
            raise ValueError(f"Error processing image: {str(e)}")

    def process_product_image(self, image_file) -> Tuple[str, str, Dict[str, Any]]:
        """Process product image with thumbnail generation"""
        # Validate file size
        if image_file.size > self.max_file_size:
            raise ValueError("Image file too large. Maximum size is 5MB.")

        try:
            # Open and validate image
            img = Image.open(image_file)
            
            if img.format not in self.allowed_image_formats:
                raise ValueError(f"Unsupported image format. Allowed: {', '.join(self.allowed_image_formats)}")

            # Create main image (800x800 max)
            main_img = img.copy()
            main_img.thumbnail((800, 800), Image.Resampling.LANCZOS)
            
            # Create thumbnail (200x200)
            thumb_img = img.copy()
            thumb_img.thumbnail((200, 200), Image.Resampling.LANCZOS)

            # Convert to RGB if necessary
            if main_img.mode not in ('RGB', 'RGBA'):
                main_img = main_img.convert('RGB')
            if thumb_img.mode not in ('RGB', 'RGBA'):
                thumb_img = thumb_img.convert('RGB')

            # Save main image
            main_output = BytesIO()
            main_img.save(main_output, format='JPEG', quality=85, optimize=True)
            main_output.seek(0)

            # Save thumbnail
            thumb_output = BytesIO()
            thumb_img.save(thumb_output, format='JPEG', quality=80, optimize=True)
            thumb_output.seek(0)

            # Generate filenames
            base_name = os.path.splitext(image_file.name)[0]
            main_filename = f"products/images/{base_name}.jpg"
            thumb_filename = f"products/thumbnails/{base_name}_thumb.jpg"
            
            # Save to storage
            main_path = default_storage.save(main_filename, ContentFile(main_output.read()))
            thumb_path = default_storage.save(thumb_filename, ContentFile(thumb_output.read()))
            
            return main_path, thumb_path, {
                'original_size': image_file.size,
                'main_size': len(main_output.getvalue()),
                'thumb_size': len(thumb_output.getvalue()),
                'main_dimensions': main_img.size,
                'thumb_dimensions': thumb_img.size
            }

        except Exception as e:
            raise ValueError(f"Error processing image: {str(e)}")

    def delete_image(self, image_path: str) -> bool:
        """Delete image from storage"""
        try:
            if default_storage.exists(image_path):
                default_storage.delete(image_path)
                return True
            return False
        except Exception:
            return False

    def validate_content_data(self, content_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate content data based on type"""
        errors = {}

        if content_type == 'homepage':
            if not data.get('title'):
                errors['title'] = 'Title is required'
            elif len(data['title']) > 200:
                errors['title'] = 'Title must be less than 200 characters'

            if data.get('subtitle') and len(data['subtitle']) > 300:
                errors['subtitle'] = 'Subtitle must be less than 300 characters'

            if data.get('meta_description') and len(data['meta_description']) > 160:
                errors['meta_description'] = 'Meta description must be less than 160 characters'

        elif content_type == 'banner':
            if not data.get('title'):
                errors['title'] = 'Title is required'
            elif len(data['title']) > 200:
                errors['title'] = 'Title must be less than 200 characters'

            if data.get('link_url') and not data.get('link_text'):
                errors['link_text'] = 'Link text is required when URL is provided'

            if data.get('start_date') and data.get('end_date'):
                if data['start_date'] >= data['end_date']:
                    errors['dates'] = 'Start date must be before end date'

        return errors