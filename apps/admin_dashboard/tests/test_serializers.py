
# apps/admin_dashboard/tests/test_serializers.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.admin_dashboard.models import HomepageContent, Banner, SiteSettings
from apps.admin_dashboard.serializers import (
    HomepageContentSerializer, BannerSerializer, SiteSettingsSerializer
)

User = get_user_model()

class HomepageContentSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='admin@shoponline.com',
            password='testpass123',
            first_name='Admin',
            last_name='User'
        )

    def test_homepage_content_serialization(self):
        """Test homepage content serialization"""
        content = HomepageContent.objects.create(
            title='Test Homepage',
            subtitle='Test Subtitle',
            updated_by=self.user
        )
        
        serializer = HomepageContentSerializer(content)
        data = serializer.data
        
        self.assertEqual(data['title'], 'Test Homepage')
        self.assertEqual(data['subtitle'], 'Test Subtitle')
        self.assertEqual(data['updated_by_name'], 'Admin User')

    def test_homepage_content_deserialization(self):
        """Test homepage content deserialization"""
        data = {
            'title': 'New Homepage',
            'subtitle': 'New Subtitle',
            'hero_text': 'Welcome',
            'is_active': True
        }
        
        serializer = HomepageContentSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        
        content = serializer.save(updated_by=self.user)
        self.assertEqual(content.title, 'New Homepage')
        self.assertEqual(content.updated_by, self.user)

class BannerSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='admin@shoponline.com',
            password='testpass123',
            first_name='Admin',
            last_name='User'
        )

    def test_banner_serialization(self):
        """Test banner serialization"""
        banner = Banner.objects.create(
            title='Test Banner',
            banner_type='hero',
            created_by=self.user
        )
        
        serializer = BannerSerializer(banner)
        data = serializer.data
        
        self.assertEqual(data['title'], 'Test Banner')
        self.assertEqual(data['banner_type'], 'hero')
        self.assertEqual(data['banner_type_display'], 'Hero Banner')
        self.assertEqual(data['created_by_name'], 'Admin User')
