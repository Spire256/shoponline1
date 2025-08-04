
# apps/accounts/management/commands/cleanup_expired_invitations.py
from django.core.management.base import BaseCommand
from apps.accounts.services.invitation_service import InvitationService

class Command(BaseCommand):
    help = 'Clean up expired admin invitations'
    
    def handle(self, *args, **options):
        cleaned_count = InvitationService.cleanup_expired_invitations()
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully cleaned up {cleaned_count} expired invitations'
            )
        )

