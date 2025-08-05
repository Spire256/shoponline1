"""
Custom exceptions for ShopOnline Uganda E-commerce Platform.

Provides specific exception classes for different error scenarios:
- API exceptions with proper HTTP status codes
- Business logic exceptions
- Validation exceptions
- Payment exceptions
- Authentication exceptions
- Uganda-specific validation exceptions
"""

from rest_framework import status
from rest_framework.response import Response
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
import logging

from .constants import ERROR_CODES

logger = logging.getLogger(__name__)


class ShopOnlineAPIException(Exception):
    """
    Base exception class for all ShopOnline API exceptions.
    """
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'A server error occurred.'
    default_code = 'server_error'
    error_code = 'SHO_001'

    def __init__(self, detail=None, code=None, error_code=None, extra_data=None):
        """
        Initialize exception with custom details.
        
        Args:
            detail: Human-readable error message
            code: Error code for programmatic handling
            error_code: ShopOnline-specific error code
            extra_data: Additional data to include in error response
        """
        if detail is None:
            detail = self.default_detail
        if code is None:
            code = self.default_code
        if error_code is None:
            error_code = self.error_code

        self.detail = detail
        self.code = code
        self.error_code = error_code
        self.extra_data = extra_data or {}
        
        super().__init__(detail)

    def get_full_details(self):
        """Get full error details for API response."""
        return {
            'error_code': self.error_code,
            'message': str(self.detail),
            'code': self.code,
            'status_code': self.status_code,
            'timestamp': timezone.now().isoformat(),
            **self.extra_data
        }


class ValidationError(ShopOnlineAPIException):
    """
    Exception for validation errors.
    """
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Invalid input provided.'
    default_code = 'validation_error'
    error_code = 'VAL_001'


class AuthenticationError(ShopOnlineAPIException):
    """
    Exception for authentication errors.
    """
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = 'Authentication credentials were not provided or are invalid.'
    default_code = 'authentication_failed'
    error_code = 'AUTH_001'


class PermissionError(ShopOnlineAPIException):
    """
    Exception for permission errors.
    """
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'You do not have permission to perform this action.'
    default_code = 'permission_denied'
    error_code = 'AUTH_005'


class NotFoundError(ShopOnlineAPIException):
    """
    Exception for resource not found errors.
    """
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'The requested resource was not found.'
    default_code = 'not_found'
    error_code = 'SHO_002'


class ConflictError(ShopOnlineAPIException):
    """
    Exception for resource conflict errors.
    """
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'The request could not be completed due to a conflict.'
    default_code = 'conflict'
    error_code = 'SHO_003'


class PaymentError(ShopOnlineAPIException):
    """
    Exception for payment-related errors.
    """
    status_code = status.HTTP_402_PAYMENT_REQUIRED
    default_detail = 'Payment processing failed.'
    default_code = 'payment_error'
    error_code = 'PAY_001'


class MobileMoneyError(PaymentError):
    """
    Exception for Mobile Money payment errors.
    """
    default_detail = 'Mobile Money payment failed.'
    error_code = 'PAY_002'

    def __init__(self, provider=None, transaction_id=None, **kwargs):
        """
        Initialize with Mobile Money specific details.
        
        Args:
            provider: Mobile Money provider (MTN, Airtel)
            transaction_id: Transaction ID from provider
        """
        extra_data = kwargs.get('extra_data', {})
        if provider:
            extra_data['provider'] = provider
        if transaction_id:
            extra_data['transaction_id'] = transaction_id
        
        kwargs['extra_data'] = extra_data
        super().__init__(**kwargs)


class MTNMoMoError(MobileMoneyError):
    """
    Exception for MTN Mobile Money specific errors.
    """
    default_detail = 'MTN Mobile Money payment failed.'
    error_code = 'PAY_002_MTN'

    def __init__(self, **kwargs):
        kwargs.setdefault('extra_data', {})['provider'] = 'MTN'
        super().__init__(**kwargs)


