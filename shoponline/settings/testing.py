# shoponline_project/settings/testing.py
"""
Testing settings for Ugandan E-commerce Platform.
"""

from .base import *

# Test database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Disable migrations for faster tests
class DisableMigrations:
    def __contains__(self, item):
        return True
    
    def __getitem__(self, item):
        return None

MIGRATION_MODULES = DisableMigrations()

# Test settings
DEBUG = False
TESTING = True

# Fast password hashing for tests
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Disable caching in tests
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}

# Test email backend
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# Disable Celery tasks in tests
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Test file storage
DEFAULT_FILE_STORAGE = 'django.core.files.storage.InMemoryStorage'

# Disable logging in tests
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'null': {
            'class': 'logging.NullHandler',
        },
    },
    'root': {
        'handlers': ['null'],
    },
}

# Test-specific settings
SECRET_KEY = 'test-secret-key-for-testing-only'
MTN_MOMO_API_KEY = 'test-key'
MTN_MOMO_API_SECRET = 'test-secret'
AIRTEL_MONEY_CLIENT_ID = 'test-client-id'
AIRTEL_MONEY_CLIENT_SECRET = 'test-client-secret'