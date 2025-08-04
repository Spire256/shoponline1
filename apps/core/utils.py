"""
Core utility functions for ShopOnline Uganda E-commerce Platform.

Provides common utility functions:
- Currency formatting (Uganda Shillings)
- Phone number validation and formatting
- Token generation
- Order number generation
- File handling utilities
- Date/time utilities
- Text processing utilities
- Email utilities
"""

import re
import uuid
import random
import string
import hashlib
import secrets
from decimal import Decimal
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils.text import slugify
import logging

from .constants import (
    CURRENCY_CODE, CURRENCY_SYMBOL, THOUSAND_SEPARATOR, DECIMAL_SEPARATOR,
    UGANDA_PHONE_PREFIXES, ALL_UGANDA_PREFIXES, UGANDA_COUNTRY_CODE,
    ALLOWED_IMAGE_EXTENSIONS, MAX_IMAGE_SIZE
)

logger = logging.getLogger(__name__)


# =============================================================================
# CURRENCY UTILITIES
# =============================================================================

def format_ugx_currency(amount: Decimal, include_symbol: bool = True) -> str:
    """
    Format amount as Uganda Shillings currency.
    
    Args:
        amount: Decimal amount to format
        include_symbol: Whether to include currency symbol
    
    Returns:
        Formatted currency string
    """
    if amount is None:
        return f"{CURRENCY_SYMBOL} 0" if include_symbol else "0"
    
    try:
        # Convert to Decimal for precision
        if not isinstance(amount, Decimal):
            amount = Decimal(str(amount))
        
        # Format with thousand separators (no decimal places for UGX)
        formatted = f"{int(amount):,}".replace(',', THOUSAND_SEPARATOR)
        
        if include_symbol:
            return f"{CURRENCY_SYMBOL} {formatted}"
        
        return formatted
    
    except (ValueError, TypeError):
        return f"{CURRENCY_SYMBOL} 0" if include_symbol else "0"


def parse_ugx_currency(currency_string: str) -> Decimal:
    """
    Parse UGX currency string to Decimal.
    
    Args:
        currency_string: Currency string to parse
    
    Returns:
        Decimal amount
    """
    if not currency_string:
        return Decimal('0')
    
    # Remove currency symbol and spaces
    cleaned = currency_string.replace(CURRENCY_SYMBOL, '').replace('UGX', '').strip()
    
    # Remove thousand separators
    cleaned = cleaned.replace(THOUSAND_SEPARATOR, '')
    
    try:
        return Decimal(cleaned)
    except (ValueError, TypeError):
        return Decimal('0')


def calculate_tax(amount: Decimal, tax_rate: Decimal = Decimal('0.18')) -> Decimal:
    """
    Calculate tax amount (default 18% VAT for Uganda).
    
    Args:
        amount: Base amount
        tax_rate: Tax rate as decimal (0.18 for 18%)
    
    Returns:
        Tax amount
    """
    if not amount or amount <= 0:
        return Decimal('0')
    
    return amount * tax_rate


def calculate_total_with_tax(amount: Decimal, tax_rate: Decimal = Decimal('0.18')) -> Decimal:
    """
    Calculate total amount including tax.
    
    Args:
        amount: Base amount
        tax_rate: Tax rate as decimal
    
    Returns:
        Total amount including tax
    """
    if not amount or amount <= 0:
        return Decimal('0')
    
    tax_amount = calculate_tax(amount, tax_rate)
    return amount + tax_amount


# =============================================================================
# PHONE NUMBER UTILITIES
# =============================================================================

def validate_phone_number(phone_number: str) -> bool:
    """
    Validate if phone number is a valid Uganda phone number.
    
    Args:
        phone_number: Phone number to validate
    
    Returns:
        True if valid, False otherwise
    """
    if not phone_number:
        return False
    
    # Clean the phone number
    cleaned = clean_phone_number(phone_number)
    
    # Check format: +256XXXXXXXXX (13 characters total)
    if len(cleaned) != 13:
        return False
    
    if not cleaned.startswith(UGANDA_COUNTRY_CODE):
        return False
    
    # Extract the local part (after +256)
    local_part = cleaned[4:]  # Remove +256
    
    # Check if it starts with a valid prefix
    for prefix in ALL_UGANDA_PREFIXES:
        if local_part.startswith(prefix):
            return True
    
    return False


