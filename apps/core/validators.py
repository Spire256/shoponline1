"""
Custom validators for ShopOnline Uganda E-commerce Platform.

Provides validation functions for:
- Uganda phone numbers
- Email domains
- File uploads
- Currency amounts
- Business rules
- Admin invitations
- Flash sales
- Orders
"""

import re
from decimal import Decimal
from typing import List, Optional
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator, EmailValidator
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from datetime import datetime, timedelta

from .constants import (
    ADMIN_EMAIL_DOMAIN, CLIENT_EMAIL_DOMAIN, ALL_UGANDA_PREFIXES,
    UGANDA_COUNTRY_CODE, ALLOWED_IMAGE_EXTENSIONS, ALLOWED_DOCUMENT_EXTENSIONS,
    MAX_IMAGE_SIZE, MAX_DOCUMENT_SIZE, PASSWORD_REQUIREMENTS,
    MAX_DISCOUNT_PERCENTAGE, MIN_DISCOUNT_PERCENTAGE
)
from .utils import clean_phone_number, get_file_extension


# =============================================================================
# PHONE NUMBER VALIDATORS
# =============================================================================

def validate_uganda_phone_number(phone_number: str) -> None:
    """
    Validate Uganda phone number format.
    
    Args:
        phone_number: Phone number to validate
        
    Raises:
        ValidationError: If phone number is invalid
    """
    if not phone_number:
        raise ValidationError(_('Phone number is required.'))
    
    # Clean the phone number
    cleaned = clean_phone_number(phone_number)
    
    # Check format: +256XXXXXXXXX (13 characters total)
    if len(cleaned) != 13:
        raise ValidationError(
            _('Phone number must be in format +256XXXXXXXXX (13 digits total).')
        )
    
    if not cleaned.startswith(UGANDA_COUNTRY_CODE):
        raise ValidationError(
            _('Phone number must start with Uganda country code +256.')
        )
    
    # Extract the local part (after +256)
    local_part = cleaned[4:]
    
    # Check if it starts with a valid prefix
    valid_prefix = False
    for prefix in ALL_UGANDA_PREFIXES:
        if local_part.startswith(prefix):
            valid_prefix = True
            break
    
    if not valid_prefix:
        raise ValidationError(
            _('Invalid Uganda phone number prefix. Valid prefixes: {}').format(
                ', '.join(ALL_UGANDA_PREFIXES)
            )
        )
    
    # Check if remaining digits are numeric
    if not local_part.isdigit():
        raise ValidationError(_('Phone number must contain only digits.'))


def validate_mtn_phone_number(phone_number: str) -> None:
    """
    Validate MTN Uganda phone number.
    
    Args:
        phone_number: Phone number to validate
        
    Raises:
        ValidationError: If not a valid MTN number
    """
    validate_uganda_phone_number(phone_number)
    
    cleaned = clean_phone_number(phone_number)
    local_part = cleaned[4:]  # Remove +256
    
    mtn_prefixes = ['077', '078', '039']
    
    valid_mtn = False
    for prefix in mtn_prefixes:
        if local_part.startswith(prefix):
            valid_mtn = True
            break
    
    if not valid_mtn:
        raise ValidationError(
            _('This is not a valid MTN phone number. Valid MTN prefixes: {}').format(
                ', '.join(mtn_prefixes)
            )
        )


def validate_airtel_phone_number(phone_number: str) -> None:
    """
    Validate Airtel Uganda phone number.
    
    Args:
        phone_number: Phone number to validate
        
    Raises:
        ValidationError: If not a valid Airtel number
    """
    validate_uganda_phone_number(phone_number)
    
    cleaned = clean_phone_number(phone_number)
    local_part = cleaned[4:]  # Remove +256
    
    airtel_prefixes = ['070', '075', '074']
    
    valid_airtel = False
    for prefix in airtel_prefixes:
        if local_part.startswith(prefix):
            valid_airtel = True
            break
    
    if not valid_airtel:
        raise ValidationError(
            _('This is not a valid Airtel phone number. Valid Airtel prefixes: {}').format(
                ', '.join(airtel_prefixes)
            )
        )


# =============================================================================
# EMAIL VALIDATORS
# =============================================================================

def validate_admin_email(email: str) -> None:
    """
    Validate admin email domain.
    
    Args:
        email: Email address to validate
        
    Raises:
        ValidationError: If email domain is invalid for admin
    """
    if not email:
        raise ValidationError(_('Email address is required.'))
    
    # First validate basic email format
    email_validator = EmailValidator()
    email_validator(email)
    
    # Check admin domain
    if not email.lower().endswith(ADMIN_EMAIL_DOMAIN.lower()):
        raise ValidationError(
            _('Admin accounts must use email addresses ending with {}').format(
                ADMIN_EMAIL_DOMAIN
            )
        )


def validate_client_email(email: str) -> None:
    """
    Validate client email domain.
    
    Args:
        email: Email address to validate
        
    Raises:
        ValidationError: If email domain is invalid for client
    """
    if not email:
        raise ValidationError(_('Email address is required.'))
    
    # First validate basic email format
    email_validator = EmailValidator()
    email_validator(email)
    
    # Check client domain
    if not email.lower().endswith(CLIENT_EMAIL_DOMAIN.lower()):
        raise ValidationError(
            _('Client accounts must use email addresses ending with {}').format(
                CLIENT_EMAIL_DOMAIN
            )
        )


