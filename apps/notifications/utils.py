# apps/notifications/utils.py
from django.template import Context, Template
from .models import NotificationTemplate, Notification

def create_notification(
    recipient, 
    title, 
    message, 
    notification_type, 
    priority='medium',
    method='in_app',
    data=None,
    related_object=None
):
    """
    Helper function to create notifications
    """
    notification_data = {
        'recipient': recipient,
        'title': title,
        'message': message,
        'notification_type': notification_type,
        'priority': priority,
        'method': method,
        'data': data or {}
    }
    
    if related_object:
        from django.contrib.contenttypes.models import ContentType
        notification_data['content_type'] = ContentType.objects.get_for_model(related_object)
        notification_data['object_id'] = related_object.id
    
    return Notification.objects.create(**notification_data)

def render_notification_template(template_name, context_data):
    """
    Render notification template with context data
    """
    try:
        template = NotificationTemplate.objects.get(name=template_name)
        
        # Render subject
        subject_template = Template(template.subject_template)
        subject = subject_template.render(Context(context_data))
        
        # Render body
        body_template = Template(template.body_template)
        body = body_template.render(Context(context_data))
        
        # Render HTML if available
        html_body = None
        if template.html_template:
            html_template = Template(template.html_template)
            html_body = html_template.render(Context(context_data))
        
        return {
            'subject': subject,
            'body': body,
            'html_body': html_body,
            'priority': template.priority
        }
    
    except NotificationTemplate.DoesNotExist:
        return None

def notify_admins(title, message, notification_type, priority='medium', data=None):
    """
    Send notifications to all admin users
    """
    from django.contrib.auth import get_user_model
    from .tasks import send_notification_task
    
    User = get_user_model()
    admins = User.objects.filter(is_staff=True)
    
    for admin in admins:
        notification = create_notification(
            recipient=admin,
            title=title,
            message=message,
            notification_type=notification_type,
            priority=priority,
            method='websocket',
            data=data
        )
        
        # Queue for async sending
        send_notification_task.delay(notification.id)