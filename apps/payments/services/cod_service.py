# apps/payments/services/cod_service.py
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db import transaction

from .base_payment import BasePaymentService, PaymentServiceError, PaymentProcessingError
from ..models import Payment, CashOnDeliveryPayment, PaymentStatus, PaymentMethod

User = get_user_model()

class CashOnDeliveryService(BasePaymentService):
    """Cash on Delivery payment service"""
    
    def __init__(self):
        super().__init__()
    
    def process_payment(self, payment_data: dict) -> dict:
        """
        Process Cash on Delivery payment
        
        Args:
            payment_data: Payment data containing order, amount, delivery details, etc.
            
        Returns:
            Dictionary with payment processing result
        """
        try:
            self.validate_payment_data(payment_data)
            self._validate_cod_data(payment_data)
            
            with transaction.atomic():
                # Create payment record
                payment = self.create_payment_record(
                    order=payment_data['order'],
                    payment_method=PaymentMethod.CASH_ON_DELIVERY,
                    amount=payment_data['amount'],
                    user=payment_data['user'],
                    notes="Cash on Delivery payment - awaiting delivery"
                )
                
                # Create COD specific details
                cod_details = CashOnDeliveryPayment.objects.create(
                    payment=payment,
                    delivery_address=payment_data['delivery_address'],
                    delivery_phone=payment_data['delivery_phone'],
                    delivery_notes=payment_data.get('delivery_notes', ''),
                    admin_notified=False
                )
                
                # Update payment status to processing (awaiting delivery)
                self.update_payment_status(
                    payment=payment,
                    status=PaymentStatus.PROCESSING,
                    notes="COD payment created - awaiting delivery and collection"
                )
                
                # Send admin notification
                self._notify_admin_new_cod_order(payment, cod_details)
                
                self.log_payment_activity(
                    payment=payment,
                    activity="COD payment created",
                    details={
                        'delivery_phone': cod_details.delivery_phone,
                        'delivery_address': cod_details.delivery_address[:100] + '...' if len(cod_details.delivery_address) > 100 else cod_details.delivery_address
                    }
                )
                
                return {
                    'success': True,
                    'payment_id': str(payment.id),
                    'reference_number': payment.reference_number,
                    'status': 'processing',
                    'message': 'Cash on Delivery order created successfully. Our team will contact you for delivery.',
                    'delivery_info': {
                        'address': cod_details.delivery_address,
                        'phone': cod_details.delivery_phone,
                        'notes': cod_details.delivery_notes
                    }
                }
                
        except Exception as e:
            self.logger.error(f"Error processing COD payment: {str(e)}")
            raise PaymentProcessingError(f"COD payment processing failed: {str(e)}")
    
    def _validate_cod_data(self, payment_data: dict):
        """
        Validate COD specific data
        
        Args:
            payment_data: Payment data to validate
        """
        required_cod_fields = ['delivery_address', 'delivery_phone']
        
        for field in required_cod_fields:
            if field not in payment_data or not payment_data[field]:
                raise PaymentServiceError(f"Missing required COD field: {field}")
        
        # Validate delivery address (minimum length)
        if len(payment_data['delivery_address'].strip()) < 10:
            raise PaymentServiceError("Delivery address must be at least 10 characters long")
        
        # Validate phone number format (basic validation)
        phone = payment_data['delivery_phone'].strip()
        if len(phone) < 10:
            raise PaymentServiceError("Invalid delivery phone number")
    
    def _notify_admin_new_cod_order(self, payment: Payment, cod_details: CashOnDeliveryPayment):
        """
        Send notification to admin about new COD order
        
        Args:
            payment: Payment instance
            cod_details: COD payment details
        """
        try:
            # Import here to avoid circular imports
            from apps.notifications.services.notification_service import NotificationService
            
            NotificationService.send_cod_admin_notification(payment, cod_details)
            
            # Update notification status
            cod_details.admin_notified = True
            cod_details.admin_notification_sent_at = timezone.now()
            cod_details.save()
            
        except Exception as e:
            self.logger.error(f"Error sending COD admin notification: {str(e)}")
            # Don't fail the payment for notification errors
    
    def verify_payment(self, payment: Payment) -> dict:
        """
        Verify COD payment status (check delivery status)
        
        Args:
            payment: Payment instance
            
        Returns:
            Dictionary with verification result
        """
        try:
            if not hasattr(payment, 'cod_details'):
                raise PaymentServiceError("No COD details found for this payment")
            
            cod_details = payment.cod_details
            
            # COD verification is mostly manual, return current status
            return {
                'success': True,
                'status': payment.status,
                'delivery_status': {
                    'attempts': cod_details.delivery_attempts,
                    'last_attempt': cod_details.last_attempt_at,
                    'collected': cod_details.collected_at is not None,
                    'collected_by': cod_details.collected_by.email if cod_details.collected_by else None,
                    'cash_received': str(cod_details.cash_received),
                    'change_given': str(cod_details.change_given)
                }
            }
            
        except Exception as e:
            self.logger.error(f"Error verifying COD payment: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def cancel_payment(self, payment: Payment) -> dict:
        """
        Cancel COD payment
        
        Args:
            payment: Payment instance
            
        Returns:
            Dictionary with cancellation result
        """
        try:
            if payment.status == PaymentStatus.COMPLETED:
                return {
                    'success': False,
                    'error': 'Cannot cancel completed COD payment'
                }
            
            self.update_payment_status(
                payment=payment,
                status=PaymentStatus.CANCELLED,
                notes="COD payment cancelled"
            )
            
            # Notify admin about cancellation
            self._notify_admin_cod_cancelled(payment)
            
            return {
                'success': True,
                'message': 'COD payment cancelled successfully'
            }
            
        except Exception as e:
            self.logger.error(f"Error cancelling COD payment: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _notify_admin_cod_cancelled(self, payment: Payment):
        """
        Notify admin about COD cancellation
        
        Args:
            payment: Payment instance
        """
        try:
            from apps.notifications.services.notification_service import NotificationService
            NotificationService.send_cod_cancelled_notification(payment)
        except Exception as e:
            self.logger.error(f"Error sending COD cancellation notification: {str(e)}")
    
    def assign_to_admin(self, payment: Payment, admin_user: User) -> dict:
        """
        Assign COD payment to specific admin for handling
        
        Args:
            payment: Payment instance
            admin_user: Admin user to assign to
            
        Returns:
            Assignment result
        """
        try:
            if not hasattr(payment, 'cod_details'):
                return {
                    'success': False,
                    'error': 'No COD details found for this payment'
                }
            
            cod_details = payment.cod_details
            cod_details.assigned_to = admin_user
            cod_details.save()
            
            self.log_payment_activity(
                payment=payment,
                activity="COD payment assigned to admin",
                details={'assigned_to': admin_user.email}
            )
            
            return {
                'success': True,
                'message': f'COD payment assigned to {admin_user.email}'
            }
            
        except Exception as e:
            self.logger.error(f"Error assigning COD payment to admin: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def record_delivery_attempt(self, payment: Payment, notes: str = '') -> dict:
        """
        Record a delivery attempt for COD payment
        
        Args:
            payment: Payment instance
            notes: Notes about the delivery attempt
            
        Returns:
            Recording result
        """
        try:
            if not hasattr(payment, 'cod_details'):
                return {
                    'success': False,
                    'error': 'No COD details found for this payment'
                }
            
            cod_details = payment.cod_details
            cod_details.delivery_attempted = True
            cod_details.delivery_attempts += 1
            cod_details.last_attempt_at = timezone.now()
            cod_details.save()
            
            # Add notes to payment
            payment.notes += f"\nDelivery attempt #{cod_details.delivery_attempts} on {timezone.now().strftime('%Y-%m-%d %H:%M')}. {notes}"
            payment.save()
            
            self.log_payment_activity(
                payment=payment,
                activity="Delivery attempt recorded",
                details={
                    'attempt_number': cod_details.delivery_attempts,
                    'notes': notes
                }
            )
            
            return {
                'success': True,
                'attempt_number': cod_details.delivery_attempts,
                'message': 'Delivery attempt recorded successfully'
            }
            
        except Exception as e:
            self.logger.error(f"Error recording delivery attempt: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def complete_cod_payment(self, payment: Payment, cash_received: float, 
                           change_given: float = 0, collection_notes: str = '', 
                           collected_by: User = None) -> dict:
        """
        Complete COD payment after cash collection
        
        Args:
            payment: Payment instance
            cash_received: Amount of cash received
            change_given: Change given to customer
            collection_notes: Notes about collection
            collected_by: User who collected the payment
            
        Returns:
            Completion result
        """
        try:
            if not hasattr(payment, 'cod_details'):
                return {
                    'success': False,
                    'error': 'No COD details found for this payment'
                }
            
            if payment.status == PaymentStatus.COMPLETED:
                return {
                    'success': False,
                    'error': 'Payment is already completed'
                }
            
            # Validate cash amounts
            if cash_received < payment.amount:
                return {
                    'success': False,
                    'error': f'Cash received ({cash_received}) is less than payment amount ({payment.amount})'
                }
            
            expected_change = cash_received - float(payment.amount)
            if abs(change_given - expected_change) > 0.01:  # Allow 1 cent tolerance
                return {
                    'success': False,
                    'error': f'Change given ({change_given}) does not match expected change ({expected_change})'
                }
            
            with transaction.atomic():
                # Update COD details
                cod_details = payment.cod_details
                cod_details.cash_received = cash_received
                cod_details.change_given = change_given
                cod_details.collection_notes = collection_notes
                cod_details.collected_by = collected_by
                cod_details.collected_at = timezone.now()
                cod_details.save()
                
                # Update payment status
                self.update_payment_status(
                    payment=payment,
                    status=PaymentStatus.COMPLETED,
                    notes=f"COD payment completed. Cash received: {cash_received}, Change given: {change_given}. {collection_notes}"
                )
                
                self.log_payment_activity(
                    payment=payment,
                    activity="COD payment completed",
                    details={
                        'cash_received': cash_received,
                        'change_given': change_given,
                        'collected_by': collected_by.email if collected_by else None,
                        'collection_time': timezone.now().isoformat()
                    }
                )
                
                # Send completion notifications
                self._notify_cod_completion(payment, cod_details)
                
                return {
                    'success': True,
                    'message': 'COD payment completed successfully',
                    'collection_details': {
                        'cash_received': cash_received,
                        'change_given': change_given,
                        'collected_at': cod_details.collected_at.isoformat(),
                        'collected_by': collected_by.email if collected_by else None
                    }
                }
                
        except Exception as e:
            self.logger.error(f"Error completing COD payment: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _notify_cod_completion(self, payment: Payment, cod_details: CashOnDeliveryPayment):
        """
        Send notifications about COD completion
        
        Args:
            payment: Payment instance
            cod_details: COD payment details
        """
        try:
            from apps.notifications.services.notification_service import NotificationService
            NotificationService.send_cod_completion_notification(payment, cod_details)
        except Exception as e:
            self.logger.error(f"Error sending COD completion notification: {str(e)}")
    
    def get_payment_status_from_provider(self, payment: Payment) -> str:
        """
        Get payment status (COD is managed locally)
        
        Args:
            payment: Payment instance
            
        Returns:
            Payment status
        """
        return payment.status
    
    def handle_webhook(self, payload: dict, headers: dict) -> dict:
        """
        Handle webhook (COD doesn't use webhooks)
        
        Args:
            payload: Webhook payload
            headers: Request headers
            
        Returns:
            Processing result
        """
        return {
            'success': False,
            'error': 'COD payments do not support webhooks'
        }
    
    def get_pending_cod_payments(self, assigned_to: User = None) -> dict:
        """
        Get list of pending COD payments
        
        Args:
            assigned_to: Filter by assigned admin user
            
        Returns:
            List of pending COD payments
        """
        try:
            from django.db.models import Q
            
            # Base query for pending COD payments
            query = Q(payment_method=PaymentMethod.CASH_ON_DELIVERY) & \
                   Q(status__in=[PaymentStatus.PENDING, PaymentStatus.PROCESSING])
            
            if assigned_to:
                query &= Q(cod_details__assigned_to=assigned_to)
            
            payments = Payment.objects.filter(query).select_related(
                'cod_details', 'order', 'user'
            ).order_by('-created_at')
            
            payment_list = []
            for payment in payments:
                cod_details = payment.cod_details
                payment_list.append({
                    'id': str(payment.id),
                    'reference_number': payment.reference_number,
                    'order_number': payment.order.order_number,
                    'customer_email': payment.user.email,
                    'amount': str(payment.amount),
                    'delivery_address': cod_details.delivery_address,
                    'delivery_phone': cod_details.delivery_phone,
                    'delivery_notes': cod_details.delivery_notes,
                    'assigned_to': cod_details.assigned_to.email if cod_details.assigned_to else None,
                    'delivery_attempts': cod_details.delivery_attempts,
                    'last_attempt': cod_details.last_attempt_at.isoformat() if cod_details.last_attempt_at else None,
                    'created_at': payment.created_at.isoformat(),
                    'status': payment.status
                })
            
            return {
                'success': True,
                'payments': payment_list,
                'count': len(payment_list)
            }
            
        except Exception as e:
            self.logger.error(f"Error getting pending COD payments: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_cod_analytics(self, start_date=None, end_date=None) -> dict:
        """
        Get COD payment analytics
        
        Args:
            start_date: Start date for analytics
            end_date: End date for analytics
            
        Returns:
            COD analytics data
        """
        try:
            from django.db.models import Count, Sum, Avg
            from django.utils import timezone
            
            # Default to last 30 days if no dates provided
            if not start_date:
                start_date = timezone.now() - timezone.timedelta(days=30)
            if not end_date:
                end_date = timezone.now()
            
            cod_payments = Payment.objects.filter(
                payment_method=PaymentMethod.CASH_ON_DELIVERY,
                created_at__range=[start_date, end_date]
            )
            
            # Basic stats
            total_cod_payments = cod_payments.count()
            completed_payments = cod_payments.filter(status=PaymentStatus.COMPLETED).count()
            pending_payments = cod_payments.filter(status__in=[PaymentStatus.PENDING, PaymentStatus.PROCESSING]).count()
            cancelled_payments = cod_payments.filter(status=PaymentStatus.CANCELLED).count()
            failed_payments = cod_payments.filter(status=PaymentStatus.FAILED).count()
            
            # Financial stats
            total_amount = cod_payments.aggregate(Sum('amount'))['amount__sum'] or 0
            completed_amount = cod_payments.filter(status=PaymentStatus.COMPLETED).aggregate(Sum('amount'))['amount__sum'] or 0
            
            # Success rate
            success_rate = (completed_payments / total_cod_payments * 100) if total_cod_payments > 0 else 0
            
            # Average delivery attempts
            avg_attempts = cod_payments.select_related('cod_details').aggregate(
                Avg('cod_details__delivery_attempts')
            )['cod_details__delivery_attempts__avg'] or 0
            
            # Daily breakdown
            from django.db.models import TruncDate
            daily_stats = cod_payments.annotate(
                date=TruncDate('created_at')
            ).values('date').annotate(
                count=Count('id'),
                amount=Sum('amount'),
                completed=Count('id', filter=Q(status=PaymentStatus.COMPLETED))
            ).order_by('date')
            
            return {
                'success': True,
                'analytics': {
                    'total_payments': total_cod_payments,
                    'completed_payments': completed_payments,
                    'pending_payments': pending_payments,
                    'cancelled_payments': cancelled_payments,
                    'failed_payments': failed_payments,
                    'total_amount': str(total_amount),
                    'completed_amount': str(completed_amount),
                    'success_rate': round(success_rate, 2),
                    'average_delivery_attempts': round(avg_attempts, 2),
                    'daily_stats': list(daily_stats)
                }
            }
            
        except Exception as e:
            self.logger.error(f"Error getting COD analytics: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def bulk_assign_cod_payments(self, payment_ids: list, admin_user: User) -> dict:
        """
        Bulk assign multiple COD payments to an admin
        
        Args:
            payment_ids: List of payment IDs to assign
            admin_user: Admin user to assign to
            
        Returns:
            Bulk assignment result
        """
        try:
            payments = Payment.objects.filter(
                id__in=payment_ids,
                payment_method=PaymentMethod.CASH_ON_DELIVERY
            ).select_related('cod_details')
            
            updated_count = 0
            for payment in payments:
                if hasattr(payment, 'cod_details'):
                    payment.cod_details.assigned_to = admin_user
                    payment.cod_details.save()
                    updated_count += 1
                    
                    self.log_payment_activity(
                        payment=payment,
                        activity="Bulk assigned to admin",
                        details={'assigned_to': admin_user.email}
                    )
            
            return {
                'success': True,
                'updated_count': updated_count,
                'message': f'{updated_count} COD payments assigned to {admin_user.email}'
            }
            
        except Exception as e:
            self.logger.error(f"Error bulk assigning COD payments: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def update_delivery_status(self, payment: Payment, status_update: dict) -> dict:
        """
        Update delivery status for COD payment
        
        Args:
            payment: Payment instance
            status_update: Dictionary with status update information
            
        Returns:
            Update result
        """
        try:
            if not hasattr(payment, 'cod_details'):
                return {
                    'success': False,
                    'error': 'No COD details found for this payment'
                }
            
            cod_details = payment.cod_details
            
            # Update fields based on status_update
            if 'delivery_notes' in status_update:
                cod_details.delivery_notes = status_update['delivery_notes']
            
            if 'assigned_to' in status_update:
                cod_details.assigned_to = status_update['assigned_to']
            
            cod_details.save()
            
            # Add notes to payment
            if 'notes' in status_update:
                payment.notes += f"\n{timezone.now().strftime('%Y-%m-%d %H:%M')}: {status_update['notes']}"
                payment.save()
            
            self.log_payment_activity(
                payment=payment,
                activity="Delivery status updated",
                details=status_update
            )
            
            return {
                'success': True,
                'message': 'Delivery status updated successfully'
            }
            
        except Exception as e:
            self.logger.error(f"Error updating delivery status: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_cod_payment_history(self, payment: Payment) -> dict:
        """
        Get detailed history of COD payment
        
        Args:
            payment: Payment instance
            
        Returns:
            Payment history
        """
        try:
            if not hasattr(payment, 'cod_details'):
                return {
                    'success': False,
                    'error': 'No COD details found for this payment'
                }
            
            cod_details = payment.cod_details
            
            history = {
                'payment_info': {
                    'reference_number': payment.reference_number,
                    'order_number': payment.order.order_number,
                    'amount': str(payment.amount),
                    'status': payment.status,
                    'created_at': payment.created_at.isoformat(),
                    'updated_at': payment.updated_at.isoformat()
                },
                'delivery_info': {
                    'address': cod_details.delivery_address,
                    'phone': cod_details.delivery_phone,
                    'notes': cod_details.delivery_notes,
                    'attempts': cod_details.delivery_attempts,
                    'last_attempt': cod_details.last_attempt_at.isoformat() if cod_details.last_attempt_at else None,
                    'assigned_to': cod_details.assigned_to.email if cod_details.assigned_to else None
                },
                'collection_info': {
                    'cash_received': str(cod_details.cash_received),
                    'change_given': str(cod_details.change_given),
                    'collected_by': cod_details.collected_by.email if cod_details.collected_by else None,
                    'collected_at': cod_details.collected_at.isoformat() if cod_details.collected_at else None,
                    'collection_notes': cod_details.collection_notes
                },
                'notifications': {
                    'admin_notified': cod_details.admin_notified,
                    'notification_sent_at': cod_details.admin_notification_sent_at.isoformat() if cod_details.admin_notification_sent_at else None
                },
                'transactions': []
            }
            
            # Add transaction history
            for transaction in payment.transactions.all():
                history['transactions'].append({
                    'id': str(transaction.id),
                    'type': transaction.transaction_type,
                    'amount': str(transaction.amount),
                    'status': transaction.status,
                    'description': transaction.description,
                    'processed_at': transaction.processed_at.isoformat()
                })
            
            return {
                'success': True,
                'history': history
            }
            
        except Exception as e:
            self.logger.error(f"Error getting COD payment history: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }