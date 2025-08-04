# apps/admin_dashboard/tests/test_utils.py
from django.test import TestCase
from django.core.cache import cache
from django.contrib.auth import get_user_model
from apps.admin_dashboard.models import HomepageContent, Banner
from apps.admin_dashboard.utils import (
    get_cached_homepage_content, get_cached_active_banners,
    clear_all_dashboard_cache, validate_banner_dates
)
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

class UtilsTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='admin@shoponline.com',
            password='testpass123'
        )
        cache.clear()

    def test_get_cached_homepage_content(self):
        """Test getting cached homepage content"""
        # Create content
        content = HomepageContent.objects.create(
            title='Test Content',
            is_active=True,
            updated_by=self.user
        )
        
        # First call should hit database and cache result
        result1 = get_cached_homepage_content()
        self.assertEqual(result1.title, 'Test Content')
        
        # Second call should use cache
        result2 = get_cached_homepage_content()
        self.assertEqual(result2.title, 'Test Content')

    def test_get_cached_active_banners(self):
        """Test getting cached active banners"""
        # Create banner
        Banner.objects.create(
            title='Test Banner',
            banner_type='hero',
            is_active=True,
            created_by=self.user
        )
        
        # First call should hit database and cache result
        result1 = get_cached_active_banners('hero')
        self.assertEqual(len(result1), 1)
        self.assertEqual(result1[0].title, 'Test Banner')

    def test_clear_all_dashboard_cache(self):
        """Test clearing all dashboard cache"""
        # Set some cache values
        cache.set('homepage_content_active', 'test')
        cache.set('banners_active_all', 'test')
        
        # Clear cache
        clear_all_dashboard_cache()
        
        # Verify cache is cleared
        self.assertIsNone(cache.get('homepage_content_active'))
        self.assertIsNone(cache.get('banners_active_all'))

    def test_validate_banner_dates_valid(self):
        """Test banner date validation with valid dates"""
        start_date = timezone.now() + timedelta(hours=1)
        end_date = timezone.now() + timedelta(days=1)
        
        # Should not raise any exception
        try:
            validate_banner_dates(start_date, end_date)
        except ValueError:
            self.fail("validate_banner_dates raised ValueError with valid dates")

    def test_validate_banner_dates_invalid_order(self):
        """Test banner date validation with invalid date order"""
        start_date = timezone.now() + timedelta(days=1)
        end_date = timezone.now() + timedelta(hours=1)
        
        with self.assertRaises(ValueError) as context:
            validate_banner_dates(start_date, end_date)
        
        self.assertIn("Start date must be before end date", str(context.exception))

    def test_validate_banner_dates_past_start(self):
        """Test banner date validation with past start date"""
        start_date = timezone.now() - timedelta(hours=1)
        end_date = timezone.now() + timedelta(days=1)
        
        with self.assertRaises(ValueError) as context:
            validate_banner_dates(start_date, end_date)
        
        self.assertIn("Start date cannot be in the past", str(context.exception))
                