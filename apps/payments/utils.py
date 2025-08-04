# apps/payments/utils.py
import re
import hmac
import hashlib
import uuid
from decimal import Decimal
from django.conf import settings
from django.utils import timezone
from typing import Dict, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

def validate_ugandan_phone_number(phone_number: str) -> Tuple[bool, str]:
    """
    Validate and normalize Ugandan phone number
    
    Args:
        phone_number: Phone number to validate
        
    Returns:
        Tuple of (is_valid, normalized_number)
    """
    if not phone_number:
        return False, ""
    
    # Remove any non-digit characters except +
    clean_phone = re.sub(r'[^\d+]', '', phone_number)
    
    # Ugandan phone number patterns
    patterns = [
        r'^\+256[0-9]{9}$',  # +256xxxxxxxxx (international format)
        r'^256[0-9]{9}$',    # 256xxxxxxxxx (without +)
        r'^0[0-9]{9}$',      # 0xxxxxxxxx (local format)
        r'^[0-9]{9}$',       # xxxxxxxxx (9 digits only)
    ]
    
    # Check if phone matches any pattern
    valid = any(re.match(pattern, clean_phone) for pattern in patterns)
    
    if not valid:
        return False, ""
    
    # Normalize to international format (+256xxxxxxxxx)
    if clean_phone.startswith('0'):
        normalized = '+256' + clean_phone[1:]
    elif clean_phone.startswith('256'):
        normalized = '+' + clean_phone
    elif clean_phone.startswith('+256'):
        normalized = clean_phone
    elif len(clean_phone) == 9:
        normalized = '+256' + clean_phone
    else:
        return False, ""
    
    return True, normalized

def format_ugandan_currency(amount: Decimal, include_currency: bool = True) -> str:
    """
    Format amount as Ugandan Shillings
    
    Args:
        amount: Amount to format
        include_currency: Whether to include currency symbol
        
    Returns:
        Formatted currency string
    """
    if include_currency:
        return f"UGX {amount:,.0f}"
    else:
        return f"{amount:,.0f}"

def calculate_payment_fees(amount: Decimal, payment_method: str) -> Dict[str, Decimal]:
    """
    Calculate payment processing fees
    
    Args:
        amount: Payment amount
        payment_method: Payment method
        
    Returns:
        Dictionary with fee breakdown
    """
    try:
        from .models import PaymentMethodConfig
        
        config = PaymentMethodConfig.objects.get(payment_method=payment_method)
        
        # Calculate fees
        fixed_fee = config.fixed_fee
        percentage_fee = (amount * config.percentage_fee / 100)
        total_fee = fixed_fee + percentage_fee
        
        return {
            'fixed_fee': fixed_fee,
            'percentage_fee': percentage_fee,
            'total_fee': total_fee,
            'net_amount': amount - total_fee,
            'gross_amount': amount
        }
        
    except Exception as e:
        logger.error(f"Error calculating payment fees: {str(e)}")
        # Return zero fees if config not found
        return {
            'fixed_fee': Decimal('0.00'),
            'percentage_fee': Decimal('0.00'),
            'total_fee': Decimal('0.00'),
            'net_amount': amount,
            'gross_amount': amount
        }

def generate_payment_reference(prefix: str = 'PAY') -> str:
    """
    Generate unique payment reference number
    
    Args:
        prefix: Reference prefix
        
    Returns:
        Unique reference number
    """
    import random
    import string
    
    # Use timestamp and random string for uniqueness
    timestamp = str(int(timezone.now().timestamp()))
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    
    return f"{prefix}{timestamp[-6:]}{random_str}"