def clean_phone_number(phone_number: str) -> str:
    """
    Clean and normalize phone number.
    
    Args:
        phone_number: Phone number to clean
    
    Returns:
        Cleaned phone number
    """
    if not phone_number:
        return ""
    
    # Remove all non-digit characters except +
    cleaned = re.sub(r'[^\d+]', '', phone_number)
    
    # Handle different input formats
    if cleaned.startswith('0'):
        # Local format: 0XXXXXXXXX -> +256XXXXXXXXX
        cleaned = UGANDA_COUNTRY_CODE + cleaned[1:]
    elif cleaned.startswith('256'):
        # Without country code sign: 256XXXXXXXXX -> +256XXXXXXXXX
        cleaned = '+' + cleaned
    elif not cleaned.startswith('+'):
        # Assume it's a local number without leading 0
        cleaned = UGANDA_COUNTRY_CODE + cleaned
    
    return cleaned


def format_phone_number(phone_number: str, format_style: str = 'international') -> str:
    """
    Format phone number for display.
    
    Args:
        phone_number: Phone number to format
        format_style: 'international', 'national', or 'compact'
    
    Returns:
        Formatted phone number
    """
    if not validate_phone_number(phone_number):
        return phone_number  # Return as-is if invalid
    
    cleaned = clean_phone_number(phone_number)
    
    if format_style == 'international':
        # +256 777 123 456
        return f"{cleaned[:4]} {cleaned[4:7]} {cleaned[7:10]} {cleaned[10:]}"
    elif format_style == 'national':
        # 0777 123 456
        local_part = cleaned[4:]  # Remove +256
        return f"0{local_part[:3]} {local_part[3:6]} {local_part[6:]}"
    else:  # compact
        return cleaned


def get_phone_provider(phone_number: str) -> Optional[str]:
    """
    Determine mobile provider from phone number.
    
    Args:
        phone_number: Phone number to check
    
    Returns:
        Provider name or None if unknown
    """
    if not validate_phone_number(phone_number):
        return None
    
    cleaned = clean_phone_number(phone_number)
    local_part = cleaned[4:]  # Remove +256
    
    for provider, prefixes in UGANDA_PHONE_PREFIXES.items():
        for prefix in prefixes:
            if local_part.startswith(prefix):
                return provider
    
    return None


# =============================================================================
# TOKEN AND ID GENERATION
# =============================================================================

def generate_secure_token(length: int = 32) -> str:
    """
    Generate a cryptographically secure random token.
    
    Args:
        length: Length of the token
    
    Returns:
        Secure random token
    """
    return secrets.token_urlsafe(length)


def generate_order_number(prefix: str = 'ORD') -> str:
    """
    Generate unique order number.
    
    Args:
        prefix: Prefix for the order number
    
    Returns:
        Unique order number
    """
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_part = ''.join(random.choices(string.digits, k=4))
    return f"{prefix}{timestamp}{random_part}"


def generate_transaction_id(prefix: str = 'TXN') -> str:
    """
    Generate unique transaction ID.
    
    Args:
        prefix: Prefix for the transaction ID
    
    Returns:
        Unique transaction ID
    """
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"{prefix}{timestamp}{random_part}"


def generate_invitation_token() -> str:
    """
    Generate secure invitation token for admin invitations.
    
    Returns:
        Secure invitation token
    """
    return generate_secure_token(32)


def generate_api_key() -> str:
    """
    Generate API key for external integrations.
    
    Returns:
        API key
    """
    return f"sk_{''.join(random.choices(string.ascii_letters + string.digits, k=32))}"


# =============================================================================
# FILE UTILITIES
# =============================================================================

def get_file_extension(filename: str) -> str:
    """
    Get file extension from filename.
    
    Args:
        filename: Name of the file
    
    Returns:
        File extension (lowercase, without dot)
    """
    if not filename:
        return ''
    
    parts = filename.split('.')
    if len(parts) > 1:
        return parts[-1].lower()
    
    return ''


def is_valid_image_file(filename: str) -> bool:
    """
    Check if file is a valid image file.
    
    Args:
        filename: Name of the file
    
    Returns:
        True if valid image file, False otherwise
    """
    extension = get_file_extension(filename)
    return extension in ALLOWED_IMAGE_EXTENSIONS


def generate_unique_filename(original_filename: str, prefix: str = '') -> str:
    """
    Generate unique filename while preserving extension.
    
    Args:
        original_filename: Original filename
        prefix: Optional prefix for the filename
    
    Returns:
        Unique filename
    """
    extension = get_file_extension(original_filename)
    unique_id = uuid.uuid4().hex
    
    if prefix:
        return f"{prefix}_{unique_id}.{extension}"
    
    return f"{unique_id}.{extension}"


