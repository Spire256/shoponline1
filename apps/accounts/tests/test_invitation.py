
# apps/accounts/tests/test_invitation.py
from django.test import TestCase
from django.core import mail
from django.contrib.auth import get_user_model
from ..services.invitation_service import InvitationService
from ..models import AdminInvitation

User = get_user_model()

class InvitationServiceTest(TestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            email='admin@shoponline.com',
            first_name='Admin',
            last_name='User',
            password='testpass123'
        )
    
    def test_create_invitation(self):
        """Test creating invitation through service"""
        invitation = InvitationService.create_invitation(
            email='newadmin@shoponline.com',
            invited_by=self.admin_user
        )
        
        self.assertEqual(invitation.email, 'newadmin@shoponline.com')
        self.assertEqual(invitation.invited_by, self.admin_user)
        self.assertTrue(invitation.token)
        self.assertTrue(invitation.expires_at)
    
    def test_send_invitation_email(self):
        """Test sending invitation email"""
        invitation = AdminInvitation.objects.create(
            email='test@shoponline.com',
            invited_by=self.admin_user
        )
        
        InvitationService.send_invitation_email(invitation)
        
        # Check that email was sent
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ['test@shoponline.com'])
        self.assertIn('Admin Invitation', mail.outbox[0].subject)
    
    def test_cleanup_expired_invitations(self):
        """Test cleaning up expired invitations"""
        from django.utils import timezone
        from datetime import timedelta
        
        # Create expired invitation
        expired_invitation = AdminInvitation.objects.create(
            email='expired@shoponline.com',
            invited_by=self.admin_user,
            expires_at=timezone.now() - timedelta(hours=1)
        )
        
        # Create valid invitation
        valid_invitation = AdminInvitation.objects.create(
            email='valid@shoponline.com',
            invited_by=self.admin_user
        )
        
        cleaned_count = InvitationService.cleanup_expired_invitations()
        
        self.assertEqual(cleaned_count, 1)
        
        expired_invitation.refresh_from_db()
        valid_invitation.refresh_from_db()
        
        self.assertEqual(expired_invitation.status, 'expired')
        self.assertEqual(valid_invitation.status, 'pending')

