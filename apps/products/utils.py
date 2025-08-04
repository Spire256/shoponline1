"""
Products App Utilities
Helper functions and utilities for product operations
"""

import re
import uuid
import random
import string
from decimal import Decimal, ROUND_HALF_UP
from django.utils.text import slugify
from django.core.validators import ValidationError
from django.utils import timezone
from datetime import datetime, timedelta


class ProductUtils:
    """Utility class for product-related helper functions"""
    
    @staticmethod
    def generate_sku(category_name=None, product_name=None, length=8):
        """
        Generate unique SKU for product
        Format: CAT-XXXXXXXX (category prefix + random alphanumeric)
        """
        # Get category prefix
        if category_name:
            prefix = re.sub(r'[^A-Za-z]', '', category_name)[:3].upper()
        else:
            prefix = 'PRD'
        
        if not prefix:
            prefix = 'PRD'
        
        # Generate random alphanumeric suffix
        suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
        
        # Combine prefix and suffix
        sku = f"{prefix}-{suffix}"
        
        return sku
    
    @staticmethod
    def validate_sku(sku):
        """
        Validate SKU format
        """
        if not sku:
            return False
        
        # SKU should be alphanumeric with hyphens, 6-20 characters
        pattern = r'^[A-Z0-9\-]{6,20}$'
        return bool(re.match(pattern, sku.upper()))
    
    @staticmethod
    def generate_slug(name, existing_slugs=None):
        """
        Generate unique slug for product
        """
        base_slug = slugify(name)
        
        if not existing_slugs:
            return base_slug
        
        # Ensure uniqueness
        if base_slug not in existing_slugs:
            return base_slug
        
        # Add number suffix if slug exists
        counter = 1
        while f"{base_slug}-{counter}" in existing_slugs:
            counter += 1
        
        return f"{base_slug}-{counter}"
    
    @staticmethod
    def format_price(price, currency='UGX'):
        """
        Format price for display in Uganda Shillings
        """
        if not price:
            return f"0 {currency}"
        
        # Round to nearest whole number for UGX
        if currency == 'UGX':
            price = price.quantize(Decimal('1'), rounding=ROUND_HALF_UP)
            return f"{price:,.0f} {currency}"
        else:
            # For other currencies, keep 2 decimal places
            price = price.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            return f"{price:,.2f} {currency}"
    
    @staticmethod
    def calculate_discount_percentage(original_price, sale_price):
        """
        Calculate discount percentage
        """
        if not original_price or not sale_price or original_price <= sale_price:
            return 0
        
        discount = ((original_price - sale_price) / original_price) * 100
        return round(discount, 2)
    
    @staticmethod
    def calculate_profit_margin(cost_price, selling_price):
        """
        Calculate profit margin percentage
        """
        if not cost_price or not selling_price or selling_price <= cost_price:
            return 0
        
        profit = selling_price - cost_price
        margin = (profit / selling_price) * 100
        return round(margin, 2)
    
    @staticmethod
    def validate_price(price):
        """
        Validate price value
        """
        if not price:
            raise ValidationError("Price is required")
        
        if price <= 0:
            raise ValidationError("Price must be greater than 0")
        
        if price > Decimal('99999999.99'):
            raise ValidationError("Price is too large")
        
        return True
    
    @staticmethod
    def validate_weight(weight):
        """
        Validate weight value (in kg)
        """
        if weight is not None:
            if weight < 0:
                raise ValidationError("Weight cannot be negative")
            
            if weight > Decimal('9999.99'):
                raise ValidationError("Weight is too large")
        
        return True
    
    @staticmethod
    def parse_dimensions(dimensions_string):
        """
        Parse dimensions string (e.g., "30x20x10") into dict
        """
        if not dimensions_string:
            return None
        
        # Common formats: "30x20x10", "30 x 20 x 10", "30cm x 20cm x 10cm"
        clean_string = re.sub(r'[^\d\.\sx]', '', dimensions_string.lower())
        parts = re.split(r'[x\s]+', clean_string.strip())
        
        # Filter out empty parts
        parts = [p.strip() for p in parts if p.strip()]
        
        if len(parts) >= 3:
            try:
                return {
                    'length': float(parts[0]),
                    'width': float(parts[1]),
                    'height': float(parts[2])
                }
            except ValueError:
                pass
        
        return None
    
    @staticmethod
    def format_dimensions(length, width, height, unit='cm'):
        """
        Format dimensions for display
        """
        if not all([length, width, height]):
            return None
        
        return f"{length:.1f} x {width:.1f} x {height:.1f} {unit}"
    
    @staticmethod
    def generate_barcode():
        """
        Generate simple barcode (13 digits)
        """
        # Generate 12 random digits
        digits = [random.randint(0, 9) for _ in range(12)]
        
        # Calculate check digit (simple modulo 10)
        check_digit = (10 - (sum(digits) % 10)) % 10
        digits.append(check_digit)
        
        return ''.join(map(str, digits))
    
    @staticmethod
    def validate_stock_quantity(quantity):
        """
        Validate stock quantity
        """
        if quantity < 0:
            raise ValidationError("Stock quantity cannot be negative")
        
        if quantity > 999999:
            raise ValidationError("Stock quantity is too large")
        
        return True
    
    @staticmethod
    def calculate_shipping_weight(product):
        """
        Calculate shipping weight (product weight + packaging)
        """
        base_weight = product.weight or Decimal('0.5')  # Default 0.5kg
        packaging_weight = Decimal('0.1')  # Default packaging weight
        
        return base_weight + packaging_weight
    
    @staticmethod
    def is_bulk_discount_eligible(quantity, min_quantity=10):
        """
        Check if quantity qualifies for bulk discount
        """
        return quantity >= min_quantity
    
    @staticmethod
    def calculate_bulk_discount(price, quantity, discount_tiers=None):
        """
        Calculate bulk discount based on quantity
        """
        if not discount_tiers:
            # Default discount tiers
            discount_tiers = [
                {'min_qty': 10, 'discount': 5},   # 5% for 10+
                {'min_qty': 50, 'discount': 10},  # 10% for 50+
                {'min_qty': 100, 'discount': 15}, # 15% for 100+
            ]
        
        # Find applicable discount
        applicable_discount = 0
        for tier in sorted(discount_tiers, key=lambda x: x['min_qty'], reverse=True):
            if quantity >= tier['min_qty']:
                applicable_discount = tier['discount']
                break
        
        if applicable_discount > 0:
            discount_amount = price * (Decimal(applicable_discount) / 100)
            return price - discount_amount, applicable_discount
        
        return price, 0
    
    @staticmethod
    def generate_product_code(category_id, sequence_number):
        """
        Generate product code based on category and sequence
        """
        category_code = f"{category_id:03d}"
        sequence_code = f"{sequence_number:06d}"
        return f"P{category_code}{sequence_code}"
    
    @staticmethod
    def validate_product_images(images):
        """
        Validate product images list
        """
        if not images:
            raise ValidationError("At least one product image is required")
        
        if len(images) > 10:
            raise ValidationError("Maximum 10 images allowed per product")
        
        # Check for duplicate main images
        main_images = [img for img in images if getattr(img, 'is_main', False)]
        if len(main_images) > 1:
            raise ValidationError("Only one image can be marked as main")
        
        if len(main_images) == 0:
            # Auto-assign first image as main
            if images:
                images[0].is_main = True
        
        return True
    
    @staticmethod
    def extract_tags_from_text(text, max_tags=10):
        """
        Extract potential tags from product description
        """
        if not text:
            return []
        
        # Common words to exclude
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
            'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
            'this', 'that', 'these', 'those', 'it', 'its', 'you', 'your', 'we',
            'our', 'they', 'their', 'from', 'up', 'out', 'if', 'about'
        }
        
        # Extract words (alphanumeric only, 3+ characters)
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        
        # Filter out stop words and duplicates
        tags = []
        seen = set()
        
        for word in words:
            if word not in stop_words and word not in seen and len(word) >= 3:
                tags.append(word.capitalize())
                seen.add(word)
                
                if len(tags) >= max_tags:
                    break
        
        return tags
    
    @staticmethod
    def calculate_popularity_score(product):
        """
        Calculate product popularity score based on views, orders, rating
        """
        view_score = min(product.view_count / 100, 10)  # Max 10 points for views
        order_score = min(product.order_count * 2, 20)  # Max 20 points for orders
        rating_score = product.rating_average or 0      # Max 5 points for rating
        
        # Recent activity bonus (products updated in last 30 days)
        recency_bonus = 0
        if product.updated_at:
            days_since_update = (timezone.now() - product.updated_at).days
            if days_since_update <= 30:
                recency_bonus = 5 * (1 - days_since_update / 30)
        
        total_score = view_score + order_score + rating_score + recency_bonus
        return round(total_score, 2)
    
    @staticmethod
    def generate_meta_description(product):
        """
        Generate SEO meta description from product data
        """
        if product.short_description:
            base_desc = product.short_description
        else:
            # Take first 100 characters of description
            base_desc = product.description[:100] if product.description else ""
        
        # Add price and category info
        price_text = f"Price: {ProductUtils.format_price(product.price)}"
        category_text = f"Category: {product.category.name}"
        
        # Combine and limit to 160 characters
        meta_desc = f"{base_desc}. {price_text}. {category_text}."
        
        if len(meta_desc) > 160:
            meta_desc = meta_desc[:157] + "..."
        
        return meta_desc
    
    @staticmethod
    def generate_meta_keywords(product):
        """
        Generate SEO meta keywords from product data
        """
        keywords = []
        
        # Add product name words
        name_words = re.findall(r'\b[a-zA-Z]{3,}\b', product.name.lower())
        keywords.extend(name_words)
        
        # Add brand
        if product.brand:
            keywords.append(product.brand.lower())
        
        # Add category
        keywords.append(product.category.name.lower())
        
        # Add tags
        if product.tags:
            tag_words = [tag.strip().lower() for tag in product.tags.split(',')]
            keywords.extend(tag_words)
        
        # Add material, color, size if available
        for attr in [product.material, product.color, product.size]:
            if attr:
                keywords.append(attr.lower())
        
        # Remove duplicates and limit
        unique_keywords = list(dict.fromkeys(keywords))[:15]
        
        return ', '.join(unique_keywords)
    
    @staticmethod
    def estimate_delivery_date(product, location='kampala'):
        """
        Estimate delivery date based on product and location
        """
        base_days = 1  # Base delivery time in Uganda
        
        # Add extra days based on product characteristics
        if product.weight and product.weight > 10:
            base_days += 1  # Heavy items take longer
        
        if not product.is_in_stock:
            base_days += 3  # Out of stock items need restocking time
        
        # Location-based adjustments
        location_adjustments = {
            'kampala': 0,
            'entebbe': 0,
            'jinja': 1,
            'mbarara': 2,
            'gulu': 3,
            'other': 3
        }
        
        additional_days = location_adjustments.get(location.lower(), 3)
        total_days = base_days + additional_days
        
        # Calculate delivery date
        delivery_date = timezone.now().date() + timedelta(days=total_days)
        
        return {
            'estimated_days': total_days,
            'estimated_date': delivery_date,
            'date_range': {
                'min_date': delivery_date,
                'max_date': delivery_date + timedelta(days=2)
            }
        }
    
    @staticmethod
    def format_stock_status(product):
        """
        Format stock status for display
        """
        if not product.track_inventory:
            return {
                'status': 'available',
                'message': 'In Stock',
                'color': 'green'
            }
        
        if product.stock_quantity == 0:
            if product.allow_backorders:
                return {
                    'status': 'backorder',
                    'message': 'Available on Backorder',
                    'color': 'orange'
                }
            else:
                return {
                    'status': 'out_of_stock',
                    'message': 'Out of Stock',
                    'color': 'red'
                }
        
        if product.is_low_stock:
            return {
                'status': 'low_stock',
                'message': f'Low Stock ({product.stock_quantity} remaining)',
                'color': 'orange'
            }
        
        return {
            'status': 'in_stock',
            'message': f'In Stock ({product.stock_quantity} available)',
            'color': 'green'
        }
    
    @staticmethod
    def calculate_reorder_point(product, lead_time_days=7, safety_stock_days=3):
        """
        Calculate when to reorder stock
        """
        if not product.track_inventory:
            return None
        
        # Calculate average daily sales (simplified)
        daily_sales = product.order_count / 365 if product.order_count > 0 else 0.1
        
        # Calculate reorder point
        lead_time_demand = daily_sales * lead_time_days
        safety_stock = daily_sales * safety_stock_days
        reorder_point = lead_time_demand + safety_stock
        
        return {
            'reorder_point': max(1, round(reorder_point)),
            'daily_sales': round(daily_sales, 2),
            'lead_time_days': lead_time_days,
            'safety_stock': round(safety_stock)
        }