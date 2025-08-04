
# apps/categories/management/commands/create_sample_categories.py

from django.core.management.base import BaseCommand
from apps.categories.models import Category


class Command(BaseCommand):
    """
    Management command to create sample categories for development/testing
    """
    help = 'Create sample categories for development and testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing categories before creating samples',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing categories...')
            Category.objects.all().delete()
            self.stdout.write(
                self.style.SUCCESS('Successfully cleared existing categories')
            )

        # Sample category data
        categories_data = [
            {
                'name': 'Electronics',
                'description': 'Electronic devices and gadgets',
                'featured': True,
                'sort_order': 1,
                'subcategories': [
                    {
                        'name': 'Smartphones',
                        'description': 'Mobile phones and accessories',
                        'sort_order': 1
                    },
                    {
                        'name': 'Laptops & Computers',
                        'description': 'Computers, laptops and accessories',
                        'sort_order': 2
                    },
                    {
                        'name': 'Audio & Headphones',
                        'description': 'Speakers, headphones and audio equipment',
                        'sort_order': 3
                    },
                    {
                        'name': 'Gaming',
                        'description': 'Gaming consoles, games and accessories',
                        'sort_order': 4
                    }
                ]
            },
            {
                'name': 'Fashion & Clothing',
                'description': 'Clothing, shoes and fashion accessories',
                'featured': True,
                'sort_order': 2,
                'subcategories': [
                    {
                        'name': "Men's Clothing",
                        'description': 'Clothing for men',
                        'sort_order': 1
                    },
                    {
                        'name': "Women's Clothing",
                        'description': 'Clothing for women',
                        'sort_order': 2
                    },
                    {
                        'name': 'Shoes',
                        'description': 'Footwear for all occasions',
                        'sort_order': 3
                    },
                    {
                        'name': 'Accessories',
                        'description': 'Fashion accessories and jewelry',
                        'sort_order': 4
                    }
                ]
            },
            {
                'name': 'Home & Garden',
                'description': 'Home improvement and garden supplies',
                'featured': True,
                'sort_order': 3,
                'subcategories': [
                    {
                        'name': 'Furniture',
                        'description': 'Home and office furniture',
                        'sort_order': 1
                    },
                    {
                        'name': 'Kitchen & Dining',
                        'description': 'Kitchen appliances and dining essentials',
                        'sort_order': 2
                    },
                    {
                        'name': 'Garden & Outdoor',
                        'description': 'Gardening tools and outdoor equipment',
                        'sort_order': 3
                    },
                    {
                        'name': 'Home Decor',
                        'description': 'Decorative items for your home',
                        'sort_order': 4
                    }
                ]
            },
            {
                'name': 'Sports & Fitness',
                'description': 'Sports equipment and fitness gear',
                'featured': False,
                'sort_order': 4,
                'subcategories': [
                    {
                        'name': 'Fitness Equipment',
                        'description': 'Home gym and fitness equipment',
                        'sort_order': 1
                    },
                    {
                        'name': 'Sports Gear',
                        'description': 'Equipment for various sports',
                        'sort_order': 2
                    },
                    {
                        'name': 'Outdoor Activities',
                        'description': 'Camping, hiking and outdoor gear',
                        'sort_order': 3
                    }
                ]
            },
            {
                'name': 'Books & Media',
                'description': 'Books, movies, music and educational materials',
                'featured': False,
                'sort_order': 5,
                'subcategories': [
                    {
                        'name': 'Books',
                        'description': 'Physical and digital books',
                        'sort_order': 1
                    },
                    {
                        'name': 'Movies & TV',
                        'description': 'DVDs, Blu-rays and digital media',
                        'sort_order': 2
                    },
                    {
                        'name': 'Music',
                        'description': 'CDs, vinyl and digital music',
                        'sort_order': 3
                    }
                ]
            },
            {
                'name': 'Health & Beauty',
                'description': 'Health products and beauty essentials',
                'featured': True,
                'sort_order': 6,
                'subcategories': [
                    {
                        'name': 'Skincare',
                        'description': 'Skincare products and treatments',
                        'sort_order': 1
                    },
                    {
                        'name': 'Makeup',
                        'description': 'Cosmetics and makeup products',
                        'sort_order': 2
                    },
                    {
                        'name': 'Health Supplements',
                        'description': 'Vitamins and health supplements',
                        'sort_order': 3
                    },
                    {
                        'name': 'Personal Care',
                        'description': 'Personal hygiene and care products',
                        'sort_order': 4
                    }
                ]
            }
        ]

        created_count = 0
        
        for category_data in categories_data:
            # Create parent category
            subcategories_data = category_data.pop('subcategories', [])
            
            parent_category, created = Category.objects.get_or_create(
                name=category_data['name'],
                defaults=category_data
            )
            
            if created:
                created_count += 1
                self.stdout.write(f'Created category: {parent_category.name}')
            
            # Create subcategories
            for subcat_data in subcategories_data:
                subcat_data['parent'] = parent_category
                subcategory, created = Category.objects.get_or_create(
                    name=subcat_data['name'],
                    parent=parent_category,
                    defaults=subcat_data
                )
                
                if created:
                    created_count += 1
                    self.stdout.write(f'  Created subcategory: {subcategory.name}')

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {created_count} categories'
            )
        )

