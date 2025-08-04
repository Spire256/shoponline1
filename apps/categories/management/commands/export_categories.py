# apps/categories/management/commands/export_categories.py

from django.core.management.base import BaseCommand
from apps.categories.utils import export_categories_to_csv
import os


class Command(BaseCommand):
    """
    Management command to export categories to CSV
    """
    help = 'Export categories to CSV file'

    def add_arguments(self, parser):
        parser.add_argument(
            '--output',
            type=str,
            default='categories_export.csv',
            help='Output CSV file name (default: categories_export.csv)',
        )

    def handle(self, *args, **options):
        output_file = options['output']
        
        self.stdout.write('Exporting categories to CSV...')
        
        try:
            csv_content = export_categories_to_csv()
            
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(csv_content)
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully exported categories to {output_file}'
                )
            )
            
            # Show file size
            file_size = os.path.getsize(output_file)
            self.stdout.write(f'File size: {file_size} bytes')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error exporting categories: {str(e)}')
            )