class AirtelMoneyError(MobileMoneyError):
    """
    Exception for Airtel Money specific errors.
    """
    default_detail = 'Airtel Money payment failed.'
    error_code = 'PAY_002_AIRTEL'

    def __init__(self, **kwargs):
        kwargs.setdefault('extra_data', {})['provider'] = 'Airtel'
        super().__init__(**kwargs)


class CODError(PaymentError):
    """
    Exception for Cash on Delivery errors.
    """
    default_detail = 'Cash on Delivery order processing failed.'
    error_code = 'PAY_006'


class InsufficientFundsError(PaymentError):
    """
    Exception for insufficient funds errors.
    """
    default_detail = 'Insufficient funds for this transaction.'
    error_code = 'PAY_002'


class PaymentTimeoutError(PaymentError):
    """
    Exception for payment timeout errors.
    """
    default_detail = 'Payment request timed out.'
    error_code = 'PAY_005'


class OrderError(ShopOnlineAPIException):
    """
    Exception for order-related errors.
    """
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Order processing failed.'
    default_code = 'order_error'
    error_code = 'ORD_001'


class OutOfStockError(OrderError):
    """
    Exception for out of stock errors.
    """
    default_detail = 'One or more items in your order are out of stock.'
    error_code = 'ORD_001'

    def __init__(self, products=None, **kwargs):
        """
        Initialize with out of stock product details.
        
        Args:
            products: List of out of stock products
        """
        extra_data = kwargs.get('extra_data', {})
        if products:
            extra_data['out_of_stock_products'] = products
        
        kwargs['extra_data'] = extra_data
        super().__init__(**kwargs)


class InvalidOrderStatusError(OrderError):
    """
    Exception for invalid order status transition errors.
    """
    default_detail = 'Invalid order status transition.'
    error_code = 'ORD_002'

    def __init__(self, current_status=None, attempted_status=None, **kwargs):
        """
        Initialize with status transition details.
        """
        extra_data = kwargs.get('extra_data', {})
        if current_status:
            extra_data['current_status'] = current_status
        if attempted_status:
            extra_data['attempted_status'] = attempted_status
        
        kwargs['extra_data'] = extra_data
        super().__init__(**kwargs)


class FlashSaleError(ShopOnlineAPIException):
    """
    Exception for flash sale related errors.
    """
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Flash sale operation failed.'
    default_code = 'flash_sale_error'
    error_code = 'FLS_001'


class FlashSaleExpiredError(FlashSaleError):
    """
    Exception for expired flash sale errors.
    """
    default_detail = 'This flash sale has expired.'
    error_code = 'FLS_002'


class FlashSaleNotActiveError(FlashSaleError):
    """
    Exception for inactive flash sale errors.
    """
    default_detail = 'This flash sale is not currently active.'
    error_code = 'FLS_001'


class FlashSaleLimitExceededError(FlashSaleError):
    """
    Exception for flash sale quantity limit errors.
    """
    default_detail = 'Flash sale quantity limit exceeded.'
    error_code = 'FLS_004'


class InvitationError(ShopOnlineAPIException):
    """
    Exception for admin invitation errors.
    """
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Admin invitation failed.'
    default_code = 'invitation_error'
    error_code = 'INV_001'


class InvalidInvitationTokenError(InvitationError):
    """
    Exception for invalid invitation token errors.
    """
    default_detail = 'Invalid or expired invitation token.'
    error_code = 'INV_001'


class InvitationExpiredError(InvitationError):
    """
    Exception for expired invitation errors.
    """
    default_detail = 'This invitation has expired.'
    error_code = 'INV_002'


class InvitationAlreadyUsedError(InvitationError):
    """
    Exception for already used invitation errors.
    """
    default_detail = 'This invitation has already been used.'
    error_code = 'INV_003'


class InvalidEmailDomainError(ValidationError):
    """
    Exception for invalid email domain errors.
    """
    default_detail = 'Invalid email domain for this account type.'
    error_code = 'INV_004'

    def __init__(self, required_domain=None, provided_email=None, **kwargs):
        """
        Initialize with email domain details.
        """
        extra_data = kwargs.get('extra_data', {})
        if required_domain:
            extra_data['required_domain'] = required_domain
        if provided_email:
            extra_data['provided_email'] = provided_email
        
        kwargs['extra_data'] = extra_data
        super().__init__(**kwargs)


