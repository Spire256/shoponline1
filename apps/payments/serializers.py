# apps/payments/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from decimal import Decimal
import re

from .models import (
    Payment, MobileMoneyPayment, CashOnDeliveryPayment, 
    Transaction, PaymentWebhook, PaymentMethodConfig,
    PaymentMethod, PaymentStatus
)
from apps.orders.models import Order

User = get_user_model()

class PaymentMethodConfigSerializer(serializers.ModelSerializer):
    """Serializer for payment method configuration (public info only)"""
    
    class Meta:
        model = PaymentMethodConfig
        fields = [
            'payment_method', 'is_active', 'display_name', 'description',
            'min_amount', 'max_amount', 'fixed_fee', 'percentage_fee', 'icon'
        ]
        read_only_fields = ['payment_method']

class MobileMoneyPaymentSerializer(serializers.ModelSerializer):
    """Serializer for mobile money payment details"""
    
    class Meta:
        model = MobileMoneyPayment
        fields = [
            'phone_number', 'customer_name', 'provider_status',
            'callback_received', 'retry_count', 'created_at'
        ]
        read_only_fields = ['provider_status', 'callback_received', 'retry_count', 'created_at']
    
    def validate_phone_number(self, value):
        """Validate Ugandan phone number format"""
        # Remove any spaces or special characters
        phone = re.sub(r'[^\d+]', '', value)
        
        # Check for valid Ugandan phone number patterns
        ugandan_patterns = [
            r'^\+256[0-9]{9}$',  # +256xxxxxxxxx
            r'^256[0-9]{9}$',    # 256xxxxxxxxx
            r'^0[0-9]{9}$',      # 0xxxxxxxxx
            r'^[0-9]{9}$',       # xxxxxxxxx
        ]
        
        if not any(re.match(pattern, phone) for pattern in ugandan_patterns):
            raise serializers.ValidationError(
                "Please enter a valid Ugandan phone number (e.g., +256700000000 or 0700000000)"
            )
        
        # Normalize to +256 format
        if phone.startswith('0'):
            phone = '+256' + phone[1:]
        elif phone.startswith('256'):
            phone = '+' + phone
        elif not phone.startswith('+256'):
            phone = '+256' + phone
        
        return phone

class CashOnDeliveryPaymentSerializer(serializers.ModelSerializer):
    """Serializer for cash on delivery payment details"""
    
    class Meta:
        model = CashOnDeliveryPayment
        fields = [
            'delivery_address', 'delivery_phone', 'delivery_notes',
            'cash_received', 'change_given', 'admin_notified',
            'collected_at', 'collection_notes', 'delivery_attempts'
        ]
        read_only_fields = [
            'cash_received', 'change_given', 'admin_notified',
            'collected_at', 'collection_notes', 'delivery_attempts'
        ]
    
    def validate_delivery_phone(self, value):
        """Validate delivery phone number"""
        # Use same validation as mobile money
        serializer = MobileMoneyPaymentSerializer()
        return serializer.validate_phone_number(value)

class TransactionSerializer(serializers.ModelSerializer):
    """Serializer for payment transactions"""
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_type', 'amount', 'currency', 'status',
            'external_reference', 'description', 'processed_at'
        ]
        read_only_fields = ['id', 'processed_at']

class PaymentSerializer(serializers.ModelSerializer):
    """Main payment serializer"""
    mobile_money_details = MobileMoneyPaymentSerializer(read_only=True)
    cod_details = CashOnDeliveryPaymentSerializer(read_only=True)
    transactions = TransactionSerializer(many=True, read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'order', 'payment_method', 'payment_method_display',
            'amount', 'currency', 'status', 'status_display',
            'reference_number', 'transaction_id', 'external_transaction_id',
            'provider_fee', 'failure_reason', 'notes',
            'created_at', 'updated_at', 'processed_at', 'expires_at',
            'mobile_money_details', 'cod_details', 'transactions'
        ]
        read_only_fields = [
            'id', 'reference_number', 'transaction_id', 'external_transaction_id',
            'provider_fee', 'status', 'failure_reason', 'created_at',
            'updated_at', 'processed_at', 'expires_at'
        ]
    
    def validate(self, data):
        """Validate payment data"""
        payment_method = data.get('payment_method')
        amount = data.get('amount')
        order = data.get('order')
        
        if order and amount != order.total_amount:
            raise serializers.ValidationError(
                f"Payment amount ({amount}) must match order total ({order.total_amount})"
            )
        
        # Check if payment method is active
        try:
            config = PaymentMethodConfig.objects.get(payment_method=payment_method)
            if not config.is_active:
                raise serializers.ValidationError(
                    f"{config.display_name} is currently not available"
                )
            
            # Check amount limits
            if amount < config.min_amount:
                raise serializers.ValidationError(
                    f"Minimum amount for {config.display_name} is UGX {config.min_amount}"
                )
            
            if amount > config.max_amount:
                raise serializers.ValidationError(
                    f"Maximum amount for {config.display_name} is UGX {config.max_amount}"
                )
        
        except PaymentMethodConfig.DoesNotExist:
            raise serializers.ValidationError(f"Payment method {payment_method} is not configured")
        
        return data

