# apps/flash_sales/tests/test_services.py
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from apps.accounts.models import User
from apps.products.models import Product, Category
from ..models import FlashSale, FlashSaleProduct
from ..services.flash_sale_service import FlashSaleService, FlashSaleValidationService
from ..services.timer_service import TimerService


class FlashSaleServiceTest(TestCase):
    """Test cases for FlashSaleService"""
    
    def setUp(self):
        """Set up test data"""
        self.admin_user = User.objects.create_user(
            email='admin@shoponline.com',
            password='testpass123',
            user_type='admin'
        )
        
        self.category = Category.objects.create(name="Test Category")
        self.product = Product.objects.create(
            name="Test Product",
            price=Decimal('50000.00'),
            category=self.category,
            stock_quantity=100
        )
    
    def test_get_active_flash_sales(self):
        """Test getting active flash sales"""
        # Create active flash sale
        active_sale = FlashSale.objects.create(
            name="Active Sale",
            discount_percentage=Decimal('20.00'),
            start_time=timezone.now() - timedelta(hours=1),
            end_time=timezone.now() + timedelta(hours=1),
            created_by=self.admin_user
        )
        
        # Create upcoming flash sale
        FlashSale.objects.create(
            name="Upcoming Sale",
            discount_percentage=Decimal('15.00'),
            start_time=timezone.now() + timedelta(hours=1),
            end_time=timezone.now() + timedelta(hours=25),
            created_by=self.admin_user
        )
        
        active_sales = FlashSaleService.get_active_flash_sales()
        self.assertEqual(len(active_sales), 1)
        self.assertEqual(active_sales[0].name, "Active Sale")
    
    def test_get_product_flash_sale_price(self):
        """Test getting product flash sale price"""
        # Create active flash sale with product
        flash_sale = FlashSale.objects.create(
            name="Test Sale",
            discount_percentage=Decimal('25.00'),
            start_time=timezone.now() - timedelta(hours=1),
            end_time=timezone.now() + timedelta(hours=1),
            created_by=self.admin_user
        )
        
        FlashSaleProduct.objects.create(
            flash_sale=flash_sale,
            product=self.product,
            added_by=self.admin_user
        )
        
        flash_sale_info = FlashSaleService.get_product_flash_sale_price(self.product)
        self.assertIsNotNone(flash_sale_info)
        self.assertEqual(flash_sale_info['flash_sale_price'], Decimal('37500.00'))  # 25% off
        self.assertEqual(flash_sale_info['discount_percentage'], Decimal('25.00'))


class TimerServiceTest(TestCase):
    """Test cases for TimerService"""
    
    def setUp(self):
        """Set up test data"""
        self.admin_user = User.objects.create_user(
            email='admin@shoponline.com',
            password='testpass123',
            user_type='admin'
        )
    
    def test_upcoming_flash_sale_timer(self):
        """Test timer for upcoming flash sale"""
        flash_sale = FlashSale.objects.create(
            name="Upcoming Sale",
            discount_percentage=Decimal('20.00'),
            start_time=timezone.now() + timedelta(hours=2),
            end_time=timezone.now() + timedelta(hours=26),
            created_by=self.admin_user
        )
        
        timer_data = TimerService.get_timer_data(flash_sale)
        self.assertEqual(timer_data['timer_type'], 'starts_in')
        self.assertGreater(timer_data['time_remaining'], 0)
    
    def test_active_flash_sale_timer(self):
        """Test timer for active flash sale"""
        flash_sale = FlashSale.objects.create(
            name="Active Sale",
            discount_percentage=Decimal('20.00'),
            start_time=timezone.now() - timedelta(hours=1),
            end_time=timezone.now() + timedelta(hours=1),
            created_by=self.admin_user
        )
        
        timer_data = TimerService.get_timer_data(flash_sale)
        self.assertEqual(timer_data['timer_type'], 'ends_in')
        self.assertGreater(timer_data['time_remaining'], 0)