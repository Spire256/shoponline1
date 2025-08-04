#from django.contrib import admin

# Register your models here.
# apps/notifications/admin.py
from django.contrib import admin
from .models import Notification, NotificationTemplate, NotificationSettings

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'recipient', 'notification_type', 'priority', 
        'method', 'is_read', 'is_sent', 'created_at'
    ]
    list_filter = [
        'notification_type', 'priority', 'method', 'is_read', 
        'is_sent', 'created_at'
    ]
    search_fields = ['title', 'message', 'recipient__email']
    readonly_fields = ['created_at', 'updated_at', 'read_at', 'sent_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('recipient', 'title', 'message', 'notification_type', 'priority', 'method')
        }),
        ('Status', {
            'fields': ('is_read', 'read_at', 'is_sent', 'sent_at')
        }),
        ('Metadata', {
            'fields': ('data', 'content_type', 'object_id'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'notification_type', 'method', 'priority', 'is_active']
    list_filter = ['notification_type', 'method', 'priority', 'is_active']
    search_fields = ['name', 'subject_template']

@admin.register(NotificationSettings)
class NotificationSettingsAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'in_app_enabled', 'email_enabled', 'sms_enabled', 
        'websocket_enabled'
    ]
    list_filter = ['in_app_enabled', 'email_enabled', 'sms_enabled']
    search_fields = ['user__email']

