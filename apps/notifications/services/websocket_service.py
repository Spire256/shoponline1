
# apps/notifications/services/websocket_service.py
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json
import logging

logger = logging.getLogger(__name__)

class WebSocketNotificationService:
    @staticmethod
    def send_websocket_notification(notification):
        """
        Send WebSocket notification for real-time updates
        """
        try:
            channel_layer = get_channel_layer()
            
            if not channel_layer:
                logger.warning("No channel layer configured for WebSocket")
                return False
            
            # Prepare notification data
            notification_data = {
                'type': 'notification',
                'data': {
                    'id': notification.id,
                    'title': notification.title,
                    'message': notification.message,
                    'notification_type': notification.notification_type,
                    'priority': notification.priority,
                    'created_at': notification.created_at.isoformat(),
                    'data': notification.data
                }
            }
            
            # Send to user's personal channel
            user_channel = f"user_{notification.recipient.id}"
            
            async_to_sync(channel_layer.group_send)(
                user_channel,
                {
                    'type': 'send_notification',
                    'message': notification_data
                }
            )
            
            # If it's an admin notification, also send to admin group
            if notification.recipient.is_staff:
                async_to_sync(channel_layer.group_send)(
                    'admin_notifications',
                    {
                        'type': 'send_notification',
                        'message': notification_data
                    }
                )
            
            logger.info(f"WebSocket notification sent for notification {notification.id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send WebSocket notification {notification.id}: {str(e)}")
            return False
    
    @staticmethod
    def send_cod_alert(order):
        """
        Send immediate COD alert to all connected admins
        """
        try:
            channel_layer = get_channel_layer()
            
            if not channel_layer:
                return False
            
            alert_data = {
                'type': 'cod_alert',
                'data': {
                    'order_id': order.id,
                    'order_number': order.order_number,
                    'customer_name': order.customer_name,
                    'customer_phone': order.customer_phone,
                    'total_amount': str(order.total_amount),
                    'created_at': order.created_at.isoformat(),
                    'message': f'New COD Order #{order.order_number} - UGX {order.total_amount:,.0f}'
                }
            }
            
            # Send to all admin channels
            async_to_sync(channel_layer.group_send)(
                'admin_notifications',
                {
                    'type': 'send_cod_alert',
                    'message': alert_data
                }
            )
            
            logger.info(f"COD alert sent for order {order.order_number}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send COD alert for order {order.id}: {str(e)}")
            return False
