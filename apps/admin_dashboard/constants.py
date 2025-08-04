# apps/admin_dashboard/constants.py
"""Constants for admin dashboard app"""

# Cache timeouts (in seconds)
CACHE_TIMEOUT_SHORT = 900    # 15 minutes
CACHE_TIMEOUT_MEDIUM = 1800  # 30 minutes
CACHE_TIMEOUT_LONG = 3600    # 1 hour
CACHE_TIMEOUT_DAY = 86400    # 24 hours

# Banner types
BANNER_TYPES = [
    ('hero', 'Hero Banner'),
    ('promo', 'Promotional Banner'),
    ('category', 'Category Banner'),
    ('flash_sale', 'Flash Sale Banner'),
]

# Analytics periods
ANALYTICS_PERIODS = [
    ('7days', '7 Days'),
    ('30days', '30 Days'),
    ('90days', '90 Days'),
    ('12months', '12 Months'),
]

# Image processing settings
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_IMAGE_FORMATS = ['JPEG', 'PNG', 'WEBP']
HERO_BANNER_SIZE = (1920, 800)
PROMO_BANNER_SIZE = (800, 400)
PRODUCT_IMAGE_SIZE = (800, 800)
THUMBNAIL_SIZE = (200, 200)

# Pagination settings
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100
ANALYTICS_PAGE_SIZE = 50

# Cache keys
CACHE_KEYS = {
    'homepage_content': 'homepage_content_active',
    'site_settings': 'site_settings',
    'banners_active': 'banners_active_{type}',
    'featured_products': 'featured_products_limit_{limit}',
    'analytics_overview': 'daily_analytics_overview',
    'sales_chart': 'daily_sales_chart',
    'product_performance': 'daily_product_performance',
}

# Default content
DEFAULT_HOMEPAGE_CONTENT = {
    'title': 'Welcome to ShopOnline Uganda',
    'subtitle': 'Your Premier Online Shopping Destination',
    'hero_text': 'Discover amazing products at unbeatable prices. Shop now and enjoy fast delivery across Uganda.',
    'meta_description': 'ShopOnline Uganda - Your trusted online marketplace for quality products at affordable prices.',
    'meta_keywords': 'online shopping, Uganda, ecommerce, products, delivery'
}

DEFAULT_SITE_SETTINGS = {
    'site_name': 'ShopOnline Uganda',
    'contact_email': 'info@shoponline.com',
    'contact_phone': '+256 700 000 000',
    'contact_address': 'Kampala, Uganda',
    'enable_flash_sales': True,
    'enable_cod': True,
    'enable_mtn_momo': True,
    'enable_airtel_money': True,
    'maintenance_mode': False
}
