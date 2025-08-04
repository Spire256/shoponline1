# apps/flash_sales/management/commands/flash_sale_analytics.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.flash_sales.models import FlashSale
from apps.flash_sales.services.flash_sale_service import FlashSaleService


class Command(BaseCommand):
    help = 'Generate flash sale analytics report'

    def add_arguments(self, parser):
        parser.add_argument(
            '--flash-sale-id',
            type=str,
            help='Specific flash sale ID to analyze',
        )
        parser.add_argument(
            '--active-only',
            action='store_true',
            help='Only analyze currently active flash sales',
        )

    def handle(self, *args, **options):
        flash_sale_id = options.get('flash_sale_id')
        active_only = options.get('active_only')

        if flash_sale_id:
            try:
                flash_sale = FlashSale.objects.get(id=flash_sale_id)
                self.analyze_flash_sale(flash_sale)
            except FlashSale.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Flash sale with ID {flash_sale_id} not found')
                )
        else:
            queryset = FlashSale.objects.all()
            if active_only:
                now = timezone.now()
                queryset = queryset.filter(
                    is_active=True,
                    start_time__lte=now,
                    end_time__gt=now
                )

            for flash_sale in queryset:
                self.analyze_flash_sale(flash_sale)
                self.stdout.write('---')

    def analyze_flash_sale(self, flash_sale):
        """Analyze a single flash sale"""
        analytics = FlashSaleService.get_flash_sale_analytics(flash_sale)
        
        self.stdout.write(f"Flash Sale: {analytics['flash_sale_name']}")
        self.stdout.write(f"Status: {analytics['status'].upper()}")
        self.stdout.write(f"Total Products: {analytics['total_products']}")
        self.stdout.write(f"Total Orders: {analytics['total_orders']}")
        self.stdout.write(f"Total Revenue: UGX {analytics['total_revenue']:,.2f}")
        self.stdout.write(f"Total Savings: UGX {analytics['total_savings']:,.2f}")
        self.stdout.write(f"Conversion Rate: {analytics['conversion_rate']}%")
        
        if analytics['top_products']:
            self.stdout.write("\nTop Performing Products:")
            for i, product in enumerate(analytics['top_products'][:5], 1):
                self.stdout.write(
                    f"  {i}. {product['product'].name} - "
                    f"Sold: {product['quantity_sold']}, "
                    f"Revenue: UGX {product['revenue']:,.2f}"
                )

