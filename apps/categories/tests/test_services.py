# apps/categories/tests/test_services.py

from django.test import TestCase
from django.core.exceptions import ValidationError
from apps.categories.models import Category
from apps.categories.services.category_service import CategoryService
from apps.accounts.models import User


class CategoryServiceTest(TestCase):
    """
    Test cases for Category service
    """

    def setUp(self):
        """Set up test data"""
        self.admin_user = User.objects.create_user(
            email='admin@shoponline.com',
            password='testpass123',
            is_staff=True
        )

    def test_create_category_service(self):
        """Test category creation through service"""
        category_data = {
            'name': 'Electronics',
            'description': 'Electronic products and gadgets',
            'featured': True
        }
        
        category = CategoryService.create_category(
            user=self.admin_user,
            **category_data
        )
        
        self.assertEqual(category.name, 'Electronics')
        self.assertTrue(category.featured)

    def test_update_category_service(self):
        """Test category update through service"""
        category = Category.objects.create(name='Electronics')
        
        updated_category = CategoryService.update_category(
            category=category,
            user=self.admin_user,
            name='Electronics & Gadgets',
            description='Updated description'
        )
        
        self.assertEqual(updated_category.name, 'Electronics & Gadgets')
        self.assertEqual(updated_category.description, 'Updated description')

    def test_delete_category_service(self):
        """Test category deletion through service"""
        category = Category.objects.create(name='Test Category')
        
        CategoryService.delete_category(category, self.admin_user)
        
        self.assertFalse(Category.objects.filter(id=category.id).exists())

    def test_bulk_action_service(self):
        """Test bulk actions through service"""
        category1 = Category.objects.create(name='Category 1', is_active=False)
        category2 = Category.objects.create(name='Category 2', is_active=False)
        
        result = CategoryService.bulk_action(
            category_ids=[category1.id, category2.id],
            action='activate',
            user=self.admin_user
        )
        
        self.assertTrue(result['success'])
        self.assertEqual(result['updated_count'], 2)
        
        # Check if categories were activated
        category1.refresh_from_db()
        category2.refresh_from_db()
        self.assertTrue(category1.is_active)
        self.assertTrue(category2.is_active)

    def test_search_categories_service(self):
        """Test category search through service"""
        Category.objects.create(name='Electronics', description='Electronic products')
        Category.objects.create(name='Clothing', description='Fashion items')
        Category.objects.create(name='Electronic Books', description='Digital books')
        
        # Search by name
        results = CategoryService.search_categories(q='electronic')
        self.assertEqual(results.count(), 2)
        
        # Search with filters
        results = CategoryService.search_categories(featured=False)
        self.assertEqual(results.count(), 3)

    def test_category_stats_service(self):
        """Test category statistics through service"""
        Category.objects.create(name='Electronics', featured=True)
        Category.objects.create(name='Clothing', is_active=False)
        
        stats = CategoryService.get_category_stats()
        
        self.assertIn('overview', stats)
        self.assertIn('structure', stats)
        self.assertEqual(stats['overview']['total_categories'], 2)
        self.assertEqual(stats['overview']['featured_categories'], 1)

    def test_validate_category_move(self):
        """Test category move validation"""
        parent = Category.objects.create(name='Electronics')
        child = Category.objects.create(name='Smartphones', parent=parent)
        
        # Valid move
        is_valid, message = CategoryService.validate_category_move(child, None)
        self.assertTrue(is_valid)
        
        # Invalid move (circular reference)
        is_valid, message = CategoryService.validate_category_move(parent, child)
        self.assertFalse(is_valid)
        self.assertIn('circular', message)
