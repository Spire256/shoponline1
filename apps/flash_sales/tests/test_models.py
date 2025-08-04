# apps/flash_sales/tests/test_models.py
from django.test import TestCase
from django.utils import timezone
from django.core.exceptions import ValidationError
from datetime import timedelta
from decimal import Decimal
from apps.accounts.models import User
from apps.products.models import Product, Category
from ..models import FlashSale, FlashSaleProduct


class FlashSaleModelTest(TestCase):
    """Test cases for FlashSale model"""
    
    def setUp(self):
        """Set up test data"""
        self.admin_user = User.objects.create_user(
            email='admin@shoponline.com',
            password='testpass123',
            first_name='Admin',
            last_name='User',
            user_type='admin'
        )
        
        self.start_time = timezone.now() + timedelta(hours=1)
        self.end_time = timezone.now() + timedelta(hours=25)
    
    def test_create_flash_sale(self):
        """Test creating a flash sale"""
        flash_sale = FlashSale.objects.create(
            name="Test Flash Sale",
            description="Test description",
            discount_percentage=Decimal('20.00'),
            start_time=self.start_time,
            end_time=self.end_time,
            created_by=self.admin_user
        )
        
        self.assertEqual(flash_sale.name, "Test Flash Sale")
        self.assertEqual(flash_sale.discount_percentage, Decimal('20.00'))
        self.assertTrue(flash_sale.is_upcoming)
        self.assertFalse(flash_sale.is_running)
        self.assertFalse(flash_sale.is_expired)
    
    def test_flash_sale_validation(self):
        """Test flash sale validation"""
        # Test invalid timing
        with self.assertRaises(ValidationError):
            flash_sale = FlashSale(
                name="Invalid Flash Sale",
                discount_percentage=Decimal('20.00'),
                start_time=timezone.now() + timedelta(hours=2),
                end_time=timezone.now() + timedelta(hours=1),  # End before start
                created_by=self.admin_user
            )
            flash_sale.full_clean()
    
    def test_flash_sale_status_properties(self):
        """Test flash sale status properties"""
        # Test upcoming
        upcoming_sale = FlashSale.objects.create(
            name="Upcoming Sale",
            discount_percentage=Decimal('15.00'),
            start_time=timezone.now() + timedelta(hours=1),
            end_time=timezone.now() + timedelta(hours=25),
            created_by=self.admin_user
        )
        self.assertTrue(upcoming_sale.is_upcoming)
        
        # Test running
        running_sale = FlashSale.objects.create(
            name="Running Sale",
            discount_percentage=Decimal('25.00'),
            start_time=timezone.now() - timedelta(hours=1),
            end_time=timezone.now() + timedelta(hours=1),
            created_by=self.admin_user
        )
        self.assertTrue(running_sale.is_running)
        
        # Test expired
        expired_sale = FlashSale.objects.create(
            name="Expired Sale",
            discount_percentage=Decimal('30.00'),
            start_time=timezone.now() - timedelta(hours=2),
            end_time=timezone.now() - timedelta(hours=1),
            created_by=self.admin_user
        )
        self.assertTrue(expired_sale.is_expired)


class FlashSaleProductModelTest(TestCase):
    """Test cases for FlashSaleProduct model"""
    
    def setUp(self):
        """Set up test data"""
        self.admin_user = User.objects.create_user(
            email='admin@shoponline.com',
            password='testpass123',
            first_name='Admin',
            last_name='User',
            user_type='admin'
        )
        
        self.category = Category.objects.create(
            name="Test Category",
            description="Test category"
        )
        
        self.product = Product.objects.create(
            name="Test Product",
            description="Test product description",
            price=Decimal('100000.00'),  # UGX 100,000
            category=self.category,
            stock_quantity=50
        )
        
        self.flash_sale = FlashSale.objects.create(
            name="Test Flash Sale",
            discount_percentage=Decimal('20.00'),
            start_time=timezone.now() + timedelta(hours=1),
            end_time=timezone.now() + timedelta(hours=25),
            created_by=self.admin_user
        )
    
    def test_create_flash_sale_product(self):
        """Test creating a flash sale product"""
        flash_sale_product = FlashSaleProduct.objects.create(
            flash_sale=self.flash_sale,
            product=self.product,
            added_by=self.admin_user
        )
        
        self.assertEqual(flash_sale_product.original_price, self.product.price)
        self.assertEqual(flash_sale_product.flash_sale_price, Decimal('80000.00'))  # 20% off
        self.assertEqual(flash_sale_product.discount_percentage, Decimal('20.00'))
        self.assertEqual(flash_sale_product.savings_amount, Decimal('20000.00'))
    
    def test_custom_discount_percentage(self):
        """Test custom discount percentage for specific product"""
        flash_sale_product = FlashSaleProduct.objects.create(
            flash_sale=self.flash_sale,
            product=self.product,
            custom_discount_percentage=Decimal('30.00'),  # Higher than flash sale discount
            added_by=self.admin_user
        )
        
        self.assertEqual(flash_sale_product.discount_percentage, Decimal('30.00'))
        self.assertEqual(flash_sale_product.flash_sale_price, Decimal('70000.00'))  # 30% off
    
    def test_stock_limit_functionality(self):
        """Test stock limit functionality"""
        flash_sale_product = FlashSaleProduct.objects.create(
            flash_sale=self.flash_sale,
            product=self.product,
            stock_limit=10,
            added_by=self.admin_user
        )
        
        # Test not sold out initially
        self.assertFalse(flash_sale_product.is_sold_out)
        
        # Simulate sales
        flash_sale_product.sold_quantity = 10
        flash_sale_product.save()
        
        # Test sold out
        self.assertTrue(flash_sale_product.is_sold_out)
