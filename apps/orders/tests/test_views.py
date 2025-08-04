
# apps/orders/tests/test_views.py

from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal

from ..models import Order, OrderItem
from apps.products.models import Product, Category

User = get_user_model()


class OrderViewsTest(TestCase):
    """Test cases for order views"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        self.customer = User.objects.create_user(
            email='customer@gmail.com',
            password='testpass123'
        )
        
        self.admin = User.objects.create_user(
            email='admin@shoponline.com',
            password='adminpass123',
            is_admin=True
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
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'customer@gmail.com',
            'phone': '256712345678',
            'address_line_1': 'Plot 123 Main Street',
            'city': 'Kampala',
            'district': 'Kampala',
            'payment_method': 'mtn_momo',
            'items': [
                {
                    'product_id': str(self.product.id),
                    'quantity': 2
                }
            ]
        }
    
    def test_create_order_as_guest(self):
        """Test creating order as guest user"""
        url = reverse('orders:order-list-create')
        response = self.client.post(url, self.order_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Order.objects.filter(email='customer@gmail.com').exists())
    
    def test_create_order_as_authenticated_user(self):
        """Test creating order as authenticated user"""
        self.client.force_authenticate(user=self.customer)
        
        url = reverse('orders:order-list-create')
        response = self.client.post(url, self.order_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        order = Order.objects.get(email='customer@gmail.com')
        self.assertEqual(order.user, self.customer)
    
    def test_create_order_insufficient_stock(self):
        """Test creating order with insufficient stock"""
        self.order_data['items'][0]['quantity'] = 20  # More than available stock
        
        url = reverse('orders:order-list-create')
        response = self.client.post(url, self.order_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_list_orders_as_customer(self):
        """Test listing orders as customer"""
        self.client.force_authenticate(user=self.customer)
        
        # Create an order for the customer
        order = Order.objects.create(
            user=self.customer,
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
        
        url = reverse('orders:order-list-create')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_list_orders_as_admin(self):
        """Test listing orders as admin"""
        self.client.force_authenticate(user=self.admin)
        
        # Create orders for different customers
        Order.objects.create(
            first_name='John',
            last_name='Doe',
            email='customer1@gmail.com',
            phone='256712345678',
            address_line_1='Plot 123 Main Street',
            city='Kampala',
            district='Kampala',
            payment_method='mtn_momo',
            subtotal=Decimal('50000.00'),
            total_amount=Decimal('50000.00')
        )
        
        Order.objects.create(
            first_name='Jane',
            last_name='Smith',
            email='customer2@gmail.com',
            phone='256712345679',
            address_line_1='Plot 456 Other Street',
            city='Entebbe',
            district='Wakiso',
            payment_method='cash_on_delivery',
            subtotal=Decimal('75000.00'),
            total_amount=Decimal('75000.00')
        )
        
        url = reverse('orders:order-list-create')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_cancel_order_as_customer(self):
        """Test cancelling order as customer"""
        self.client.force_authenticate(user=self.customer)
        
        order = Order.objects.create(
            user=self.customer,
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
        
        url = reverse('orders:cancel-order', kwargs={'order_id': order.id})
        response = self.client.post(url, {'reason': 'Changed my mind'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        order.refresh_from_db()
        self.assertEqual(order.status, 'cancelled')
    
    def test_confirm_order_as_admin(self):
        """Test confirming order as admin"""
        self.client.force_authenticate(user=self.admin)
        
        order = Order.objects.create(
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
        
        url = reverse('orders:confirm-order', kwargs={'order_id': order.id})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        order.refresh_from_db()
        self.assertEqual(order.status, 'confirmed')
        self.assertIsNotNone(order.confirmed_at)
    
    def test_order_analytics_as_admin(self):
        """Test order analytics endpoint as admin"""
        self.client.force_authenticate(user=self.admin)
        
        # Create some test orders
        Order.objects.create(
            first_name='John',
            last_name='Doe',
            email='customer1@gmail.com',
            phone='256712345678',
            address_line_1='Plot 123 Main Street',
            city='Kampala',
            district='Kampala',
            payment_method='mtn_momo',
            subtotal=Decimal('50000.00'),
            total_amount=Decimal('50000.00'),
            status='delivered'
        )
        
        url = reverse('orders:order-analytics')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_orders', response.data)
        self.assertIn('total_revenue', response.data)
        self.assertIn('completed_orders', response.data)
    
    def test_order_tracking(self):
        """Test order tracking endpoint"""
        order = Order.objects.create(
            user=self.customer,
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
        
        self.client.force_authenticate(user=self.customer)
        
        url = reverse('orders:order-tracking', kwargs={'order_number': order.order_number})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['order_number'], order.order_number)