def calculate_file_hash(file_path: str) -> str:
    """
    Calculate MD5 hash of a file.
    
    Args:
        file_path: Path to the file
    
    Returns:
        MD5 hash of the file
    """
    hash_md5 = hashlib.md5()
    try:
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    except (IOError, OSError):
        return ""


def format_file_size(size_bytes: int) -> str:
    """
    Format file size in human-readable format.
    
    Args:
        size_bytes: Size in bytes
    
    Returns:
        Formatted file size string
    """
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    size = float(size_bytes)
    
    while size >= 1024.0 and i < len(size_names) - 1:
        size /= 1024.0
        i += 1
    
    return f"{size:.1f} {size_names[i]}"


# =============================================================================
# DATE AND TIME UTILITIES
# =============================================================================

def get_uganda_time() -> datetime:
    """
    Get current time in Uganda timezone.
    
    Returns:
        Current datetime in Uganda timezone
    """
    from .constants import UGANDA_TIMEZONE
    import pytz
    
    uganda_tz = pytz.timezone(UGANDA_TIMEZONE)
    return datetime.now(uganda_tz)


def format_uganda_datetime(dt: datetime, format_string: str = '%B %d, %Y at %I:%M %p') -> str:
    """
    Format datetime for Uganda locale.
    
    Args:
        dt: Datetime to format
        format_string: Format string
    
    Returns:
        Formatted datetime string
    """
    if not dt:
        return ""
    
    # Convert to Uganda timezone if needed
    if dt.tzinfo is None:
        from .constants import UGANDA_TIMEZONE
        import pytz
        uganda_tz = pytz.timezone(UGANDA_TIMEZONE)
        dt = uganda_tz.localize(dt)
    
    return dt.strftime(format_string)


def get_relative_time(dt: datetime) -> str:
    """
    Get relative time string (e.g., '2 hours ago').
    
    Args:
        dt: Datetime to convert
    
    Returns:
        Relative time string
    """
    if not dt:
        return ""
    
    now = timezone.now()
    diff = now - dt
    
    if diff.days > 0:
        if diff.days == 1:
            return "1 day ago"
        elif diff.days < 7:
            return f"{diff.days} days ago"
        elif diff.days < 30:
            weeks = diff.days // 7
            return f"{weeks} week{'s' if weeks > 1 else ''} ago"
        elif diff.days < 365:
            months = diff.days // 30
            return f"{months} month{'s' if months > 1 else ''} ago"
        else:
            years = diff.days // 365
            return f"{years} year{'s' if years > 1 else ''} ago"
    
    hours = diff.seconds // 3600
    if hours > 0:
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    
    minutes = diff.seconds // 60
    if minutes > 0:
        return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
    
    return "Just now"


def add_business_days(start_date: datetime, days: int) -> datetime:
    """
    Add business days to a date (excluding weekends).
    
    Args:
        start_date: Starting date
        days: Number of business days to add
    
    Returns:
        End date after adding business days
    """
    current_date = start_date
    added_days = 0
    
    while added_days < days:
        current_date += timedelta(days=1)
        # Skip weekends (Saturday=5, Sunday=6)
        if current_date.weekday() < 5:
            added_days += 1
    
    return current_date


def is_business_day(date: datetime) -> bool:
    """
    Check if date is a business day (Monday-Friday).
    
    Args:
        date: Date to check
    
    Returns:
        True if business day, False if weekend
    """
    return date.weekday() < 5


# =============================================================================
# TEXT PROCESSING UTILITIES
# =============================================================================

def create_slug(text: str, max_length: int = 50) -> str:
    """
    Create URL-friendly slug from text.
    
    Args:
        text: Text to convert to slug
        max_length: Maximum length of slug
    
    Returns:
        URL-friendly slug
    """
    if not text:
        return ""
    
    # Use Django's slugify function
    slug = slugify(text)
    
    # Truncate if too long
    if len(slug) > max_length:
        slug = slug[:max_length].rstrip('-')
    
    return slug


def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """
    Truncate text to specified length with suffix.
    
    Args:
        text: Text to truncate
        max_length: Maximum length
        suffix: Suffix to add if truncated
    
    Returns:
        Truncated text
    """
    if not text or len(text) <= max_length:
        return text
    
    return text[:max_length - len(suffix)] + suffix


def clean_html(html_content: str) -> str:
    """
    Strip HTML tags from content.
    
    Args:
        html_content: HTML content to clean
    
    Returns:
        Clean text without HTML tags
    """
    if not html_content:
        return ""
    
    return strip_tags(html_content)


def capitalize_words(text: str) -> str:
    """
    Capitalize each word in text (title case).
    
    Args:
        text: Text to capitalize
    
    Returns:
        Title-cased text
    """
    if not text:
        return ""
    
    return ' '.join(word.capitalize() for word in text.split())


