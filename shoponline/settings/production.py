# shoponline_project/settings/production.py
"""
Production settings for Ugandan E-commerce Platform.
"""

from .base import *

# Security settings for production
DEBUG = False

ALLOWED_HOSTS = [
    get_env_variable('ALLOWED_HOST', 'shoponline.ug'),
    'www.shoponline.ug',
    get_env_variable('SERVER_IP', ''),
    'localhost',
    '127.0.0.1',
]

# Security headers
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_FRAME_DENY = True

# Secure cookies
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_COOKIE_HTTPONLY = True

# Production CORS settings
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    f"https://{get_env_variable('ALLOWED_HOST', 'shoponline.ug')}",
    f"https://www.{get_env_variable('ALLOWED_HOST', 'shoponline.ug')}",
]

CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS

# Production database with connection pooling
DATABASES['default'].update({
    'CONN_MAX_AGE': 60,
    'OPTIONS': {
        'MAX_CONNS': 20,
        'connect_timeout': 10,
    }
})

# Production caching with Redis
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': get_env_variable('REDIS_URL'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 50,
                'retry_on_timeout': True,
            }
        }
    }
}

# Production email settings
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'

# Production file storage (S3)
USE_S3 = True

# Production logging
LOGGING['handlers']['file']['level'] = 'INFO'
LOGGING['handlers']['console']['level'] = 'WARNING'
LOGGING['loggers']['django']['level'] = 'WARNING'
LOGGING['loggers']['apps']['level'] = 'INFO'

# Disable debug toolbar
if 'debug_toolbar' in INSTALLED_APPS:
    INSTALLED_APPS.remove('debug_toolbar')

if 'debug_toolbar.middleware.DebugToolbarMiddleware' in MIDDLEWARE:
    MIDDLEWARE.remove('debug_toolbar.middleware.DebugToolbarMiddleware')

# Production Celery settings
CELERY_TASK_ALWAYS_EAGER = False
CELERY_TASK_EAGER_PROPAGATES = False

# Production Mobile Money URLs
MTN_MOMO_BASE_URL = 'https://momodeveloper.mtn.com'
AIRTEL_MONEY_BASE_URL = 'https://openapi.airtel.africa'

# Admin email notifications
ADMINS = [
    ('Admin', get_env_variable('ADMIN_EMAIL', 'admin@shoponline.com')),
]
MANAGERS = ADMINS

# Error reporting
SENTRY_DSN = get_env_variable('SENTRY_DSN', '')
if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    from sentry_sdk.integrations.celery import CeleryIntegration
    from sentry_sdk.integrations.redis import RedisIntegration
    
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[
            DjangoIntegration(),
            CeleryIntegration(),
            RedisIntegration(),
        ],
        traces_sample_rate=0.1,
        send_default_pii=True,
        environment='production',
    )
