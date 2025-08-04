# shoponline_project/settings/__init__.py
"""
Django settings initialization for Ugandan E-commerce Platform.
Automatically loads the appropriate settings module based on environment.
"""

import os
from django.core.exceptions import ImproperlyConfigured

def get_env_variable(var_name, default=None):
    """Get environment variable or raise exception."""
    try:
        return os.environ[var_name]
    except KeyError:
        if default is not None:
            return default
        error_msg = f"Set the {var_name} environment variable"
        raise ImproperlyConfigured(error_msg)

# Determine which settings to use
DJANGO_SETTINGS_MODULE = get_env_variable('DJANGO_SETTINGS_MODULE', 'shoponline_project.settings.development')
