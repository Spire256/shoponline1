#!/usr/bin/env python
"""
Seed data script for ShopOnline Uganda
Creates initial data for development and testing
"""

import os
import sys
import random
from decimal import Decimal
from datetime import datetime, timedelta
from pathlib import Path

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'shoponline.settings.development')
import django
django.setup()

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.utils import timezone
from faker import Faker

# Import models
from apps.accounts.models import AdminInvitation
from apps.categories.models import Category
from apps.products.models import Product, ProductImage
from apps.flash_sales.models import FlashSale, FlashSaleProduct
from apps.orders.models import Order, OrderItem
from apps.payments.models import Payment, PaymentMethod, PaymentStatus, MobileMoneyPayment, CashOnDeliveryPayment
from apps.admin_dashboard.models import HomepageContent, Banner
from apps.notifications.models import Notification, NotificationType, NotificationPriority

User = get_user_model()
fake = Faker()

class DataSeeder:
    """Main data seeding class"""
    
    def __init__(self):
        self.fake = fake
        self.created_objects = {
            'users': [],
            'categories': [],
            'products': [],
            'flash_sales': [],
            'orders': [],
            'payments': [],
        }
    
    def create_users(self):
        """Create sample users"""
        print("Creating users...")
        
        # Create super admin
        super_admin, created = User.objects.get_or_create(
            email='admin@shoponline.com',
            defaults={
                'first_name': 'Super',
                'last_name': 'Admin',
                'is_staff': True,
                'is_superuser': True,
                'role': 'admin',
                'is_active': True,
            }
        )
        if created:
            super_admin.set_password('admin123')
            super_admin.save()
            print(f"Created super admin: {super_admin.email}")
        
        self.created_objects['users'].append(super_admin)
        
        # Create regular admins
        admin_emails = [
            'john.admin@shoponline.com',
            'jane.admin@shoponline.com',
            'peter.admin@shoponline.com'
        ]
        
        for email in admin_emails:
            admin, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': self.fake.first_name(),
                    'last_name': self.fake.last_name(),
                    'is_staff': True,
                    'role': 'admin',
                    'is_active': True,
                }
            )
            if created:
                admin.set_password('admin123')
                admin.save()
                print(f"Created admin: {admin.email}")
            
            self.created_objects['users'].append(admin)
        
        # Create client users
        for i in range(20):
            email = f"client{i+1}@gmail.com"
            client, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': self.fake.first_name(),
                    'last_name': self.fake.last_name(),
                    'phone_number': f"+256{random.randint(700000000, 799999999)}",
                    'role': 'client',
                    'is_active': True,
                }
            )
            if created:
                client.set_password('client123')
                client.save()
            
            self.created_objects['users'].append(client)
        
        print(f"Created {len(self.created_objects['users'])} users")
    
    def create_categories(self):
        """Create sample categories"""
        print("Creating categories...")
        
        categories_data = [
            {
                'name': 'Electronics',
                'description': 'Latest electronics and gadgets',
                'subcategories': ['Smartphones', 'Laptops', 'Tablets', 'Accessories']
            },
            {
                'name': 'Fashion',
                'description': 'Trendy fashion and clothing',
                'subcategories': ['Men\'s Clothing', 'Women\'s Clothing', 'Shoes', 'Bags']
            },
            {
                'name': 'Home & Garden',
                'description': 'Home improvement and garden supplies',
                'subcategories': ['Furniture', 'Kitchen', 'Garden Tools', 'Decor']
            },
            {
                'name': 'Sports & Fitness',
                'description': 'Sports equipment and fitness gear',
                'subcategories': ['Gym Equipment', 'Sports Wear', 'Outdoor Gear']
            },
            {
                'name': 'Books & Media',
                'description': 'Books, movies, and entertainment',
                'subcategories': ['Fiction Books', 'Educational', 'Movies', 'Music']
            },
            {
                'name': 'Health & Beauty',
                'description': 'Health and beauty products',
                'subcategories': ['Skincare', 'Makeup', 'Health Supplements', 'Personal Care']
            }
        ]
        
        for cat_data in categories_data:
            # Create main category
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={
                    'description': cat_data['description'],
                    'is_active': True,
                    'sort_order': random.randint(1, 100)
                }
            )
            if created:
                print(f"Created category: {category.name}")
            
            self.created_objects['categories'].append(category)
            
            # Create subcategories
            for sub_name in cat_data['subcategories']:
                subcategory, created = Category.objects.get_or_create(
                    name=sub_name,
                    parent=category,
                    defaults={
                        'description': f"{sub_name} in {category.name}",
                        'is_active': True,
                        'sort_order': random.randint(1, 100)
                    }
                )
                if created:
                    print(f"Created subcategory: {subcategory.name}")
                
                self.created_objects['categories'].append(subcategory)
        
        print(f"Created {len(self.created_objects['categories'])} categories")
    
    def create_products(self):
        """Create sample products"""
        print("Creating products...")
        
        # Sample product data for different categories
        products_data = {
            'Electronics': [
                {'name': 'Samsung Galaxy S23', 'price': 2500000, 'description': 'Latest Samsung smartphone with advanced features'},
                {'name': 'iPhone 14 Pro', 'price': 4000000, 'description': 'Apple iPhone with pro camera system'},
                {'name': 'Dell XPS 13 Laptop', 'price': 3500000, 'description': 'Powerful ultrabook for professionals'},
                {'name': 'iPad Air', 'price': 2000000, 'description': 'Versatile tablet for work and entertainment'},
                {'name': 'AirPods Pro', 'price': 800000, 'description': 'Wireless earbuds with noise cancellation'},
            ],
            'Fashion': [
                {'name': 'Designer Dress', 'price': 150000, 'description': 'Elegant dress for special occasions'},
                {'name': 'Men\'s Formal Shirt', 'price': 80000, 'description': 'Professional shirt for office wear'},
                {'name': 'Running Shoes', 'price': 200000, 'description': 'Comfortable shoes for running and sports'},
                {'name': 'Leather Handbag', 'price': 300000, 'description': 'Stylish leather handbag for women'},
                {'name': 'Men\'s Watch', 'price': 500000, 'description': 'Classic watch for men'},
            ],
            'Home & Garden': [
                {'name': 'Dining Table Set', 'price': 800000, 'description': '6-seater wooden dining table with chairs'},
                {'name': 'Kitchen Blender', 'price': 120000, 'description': 'High-power blender for smoothies and cooking'},
                {'name': 'Garden Hose', 'price': 50000, 'description': 'Durable garden hose for watering plants'},
                {'name': 'Wall Art', 'price': 75000, 'description': 'Beautiful wall art for home decoration'},
            ],
            'Sports & Fitness': [
                {'name': 'Treadmill', 'price': 1500000, 'description': 'Electric treadmill for home workouts'},
                {'name': 'Yoga Mat', 'price': 45000, 'description': 'Non-slip yoga mat for exercise'},
                {'name': 'Basketball', 'price': 60000, 'description': 'Official size basketball'},
                {'name': 'Gym Weights Set', 'price': 400000, 'description': 'Complete weights set for strength training'},
            ],
            'Health & Beauty': [
                {'name': 'Skincare Set', 'price': 180000, 'description': 'Complete skincare routine set'},
                {'name': 'Hair Dryer', 'price': 90000, 'description': 'Professional hair dryer with multiple settings'},
                {'name': 'Vitamin Supplements', 'price': 65000, 'description': 'Daily vitamin supplements for health'},
                {'name': 'Makeup Kit', 'price': 250000, 'description': 'Professional makeup kit with brushes'},
            ]
        }
        
        created_count = 0
        for category_name, products in products_data.items():
            try:
                category = Category.objects.get(name=category_name)
                
                for product_data in products:
                    product, created = Product.objects.get_or_create(
                        name=product_data['name'],
                        defaults={
                            'description': product_data['description'],
                            'short_description': product_data['description'][:200],
                            'price': Decimal(str(product_data['price'])),
                            'original_price': Decimal(str(product_data['price'] * 1.2)),  # 20% markup
                            'category': category,
                            'stock_quantity': random.randint(10, 100),
                            'status': 'published',
                            'condition': 'new',
                            'weight': Decimal(str(random.uniform(0.1, 5.0))),
                            'brand': self.fake.company(),
                            'is_active': True,
                            'is_featured': random.choice([True, False]),
                            'meta_title': product_data['name'],
                            'meta_description': product_data['description'][:160],
                        }
                    )
                    
                    if created:
                        created_count += 1
                        self.created_objects['products'].append(product)
                        print(f"Created product: {product.name}")
                        
                        # Add some random tags
                        tags = ['popular', 'bestseller', 'new', 'featured', 'sale']
                        product.tags = ', '.join(random.sample(tags, random.randint(1, 3)))
                        product.save()
                
            except Category.DoesNotExist:
                print(f"Category {category_name} not found, skipping products")
                continue
        
        print(f"Created {created_count} products")
    
    def create_flash_sales(self):
        """Create sample flash sales"""
        print("Creating flash sales...")
        
        if not self.created_objects['products']:
            print("No products available for flash sales")
            return
        
        admin_user = next((u for u in self.created_objects['users'] if u.role == 'admin'), None)
        if not admin_user:
            print("No admin user available for flash sales")
            return
        
        # Create active flash sale
        active_sale = FlashSale.objects.create(
            name="Weekend Flash Sale",
            description="Amazing discounts this weekend only!",
            discount_percentage=25,
            start_time=timezone.now() - timedelta(hours=2),
            end_time=timezone.now() + timedelta(hours=22),
            is_active=True,
            created_by=admin_user
        )
        
        # Add products to flash sale
        selected_products = random.sample(self.created_objects['products'], min(8, len(self.created_objects['products'])))
        for product in selected_products:
            FlashSaleProduct.objects.create(
                flash_sale=active_sale,
                product=product,
                original_price=product.price,
                flash_sale_price=product.price * Decimal('0.75'),  # 25% discount
                added_by=admin_user
            )
        
        self.created_objects['flash_sales'].append(active_sale)
        print(f"Created active flash sale: {active_sale.name}")
        
        # Create scheduled flash sale
        scheduled_sale = FlashSale.objects.create(
            name="Black Friday Special",
            description="Huge Black Friday discounts coming soon!",
            discount_percentage=40,
            start_time=timezone.now() + timedelta(days=3),
            end_time=timezone.now() + timedelta(days=4),
            is_active=True,
            created_by=admin_user
        )
        
        # Add different products to scheduled sale
        remaining_products = [p for p in self.created_objects['products'] if p not in selected_products]
        scheduled_products = random.sample(remaining_products, min(6, len(remaining_products)))
        for product in scheduled_products:
            FlashSaleProduct.objects.create(
                flash_sale=scheduled_sale,
                product=product,
                original_price=product.price,
                flash_sale_price=product.price * Decimal('0.60'),  # 40% discount
                added_by=admin_user
            )
        
        self.created_objects['flash_sales'].append(scheduled_sale)
        print(f"Created scheduled flash sale: {scheduled_sale.name}")
        
        # Create ended flash sale
        ended_sale = FlashSale.objects.create(
            name="Summer Sale 2024",
            description="Summer sale has ended",
            discount_percentage=30,
            start_time=timezone.now() - timedelta(days=10),
            end_time=timezone.now() - timedelta(days=3),
            is_active=False,
            created_by=admin_user
        )
        
        self.created_objects['flash_sales'].append(ended_sale)
        print(f"Created ended flash sale: {ended_sale.name}")
        
        print(f"Created {len(self.created_objects['flash_sales'])} flash sales")
    
    def create_orders(self):
        """Create sample orders"""
        print("Creating orders...")
        
        if not self.created_objects['products']:
            print("No products available for orders")
            return
        
        client_users = [u for u in self.created_objects['users'] if u.role == 'client']
        
        if not client_users:
            print("No client users available for orders")
            return
        
        # Order status choices based on your models
        order_statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
        payment_methods = [PaymentMethod.MTN_MOMO, PaymentMethod.AIRTEL_MONEY, PaymentMethod.CASH_ON_DELIVERY]
        
        for i in range(30):  # Create 30 sample orders
            customer = random.choice(client_users)
            
            # Create order
            order = Order.objects.create(
                customer=customer,
                customer_name=f"{customer.first_name} {customer.last_name}",
                customer_email=customer.email,
                customer_phone=customer.phone_number or f"+256{random.randint(700000000, 799999999)}",
                delivery_address=self.fake.address(),
                payment_method=random.choice(payment_methods),
                status=random.choice(order_statuses),
                order_notes=self.fake.text(max_nb_chars=100) if random.choice([True, False]) else "",
                created_at=self.fake.date_time_between(start_date='-30d', end_date='now', tzinfo=timezone.get_current_timezone())
            )
            
            # Add random products to order
            num_items = random.randint(1, 5)
            selected_products = random.sample(self.created_objects['products'], num_items)
            
            subtotal = Decimal('0')
            for product in selected_products:
                quantity = random.randint(1, 3)
                price = product.price
                
                # Check if product is in active flash sale
                flash_sale_product = FlashSaleProduct.objects.filter(
                    product=product,
                    flash_sale__is_active=True,
                    is_active=True
                ).filter(
                    flash_sale__start_time__lte=timezone.now(),
                    flash_sale__end_time__gt=timezone.now()
                ).first()
                
                if flash_sale_product:
                    price = flash_sale_product.flash_sale_price
                
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=quantity,
                    price=price
                )
                
                subtotal += price * quantity
            
            # Calculate totals
            tax_amount = subtotal * Decimal('0.18')  # 18% VAT
            delivery_fee = Decimal('10000') if subtotal < Decimal('100000') else Decimal('0')
            total_amount = subtotal + tax_amount + delivery_fee
            
            order.subtotal = subtotal
            order.tax_amount = tax_amount
            order.delivery_fee = delivery_fee
            order.total_amount = total_amount
            order.save()
            
            self.created_objects['orders'].append(order)
        
        print(f"Created {len(self.created_objects['orders'])} orders")
    
    def create_payments(self):
        """Create sample payments"""
        print("Creating payments...")
        
        if not self.created_objects['orders']:
            print("No orders available for payments")
            return
        
        payment_statuses = [PaymentStatus.COMPLETED, PaymentStatus.PENDING, PaymentStatus.FAILED]
        
        for order in self.created_objects['orders']:
            # Create main payment record
            payment = Payment.objects.create(
                order=order,
                user=order.customer,
                payment_method=order.payment_method,
                amount=order.total_amount,
                status=random.choice(payment_statuses),
                transaction_id=f"TXN{random.randint(1000000000, 9999999999)}",
                external_transaction_id=f"EXT{random.randint(100000, 999999)}",
                created_at=order.created_at + timedelta(minutes=random.randint(1, 30))
            )
            
            # Create specific payment details based on method
            if order.payment_method in [PaymentMethod.MTN_MOMO, PaymentMethod.AIRTEL_MONEY]:
                MobileMoneyPayment.objects.create(
                    payment=payment,
                    phone_number=order.customer_phone,
                    customer_name=order.customer_name,
                    provider_request_id=f"REQ{random.randint(1000000, 9999999)}",
                    provider_transaction_id=f"TXN{random.randint(1000000, 9999999)}" if payment.status == PaymentStatus.COMPLETED else "",
                    callback_received=payment.status == PaymentStatus.COMPLETED,
                )
            
            elif order.payment_method == PaymentMethod.CASH_ON_DELIVERY:
                admin_users = [u for u in self.created_objects['users'] if u.role == 'admin']
                CashOnDeliveryPayment.objects.create(
                    payment=payment,
                    delivery_address=order.delivery_address,
                    delivery_phone=order.customer_phone,
                    delivery_notes=f"COD delivery for order {order.order_number}",
                    assigned_to=random.choice(admin_users) if admin_users else None,
                    cash_received=payment.amount if payment.status == PaymentStatus.COMPLETED else Decimal('0'),
                    admin_notified=True,
                )
            
            self.created_objects['payments'].append(payment)
        
        print(f"Created {len(self.created_objects['payments'])} payments")
    
    def create_homepage_content(self):
        """Create sample homepage content"""
        print("Creating homepage content...")
        
        # Create homepage content
        homepage_content, created = HomepageContent.objects.get_or_create(
            defaults={
                'hero_title': 'Welcome to ShopOnline Uganda',
                'hero_subtitle': 'Your trusted e-commerce partner in Uganda',
                'hero_description': 'Discover amazing products with fast delivery and secure payments via Mobile Money.',
                'featured_section_title': 'Featured Products',
                'featured_section_description': 'Check out our most popular items',
                'flash_sales_enabled': True,
                'testimonials_enabled': True,
                'newsletter_enabled': True,
                'is_active': True
            }
        )
        
        if created:
            print("Created homepage content")
        
        # Create sample banners
        banner_data = [
            {
                'title': 'Electronics Sale',
                'description': 'Up to 50% off on electronics',
                'button_text': 'Shop Now',
                'button_url': '/category/electronics/',
                'is_active': True,
                'sort_order': 1
            },
            {
                'title': 'Fashion Week',
                'description': 'Latest fashion trends',
                'button_text': 'Explore',
                'button_url': '/category/fashion/',
                'is_active': True,
                'sort_order': 2
            },
            {
                'title': 'Home & Garden',
                'description': 'Transform your home',
                'button_text': 'Discover',
                'button_url': '/category/home-garden/',
                'is_active': True,
                'sort_order': 3
            }
        ]
        
        for banner_info in banner_data:
            banner, created = Banner.objects.get_or_create(
                title=banner_info['title'],
                defaults=banner_info
            )
            if created:
                print(f"Created banner: {banner.title}")
    
    def create_notifications(self):
        """Create sample notifications"""
        print("Creating notifications...")
        
        if not self.created_objects['orders']:
            print("No orders available for notifications")
            return
        
        admin_users = [u for u in self.created_objects['users'] if u.role == 'admin']
        
        notification_types = [
            NotificationType.ORDER_CREATED,
            NotificationType.PAYMENT_RECEIVED,
            NotificationType.COD_ORDER,
            NotificationType.LOW_STOCK
        ]
        
        for i in range(20):  # Create 20 sample notifications
            notification = Notification.objects.create(
                recipient=random.choice(admin_users),
                title=f"Notification {i+1}",
                message=self.fake.text(max_nb_chars=200),
                notification_type=random.choice(notification_types),
                priority=random.choice([NotificationPriority.LOW, NotificationPriority.MEDIUM, NotificationPriority.HIGH]),
                is_read=random.choice([True, False]),
                created_at=self.fake.date_time_between(start_date='-7d', end_date='now', tzinfo=timezone.get_current_timezone())
            )
        
        print("Created 20 notifications")
    
    def create_admin_invitations(self):
        """Create sample admin invitations"""
        print("Creating admin invitations...")
        
        super_admin = next((u for u in self.created_objects['users'] if u.role == 'admin' and u.is_superuser), None)
        
        if not super_admin:
            print("No super admin available for invitations")
            return
        
        # Create pending invitation
        AdminInvitation.objects.create(
            invited_by=super_admin,
            email='newadmin@shoponline.com',
            token='sample-invitation-token-123',
            expires_at=timezone.now() + timedelta(hours=48),
            status='pending'
        )
        
        # Create accepted invitation
        AdminInvitation.objects.create(
            invited_by=super_admin,
            email='acceptedadmin@shoponline.com',
            token='accepted-invitation-token-456',
            expires_at=timezone.now() - timedelta(hours=24),
            status='accepted',
            accepted_at=timezone.now() - timedelta(hours=12)
        )
        
        print("Created admin invitations")
    
    def run_seeding(self):
        """Run complete seeding process"""
        print("=" * 60)
        print("Starting ShopOnline Uganda Data Seeding")
        print("=" * 60)
        
        try:
            self.create_users()
            self.create_categories()
            self.create_products()
            self.create_flash_sales()
            self.create_orders()
            self.create_payments()
            self.create_homepage_content()
            self.create_notifications()
            self.create_admin_invitations()
            
            print("=" * 60)
            print("Data Seeding Completed Successfully!")
            print("=" * 60)
            print("\nSummary:")
            print(f"- Users: {len(self.created_objects['users'])}")
            print(f"- Categories: {len(self.created_objects['categories'])}")
            print(f"- Products: {len(self.created_objects['products'])}")
            print(f"- Flash Sales: {len(self.created_objects['flash_sales'])}")
            print(f"- Orders: {len(self.created_objects['orders'])}")
            print(f"- Payments: {len(self.created_objects['payments'])}")
            print("\nDefault Login Credentials:")
            print("Super Admin: admin@shoponline.com / admin123")
            print("Admin: john.admin@shoponline.com / admin123")
            print("Client: client1@gmail.com / client123")
            print("=" * 60)
            
        except Exception as e:
            print(f"Seeding failed: {e}")
            import traceback
            traceback.print_exc()
            return False
        
        return True

