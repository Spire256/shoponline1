# apps/notifications/services/email_service.py
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags
import logging

logger = logging.getLogger(__name__)

class EmailNotificationService:
    @staticmethod
    def send_email_notification(notification):
        """
        Send email notification
        """
        try:
            recipient_email = notification.recipient.email
            
            # Prepare email content
            context = {
                'notification': notification,
                'user': notification.recipient,
                'data': notification.data,
                'site_name': 'ShopOnline Uganda'
            }
            
            # Use template if available
            template_name = f'emails/{notification.notification_type}.html'
            
            try:
                html_content = render_to_string(template_name, context)
                text_content = strip_tags(html_content)
            except:
                # Fallback to basic template
                html_content = render_to_string('emails/base_notification.html', context)
                text_content = notification.message
            
            # Create email
            email = EmailMultiAlternatives(
                subject=notification.title,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[recipient_email]
            )
            
            email.attach_alternative(html_content, "text/html")
            email.send()
            
            logger.info(f"Email sent to {recipient_email} for notification {notification.id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email notification {notification.id}: {str(e)}")
            return False
    
    @staticmethod
    def send_admin_invitation_email(invitation):
        """
        Send admin invitation email
        """
        try:
            context = {
                'invitation': invitation,
                'registration_url': f"{settings.FRONTEND_URL}/admin/register?token={invitation.token}",
                'site_name': 'ShopOnline Uganda',
                'expires_at': invitation.expires_at
            }
            
            html_content = render_to_string('emails/admin_invitation.html', context)
            text_content = strip_tags(html_content)
            
            email = EmailMultiAlternatives(
                subject='Admin Invitation - ShopOnline Uganda',
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[invitation.email]
            )
            
            email.attach_alternative(html_content, "text/html")
            email.send()
            
            logger.info(f"Admin invitation email sent to {invitation.email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send admin invitation email: {str(e)}")
            return False
