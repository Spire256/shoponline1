"""
Products App Model Tests
Test cases for product models
"""

from decimal import Decimal
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from apps.products.models import Product, ProductImage, ProductAttribute, ProductVariant
from apps.categories.models import Category


class ProductModelTest(TestCase):
    """Test cases for Product model"""
    
    def setUp(self):
        """Set up test data"""
        self.category = Category.objects.create(
            name="Electronics",
            description="Electronic products"
        )
        
        self.product_data = {
            'name': 'Test Product',
            'description': 'This is a test product description',
            'category': self.category,
            'price': Decimal('100.00'),
            'stock_quantity': 10
        }
    
    def test_product_creation(self):
        """Test basic product creation"""
        product = Product.objects.create(**self.product_data)
        
        self.assertEqual(product.name, 'Test Product')
        self.assertEqual(product.category, self.category)
        self.assertEqual(product.price, Decimal('100.00'))
        self.assertEqual(product.stock_quantity, 10)
        self.assertTrue(product.is_active)
        self.assertFalse(product.is_featured)
        self.assertIsNotNone(product.slug)
        self.assertIsNotNone(product.sku)
    
    def test_product_slug_generation(self):
        """Test automatic slug generation"""
        product = Product.objects.create(**self.product_data)
        self.assertEqual(product.slug, 'test-product')
        
        # Test slug uniqueness
        product2_data = self.product_data.copy()
        product2_data['name'] = 'Test Product'  # Same name
        product2 = Product.objects.create(**product2_data)
        self.assertEqual(product2.slug, 'test-product-1')
    
    def test_product_sku_generation(self):
        """Test automatic SKU generation"""
        product = Product.objects.create(**self.product_data)
        self.assertIsNotNone(product.sku)
        self.assertTrue(product.sku.startswith('ELE-'))  # Category prefix
        self.assertEqual(len(product.sku), 10)  # ELE-XXXXXX format
    
    def test_product_properties(self):
        """Test product computed properties"""
        # Test is_in_stock
        product = Product.objects.create(**self.product_data)
        self.assertTrue(product.is_in_stock)
        
        product.stock_quantity = 0
        product.save()
        self.assertFalse(product.is_in_stock)
        
        # Test is_on_sale
        product.original_price = Decimal('150.00')
        product.save()
        self.assertTrue(product.is_on_sale)
        
        # Test discount_percentage
        self.assertEqual(product.discount_percentage, 33)  # (150-100)/150 * 100
    
    def test_product_stock_operations(self):
        """Test stock manipulation methods"""
        product = Product.objects.create(**self.product_data)
        
        # Test reduce_stock
        product.reduce_stock(5)
        self.assertEqual(product.stock_quantity, 5)
        
        # Test increase_stock
        product.increase_stock(3)
        self.assertEqual(product.stock_quantity, 8)
        
        # Test reduce_stock beyond available
        product.reduce_stock(10)
        self.assertEqual(product.stock_quantity, 0)
    
    def test_product_validation(self):
        """Test product field validation"""
        # Test negative price
        invalid_data = self.product_data.copy()
        invalid_data['price'] = Decimal('-10.00')
        
        with self.assertRaises(ValidationError):
            product = Product(**invalid_data)
            product.full_clean()
    
    def test_product_str_representation(self):
        """Test string representation"""
        product = Product.objects.create(**self.product_data)
        self.assertEqual(str(product), 'Test Product')


class ProductImageModelTest(TestCase):
    """Test cases for ProductImage model"""
    
    def setUp(self):
        """Set up test data"""
        self.category = Category.objects.create(
            name="Electronics",
            description="Electronic products"
        )
        
        self.product = Product.objects.create(
            name='Test Product',
            description='Test description',
            category=self.category,
            price=Decimal('100.00')
        )
    
    def test_product_image_creation(self):
        """Test product image creation"""
        image = ProductImage.objects.create(
            product=self.product,
            alt_text='Test image',
            position=1
        )
        
        self.assertEqual(image.product, self.product)
        self.assertEqual(image.alt_text, 'Test image')
        self.assertEqual(image.position, 1)
        self.assertFalse(image.is_main)  # Will be set to True for first image
    
    def test_main_image_logic(self):
        """Test main image assignment logic"""
        # First image should automatically become main
        image1 = ProductImage.objects.create(
            product=self.product,
            alt_text='First image'
        )
        image1.refresh_from_db()
        self.assertTrue(image1.is_main)
        
        # Second image should not be main
        image2 = ProductImage.objects.create(
            product=self.product,
            alt_text='Second image'
        )
        self.assertFalse(image2.is_main)
        
        # Setting second image as main should unset first
        image2.is_main = True
        image2.save()
        
        image1.refresh_from_db()
        self.assertFalse(image1.is_main)
        self.assertTrue(image2.is_main)


class ProductAttributeModelTest(TestCase):
    """Test cases for ProductAttribute model"""
    
    def setUp(self):
        """Set up test data"""
        self.category = Category.objects.create(
            name="Electronics",
            description="Electronic products"
        )
        
        self.product = Product.objects.create(
            name='Test Product',
            description='Test description',
            category=self.category,
            price=Decimal('100.00')
        )
    
    def test_product_attribute_creation(self):
        """Test product attribute creation"""
        attribute = ProductAttribute.objects.create(
            product=self.product,
            name='Color',
            value='Red',
            position=1
        )
        
        self.assertEqual(attribute.product, self.product)
        self.assertEqual(attribute.name, 'Color')
        self.assertEqual(attribute.value, 'Red')
        self.assertEqual(attribute.position, 1)
    
    def test_unique_attribute_per_product(self):
        """Test unique constraint for attribute name per product"""
        ProductAttribute.objects.create(
            product=self.product,
            name='Color',
            value='Red'
        )
        
        # Should raise IntegrityError for duplicate attribute name
        with self.assertRaises(IntegrityError):
            ProductAttribute.objects.create(
                product=self.product,
                name='Color',
                value='Blue'
            )
    
    def test_attribute_str_representation(self):
        """Test string representation"""
        attribute = ProductAttribute.objects.create(
            product=self.product,
            name='Color',
            value='Red'
        )
        
        expected_str = f"{self.product.name} - Color: Red"
        self.assertEqual(str(attribute), expected_str)


