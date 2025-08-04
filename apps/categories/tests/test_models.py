# apps/categories/tests/test_models.py

from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from apps.categories.models import Category
from apps.accounts.models import User


class CategoryModelTest(TestCase):
    """
    Test cases for Category model
    """

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='admin@shoponline.com',
            password='testpass123',
            is_staff=True
        )

    def test_category_creation(self):
        """Test basic category creation"""
        category = Category.objects.create(
            name='Electronics',
            description='Electronic products and gadgets'
        )
        
        self.assertEqual(category.name, 'Electronics')
        self.assertEqual(category.slug, 'electronics')
        self.assertTrue(category.is_active)
        self.assertFalse(category.featured)
        self.assertEqual(category.sort_order, 0)

    def test_category_slug_auto_generation(self):
        """Test automatic slug generation"""
        category = Category.objects.create(name='Mobile Phones')
        self.assertEqual(category.slug, 'mobile-phones')

    def test_category_slug_uniqueness(self):
        """Test slug uniqueness when names are similar"""
        Category.objects.create(name='Electronics')
        category2 = Category.objects.create(name='Electronics')
        
        self.assertEqual(category2.slug, 'electronics-1')

    def test_category_name_validation(self):
        """Test category name validation"""
        # Test minimum length
        with self.assertRaises(ValidationError):
            category = Category(name='A')
            category.full_clean()

    def test_category_hierarchy(self):
        """Test category parent-child relationships"""
        parent = Category.objects.create(name='Electronics')
        child = Category.objects.create(name='Smartphones', parent=parent)
        
        self.assertEqual(child.parent, parent)
        self.assertIn(child, parent.subcategories.all())

    def test_circular_reference_prevention(self):
        """Test prevention of circular references"""
        category1 = Category.objects.create(name='Category 1')
        category2 = Category.objects.create(name='Category 2', parent=category1)
        
        # Try to make category1 a child of category2 (circular reference)
        category1.parent = category2
        with self.assertRaises(ValidationError):
            category1.full_clean()

    def test_self_parent_prevention(self):
        """Test prevention of self-referencing"""
        category = Category.objects.create(name='Test Category')
        category.parent = category
        
        with self.assertRaises(ValidationError):
            category.full_clean()

    def test_breadcrumb_trail(self):
        """Test breadcrumb trail generation"""
        parent = Category.objects.create(name='Electronics')
        child = Category.objects.create(name='Smartphones', parent=parent)
        grandchild = Category.objects.create(name='iPhone', parent=child)
        
        trail = grandchild.breadcrumb_trail
        self.assertEqual(len(trail), 3)
        self.assertEqual(trail[0], parent)
        self.assertEqual(trail[1], child)
        self.assertEqual(trail[2], grandchild)

    def test_descendant_ids(self):
        """Test getting descendant category IDs"""
        parent = Category.objects.create(name='Electronics')
        child1 = Category.objects.create(name='Smartphones', parent=parent)
        child2 = Category.objects.create(name='Laptops', parent=parent)
        grandchild = Category.objects.create(name='Gaming Laptops', parent=child2)
        
        descendant_ids = parent.get_descendant_ids()
        expected_ids = [child1.id, child2.id, grandchild.id]
        
        self.assertEqual(set(descendant_ids), set(expected_ids))

    def test_featured_categories_class_method(self):
        """Test getting featured categories"""
        Category.objects.create(name='Category 1', featured=True)
        Category.objects.create(name='Category 2', featured=False)
        Category.objects.create(name='Category 3', featured=True)
        
        featured = Category.get_featured_categories()
        self.assertEqual(featured.count(), 2)

    def test_root_categories_class_method(self):
        """Test getting root categories"""
        root1 = Category.objects.create(name='Electronics')
        root2 = Category.objects.create(name='Clothing')
        child = Category.objects.create(name='Smartphones', parent=root1)
        
        roots = Category.get_root_categories()
        self.assertEqual(roots.count(), 2)
        self.assertIn(root1, roots)
        self.assertIn(root2, roots)
        self.assertNotIn(child, roots)

    def test_can_be_deleted(self):
        """Test category deletion validation"""
        category = Category.objects.create(name='Test Category')
        
        # Category without products or subcategories can be deleted
        self.assertTrue(category.can_be_deleted())
        
        # Add subcategory
        subcategory = Category.objects.create(name='Subcategory', parent=category)
        self.assertFalse(category.can_be_deleted())

    def test_category_str_representation(self):
        """Test string representation of category"""
        category = Category.objects.create(name='Electronics')
        self.assertEqual(str(category), 'Electronics')

    def test_meta_title_auto_generation(self):
        """Test automatic meta title generation"""
        category = Category.objects.create(name='Electronics')
        self.assertEqual(category.meta_title, 'Electronics')
        
        # Test with custom meta title
        category_custom = Category.objects.create(
            name='Smartphones',
            meta_title='Best Smartphones Online'
        )
        self.assertEqual(category_custom.meta_title, 'Best Smartphones Online')

