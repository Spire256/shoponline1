
# Notification cleanup command
# apps/notifications/management/commands/cleanup_notifications.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.notifications.models import Notification

class Command(BaseCommand):
    help = 'Clean up old notifications'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Delete notifications older than this many days',
        )
        parser.add_argument(
            '--read-only',
            action='store_true',
            help='Only delete read notifications',
        )

    def handle(self, *args, **options):
        days = options['days']
        read_only = options['read_only']
        
        cutoff_date = timezone.now() - timedelta(days=days)
        
        queryset = Notification.objects.filter(created_at__lt=cutoff_date)
        
        if read_only:
            queryset = queryset.filter(is_read=True)
        
        count = queryset.count()
        
        if count > 0:
            queryset.delete()
            self.stdout.write(
                self.style.SUCCESS(f'Deleted {count} old notifications')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS('No old notifications to delete')
            )
