# apps/admin_dashboard/tests/test_services.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from unittest.mock import patch, MagicMock
from apps.admin_dashboard.services.analytics_service import AnalyticsService
from apps.admin_dashboard.services.homepage_service import HomepageService
from apps.admin_dashboard.models import HomepageContent, Banner, FeaturedProduct
from apps.products.models import Product, Category

User = get_user_model()

class AnalyticsServiceTest(TestCase):
    def setUp(self):
        self.service = AnalyticsService()
        self.user = User.objects.create_user(
            email='admin@shoponline.com',
            password='testpass123'
        )

    @patch('apps.admin_dashboard.services.analytics_service.Order')
    @patch('apps.admin_dashboard.services.analytics_service.Product')
    @patch('apps.admin_dashboard.services.analytics_service.User')
    def test_dashboard_overview(self, mock_user, mock_product, mock_order):
        """Test dashboard overview analytics"""
        # Mock the queryset methods
        mock_order.objects.count.return_value = 100
        mock_order.objects.filter.return_value.count.return_value = 5
        mock_order.objects.filter.return_value.aggregate.return_value = {'total': 1000.00}
        
        mock_product.objects.filter.return_value.count.return_value = 50
        mock_user.objects.filter.return_value.count.return_value = 200
        
        result = self.service.get_dashboard_overview()
        
        self.assertIn('totals', result)
        self.assertIn('today', result)
        self.assertIn('month', result)
        self.assertIn('alerts', result)

class HomepageServiceTest(TestCase):
    def setUp(self):
        self.service = HomepageService()
        self.user = User.objects.create_user(
            email='admin@shoponline.com',
            password='testpass123'
        )

    def test_get_active_content(self):
        """Test getting active homepage content"""
        # Create active content
        content = HomepageContent.objects.create(
            title='Active Content',
            subtitle='Active Subtitle',
            is_active=True,
            updated_by=self.user
        )
        
        result = self.service.get_active_content()
        
        self.assertIsNotNone(result)
        self.assertEqual(result['title'], 'Active Content')
        self.assertEqual(result['subtitle'], 'Active Subtitle')

    def test_get_active_content_none_active(self):
        """Test getting active content when none exists"""
        result = self.service.get_active_content()
        self.assertIsNone(result)

    def test_get_active_banners(self):
        """Test getting active banners"""
        # Create active banner
        banner = Banner.objects.create(
            title='Active Banner',
            banner_type='hero',
            is_active=True,
            created_by=self.user
        )
        
        result = self.service.get_active_banners('hero')
        
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['title'], 'Active Banner')
        self.assertEqual(result[0]['banner_type'], 'hero')

    def test_get_hero_banner(self):
        """Test getting hero banner"""
        # Create hero banner
        Banner.objects.create(
            title='Hero Banner',
            banner_type='hero',
            is_active=True,
            order=1,
            created_by=self.user
        )
        
        result = self.service.get_hero_banner()
        
        self.assertIsNotNone(result)
        self.assertEqual(result['title'], 'Hero Banner')
