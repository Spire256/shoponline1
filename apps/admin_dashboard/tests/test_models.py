# apps/admin_dashboard/tests/test_models.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta
from apps.admin_dashboard.models import HomepageContent, Banner, FeaturedProduct, SiteSettings
from apps.products.models import Product, Category

User = get_user_model()

class HomepageContentModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='admin@shoponline.com',
            password='testpass123',
            first_name='Admin',
            last_name='User'
        )

    def test_homepage_content_creation(self):
        """Test homepage content model creation"""
        content = HomepageContent.objects.create(
            title='Test Homepage',
            subtitle='Test Subtitle',
            hero_text='Welcome to our store',
            updated_by=self.user
        )
        
        self.assertEqual(content.title, 'Test Homepage')
        self.assertEqual(content.subtitle, 'Test Subtitle')
        self.assertTrue(content.is_active)
        self.assertEqual(content.updated_by, self.user)

    def test_homepage_content_str_method(self):
        """Test string representation"""
        content = HomepageContent.objects.create(
            title='Test Homepage',
            updated_by=self.user
        )
        
        self.assertEqual(str(content), 'Homepage Content - Test Homepage')

class BannerModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='admin@shoponline.com',
            password='testpass123',
            first_name='Admin',
            last_name='User'
        )

    def test_banner_creation(self):
        """Test banner model creation"""
        banner = Banner.objects.create(
            title='Test Banner',
            description='Test Description',
            banner_type='hero',
            link_url='https://example.com',
            link_text='Click Here',
            created_by=self.user
        )
        
        self.assertEqual(banner.title, 'Test Banner')
        self.assertEqual(banner.banner_type, 'hero')
        self.assertTrue(banner.is_active)
        self.assertEqual(banner.created_by, self.user)

    def test_banner_str_method(self):
        """Test string representation"""
        banner = Banner.objects.create(
            title='Test Banner',
            banner_type='promo',
            created_by=self.user
        )
        
        self.assertEqual(str(banner), 'Promotional Banner - Test Banner')

    def test_banner_ordering(self):
        """Test banner ordering"""
        banner1 = Banner.objects.create(
            title='Banner 1',
            order=2,
            created_by=self.user
        )
        banner2 = Banner.objects.create(
            title='Banner 2',
            order=1,
            created_by=self.user
        )
        
        banners = list(Banner.objects.all())
        self.assertEqual(banners[0], banner2)  # Lower order comes first
        self.assertEqual(banners[1], banner1)

class FeaturedProductModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='admin@shoponline.com',
            password='testpass123',
            first_name='Admin',
            last_name='User'
        )
        
        self.category = Category.objects.create(
            name='Test Category',
            slug='test-category'
        )
        
        self.product = Product.objects.create(
            name='Test Product',
            slug='test-product',
            description='Test Description',
            price=100.00,
            category=self.category,
            stock_quantity=10
        )

    def test_featured_product_creation(self):
        """Test featured product model creation"""
        featured = FeaturedProduct.objects.create(
            product=self.product,
            order=1,
            created_by=self.user
        )
        
        self.assertEqual(featured.product, self.product)
        self.assertEqual(featured.order, 1)
        self.assertTrue(featured.is_active)
        self.assertEqual(featured.created_by, self.user)

    def test_featured_product_str_method(self):
        """Test string representation"""
        featured = FeaturedProduct.objects.create(
            product=self.product,
            created_by=self.user
        )
        
        self.assertEqual(str(featured), 'Featured: Test Product')

    def test_unique_together_constraint(self):
        """Test unique together constraint for product and is_active"""
        FeaturedProduct.objects.create(
            product=self.product,
            is_active=True,
            created_by=self.user
        )
        
        # This should raise an IntegrityError due to unique_together constraint
        with self.assertRaises(Exception):
            FeaturedProduct.objects.create(
                product=self.product,
                is_active=True,
                created_by=self.user
            )

class SiteSettingsModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='admin@shoponline.com',
            password='testpass123',
            first_name='Admin',
            last_name='User'
        )

    def test_site_settings_creation(self):
        """Test site settings model creation"""
        settings = SiteSettings.objects.create(
            site_name='Test Shop',
            contact_email='test@example.com',
            updated_by=self.user
        )
        
        self.assertEqual(settings.site_name, 'Test Shop')
        self.assertEqual(settings.contact_email, 'test@example.com')
        self.assertTrue(settings.enable_flash_sales)
        self.assertTrue(settings.enable_cod)

    def test_site_settings_str_method(self):
        """Test string representation"""
        settings = SiteSettings.objects.create(
            site_name='Test Shop',
            updated_by=self.user
        )
        
        self.assertEqual(str(settings), 'Site Settings - Test Shop')

    def test_single_instance_constraint(self):
        """Test that only one SiteSettings instance can exist"""
        SiteSettings.objects.create(
            site_name='First Settings',
            updated_by=self.user
        )
        
        # This should raise a ValueError
        with self.assertRaises(ValueError):
            SiteSettings.objects.create(
                site_name='Second Settings',
                updated_by=self.user
            )