def validate_email_domain(email: str, allowed_domains: List[str]) -> None:
    """
    Validate email against allowed domains.
    
    Args:
        email: Email address to validate
        allowed_domains: List of allowed domains
        
    Raises:
        ValidationError: If email domain is not allowed
    """
    if not email:
        raise ValidationError(_('Email address is required.'))
    
    # First validate basic email format
    email_validator = EmailValidator()
    email_validator(email)
    
    # Check if domain is allowed
    email_lower = email.lower()
    domain_allowed = False
    
    for domain in allowed_domains:
        if email_lower.endswith(domain.lower()):
            domain_allowed = True
            break
    
    if not domain_allowed:
        raise ValidationError(
            _('Email domain not allowed. Allowed domains: {}').format(
                ', '.join(allowed_domains)
            )
        )


# =============================================================================
# FILE VALIDATORS
# =============================================================================

def validate_image_file(uploaded_file) -> None:
    """
    Validate uploaded image file.
    
    Args:
        uploaded_file: Django UploadedFile object
        
    Raises:
        ValidationError: If file is invalid
    """
    if not uploaded_file:
        raise ValidationError(_('No file uploaded.'))
    
    # Check file extension
    file_extension = get_file_extension(uploaded_file.name)
    if file_extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValidationError(
            _('Invalid image format. Allowed formats: {}').format(
                ', '.join(ALLOWED_IMAGE_EXTENSIONS)
            )
        )
    
    # Check file size
    if uploaded_file.size > MAX_IMAGE_SIZE:
        max_size_mb = MAX_IMAGE_SIZE / (1024 * 1024)
        raise ValidationError(
            _('Image file too large. Maximum size is {:.1f}MB').format(max_size_mb)
        )
    
    # Additional validation for image content
    try:
        from PIL import Image
        
        # Try to open and verify the image
        image = Image.open(uploaded_file)
        image.verify()
        
        # Reset file pointer after verification
        uploaded_file.seek(0)
        
    except ImportError:
        # PIL not available, skip image content validation
        pass
    except Exception:
        raise ValidationError(_('Invalid image file. File may be corrupted.'))


def validate_document_file(uploaded_file) -> None:
    """
    Validate uploaded document file.
    
    Args:
        uploaded_file: Django UploadedFile object
        
    Raises:
        ValidationError: If file is invalid
    """
    if not uploaded_file:
        raise ValidationError(_('No file uploaded.'))
    
    # Check file extension
    file_extension = get_file_extension(uploaded_file.name)
    if file_extension not in ALLOWED_DOCUMENT_EXTENSIONS:
        raise ValidationError(
            _('Invalid document format. Allowed formats: {}').format(
                ', '.join(ALLOWED_DOCUMENT_EXTENSIONS)
            )
        )
    
    # Check file size
    if uploaded_file.size > MAX_DOCUMENT_SIZE:
        max_size_mb = MAX_DOCUMENT_SIZE / (1024 * 1024)
        raise ValidationError(
            _('Document file too large. Maximum size is {:.1f}MB').format(max_size_mb)
        )


def validate_file_name(filename: str) -> None:
    """
    Validate filename for security.
    
    Args:
        filename: Filename to validate
        
    Raises:
        ValidationError: If filename is invalid
    """
    if not filename:
        raise ValidationError(_('Filename is required.'))
    
    # Check for dangerous characters
    dangerous_chars = ['/', '\\', '..', '<', '>', ':', '"', '|', '?', '*']
    for char in dangerous_chars:
        if char in filename:
            raise ValidationError(
                _('Filename contains invalid characters: {}').format(char)
            )
    
    # Check filename length
    if len(filename) > 255:
        raise ValidationError(_('Filename too long. Maximum 255 characters.'))
    
    # Check for hidden files (starting with .)
    if filename.startswith('.'):
        raise ValidationError(_('Hidden files are not allowed.'))


# =============================================================================
# CURRENCY VALIDATORS
# =============================================================================

def validate_ugx_amount(amount) -> None:
    """
    Validate Uganda Shillings amount.
    
    Args:
        amount: Amount to validate
        
    Raises:
        ValidationError: If amount is invalid
    """
    if amount is None:
        raise ValidationError(_('Amount is required.'))
    
    try:
        amount = Decimal(str(amount))
    except (ValueError, TypeError):
        raise ValidationError(_('Invalid amount format.'))
    
    if amount < 0:
        raise ValidationError(_('Amount cannot be negative.'))
    
    if amount > Decimal('999999999'):  # 999 million UGX
        raise ValidationError(_('Amount too large. Maximum is 999,999,999 UGX.'))
    
    # Check for reasonable decimal places (UGX doesn't use decimals)
    if amount != amount.quantize(Decimal('1')):
        raise ValidationError(_('Uganda Shillings amounts should not have decimal places.'))


def validate_positive_amount(amount) -> None:
    """
    Validate that amount is positive.
    
    Args:
        amount: Amount to validate
        
    Raises:
        ValidationError: If amount is not positive
    """
    validate_ugx_amount(amount)
    
    if Decimal(str(amount)) <= 0:
        raise ValidationError(_('Amount must be greater than zero.'))


def validate_discount_percentage(percentage) -> None:
    """
    Validate discount percentage.
    
    Args:
        percentage: Discount percentage to validate
        
    Raises:
        ValidationError: If percentage is invalid
    """
    if percentage is None:
        raise ValidationError(_('Discount percentage is required.'))
    
    try:
        percentage = Decimal(str(percentage))
    except (ValueError, TypeError):
        raise ValidationError(_('Invalid percentage format.'))
    
    if percentage < MIN_DISCOUNT_PERCENTAGE:
        raise ValidationError(
            _('Discount percentage must be at least {}%').format(MIN_DISCOUNT_PERCENTAGE)
        )
    
    if percentage > MAX_DISCOUNT_PERCENTAGE:
        raise ValidationError