class UgandaPhoneValidationError(ValidationError):
    """
    Exception for Uganda phone number validation errors.
    """
    default_detail = 'Invalid Uganda phone number format.'
    error_code = 'VAL_002'

    def __init__(self, phone_number=None, **kwargs):
        """
        Initialize with phone number details.
        """
        extra_data = kwargs.get('extra_data', {})
        if phone_number:
            extra_data['phone_number'] = phone_number
            extra_data['expected_format'] = '+256XXXXXXXXX'
        
        kwargs['extra_data'] = extra_data
        super().__init__(**kwargs)


class FileUploadError(ShopOnlineAPIException):
    """
    Exception for file upload errors.
    """
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'File upload failed.'
    default_code = 'file_upload_error'
    error_code = 'VAL_005'


class FileSizeError(FileUploadError):
    """
    Exception for file size errors.
    """
    default_detail = 'File size exceeds maximum allowed size.'

    def __init__(self, file_size=None, max_size=None, **kwargs):
        """
        Initialize with file size details.
        """
        extra_data = kwargs.get('extra_data', {})
        if file_size:
            extra_data['file_size'] = file_size
        if max_size:
            extra_data['max_size'] = max_size
        
        kwargs['extra_data'] = extra_data
        super().__init__(**kwargs)


class InvalidFileTypeError(FileUploadError):
    """
    Exception for invalid file type errors.
    """
    default_detail = 'Invalid file type.'

    def __init__(self, file_type=None, allowed_types=None, **kwargs):
        """
        Initialize with file type details.
        """
        extra_data = kwargs.get('extra_data', {})
        if file_type:
            extra_data['file_type'] = file_type
        if allowed_types:
            extra_data['allowed_types'] = allowed_types
        
        kwargs['extra_data'] = extra_data
        super().__init__(**kwargs)


class RateLimitError(ShopOnlineAPIException):
    """
    Exception for rate limiting errors.
    """
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_detail = 'Rate limit exceeded. Please try again later.'
    default_code = 'rate_limit_exceeded'
    error_code = 'SHO_004'

    def __init__(self, limit=None, window=None, retry_after=None, **kwargs):
        """
        Initialize with rate limit details.
        """
        extra_data = kwargs.get('extra_data', {})
        if limit:
            extra_data['limit'] = limit
        if window:
            extra_data['window'] = window
        if retry_after:
            extra_data['retry_after'] = retry_after
        
        kwargs['extra_data'] = extra_data
        super().__init__(**kwargs)


class ExternalServiceError(ShopOnlineAPIException):
    """
    Exception for external service errors.
    """
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = 'External service is currently unavailable.'
    default_code = 'external_service_error'
    error_code = 'SHO_005'

    def __init__(self, service_name=None, **kwargs):
        """
        Initialize with service details.
        """
        extra_data = kwargs.get('extra_data', {})
        if service_name:
            extra_data['service_name'] = service_name
        
        kwargs['extra_data'] = extra_data
        super().__init__(**kwargs)


class CacheError(ShopOnlineAPIException):
    """
    Exception for cache-related errors.
    """
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'Cache operation failed.'
    default_code = 'cache_error'
    error_code = 'SHO_006'


class DatabaseError(ShopOnlineAPIException):
    """
    Exception for database-related errors.
    """
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'Database operation failed.'
    default_code = 'database_error'
    error_code = 'SHO_007'


class BusinessLogicError(ShopOnlineAPIException):
    """
    Exception for business logic violations.
    """
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    default_detail = 'Business logic violation.'
    default_code = 'business_logic_error'
    error_code = 'SHO_008'


