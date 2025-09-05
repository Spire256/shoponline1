from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.orders.models import Order
from apps.products.models import Product
from apps.categories.models import Category
from decimal import Decimal

User = get_user_model()

class Command(BaseCommand):
    help = 'Create test data for the application'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Creating test data...'))

        # Create admin user
        admin_user, created = User.objects.get_or_create(
            email='admin@shoponline.com',
            defaults={
                'first_name': 'Admin',
                'last_name': 'User',
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            admin_user.set_password('AdminPass123!')
            admin_user.save()
            self.stdout.write(f"✓ Created admin user: {admin_user.email}")
        else:
            self.stdout.write(f"- Admin user already exists: {admin_user.email}")

        # Create client user
        client_user, created = User.objects.get_or_create(
            email='client@gmail.com',
            defaults={
                'first_name': 'John',
                'last_name': 'Doe'
            }
        )
        if created:
            client_user.set_password('ClientPass123!')
            client_user.save()
            self.stdout.write(f"✓ Created client user: {client_user.email}")
        else:
            self.stdout.write(f"- Client user already exists: {client_user.email}")

        # Create category
        category, created = Category.objects.get_or_create(
            name='Electronics',
            defaults={'description': 'Electronic items'}
        )
        if created:
            self.stdout.write(f"✓ Created category: {category.name}")
        else:
            self.stdout.write(f"- Category already exists: {category.name}")

        # Create product
        product, created = Product.objects.get_or_create(
            name='Test Smartphone',
            defaults={
                'description': 'A test smartphone for payment testing',
                'price': Decimal('500000.00'),
                'category': category,
                'stock_quantity': 10,
                'is_active': True
            }
        )
        if created:
            self.stdout.write(f"✓ Created product: {product.name}")
        else:
            self.stdout.write(f"- Product already exists: {product.name}")

        # Create order with subtotal field
        order = Order.objects.create(
            user=client_user,
            subtotal=Decimal('500000.00'),  # Added subtotal field
            total_amount=Decimal('500000.00'),
            status='pending'
        )
        self.stdout.write(f"✓ Created order: {order.id}")

        self.stdout.write(self.style.SUCCESS('\n=== Test Data Created ==='))
        self.stdout.write(f"Admin User: {admin_user.email} (ID: {admin_user.id})")
        self.stdout.write(f"Client User: {client_user.email} (ID: {client_user.id})")
        self.stdout.write(f"Category: {category.name} (ID: {category.id})")
        self.stdout.write(f"Product: {product.name} (ID: {product.id})")
        self.stdout.write(f"Order: ID {order.id} (Status: {order.status})")