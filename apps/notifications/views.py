from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q, Count
from django.utils import timezone
from .models import Notification, NotificationSettings
from .serializers import (
    NotificationSerializer, NotificationSettingsSerializer,
    MarkAsReadSerializer
)
from .tasks import send_notification_task
from .utils import create_notification, notify_admins
from apps.core.permissions import IsAdminUser

# User-facing notification views
class NotificationListView(generics.ListAPIView):
    """
    List notifications for the authenticated user.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Notification.objects.filter(recipient=self.request.user)
        
        # Filter by read status
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == 'true')
        
        # Filter by notification type
        notification_type = self.request.query_params.get('type')
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        
        # Filter by priority
        priority = self.request.query_params.get('priority')
        if priority:
            queryset = queryset.filter(priority=priority)
        
        return queryset

class NotificationDetailView(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update a specific notification for the authenticated user.
    """
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        notification = self.get_object()
        # Mark as read when retrieved
        if not notification.is_read:
            notification.mark_as_read()
        return super().retrieve(request, *args, **kwargs)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_notifications_as_read(request):
    """
    Mark specific notifications as read for the authenticated user.
    """
    serializer = MarkAsReadSerializer(data=request.data)
    if serializer.is_valid():
        notification_ids = serializer.validated_data['notification_ids']
        notifications = Notification.objects.filter(
            id__in=notification_ids,
            recipient=request.user,
            is_read=False
        )
        
        updated_count = 0
        for notification in notifications:
            notification.mark_as_read()
            updated_count += 1
        
        return Response({
            'message': f'{updated_count} notifications marked as read',
            'updated_count': updated_count
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_all_as_read(request):
    """
    Mark all unread notifications as read for the authenticated user.
    """
    notifications = Notification.objects.filter(
        recipient=request.user,
        is_read=False
    )
    
    updated_count = 0
    for notification in notifications:
        notification.mark_as_read()
        updated_count += 1
    
    return Response({
        'message': f'All {updated_count} notifications marked as read',
        'updated_count': updated_count
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def notification_counts(request):
    """
    Get notification counts for the authenticated user.
    """
    user = request.user
    total_count = Notification.objects.filter(recipient=user).count()
    unread_count = Notification.objects.filter(
        recipient=user, 
        is_read=False
    ).count()
    
    # Count by type for admins
    type_counts = {}
    if user.is_staff:
        type_counts = dict(
            Notification.objects.filter(recipient=user, is_read=False)
            .values('notification_type')
            .annotate(count=Count('id'))
            .values_list('notification_type', 'count')
        )
    
    return Response({
        'total_count': total_count,
        'unread_count': unread_count,
        'type_counts': type_counts
    })

# Notification settings view
class NotificationSettingsView(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update notification settings for the authenticated user.
    """
    serializer_class = NotificationSettingsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        settings, created = NotificationSettings.objects.get_or_create(
            user=self.request.user
        )
        return settings

# Admin-specific views
class AdminNotificationListView(generics.ListAPIView):
    """
    List admin-relevant notifications for admin users.
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        # Only show admin-relevant notifications
        admin_types = [
            'order_created', 'cod_order', 'payment_received',
            'flash_sale_started', 'low_stock', 'system_alert'
        ]
        
        queryset = Notification.objects.filter(
            recipient=self.request.user,
            notification_type__in=admin_types
        )
        
        # Filter by urgency (COD orders, critical alerts)
        urgent_only = self.request.query_params.get('urgent')
        if urgent_only:
            urgent_types = ['cod_order', 'critical']
            queryset = queryset.filter(
                Q(notification_type='cod_order') | Q(priority='critical')
            )
        
        return queryset

@api_view(['POST'])
@permission_classes([IsAdminUser])
def send_test_notification(request):
    """
    Send a test notification (admin only).
    """
    data = request.data
    
    notification = create_notification(
        recipient=request.user,
        title=data.get('title', 'Test Notification'),
        message=data.get('message', 'This is a test notification'),
        notification_type=data.get('type', 'system_alert'),
        priority=data.get('priority', 'medium'),
        method=data.get('method', 'websocket')
    )
    
    # Send immediately
    send_notification_task.delay(notification.id)
    
    return Response({
        'message': 'Test notification sent',
        'notification_id': notification.id
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def broadcast_notification(request):
    """
    Broadcast a notification to all admins.
    """
    data = request.data
    
    notify_admins(
        title=data.get('title', 'Admin Broadcast'),
        message=data.get('message', 'Broadcast message'),
        notification_type=data.get('type', 'system_alert'),
        priority=data.get('priority', 'medium')
    )
    
    return Response({
        'message': 'Broadcast notification sent to all admins'
    }, status=status.HTTP_201_CREATED)

# WebSocket health check
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def websocket_health(request):
    """
    Check WebSocket connection health.
    """
    try:
        from channels.layers import get_channel_layer
        channel_layer = get_channel_layer()
        
        if channel_layer:
            return Response({
                'status': 'healthy',
                'websocket_available': True,
                'channel_layer': str(type(channel_layer).__name__)
            })
        else:
            return Response({
                'status': 'unhealthy',
                'websocket_available': False,
                'error': 'No channel layer configured'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
    except Exception as e:
        return Response({
            'status': 'error',
            'websocket_available': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)