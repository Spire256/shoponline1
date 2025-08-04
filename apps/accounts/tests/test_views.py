# apps/accounts/tests/test_views.py
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from ..models import AdminInvitation

User = get_user_model()

class AuthenticationViewsTest(APITestCase):
    def test_client_registration(self):
        """Test client user registration"""
        url = reverse('accounts:register_client')
        data = {
            'email': 'client@gmail.com',
            'first_name': 'John',
            'last_name': 'Doe',
            'password': 'TestPass123!',
            'password_confirm': 'TestPass123!'
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data)
        self.assertIn('user', response.data)
        
        # Verify user was created
        user = User.objects.get(email='client@gmail.com')
        self.assertEqual(user.role, 'client')
    
    def test_user_login(self):
        """Test user login"""
        # Create user first
        user = User.objects.create_user(
            email='test@gmail.com',
            first_name='Test',
            last_name='User',
            password='TestPass123!'
        )
        
        url = reverse('accounts:login')
        data = {
            'email': 'test@gmail.com',
            'password': 'TestPass123!'
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)
        self.assertIn('user', response.data)
    
    def test_invalid_login(self):
        """Test login with invalid credentials"""
        url = reverse('accounts:login')
        data = {
            'email': 'invalid@gmail.com',
            'password': 'wrongpassword'
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AdminInvitationViewsTest(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            email='admin@shoponline.com',
            first_name='Admin',
            last_name='User',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.admin_user)
    
    def test_create_invitation(self):
        """Test creating admin invitation"""
        url = reverse('accounts:invitation_list')
        data = {
            'email': 'newadmin@shoponline.com'
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify invitation was created
        invitation = AdminInvitation.objects.get(email='newadmin@shoponline.com')
        self.assertEqual(invitation.invited_by, self.admin_user)
        self.assertEqual(invitation.status, 'pending')
    
    def test_list_invitations(self):
        """Test listing admin invitations"""
        # Create some invitations
        AdminInvitation.objects.create(
            email='test1@shoponline.com',
            invited_by=self.admin_user
        )
        AdminInvitation.objects.create(
            email='test2@shoponline.com',
            invited_by=self.admin_user
        )
        
        url = reverse('accounts:invitation_list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_validate_invitation_token(self):
        """Test invitation token validation"""
        invitation = AdminInvitation.objects.create(
            email='test@shoponline.com',
            invited_by=self.admin_user
        )
        
        url = reverse('accounts:validate_invitation', kwargs={'token': invitation.token})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['valid'])
        self.assertEqual(response.data['email'], 'test@shoponline.com')


class ProfileViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@gmail.com',
            first_name='Test',
            last_name='User',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_get_profile(self):
        """Test getting user profile"""
        url = reverse('accounts:profile')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'test@gmail.com')
        self.assertEqual(response.data['full_name'], 'Test User')
    
    def test_update_profile(self):
        """Test updating user profile"""
        url = reverse('accounts:profile')
        data = {
            'first_name': 'Updated',
            'last_name': 'Name',
            'phone_number': '+256700000000'
        }
        
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'Updated')
        self.assertEqual(response.data['phone_number'], '+256700000000')

