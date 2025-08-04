# apps/flash_sales/tests/test_views.py
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from apps.accounts.models import User
from apps.products.models import Product, Category
from ..models import FlashSale, FlashSaleProduct


class FlashSaleViewSetTest(TestCase):
    """Test cases for FlashSale ViewSet"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create admin user
        self.admin_user = User.objects.create_user(
            email='admin@shoponline.com',
            password='testpass123',
            first_name='Admin',
            last_name='User',
            user_type='admin'
        )
        
        # Create client user
        self.client_user = User.objects.create_user(
            email='client@gmail.com',
            password='testpass123',
            first_name='Client',
            last_name='User',
            user_type='client'
        )
        
        # Create test flash sale
        self.flash_sale = FlashSale.objects.create(
            name="Test Flash Sale",
            description="Test description",
            discount_percentage=Decimal('20.00'),
            start_time=timezone.now() + timedelta(hours=1),
            end_time=timezone.now() + timedelta(hours=25),
            created_by=self.admin_user
        )
    
    def test_list_flash_sales_public(self):
        """Test listing flash sales without authentication"""
        url = reverse('flash_sales:flashsale-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_create_flash_sale_admin_required(self):
        """Test creating flash sale requires admin authentication"""
        url = reverse('flash_sales:flashsale-list')
        data = {
            'name': 'New Flash Sale',
            'discount_percentage': '25.00',
            'start_time': (timezone.now() + timedelta(hours=2)).isoformat(),
            'end_time': (timezone.now() + timedelta(hours=26)).isoformat(),
        }
        
        # Test without authentication
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test with client user
        self.client.force_authenticate(user=self.client_user)
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with admin user
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_active_sales_endpoint(self):
        """Test active sales endpoint"""
        # Create an active flash sale
        active_sale = FlashSale.objects.create(
            name="Active Sale",
            discount_percentage=Decimal('15.00'),
            start_time=timezone.now() - timedelta(hours=1),
            end_time=timezone.now() + timedelta(hours=1),
            created_by=self.admin_user
        )
        
        url = reverse('flash_sales:flashsale-active-sales')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], "Active Sale")
