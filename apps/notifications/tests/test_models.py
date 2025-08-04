# apps/notifications/tests/test_models.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from ..models import Notification, NotificationSettings, NotificationTemplate

User = get_user_model()

class NotificationModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@gmail.com',
            password='testpass123'
        )
        self.admin = User.objects.create_user(
            email='admin@shoponline.com',
            password='adminpass123',
            is_staff=True
        )

    def test_notification_creation(self):
        """Test notification creation"""
        notification = Notification.objects.create(
            recipient=self.user,
            title='Test Notification',
            message='This is a test notification',
            notification_type='order_created'
        )
        
        self.assertEqual(notification.recipient, self.user)
        self.assertEqual(notification.title, 'Test Notification')
        self.assertFalse(notification.is_read)
        self.assertFalse(notification.is_sent)

    def test_mark_as_read(self):
        """Test marking notification as read"""
        notification = Notification.objects.create(
            recipient=self.user,
            title='Test Notification',
            message='Test message',
            notification_type='order_created'
        )
        
        self.assertFalse(notification.is_read)
        self.assertIsNone(notification.read_at)
        
        notification.mark_as_read()
        
        self.assertTrue(notification.is_read)
        self.assertIsNotNone(notification.read_at)

    def test_notification_settings_creation(self):
        """Test notification settings auto-creation"""
        settings = NotificationSettings.objects.get(user=self.user)
        
        self.assertTrue(settings.in_app_enabled)
        self.assertTrue(settings.email_enabled)
        self.assertTrue(settings.websocket_enabled)

class NotificationTemplateTest(TestCase):
    def test_template_creation(self):
        """Test notification template creation"""
        template = NotificationTemplate.objects.create(
            name='Order Confirmation',
            notification_type='order_created',
            method='email',
            subject_template='Order #{order_number} Confirmed',
            body_template='Your order has been confirmed.'
        )
        
        self.assertEqual(template.name, 'Order Confirmation')
        self.assertTrue(template.is_active)
