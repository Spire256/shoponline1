# shoponline_project/__init__.py
"""
Ugandan E-commerce Platform - Django Project Initialization
"""

# This ensures that the Celery app is always imported when Django starts
from .celery import app as celery_app
#from .celery import app as celery_app

__all__ = ('celery_app',)
