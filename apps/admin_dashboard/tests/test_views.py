# apps/admin_dashboard/tests/test_views.py
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.admin_dashboard.models import HomepageContent, Banner, FeaturedProduct, SiteSettings
from apps.products.models import Product, Category

User = get_user_model()

class AdminDashboardViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create admin user
        self.admin_user = User.objects.create_user(
            email='admin@shoponline.com',
            password='testpass123',
            first_name='Admin',
            last_name='User',
            is_staff=True
        )
        
        # Create regular user
        self.regular_user = User.objects.create_user(
            email='user@gmail.com',
            password='testpass123',
            first_name='Regular',
            last_name='User'
        )

    def test_homepage_content_list_admin_access(self):
        """Test that admin can access homepage content list"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('admin_dashboard:homepage-content-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_homepage_content_list_regular_user_denied(self):
        """Test that regular user cannot access homepage content list"""
        self.client.force_authenticate(user=self.regular_user)
        url = reverse('admin_dashboard:homepage-content-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_homepage_content(self):
        """Test creating homepage content"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('admin_dashboard:homepage-content-list')
        
        data = {
            'title': 'New Homepage',
            'subtitle': 'New Subtitle',
            'hero_text': 'Welcome to our store',
            'is_active': True
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check that content was created with correct user
        content = HomepageContent.objects.get(title='New Homepage')
        self.assertEqual(content.updated_by, self.admin_user)

    def test_banner_active_endpoint(self):
        """Test active banners endpoint"""
        # Create test banner
        Banner.objects.create(
            title='Test Banner',
            banner_type='hero',
            is_active=True,
            created_by=self.admin_user
        )
        
        url = reverse('admin_dashboard:banners-active-banners')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Test Banner')

class DashboardAnalyticsViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        self.admin_user = User.objects.create_user(
            email='admin@shoponline.com',
            password='testpass123',
            is_staff=True
        )

    def test_analytics_overview_access(self):
        """Test analytics overview endpoint"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('admin_dashboard:analytics-overview')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('totals', response.data)
        self.assertIn('today', response.data)
        self.assertIn('month', response.data)
        self.assertIn('alerts', response.data)

    def test_sales_chart_endpoint(self):
        """Test sales chart data endpoint"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('admin_dashboard:analytics-sales-chart')
        response = self.client.get(url, {'period': '7days'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('period', response.data)
        self.assertIn('data', response.data)
