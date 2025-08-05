from django.shortcuts import render

# apps/accounts/views.py
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import login
from django.shortcuts import get_object_or_404
from .models import User, AdminInvitation
from .serializers import (
    UserRegistrationSerializer, AdminRegistrationSerializer,
    LoginSerializer, UserSerializer, AdminInvitationSerializer,
    InvitationCreateSerializer
)
from .services.invitation_service import InvitationService
from .permissions import IsAdminUser
from django.utils import timezone

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_client(request):
    """Register a new client user"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Registration successful',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_admin(request):
    """Register admin user via invitation token"""
    serializer = AdminRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Admin registration successful',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_user(request):
    """Login user and return JWT tokens"""
    serializer = LoginSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        
        # Update last login
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
        
        return Response({
            'message': 'Login successful',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_user(request):
    """Logout user by blacklisting refresh token"""
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    """View for user profile management"""
    
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class AdminInvitationListCreateView(generics.ListCreateAPIView):
    """View for listing and creating admin invitations"""
    
    permission_classes = [IsAdminUser]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return InvitationCreateSerializer
        return AdminInvitationSerializer
    
    def get_queryset(self):
        return AdminInvitation.objects.all()
    
    def perform_create(self, serializer):
        invitation = serializer.save(invited_by=self.request.user)
        # Send invitation email
        InvitationService.send_invitation_email(invitation)


class AdminInvitationDetailView(generics.RetrieveDestroyAPIView):
    """View for invitation details and cancellation"""
    
    queryset = AdminInvitation.objects.all()
    serializer_class = AdminInvitationSerializer
    permission_classes = [IsAdminUser]
    
    def destroy(self, request, *args, **kwargs):
        invitation = self.get_object()
        invitation.status = 'cancelled'
        invitation.save()
        return Response({'message': 'Invitation cancelled'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def validate_invitation(request, token):
    """Validate invitation token"""
    try:
        invitation = AdminInvitation.objects.get(token=token)
        if invitation.is_valid:
            return Response({
                'valid': True,
                'email': invitation.email,
                'invited_by': invitation.invited_by.full_name
            })
        else:
            return Response({
                'valid': False,
                'error': 'Invitation expired or already used'
            }, status=status.HTTP_400_BAD_REQUEST)
    except AdminInvitation.DoesNotExist:
        return Response({
            'valid': False,
            'error': 'Invalid invitation token'
        }, status=status.HTTP_404_NOT_FOUND)




