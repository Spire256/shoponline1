"""
Application-wide constants for ShopOnline Uganda E-commerce Platform.

Contains all constants used throughout the platform including:
- User roles and permissions
- Order statuses
- Payment methods and statuses
- Currency and formatting
- Blue theme colors
- Uganda-specific configurations
"""

# =============================================================================
# USER ROLES AND PERMISSIONS
# =============================================================================

USER_ROLES = (
    ('admin', 'Administrator'),
    ('client', 'Client Customer'),
)

ADMIN_EMAIL_DOMAIN = '@shoponline.com'
CLIENT_EMAIL_DOMAIN = '@gmail.com'

ALLOWED_EMAIL_DOMAINS = [ADMIN_EMAIL_DOMAIN, CLIENT_EMAIL_DOMAIN]

# =============================================================================
# ORDER MANAGEMENT
# =============================================================================

ORDER_STATUS = (
    ('pending', 'Pending'),
    ('confirmed', 'Confirmed'),
    ('processing', 'Processing'),
    ('out_for_delivery', 'Out for Delivery'),
    ('delivered', 'Delivered'),
    ('cancelled', 'Cancelled'),
    ('refunded', 'Refunded'),
)

ORDER_STATUS_FLOW = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['processing', 'cancelled'],
    'processing': ['out_for_delivery', 'cancelled'],
    'out_for_delivery': ['delivered', 'cancelled'],
    'delivered': ['refunded'],
    'cancelled': [],
    'refunded': []
}

# =============================================================================
# PAYMENT SYSTEM
# =============================================================================

PAYMENT_METHODS = (
    ('mtn_momo', 'MTN Mobile Money'),
    ('airtel_money', 'Airtel Money'),
    ('cod', 'Cash on Delivery'),
)

PAYMENT_STATUS = (
    ('pending', 'Pending'),
    ('processing', 'Processing'),
    ('completed', 'Completed'),
    ('failed', 'Failed'),
    ('cancelled', 'Cancelled'),
    ('refunded', 'Refunded'),
)

MOBILE_MONEY_PROVIDERS = {
    'mtn_momo': {
        'name': 'MTN Mobile Money',
        'code': 'MTN',
        'api_base_url': 'https://sandbox.momodeveloper.mtn.com',
        'currency': 'UGX',
        'phone_prefixes': ['077', '078', '039']
    },
    'airtel_money': {
        'name': 'Airtel Money',
        'code': 'AIRTEL',
        'api_base_url': 'https://openapiuat.airtel.africa',
        'currency': 'UGX',
        'phone_prefixes': ['070', '075', '074']
    }
}

# =============================================================================
# CURRENCY AND FORMATTING
# =============================================================================

CURRENCY_CODE = 'UGX'
CURRENCY_SYMBOL = 'UGX'
CURRENCY_NAME = 'Uganda Shillings'

# Number formatting for Uganda
DECIMAL_PLACES = 0  # UGX doesn't use decimal places
THOUSAND_SEPARATOR = ','
DECIMAL_SEPARATOR = '.'

# =============================================================================
# BLUE THEME COLORS
# =============================================================================

THEME_COLORS = {
    # Primary Blue Palette
    'primary': '#2563eb',
    'primary_dark': '#1e40af',
    'primary_light': '#3b82f6',
    'primary_lighter': '#60a5fa',
    'primary_lightest': '#93c5fd',
    
    # Secondary Colors
    'secondary': '#64748b',
    'secondary_dark': '#475569',
    'secondary_light': '#94a3b8',
    
    # Background Colors
    'background': '#f8fafc',
    'background_white': '#ffffff',
    'background_gray': '#f1f5f9',
    'background_blue': '#eff6ff',
    
    # Text Colors
    'text_primary': '#1e293b',
    'text_secondary': '#64748b',
    'text_muted': '#94a3b8',
    'text_white': '#ffffff',
    
    # Status Colors
    'success': '#10b981',
    'success_light': '#d1fae5',
    'warning': '#f59e0b',
    'warning_light': '#fef3c7',
    'error': '#ef4444',
    'error_light': '#fee2e2',
    'info': '#3b82f6',
    'info_light': '#dbeafe',
    
    # Border Colors
    'border': '#e2e8f0',
    'border_light': '#f1f5f9',
    'border_dark': '#cbd5e1',
    
    # Gradient Colors
    'gradient_primary': 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
    'gradient_light': 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    'gradient_dark': 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
}

