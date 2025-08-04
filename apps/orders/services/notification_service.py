
# apps/orders/services/notification_service.py

from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.contrib.auth import get_user_model
from typing import Optional
import logging

from ..models import Order

User = get_user_model()
logger = logging.getLogger(__name__)


class OrderNotificationService:
    """Service for handling order-related notifications"""
    
    def send_order_confirmation(self, order: Order) -> bool:
        """Send order confirmation email to customer"""
        try:
            subject = f"Order Confirmation - {order.order_number}"
            
            context = {
                'order': order,
                'items': order.items.all(),
                'customer_name': order.get_customer_name(),
                'site_name': 'ShopOnline Uganda',
            }
            
            html_message = render_to_string('emails/order_confirmation.html', context)
            plain_message = render_to_string('emails/order_confirmation.txt', context)
            
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[order.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"Order confirmation sent for order {order.order_number}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send order confirmation for {order.order_number}: {str(e)}")
            return False
    
    def send_cod_admin_notification(self, order: Order) -> bool:
        """Send COD order notification to admins"""
        try:
            # Get admin users
            admin_emails = list(
                User.objects.filter(is_admin=True, is_active=True)
                .values_list('email', flat=True)
            )
            
            if not admin_emails:
                logger.warning("No admin users found for COD notification")
                return False
            
            subject = f"New COD Order - {order.order_number}"
            
            context = {
                'order': order,
                'items': order.items.all(),
                'customer_name': order.get_customer_name(),
                'delivery_address': order.get_delivery_address(),
                'admin_url': f"{settings.FRONTEND_URL}/admin/orders/{order.id}",
            }
            
            html_message = render_to_string('emails/cod_notification.html', context)
            plain_message = render_to_string('emails/cod_notification.txt', context)
            
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=admin_emails,
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"COD admin notification sent for order {order.order_number}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send COD admin notification for {order.order_number}: {str(e)}")
            return False
    
    def send_status_update(self, order: Order, previous_status: str) -> bool:
        """Send order status update to customer"""
        try:
            subject = f"Order Update - {order.order_number}"
            
            context = {
                'order': order,
                'previous_status': previous_status,
                'new_status': order.status,
                'customer_name': order.get_customer_name(),
                'tracking_url': f"{settings.FRONTEND_URL}/orders/{order.order_number}/track",
            }
            
            html_message = render_to_string('emails/order_status_update.html', context)
            plain_message = render_to_string('emails/order_status_update.txt', context)
            
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[order.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"Status update sent for order {order.order_number}: {previous_status} → {order.status}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send status update for {order.order_number}: {str(e)}")
            return False
    
    def send_delivery_confirmation(self, order: Order) -> bool:
        """Send delivery confirmation to customer"""
        try:
            subject = f"Order Delivered - {order.order_number}"
            
            context = {
                'order': order,
                'customer_name': order.get_customer_name(),
                'delivered_at': order.delivered_at,
            }
            
            html_message = render_to_string('emails/delivery_confirmation.html', context)
            plain_message = render_to_string('emails/delivery_confirmation.txt', context)
            
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[order.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"Delivery confirmation sent for order {order.order_number}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send delivery confirmation for {order.order_number}: {str(e)}")
            return False
    
    def send_cancellation_notification(self, order: Order) -> bool:
        """Send order cancellation notification to customer"""
        try:
            subject = f"Order Cancelled - {order.order_number}"
            
            context = {
                'order': order,
                'customer_name': order.get_customer_name(),
                'cancelled_at': order.cancelled_at,
                'refund_info': self._get_refund_info(order),
            }
            
            html_message = render_to_string('emails/order_cancellation.html', context)
            plain_message = render_to_string('emails/order_cancellation.txt', context)
            
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[order.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"Cancellation notification sent for order {order.order_number}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send cancellation notification for {order.order_number}: {str(e)}")
            return False
    
    def _get_refund_info(self, order: Order) -> dict:
        """Get refund information based on payment method"""
        if order.payment_method == 'cash_on_delivery':
            return {
                'method': 'No refund needed',
                'message': 'Since this was a Cash on Delivery order, no payment was processed.'
            }
        elif order.payment_method in ['mtn_momo', 'airtel_money']:
            return {
                'method': 'Mobile Money Refund',
                'message': 'Your refund will be processed back to your mobile money account within 2-3 business days.',
                'timeline': '2-3 business days'
            }
        else:
            return {
                'method': 'Standard Refund',
                'message': 'Your refund will be processed within 5-7 business days.',
                'timeline': '5-7 business days'
            }
    
    def send_payment_receipt(self, order: Order, transaction_details: dict) -> bool:
        """Send payment receipt for successful mobile money payments"""
        try:
            subject = f"Payment Receipt - {order.order_number}"
            
            context = {
                'order': order,
                'transaction': transaction_details,
                'customer_name': order.get_customer_name(),
                'payment_date': timezone.now(),
            }
            
            html_message = render_to_string('emails/payment_receipt.html', context)
            plain_message = render_to_string('emails/payment_receipt.txt', context)
            
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[order.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"Payment receipt sent for order {order.order_number}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send payment receipt for {order.order_number}: {str(e)}")
            return False