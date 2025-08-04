"""
Core utilities package for ShopOnline Uganda E-commerce Platform.

This package provides shared functionality used across all Django apps:
- Abstract base models
- Base serializers
- Custom permissions
- Pagination classes
- Custom exceptions
- Middleware
- Utility functions
- Validators
- Application constants
"""

__version__ = '1.0.0'
__author__ = 'ShopOnline Uganda Development Team'

# Import commonly used utilities for easy access
from .constants import (
    USER_ROLES,
    ORDER_STATUS,
    PAYMENT_METHODS,
    PAYMENT_STATUS,
    CURRENCY_CODE,
    THEME_COLORS
)

from .exceptions import (
    ShopOnlineAPIException,
    ValidationError,
    PaymentError,
    InvitationError
)

from .utils import (
    generate_order_number,
    format_ugx_currency,
    validate_phone_number,
    generate_secure_token
)

__all__ = [
    'USER_ROLES',
    'ORDER_STATUS', 
    'PAYMENT_METHODS',
    'PAYMENT_STATUS',
    'CURRENCY_CODE',
    'THEME_COLORS',
    'ShopOnlineAPIException',
    'ValidationError',
    'PaymentError',
    'InvitationError',
    'generate_order_number',
    'format_ugx_currency',
    'validate_phone_number',
    'generate_secure_token'
]