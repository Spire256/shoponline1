from django.shortcuts import render

# Create your views here.
# apps/orders/views.py

from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Sum, Avg
from django.utils import timezone
from django.db import transaction
from datetime import datetime, timedelta
from decimal import Decimal

from .models import Order, OrderItem, OrderStatusHistory, OrderNote, CODVerification
from .serializers import (
    OrderSerializer, OrderCreateSerializer, OrderUpdateSerializer,
    OrderListSerializer, OrderNoteSerializer, CODVerificationSerializer,
    OrderAnalyticsSerializer, CustomerOrderSummarySerializer
)
from .services.order_service import OrderService
from .services.notification_service import OrderNotificationService
from apps.core.permissions import IsAdminUser, IsOwnerOrAdmin
from apps.core.pagination import StandardResultsSetPagination


class OrderPagination(PageNumberPagination):
    """Custom pagination for orders"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class OrderListCreateView(generics.ListCreateAPIView):
    """
    List orders for user/admin or create new order
    """
    pagination_class = OrderPagination
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return OrderCreateSerializer
        return OrderListSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.AllowAny()]  # Allow guest checkout
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Order.objects.select_related('user').prefetch_related('items')
        
        if user.is_authenticated and user.is_admin:
            # Admin can see all orders
            queryset = queryset.all()
        elif user.is_authenticated:
            # Regular user can only see their orders
            queryset = queryset.filter(user=user)
        else:
            # Anonymous user sees nothing in list
            return Order.objects.none()
        
        # Filtering
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        payment_method = self.request.query_params.get('payment_method', None)
        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)
        
        is_cod = self.request.query_params.get('is_cod', None)
        if is_cod is not None:
            queryset = queryset.filter(is_cash_on_delivery=is_cod.lower() == 'true')
        
        # Date filtering
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        
        if date_from:
            try:
                date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__gte=date_from)
            except ValueError:
                pass
        
        if date_to:
            try:
                date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__lte=date_to)
            except ValueError:
                pass
        
        # Search
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(order_number__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(phone__icontains=search)
            )
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        """Create order and send notifications"""
        order = serializer.save()
        
        # Send notifications
        try:
            notification_service = OrderNotificationService()
            notification_service.send_order_confirmation(order)
            
            # Send admin notification for COD orders
            if order.is_cash_on_delivery:
                notification_service.send_cod_admin_notification(order)
        except Exception as e:
            # Log error but don't fail order creation
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send order notifications for {order.order_number}: {str(e)}")


class OrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete an order
    """
    serializer_class = OrderSerializer
    permission_classes = [IsOwnerOrAdmin]
    
    def get_queryset(self):
        return Order.objects.select_related('user', 'cod_verification').prefetch_related(
            'items', 'status_history', 'notes'
        )
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return OrderUpdateSerializer
        return OrderSerializer
    
    def perform_update(self, serializer):
        """Update order and handle status changes"""
        old_status = self.get_object().status
        order = serializer.save()
        
        # Send status update notifications
        if old_status != order.status:
            try:
                notification_service = OrderNotificationService()
                notification_service.send_status_update(order, old_status)
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to send status update notification: {str(e)}")
    
    def perform_destroy(self, instance):
        """Cancel order instead of deleting"""
        if instance.can_be_cancelled():
            instance.cancel_order("Order cancelled by user")
        else:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Order cannot be cancelled at this stage")


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cancel_order(request, order_id):
    """Cancel an order"""
    order = get_object_or_404(Order, id=order_id)
    
    # Check permissions
    if not (request.user.is_admin or order.user == request.user):
        return Response(
            {"error": "Permission denied"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    if not order.can_be_cancelled():
        return Response(
            {"error": "Order cannot be cancelled at this stage"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    reason = request.data.get('reason', '')
    order.cancel_order(reason)
    
    # Send notification
    try:
        notification_service = OrderNotificationService()
        notification_service.send_cancellation_notification(order)
    except Exception:
        pass
    
    return Response(
        OrderSerializer(order).data,
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def confirm_order(request, order_id):
    """Confirm an order (admin only)"""
    order = get_object_or_404(Order, id=order_id)
    
    if order.status != 'pending':
        return Response(
            {"error": "Only pending orders can be confirmed"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    order.mark_as_confirmed()
    
    # Add order note
    OrderNote.objects.create(
        order=order,
        note_type='admin',
        note=f"Order confirmed by {request.user.get_full_name()}",
        created_by=request.user
    )
    
    # Send notification
    try:
        notification_service = OrderNotificationService()
        notification_service.send_status_update(order, 'pending')
    except Exception:
        pass
    
    return Response(
        OrderSerializer(order).data,
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def mark_delivered(request, order_id):
    """Mark order as delivered (admin only)"""
    order = get_object_or_404(Order, id=order_id)
    
    if order.status not in ['confirmed', 'processing', 'out_for_delivery']:
        return Response(
            {"error": "Order cannot be marked as delivered"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    order.mark_as_delivered()
    
    # Add order note
    OrderNote.objects.create(
        order=order,
        note_type='delivery',
        note=f"Order delivered and confirmed by {request.user.get_full_name()}",
        created_by=request.user
    )
    
    # Handle COD completion
    if order.is_cash_on_delivery:
        try:
            cod_verification = order.cod_verification
            cod_verification.mark_as_delivered_and_paid()
        except CODVerification.DoesNotExist:
            pass
    
    # Send notification
    try:
        notification_service = OrderNotificationService()
        notification_service.send_delivery_confirmation(order)
    except Exception:
        pass
    
    return Response(
        OrderSerializer(order).data,
        status=status.HTTP_200_OK
    )


class OrderNotesListCreateView(generics.ListCreateAPIView):
    """List and create order notes"""
    serializer_class = OrderNoteSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        order_id = self.kwargs['order_id']
        return OrderNote.objects.filter(order_id=order_id).select_related('created_by')
    
    def perform_create(self, serializer):
        order_id = self.kwargs['order_id']
        order = get_object_or_404(Order, id=order_id)
        serializer.save(order=order, created_by=self.request.user)


class CODOrdersListView(generics.ListAPIView):
    """List Cash on Delivery orders (admin only)"""
    serializer_class = OrderListSerializer
    permission_classes = [IsAdminUser]
    pagination_class = OrderPagination
    
    def get_queryset(self):
        queryset = Order.objects.filter(is_cash_on_delivery=True).select_related(
            'user', 'cod_verification'
        ).prefetch_related('items')
        
        # Filter by verification status
        verification_status = self.request.query_params.get('verification_status', None)
        if verification_status:
            queryset = queryset.filter(cod_verification__verification_status=verification_status)
        
        # Filter by verification status
        verified = self.request.query_params.get('verified', None)
        if verified is not None:
            queryset = queryset.filter(cod_verified=verified.lower() == 'true')
        
        return queryset.order_by('-created_at')


@api_view(['POST'])
@permission_classes([IsAdminUser])
def verify_cod_order(request, order_id):
    """Verify a COD order (admin only)"""
    order = get_object_or_404(Order, id=order_id, is_cash_on_delivery=True)
    
    try:
        cod_verification = order.cod_verification
    except CODVerification.DoesNotExist:
        cod_verification = CODVerification.objects.create(order=order)
    
    notes = request.data.get('notes', '')
    cod_verification.mark_as_verified(request.user, notes)
    
    # Add order note
    OrderNote.objects.create(
        order=order,
        note_type='admin',
        note=f"COD order verified by {request.user.get_full_name()}. {notes}",
        created_by=request.user
    )
    
    return Response(
        CODVerificationSerializer(cod_verification).data,
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def order_analytics(request):
    """Get order analytics data (admin only)"""
    # Date range
    date_from = request.query_params.get('date_from', None)
    date_to = request.query_params.get('date_to', None)
    
    if not date_from:
        date_from = timezone.now() - timedelta(days=30)
    else:
        date_from = datetime.strptime(date_from, '%Y-%m-%d')
    
    if not date_to:
        date_to = timezone.now()
    else:
        date_to = datetime.strptime(date_to, '%Y-%m-%d')
    
    # Base queryset
    queryset = Order.objects.filter(created_at__range=[date_from, date_to])
    
    # Basic statistics
    total_orders = queryset.count()
    total_revenue = queryset.aggregate(
        total=Sum('total_amount')
    )['total'] or Decimal('0.00')
    
    # Order status counts
    status_counts = queryset.values('status').annotate(count=Count('id'))
    pending_orders = sum(item['count'] for item in status_counts if item['status'] == 'pending')
    completed_orders = sum(item['count'] for item in status_counts if item['status'] == 'delivered')
    cancelled_orders = sum(item['count'] for item in status_counts if item['status'] == 'cancelled')
    
    # Payment method counts
    payment_counts = queryset.values('payment_method').annotate(count=Count('id'))
    cod_orders = sum(item['count'] for item in payment_counts if item['payment_method'] == 'cash_on_delivery')
    mobile_money_orders = total_orders - cod_orders
    
    # Flash sale statistics
    flash_sale_orders = queryset.filter(has_flash_sale_items=True).count()
    flash_sale_savings = queryset.aggregate(
        total_savings=Sum('flash_sale_savings')
    )['total_savings'] or Decimal('0.00')
    
    # Average order value
    average_order_value = queryset.aggregate(
        avg=Avg('total_amount')
    )['avg'] or Decimal('0.00')
    
    # Orders by day
    from django.db.models import TruncDate
    orders_by_day = list(queryset.extra(
        select={'day': 'date(created_at)'}
    ).values('day').annotate(
        count=Count('id'),
        revenue=Sum('total_amount')
    ).order_by('day'))
    
    # Top districts
    top_districts = list(queryset.values('district').annotate(
        count=Count('id'),
        revenue=Sum('total_amount')
    ).order_by('-count')[:10])
    
    analytics_data = {
        'total_orders': total_orders,
        'total_revenue': total_revenue,
        'pending_orders': pending_orders,
        'completed_orders': completed_orders,
        'cancelled_orders': cancelled_orders,
        'cod_orders': cod_orders,
        'mobile_money_orders': mobile_money_orders,
        'flash_sale_orders': flash_sale_orders,
        'flash_sale_savings': flash_sale_savings,
        'average_order_value': average_order_value,
        'orders_by_day': orders_by_day,
        'orders_by_status': list(status_counts),
        'orders_by_payment_method': list(payment_counts),
        'top_districts': top_districts,
    }
    
    serializer = OrderAnalyticsSerializer(data=analytics_data)
    serializer.is_valid(raise_exception=True)
    
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def customer_order_summary(request):
    """Get customer's order summary"""
    user = request.user
    
    if user.is_admin:
        # Admin can get any customer's summary
        customer_email = request.query_params.get('customer_email', None)
        if customer_email:
            orders = Order.objects.filter(email=customer_email)
        else:
            return Response(
                {"error": "customer_email parameter required for admin"},
                status=status.HTTP_400_BAD_REQUEST
            )
    else:
        # Regular user gets their own summary
        orders = Order.objects.filter(user=user)
    
    # Calculate summary
    total_orders = orders.count()
    total_spent = orders.aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
    completed_orders = orders.filter(status='delivered').count()
    pending_orders = orders.filter(status__in=['pending', 'confirmed', 'processing']).count()
    total_savings = orders.aggregate(savings=Sum('flash_sale_savings'))['savings'] or Decimal('0.00')
    
    # Favorite payment method
    payment_methods = orders.values('payment_method').annotate(count=Count('id')).order_by('-count')
    favorite_payment_method = payment_methods.first()['payment_method'] if payment_methods else None
    
    # Last order date
    last_order = orders.order_by('-created_at').first()
    last_order_date = last_order.created_at if last_order else None
    
    # Frequent customer check (more than 5 orders)
    is_frequent_customer = total_orders > 5
    
    summary_data = {
        'total_orders': total_orders,
        'total_spent': total_spent,
        'completed_orders': completed_orders,
        'pending_orders': pending_orders,
        'total_savings': total_savings,
        'favorite_payment_method': favorite_payment_method,
        'last_order_date': last_order_date,
        'is_frequent_customer': is_frequent_customer,
    }
    
    serializer = CustomerOrderSummarySerializer(data=summary_data)
    serializer.is_valid(raise_exception=True)
    
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def bulk_update_orders(request):
    """Bulk update order status (admin only)"""
    order_ids = request.data.get('order_ids', [])
    new_status = request.data.get('status', None)
    notes = request.data.get('notes', '')
    
    if not order_ids or not new_status:
        return Response(
            {"error": "order_ids and status are required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if new_status not in dict(Order.STATUS_CHOICES):
        return Response(
            {"error": "Invalid status"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    orders = Order.objects.filter(id__in=order_ids)
    updated_count = 0
    
    with transaction.atomic():
        for order in orders:
            old_status = order.status
            order.status = new_status
            order.save()
            
            # Create status history
            OrderStatusHistory.objects.create(
                order=order,
                previous_status=old_status,
                new_status=new_status,
                changed_by=request.user,
                notes=notes or f"Bulk update: {old_status} → {new_status}"
            )
            
            updated_count += 1
    
    return Response(
        {"message": f"Successfully updated {updated_count} orders"},
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def order_tracking(request, order_number):
    """Track order by order number"""
    try:
        order = Order.objects.select_related('user').prefetch_related(
            'status_history', 'items'
        ).get(order_number=order_number)
    except Order.DoesNotExist:
        return Response(
            {"error": "Order not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check permissions
    if not (request.user.is_admin or order.user == request.user or order.email == request.user.email):
        return Response(
            {"error": "Permission denied"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Return limited tracking information
    tracking_data = {
        'order_number': order.order_number,
        'status': order.status,
        'status_display': order.get_status_display(),
        'created_at': order.created_at,
        'confirmed_at': order.confirmed_at,
        'delivered_at': order.delivered_at,
        'estimated_delivery': order.estimated_delivery,
        'tracking_number': order.tracking_number,
        'total_amount': order.total_amount,
        'items_count': order.items.count(),
        'is_cash_on_delivery': order.is_cash_on_delivery,
        'status_history': OrderStatusHistorySerializer(
            order.status_history.all()[:5], many=True
        ).data
    }
    
    return Response(tracking_data, status=status.HTTP_200_OK)