def validate_webhook_signature(payload: str, signature: str, secret: str, 
                             algorithm: str = 'sha256') -> bool:
    """
    Validate webhook signature
    
    Args:
        payload: Webhook payload
        signature: Received signature
        secret: Webhook secret
        algorithm: Hash algorithm
        
    Returns:
        True if signature is valid
    """
    try:
        # Create expected signature
        if algorithm == 'sha256':
            expected_signature = hmac.new(
                secret.encode('utf-8'),
                payload.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
        elif algorithm == 'sha1':
            expected_signature = hmac.new(
                secret.encode('utf-8'),
                payload.encode('utf-8'),
                hashlib.sha1
            ).hexdigest()
        else:
            logger.error(f"Unsupported hash algorithm: {algorithm}")
            return False
        
        # Compare signatures using constant-time comparison
        return hmac.compare_digest(signature.lower(), expected_signature.lower())
        
    except Exception as e:
        logger.error(f"Error validating webhook signature: {str(e)}")
        return False

def get_client_ip(request) -> str:
    """
    Get client IP address from request
    
    Args:
        request: Django request object
        
    Returns:
        Client IP address
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def is_payment_expired(payment) -> bool:
    """
    Check if payment has expired
    
    Args:
        payment: Payment instance
        
    Returns:
        True if payment has expired
    """
    if not payment.expires_at:
        return False
    
    return timezone.now() > payment.expires_at

def mask_phone_number(phone_number: str) -> str:
    """
    Mask phone number for display (e.g., +256***123456)
    
    Args:
        phone_number: Phone number to mask
        
    Returns:
        Masked phone number
    """
    if not phone_number or len(phone_number) < 8:
        return phone_number
    
    if phone_number.startswith('+256'):
        # Show +256 and last 4 digits
        return f"+256***{phone_number[-4:]}"
    elif phone_number.startswith('0'):
        # Show 0 and last 4 digits
        return f"0***{phone_number[-4:]}"
    else:
        # Show first 3 and last 4 digits
        return f"{phone_number[:3]}***{phone_number[-4:]}"

def get_payment_method_icon(payment_method: str) -> str:
    """
    Get icon class for payment method
    
    Args:
        payment_method: Payment method
        
    Returns:
        Icon class name
    """
    icons = {
        'mtn_momo': 'fas fa-mobile-alt text-warning',
        'airtel_money': 'fas fa-mobile-alt text-danger',
        'cod': 'fas fa-money-bill text-success'
    }
    
    return icons.get(payment_method, 'fas fa-credit-card')

def get_payment_status_color(status: str) -> str:
    """
    Get color class for payment status
    
    Args:
        status: Payment status
        
    Returns:
        Color class name
    """
    colors = {
        'pending': 'warning',
        'processing': 'info',
        'completed': 'success',
        'failed': 'danger',
        'cancelled': 'secondary',
        'refunded': 'purple'
    }
    
    return colors.get(status, 'secondary')

def sanitize_webhook_data(data: dict) -> dict:
    """
    Sanitize webhook data for logging (remove sensitive information)
    
    Args:
        data: Webhook data
        
    Returns:
        Sanitized data
    """
    sensitive_fields = [
        'password', 'pin', 'secret', 'key', 'token',
        'authorization', 'signature', 'otp'
    ]
    
    sanitized = {}
    for key, value in data.items():
        key_lower = key.lower()
        
        if any(field in key_lower for field in sensitive_fields):
            sanitized[key] = '***REDACTED***'
        elif isinstance(value, dict):
            sanitized[key] = sanitize_webhook_data(value)
        elif isinstance(value, list):
            sanitized[key] = [
                sanitize_webhook_data(item) if isinstance(item, dict) else item
                for item in value
            ]
        else:
            sanitized[key] = value
    
    return sanitized

def convert_currency(amount: Decimal, from_currency: str, to_currency: str) -> Decimal:
    """
    Convert currency amount (placeholder for future implementation)
    
    Args:
        amount: Amount to convert
        from_currency: Source currency
        to_currency: Target currency
        
    Returns:
        Converted amount
    """
    # For now, assume all amounts are in UGX
    if from_currency == to_currency:
        return amount
    
    # Placeholder for currency conversion API integration
    logger.warning(f"Currency conversion not implemented: {from_currency} to {to_currency}")
    return amount

def get_business_hours() -> Dict[str, str]:
    """
    Get business hours configuration
    
    Returns:
        Dictionary with business hours
    """
    return {
        'monday': '08:00 - 18:00',
        'tuesday': '08:00 - 18:00',
        'wednesday': '08:00 - 18:00',
        'thursday': '08:00 - 18:00',
        'friday': '08:00 - 18:00',
        'saturday': '09:00 - 17:00',
        'sunday': 'Closed'
    }

def is_business_hours() -> bool:
    """
    Check if current time is within business hours
    
    Returns:
        True if within business hours
    """
    now = timezone.now()
    current_hour = now.hour
    weekday = now.weekday()  # 0 = Monday, 6 = Sunday
    
    # Business hours: 8 AM - 6 PM (weekdays), 9 AM - 5 PM (Saturday), Closed (Sunday)
    if weekday == 6:  # Sunday
        return False
    elif weekday == 5:  # Saturday
        return 9 <= current_hour < 17
    else:  # Monday - Friday
        return 8 <= current_hour < 18

def generate_transaction_id() -> str:
    """
    Generate unique transaction ID
    
    Returns:
        Unique transaction ID
    """
    return str(uuid.uuid4()).replace('-', '').upper()[:16]

def validate_amount(amount: any) -> Tuple[bool, Optional[Decimal]]:
    """
    Validate and convert amount to Decimal
    
    Args:
        amount: Amount to validate
        
    Returns:
        Tuple of (is_valid, decimal_amount)
    """
    try:
        if isinstance(amount, str):
            # Remove any non-numeric characters except decimal point
            clean_amount = re.sub(r'[^\d.]', '', amount)
            decimal_amount = Decimal(clean_amount)
        elif isinstance(amount, (int, float)):
            decimal_amount = Decimal(str(amount))
        elif isinstance(amount, Decimal):
            decimal_amount = amount
        else:
            return False, None
        
        # Check if amount is positive and reasonable
        if decimal_amount <= 0:
            return False, None
        
        if decimal_amount > Decimal('999999999'):  # Max amount check
            return False, None
        
        # Round to 2 decimal places
        decimal_amount = decimal_amount.quantize(Decimal('0.01'))
        
        return True, decimal_amount
        
    except Exception as e:
        logger.error(f"Error validating amount: {str(e)}")
        return False, None

def get_payment_timeout(payment_method: str) -> int:
    """
    Get payment timeout in minutes for specific payment method
    
    Args:
        payment_method: Payment method
        
    Returns:
        Timeout in minutes
    """
    timeouts = {
        'mtn_momo': 15,      # 15 minutes for mobile money
        'airtel_money': 15,   # 15 minutes for mobile money
        'cod': 0             # No timeout for COD
    }
    
    return timeouts.get(payment_method, 15)

def create_payment_qr_code(payment_data: dict) -> Optional[str]:
    """
    Generate QR code for payment (placeholder for future implementation)
    
    Args:
        payment_data: Payment information
        
    Returns:
        QR code data or None
    """
    # Placeholder for QR code generation
    # This could be implemented using libraries like qrcode
    logger.info("QR code generation not implemented yet")
    return None

def send_payment_notification(payment, notification_type: str) -> bool:
    """
    Send payment notification (email/SMS)
    
    Args:
        payment: Payment instance
        notification_type: Type of notification
        
    Returns:
        True if notification sent successfully
    """
    try:
        # Import here to avoid circular imports
        from apps.notifications.services.notification_service import NotificationService
        
        if notification_type == 'payment_created':
            return NotificationService.send_payment_created_notification(payment)
        elif notification_type == 'payment_completed':
            return NotificationService.send_payment_success_notification(payment)
        elif notification_type == 'payment_failed':
            return NotificationService.send_payment_failed_notification(payment)
        elif notification_type == 'payment_cancelled':
            return NotificationService.send_payment_cancelled_notification(payment)
        else:
            logger.warning(f"Unknown notification type: {notification_type}")
            return False
            
    except Exception as e:
        logger.error(f"Error sending payment notification: {str(e)}")
        return False

def log_payment_event(payment, event: str, details: dict = None):
    """
    Log payment event for audit trail
    
    Args:
        payment: Payment instance
        event: Event description  
        details: Additional event details
    """
    log_data = {
        'payment_id': str(payment.id),
        'reference_number': payment.reference_number,
        'order_id': str(payment.order.id) if payment.order else None,
        'user_id': str(payment.user.id),
        'payment_method': payment.payment_method,
        'amount': str(payment.amount),
        'status': payment.status,
        'event': event,
        'details': details or {},
        'timestamp': timezone.now().isoformat()
    }
    
    logger.info(f"Payment Event: {event}", extra=log_data)