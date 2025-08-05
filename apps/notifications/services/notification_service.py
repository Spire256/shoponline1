"""
Notification Service for handling various types of notifications
"""
import logging
from typing import Dict, Any, Optional
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


class NotificationService:
    """
    Service class for handling different types of notifications
    """
    
    def __init__(self):
        self.email_enabled = getattr(settings, 'EMAIL_NOTIFICATIONS_ENABLED', True)
        self.sms_enabled = getattr(settings, 'SMS_NOTIFICATIONS_ENABLED', False)
    
    def send_payment_notification(self, 
                                user_email: str, 
                                notification_type: str,
                                context: Dict[str, Any]) -> bool:
        """
        Send payment-related notifications
        
        Args:
            user_email: Recipient email address
            notification_type: Type of notification (success, failed, pending)
            context: Additional context data for the notification
            
        Returns:
            bool: True if notification sent successfully
        """
        try:
            if notification_type == 'payment_success':
                return self._send_payment_success_email(user_email, context)
            elif notification_type == 'payment_failed':
                return self._send_payment_failed_email(user_email, context)
            elif notification_type == 'payment_pending':
                return self._send_payment_pending_email(user_email, context)
            else:
                logger.warning(f"Unknown notification type: {notification_type}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to send notification: {str(e)}")
            return False
    
    def _send_payment_success_email(self, user_email: str, context: Dict[str, Any]) -> bool:
        """Send payment success notification"""
        if not self.email_enabled:
            logger.info("Email notifications are disabled")
            return True
            
        try:
            subject = f"Payment Successful - Order #{context.get('order_id', 'N/A')}"
            message = f"""
            Dear Customer,
            
            Your payment has been processed successfully!
            
            Order ID: {context.get('order_id', 'N/A')}
            Amount: {context.get('amount', 'N/A')}
            Transaction ID: {context.get('transaction_id', 'N/A')}
            
            Thank you for your business!
            """
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user_email],
                fail_silently=False,
            )
            
            logger.info(f"Payment success notification sent to {user_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send payment success email: {str(e)}")
            return False
    
    def _send_payment_failed_email(self, user_email: str, context: Dict[str, Any]) -> bool:
        """Send payment failure notification"""
        if not self.email_enabled:
            logger.info("Email notifications are disabled")
            return True
            
        try:
            subject = f"Payment Failed - Order #{context.get('order_id', 'N/A')}"
            message = f"""
            Dear Customer,
            
            Unfortunately, your payment could not be processed.
            
            Order ID: {context.get('order_id', 'N/A')}
            Amount: {context.get('amount', 'N/A')}
            Reason: {context.get('error_message', 'Unknown error')}
            
            Please try again or contact support.
            """
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user_email],
                fail_silently=False,
            )
            
            logger.info(f"Payment failed notification sent to {user_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send payment failed email: {str(e)}")
            return False
    
    def _send_payment_pending_email(self, user_email: str, context: Dict[str, Any]) -> bool:
        """Send payment pending notification"""
        if not self.email_enabled:
            logger.info("Email notifications are disabled")
            return True
            
        try:
            subject = f"Payment Pending - Order #{context.get('order_id', 'N/A')}"
            message = f"""
            Dear Customer,
            
            Your payment is being processed.
            
            Order ID: {context.get('order_id', 'N/A')}
            Amount: {context.get('amount', 'N/A')}
            Transaction ID: {context.get('transaction_id', 'N/A')}
            
            You will receive another notification once the payment is confirmed.
            """
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user_email],
                fail_silently=False,
            )
            
            logger.info(f"Payment pending notification sent to {user_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send payment pending email: {str(e)}")
            return False
    
    def send_sms_notification(self, phone_number: str, message: str) -> bool:
        """
        Send SMS notification (placeholder implementation)
        
        Args:
            phone_number: Recipient phone number
            message: SMS message content
            
        Returns:
            bool: True if SMS sent successfully
        """
        if not self.sms_enabled:
            logger.info("SMS notifications are disabled")
            return True
            
        # TODO: Implement actual SMS service integration
        logger.info(f"SMS notification would be sent to {phone_number}: {message}")
        return True