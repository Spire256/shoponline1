
# apps/categories/tests/test_views.py

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.categories.models import Category
from apps.accounts.models import User
import json


class CategoryViewSetTest(TestCase):
    """
    Test cases for Category ViewSet
    """

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create users
        self.admin_user = User.objects.create_user(
            email='admin@shoponline.com',
            password='testpass123',
            is_staff=True
        )
        
        self.regular_user = User.objects.create_user(
            email='user@gmail.com',
            password='testpass123'
        )
        
        # Create test categories
        self.category1 = Category.objects.create(
            name='Electronics',
            description='Electronic products',
            featured=True
        )
        
        self.category2 = Category.objects.create(
            name='Clothing',
            description='Fashion and clothing',
            is_active=False
        )

    def test_list_categories_anonymous(self):
        """Test listing categories as anonymous user"""
        url = reverse('categories:category-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only see active categories
        self.assertEqual(len(response.data['results']), 1)

    def test_list_categories_admin(self):
        """Test listing categories as admin user"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('categories:category-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Admin should see all categories
        self.assertEqual(len(response.data['results']), 2)

    def test_create_category_admin(self):
        """Test creating category as admin"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('categories:category-list')
        
        data = {
            'name': 'Sports',
            'description': 'Sports equipment and gear',
            'featured': True
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Category.objects.count(), 3)

    def test_create_category_unauthorized(self):
        """Test creating category without authentication"""
        url = reverse('categories:category-list')
        data = {'name': 'Sports'}
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_category(self):
        """Test retrieving single category"""
        url = reverse('categories:category-detail', kwargs={'slug': self.category1.slug})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Electronics')

    def test_update_category_admin(self):
        """Test updating category as admin"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('categories:category-detail', kwargs={'slug': self.category1.slug})
        
        data = {
            'name': 'Electronics & Gadgets',
            'description': 'Updated description'
        }
        
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.category1.refresh_from_db()
        self.assertEqual(self.category1.name, 'Electronics & Gadgets')

    def test_delete_category_admin(self):
        """Test deleting category as admin"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('categories:category-detail', kwargs={'slug': self.category1.slug})
        
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Category.objects.count(), 1)

    def test_category_tree_endpoint(self):
        """Test category tree structure endpoint"""
        # Create hierarchy
        child = Category.objects.create(name='Smartphones', parent=self.category1)
        
        url = reverse('categories:category-tree')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(any(cat['name'] == 'Electronics' for cat in response.data))

    def test_featured_categories_endpoint(self):
        """Test featured categories endpoint"""
        url = reverse('categories:category-featured')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only return featured and active categories
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Electronics')

    def test_bulk_action_admin(self):
        """Test bulk actions as admin"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('categories:category-bulk-action')
        
        data = {
            'category_ids': [str(self.category1.id), str(self.category2.id)],
            'action': 'activate'
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check if categories were activated
        self.category2.refresh_from_db()
        self.assertTrue(self.category2.is_active)

    def test_search_categories(self):
        """Test category search functionality"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('categories:category-search')
        
        response = self.client.get(url, {'q': 'electronics'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_toggle_featured_admin(self):
        """Test toggling featured status"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('categories:category-toggle-featured', kwargs={'slug': self.category1.slug})
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.category1.refresh_from_db()
        self.assertFalse(self.category1.featured)  # Was True, now False