class ProductVariantModelTest(TestCase):
    """Test cases for ProductVariant model"""
    
    def setUp(self):
        """Set up test data"""
        self.category = Category.objects.create(
            name="Clothing",
            description="Clothing products"
        )
        
        self.product = Product.objects.create(
            name='Test T-Shirt',
            description='Test t-shirt',
            category=self.category,
            price=Decimal('50.00')
        )
    
    def test_product_variant_creation(self):
        """Test product variant creation"""
        variant = ProductVariant.objects.create(
            product=self.product,
            name='Small Red',
            price=Decimal('45.00'),
            stock_quantity=5,
            color='Red',
            size='S'
        )
        
        self.assertEqual(variant.product, self.product)
        self.assertEqual(variant.name, 'Small Red')
        self.assertEqual(variant.price, Decimal('45.00'))
        self.assertEqual(variant.stock_quantity, 5)
        self.assertEqual(variant.color, 'Red')
        self.assertEqual(variant.size, 'S')
        self.assertTrue(variant.is_active)
        self.assertIsNotNone(variant.sku)
    
    def test_variant_sku_generation(self):
        """Test variant SKU generation"""
        variant = ProductVariant.objects.create(
            product=self.product,
            name='Medium Blue',
            price=Decimal('50.00')
        )
        
        self.assertIsNotNone(variant.sku)
        self.assertTrue(variant.sku.startswith(self.product.sku))
    
    def test_variant_str_representation(self):
        """Test string representation"""
        variant = ProductVariant.objects.create(
            product=self.product,
            name='Large Green',
            price=Decimal('55.00')
        )
        
        expected_str = f"{self.product.name} - Large Green"
        self.assertEqual(str(variant), expected_str)


class ProductManagerTest(TestCase):
    """Test cases for Product manager methods"""
    
    def setUp(self):
        """Set up test data"""
        self.category = Category.objects.create(
            name="Electronics",
            description="Electronic products"
        )
        
        # Create test products
        self.active_product = Product.objects.create(
            name='Active Product',
            description='Active product',
            category=self.category,
            price=Decimal('100.00'),
            is_active=True,
            stock_quantity=10
        )
        
        self.inactive_product = Product.objects.create(
            name='Inactive Product',
            description='Inactive product',
            category=self.category,
            price=Decimal('150.00'),
            is_active=False,
            stock_quantity=5
        )
        
        self.featured_product = Product.objects.create(
            name='Featured Product',
            description='Featured product',
            category=self.category,
            price=Decimal('200.00'),
            is_active=True,
            is_featured=True,
            stock_quantity=3
        )
        
        self.out_of_stock_product = Product.objects.create(
            name='Out of Stock Product',
            description='Out of stock product',
            category=self.category,
            price=Decimal('75.00'),
            is_active=True,
            stock_quantity=0
        )
    
    def test_active_manager_method(self):
        """Test active() manager method"""
        active_products = Product.objects.active()
        self.assertEqual(active_products.count(), 3)  # active, featured, out_of_stock
        self.assertIn(self.active_product, active_products)
        self.assertIn(self.featured_product, active_products)
        self.assertNotIn(self.inactive_product, active_products)
    
    def test_featured_manager_method(self):
        """Test featured() manager method"""
        featured_products = Product.objects.featured()
        self.assertEqual(featured_products.count(), 1)
        self.assertIn(self.featured_product, featured_products)
    
    def test_in_stock_manager_method(self):
        """Test in_stock() manager method"""
        in_stock_products = Product.objects.in_stock()
        self.assertEqual(in_stock_products.count(), 2)  # active and featured
        self.assertIn(self.active_product, in_stock_products)
        self.assertIn(self.featured_product, in_stock_products)
        self.assertNotIn(self.out_of_stock_product, in_stock_products)
    
    def test_by_category_manager_method(self):
        """Test by_category() manager method"""
        category_products = Product.objects.by_category(self.category)
        self.assertEqual(category_products.count(), 3)  # All active products in category
    
    def test_search_manager_method(self):
        """Test search() manager method"""
        search_results = Product.objects.search('Featured')
        self.assertEqual(search_results.count(), 1)
        self.assertIn(self.featured_product, search_results)
        
        search_results = Product.objects.search('Product')
        self.assertEqual(search_results.count(), 3)  # All active products contain "Product"
    
    def test_price_range_manager_method(self):
        """Test price_range() manager method"""
        # Test min price filter
        expensive_products = Product.objects.price_range(min_price=Decimal('150.00'))
        self.assertEqual(expensive_products.count(), 1)
        self.assertIn(self.featured_product, expensive_products)
        
        # Test max price filter
        cheap_products = Product.objects.price_range(max_price=Decimal('100.00'))
        self.assertEqual(cheap_products.count(), 2)  # active and out_of_stock
        
        # Test price range
        mid_range_products = Product.objects.price_range(
            min_price=Decimal('75.00'),
            max_price=Decimal('150.00')
        )
        self.assertEqual(mid_range_products.count(), 2)