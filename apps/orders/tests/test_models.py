# apps/orders/tests/test_models.py

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone

from ..models import Order, OrderItem, OrderStatusHistory, OrderNote, CODVerification
from apps.products.models import Product, Category

User = get_user_model()


class OrderModelTest(TestCase):
    """Test cases for Order model"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='customer@gmail.com',
            password='testpass123',
            first_name='John',
            last_name='Doe'
        )
        
        self.category = Category.objects.create(
            name='Electronics',
            slug='electronics'
        )
        
        self.product = Product.objects.create(
            name='Test Product',
            slug='test-product',
            category=self.category,
            price=Decimal('50000.00'),
            stock_quantity=10,
            is_active=True
        )
        
        self.order_data = {
            'user': self.user,
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'customer@gmail.com',
            'phone': '256712345678',
            'address_line_1': 'Plot 123 Main Street',
            'city': 'Kampala',
            'district': 'Kampala',
            'payment_method': 'mtn_momo',
            'subtotal': Decimal('50000.00'),
            'total_amount': Decimal('50000.00')
        }
    
    def test_order_creation(self):
        """Test order creation with valid data"""
        order = Order.objects.create(**self.order_data)
        
        self.assertIsNotNone(order.id)
        self.assertTrue(order.order_number.startswith('SHO'))
        self.assertEqual(order.status, 'pending')
        self.assertEqual(order.payment_status, 'pending')
        self.assertFalse(order.is_cash_on_delivery)
    
    def test_order_number_generation(self):
        """Test unique order number generation"""
        order1 = Order.objects.create(**self.order_data)
        order2 = Order.objects.create(**self.order_data)
        
        self.assertNotEqual(order1.order_number, order2.order_number)
        self.assertTrue(order1.order_number.startswith('SHO'))
        self.assertTrue(order2.order_number.startswith('SHO'))
    
    def test_cod_order_creation(self):
        """Test cash on delivery order creation"""
        self.order_data['payment_method'] = 'cash_on_delivery'
        order = Order.objects.create(**self.order_data)
        
        self.assertTrue(order.is_cash_on_delivery)
    
    def test_order_str_method(self):
        """Test order string representation"""
        order = Order.objects.create(**self.order_data)
        expected = f"Order {order.order_number} - John Doe"
        self.assertEqual(str(order), expected)
    
    def test_get_customer_name(self):
        """Test get_customer_name method"""
        order = Order.objects.create(**self.order_data)
        self.assertEqual(order.get_customer_name(), 'John Doe')
    
    def test_get_delivery_address(self):
        """Test get_delivery_address method"""
        order = Order.objects.create(**self.order_data)
        expected = 'Plot 123 Main Street, Kampala, Kampala'
        self.assertEqual(order.get_delivery_address(), expected)
    
    def test_can_be_cancelled(self):
        """Test can_be_cancelled method"""
        order = Order.objects.create(**self.order_data)
        
        # Pending order can be cancelled
        self.assertTrue(order.can_be_cancelled())
        
        # Delivered order cannot be cancelled
        order.status = 'delivered'
        self.assertFalse(order.can_be_cancelled())
    
    def test_mark_as_confirmed(self):
        """Test mark_as_confirmed method"""
        order = Order.objects.create(**self.order_data)
        order.mark_as_confirmed()
        
        self.assertEqual(order.status, 'confirmed')
        self.assertIsNotNone(order.confirmed_at)
    
    def test_mark_as_delivered(self):
        """Test mark_as_delivered method"""
        order = Order.objects.create(**self.order_data)
        order.mark_as_delivered()
        
        self.assertEqual(order.status, 'delivered')
        self.assertIsNotNone(order.delivered_at)
    
    def test_cancel_order(self):
        """Test cancel_order method"""
        order = Order.objects.create(**self.order_data)
        reason = "Customer requested cancellation"
        order.cancel_order(reason)
        
        self.assertEqual(order.status, 'cancelled')
        self.assertIsNotNone(order.cancelled_at)
        self.assertIn(reason, order.admin_notes)


class OrderItemModelTest(TestCase):
    """Test cases for OrderItem model"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='customer@gmail.com',
            password='testpass123'
        )
        
        self.category = Category.objects.create(
            name='Electronics',
            slug='electronics'
        )
        
        self.product = Product.objects.create(
            name='Test Product',
            slug='test-product',
            category=self.category,
            price=Decimal('50000.00'),
            stock_quantity=10,
            is_active=True
        )
        
        self.order = Order.objects.create(
            user=self.user,
            first_name='John',
            last_name='Doe',
            email='customer@gmail.com',
            phone='256712345678',
            address_line_1='Plot 123 Main Street',
            city='Kampala',
            district='Kampala',
            payment_method='mtn_momo',
            subtotal=Decimal('100000.00'),
            total_amount=Decimal('100000.00')
        )
    
    def test_order_item_creation(self):
        """Test order item creation"""
        item = OrderItem.objects.create(
            order=self.order,
            product_id=self.product.id,
            product_name=self.product.name,
            unit_price=self.product.price,
            quantity=2
        )
        
        self.assertEqual(item.total_price, Decimal('100000.00'))
        self.assertFalse(item.is_flash_sale_item)
    
    def test_order_item_total_calculation(self):
        """Test total price calculation"""
        item = OrderItem.objects.create(
            order=self.order,
            product_id=self.product.id,
            product_name=self.product.name,
            unit_price=Decimal('25000.00'),
            quantity=3
        )
        
        self.assertEqual(item.total_price, Decimal('75000.00'))
    
    def test_flash_sale_item(self):
        """Test flash sale item creation"""
        item = OrderItem.objects.create(
            order=self.order,
            product_id=self.product.id,
            product_name=self.product.name,
            unit_price=Decimal('40000.00'),
            quantity=1,
            is_flash_sale_item=True,
            original_price=Decimal('50000.00'),
            flash_sale_discount=20
        )
        
        self.assertTrue(item.is_flash_sale_item)
        self.assertEqual(item.flash_sale_savings, Decimal('10000.00'))


