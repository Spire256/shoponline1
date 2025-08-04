
# apps/accounts/utils.py
import secrets
import string
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

def validate_email_domain(email):
    """Validate email domain based on user type"""
    if email.endswith('@gmail.com'):
        return True  # Client registration
    elif email.endswith('@shoponline.com'):
        return True  # Admin registration
    return False

def generate_invitation_token():
    """Generate secure invitation token"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(64))

def send_invitation_email(invitation):
    """Send invitation email to admin candidate"""
    subject = 'Admin Invitation - ShopOnline Platform'
    registration_url = f"{settings.FRONTEND_URL}/register/admin?token={invitation.token}"
    
    message = f"""
    Hello,
    
    You have been invited to join ShopOnline as an administrator.
    
    Please click the link below to complete your registration:
    {registration_url}
    
    This invitation will expire on {invitation.expires_at.strftime('%Y-%m-%d %H:%M:%S')}.
    
    Best regards,
    ShopOnline Team
    """
    
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [invitation.email],
        fail_silently=False,
    )
