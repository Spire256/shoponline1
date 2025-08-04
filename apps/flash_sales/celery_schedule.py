# apps/flash_sales/celery_schedule.py
"""
Celery schedule configuration for flash sales
Add this to your main celery.py configuration
"""

FLASH_SALES_CELERY_BEAT_SCHEDULE = {
    'cleanup-expired-flash-sales': {
        'task': 'apps.flash_sales.tasks.cleanup_expired_flash_sales',
        'schedule': 300.0,  # Run every 5 minutes
    },
    'update-flash-sale-analytics': {
        'task': 'apps.flash_sales.tasks.update_flash_sale_analytics',
        'schedule': 3600.0,  # Run every hour
    },
}