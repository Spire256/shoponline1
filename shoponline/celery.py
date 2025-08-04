# shoponline/celery.py
"""
Celery configuration for Ugandan E-commerce Platform.

This module sets up Celery for handling background tasks such as:
- Processing payments
- Sending notifications
- Managing flash sales expiry
- Generating reports
- Email sending
"""

import os
from celery import Celery
from django.conf import settings

# Set default Django settings module for the 'celery' program
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'shoponline.settings.production')

# Create Celery application
app = Celery('shoponline')

# Configure Celery using Django settings
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks from all installed Django apps
app.autodiscover_tasks()

# Celery beat schedule for periodic tasks
app.conf.beat_schedule = {
    # Check for expired flash sales every 5 minutes
    'check-expired-flash-sales': {
        'task': 'apps.flash_sales.tasks.check_expired_flash_sales',
        'schedule': 300.0,  # 5 minutes
    },
    
    # Send daily sales report at 8 AM Uganda time
    'daily-sales-report': {
        'task': 'apps.admin_dashboard.tasks.generate_daily_sales_report',
        'schedule': 'crontab(hour=8, minute=0)',
    },
    
    # Clean up expired invitation tokens every hour
    'cleanup-expired-invitations': {
        'task': 'apps.accounts.tasks.cleanup_expired_invitations',
        'schedule': 3600.0,  # 1 hour
    },
    
    # Process pending mobile money payments every 2 minutes
    'check-pending-payments': {
        'task': 'apps.payments.tasks.check_pending_payments',
        'schedule': 120.0,  # 2 minutes
    },
    
    # Send reminder emails for abandoned carts every 6 hours
    'abandoned-cart-reminders': {
        'task': 'apps.orders.tasks.send_abandoned_cart_reminders',
        'schedule': 21600.0,  # 6 hours
    },
    
    # Update product popularity scores daily at midnight
    'update-product-popularity': {
        'task': 'apps.products.tasks.update_product_popularity',
        'schedule': 'crontab(hour=0, minute=0)',
    },
    
    # Backup database daily at 2 AM
    'backup-database': {
        'task': 'apps.core.tasks.backup_database',
        'schedule': 'crontab(hour=2, minute=0)',
    },
    
    # Send weekly analytics report every Monday at 9 AM
    'weekly-analytics-report': {
        'task': 'apps.admin_dashboard.tasks.generate_weekly_analytics_report',
        'schedule': 'crontab(hour=9, minute=0, day_of_week=1)',
    },
}

# Celery task routes
app.conf.task_routes = {
    'apps.payments.tasks.*': {'queue': 'payments'},
    'apps.notifications.tasks.*': {'queue': 'notifications'},
    'apps.flash_sales.tasks.*': {'queue': 'flash_sales'},
    'apps.orders.tasks.*': {'queue': 'orders'},
    'apps.admin_dashboard.tasks.*': {'queue': 'reports'},
}

# Task priority configuration
app.conf.task_inherit_parent_priority = True
app.conf.task_default_priority = 5

# Task result expiration
app.conf.result_expires = 3600  # 1 hour

# Task soft time limit (10 minutes)
app.conf.task_soft_time_limit = 600

# Task hard time limit (15 minutes)
app.conf.task_time_limit = 900

# Worker configuration
app.conf.worker_prefetch_multiplier = 1
app.conf.worker_max_tasks_per_child = 1000
app.conf.worker_disable_rate_limits = False

# Security settings
app.conf.worker_hijack_root_logger = False
app.conf.worker_log_color = False

# Task annotations for specific task configurations
app.conf.task_annotations = {
    'apps.payments.tasks.process_mtn_payment': {
        'rate_limit': '10/m',
        'priority': 9,
        'time_limit': 300,
    },
    'apps.payments.tasks.process_airtel_payment': {
        'rate_limit': '10/m',
        'priority': 9,
        'time_limit': 300,
    },
    'apps.notifications.tasks.send_email_notification': {
        'rate_limit': '50/m',
        'priority': 7,
        'time_limit': 60,
    },
    'apps.notifications.tasks.send_sms_notification': {
        'rate_limit': '20/m',
        'priority': 8,
        'time_limit': 30,
    },
    'apps.flash_sales.tasks.expire_flash_sale': {
        'priority': 6,
        'time_limit': 120,
    },
    'apps.orders.tasks.process_order': {
        'priority': 8,
        'time_limit': 180,
    },
    'apps.admin_dashboard.tasks.generate_sales_report': {
        'priority': 3,
        'time_limit': 600,
    },
}

@app.task(bind=True)
def debug_task(self):
    """Debug task for testing Celery configuration."""
    print(f'Request: {self.request!r}')
    return 'Celery is working!'

# Custom task failure handler
@app.task(bind=True)
def task_failure_handler(self, task_id, error, traceback):
    """Handle task failures and send notifications to admins."""
    from apps.notifications.services.email_service import EmailService
    
    email_service = EmailService()
    email_service.send_admin_notification(
        subject=f'Task Failure: {task_id}',
        message=f'Task {task_id} failed with error: {error}\n\nTraceback:\n{traceback}'
    )

# Register failure handler
app.conf.task_failure_handler = task_failure_handler
