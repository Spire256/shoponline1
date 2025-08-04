# apps/notifications/urls.py
from django.urls import path
from .views import (
    NotificationListView, NotificationDetailView, NotificationSettingsView,
    AdminNotificationListView, mark_notifications_as_read, mark_all_as_read,
    notification_counts
)
from .views import send_test_notification, broadcast_notification

app_name = 'notifications'

urlpatterns = [
    # Client notifications
    path('', NotificationListView.as_view(), name='notification-list'),
    path('<int:pk>/', NotificationDetailView.as_view(), name='notification-detail'),
    path('mark-as-read/', mark_notifications_as_read, name='mark-as-read'),
    path('mark-all-read/', mark_all_as_read, name='mark-all-read'),
    path('counts/', notification_counts, name='notification-counts'),
    path('settings/', NotificationSettingsView.as_view(), name='notification-settings'),
    
    # Admin notifications
    path('admin/', AdminNotificationListView.as_view(), name='admin-notifications'),
    # Test endpoints (admin only)
    
    path('admin/test-notification/', send_test_notification, name='test-notification'),
    path('admin/broadcast/', broadcast_notification, name='broadcast-notification'),
]