# =============================================================================
# PRODUCT MANAGEMENT
# =============================================================================

PRODUCT_STATUS = (
    ('active', 'Active'),
    ('inactive', 'Inactive'),
    ('draft', 'Draft'),
    ('out_of_stock', 'Out of Stock'),
)

PRODUCT_AVAILABILITY = (
    ('in_stock', 'In Stock'),
    ('out_of_stock', 'Out of Stock'),
    ('limited_stock', 'Limited Stock'),
)

# =============================================================================
# FLASH SALES
# =============================================================================

FLASH_SALE_STATUS = (
    ('upcoming', 'Upcoming'),
    ('active', 'Active'),
    ('expired', 'Expired'),
    ('cancelled', 'Cancelled'),
)

DISCOUNT_TYPES = (
    ('percentage', 'Percentage'),
    ('fixed_amount', 'Fixed Amount'),
)

# Maximum discount percentages
MAX_DISCOUNT_PERCENTAGE = 90
MIN_DISCOUNT_PERCENTAGE = 5

# =============================================================================
# FILE UPLOAD SETTINGS
# =============================================================================

ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif']
ALLOWED_DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt']

MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
MAX_DOCUMENT_SIZE = 10 * 1024 * 1024  # 10MB

IMAGE_QUALITY = 85  # JPEG quality
THUMBNAIL_SIZES = {
    'small': (150, 150),
    'medium': (300, 300),
    'large': (600, 600),
}

# =============================================================================
# PAGINATION SETTINGS
# =============================================================================

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

# =============================================================================
# ADMIN INVITATION SYSTEM
# =============================================================================

INVITATION_TOKEN_EXPIRY_HOURS = 48  # 48 hours
INVITATION_TOKEN_LENGTH = 32

INVITATION_STATUS = (
    ('sent', 'Sent'),
    ('used', 'Used'),
    ('expired', 'Expired'),
    ('cancelled', 'Cancelled'),
)

# =============================================================================
# NOTIFICATION SETTINGS
# =============================================================================

NOTIFICATION_TYPES = (
    ('order_created', 'Order Created'),
    ('order_updated', 'Order Updated'),
    ('payment_received', 'Payment Received'),
    ('payment_failed', 'Payment Failed'),
    ('flash_sale_started', 'Flash Sale Started'),
    ('flash_sale_ending', 'Flash Sale Ending Soon'),
    ('low_stock', 'Low Stock Alert'),
    ('admin_invitation', 'Admin Invitation'),
    ('cod_order', 'Cash on Delivery Order'),
)

NOTIFICATION_CHANNELS = (
    ('email', 'Email'),
    ('sms', 'SMS'),
    ('push', 'Push Notification'),
    ('websocket', 'WebSocket'),
)

# =============================================================================
# UGANDA-SPECIFIC SETTINGS
# =============================================================================

UGANDA_PHONE_PREFIXES = {
    'mtn': ['077', '078', '039'],
    'airtel': ['070', '075', '074'],
    'utl': ['041', '071'],
    'lycamobile': ['073'],
    'smart': ['074'],
    'k2': ['072'],
}

ALL_UGANDA_PREFIXES = []
for provider_prefixes in UGANDA_PHONE_PREFIXES.values():
    ALL_UGANDA_PREFIXES.extend(provider_prefixes)

UGANDA_COUNTRY_CODE = '+256'
UGANDA_TIMEZONE = 'Africa/Kampala'

# Common Uganda regions/districts for delivery
UGANDA_REGIONS = [
    'Central',
    'Eastern', 
    'Northern',
    'Western',
    'Kampala',
    'Wakiso',
    'Mukono',
    'Jinja',
    'Mbale',
    'Gulu',
    'Lira',
    'Mbarara',
    'Fort Portal',
    'Kasese'
]

# =============================================================================
# API SETTINGS
# =============================================================================

