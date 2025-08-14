# shoponline_project/settings/development.py
"""
Development settings for Ugandan E-commerce Platform.
"""

from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

# Development-specific apps
INSTALLED_APPS += [
    'debug_toolbar',
    'django_seed',
]

# Debug toolbar middleware
MIDDLEWARE = [
    'debug_toolbar.middleware.DebugToolbarMiddleware',
] + MIDDLEWARE

# Debug toolbar configuration
INTERNAL_IPS = [
    '127.0.0.1',
    'localhost',
]

# Development database (can use SQLite for quick setup)
if get_bool_env('USE_SQLITE', False):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Less strict CORS for development
CORS_ALLOW_ALL_ORIGINS = True

# Email backend for development (console)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Disable caching in development
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}

# Frontend URL for invitation emails
FRONTEND_URL = 'http://localhost:3000'  # or whatever your frontend URL is

# Development logging
LOGGING['handlers']['console']['level'] = 'DEBUG'
LOGGING['loggers']['django']['level'] = 'DEBUG'
LOGGING['loggers']['apps']['level'] = 'DEBUG'

# Development Celery (synchronous execution)
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Development file storage
DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'

# Less secure cookies for development
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# MTN MoMo Sandbox URLs for development
MTN_MOMO_BASE_URL = 'https://sandbox.momodeveloper.mtn.com'
AIRTEL_MONEY_BASE_URL = 'https://openapiuat.airtel.africa'