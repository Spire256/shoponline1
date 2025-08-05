# shoponline/celery.py
"""
Celery configuration for Ugandan E-commerce Platform (shoponline).

This module sets up Celery for handling background tasks such as:
- Processing payments (MTN Mobile Money, Airtel Money)
- Sending notifications (email, SMS)
- Managing flash sales expiry
- Generating reports and analytics
- Order processing
- Database backups
- System maintenance tasks
"""

import os
from celery import Celery
from django.conf import settings

# Set the default Django settings module for the 'celery' program
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'shoponline.settings.development')

# Create Celery application
app = Celery('shoponline')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes
app.config_from_object('django.conf:settings', namespace='CELERY')

# Comprehensive Celery Configuration
app.conf.update(
    # Broker settings
    broker_url=os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/1'),
    result_backend=os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/2'),
    
    # Task settings
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Africa/Kampala',
    enable_utc=True,
    
    # Task routing - comprehensive queue organization
    task_routes={
        # Flash sales tasks
        'apps.flash_sales.tasks.expire_flash_sales': {'queue': 'flash_sales'},
        'apps.flash_sales.tasks.check_expired_flash_sales': {'queue': 'flash_sales'},
        'apps.flash_sales.tasks.expire_flash_sale': {'queue': 'flash_sales'},
        'apps.flash_sales.tasks.*': {'queue': 'flash_sales'},
        
        # Order processing tasks
        'apps.orders.tasks.process_order': {'queue': 'orders'},
        'apps.orders.tasks.process_pending_orders': {'queue': 'orders'},
        'apps.orders.tasks.send_abandoned_cart_reminders': {'queue': 'orders'},
        'apps.orders.tasks.*': {'queue': 'orders'},
        
        # Payment processing tasks
        'apps.payments.tasks.process_payment': {'queue': 'payments'},
        'apps.payments.tasks.process_mtn_payment': {'queue': 'payments'},
        'apps.payments.tasks.process_airtel_payment': {'queue': 'payments'},
        'apps.payments.tasks.check_pending_payments': {'queue': 'payments'},
        'apps.payments.tasks.*': {'queue': 'payments'},
        
        # Notification tasks
        'apps.notifications.tasks.send_notification': {'queue': 'notifications'},
        'apps.notifications.tasks.send_pending_notifications': {'queue': 'notifications'},
        'apps.notifications.tasks.send_email_notification': {'queue': 'notifications'},
        'apps.notifications.tasks.send_sms_notification': {'queue': 'notifications'},
        'apps.notifications.tasks.*': {'queue': 'notifications'},
        
        # Account management tasks
        'apps.accounts.tasks.send_invitation_email': {'queue': 'emails'},
        'apps.accounts.tasks.cleanup_expired_tokens': {'queue': 'cleanup'},
        'apps.accounts.tasks.cleanup_expired_invitations': {'queue': 'cleanup'},
        
        # Report generation tasks
        'apps.admin_dashboard.tasks.generate_daily_report': {'queue': 'reports'},
        'apps.admin_dashboard.tasks.generate_daily_sales_report': {'queue': 'reports'},
        'apps.admin_dashboard.tasks.generate_weekly_analytics_report': {'queue': 'reports'},
        'apps.admin_dashboard.tasks.generate_sales_report': {'queue': 'reports'},
        'apps.admin_dashboard.tasks.*': {'queue': 'reports'},
        
        # Product management tasks
        'apps.products.tasks.update_product_popularity': {'queue': 'products'},
        
        # System maintenance tasks
        'apps.core.tasks.cleanup_old_logs': {'queue': 'cleanup'},
        'apps.core.tasks.backup_database': {'queue': 'backup'},
    },
    
    # Worker settings
    worker_hijack_root_logger=False,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    worker_max_tasks_per_child=1000,
    worker_disable_rate_limits=False,
    worker_log_color=False,
    
    # Task execution settings
    task_soft_time_limit=600,      # 10 minutes
    task_time_limit=900,           # 15 minutes
    task_max_retries=3,
    task_default_retry_delay=60,
    
    # Result backend settings
    result_expires=3600,           # 1 hour
    result_backend_max_retries=10,
    result_backend_retry_delay=1,
    
    # Priority and queue configuration
    task_default_queue='default',
    task_create_missing_queues=True,
    task_queue_max_priority=10,
    task_default_priority=5,
    task_inherit_parent_priority=True,
    
    # Security settings
    task_reject_on_worker_lost=True,
    task_ignore_result=False,
    
    # Monitoring
    worker_send_task_events=True,
    task_send_sent_event=True,
    
    # Comprehensive beat schedule for periodic tasks
    beat_schedule={
        # Flash sales - expire every minute for real-time updates
        'expire-flash-sales': {
            'task': 'apps.flash_sales.tasks.expire_flash_sales',
            'schedule': 60.0,  # Every minute
            'options': {'queue': 'flash_sales'}
        },
        
        # Flash sales - check expired every 5 minutes (backup check)
        'check-expired-flash-sales': {
            'task': 'apps.flash_sales.tasks.check_expired_flash_sales',
            'schedule': 300.0,  # Every 5 minutes
            'options': {'queue': 'flash_sales'}
        },
        
        # Order processing - process pending orders every 5 minutes
        'process-pending-orders': {
            'task': 'apps.orders.tasks.process_pending_orders',
            'schedule': 300.0,  # Every 5 minutes
            'options': {'queue': 'orders'}
        },
        
        # Order processing - abandoned cart reminders every 6 hours
        'abandoned-cart-reminders': {
            'task': 'apps.orders.tasks.send_abandoned_cart_reminders',
            'schedule': 21600.0,  # Every 6 hours
            'options': {'queue': 'orders'}
        },
        
        # Payment processing - check payment status every 2 minutes
        'check-payment-status': {
            'task': 'apps.payments.tasks.check_pending_payments',
            'schedule': 120.0,  # Every 2 minutes
            'options': {'queue': 'payments'}
        },
        
        # Notifications - send pending notifications every 30 seconds
        'send-pending-notifications': {
            'task': 'apps.notifications.tasks.send_pending_notifications',
            'schedule': 30.0,  # Every 30 seconds
            'options': {'queue': 'notifications'}
        },
        
        # Account management - clean up expired tokens daily
        'cleanup-expired-tokens': {
            'task': 'apps.accounts.tasks.cleanup_expired_tokens',
            'schedule': 86400.0,  # Daily
            'options': {'queue': 'cleanup'}
        },
        
        # Account management - clean up expired invitations every hour
        'cleanup-expired-invitations': {
            'task': 'apps.accounts.tasks.cleanup_expired_invitations',
            'schedule': 3600.0,  # Every hour
            'options': {'queue': 'cleanup'}
        },
        
        # Reports - daily sales report at 8 AM Uganda time
        'daily-sales-report': {
            'task': 'apps.admin_dashboard.tasks.generate_daily_sales_report',
            'schedule': 'crontab(hour=8, minute=0)',
            'options': {'queue': 'reports'}
        },
        
        # Reports - weekly analytics report every Monday at 9 AM
        'weekly-analytics-report': {
            'task': 'apps.admin_dashboard.tasks.generate_weekly_analytics_report',
            'schedule': 'crontab(hour=9, minute=0, day_of_week=1)',
            'options': {'queue': 'reports'}
        },
        
        # Product management - update popularity scores daily at midnight
        'update-product-popularity': {
            'task': 'apps.products.tasks.update_product_popularity',
            'schedule': 'crontab(hour=0, minute=0)',
            'options': {'queue': 'products'}
        },
        
        # System maintenance - clean old log files weekly
        'cleanup-old-logs': {
            'task': 'apps.core.tasks.cleanup_old_logs',
            'schedule': 604800.0,  # Weekly
            'options': {'queue': 'cleanup'}
        },
        
        # System maintenance - backup database daily at 2 AM
        'backup-database': {
            'task': 'apps.core.tasks.backup_database',
            'schedule': 'crontab(hour=2, minute=0)',
            'options': {'queue': 'backup'}
        },
    },
    
    # Comprehensive task annotations for specific configurations
    task_annotations={
        # Global defaults
        '*': {
            'rate_limit': '100/m',
            'time_limit': 900,
            'soft_time_limit': 600,
        },
        
        # Payment processing tasks (high priority, strict limits)
        'apps.payments.tasks.process_mtn_payment': {
            'rate_limit': '10/m',
            'priority': 9,
            'time_limit': 300,
            'max_retries': 3,
            'default_retry_delay': 60,
        },
        'apps.payments.tasks.process_airtel_payment': {
            'rate_limit': '10/m',
            'priority': 9,
            'time_limit': 300,
            'max_retries': 3,
            'default_retry_delay': 60,
        },
        'apps.payments.tasks.process_payment': {
            'rate_limit': '20/m',
            'priority': 9,
            'max_retries': 3,
            'default_retry_delay': 60,
        },
        
        # Notification tasks
        'apps.notifications.tasks.send_email': {
            'rate_limit': '50/m',
            'priority': 7,
            'max_retries': 5,
            'default_retry_delay': 30,
            'time_limit': 60,
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
        
        # Flash sales tasks
        'apps.flash_sales.tasks.expire_flash_sale': {
            'priority': 6,
            'time_limit': 120,
        },
        
        # Order processing tasks
        'apps.orders.tasks.process_order': {
            'priority': 8,
            'time_limit': 180,
        },
        
        # Report generation tasks (lower priority, longer time limits)
        'apps.admin_dashboard.tasks.generate_sales_report': {
            'priority': 3,
            'time_limit': 600,
        },
        'apps.admin_dashboard.tasks.generate_daily_sales_report': {
            'priority': 3,
            'time_limit': 600,
        },
        'apps.admin_dashboard.tasks.generate_weekly_analytics_report': {
            'priority': 2,
            'time_limit': 1200,  # 20 minutes for complex analytics
        },
    },
)

# Load task modules from all registered Django app configs
app.autodiscover_tasks()

# Debug task for testing Celery configuration
@app.task(bind=True)
def debug_task(self):
    """Debug task for testing Celery configuration"""
    print(f'Request: {self.request!r}')
    return 'Celery is working! Debug task completed successfully'

# Custom task failure handler
@app.task(bind=True)
def task_failure_handler(self, task_id, error, traceback):
    """Handle failed tasks and send notifications to admins"""
    from apps.notifications.services.email_service import EmailService
    
    email_service = EmailService()
    email_service.send_admin_notification(
        subject=f'Task Failure: {task_id}',
        message=f'Task {task_id} failed with error: {error}\n\nTraceback:\n{traceback}',
        notification_type='task_failure'
    )

# Base task configurations with automatic retry
@app.task(bind=True, autoretry_for=(Exception,), retry_kwargs={'max_retries': 3, 'countdown': 60})
def reliable_task(self):
    """Base task with automatic retry configuration"""
    pass

# Priority task for urgent operations
@app.task(bind=True, priority=9)
def urgent_task(self):
    """High priority task for urgent operations"""
    pass

# Long-running task configuration
@app.task(bind=True, soft_time_limit=1800, time_limit=3600)  # 30 min soft, 1 hour hard
def long_running_task(self):
    """Configuration for long-running tasks"""
    pass

# Custom task decorators for different app modules
def flash_sale_task(**options):
    """Custom decorator for flash sale related tasks"""
    options.setdefault('queue', 'flash_sales')
    options.setdefault('priority', 8)
    return app.task(**options)

def payment_task(**options):
    """Custom decorator for payment related tasks"""
    options.setdefault('queue', 'payments')
    options.setdefault('priority', 9)
    options.setdefault('max_retries', 5)
    return app.task(**options)

def notification_task(**options):
    """Custom decorator for notification related tasks"""
    options.setdefault('queue', 'notifications')
    options.setdefault('priority', 7)
    options.setdefault('rate_limit', '100/m')
    return app.task(**options)

# Health check task for system monitoring
@app.task
def health_check():
    """Health check task for monitoring system components"""
    from django.db import connection
    from django.core.cache import cache
    
    # Check database connection
    try:
        connection.ensure_connection()
        db_status = 'healthy'
    except Exception as e:
        db_status = f'error: {str(e)}'
    
    # Check cache connection
    try:
        cache.set('health_check', 'test', 10)
        cache_result = cache.get('health_check')
        cache_status = 'healthy' if cache_result == 'test' else 'error'
    except Exception as e:
        cache_status = f'error: {str(e)}'
    
    return {
        'status': 'healthy',
        'database': db_status,
        'cache': cache_status,
        'timestamp': app.now().isoformat()
    }

# Queue management utilities
def get_queue_info():
    """Get information about all queues"""
    inspect = app.control.inspect()
    return {
        'active_queues': inspect.active_queues(),
        'registered_tasks': inspect.registered(),
        'stats': inspect.stats(),
    }

def purge_queue(queue_name):
    """Purge all tasks from a specific queue"""
    return app.control.purge()

# Task monitoring utilities
def get_task_info(task_id):
    """Get information about a specific task"""
    return app.AsyncResult(task_id)

def cancel_task(task_id):
    """Cancel a specific task"""
    app.control.revoke(task_id, terminate=True)

# Celery signals for comprehensive logging and monitoring
from celery.signals import (
    task_prerun, task_postrun, task_failure, 
    worker_ready, worker_shutdown
)

@task_prerun.connect
def task_prerun_handler(sender=None, task_id=None, task=None, args=None, kwargs=None, **kwds):
    """Log task start for monitoring"""
    print(f'Task {task.name}[{task_id}] starting with args: {args}, kwargs: {kwargs}')

@task_postrun.connect
def task_postrun_handler(sender=None, task_id=None, task=None, args=None, kwargs=None, retval=None, state=None, **kwds):
    """Log task completion for monitoring"""
    print(f'Task {task.name}[{task_id}] completed with state: {state}')

@task_failure.connect
def task_failure_handler_signal(sender=None, task_id=None, exception=None, traceback=None, einfo=None, **kwds):
    """Handle task failures and log them"""
    print(f'Task {sender.name}[{task_id}] failed: {exception}')
    # Trigger the task failure handler for admin notifications
    task_failure_handler.delay(task_id, str(exception), str(traceback))

@worker_ready.connect
def worker_ready_handler(sender=None, **kwargs):
    """Log when worker is ready"""
    print(f'Worker {sender} is ready')

@worker_shutdown.connect
def worker_shutdown_handler(sender=None, **kwargs):
    """Log when worker is shutting down"""
    print(f'Worker {sender} is shutting down')

# Register the failure handler globally
app.conf.task_failure_handler = task_failure_handler