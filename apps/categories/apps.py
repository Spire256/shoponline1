#from django.apps import AppConfig


#class CategoriesConfig(AppConfig):
    #default_auto_field = 'django.db.models.BigAutoField'
    #name = 'categories'

# apps/categories/apps.py

from django.apps import AppConfig


class CategoriesConfig(AppConfig):
    """
    Configuration for the Categories app
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.categories'
    verbose_name = 'Categories'

    def ready(self):
        """
        Import signals when the app is ready
        """
        try:
            import apps.categories.signals
        except ImportError:
            pass