class CODVerificationModelTest(TestCase):
    """Test cases for CODVerification model"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='customer@gmail.com',
            password='testpass123'
        )
        
        self.admin = User.objects.create_user(
            email='admin@shoponline.com',
            password='adminpass123',
            is_admin=True
        )
        
        self.order = Order.objects.create(
            user=self.user,
            first_name='John',
            last_name='Doe',
            email='customer@gmail.com',
            phone='256712345678',
            address_line_1='Plot 123 Main Street',
            city='Kampala',
            district='Kampala',
            payment_method='cash_on_delivery',
            subtotal=Decimal('50000.00'),
            total_amount=Decimal('50000.00')
        )
    
    def test_cod_verification_creation(self):
        """Test COD verification creation"""
        verification = CODVerification.objects.create(order=self.order)
        
        self.assertEqual(verification.verification_status, 'pending')
        self.assertFalse(verification.customer_phone_verified)
        self.assertFalse(verification.delivery_confirmed)
        self.assertFalse(verification.payment_received)
    
    def test_mark_as_verified(self):
        """Test mark_as_verified method"""
        verification = CODVerification.objects.create(order=self.order)
        notes = "Customer phone verified, address confirmed"
        
        verification.mark_as_verified(self.admin, notes)
        
        self.assertEqual(verification.verification_status, 'verified')
        self.assertEqual(verification.verified_by, self.admin)
        self.assertEqual(verification.verification_notes, notes)
        self.assertIsNotNone(verification.verification_date)
        
        # Check that order is marked as verified
        self.order.refresh_from_db()
        self.assertTrue(self.order.cod_verified)
    
    def test_mark_as_delivered_and_paid(self):
        """Test mark_as_delivered_and_paid method"""
        verification = CODVerification.objects.create(order=self.order)
        verification.mark_as_delivered_and_paid()
        
        self.assertEqual(verification.verification_status, 'delivered_paid')
        self.assertTrue(verification.delivery_confirmed)
        self.assertTrue(verification.payment_received)
        
        # Check that order is marked as delivered
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'delivered')

