# apps/accounts/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User
from .services.email_service import EmailService

@receiver(post_save, sender=User)
def user_post_save(sender, instance, created, **kwargs):
    """Handle user creation signals"""
    if created:
        # Send welcome email to new users
        EmailService.send_welcome_email(instance)
