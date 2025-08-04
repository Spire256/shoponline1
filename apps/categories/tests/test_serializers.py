# apps/categories/tests/test_serializers.py

from django.test import TestCase
from apps.categories.models import Category
from apps.categories.serializers import (
    CategorySerializer, CategoryDetailSerializer, CategoryListSerializer,
    CategoryCreateUpdateSerializer, CategoryBulkActionSerializer
)


class CategorySerializerTest(TestCase):
    """
    Test cases for Category serializers
    """

    def setUp(self):
        """Set up test data"""
        self.parent_category = Category.objects.create(
            name='Electronics',
            description='Electronic products'
        )
        
        self.child_category = Category.objects.create(
            name='Smartphones',
            description='Mobile phones and accessories',
            parent=self.parent_category
        )

    def test_category_serializer(self):
        """Test basic category serialization"""
        serializer = CategorySerializer(self.parent_category)
        data = serializer.data
        
        self.assertEqual(data['name'], 'Electronics')
        self.assertEqual(data['slug'], 'electronics')
        self.assertIn('breadcrumb_trail', data)
        self.assertIn('product_count', data)

    def test_category_detail_serializer(self):
        """Test detailed category serialization"""
        serializer = CategoryDetailSerializer(self.parent_category)
        data = serializer.data
        
        self.assertIn('subcategories', data)
        self.assertIn('featured_products', data)
        self.assertIn('all_products_count', data)

    def test_category_list_serializer(self):
        """Test category list serialization"""
        categories = Category.objects.all()
        serializer = CategoryListSerializer(categories, many=True)
        data = serializer.data
        
        self.assertEqual(len(data), 2)
        self.assertIn('image_url', data[0])

    def test_category_create_serializer_validation(self):
        """Test category creation validation"""
        # Test valid data
        valid_data = {
            'name': 'Books',
            'description': 'Books and literature'
        }
        serializer = CategoryCreateUpdateSerializer(data=valid_data)
        self.assertTrue(serializer.is_valid())

        # Test invalid data (name too short)
        invalid_data = {
            'name': 'A'
        }
        serializer = CategoryCreateUpdateSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_category_circular_reference_validation(self):
        """Test circular reference validation in serializer"""
        # Try to make parent a child of its own child
        data = {'parent': self.child_category.id}
        serializer = CategoryCreateUpdateSerializer(
            instance=self.parent_category,
            data=data,
            partial=True
        )
        self.assertFalse(serializer.is_valid())

    def test_bulk_action_serializer(self):
        """Test bulk action serializer"""
        data = {
            'category_ids': [str(self.parent_category.id), str(self.child_category.id)],
            'action': 'activate'
        }
        serializer = CategoryBulkActionSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        # Test with invalid action
        invalid_data = {
            'category_ids': [str(self.parent_category.id)],
            'action': 'invalid_action'
        }
        serializer = CategoryBulkActionSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())

    def test_breadcrumb_trail_serialization(self):
        """Test breadcrumb trail in serialization"""
        serializer = CategorySerializer(self.child_category)
        data = serializer.data
        
        breadcrumbs = data['breadcrumb_trail']
        self.assertEqual(len(breadcrumbs), 2)
        self.assertEqual(breadcrumbs[0]['name'], 'Electronics')
        self.assertEqual(breadcrumbs[1]['name'], 'Smartphones')
