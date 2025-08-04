# apps/accounts/tests/test_serializers.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from ..serializers import (
    UserRegistrationSerializer, AdminRegistrationSerializer,
    LoginSerializer, InvitationCreateSerializer
)
from ..models import AdminInvitation

User = get_user_model()

class UserRegistrationSerializerTest(TestCase):
    def test_valid_client_registration(self):
        """Test valid client registration data"""
        data = {
            'email': 'client@gmail.com',
            'first_name': 'John',
            'last_name': 'Doe',
            'password': 'TestPass123!',
            'password_confirm': 'TestPass123!'
        }
        
        serializer = UserRegistrationSerializer(data=data)
        self.assertTrue(serializer.is_valid())
    
    def test_invalid_email_domain(self):
        """Test invalid email domain for client registration"""
        data = {
            'email': 'client@invalid.com',
            'first_name': 'John',
            'last_name': 'Doe',
            'password': 'TestPass123!',
            'password_confirm': 'TestPass123!'
        }
        
        serializer = UserRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)
    
    def test_password_mismatch(self):
        """Test password confirmation mismatch"""
        data = {
            'email': 'client@gmail.com',
            'first_name': 'John',
            'last_name': 'Doe',
            'password': 'TestPass123!',
            'password_confirm': 'DifferentPass123!'
        }
        
        serializer = UserRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)


class AdminRegistrationSerializerTest(TestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            email='admin@shoponline.com',
            first_name='Admin',
            last_name='User',
            password='testpass123'
        )
        
        self.invitation = AdminInvitation.objects.create(
            email='newadmin@shoponline.com',
            invited_by=self.admin_user
        )
    
    def test_valid_admin_registration(self):
        """Test valid admin registration with invitation token"""
        data = {
            'first_name': 'New',
            'last_name': 'Admin',
            'password': 'TestPass123!',
            'password_confirm': 'TestPass123!',
            'invitation_token': self.invitation.token
        }
        
        serializer = AdminRegistrationSerializer(data=data)
        self.assertTrue(serializer.is_valid())
    
    def test_invalid_invitation_token(self):
        """Test invalid invitation token"""
        data = {
            'first_name': 'New',
            'last_name': 'Admin',
            'password': 'TestPass123!',
            'password_confirm': 'TestPass123!',
            'invitation_token': 'invalid-token'
        }
        
        serializer = AdminRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('invitation_token', serializer.errors)