def main():
    """Main seeding function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='ShopOnline Uganda Data Seeding')
    parser.add_argument('--clear', action='store_true', help='Clear existing data before seeding')
    parser.add_argument('--users-only', action='store_true', help='Create only users')
    parser.add_argument('--products-only', action='store_true', help='Create only products and categories')
    args = parser.parse_args()
    
    if args.clear:
        print("Clearing existing data...")
        # Clear data in reverse order to respect foreign keys
        from django.apps import apps
        
        models_to_clear = [
            'notifications.Notification',
            'payments.CashOnDeliveryPayment',
            'payments.MobileMoneyPayment',
            'payments.Payment',
            'orders.OrderItem',
            'orders.Order',
            'flash_sales.FlashSaleProduct',
            'flash_sales.FlashSale',
            'products.ProductImage',
            'products.Product',
            'categories.Category',
            'accounts.AdminInvitation',
            'admin_dashboard.Banner',
            'admin_dashboard.HomepageContent',
        ]
        
        for model_name in models_to_clear:
            try:
                model = apps.get_model(model_name)
                count = model.objects.count()
                model.objects.all().delete()
                print(f"Cleared {count} {model_name} objects")
            except Exception as e:
                print(f"Error clearing {model_name}: {e}")
        
        # Clear users except superusers
        User.objects.filter(is_superuser=False).delete()
        print("Cleared non-superuser accounts")
    
    seeder = DataSeeder()
    
    if args.users_only:
        seeder.create_users()
    elif args.products_only:
        seeder.create_categories()
        seeder.create_products()
    else:
        success = seeder.run_seeding()
        sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()