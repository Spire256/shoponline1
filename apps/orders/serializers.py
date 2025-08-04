# apps/orders/serializers.py

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from decimal import Decimal
from .models import Order, OrderItem, OrderStatusHistory, OrderNote, CODVerification
from apps.products.models import Product
from apps.flash_sales.models import FlashSale, FlashSaleProduct

User = get_user_model()


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for order items"""
    
    product_name = serializers.CharField(read_only=True)
    product_image = serializers.URLField(read_only=True)
    total_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    flash_sale_savings = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    savings_display = serializers.CharField(source='get_savings_display', read_only=True)
    discount_percentage_display = serializers.CharField(source='get_discount_percentage_display', read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id', 'product_id', 'product_name', 'product_sku', 'product_image',
            'unit_price', 'quantity', 'total_price', 'is_flash_sale_item',
            'original_price', 'flash_sale_discount', 'flash_sale_savings',
            'savings_display', 'discount_percentage_display', 'product_category',
            'product_brand', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class OrderItemCreateSerializer(serializers.Serializer):
    """Serializer for creating order items during checkout"""
    
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)

    def validate_product_id(self, value):
        """Validate that product exists and is available"""
        try:
            product = Product.objects.get(id=value, is_active=True)
            return value
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found or not available")

    def validate(self, data):
        """Validate product availability and stock"""
        try:
            product = Product.objects.get(id=data['product_id'])
            
            # Check stock availability
            if product.stock_quantity < data['quantity']:
                raise serializers.ValidationError(
                    f"Insufficient stock. Only {product.stock_quantity} items available."
                )
            
            return data
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found")


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    """Serializer for order status history"""
    
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)

    class Meta:
        model = OrderStatusHistory
        fields = [
            'id', 'previous_status', 'new_status', 'changed_by_name',
            'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class OrderNoteSerializer(serializers.ModelSerializer):
    """Serializer for order notes"""
    
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = OrderNote
        fields = [
            'id', 'note_type', 'note', 'created_by_name',
            'is_internal', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'created_by_name']


class CODVerificationSerializer(serializers.ModelSerializer):
    """Serializer for COD verification"""
    
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True)

    class Meta:
        model = CODVerification
        fields = [
            'id', 'verification_status', 'verified_by_name', 'verification_notes',
            'customer_phone_verified', 'delivery_confirmed', 'payment_received',
            'verification_date', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'verified_by_name']


class OrderSerializer(serializers.ModelSerializer):
    """Main order serializer for reading orders"""
    
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    notes = OrderNoteSerializer(many=True, read_only=True)
    cod_verification = CODVerificationSerializer(read_only=True)
    customer_name = serializers.CharField(source='get_customer_name', read_only=True)
    customer_display = serializers.CharField(source='get_customer_display', read_only=True)
    delivery_address = serializers.CharField(source='get_delivery_address', read_only=True)
    can_be_cancelled = serializers.BooleanField(read_only=True)
    can_be_refunded = serializers.BooleanField(read_only=True)
    is_completed = serializers.BooleanField(read_only=True)
    
    # Status display names
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer_name', 'customer_display',
            'first_name', 'last_name', 'email', 'phone',
            'address_line_1', 'address_line_2', 'city', 'district',
            'postal_code', 'delivery_address', 'delivery_notes',
            'subtotal', 'tax_amount', 'delivery_fee', 'discount_amount',
            'total_amount', 'flash_sale_savings',
            'status', 'status_display', 'payment_method', 'payment_method_display',
            'payment_status', 'payment_status_display', 'payment_reference',
            'transaction_id', 'is_cash_on_delivery', 'cod_verified',
            'has_flash_sale_items', 'admin_notes', 'tracking_number',
            'estimated_delivery', 'delivery_date',
            'can_be_cancelled', 'can_be_refunded', 'is_completed',
            'confirmed_at', 'delivered_at', 'cancelled_at', 'created_at', 'updated_at',
            'items', 'status_history', 'notes', 'cod_verification'
        ]
        read_only_fields = [
            'id', 'order_number', 'created_at', 'updated_at',
            'confirmed_at', 'delivered_at', 'cancelled_at'
        ]


class OrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new orders"""
    
    items = OrderItemCreateSerializer(many=True, write_only=True)

    class Meta:
        model = Order
        fields = [
            'first_name', 'last_name', 'email', 'phone',
            'address_line_1', 'address_line_2', 'city', 'district',
            'postal_code', 'delivery_notes', 'payment_method', 'items'
        ]

    def validate_email(self, value):
        """Validate email format"""
        if not value or '@' not in value:
            raise serializers.ValidationError("Valid email is required")
        return value.lower()

    def validate_phone(self, value):
        """Validate Uganda phone number format"""
        import re
        # Uganda phone number patterns
        patterns = [
            r'^256[0-9]{9}$',  # International format
            r'^0[0-9]{9}$',    # Local format
            r'^\+256[0-9]{9}$' # International with +
        ]
        
        if not any(re.match(pattern, value) for pattern in patterns):
            raise serializers.ValidationError(
                "Please enter a valid Uganda phone number (e.g., 0712345678 or 256712345678)"
            )
        return value

    def validate_district(self, value):
        """Validate Uganda district"""
        # List of Uganda districts (sample - you can expand this)
        uganda_districts = [
            'Kampala', 'Wakiso', 'Mukono', 'Entebbe', 'Jinja', 'Mbale',
            'Gulu', 'Lira', 'Mbarara', 'Fort Portal', 'Kasese', 'Kabale',
            # Add more districts as needed
        ]
        
        if value not in uganda_districts:
            # Allow custom districts but warn
            pass
        
        return value

    def validate_items(self, value):
        """Validate order items"""
        if not value:
            raise serializers.ValidationError("At least one item is required")
        
        if len(value) > 50:  # Reasonable limit
            raise serializers.ValidationError("Too many items in single order")
        
        return value

    @transaction.atomic
    def create(self, validated_data):
        """Create order with items"""
        items_data = validated_data.pop('items')
        user = self.context['request'].user if self.context['request'].user.is_authenticated else None
        
        # Create order
        order = Order.objects.create(
            user=user,
            **validated_data
        )
        
        # Process each item
        subtotal = Decimal('0.00')
        flash_sale_savings = Decimal('0.00')
        has_flash_sale_items = False
        
        for item_data in items_data:
            product = Product.objects.get(id=item_data['product_id'])
            quantity = item_data['quantity']
            
            # Check for flash sale
            flash_sale_product = None
            try:
                from django.utils import timezone
                flash_sale_product = FlashSaleProduct.objects.select_related('flash_sale').get(
                    product=product,
                    flash_sale__is_active=True,
                    flash_sale__start_time__lte=timezone.now(),
                    flash_sale__end_time__gte=timezone.now()
                )
            except FlashSaleProduct.DoesNotExist:
                pass
            
            # Determine pricing
            if flash_sale_product:
                unit_price = flash_sale_product.discounted_price
                original_price = product.price
                is_flash_sale_item = True
                flash_sale_discount = flash_sale_product.flash_sale.discount_percentage
                item_savings = (original_price - unit_price) * quantity
                flash_sale_savings += item_savings
                has_flash_sale_items = True
            else:
                unit_price = product.price
                original_price = None
                is_flash_sale_item = False
                flash_sale_discount = 0
                item_savings = Decimal('0.00')
            
            # Create order item
            OrderItem.objects.create(
                order=order,
                product_id=product.id,
                product_name=product.name,
                product_sku=product.sku,
                product_image=product.featured_image.url if product.featured_image else '',
                unit_price=unit_price,
                quantity=quantity,
                is_flash_sale_item=is_flash_sale_item,
                original_price=original_price,
                flash_sale_discount=flash_sale_discount,
                flash_sale_savings=item_savings,
                product_category=product.category.name if product.category else '',
                product_brand=product.brand
            )
            
            # Update product stock
            product.stock_quantity -= quantity
            product.save(update_fields=['stock_quantity'])
            
            # Add to subtotal
            subtotal += unit_price * quantity
        
        # Update order totals
        order.subtotal = subtotal
        order.total_amount = subtotal  # Add delivery fee, tax calculation as needed
        order.flash_sale_savings = flash_sale_savings
        order.has_flash_sale_items = has_flash_sale_items
        order.save()
        
        # Create COD verification if needed
        if order.is_cash_on_delivery:
            CODVerification.objects.create(order=order)
        
        return order


class OrderUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating order details (admin use)"""

    class Meta:
        model = Order
        fields = [
            'status', 'payment_status', 'admin_notes', 'tracking_number',
            'estimated_delivery', 'delivery_date'
        ]

    def update(self, instance, validated_data):
        """Update order and track status changes"""
        old_status = instance.status
        new_status = validated_data.get('status', old_status)
        
        # Update the order
        order = super().update(instance, validated_data)
        
        # Track status change
        if old_status != new_status:
            OrderStatusHistory.objects.create(
                order=order,
                previous_status=old_status,
                new_status=new_status,
                changed_by=self.context['request'].user,
                notes=f"Status changed from {old_status} to {new_status}"
            )
            
            # Update timestamps based on status
            if new_status == 'confirmed' and not order.confirmed_at:
                order.confirmed_at = timezone.now()
                order.save(update_fields=['confirmed_at'])
            elif new_status == 'delivered' and not order.delivered_at:
                order.delivered_at = timezone.now()
                if order.is_cash_on_delivery:
                    order.payment_status = 'completed'
                order.save(update_fields=['delivered_at', 'payment_status'])
            elif new_status == 'cancelled' and not order.cancelled_at:
                order.cancelled_at = timezone.now()
                order.save(update_fields=['cancelled_at'])
        
        return order


class OrderListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for order lists"""
    
    customer_name = serializers.CharField(source='get_customer_name', read_only=True)
    items_count = serializers.IntegerField(source='items.count', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer_name', 'email', 'phone',
            'total_amount', 'status', 'status_display', 'payment_method',
            'payment_method_display', 'is_cash_on_delivery', 'cod_verified',
            'items_count', 'created_at'
        ]
        read_only_fields = ['id', 'order_number', 'created_at']


