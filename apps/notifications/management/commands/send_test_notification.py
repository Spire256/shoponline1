
# apps/notifications/management/commands/send_test_notification.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.notifications.utils import create_notification

User = get_user_model()

class Command(BaseCommand):
    help = 'Send test notification to admin users'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            help='Admin email to send test notification to',
        )
        parser.add_argument(
            '--type',
            type=str,
            default='system_alert',
            help='Notification type',
        )

    def handle(self, *args, **options):
        email = options['email']
        notification_type = options['type']

        if email:
            try:
                user = User.objects.get(email=email, is_staff=True)
                notification = create_notification(
                    recipient=user,
                    title='Test Notification',
                    message='This is a test notification from the management command.',
                    notification_type=notification_type,
                    priority='medium'
                )
                self.stdout.write(
                    self.style.SUCCESS(f'Test notification sent to {email}')
                )
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Admin user with email {email} not found')
                )
        else:
            # Send to all admins
            admins = User.objects.filter(is_staff=True)
            count = 0
            for admin in admins:
                create_notification(
                    recipient=admin,
                    title='Test Notification',
                    message='This is a test notification sent to all admins.',
                    notification_type=notification_type,
                    priority='medium'
                )
                count += 1
            
            self.stdout.write(
                self.style.SUCCESS(f'Test notification sent to {count} admin users')
            )
