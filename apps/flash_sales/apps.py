#from django.apps import AppConfig


#class FlashSalesConfig(AppConfig):
    #default_auto_field = 'django.db.models.BigAutoField'
    #name = 'flash_sales'

# apps/flash_sales/apps.py
from django.apps import AppConfig


class FlashSalesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.flash_sales'
    verbose_name = 'Flash Sales'

    def ready(self):
        import apps.flash_sales.signals

