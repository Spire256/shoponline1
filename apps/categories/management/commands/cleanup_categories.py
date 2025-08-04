
# apps/categories/management/commands/cleanup_categories.py

from django.core.management.base import BaseCommand
from apps.categories.models import Category
from apps.categories.utils import cleanup_unused_category_images


class Command(BaseCommand):
    """
    Management command to clean up categories and related data
    """
    help = 'Clean up categories, remove unused images and fix data issues'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be cleaned up without actually doing it',
        )
        
        parser.add_argument(
            '--images',
            action='store_true',
            help='Clean up unused category images',
        )
        
        parser.add_argument(
            '--empty',
            action='store_true',
            help='Remove empty categories (no products or subcategories)',
        )
        
        parser.add_argument(
            '--inactive',
            action='store_true',
            help='Remove inactive categories that have been inactive for more than 30 days',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('DRY RUN MODE - No changes will be made')
            )

        # Clean up unused images
        if options['images']:
            self.stdout.write('Cleaning up unused category images...')
            if not dry_run:
                result = cleanup_unused_category_images()
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Deleted {result['deleted_images']} unused images out of {result['total_images']} total"
                    )
                )
            else:
                self.stdout.write('Would clean up unused category images')

        # Remove empty categories
        if options['empty']:
            self.stdout.write('Finding empty categories...')
            empty_categories = Category.objects.filter(
                products__isnull=True,
                subcategories__isnull=True
            ).distinct()
            
            if empty_categories.exists():
                self.stdout.write(f'Found {empty_categories.count()} empty categories:')
                for category in empty_categories:
                    self.stdout.write(f'  - {category.name}')
                
                if not dry_run:
                    deleted_count = empty_categories.count()
                    empty_categories.delete()
                    self.stdout.write(
                        self.style.SUCCESS(f'Deleted {deleted_count} empty categories')
                    )
            else:
                self.stdout.write('No empty categories found')

        # Remove old inactive categories
        if options['inactive']:
            from django.utils import timezone
            from datetime import timedelta
            
            cutoff_date = timezone.now() - timedelta(days=30)
            old_inactive = Category.objects.filter(
                is_active=False,
                updated_at__lt=cutoff_date,
                products__isnull=True,
                subcategories__isnull=True
            ).distinct()
            
            if old_inactive.exists():
                self.stdout.write(f'Found {old_inactive.count()} old inactive categories:')
                for category in old_inactive:
                    self.stdout.write(f'  - {category.name} (inactive since {category.updated_at})')
                
                if not dry_run:
                    deleted_count = old_inactive.count()
                    old_inactive.delete()
                    self.stdout.write(
                        self.style.SUCCESS(f'Deleted {deleted_count} old inactive categories')
                    )
            else:
                self.stdout.write('No old inactive categories found')

        # General statistics
        self.stdout.write('\nCategory Statistics:')
        self.stdout.write(f'Total categories: {Category.objects.count()}')
        self.stdout.write(f'Active categories: {Category.objects.filter(is_active=True).count()}')
        self.stdout.write(f'Featured categories: {Category.objects.filter(featured=True).count()}')
        self.stdout.write(f'Root categories: {Category.objects.filter(parent=None).count()}')

