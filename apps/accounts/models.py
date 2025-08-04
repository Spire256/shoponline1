#from django.db import models

# Create your models here.
# apps/accounts/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.core.validators import EmailValidator
import uuid
from datetime import timedelta

class User(AbstractUser):
    """Custom user model with email-based authentication and role management"""
    
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('client', 'Client'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, validators=[EmailValidator()])
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='client')
    is_email_verified = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)
    profile_image = models.ImageField(upload_to='users/profiles/', null=True, blank=True)
    
    # Remove username field - use email instead
    username = None
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    class Meta:
        db_table = 'accounts_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def is_admin(self):
        return self.role == 'admin'
    
    @property
    def is_client(self):
        return self.role == 'client'
    
    def save(self, *args, **kwargs):
        # Auto-determine role based on email domain
        if self.email:
            if self.email.endswith('@shoponline.com'):
                self.role = 'admin'
                self.is_staff = True
            elif self.email.endswith('@gmail.com'):
                self.role = 'client'
                self.is_staff = False
        
        super().save(*args, **kwargs)


class AdminInvitation(models.Model):
    """Model for managing admin invitations"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(validators=[EmailValidator()])
    token = models.CharField(max_length=255, unique=True)
    invited_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_invitations')
    invited_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='received_invitation')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'accounts_admin_invitation'
        verbose_name = 'Admin Invitation'
        verbose_name_plural = 'Admin Invitations'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Invitation to {self.email} - {self.status}"
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=48)
        if not self.token:
            self.token = str(uuid.uuid4())
        super().save(*args, **kwargs)
    
    @property
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    @property
    def is_valid(self):
        return self.status == 'pending' and not self.is_expired
    
    def mark_as_accepted(self, user):
        """Mark invitation as accepted and link to user"""
        self.status = 'accepted'
        self.accepted_at = timezone.now()
        self.invited_user = user
        self.save()
    
    def mark_as_expired(self):
        """Mark invitation as expired"""
        self.status = 'expired'
        self.save()


