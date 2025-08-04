
# apps/orders/tests/test_services.py

from django.test import TestCase
from django.contrib.auth import get_user_model
from decimal import Decimal
from unittest.mock import patch, MagicMock

from ..services.order_service import OrderService
from ..services.notification_service import OrderNotificationService
from ..models import Order, OrderItem
from apps.products.models import Product, Category

User = get_user_model()


class OrderServiceTest(TestCase):
    """Test cases for OrderService"""
    
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
        
        self.items_data = [
            {
                'product_id': str(self.product.id),
                'quantity': 2
            }
        ]
        
        self.order_data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'customer@gmail.com',
            'phone': '256712345678',
            'address_line_1': 'Plot 123 Main Street',
            'city': 'Kampala',
            'district': 'Kampala',
            'payment_method': 'mtn_momo'
        }
    
    def test_calculate_order_totals(self):
        """Test order totals calculation"""
        totals = OrderService.calculate_order_totals(self.items_data)
        
        self.assertEqual(totals['subtotal'], Decimal('100000.00'))
        self.assertEqual(totals['delivery_fee'], Decimal('0.00'))  # Free delivery over 100k
        self.assertEqual(totals['total_amount'], Decimal('100000.00'))
        self.assertFalse(totals['has_flash_sale_items'])
        self.assertEqual(totals['flash_sale_savings'], Decimal('0.00'))
    
    def test_calculate_delivery_fee(self):
        """Test delivery fee calculation"""
        # Small order should have delivery fee
        small_subtotal = Decimal('50000.00')
        fee = OrderService._calculate_delivery_fee(small_subtotal)
        self.assertEqual(fee, Decimal('5000.00'))
        
        # Large order should have free delivery
        large_subtotal = Decimal('150000.00')
        fee = OrderService._calculate_delivery_fee(large_subtotal)
        self.assertEqual(fee, Decimal('0.00'))
    
    def test_validate_order_items_valid(self):
        """Test validation of valid order items"""
        errors = OrderService.validate_order_items(self.items_data)
        self.assertEqual(errors, [])
    
    def test_validate_order_items_insufficient_stock(self):
        """Test validation with insufficient stock"""
        items_data = [
            {
                'product_id': str(self.product.id),
                'quantity': 20  # More than available
            }
        ]
        
        errors = OrderService.validate_order_items(items_data)
        self.assertTrue(len(errors) > 0)
        self.assertIn('Insufficient stock', errors[0])
    
    def test_validate_order_items_invalid_product(self):
        """Test validation with invalid product"""
        items_data = [
            {
                'product_id': '550e8400-e29b-41d4-a716-446655440000',  # Non-existent
                'quantity': 1
            }
        ]
        
        errors = OrderService.validate_order_items(items_data)
        self.assertTrue(len(errors) > 0)
        self.assertIn('Product not found', errors[0])
    
    @patch('apps.orders.services.order_service.OrderNotificationService')
    def test_create_order_with_items(self, mock_notification_service):
        """Test creating order with items"""
        mock_notification = MagicMock()
        mock_notification_service.return_value = mock_notification
        
        order = OrderService.create_order_with_items(
            self.order_data, 
            self.items_data, 
            self.user
        )
        
        self.assertIsInstance(order, Order)
        self.assertEqual(order.user, self.user)
        self.assertEqual(order.items.count(), 1)
        
        # Check stock reduction
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 8)
        
        # Check notifications were called
        mock_notification.send_order_confirmation.assert_called_once()
    
    def test_update_order_status(self):
        """Test updating order status"""
        order = Order.objects.create(
            user=self.user,
            **self.order_data,
            subtotal=Decimal('100000.00'),
            total_amount=Decimal('100000.00')
        )
        
        admin = User.objects.create_user(
            email='admin@shoponline.com',
            password='adminpass123',
            is_admin=True
        )
        
        updated_order = OrderService.update_order_status(
            order, 'confirmed', admin, 'Order confirmed by admin'
        )
        
        self.assertEqual(updated_order.status, 'confirmed')
        self.assertIsNotNone(updated_order.confirmed_at)
        self.assertEqual(updated_order.status_history.count(), 1)
    
    def test_cancel_order(self):
        """Test cancelling order"""
        order = Order.objects.create(
            user=self.user,
            **self.order_data,
            subtotal=Decimal('100000.00'),
            total_amount=Decimal('100000.00')
        )
        
        # Create order item to test stock restoration
        OrderItem.objects.create(
            order=order,
            product_id=self.product.id,
            product_name=self.product.name,
            unit_price=self.product.price,
            quantity=2
        )
        
        # Reduce stock to simulate order creation
        self.product.stock_quantity -= 2
        self.product.save()
        
        cancelled_order = OrderService.cancel_order(
            order, 'Customer requested cancellation'
        )
        
        self.assertEqual(cancelled_order.status, 'cancelled')
        self.assertIsNotNone(cancelled_order.cancelled_at)
        
        # Check stock restoration
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 10)


