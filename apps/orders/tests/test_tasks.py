
# apps/orders/tests/test_tasks.py

from django.test import TestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch, MagicMock
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone

from ..models import Order, CODVerification
from ..tasks import (
    send_order_confirmation_email,
    send_cod_admin_notification,
    auto_confirm_cod_orders,
    send_delivery_reminder,
    cleanup_cancelled_orders
)

User = get_user_model()


class OrderTasksTest(TestCase):
    """Test cases for order Celery tasks"""
    
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
    
    @patch('apps.orders.tasks.OrderNotificationService')
    def test_send_order_confirmation_email_task(self, mock_notification_service):
        """Test order confirmation email task"""
        mock_notification = MagicMock()
        mock_notification.send_order_confirmation.return_value = True
        mock_notification_service.return_value = mock_notification
        
        send_order_confirmation_email(str(self.order.id))
        
        mock_notification.send_order_confirmation.assert_called_once()
    
    @patch('apps.orders.tasks.OrderNotificationService')
    def test_send_cod_admin_notification_task(self, mock_notification_service):
        """Test COD admin notification task"""
        mock_notification = MagicMock()
        mock_notification.send_cod_admin_notification.return_value = True
        mock_notification_service.return_value = mock_notification
        
        # Make order COD
        self.order.payment_method = 'cash_on_delivery'
        self.order.is_cash_on_delivery = True
        self.order.save()
        
        send_cod_admin_notification(str(self.order.id))
        
        mock_notification.send_cod_admin_notification.assert_called_once()
    
    def test_auto_confirm_cod_orders(self):
        """Test auto-confirming COD orders after 24 hours"""
        # Create old COD order
        old_cod_order = Order.objects.create(
            first_name='Jane',
            last_name='Doe',
            email='jane@gmail.com',
            phone='256712345679',
            address_line_1='Plot 456 Other Street',
            city='Kampala',
            district='Kampala',
            payment_method='cash_on_delivery',
            subtotal=Decimal('75000.00'),
            total_amount=Decimal('75000.00'),
            status='pending'
        )
        
        # Set created time to 25 hours ago
        old_cod_order.created_at = timezone.now() - timedelta(hours=25)
        old_cod_order.save()
        
        # Create recent COD order (should not be auto-confirmed)
        recent_cod_order = Order.objects.create(
            first_name='Bob',
            last_name='Smith',
            email='bob@gmail.com',
            phone='256712345680',
            address_line_1='Plot 789 Another Street',
            city='Kampala',
            district='Kampala',
            payment_method='cash_on_delivery',
            subtotal=Decimal('60000.00'),
            total_amount=Decimal('60000.00'),
            status='pending'
        )
        
        confirmed_count = auto_confirm_cod_orders()
        
        self.assertEqual(confirmed_count, 1)
        
        old_cod_order.refresh_from_db()
        recent_cod_order.refresh_from_db()
        
        self.assertEqual(old_cod_order.status, 'confirmed')
        self.assertEqual(recent_cod_order.status, 'pending')
    
    @patch('apps.orders.tasks.send_mail')
    def test_send_delivery_reminder(self, mock_send_mail):
        """Test sending delivery reminders"""
        mock_send_mail.return_value = True
        
        # Create order confirmed 3 days ago
        old_order = Order.objects.create(
            first_name='Alice',
            last_name='Johnson',
            email='alice@gmail.com',
            phone='256712345681',
            address_line_1='Plot 101 First Street',
            city='Kampala',
            district='Kampala',
            payment_method='mtn_momo',
            subtotal=Decimal('80000.00'),
            total_amount=Decimal('80000.00'),
            status='confirmed'
        )
        
        old_order.confirmed_at = timezone.now() - timedelta(days=3)
        old_order.save()
        
        reminded_count = send_delivery_reminder()
        
        self.assertEqual(reminded_count, 1)
        mock_send_mail.assert_called_once()
    
    def test_cleanup_cancelled_orders(self):
        """Test cleaning up old cancelled orders"""
        # Create old cancelled order
        old_cancelled_order = Order.objects.create(
            first_name='Charlie',
            last_name='Brown',
            email='charlie@gmail.com',
            phone='256712345682',
            address_line_1='Plot 202 Second Street',
            city='Kampala',
            district='Kampala',
            payment_method='mtn_momo',
            subtotal=Decimal('90000.00'),
            total_amount=Decimal('90000.00'),
            status='cancelled'
        )
        
        old_cancelled_order.cancelled_at = timezone.now() - timedelta(days=35)
        old_cancelled_order.save()
        
        processed_count = cleanup_cancelled_orders()
        
        self.assertEqual(processed_count, 1)