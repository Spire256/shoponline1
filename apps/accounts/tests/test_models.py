
# apps/accounts/tests/test_models.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from ..models import AdminInvitation
from datetime import timedelta

User = get_user_model()

class UserModelTest(TestCase):
    def test_create_client_user(self):
        """Test creating a client user"""
        user = User.objects.create_user(
            email='client@gmail.com',
            first_name='John',
            last_name='Doe',
            password='testpass123'
        )
        
        self.assertEqual(user.email, 'client@gmail.com')
        self.assertEqual(user.role, 'client')
        self.assertFalse(user.is_admin)
        self.assertTrue(user.is_client)
        self.assertFalse(user.is_staff)
    
    def test_create_admin_user(self):
        """Test creating an admin user"""
        user = User.objects.create_user(
            email='admin@shoponline.com',
            first_name='Jane',
            last_name='Smith',
            password='testpass123'
        )
        
        self.assertEqual(user.email, 'admin@shoponline.com')
        self.assertEqual(user.role, 'admin')
        self.assertTrue(user.is_admin)
        self.assertFalse(user.is_client)
        self.assertTrue(user.is_staff)
    
    def test_user_full_name(self):
        """Test user full name property"""
        user = User.objects.create_user(
            email='test@gmail.com',
            first_name='John',
            last_name='Doe',
            password='testpass123'
        )
        
        self.assertEqual(user.full_name, 'John Doe')
    
    def test_user_str_representation(self):
        """Test user string representation"""
        user = User.objects.create_user(
            email='test@gmail.com',
            first_name='John',
            last_name='Doe',
            password='testpass123'
        )
        
        self.assertEqual(str(user), 'test@gmail.com (Client)')


class AdminInvitationModelTest(TestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            email='admin@shoponline.com',
            first_name='Admin',
            last_name='User',
            password='testpass123'
        )
    
    def test_create_invitation(self):
        """Test creating an admin invitation"""
        invitation = AdminInvitation.objects.create(
            email='newadmin@shoponline.com',
            invited_by=self.admin_user
        )
        
        self.assertEqual(invitation.email, 'newadmin@shoponline.com')
        self.assertEqual(invitation.status, 'pending')
        self.assertTrue(invitation.token)
        self.assertTrue(invitation.expires_at)
        self.assertTrue(invitation.is_valid)
    
    def test_invitation_expiry(self):
        """Test invitation expiry logic"""
        invitation = AdminInvitation.objects.create(
            email='expired@shoponline.com',
            invited_by=self.admin_user,
            expires_at=timezone.now() - timedelta(hours=1)
        )
        
        self.assertTrue(invitation.is_expired)
        self.assertFalse(invitation.is_valid)
    
    def test_mark_as_accepted(self):
        """Test marking invitation as accepted"""
        invitation = AdminInvitation.objects.create(
            email='accepted@shoponline.com',
            invited_by=self.admin_user
        )
        
        new_user = User.objects.create_user(
            email='accepted@shoponline.com',
            first_name='New',
            last_name='Admin',
            password='testpass123'
        )
        
        invitation.mark_as_accepted(new_user)
        
        self.assertEqual(invitation.status, 'accepted')
        self.assertEqual(invitation.invited_user, new_user)
        self.assertTrue(invitation.accepted_at)

