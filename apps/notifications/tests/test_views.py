
# apps/notifications/tests/test_views.py
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from ..models import Notification

User = get_user_model()

class NotificationViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@gmail.com',
            password='testpass123'
        )
        self.admin = User.objects.create_user(
            email='admin@shoponline.com',
            password='adminpass123',
            is_staff=True
        )

    def test_notification_list_authenticated(self):
        """Test notification list for authenticated user"""
        # Create notifications
        Notification.objects.create(
            recipient=self.user,
            title='Test Notification 1',
            message='Message 1',
            notification_type='order_created'
        )
        Notification.objects.create(
            recipient=self.user,
            title='Test Notification 2',
            message='Message 2',
            notification_type='payment_received'
        )
        
        self.client.force_authenticate(user=self.user)
        url = reverse('notifications:notification-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_notification_list_unauthenticated(self):
        """Test notification list requires authentication"""
        url = reverse('notifications:notification-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_mark_notifications_as_read(self):
        """Test marking notifications as read"""
        notification = Notification.objects.create(
            recipient=self.user,
            title='Test Notification',
            message='Test message',
            notification_type='order_created'
        )
        
        self.client.force_authenticate(user=self.user)
        url = reverse('notifications:mark-as-read')
        data = {'notification_ids': [notification.id]}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)

    def test_notification_counts(self):
        """Test notification counts endpoint"""
        # Create notifications
        Notification.objects.create(
            recipient=self.user,
            title='Read Notification',
            message='Message',
            notification_type='order_created',
            is_read=True
        )
        Notification.objects.create(
            recipient=self.user,
            title='Unread Notification',
            message='Message',
            notification_type='payment_received'
        )
        
        self.client.force_authenticate(user=self.user)
        url = reverse('notifications:notification-counts')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_count'], 2)
        self.assertEqual(response.data['unread_count'], 1)
