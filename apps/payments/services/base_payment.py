from abc import ABC, abstractmethod
from django.db import transaction
from django.utils import timezone
from django.conf import settings
from decimal import Decimal
import logging
import secrets
import string
import hmac
import hashlib

from ..models import Payment, Transaction, PaymentStatus, TransactionType, PaymentMethodConfig
from apps.orders.services.order_service import OrderService
from apps.notifications.services.notification_service import NotificationService

logger = logging.getLogger(__name__)

class PaymentServiceError(Exception):
    """Base exception for payment service errors."""
    pass

class PaymentValidationError(PaymentServiceError):
    """Exception for payment validation errors."""
    pass

class PaymentProcessingError(PaymentServiceError):
    """Exception for payment processing errors."""
    pass

class BasePaymentService(ABC):
    """Abstract base class for all payment services."""
    
    def __init__(self):
        self.logger = logger
    
    @abstractmethod
    def process_payment(self, payment_data: dict) -> dict:
        """
        Process a payment.
        
        Args:
            payment_data: Dictionary containing payment information.
            
        Returns:
            Dictionary with payment result.
        """
        pass
    
    @abstractmethod
    def verify_payment(self, payment: Payment) -> dict:
        """
        Verify payment status with provider.
        
        Args:
            payment: Payment instance.
            
        Returns:
            Dictionary with verification result.
        """
        pass
    
    @abstractmethod
    def cancel_payment(self, payment: Payment) -> dict:
        """
        Cancel a payment.
        
        Args:
            payment: Payment instance.
            
        Returns:
            Dictionary with cancellation result.
        """
        pass
    
    def create_payment_record(self, order, payment_method, amount, user, **kwargs):
        """
        Create a payment record in the database.
        
        Args:
            order: Order instance.
            payment_method: Payment method choice.
            amount: Payment amount.
            user: User instance.
            **kwargs: Additional payment data.
            
        Returns:
            Payment instance.
        """
        try:
            with transaction.atomic():
                payment = Payment.objects.create(
                    order=order,
                    user=user,
                    payment_method=payment_method,
                    amount=amount,
                    currency=kwargs.get('currency', 'UGX'),
                    status=PaymentStatus.PENDING,
                    metadata=kwargs.get('metadata', {}),
                    notes=kwargs.get('notes', ''),
                    expires_at=kwargs.get('expires_at')
                )
                
                # Create initial transaction record
                self.create_transaction_record(
                    payment=payment,
                    transaction_type=TransactionType.PAYMENT,
                    amount=amount,
                    status=PaymentStatus.PENDING,
                    description=f"Payment initiated for order {order.order_number}"
                )
                
                self.logger.info(f"Payment record created: {payment.reference_number}")
                return payment
                
        except Exception as e:
            self.logger.error(f"Error creating payment record: {str(e)}")
            raise PaymentServiceError(f"Failed to create payment record: {str(e)}")
    
    def update_payment_status(self, payment: Payment, status: str, **kwargs):
        """
        Update payment status and create transaction record.
        
        Args:
            payment: Payment instance.
            status: New payment status.
            **kwargs: Additional update data.
        """
        try:
            with transaction.atomic():
                old_status = payment.status
                payment.status = status
                
                # Update specific fields based on kwargs
                if 'transaction_id' in kwargs:
                    payment.transaction_id = kwargs['transaction_id']
                
                if 'external_transaction_id' in kwargs:
                    payment.external_transaction_id = kwargs['external_transaction_id']
                
                if 'provider_response' in kwargs:
                    payment.provider_response = kwargs['provider_response']
                
                if 'failure_reason' in kwargs:
                    payment.failure_reason = kwargs['failure_reason']
                
                if 'notes' in kwargs:
                    payment.notes = kwargs['notes']
                
                if 'provider_fee' in kwargs:
                    payment.provider_fee = kwargs['provider_fee']
                
                # Set processed_at for completed/failed payments
                if status in [PaymentStatus.COMPLETED, PaymentStatus.FAILED]:
                    payment.processed_at = timezone.now()
                
                payment.save()
                
                # Create transaction record
                self.create_transaction_record(
                    payment=payment,
                    transaction_type=TransactionType.PAYMENT,
                    amount=payment.amount,
                    status=status,
                    description=kwargs.get('description', f"Payment status updated from {old_status} to {status}"),
                    external_reference=kwargs.get('external_reference', ''),
                    metadata=kwargs.get('metadata', {})
                )
                
                self.logger.info(f"Payment {payment.reference_number} status updated: {old_status} -> {status}")
                
                # Trigger post-update actions
                self._handle_payment_status_change(payment, old_status, status)
                
        except Exception as e:
            self.logger.error(f"Error updating payment status: {str(e)}")
            raise PaymentServiceError(f"Failed to update payment status: {str(e)}")
    
    def create_transaction_record(self, payment: Payment, transaction_type: str, 
                                amount: Decimal, status: str, description: str = '',
                                external_reference: str = '', metadata: dict = None):
        """
        Create a transaction record.
        
        Args:
            payment: Payment instance.
            transaction_type: Type of transaction.
            amount: Transaction amount.
            status: Transaction status.
            description: Transaction description.
            external_reference: External reference ID.
            metadata: Additional metadata.
        """
        try:
            Transaction.objects.create(
                payment=payment,
                transaction_type=transaction_type,
                amount=amount,
                currency=payment.currency,
                status=status,
                external_reference=external_reference,
                description=description,
                metadata=metadata or {},
                processed_by=None  # Will be set by admin if manually processed
            )
            
        except Exception as e:
            self.logger.error(f"Error creating transaction record: {str(e)}")
            raise PaymentServiceError(f"Failed to create transaction record: {str(e)}")
    
    def calculate_fees(self, amount: Decimal, payment_method: str) -> dict:
        """
        Calculate payment fees.
        
        Args:
            amount: Payment amount.
            payment_method: Payment method.
            
        Returns:
            Dictionary with fee information.
        """
        try:
            config = PaymentMethodConfig.objects.get(payment_method=payment_method)
            
            fixed_fee = config.fixed_fee
            percentage_fee = (amount * config.percentage_fee / 100)
            total_fee = fixed_fee + percentage_fee
            
            return {
                'fixed_fee': fixed_fee,
                'percentage_fee': percentage_fee,
                'total_fee': total_fee,
                'net_amount': amount - total_fee
            }
            
        except PaymentMethodConfig.DoesNotExist:
            return {
                'fixed_fee': Decimal('0.00'),
                'percentage_fee': Decimal('0.00'),
                'total_fee': Decimal('0.00'),
                'net_amount': amount
            }
    
    def validate_payment_data(self, payment_data: dict) -> bool:
        """
        Validate payment data.
        
        Args:
            payment_data: Payment data to validate.
            
        Returns:
            True if valid, raises exception if invalid.
        """
        required_fields = ['order', 'amount', 'payment_method', 'user']
        
        for field in required_fields:
            if field not in payment_data or not payment_data[field]:
                raise PaymentValidationError(f"Missing required field: {field}")
        
        # Validate amount
        amount = payment_data['amount']
        if not isinstance(amount, (int, float, Decimal)) or amount <= 0:
            raise PaymentValidationError("Amount must be a positive number")
        
        # Check payment method configuration
        try:
            config = PaymentMethodConfig.objects.get(
                payment_method=payment_data['payment_method']
            )
            
            if not config.is_active:
                raise PaymentValidationError(f"Payment method {payment_data['payment_method']} is not active")
            
            if amount < config.min_amount:
                raise PaymentValidationError(
                    f"Minimum amount for this payment method is UGX {config.min_amount}"
                )
            
            if amount > config.max_amount:
                raise PaymentValidationError(
                    f"Maximum amount for this payment method is UGX {config.max_amount}"
                )
                
        except PaymentMethodConfig.DoesNotExist:
            raise PaymentValidationError(f"Payment method {payment_data['payment_method']} is not configured")
        
        return True
    
    def _handle_payment_status_change(self, payment: Payment, old_status: str, new_status: str):
        """
        Handle payment status changes (trigger notifications, update orders, etc.).
        
        Args:
            payment: Payment instance.
            old_status: Previous status.
            new_status: New status.
        """
        try:
            # Update order status based on payment status
            if new_status == PaymentStatus.COMPLETED:
                OrderService.handle_payment_completed(payment.order, payment)
                NotificationService.send_payment_success_notification(payment)
                
            elif new_status == PaymentStatus.FAILED:
                OrderService.handle_payment_failed(payment.order, payment)
                NotificationService.send_payment_failed_notification(payment)
                
            elif new_status == PaymentStatus.CANCELLED:
                OrderService.handle_payment_cancelled(payment.order, payment)
                NotificationService.send_payment_cancelled_notification(payment)
            
        except Exception as e:
            self.logger.error(f"Error handling payment status change: {str(e)}")
            # Don't raise exception here as payment update was successful
    
    def generate_reference_number(self, prefix: str = 'PAY') -> str:
        """
        Generate unique reference number.
        
        Args:
            prefix: Reference number prefix.
            
        Returns:
            Unique reference number.
        """
        timestamp = str(int(timezone.now().timestamp()))
        random_str = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
        return f"{prefix}{timestamp[-6:]}{random_str}"
    
    def log_payment_activity(self, payment: Payment, activity: str, details: dict = None):
        """
        Log payment activity.
        
        Args:
            payment: Payment instance.
            activity: Activity description.
            details: Additional details.
        """
        log_data = {
            'payment_id': str(payment.id),
            'reference_number': payment.reference_number,
            'activity': activity,
            'details': details or {}
        }
        
        self.logger.info(f"Payment Activity: {activity}", extra=log_data)
    
    def get_payment_config(self, payment_method: str) -> dict:
        """
        Get payment method configuration.
        
        Args:
            payment_method: Payment method.
            
        Returns:
            Configuration dictionary.
        """
        try:
            config = PaymentMethodConfig.objects.get(payment_method=payment_method)
            
            return {
                'is_active': config.is_active,
                'is_test_mode': config.is_test_mode,
                'config': config.config,
                'min_amount': config.min_amount,
                'max_amount': config.max_amount,
                'fixed_fee': config.fixed_fee,
                'percentage_fee': config.percentage_fee
            }
            
        except PaymentMethodConfig.DoesNotExist:
            return {}
    
    def format_amount(self, amount: Decimal, currency: str = 'UGX') -> str:
        """
        Format amount for display (assumes UGX for no decimals, others with 2 decimals).
        
        Args:
            amount: Amount to format.
            currency: Currency code.
            
        Returns:
            Formatted amount string.
        """
        if currency == 'UGX':
            return f"UGX {amount:,.0f}"
        return f"{currency} {amount:,.2f}"
    
    def validate_webhook_signature(self, payload: str, signature: str, secret: str) -> bool:
        """
        Validate webhook signature.
        
        Args:
            payload: Webhook payload.
            signature: Received signature.
            secret: Webhook secret.
            
        Returns:
            True if signature is valid, raises exception otherwise.
        """
        try:
            expected_signature = hmac.new(
                secret.encode('utf-8'),
                payload.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            if not hmac.compare_digest(signature, expected_signature):
                raise PaymentServiceError("Invalid webhook signature")
            
            return True
            
        except Exception as e:
            self.logger.error(f"Error validating webhook signature: {str(e)}")
            raise PaymentServiceError(f"Failed to validate webhook signature: {str(e)}")
    
    @abstractmethod
    def get_payment_status_from_provider(self, payment: Payment) -> str:
        """
        Get payment status from provider.
        
        Args:
            payment: Payment instance.
            
        Returns:
            Provider payment status.
        """
        pass
    
    @abstractmethod
    def handle_webhook(self, payload: dict, headers: dict) -> dict:
        """
        Handle webhook from payment provider.
        
        Args:
            payload: Webhook payload.
            headers: Request headers.
            
        Returns:
            Processing result.
        """
        pass