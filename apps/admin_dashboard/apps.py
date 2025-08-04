# apps/admin_dashboard/apps.py
from django.apps import AppConfig

class AdminDashboardConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.admin_dashboard'
    verbose_name = 'Admin Dashboard'

    def ready(self):
        import apps.admin_dashboard.signals