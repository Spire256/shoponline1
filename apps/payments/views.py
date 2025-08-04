from django.shortcuts import render

# Create your views here.
# apps/payments/views.py
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from django.conf import settings
from decimal import Decimal
import logging

from .models import Payment, PaymentMethodConfig, PaymentWebhook, PaymentStatus, PaymentMethod
from .serializers import (
    PaymentSerializer, PaymentCreateSerializer, PaymentStatusUpdateSerializer,
    PaymentMethodConfigSerializer, PaymentSummarySerializer, AdminPaymentSerializer,
    AdminCODPaymentSerializer, PaymentAnalyticsSerializer
)
from .services.mtn_momo_service import MTNMoMoService
from .services.airtel_money_service import AirtelMoneyService
from .services.cod_service import CashOnDeliveryService
from apps.core.permissions import IsAdminUser, IsOwnerOrAdmin
from apps.orders.models import Order

logger = logging.getLogger(__name__)

class PaymentMethodConfigListView(generics.ListAPIView):
    """List available payment methods and their configurations"""
    queryset = PaymentMethodConfig.objects.filter(is_active=True)
    serializer_class = PaymentMethodConfigSerializer
    permission_classes = [permissions.AllowAny]

class PaymentCreateView(generics.CreateAPIView):
    """Create a new payment"""
    serializer_class = PaymentCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Get validated data
            payment_data = serializer.validated_data
            payment_data['user'] = request.user
            
            # Get the appropriate payment service
            payment_method = payment_data['payment_method']
            service = self._get_payment_service(payment_method)
            
            # Process payment
            result = service.process_payment(payment_data)
            
            if result['success']:
                return Response(result, status=status.HTTP_201_CREATED)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error creating payment: {str(e)}")
            return Response(
                {'error': 'Payment creation failed', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _get_payment_service(self, payment_method):
        """Get appropriate payment service based on method"""
        services = {
            PaymentMethod.MTN_MOMO: MTNMoMoService(),
            PaymentMethod.AIRTEL_MONEY: AirtelMoneyService(),
            PaymentMethod.CASH_ON_DELIVERY: CashOnDeliveryService()
        }
        
        service = services.get(payment_method)
        if not service:
            raise ValueError(f"Unsupported payment method: {payment_method}")
        
        return service

class PaymentDetailView(generics.RetrieveAPIView):
    """Get payment details"""
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    
    def get_queryset(self):
        user = self.request.user
        if user.email.endswith('@shoponline.com'):  # Admin user
            return Payment.objects.all().select_related(
                'user', 'order', 'mobile_money_details', 'cod_details'
            ).prefetch_related('transactions')
        else:
            return Payment.objects.filter(user=user).select_related(
                'order', 'mobile_money_details', 'cod_details'
            ).prefetch_related('transactions')

class PaymentListView(generics.ListAPIView):
    """List user's payments"""
    serializer_class = PaymentSummarySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Payment.objects.filter(user=user).select_related(
            'order'
        ).order_by('-created_at')
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by payment method if provided
        method_filter = self.request.query_params.get('method')
        if method_filter:
            queryset = queryset.filter(payment_method=method_filter)
        
        return queryset

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_payment(request, payment_id):
    """Verify payment status with provider"""
    try:
        payment = get_object_or_404(Payment, id=payment_id)
        
        # Check if user owns the payment or is admin
        if payment.user != request.user and not request.user.email.endswith('@shoponline.com'):
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get appropriate service and verify
        service = PaymentCreateView()._get_payment_service(payment.payment_method)
        result = service.verify_payment(payment)
        
        if result['success']:
            # Return updated payment data
            serializer = PaymentSerializer(payment)
            return Response({
                'verification_result': result,
                'payment': serializer.data
            })
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Error verifying payment: {str(e)}")
        return Response(
            {'error': 'Payment verification failed', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cancel_payment(request, payment_id):
    """Cancel a payment"""
    try:
        payment = get_object_or_404(Payment, id=payment_id)
        
        # Check if user owns the payment or is admin
        if payment.user != request.user and not request.user.email.endswith('@shoponline.com'):
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get appropriate service and cancel
        service = PaymentCreateView()._get_payment_service(payment.payment_method)
        result = service.cancel_payment(payment)
        
        if result['success']:
            # Return updated payment data
            serializer = PaymentSerializer(payment)
            return Response({
                'cancellation_result': result,
                'payment': serializer.data
            })
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Error cancelling payment: {str(e)}")
        return Response(
            {'error': 'Payment cancellation failed', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Admin Views
class AdminPaymentListView(generics.ListAPIView):
    """Admin view to list all payments"""
    serializer_class = AdminPaymentSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        queryset = Payment.objects.all().select_related(
            'user', 'order', 'mobile_money_details', 'cod_details'
        ).order_by('-created_at')
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by payment method
        method_filter = self.request.query_params.get('method')
        if method_filter:
            queryset = queryset.filter(payment_method=method_filter)
        
        # Filter by user
        user_filter = self.request.query_params.get('user')
        if user_filter:
            queryset = queryset.filter(user__email__icontains=user_filter)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(created_at__date__range=[start_date, end_date])
        
        return queryset

@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated, IsAdminUser])
def admin_update_payment_status(request, payment_id):
    """Admin endpoint to update payment status"""
    try:
        payment = get_object_or_404(Payment, id=payment_id)
        serializer = PaymentStatusUpdateSerializer(data=request.data, instance=payment)
        
        if serializer.is_valid():
            with transaction.atomic():
                validated_data = serializer.validated_data
                
                # Get appropriate service
                service = PaymentCreateView()._get_payment_service(payment.payment_method)
                
                # Update payment status
                service.update_payment_status(
                    payment=payment,
                    status=validated_data['status'],
                    notes=validated_data.get('notes', ''),
                    failure_reason=validated_data.get('failure_reason', '')
                )
                
                # Handle COD specific updates
                if payment.payment_method == PaymentMethod.CASH_ON_DELIVERY and hasattr(payment, 'cod_details'):
                    cod_details = payment.cod_details
                    
                    if 'cash_received' in validated_data:
                        cod_details.cash_received = validated_data['cash_received']
                    
                    if 'change_given' in validated_data:
                        cod_details.change_given = validated_data['change_given']
                    
                    if 'collection_notes' in validated_data:
                        cod_details.collection_notes = validated_data['collection_notes']
                    
                    if validated_data['status'] == PaymentStatus.COMPLETED:
                        cod_details.collected_by = request.user
                        cod_details.collected_at = timezone.now()
                    
                    cod_details.save()
                
                # Return updated payment
                response_serializer = AdminPaymentSerializer(payment)
                return Response(response_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Error updating payment status: {str(e)}")
        return Response(
            {'error': 'Status update failed', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsAdminUser])
def admin_cod_payments(request):
    """Get COD payments for admin management"""
    try:
        cod_service = CashOnDeliveryService()
        
        # Get filter parameters
        assigned_to = request.query_params.get('assigned_to')
        if assigned_to:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                assigned_user = User.objects.get(email=assigned_to)
            except User.DoesNotExist:
                assigned_user = None
        else:
            assigned_user = None
        
        result = cod_service.get_pending_cod_payments(assigned_to=assigned_user)
        
        if result['success']:
            return Response(result)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Error getting COD payments: {str(e)}")
        return Response(
            {'error': 'Failed to get COD payments', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsAdminUser])
def admin_assign_cod_payment(request, payment_id):
    """Assign COD payment to admin"""
    try:
        payment = get_object_or_404(Payment, id=payment_id)
        
        if payment.payment_method != PaymentMethod.CASH_ON_DELIVERY:
            return Response(
                {'error': 'This is not a COD payment'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cod_service = CashOnDeliveryService()
        result = cod_service.assign_to_admin(payment, request.user)
        
        if result['success']:
            return Response(result)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Error assigning COD payment: {str(e)}")
        return Response(
            {'error': 'Assignment failed', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsAdminUser])
def admin_record_delivery_attempt(request, payment_id):
    """Record a delivery attempt for COD payment"""
    try:
        payment = get_object_or_404(Payment, id=payment_id)
        
        if payment.payment_method != PaymentMethod.CASH_ON_DELIVERY:
            return Response(
                {'error': 'This is not a COD payment'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        notes = request.data.get('notes', '')
        
        cod_service = CashOnDeliveryService()
        result = cod_service.record_delivery_attempt(payment, notes)
        
        if result['success']:
            return Response(result)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Error recording delivery attempt: {str(e)}")
        return Response(
            {'error': 'Failed to record delivery attempt', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsAdminUser])
def admin_complete_cod_payment(request, payment_id):
    """Complete COD payment after cash collection"""
    try:
        payment = get_object_or_404(Payment, id=payment_id)
        
        if payment.payment_method != PaymentMethod.CASH_ON_DELIVERY:
            return Response(
                {'error': 'This is not a COD payment'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cash_received = float(request.data.get('cash_received', 0))
        change_given = float(request.data.get('change_given', 0))
        collection_notes = request.data.get('collection_notes', '')
        
        cod_service = CashOnDeliveryService()
        result = cod_service.complete_cod_payment(
            payment=payment,
            cash_received=cash_received,
            change_given=change_given,
            collection_notes=collection_notes,
            collected_by=request.user
        )
        
        if result['success']:
            return Response(result)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Error completing COD payment: {str(e)}")
        return Response(
            {'error': 'Failed to complete COD payment', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsAdminUser])
def admin_payment_analytics(request):
    """Get payment analytics for admin dashboard"""
    try:
        from django.db.models import Count, Sum, Q
        from django.utils import timezone
        from datetime import timedelta
        
        # Get date range parameters
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        # Base queryset
        payments = Payment.objects.filter(created_at__gte=start_date)
        
        # Basic statistics
        total_payments = payments.count()
        successful_payments = payments.filter(status=PaymentStatus.COMPLETED).count()
        failed_payments = payments.filter(status=PaymentStatus.FAILED).count()
        pending_payments = payments.filter(status__in=[PaymentStatus.PENDING, PaymentStatus.PROCESSING]).count()
        
        # Amount statistics
        total_amount = payments.aggregate(Sum('amount'))['amount__sum'] or 0
        successful_amount = payments.filter(status=PaymentStatus.COMPLETED).aggregate(Sum('amount'))['amount__sum'] or 0
        
        # Payment method breakdown
        payment_methods = payments.values('payment_method').annotate(
            count=Count('id'),
            amount=Sum('amount')
        )
        
        # Daily statistics
        from django.db.models import TruncDate
        daily_stats = payments.annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            count=Count('id'),
            amount=Sum('amount'),
            successful=Count('id', filter=Q(status=PaymentStatus.COMPLETED))
        ).order_by('date')
        
        # Average transaction value
        avg_transaction_value = total_amount / total_payments if total_payments > 0 else 0
        
        # COD specific analytics
        cod_service = CashOnDeliveryService()
        cod_analytics = cod_service.get_cod_analytics(start_date, timezone.now())
        
        analytics_data = {
            'total_payments': total_payments,
            'total_amount': total_amount,
            'successful_payments': successful_payments,
            'failed_payments': failed_payments,
            'pending_payments': pending_payments,
            'successful_amount': successful_amount,
            'payment_methods': {pm['payment_method']: {'count': pm['count'], 'amount': pm['amount']} for pm in payment_methods},
            'daily_stats': list(daily_stats),
            'average_transaction_value': avg_transaction_value,
            'cod_analytics': cod_analytics.get('analytics', {}) if cod_analytics['success'] else {}
        }
        
        serializer = PaymentAnalyticsSerializer(analytics_data)
        return Response(serializer.data)
        
    except Exception as e:
        logger.error(f"Error getting payment analytics: {str(e)}")
        return Response(
            {'error': 'Failed to get analytics', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Webhook endpoints
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def mtn_momo_webhook(request):
    """Handle MTN Mobile Money webhook"""
    try:
        # Log the webhook
        webhook = PaymentWebhook.objects.create(
            provider='mtn',
            event_type=request.META.get('HTTP_X_EVENT_TYPE', 'payment_update'),
            headers=dict(request.META),
            payload=request.data,
            raw_body=request.body.decode('utf-8'),
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        # Process webhook
        mtn_service = MTNMoMoService()
        result = mtn_service.handle_webhook(request.data, dict(request.META))
        
        # Update webhook record
        webhook.processed = result['success']
        webhook.processed_at = timezone.now()
        if not result['success']:
            webhook.processing_error = result.get('error', '')
        webhook.save()
        
        return Response({'status': 'received'}, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error processing MTN webhook: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def airtel_money_webhook(request):
    """Handle Airtel Money webhook"""
    try:
        # Log the webhook
        webhook = PaymentWebhook.objects.create(
            provider='airtel',
            event_type=request.META.get('HTTP_X_EVENT_TYPE', 'payment_update'),
            headers=dict(request.META),
            payload=request.data,
            raw_body=request.body.decode('utf-8'),
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        # Process webhook
        airtel_service = AirtelMoneyService()
        result = airtel_service.handle_webhook(request.data, dict(request.META))
        
        # Update webhook record
        webhook.processed = result['success']
        webhook.processed_at = timezone.now()
        if not result['success']:
            webhook.processing_error = result.get('error', '')
        webhook.save()
        
        return Response({'status': 'received'}, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error processing Airtel webhook: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Utility endpoints
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def check_phone_number(request):
    """Check if phone number is valid for mobile money"""
    try:
        phone_number = request.data.get('phone_number', '')
        payment_method = request.data.get('payment_method', '')
        
        if not phone_number or not payment_method:
            return Response(
                {'error': 'Phone number and payment method are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result = {'valid': False, 'message': 'Unknown payment method'}
        
        if payment_method == PaymentMethod.MTN_MOMO:
            mtn_service = MTNMoMoService()
            check_result = mtn_service.check_account_status(phone_number)
            result = {
                'valid': check_result.get('active', False),
                'message': 'Phone number is valid for MTN Mobile Money' if check_result.get('active') else 'Phone number is not active on MTN Mobile Money',
                'details': check_result
            }
            
        elif payment_method == PaymentMethod.AIRTEL_MONEY:
            airtel_service = AirtelMoneyService()
            check_result = airtel_service.check_user_details(phone_number)
            result = {
                'valid': check_result.get('is_valid', False),
                'message': 'Phone number is valid for Airtel Money' if check_result.get('is_valid') else 'Phone number is not valid for Airtel Money',
                'details': check_result
            }
        
        return Response(result)
        
    except Exception as e:
        logger.error(f"Error checking phone number: {str(e)}")
        return Response(
            {'error': 'Phone number check failed', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsAdminUser])
def admin_payment_method_configs(request):
    """Get all payment method configurations for admin"""
    try:
        configs = PaymentMethodConfig.objects.all()
        serializer = PaymentMethodConfigSerializer(configs, many=True)
        return Response(serializer.data)
        
    except Exception as e:
        logger.error(f"Error getting payment method configs: {str(e)}")
        return Response(
            {'error': 'Failed to get payment method configs', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated, IsAdminUser])
def admin_update_payment_method_config(request, method):
    """Update payment method configuration"""
    try:
        config = get_object_or_404(PaymentMethodConfig, payment_method=method)
        serializer = PaymentMethodConfigSerializer(config, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Error updating payment method config: {str(e)}")
        return Response(
            {'error': 'Failed to update payment method config', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsAdminUser])
def admin_bulk_assign_cod(request):
    """Bulk assign COD payments to admin"""
    try:
        payment_ids = request.data.get('payment_ids', [])
        admin_email = request.data.get('admin_email', '')
        
        if not payment_ids or not admin_email:
            return Response(
                {'error': 'Payment IDs and admin email are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get admin user
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            admin_user = User.objects.get(email=admin_email)
        except User.DoesNotExist:
            return Response(
                {'error': 'Admin user not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        cod_service = CashOnDeliveryService()
        result = cod_service.bulk_assign_cod_payments(payment_ids, admin_user)
        
        if result['success']:
            return Response(result)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Error bulk assigning COD payments: {str(e)}")
        return Response(
            {'error': 'Bulk assignment failed', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsAdminUser])
def admin_webhook_logs(request):
    """Get webhook logs for debugging"""
    try:
        webhooks = PaymentWebhook.objects.all().order_by('-created_at')
        
        # Filter by provider if specified
        provider = request.query_params.get('provider')
        if provider:
            webhooks = webhooks.filter(provider=provider)
        
        # Filter by processed status
        processed = request.query_params.get('processed')
        if processed is not None:
            webhooks = webhooks.filter(processed=processed.lower() == 'true')
        
        # Limit results
        limit = int(request.query_params.get('limit', 100))
        webhooks = webhooks[:limit]
        
        webhook_data = []
        for webhook in webhooks:
            webhook_data.append({
                'id': str(webhook.id),
                'provider': webhook.provider,
                'event_type': webhook.event_type,
                'processed': webhook.processed,
                'processing_error': webhook.processing_error,
                'signature_valid': webhook.signature_valid,
                'ip_address': webhook.ip_address,
                'created_at': webhook.created_at.isoformat(),
                'processed_at': webhook.processed_at.isoformat() if webhook.processed_at else None,
                'payload': webhook.payload
            })
        
        return Response({
            'webhooks': webhook_data,
            'count': len(webhook_data)
        })
        
    except Exception as e:
        logger.error(f"Error getting webhook logs: {str(e)}")
        return Response(
            {'error': 'Failed to get webhook logs', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsAdminUser])
def admin_retry_failed_payment(request, payment_id):
    """Retry a failed payment"""
    try:
        payment = get_object_or_404(Payment, id=payment_id)
        
        # Only mobile money payments can be retried
        if payment.payment_method not in [PaymentMethod.MTN_MOMO, PaymentMethod.AIRTEL_MONEY]:
            return Response(
                {'error': 'Only mobile money payments can be retried'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get appropriate service
        service = PaymentCreateView()._get_payment_service(payment.payment_method)
        result = service.retry_failed_payment(payment)
        
        if result['success']:
            return Response(result)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Error retrying payment: {str(e)}")
        return Response(
            {'error': 'Payment retry failed', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def payment_receipt(request, payment_id):
    """Get payment receipt data"""
    try:
        payment = get_object_or_404(Payment, id=payment_id)
        
        # Check permissions
        if payment.user != request.user and not request.user.email.endswith('@shoponline.com'):
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Only completed payments have receipts
        if payment.status != PaymentStatus.COMPLETED:
            return Response(
                {'error': 'Receipt not available for incomplete payments'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        receipt_data = {
            'payment_info': {
                'reference_number': payment.reference_number,
                'amount': str(payment.amount),
                'currency': payment.currency,
                'payment_method': payment.get_payment_method_display(),
                'status': payment.get_status_display(),
                'processed_at': payment.processed_at.isoformat() if payment.processed_at else None
            },
            'order_info': {
                'order_number': payment.order.order_number,
                'total_amount': str(payment.order.total_amount),
                'items_count': payment.order.items.count()
            },
            'customer_info': {
                'email': payment.user.email,
                'name': f"{payment.user.first_name} {payment.user.last_name}".strip()
            },
            'transaction_id': payment.transaction_id,
            'external_transaction_id': payment.external_transaction_id,
            'provider_fee': str(payment.provider_fee),
            'receipt_generated_at': timezone.now().isoformat()
        }
        
        # Add method-specific details
        if payment.payment_method in [PaymentMethod.MTN_MOMO, PaymentMethod.AIRTEL_MONEY] and hasattr(payment, 'mobile_money_details'):
            receipt_data['mobile_money'] = {
                'phone_number': payment.mobile_money_details.phone_number,
                'customer_name': payment.mobile_money_details.customer_name
            }
        elif payment.payment_method == PaymentMethod.CASH_ON_DELIVERY and hasattr(payment, 'cod_details'):
            receipt_data['cod_details'] = {
                'cash_received': str(payment.cod_details.cash_received),
                'change_given': str(payment.cod_details.change_given),
                'collected_by': payment.cod_details.collected_by.email if payment.cod_details.collected_by else None,
                'collected_at': payment.cod_details.collected_at.isoformat() if payment.cod_details.collected_at else None
            }
        
        return Response(receipt_data)
        
    except Exception as e:
        logger.error(f"Error generating payment receipt: {str(e)}")
        return Response(
            {'error': 'Failed to generate receipt', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
