
# apps/categories/tests/test_utils.py

from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from apps.categories.models import Category
from apps.categories.utils import (
    generate_category_slug, validate_category_image,
    get_category_tree_data, validate_category_hierarchy
)
from PIL import Image
from io import BytesIO


class CategoryUtilsTest(TestCase):
    """
    Test cases for Category utilities
    """

    def test_generate_category_slug(self):
        """Test slug generation utility"""
        slug = generate_category_slug('Electronics & Gadgets')
        self.assertEqual(slug, 'electronics-gadgets')
        
        # Test uniqueness
        Category.objects.create(name='Electronics', slug='electronics')
        slug = generate_category_slug('Electronics')
        self.assertEqual(slug, 'electronics-1')

    def test_validate_category_image(self):
        """Test image validation utility"""
        # Create a test image
        image = Image.new('RGB', (300, 300), color='red')
        image_file = BytesIO()
        image.save(image_file, format='JPEG')
        image_file.seek(0)
        
        uploaded_file = SimpleUploadedFile(
            "test.jpg",
            image_file.getvalue(),
            content_type="image/jpeg"
        )
        
        # Should pass validation
        self.assertTrue(validate_category_image(uploaded_file))

    def test_validate_category_image_invalid_size(self):
        """Test image validation with invalid dimensions"""
        # Create a small image (below minimum)
        image = Image.new('RGB', (100, 100), color='red')
        image_file = BytesIO()
        image.save(image_file, format='JPEG')
        image_file.seek(0)
        
        uploaded_file = SimpleUploadedFile(
            "test.jpg",
            image_file.getvalue(),
            content_type="image/jpeg"
        )
        
        # Should fail validation
        with self.assertRaises(ValidationError):
            validate_category_image(uploaded_file)

    def test_get_category_tree_data(self):
        """Test category tree data generation"""
        parent = Category.objects.create(name='Electronics')
        child1 = Category.objects.create(name='Smartphones', parent=parent)
        child2 = Category.objects.create(name='Laptops', parent=parent)
        
        tree_data = get_category_tree_data()
        
        self.assertEqual(len(tree_data), 1)  # One root category
        self.assertEqual(tree_data[0]['name'], 'Electronics')
        self.assertEqual(len(tree_data[0]['children']), 2)

    def test_validate_category_hierarchy(self):
        """Test category hierarchy validation"""
        parent = Category.objects.create(name='Electronics')
        child = Category.objects.create(name='Smartphones', parent=parent)
        
        # Valid hierarchy
        self.assertTrue(validate_category_hierarchy(child, parent))
        
        # Invalid hierarchy (circular reference)
        with self.assertRaises(ValidationError):
            validate_category_hierarchy(parent, child)
        
        # Invalid hierarchy (self-reference)
        with self.assertRaises(ValidationError):
            validate_category_hierarchy(parent, parent)