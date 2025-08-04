
# apps/accounts/services/email_service.py
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags

class EmailService:
    """Service class for handling email operations"""
    
    @staticmethod
    def send_html_email(subject, template_name, context, recipient_list):
        """Send HTML email with template"""
        html_content = render_to_string(template_name, context)
        text_content = strip_tags(html_content)
        
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=recipient_list
        )
        email.attach_alternative(html_content, "text/html")
        
        return email.send()
    
    @staticmethod
    def send_welcome_email(user):
        """Send welcome email to new user"""
        subject = 'Welcome to ShopOnline!'
        context = {
            'user': user,
            'site_name': 'ShopOnline',
        }
        
        if user.is_admin:
            template_name = 'emails/admin_welcome.html'
        else:
            template_name = 'emails/client_welcome.html'
        
        return EmailService.send_html_email(
            subject, template_name, context, [user.email]
        )

