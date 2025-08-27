# apps/categories/management/commands/cleanup_categories.py

from django.core.management.base import BaseCommand
from django.db.models import Count
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
        
        parser.add_argument(
            '--duplicates',
            action='store_true',
            help='Handle duplicate category names (case-insensitive)',
        )
        
        parser.add_argument(
            '--all',
            action='store_true',
            help='Run all cleanup operations',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        run_all = options['all']
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('DRY RUN MODE - No changes will be made')
            )

        # Clean up unused images
        if options['images'] or run_all:
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

        # Handle duplicate categories
        if options['duplicates'] or run_all:
            self.stdout.write('\nHandling duplicate categories...')
            self._handle_duplicates(dry_run)

        # Remove empty categories
        if options['empty'] or run_all:
            self.stdout.write('\nFinding empty categories...')
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
        if options['inactive'] or run_all:
            from django.utils import timezone
            from datetime import timedelta
            
            self.stdout.write('\nFinding old inactive categories...')
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
        self.stdout.write('\n' + '='*50)
        self.stdout.write('CATEGORY STATISTICS:')
        self.stdout.write('='*50)
        self.stdout.write(f'Total categories: {Category.objects.count()}')
        self.stdout.write(f'Active categories: {Category.objects.filter(is_active=True).count()}')
        self.stdout.write(f'Featured categories: {Category.objects.filter(featured=True).count()}')
        self.stdout.write(f'Root categories: {Category.objects.filter(parent=None).count()}')

    def _handle_duplicates(self, dry_run=False):
        """Handle duplicate category names (case-insensitive)"""
        
        # Find duplicates by case-insensitive name comparison
        # Using raw SQL for better performance with case-insensitive grouping
        from django.db import connection
        
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT UPPER(name) as upper_name, COUNT(*) as count
                FROM categories_category 
                WHERE is_deleted = false OR is_deleted IS NULL
                GROUP BY UPPER(name)
                HAVING COUNT(*) > 1
                ORDER BY count DESC
            """)
            
            duplicates_info = cursor.fetchall()
        
        if not duplicates_info:
            self.stdout.write('No duplicate categories found')
            return
        
        self.stdout.write(f'Found {len(duplicates_info)} groups of duplicate categories:')
        total_duplicates_removed = 0
        
        for upper_name, count in duplicates_info:
            self.stdout.write(f'\nProcessing duplicates for "{upper_name}" ({count} entries):')
            
            # Get all categories with this name (case-insensitive)
            categories = Category.objects.filter(
                name__iexact=upper_name
            ).exclude(
                is_deleted=True
            ).order_by('created_at', 'id')  # Keep the oldest one
            
            if categories.count() <= 1:
                continue
                
            # Keep the first (oldest) category
            keep_category = categories.first()
            duplicates_to_remove = categories[1:]
            
            self.stdout.write(f'  Keeping: "{keep_category.name}" (ID: {keep_category.id}, Created: {keep_category.created_at})')
            
            for duplicate in duplicates_to_remove:
                self.stdout.write(f'  Removing: "{duplicate.name}" (ID: {duplicate.id}, Created: {duplicate.created_at})')
                
                if not dry_run:
                    # Before deleting, transfer any relationships to the kept category
                    self._transfer_category_relationships(duplicate, keep_category)
                    
                    # Mark as deleted or actually delete based on your model setup
                    if hasattr(duplicate, 'is_deleted'):
                        duplicate.is_deleted = True
                        duplicate.save()
                    else:
                        duplicate.delete()
                    
                    total_duplicates_removed += 1
        
        if not dry_run and total_duplicates_removed > 0:
            self.stdout.write(
                self.style.SUCCESS(f'\nRemoved {total_duplicates_removed} duplicate categories')
            )

    def _transfer_category_relationships(self, from_category, to_category):
        """Transfer relationships from duplicate category to the kept one"""
        
        # Transfer products (if your model has this relationship)
        if hasattr(from_category, 'products'):
            products_moved = 0
            for product in from_category.products.all():
                product.category = to_category
                product.save()
                products_moved += 1
            
            if products_moved > 0:
                self.stdout.write(f'    Moved {products_moved} products to kept category')
        
        # Transfer subcategories (if parent-child relationship exists)
        if hasattr(from_category, 'subcategories'):
            subcategories_moved = 0
            for subcategory in from_category.subcategories.all():
                subcategory.parent = to_category
                subcategory.save()
                subcategories_moved += 1
            
            if subcategories_moved > 0:
                self.stdout.write(f'    Moved {subcategories_moved} subcategories to kept category')
        
        # Transfer any other relationships your model might have
        # Add more relationship transfers as needed based on your model structure