class OrderAnalyticsSerializer(serializers.Serializer):
    """Serializer for order analytics data"""
    
    total_orders = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=15, decimal_places=2)
    pending_orders = serializers.IntegerField()
    completed_orders = serializers.IntegerField()
    cancelled_orders = serializers.IntegerField()
    cod_orders = serializers.IntegerField()
    mobile_money_orders = serializers.IntegerField()
    flash_sale_orders = serializers.IntegerField()
    flash_sale_savings = serializers.DecimalField(max_digits=15, decimal_places=2)
    average_order_value = serializers.DecimalField(max_digits=10, decimal_places=2)
    
    # Daily/Monthly breakdowns
    orders_by_day = serializers.ListField(child=serializers.DictField())
    orders_by_status = serializers.ListField(child=serializers.DictField())
    orders_by_payment_method = serializers.ListField(child=serializers.DictField())
    top_districts = serializers.ListField(child=serializers.DictField())


class CustomerOrderSummarySerializer(serializers.Serializer):
    """Serializer for customer order summary"""
    
    total_orders = serializers.IntegerField()
    total_spent = serializers.DecimalField(max_digits=12, decimal_places=2)
    completed_orders = serializers.IntegerField()
    pending_orders = serializers.IntegerField()
    total_savings = serializers.DecimalField(max_digits=12, decimal_places=2)
    favorite_payment_method = serializers.CharField()
    last_order_date = serializers.DateTimeField()
    is_frequent_customer = serializers.BooleanField()