
# apps/notifications/tests/test_services.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch, MagicMock
from ..models import Notification
from ..services.email_service import EmailNotificationService
from ..services.websocket_service import WebSocketNotificationService

User = get_user_model()

class EmailServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@gmail.com',
            password='testpass123'
        )

    @patch('apps.notifications.services.email_service.EmailMultiAlternatives')
    def test_send_email_notification(self, mock_email):
        """Test sending email notification"""
        notification = Notification.objects.create(
            recipient=self.user,
            title='Test Email',
            message='Test email message',
            notification_type='order_created',
            method='email'
        )
        
        mock_email_instance = MagicMock()
        mock_email.return_value = mock_email_instance
        
        result = EmailNotificationService.send_email_notification(notification)
        
        self.assertTrue(result)
        mock_email.assert_called_once()
        mock_email_instance.send.assert_called_once()

class WebSocketServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@gmail.com',
            password='testpass123'
        )

    @patch('apps.notifications.services.websocket_service.get_channel_layer')
    @patch('apps.notifications.services.websocket_service.async_to_sync')
    def test_send_websocket_notification(self, mock_async_to_sync, mock_get_channel_layer):
        """Test sending WebSocket notification"""
        notification = Notification.objects.create(
            recipient=self.user,
            title='Test WebSocket',
            message='Test WebSocket message',
            notification_type='order_created',
            method='websocket'
        )
        
        mock_channel_layer = MagicMock()
        mock_get_channel_layer.return_value = mock_channel_layer
        mock_group_send = MagicMock()
        mock_async_to_sync.return_value = mock_group_send
        
        result = WebSocketNotificationService.send_websocket_notification(notification)
        
        self.assertTrue(result)
        mock_group_send.assert_called()