def custom_exception_handler(exc, context):
    """
    Custom exception handler for DRF that handles ShopOnline exceptions.
    """
    from rest_framework.views import exception_handler  # Moved import here
    
    # Handle ShopOnline API exceptions
    if isinstance(exc, ShopOnlineAPIException):
        logger.error(f"ShopOnline API Exception: {exc.error_code} - {exc.detail}", 
                    exc_info=True, extra={'context': context})
        
        return Response(
            exc.get_full_details(),
            status=exc.status_code
        )
    
    # Handle Django validation errors
    if isinstance(exc, DjangoValidationError):
        logger.warning(f"Django Validation Error: {exc}", extra={'context': context})
        
        error_detail = {
            'error_code': 'VAL_001',
            'message': 'Validation failed.',
            'details': exc.message_dict if hasattr(exc, 'message_dict') else str(exc),
            'timestamp': timezone.now().isoformat(),
        }
        
        return Response(error_detail, status=status.HTTP_400_BAD_REQUEST)
    
    # Call DRF's default exception handler for other exceptions
    response = exception_handler(exc, context)
    
    if response is not None:
        # Enhance DRF's default error response
        custom_response_data = {
            'error_code': 'SHO_001',
            'message': 'An error occurred.',
            'details': response.data,
            'timestamp': timezone.now().isoformat(),
        }
        
        # Add specific error codes based on status
        if response.status_code == 400:
            custom_response_data['error_code'] = 'VAL_001'
            custom_response_data['message'] = 'Invalid input provided.'
        elif response.status_code == 401:
            custom_response_data['error_code'] = 'AUTH_001'
            custom_response_data['message'] = 'Authentication required.'
        elif response.status_code == 403:
            custom_response_data['error_code'] = 'AUTH_005'
            custom_response_data['message'] = 'Permission denied.'
        elif response.status_code == 404:
            custom_response_data['error_code'] = 'SHO_002'
            custom_response_data['message'] = 'Resource not found.'
        elif response.status_code == 405:
            custom_response_data['error_code'] = 'SHO_009'
            custom_response_data['message'] = 'Method not allowed.'
        elif response.status_code >= 500:
            custom_response_data['error_code'] = 'SHO_001'
            custom_response_data['message'] = 'Internal server error.'
        
        response.data = custom_response_data
        
        # Log the error
        logger.error(f"API Error {response.status_code}: {custom_response_data['message']}", 
                    exc_info=True, extra={'context': context})
    
    return response


def handle_validation_error(errors, error_code='VAL_001'):
    """
    Helper function to raise ValidationError with proper formatting.
    """
    if isinstance(errors, dict):
        # Multiple field errors
        formatted_errors = []
        for field, field_errors in errors.items():
            if isinstance(field_errors, list):
                for error in field_errors:
                    formatted_errors.append(f"{field}: {error}")
            else:
                formatted_errors.append(f"{field}: {field_errors}")
        
        detail = '; '.join(formatted_errors)
    else:
        detail = str(errors)
    
    raise ValidationError(
        detail=detail,
        error_code=error_code,
        extra_data={'field_errors': errors if isinstance(errors, dict) else None}
    )


def handle_payment_error(provider, error_message, transaction_id=None):
    """
    Helper function to raise appropriate payment error based on provider.
    """
    if provider.lower() == 'mtn':
        raise MTNMoMoError(
            detail=error_message,
            transaction_id=transaction_id
        )
    elif provider.lower() == 'airtel':
        raise AirtelMoneyError(
            detail=error_message,
            transaction_id=transaction_id
        )
    else:
        raise PaymentError(
            detail=error_message,
            extra_data={'provider': provider, 'transaction_id': transaction_id}
        )


def handle_order_error(error_type, **kwargs):
    """
    Helper function to raise appropriate order error.
    """
    if error_type == 'out_of_stock':
        raise OutOfStockError(**kwargs)
    elif error_type == 'invalid_status':
        raise InvalidOrderStatusError(**kwargs)
    else:
        raise OrderError(**kwargs)


def handle_flash_sale_error(error_type, **kwargs):
    """
    Helper function to raise appropriate flash sale error.
    """
    if error_type == 'expired':
        raise FlashSaleExpiredError(**kwargs)
    elif error_type == 'not_active':
        raise FlashSaleNotActiveError(**kwargs)
    elif error_type == 'limit_exceeded':
        raise FlashSaleLimitExceededError(**kwargs)
    else:
        raise FlashSaleError(**kwargs)