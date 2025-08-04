# apps/flash_sales/management/commands/cleanup_expired_flash_sales.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.flash_sales.services.flash_sale_service import FlashSaleService


class Command(BaseCommand):
    help = 'Cleanup expired flash sales'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be cleaned up without actually doing it',
        )

    def handle(self, *args, **options):
        self.stdout.write('Starting flash sales cleanup...')
        
        if options['dry_run']:
            # Show what would be cleaned up
            from apps.flash_sales.models import FlashSale
            expired_sales = FlashSale.objects.filter(
                end_time__lt=timezone.now(),
                is_active=True
            )
            
            self.stdout.write(f'Would deactivate {expired_sales.count()} expired flash sales:')
            for sale in expired_sales:
                self.stdout.write(f'  - {sale.name} (ended: {sale.end_time})')
        else:
            updated_count = FlashSaleService.cleanup_expired_flash_sales()
            self.stdout.write(
                self.style.SUCCESS(f'Successfully deactivated {updated_count} expired flash sales')
            )
