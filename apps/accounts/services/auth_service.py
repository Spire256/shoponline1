# apps/accounts/services/auth_service.py
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from ..models import User

class AuthService:
    """Service class for authentication operations"""
    
    @staticmethod
    def authenticate_user(email, password):
        """Authenticate user with email and password"""
        user = authenticate(username=email, password=password)
        if user and user.is_active:
            return user
        return None
    
    @staticmethod
    def generate_tokens(user):
        """Generate JWT tokens for user"""
        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
    
    @staticmethod
    def blacklist_token(refresh_token):
        """Blacklist refresh token"""
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return True
        except Exception:
            return False