def extract_keywords(text: str, max_keywords: int = 10) -> List[str]:
    """
    Extract keywords from text for SEO purposes.
    
    Args:
        text: Text to extract keywords from
        max_keywords: Maximum number of keywords
    
    Returns:
        List of keywords
    """
    if not text:
        return []
    
    # Remove HTML and clean text
    clean_text = clean_html(text).lower()
    
    # Remove common words (basic stop words)
    stop_words = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
        'could', 'can', 'may', 'might', 'must', 'this', 'that', 'these', 'those'
    }
    
    # Extract words
    words = re.findall(r'\b[a-zA-Z]{3,}\b', clean_text)
    
    # Filter out stop words and count frequency
    word_freq = {}
    for word in words:
        if word not in stop_words:
            word_freq[word] = word_freq.get(word, 0) + 1
    
    # Sort by frequency and return top keywords
    sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
    return [word for word, freq in sorted_words[:max_keywords]]


# =============================================================================
# EMAIL UTILITIES
# =============================================================================

def send_template_email(
    template_name: str,
    context: Dict[str, Any],
    subject: str,
    to_emails: List[str],
    from_email: Optional[str] = None
) -> bool:
    """
    Send email using Django template.
    
    Args:
        template_name: Name of the email template
        context: Template context variables
        subject: Email subject
        to_emails: List of recipient emails
        from_email: Sender email (optional)
    
    Returns:
        True if sent successfully, False otherwise
    """
    try:
        if not from_email:
            from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@shoponline.ug')
        
        # Render email content
        html_content = render_to_string(f'emails/{template_name}.html', context)
        text_content = render_to_string(f'emails/{template_name}.txt', context)
        
        # Send email
        send_mail(
            subject=subject,
            message=text_content,
            from_email=from_email,
            recipient_list=to_emails,
            html_message=html_content,
            fail_silently=False
        )
        
        logger.info(f"Email sent successfully to {', '.join(to_emails)}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False


def send_admin_invitation_email(email: str, token: str, invited_by: str) -> bool:
    """
    Send admin invitation email.
    
    Args:
        email: Recipient email
        token: Invitation token
        invited_by: Name of user who sent invitation
    
    Returns:
        True if sent successfully, False otherwise
    """
    invitation_url = f"{settings.FRONTEND_URL}/admin/register?token={token}"
    
    context = {
        'email': email,
        'invitation_url': invitation_url,
        'invited_by': invited_by,
        'expiry_hours': 48,
        'site_name': 'ShopOnline Uganda',
    }
    
    return send_template_email(
        template_name='admin_invitation',
        context=context,
        subject='Admin Invitation - ShopOnline Uganda',
        to_emails=[email]
    )


def send_order_confirmation_email(order, customer_email: str) -> bool:
    """
    Send order confirmation email to customer.
    
    Args:
        order: Order instance
        customer_email: Customer email
    
    Returns:
        True if sent successfully, False otherwise
    """
    context = {
        'order': order,
        'customer_email': customer_email,
        'site_name': 'ShopOnline Uganda',
        'support_email': 'support@shoponline.ug',
    }
    
    return send_template_email(
        template_name='order_confirmation',
        context=context,
        subject=f'Order Confirmation #{order.order_number}',
        to_emails=[customer_email]
    )


def send_cod_notification_email(order, admin_emails: List[str]) -> bool:
    """
    Send Cash on Delivery notification to admins.
    
    Args:
        order: Order instance
        admin_emails: List of admin emails
    
    Returns:
        True if sent successfully, False otherwise
    """
    context = {
        'order': order,
        'admin_dashboard_url': f"{settings.FRONTEND_URL}/admin/orders/{order.id}",
        'site_name': 'ShopOnline Uganda',
    }
    
    return send_template_email(
        template_name='cod_notification',
        context=context,
        subject=f'New COD Order #{order.order_number}',
        to_emails=admin_emails
    )


# =============================================================================
# VALIDATION UTILITIES
# =============================================================================

def validate_uganda_phone_number(phone_number: str) -> bool:
    """
    Validate Uganda phone number and raise exception if invalid.
    
    Args:
        phone_number: Phone number to validate
    
    Raises:
        ValidationError: If phone number is invalid
    
    Returns:
        True if valid
    """
    if not validate_phone_number(phone_number):
        from .exceptions import UgandaPhoneValidationError
        raise UgandaPhoneValidationError(phone_number=phone_number)
    
    return True


def validate_email_domain(email: str, allowed_domains: List[str]) -> bool:
    """
    Validate email domain against allowed domains.
    
    Args:
        email: Email to validate
        allowed_domains: List of allowed domains
    
    Returns:
        True if domain is allowed, False otherwise
    """
    if not email:
        return False
    
    domain = email.split('@')[-1].lower()
    return any(domain.endswith(allowed_domain.lower()) for allowed_domain in allowed_domains)


def validate_image_file(file) -> bool:
    """
    Validate uploaded image file.
    
    Args:
        file: Uploaded file object
    
    Returns:
        True if valid image file
    
    Raises:
        ValidationError: If file is invalid
    """
    # Check file extension
    if not is_valid_image_file(file.name):
        from .exceptions import InvalidFileTypeError
        raise InvalidFileTypeError(
            file_type=get_file_extension(file.name),
            allowed_types=ALLOWED_IMAGE_EXTENSIONS
        )
    
    # Check file size
    if file.size > MAX_IMAGE_SIZE:
        from .exceptions import FileSizeError
        raise FileSizeError(
            file_size=file.size,
            max_size=MAX_IMAGE_SIZE
        )
    
    return True


# =============================================================================
# CACHE UTILITIES
# =============================================================================

def get_cache_key(*args) -> str:
    """
    Generate cache key from arguments.
    
    Args:
        *args: Arguments to include in cache key
    
    Returns:
        Cache key string
    """
    key_parts = [str(arg) for arg in args]
    key_string = ':'.join(key_parts)
    
    # Hash if too long
    if len(key_string) > 200:
        return hashlib.md5(key_string.encode()).hexdigest()
    
    return key_string


def invalidate_cache_pattern(pattern: str) -> int:
    """
    Invalidate all cache keys matching pattern.
    
    Args:
        pattern: Cache key pattern
    
    Returns:
        Number of keys invalidated
    """
    from django.core.cache import cache
    
    try:
        if hasattr(cache, 'delete_pattern'):
            return cache.delete_pattern(pattern)
        else:
            # Fallback for cache backends that don't support pattern deletion
            logger.warning(f"Cache backend doesn't support pattern deletion: {pattern}")
            return 0
    except Exception as e:
        logger.error(f"Failed to invalidate cache pattern {pattern}: {e}")
        return 0


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_client_ip(request) -> str:
    """
    Get client IP address from request.
    
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


def get_user_agent(request) -> str:
    """
    Get user agent from request.
    
    Args:
        request: Django request object
    
    Returns:
        User agent string
    """
    return request.META.get('HTTP_USER_AGENT', '')


def is_mobile_request(request) -> bool:
    """
    Check if request is from mobile device.
    
    Args:
        request: Django request object
    
    Returns:
        True if mobile device, False otherwise
    """
    user_agent = get_user_agent(request).lower()
    mobile_keywords = ['mobile', 'android', 'iphone', 'ipad', 'blackberry', 'windows phone']
    return any(keyword in user_agent for keyword in mobile_keywords)


def paginate_queryset(queryset, page: int, page_size: int):
    """
    Manually paginate a queryset.
    
    Args:
        queryset: Django queryset
        page: Page number (1-based)
        page_size: Number of items per page
    
    Returns:
        Tuple of (items, has_next, has_previous, total_count)
    """
    from django.core.paginator import Paginator
    
    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)
    
    return (
        page_obj.object_list,
        page_obj.has_next(),
        page_obj.has_previous(),
        paginator.count
    )


def generate_qr_code(data: str, size: int = 10) -> str:
    """
    Generate QR code for given data.
    
    Args:
        data: Data to encode in QR code
        size: Size of QR code
    
    Returns:
        Base64 encoded QR code image
    """
    try:
        import qrcode
        import io
        import base64
        from PIL import Image
        
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=size,
            border=4,
        )
        qr.add_data(data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        return base64.b64encode(buffer.getvalue()).decode()
        
    except ImportError:
        logger.warning("QR code generation requires 'qrcode' and 'Pillow' packages")
        return ""
    except Exception as e:
        logger.error(f"Failed to generate QR code: {e}")
        return ""


def mask_sensitive_data(data: str, mask_char: str = '*', visible_chars: int = 4) -> str:
    """
    Mask sensitive data (like phone numbers, emails).
    
    Args:
        data: Data to mask
        mask_char: Character to use for masking
        visible_chars: Number of characters to keep visible at the end
    
    Returns:
        Masked data
    """
    if not data or len(data) <= visible_chars:
        return data
    
    mask_length = len(data) - visible_chars
    return mask_char * mask_length + data[-visible_chars:]