API_VERSION = 'v1'
API_RATE_LIMITS = {
    'login': '5/minute',
    'register': '3/minute', 
    'password_reset': '3/hour',
    'payment': '10/minute',
    'order_create': '20/hour',
    'admin_invitation': '10/hour',
}

# =============================================================================
# CACHE SETTINGS
# =============================================================================

CACHE_TIMEOUTS = {
    'product_list': 60 * 15,  # 15 minutes
    'category_list': 60 * 30,  # 30 minutes
    'flash_sales': 60 * 5,   # 5 minutes
    'homepage_content': 60 * 60,  # 1 hour
    'user_session': 60 * 60 * 24,  # 24 hours
}

CACHE_KEYS = {
    'product_list': 'products:list:{page}:{filters}',
    'category_list': 'categories:list',
    'flash_sales_active': 'flash_sales:active',
    'homepage_content': 'homepage:content',
    'user_permissions': 'user:permissions:{user_id}',
}

# =============================================================================
# CELERY TASK SETTINGS
# =============================================================================

CELERY_TASK_ROUTES = {
    'flash_sales.tasks.expire_flash_sales': {'queue': 'flash_sales'},
    'orders.tasks.process_order': {'queue': 'orders'},
    'payments.tasks.process_payment': {'queue': 'payments'},
    'notifications.tasks.send_notification': {'queue': 'notifications'},
}

# =============================================================================
# SECURITY SETTINGS
# =============================================================================

JWT_ACCESS_TOKEN_LIFETIME_MINUTES = 15
JWT_REFRESH_TOKEN_LIFETIME_DAYS = 7

PASSWORD_MIN_LENGTH = 8
PASSWORD_REQUIREMENTS = {
    'min_length': 8,
    'require_uppercase': True,
    'require_lowercase': True, 
    'require_numbers': True,
    'require_special_chars': True,
}

# CSRF and CORS settings
ALLOWED_HOSTS_PATTERN = r'^(localhost|127\.0\.0\.1|.*\.shoponline\.ug)$'
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://shoponline.ug',
    'https://www.shoponline.ug',
    'https://admin.shoponline.ug',
]

# =============================================================================
# ERROR CODES
# =============================================================================

ERROR_CODES = {
    # Authentication errors
    'AUTH_001': 'Invalid credentials',
    'AUTH_002': 'Account not activated',
    'AUTH_003': 'Token expired',
    'AUTH_004': 'Invalid token',
    'AUTH_005': 'Insufficient permissions',
    
    # Validation errors
    'VAL_001': 'Invalid email format',
    'VAL_002': 'Invalid phone number',
    'VAL_003': 'Password too weak',
    'VAL_004': 'Required field missing',
    'VAL_005': 'Invalid file format',
    
    # Payment errors
    'PAY_001': 'Payment method not supported',
    'PAY_002': 'Insufficient funds',
    'PAY_003': 'Payment gateway error',
    'PAY_004': 'Invalid payment amount',
    'PAY_005': 'Payment timeout',
    
    # Order errors
    'ORD_001': 'Product out of stock',
    'ORD_002': 'Invalid order status transition',
    'ORD_003': 'Order not found',
    'ORD_004': 'Cannot cancel order',
    'ORD_005': 'Delivery address required',
    
    # Flash sale errors
    'FLS_001': 'Flash sale not active',
    'FLS_002': 'Flash sale expired',
    'FLS_003': 'Product not in flash sale',
    'FLS_004': 'Flash sale limit exceeded',
    
    # Admin invitation errors
    'INV_001': 'Invalid invitation token',
    'INV_002': 'Invitation expired',
    'INV_003': 'Invitation already used',
    'INV_004': 'Invalid email domain for admin',
}

# =============================================================================
# LOGGING SETTINGS
# =============================================================================

LOG_LEVELS = {
    'DEBUG': 10,
    'INFO': 20,
    'WARNING': 30,
    'ERROR': 40,
    'CRITICAL': 50,
}

LOG_CATEGORIES = [
    'authentication',
    'payments',
    'orders',
    'flash_sales',
    'admin_actions',
    'api_requests',
    'security',
    'performance',
]