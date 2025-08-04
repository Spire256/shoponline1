#from django.apps import AppConfig


#class ProductsConfig(AppConfig):
    #default_auto_field = 'django.db.models.BigAutoField'
    #name = 'products'
"""
Products App Configuration
Django app configuration for the products application
"""

from django.apps import AppConfig


class ProductsConfig(AppConfig):
    """Configuration for the products app"""
    
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.products'
    verbose_name = 'Products'
    
    def ready(self):
        """
        Initialize the app when Django starts
        Import signal handlers and perform any setup
        """
        # Import signal handlers
        import apps.products.signals
        
        # Import any other initialization code
        try:
            from . import tasks  # Import Celery tasks if they exist
        except ImportError:
            pass
