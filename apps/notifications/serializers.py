
# apps/notifications/serializers.py
from rest_framework import serializers
from .models import Notification, NotificationSettings, NotificationTemplate

class NotificationSerializer(serializers.ModelSerializer):
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'notification_type', 'priority',
            'method', 'data', 'is_read', 'read_at', 'created_at',
            'time_ago'
        ]
        read_only_fields = ['created_at', 'time_ago']

    def get_time_ago(self, obj):
        from django.utils.timesince import timesince
        return timesince(obj.created_at)

class NotificationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationSettings
        fields = [
            'in_app_enabled', 'email_enabled', 'order_updates_email',
            'admin_alerts_email', 'flash_sales_email', 'sms_enabled',
            'sms_phone_number', 'websocket_enabled'
        ]

class NotificationTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationTemplate
        fields = '__all__'

class MarkAsReadSerializer(serializers.Serializer):
    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False
    )
