"""
Image Service
Handles image processing, optimization, and management for products
"""

import os
import uuid
from io import BytesIO
from PIL import Image, ImageOps
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.core.files.storage import default_storage
from django.conf import settings
import sys


class ImageService:
    """Service class for image processing and management"""
    
    # Image size configurations
    THUMBNAIL_SIZE = (300, 300)
    MEDIUM_SIZE = (600, 600)
    LARGE_SIZE = (1200, 1200)
    
    # Supported formats
    SUPPORTED_FORMATS = ['JPEG', 'PNG', 'WEBP']
    
    # Quality settings
    JPEG_QUALITY = 85
    PNG_OPTIMIZE = True
    WEBP_QUALITY = 80
    
    @staticmethod
    def process_product_image(image_file, create_variants=True):
        """
        Process uploaded product image and create optimized variants
        """
        try:
            # Open and validate image
            image = Image.open(image_file)
            
            # Convert to RGB if necessary (handles RGBA, P mode, etc.)
            if image.mode not in ('RGB', 'RGBA'):
                if image.mode == 'RGBA':
                    # Create white background for transparency
                    background = Image.new('RGB', image.size, (255, 255, 255))
                    background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
                    image = background
                else:
                    image = image.convert('RGB')
            
            # Auto-rotate based on EXIF data
            image = ImageOps.exif_transpose(image)
            
            # Store original image info
            original_width, original_height = image.size
            original_format = image.format or 'JPEG'
            
            # Process main image
            processed_image = ImageService._optimize_image(
                image, 
                max_size=ImageService.LARGE_SIZE,
                quality=ImageService.JPEG_QUALITY
            )
            
            results = {
                'main_image': processed_image,
                'original_dimensions': (original_width, original_height),
                'processed_dimensions': processed_image.size if hasattr(processed_image, 'size') else None
            }
            
            if create_variants:
                # Create thumbnail
                thumbnail = ImageService._create_thumbnail(
                    image, 
                    ImageService.THUMBNAIL_SIZE
                )
                results['thumbnail'] = thumbnail
                
                # Create medium size variant
                medium = ImageService._optimize_image(
                    image,
                    max_size=ImageService.MEDIUM_SIZE,
                    quality=ImageService.JPEG_QUALITY
                )
                results['medium'] = medium
            
            return results
            
        except Exception as e:
            raise ValueError(f"Error processing image: {str(e)}")
    
    @staticmethod
    def _optimize_image(image, max_size=None, quality=85, format='JPEG'):
        """
        Optimize image size and quality
        """
        # Resize if necessary
        if max_size:
            image.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Save to BytesIO
        output = BytesIO()
        
        # Optimize based on format
        if format == 'JPEG':
            image.save(output, format='JPEG', quality=quality, optimize=True)
        elif format == 'PNG':
            image.save(output, format='PNG', optimize=True)
        elif format == 'WEBP':
            image.save(output, format='WEBP', quality=quality, optimize=True)
        else:
            # Default to JPEG
            image.save(output, format='JPEG', quality=quality, optimize=True)
        
        output.seek(0)
        
        # Create InMemoryUploadedFile
        filename = f"{uuid.uuid4()}.{format.lower()}"
        return InMemoryUploadedFile(
            output,
            'ImageField',
            filename,
            f'image/{format.lower()}',
            sys.getsizeof(output),
            None
        )
    
    @staticmethod
    def _create_thumbnail(image, size):
        """
        Create thumbnail with proper aspect ratio handling
        """
        # Calculate thumbnail size maintaining aspect ratio
        original_width, original_height = image.size
        thumb_width, thumb_height = size
        
        # Calculate ratios
        width_ratio = thumb_width / original_width
        height_ratio = thumb_height / original_height
        
        # Use the smaller ratio to ensure image fits within bounds
        ratio = min(width_ratio, height_ratio)
        
        # Calculate new dimensions
        new_width = int(original_width * ratio)
        new_height = int(original_height * ratio)
        
        # Resize image
        resized_image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Create thumbnail with background if needed
        if new_width != thumb_width or new_height != thumb_height:
            # Create white background
            thumbnail = Image.new('RGB', (thumb_width, thumb_height), (255, 255, 255))
            
            # Calculate position to center the image
            x = (thumb_width - new_width) // 2
            y = (thumb_height - new_height) // 2
            
            # Paste resized image onto background
            thumbnail.paste(resized_image, (x, y))
        else:
            thumbnail = resized_image
        
        return ImageService._optimize_image(
            thumbnail,
            quality=ImageService.JPEG_QUALITY,
            format='JPEG'
        )
    
    @staticmethod
    def create_image_variants(image_file):
        """
        Create multiple size variants of an image
        """
        try:
            image = Image.open(image_file)
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                if image.mode == 'RGBA':
                    background = Image.new('RGB', image.size, (255, 255, 255))
                    background.paste(image, mask=image.split()[-1])
                    image = background
                else:
                    image = image.convert('RGB')
            
            # Auto-rotate
            image = ImageOps.exif_transpose(image)
            
            variants = {}
            
            # Original/Large variant
            variants['large'] = ImageService._optimize_image(
                image.copy(),
                max_size=ImageService.LARGE_SIZE,
                quality=ImageService.JPEG_QUALITY
            )
            
            # Medium variant
            variants['medium'] = ImageService._optimize_image(
                image.copy(),
                max_size=ImageService.MEDIUM_SIZE,
                quality=ImageService.JPEG_QUALITY
            )
            
            # Thumbnail variant
            variants['thumbnail'] = ImageService._create_thumbnail(
                image.copy(),
                ImageService.THUMBNAIL_SIZE
            )
            
            return variants
            
        except Exception as e:
            raise ValueError(f"Error creating image variants: {str(e)}")
    
    @staticmethod
    def validate_image(image_file):
        """
        Validate uploaded image file
        """
        # Check file size (max 10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        if image_file.size > max_size:
            raise ValueError("Image file too large. Maximum size is 10MB.")
        
        # Check file format
        try:
            image = Image.open(image_file)
            if image.format not in ['JPEG', 'PNG', 'WEBP']:
                raise ValueError("Unsupported image format. Use JPEG, PNG, or WEBP.")
            
            # Check image dimensions (minimum 100x100)
            width, height = image.size
            if width < 100 or height < 100:
                raise ValueError("Image too small. Minimum size is 100x100 pixels.")
            
            # Check maximum dimensions (8000x8000)
            if width > 8000 or height > 8000:
                raise ValueError("Image too large. Maximum size is 8000x8000 pixels.")
            
            return True
            
        except Exception as e:
            if isinstance(e, ValueError):
                raise
            raise ValueError("Invalid image file.")
    
    @staticmethod
    def get_image_info(image_file):
        """
        Get information about an image file
        """
        try:
            image = Image.open(image_file)
            
            info = {
                'format': image.format,
                'mode': image.mode,
                'size': image.size,
                'width': image.size[0],
                'height': image.size[1],
                'has_transparency': image.mode in ('RGBA', 'LA') or 'transparency' in image.info,
                'file_size': image_file.size,
                'aspect_ratio': round(image.size[0] / image.size[1], 2)
            }
            
            # Get EXIF data if available
            try:
                exif = image._getexif()
                if exif:
                    info['has_exif'] = True
                    # Extract useful EXIF data
                    if 274 in exif:  # Orientation
                        info['orientation'] = exif[274]
                else:
                    info['has_exif'] = False
            except:
                info['has_exif'] = False
            
            return info
            
        except Exception as e:
            raise ValueError(f"Error reading image info: {str(e)}")
    
    @staticmethod
    def convert_to_webp(image_file, quality=80):
        """
        Convert image to WebP format for better compression
        """
        try:
            image = Image.open(image_file)
            
            # Convert to RGB if necessary
            if image.mode not in ('RGB', 'RGBA'):
                image = image.convert('RGB')
            
            # Auto-rotate
            image = ImageOps.exif_transpose(image)
            
            # Save as WebP
            output = BytesIO()
            image.save(output, format='WEBP', quality=quality, optimize=True)
            output.seek(0)
            
            filename = f"{uuid.uuid4()}.webp"
            return InMemoryUploadedFile(
                output,
                'ImageField',
                filename,
                'image/webp',
                sys.getsizeof(output),
                None
            )
            
        except Exception as e:
            raise ValueError(f"Error converting to WebP: {str(e)}")
    
    @staticmethod
    def create_placeholder_image(size=(300, 300), color=(240, 240, 240), text="No Image"):
        """
        Create a placeholder image for products without images
        """
        try:
            from PIL import ImageDraw, ImageFont
            
            # Create image with background color
            image = Image.new('RGB', size, color)
            draw = ImageDraw.Draw(image)
            
            # Try to use a font, fallback to default if not available
            try:
                font = ImageFont.truetype("arial.ttf", 20)
            except:
                font = ImageFont.load_default()
            
            # Calculate text position
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            x = (size[0] - text_width) // 2
            y = (size[1] - text_height) // 2
            
            # Draw text
            draw.text((x, y), text, fill=(128, 128, 128), font=font)
            
            # Save to BytesIO
            output = BytesIO()
            image.save(output, format='JPEG', quality=85)
            output.seek(0)
            
            filename = f"placeholder_{uuid.uuid4()}.jpg"
            return InMemoryUploadedFile(
                output,
                'ImageField',
                filename,
                'image/jpeg',
                sys.getsizeof(output),
                None
            )
            
        except Exception as e:
            raise ValueError(f"Error creating placeholder: {str(e)}")
    
    @staticmethod
    def bulk_process_images(image_files):
        """
        Process multiple images in bulk
        """
        results = {
            'success_count': 0,
            'error_count': 0,
            'processed_images': [],
            'errors': []
        }
        
        for i, image_file in enumerate(image_files):
            try:
                # Validate image
                ImageService.validate_image(image_file)
                
                # Process image
                processed = ImageService.process_product_image(image_file)
                
                results['processed_images'].append({
                    'index': i,
                    'filename': image_file.name,
                    'processed': True,
                    'variants_created': len(processed) - 2  # Exclude dimensions info
                })
                
                results['success_count'] += 1
                
            except Exception as e:
                results['errors'].append({
                    'index': i,
                    'filename': image_file.name if hasattr(image_file, 'name') else f'Image {i}',
                    'error': str(e)
                })
                results['error_count'] += 1
        
        return results
    
    @staticmethod
    def cleanup_unused_images():
        """
        Clean up image files that are no longer referenced by any product
        """
        # This would scan the media directory and remove files not in the database
        # Implementation depends on your storage backend (local, S3, etc.)
        pass
    
    @staticmethod
    def optimize_existing_images():
        """
        Re-optimize existing product images (useful for batch optimization)
        """
        from ..models import ProductImage
        
        images = ProductImage.objects.all()
        results = {
            'processed': 0,
            'errors': 0,
            'skipped': 0
        }
        
        for product_image in images:
            try:
                if product_image.image and not product_image.thumbnail:
                    # Create missing thumbnail
                    product_image.create_thumbnail()
                    results['processed'] += 1
                else:
                    results['skipped'] += 1
                    
            except Exception as e:
                results['errors'] += 1
                print(f"Error processing image {product_image.id}: {e}")
        
        return results