class OrderNotificationServiceTest(TestCase):
    """Test cases for OrderNotificationService"""
    
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
            payment_method='mtn_momo',
            subtotal=Decimal('50000.00'),
            total_amount=Decimal('50000.00')
        )
        
        self.notification_service = OrderNotificationService()
    
    @patch('apps.orders.services.notification_service.send_mail')
    def test_send_order_confirmation(self, mock_send_mail):
        """Test sending order confirmation email"""
        mock_send_mail.return_value = True
        
        result = self.notification_service.send_order_confirmation(self.order)
        
        self.assertTrue(result)
        mock_send_mail.assert_called_once()
        
        # Check email details
        call_args = mock_send_mail.call_args
        self.assertIn(self.order.order_number, call_args.kwargs['subject'])
        self.assertEqual(call_args.kwargs['recipient_list'], [self.order.email])
    
    @patch('apps.orders.services.notification_service.send_mail')
    def test_send_cod_admin_notification(self, mock_send_mail):
        """Test sending COD admin notification"""
        mock_send_mail.return_value = True
        
        # Make order COD
        self.order.payment_method = 'cash_on_delivery'
        self.order.is_cash_on_delivery = True
        self.order.save()
        
        result = self.notification_service.send_cod_admin_notification(self.order)
        
        self.assertTrue(result)
        mock_send_mail.assert_called_once()
        
        # Check that admin email was used
        call_args = mock_send_mail.call_args
        self.assertIn(self.admin.email, call_args.kwargs['recipient_list'])
    
    @patch('apps.orders.services.notification_service.send_mail')
    def test_send_status_update(self, mock_send_mail):
        """Test sending status update notification"""
        mock_send_mail.return_value = True
        
        result = self.notification_service.send_status_update(self.order, 'pending')
        
        self.assertTrue(result)
        mock_send_mail.assert_called_once()
        
        call_args = mock_send_mail.call_args
        self.assertIn('Order Update', call_args.kwargs['subject'])
    
    @patch('apps.orders.services.notification_service.send_mail')
    def test_send_delivery_confirmation(self, mock_send_mail):
        """Test sending delivery confirmation"""
        mock_send_mail.return_value = True
        
        self.order.mark_as_delivered()
        
        result = self.notification_service.send_delivery_confirmation(self.order)
        
        self.assertTrue(result)
        mock_send_mail.assert_called_once()
        
        call_args = mock_send_mail.call_args
        self.assertIn('Order Delivered', call_args.kwargs['subject'])
    
    @patch('apps.orders.services.notification_service.send_mail')
    def test_send_cancellation_notification(self, mock_send_mail):
        """Test sending cancellation notification"""
        mock_send_mail.return_value = True
        
        self.order.cancel_order('Customer requested cancellation')
        
        result = self.notification_service.send_cancellation_notification(self.order)
        
        self.assertTrue(result)
        mock_send_mail.assert_called_once()
        
        call_args = mock_send_mail.call_args
        self.assertIn('Order Cancelled', call_args.kwargs['subject'])
    
    def test_get_refund_info_cod(self):
        """Test refund info for COD orders"""
        self.order.payment_method = 'cash_on_delivery'
        
        refund_info = self.notification_service._get_refund_info(self.order)
        
        self.assertEqual(refund_info['method'], 'No refund needed')
        self.assertIn('Cash on Delivery', refund_info['message'])
    
    def test_get_refund_info_mobile_money(self):
        """Test refund info for mobile money orders"""
        self.order.payment_method = 'mtn_momo'
        
        refund_info = self.notification_service._get_refund_info(self.order)
        
        self.assertEqual(refund_info['method'], 'Mobile Money Refund')
        self.assertIn('2-3 business days', refund_info['message'])

