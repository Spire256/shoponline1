# apps/accounts/serializers.py
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import User, AdminInvitation
from .utils import validate_email_domain

class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'password', 'password_confirm']
    
    def validate_email(self, value):
        """Validate email domain"""
        if not validate_email_domain(value):
            raise serializers.ValidationError(
                "Only @gmail.com emails are allowed for client registration"
            )
        return value
    
    def validate(self, attrs):
        """Validate password confirmation"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        """Create new user"""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class AdminRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for admin registration via invitation"""
    
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    invitation_token = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'password', 'password_confirm', 'invitation_token']
    
    def validate_invitation_token(self, value):
        """Validate invitation token"""
        try:
            invitation = AdminInvitation.objects.get(token=value)
            if not invitation.is_valid:
                raise serializers.ValidationError("Invalid or expired invitation")
            self.invitation = invitation
            return value
        except AdminInvitation.DoesNotExist:
            raise serializers.ValidationError("Invalid invitation token")
    
    def validate(self, attrs):
        """Validate password confirmation"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        """Create admin user from invitation"""
        validated_data.pop('password_confirm')
        validated_data.pop('invitation_token')
        password = validated_data.pop('password')
        
        user = User.objects.create_user(
            email=self.invitation.email,
            role='admin',
            is_staff=True,
            **validated_data
        )
        user.set_password(password)
        user.save()
        
        # Mark invitation as accepted
        self.invitation.mark_as_accepted(user)
        
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    
    email = serializers.EmailField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        """Validate login credentials"""
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(request=self.context.get('request'),
                              username=email, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('Account is disabled')
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Email and password are required')


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user data"""
    
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name', 
                 'phone_number', 'role', 'is_email_verified', 'date_joined', 
                 'profile_image']
        read_only_fields = ['id', 'email', 'role', 'is_email_verified', 'date_joined']


class AdminInvitationSerializer(serializers.ModelSerializer):
    """Serializer for admin invitations"""
    
    invited_by_name = serializers.CharField(source='invited_by.full_name', read_only=True)
    invited_user_name = serializers.CharField(source='invited_user.full_name', read_only=True)
    is_expired = serializers.ReadOnlyField()
    is_valid = serializers.ReadOnlyField()
    
    class Meta:
        model = AdminInvitation
        fields = ['id', 'email', 'status', 'created_at', 'expires_at', 
                 'accepted_at', 'invited_by_name', 'invited_user_name', 
                 'is_expired', 'is_valid']
        read_only_fields = ['id', 'status', 'created_at', 'expires_at', 
                          'accepted_at', 'invited_by_name', 'invited_user_name']
    
    def validate_email(self, value):
        """Validate admin email domain"""
        if not value.endswith('@shoponline.com'):
            raise serializers.ValidationError(
                "Admin invitations must use @shoponline.com email addresses"
            )
        return value


class InvitationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating admin invitations"""
    
    class Meta:
        model = AdminInvitation
        fields = ['email']
    
    def validate_email(self, value):
        """Validate email for invitation"""
        if not value.endswith('@shoponline.com'):
            raise serializers.ValidationError(
                "Admin invitations must use @shoponline.com email addresses"
            )
        
        # Check if user already exists
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists")
        
        # Check if there's already a pending invitation
        if AdminInvitation.objects.filter(
            email=value, 
            status='pending'
        ).exists():
            raise serializers.ValidationError("Pending invitation already exists for this email")
        
        return value