class PaymentCreateSerializer(serializers.Serializer):
    """Serializer for creating payments"""
    order_id = serializers.UUIDField()
    payment_method = serializers.ChoiceField(choices=PaymentMethod.choices)
    
    # Mobile Money specific fields
    phone_number = serializers.CharField(required=False, allow_blank=True)
    customer_name = serializers.CharField(required=False, allow_blank=True)
    
    # COD specific fields
    delivery_address = serializers.CharField(required=False, allow_blank=True)
    delivery_phone = serializers.CharField(required=False, allow_blank=True)
    delivery_notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        """Validate payment creation data"""
        payment_method = data['payment_method']
        
        # Validate order exists and belongs to user
        try:
            order = Order.objects.get(id=data['order_id'])
            data['order'] = order
        except Order.DoesNotExist:
            raise serializers.ValidationError("Order not found")
        
        # Check if order already has a successful payment
        if order.payments.filter(status=PaymentStatus.COMPLETED).exists():
            raise serializers.ValidationError("Order has already been paid")
        
        # Method-specific validation
        if payment_method in [PaymentMethod.MTN_MOMO, PaymentMethod.AIRTEL_MONEY]:
            if not data.get('phone_number'):
                raise serializers.ValidationError("Phone number is required for mobile money payments")
            
            # Validate phone number format
            serializer = MobileMoneyPaymentSerializer()
            data['phone_number'] = serializer.validate_phone_number(data['phone_number'])
        
        elif payment_method == PaymentMethod.CASH_ON_DELIVERY:
            required_fields = ['delivery_address', 'delivery_phone']
            for field in required_fields:
                if not data.get(field):
                    raise serializers.ValidationError(f"{field.replace('_', ' ').title()} is required for cash on delivery")
            
            # Validate delivery phone
            serializer = CashOnDeliveryPaymentSerializer()
            data['delivery_phone'] = serializer.validate_delivery_phone(data['delivery_phone'])
        
        return data

class PaymentStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating payment status (admin only)"""
    status = serializers.ChoiceField(choices=PaymentStatus.choices)
    notes = serializers.CharField(required=False, allow_blank=True)
    failure_reason = serializers.CharField(required=False, allow_blank=True)
    
    # COD specific fields
    cash_received = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    change_given = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    collection_notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        """Validate status update"""
        status = data['status']
        
        if status == PaymentStatus.FAILED and not data.get('failure_reason'):
            raise serializers.ValidationError("Failure reason is required when marking payment as failed")
        
        if status == PaymentStatus.COMPLETED and hasattr(self.instance, 'cod_details'):
            if not data.get('cash_received'):
                raise serializers.ValidationError("Cash received amount is required for COD completion")
        
        return data

class PaymentWebhookSerializer(serializers.ModelSerializer):
    """Serializer for payment webhooks (internal use)"""
    
    class Meta:
        model = PaymentWebhook
        fields = [
            'id', 'provider', 'event_type', 'payment', 'processed',
            'processing_error', 'signature_valid', 'created_at', 'processed_at'
        ]
        read_only_fields = ['id', 'created_at', 'processed_at']

class PaymentSummarySerializer(serializers.ModelSerializer):
    """Simplified payment serializer for lists"""
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'reference_number', 'order_number', 'payment_method',
            'payment_method_display', 'amount', 'currency', 'status',
            'status_display', 'created_at', 'processed_at'
        ]
        read_only_fields = fields

# Admin specific serializers
class AdminPaymentSerializer(PaymentSerializer):
    """Extended payment serializer for admin users"""
    user_email = serializers.CharField(source='user.email', read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    
    class Meta(PaymentSerializer.Meta):
        fields = PaymentSerializer.Meta.fields + [
            'user_email', 'order_number', 'provider_response', 'metadata'
        ]

class AdminCODPaymentSerializer(CashOnDeliveryPaymentSerializer):
    """Extended COD payment serializer for admin users"""
    assigned_to_email = serializers.CharField(source='assigned_to.email', read_only=True)
    collected_by_email = serializers.CharField(source='collected_by.email', read_only=True)
    
    class Meta(CashOnDeliveryPaymentSerializer.Meta):
        fields = CashOnDeliveryPaymentSerializer.Meta.fields + [
            'assigned_to', 'assigned_to_email', 'collected_by', 'collected_by_email',
            'admin_notification_sent_at', 'last_attempt_at'
        ]
        read_only_fields = CashOnDeliveryPaymentSerializer.Meta.read_only_fields + [
            'assigned_to_email', 'collected_by_email'
        ]

class PaymentAnalyticsSerializer(serializers.Serializer):
    """Serializer for payment analytics data"""
    total_payments = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    successful_payments = serializers.IntegerField()
    failed_payments = serializers.IntegerField()
    pending_payments = serializers.IntegerField()
    
    payment_methods = serializers.DictField()
    daily_stats = serializers.ListField()
    average_transaction_value = serializers.DecimalField(max_digits=12, decimal_places=2)
    
    # COD specific analytics
    cod_pending = serializers.IntegerField()
    cod_collected = serializers.IntegerField()
    cod_success_rate = serializers.DecimalField(max_digits=5, decimal_places=2)