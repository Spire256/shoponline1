# apps/accounts/services/invitation_service.py
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from ..models import AdminInvitation
from ..utils import generate_invitation_token

class InvitationService:
    """Service class for handling admin invitations"""
    
    @staticmethod
    def create_invitation(email, invited_by):
        """Create a new admin invitation"""
        invitation = AdminInvitation.objects.create(
            email=email,
            invited_by=invited_by,
            token=generate_invitation_token(),
            expires_at=timezone.now() + timezone.timedelta(hours=48)
        )
        return invitation
    
    @staticmethod
    def send_invitation_email(invitation):
        """Send invitation email with HTML template"""
        subject = 'Admin Invitation - ShopOnline Platform'
        registration_url = f"{settings.FRONTEND_URL}/register/admin?token={invitation.token}"
        
        context = {
            'invitation': invitation,
            'registration_url': registration_url,
            'site_name': 'ShopOnline',
            'expires_at': invitation.expires_at,
        }
        
        html_message = render_to_string('emails/admin_invitation.html', context)
        plain_message = f"""
        Hello,
        
        You have been invited by {invitation.invited_by.full_name} to join ShopOnline as an administrator.
        
        Please click the link below to complete your registration:
        {registration_url}
        
        This invitation will expire on {invitation.expires_at.strftime('%Y-%m-%d %H:%M:%S')}.
        
        Best regards,
        ShopOnline Team
        """
        
        send_mail(
            subject,
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            [invitation.email],
            html_message=html_message,
            fail_silently=False,
        )
    
    @staticmethod
    def cleanup_expired_invitations():
        """Clean up expired invitations"""
        expired_invitations = AdminInvitation.objects.filter(
            status='pending',
            expires_at__lt=timezone.now()
        )
        expired_count = expired_invitations.count()
        expired_invitations.update(status='expired')
        return expired_count

