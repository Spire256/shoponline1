# apps/categories/management/commands/diagnose_categories.py

from django.core.management.base import BaseCommand
from apps.categories.models import Category
from django.db.models import Count


class Command(BaseCommand):
    """
    Diagnostic command to check category status and find potential issues
    """
    help = 'Diagnose category database status and potential issues'

    def handle(self, *args, **options):
        self.stdout.write('='*60)
        self.stdout.write('CATEGORY DATABASE DIAGNOSTICS')
        self.stdout.write('='*60)
        
        # Basic stats
        total_categories = Category.objects.count()
        active_categories = Category.objects.filter(is_active=True).count() if hasattr(Category, 'is_active') else 'N/A'
        deleted_categories = Category.objects.filter(is_deleted=True).count() if hasattr(Category, 'is_deleted') else 'N/A'
        
        self.stdout.write(f'Total categories: {total_categories}')
        self.stdout.write(f'Active categories: {active_categories}')
        self.stdout.write(f'Deleted categories: {deleted_categories}')
        
        # Check for exact duplicates (case-sensitive)
        self.stdout.write('\n' + '-'*40)
        self.stdout.write('EXACT DUPLICATE NAMES (case-sensitive):')
        self.stdout.write('-'*40)
        
        exact_duplicates = Category.objects.values('name').annotate(
            count=Count('id')
        ).filter(count__gt=1).order_by('-count')
        
        if exact_duplicates:
            for dup in exact_duplicates:
                self.stdout.write(f'"{dup["name"]}" - {dup["count"]} entries')
                categories = Category.objects.filter(name=dup['name'])
                for cat in categories:
                    status = []
                    if hasattr(cat, 'is_active'):
                        status.append(f'active: {cat.is_active}')
                    if hasattr(cat, 'is_deleted'):
                        status.append(f'deleted: {cat.is_deleted}')
                    status_str = f' ({", ".join(status)})' if status else ''
                    self.stdout.write(f'  ID: {cat.id}, Created: {cat.created_at}{status_str}')
        else:
            self.stdout.write('No exact duplicates found')
        
        # Check for case-insensitive duplicates
        self.stdout.write('\n' + '-'*40)
        self.stdout.write('CASE-INSENSITIVE DUPLICATES:')
        self.stdout.write('-'*40)
        
        all_categories = Category.objects.all()
        name_groups = {}
        
        for category in all_categories:
            upper_name = category.name.upper()
            if upper_name not in name_groups:
                name_groups[upper_name] = []
            name_groups[upper_name].append(category)
        
        case_duplicates = {name: cats for name, cats in name_groups.items() if len(cats) > 1}
        
        if case_duplicates:
            for upper_name, categories in case_duplicates.items():
                self.stdout.write(f'"{upper_name}" - {len(categories)} variations:')
                for cat in sorted(categories, key=lambda x: x.created_at):
                    status = []
                    if hasattr(cat, 'is_active'):
                        status.append(f'active: {cat.is_active}')
                    if hasattr(cat, 'is_deleted'):
                        status.append(f'deleted: {cat.is_deleted}')
                    status_str = f' ({", ".join(status)})' if status else ''
                    self.stdout.write(f'  "{cat.name}" - ID: {cat.id}, Created: {cat.created_at}{status_str}')
        else:
            self.stdout.write('No case-insensitive duplicates found')
        
        # Check for similar names (like "Fashion & Clothing" vs "Fashion & Apparel")
        self.stdout.write('\n' + '-'*40)
        self.stdout.write('SIMILAR FASHION-RELATED CATEGORIES:')
        self.stdout.write('-'*40)
        
        fashion_categories = Category.objects.filter(
            name__icontains='fashion'
        ).union(
            Category.objects.filter(name__icontains='clothing')
        ).union(
            Category.objects.filter(name__icontains='apparel')
        )
        
        if fashion_categories:
            for cat in fashion_categories.order_by('name'):
                status = []
                if hasattr(cat, 'is_active'):
                    status.append(f'active: {cat.is_active}')
                if hasattr(cat, 'is_deleted'):
                    status.append(f'deleted: {cat.is_deleted}')
                status_str = f' ({", ".join(status)})' if status else ''
                self.stdout.write(f'  "{cat.name}" - ID: {cat.id}{status_str}')
        else:
            self.stdout.write('No fashion-related categories found')
        
        # List all categories for reference
        self.stdout.write('\n' + '-'*40)
        self.stdout.write('ALL CATEGORIES:')
        self.stdout.write('-'*40)
        
        all_cats = Category.objects.all().order_by('name')
        for cat in all_cats:
            status = []
            if hasattr(cat, 'is_active'):
                status.append(f'active: {cat.is_active}')
            if hasattr(cat, 'is_deleted'):
                status.append(f'deleted: {cat.is_deleted}')
            if hasattr(cat, 'parent'):
                parent_info = f'parent: {cat.parent.name if cat.parent else None}'
                status.append(parent_info)
            status_str = f' ({", ".join(status)})' if status else ''
            self.stdout.write(f'  "{cat.name}" - ID: {cat.id}{status_str}')
        
        self.stdout.write('\n' + '='*60)
        self.stdout.write('END DIAGNOSTICS')
        self.stdout.write('='*60)