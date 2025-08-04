
# apps/admin_dashboard/management/commands/setup_homepage.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.admin_dashboard.models import HomepageContent, SiteSettings, Banner

User = get_user_model()

class Command(BaseCommand):
    help = 'Set up initial homepage content and site settings'

    def add_arguments(self, parser):
        parser.add_argument(
            '--admin-email',
            type=str,
            default='admin@shoponline.com',
            help='Admin email to associate with created content'
        )

    def handle(self, *args, **options):
        admin_email = options['admin_email']
        
        try:
            # Get or create admin user
            admin_user = User.objects.filter(email=admin_email).first()
            if not admin_user:
                self.stdout.write(
                    self.style.WARNING(f'Admin user {admin_email} not found. Creating content without user association.')
                )
                admin_user = None

            # Create homepage content if not exists
            if not HomepageContent.objects.exists():
                homepage_content = HomepageContent.objects.create(
                    title='Welcome to ShopOnline Uganda',
                    subtitle='Your Premier Online Shopping Destination',
                    hero_text='Discover amazing products at unbeatable prices. Shop now and enjoy fast delivery across Uganda.',
                    meta_description='ShopOnline Uganda - Your trusted online marketplace for quality products at affordable prices.',
                    meta_keywords='online shopping, Uganda, ecommerce, products, delivery',
                    is_active=True,
                    updated_by=admin_user
                )
                self.stdout.write(
                    self.style.SUCCESS(f'Created homepage content: {homepage_content.title}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING('Homepage content already exists')
                )

            # Create site settings if not exists
            if not SiteSettings.objects.exists():
                site_settings = SiteSettings.objects.create(
                    site_name='ShopOnline Uganda',
                    contact_email='info@shoponline.com',
                    contact_phone='+256 700 000 000',
                    contact_address='Kampala, Uganda',
                    enable_flash_sales=True,
                    enable_cod=True,
                    enable_mtn_momo=True,
                    enable_airtel_money=True,
                    maintenance_mode=False,
                    updated_by=admin_user
                )
                self.stdout.write(
                    self.style.SUCCESS(f'Created site settings: {site_settings.site_name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING('Site settings already exist')
                )

            # Create sample banner if not exists
            if not Banner.objects.exists():
                banner = Banner.objects.create(
                    title='Welcome to ShopOnline',
                    description='Shop the best products at amazing prices',
                    banner_type='hero',
                    link_text='Shop Now',
                    order=1,
                    is_active=True,
                    created_by=admin_user
                )
                self.stdout.write(
                    self.style.SUCCESS(f'Created sample banner: {banner.title}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING('Banners already exist')
                )

            self.stdout.write(
                self.style.SUCCESS('Homepage setup completed successfully!')
            )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error setting up homepage: {str(e)}')
            )
