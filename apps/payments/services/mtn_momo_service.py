# apps/payments/services/mtn_momo_service.py
import requests
import uuid
import json
from decimal import Decimal
from django.conf import settings
from django.utils import timezone
from django.db import transaction

from .base_payment import BasePaymentService, PaymentServiceError, PaymentProcessingError
from ..models import Payment, MobileMoneyPayment, PaymentStatus, PaymentMethod

class MTNMoMoService(BasePaymentService):
    """MTN Mobile Money payment service"""
    
    def __init__(self):
        super().__init__()
        self.base_url = getattr(settings, 'MTN_MOMO_BASE_URL', 'https://sandbox.momodeveloper.mtn.com')
        self.api_key = getattr(settings, 'MTN_MOMO_API_KEY', '')
        self.api_secret = getattr(settings, 'MTN_MOMO_API_SECRET', '')
        self.subscription_key = getattr(settings, 'MTN_MOMO_SUBSCRIPTION_KEY', '')
        self.collection_user_id = getattr(settings, 'MTN_MOMO_COLLECTION_USER_ID', '')
        self.environment = getattr(settings, 'MTN_MOMO_ENVIRONMENT', 'sandbox')
        self.callback_url = getattr(settings, 'MTN_MOMO_CALLBACK_URL', '')
        
        # API endpoints
        self.endpoints = {
            'token': '/collection/token/',
            'request_to_pay': '/collection/v1_0/requesttopay',
            'request_status': '/collection/v1_0/requesttopay/{reference_id}',
            'account_balance': '/collection/v1_0/account/balance',
            'account_status': '/collection/v1_0/accountholder/msisdn/{phone}/active'
        }
    
    def get_access_token(self) -> str:
        """
        Get OAuth access token from MTN
        
        Returns:
            Access token string
        """
        try:
            url = f"{self.base_url}{self.endpoints['token']}"
            
            headers = {
                'Ocp-Apim-Subscription-Key': self.subscription_key,
                'Authorization': f'Basic {self._get_basic_auth_token()}',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            
            response = requests.post(url, headers=headers, timeout=30)
            response.raise_for_status()
            
            token_data = response.json()
            return token_data.get('access_token')
            
        except requests.RequestException as e:
            self.logger.error(f"Error getting MTN MoMo access token: {str(e)}")
            raise PaymentServiceError(f"Failed to get access token: {str(e)}")
    
    def _get_basic_auth_token(self) -> str:
        """Generate basic auth token"""
        import base64
        
        credentials = f"{self.collection_user_id}:{self.api_secret}"
        return base64.b64encode(credentials.encode()).decode()
    
    def process_payment(self, payment_data: dict) -> dict:
        """
        Process MTN Mobile Money payment
        
        Args:
            payment_data: Payment data containing order, amount, phone_number, etc.
            
        Returns:
            Dictionary with payment processing result
        """
        try:
            self.validate_payment_data(payment_data)
            
            # Create payment record
            payment = self.create_payment_record(
                order=payment_data['order'],
                payment_method=PaymentMethod.MTN_MOMO,
                amount=payment_data['amount'],
                user=payment_data['user'],
                expires_at=timezone.now() + timezone.timedelta(minutes=15)  # 15 min expiry
            )
            
            # Create mobile money details
            mobile_money = MobileMoneyPayment.objects.create(
                payment=payment,
                phone_number=payment_data['phone_number'],
                customer_name=payment_data.get('customer_name', ''),
                request_payload=payment_data
            )
            
            # Process with MTN API
            result = self._request_to_pay(payment, mobile_money)
            
            if result['success']:
                # Update mobile money details with provider response
                mobile_money.provider_request_id = result['reference_id']
                mobile_money.response_payload = result['response']
                mobile_money.save()
                
                # Update payment status
                self.update_payment_status(
                    payment=payment,
                    status=PaymentStatus.PROCESSING,
                    transaction_id=result['reference_id'],
                    provider_response=result['response'],
                    notes="Payment request sent to MTN MoMo"
                )
                
                self.log_payment_activity(
                    payment=payment,
                    activity="MTN MoMo payment initiated",
                    details={'reference_id': result['reference_id']}
                )
                
                return {
                    'success': True,
                    'payment_id': str(payment.id),
                    'reference_number': payment.reference_number,
                    'provider_reference': result['reference_id'],
                    'status': 'processing',
                    'message': 'Payment request sent. Please complete the transaction on your phone.',
                    'expires_at': payment.expires_at.isoformat()
                }
            else:
                # Update payment as failed
                self.update_payment_status(
                    payment=payment,
                    status=PaymentStatus.FAILED,
                    failure_reason=result['error'],
                    provider_response=result.get('response', {})
                )
                
                return {
                    'success': False,
                    'payment_id': str(payment.id),
                    'reference_number': payment.reference_number,
                    'error': result['error'],
                    'message': 'Payment request failed. Please try again.'
                }
                
        except Exception as e:
            self.logger.error(f"Error processing MTN MoMo payment: {str(e)}")
            raise PaymentProcessingError(f"Payment processing failed: {str(e)}")
    
    def _request_to_pay(self, payment: Payment, mobile_money: MobileMoneyPayment) -> dict:
        """
        Send request to pay to MTN MoMo API
        
        Args:
            payment: Payment instance
            mobile_money: MobileMoneyPayment instance
            
        Returns:
            Dictionary with request result
        """
        try:
            access_token = self.get_access_token()
            reference_id = str(uuid.uuid4())
            
            url = f"{self.base_url}{self.endpoints['request_to_pay']}"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'X-Reference-Id': reference_id,
                'X-Target-Environment': self.environment,
                'Ocp-Apim-Subscription-Key': self.subscription_key,
                'Content-Type': 'application/json'
            }
            
            # Prepare payload
            payload = {
                'amount': str(payment.amount),
                'currency': payment.currency,
                'externalId': payment.reference_number,
                'payer': {
                    'partyIdType': 'MSISDN',
                    'partyId': mobile_money.phone_number.replace('+', '')
                },
                'payerMessage': f'Payment for order {payment.order.order_number}',
                'payeeNote': f'ShopOnline payment - {payment.reference_number}'
            }
            
            # Add callback URL if configured
            if self.callback_url:
                payload['callbackUrl'] = f"{self.callback_url}?payment_id={payment.id}"
            
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            
            if response.status_code == 202:  # Accepted
                return {
                    'success': True,
                    'reference_id': reference_id,
                    'response': {
                        'status_code': response.status_code,
                        'headers': dict(response.headers),
                        'payload': payload
                    }
                }
            else:
                error_data = {}
                try:
                    error_data = response.json()
                except:
                    error_data = {'message': response.text}
                
                return {
                    'success': False,
                    'error': f"MTN API Error: {error_data.get('message', 'Unknown error')}",
                    'response': {
                        'status_code': response.status_code,
                        'error_data': error_data
                    }
                }
                
        except Exception as e:
            self.logger.error(f"Error in MTN request to pay: {str(e)}")
            return {
                'success': False,
                'error': f"Request failed: {str(e)}"
            }
    
    def verify_payment(self, payment: Payment) -> dict:
        """
        Verify payment status with MTN MoMo API
        
        Args:
            payment: Payment instance
            
        Returns:
            Dictionary with verification result
        """
        try:
            if not hasattr(payment, 'mobile_money_details'):
                raise PaymentServiceError("No mobile money details found for this payment")
            
            mobile_money = payment.mobile_money_details
            if not mobile_money.provider_request_id:
                raise PaymentServiceError("No provider request ID found")
            
            access_token = self.get_access_token()
            
            url = f"{self.base_url}{self.endpoints['request_status'].format(reference_id=mobile_money.provider_request_id)}"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'X-Target-Environment': self.environment,
                'Ocp-Apim-Subscription-Key': self.subscription_key,
                'Content-Type': 'application/json'
            }
            
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            
            status_data = response.json()
            provider_status = status_data.get('status', '').upper()
            
            # Update mobile money details
            mobile_money.provider_status = provider_status
            mobile_money.provider_transaction_id = status_data.get('financialTransactionId', '')
            mobile_money.response_payload.update(status_data)
            mobile_money.save()
            
            # Map MTN status to our payment status
            new_status = self._map_mtn_status_to_payment_status(provider_status)
            
            if new_status != payment.status:
                self.update_payment_status(
                    payment=payment,
                    status=new_status,
                    external_transaction_id=mobile_money.provider_transaction_id,
                    provider_response=status_data,
                    notes=f"Status updated from MTN API: {provider_status}"
                )
            
            return {
                'success': True,
                'status': new_status,
                'provider_status': provider_status,
                'transaction_id': mobile_money.provider_transaction_id,
                'data': status_data
            }
            
        except Exception as e:
            self.logger.error(f"Error verifying MTN MoMo payment: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _map_mtn_status_to_payment_status(self, mtn_status: str) -> str:
        """
        Map MTN status to our payment status
        
        Args:
            mtn_status: MTN payment status
            
        Returns:
            Our payment status
        """
        status_mapping = {
            'PENDING': PaymentStatus.PROCESSING,
            'SUCCESSFUL': PaymentStatus.COMPLETED,
            'FAILED': PaymentStatus.FAILED,
            'REJECTED': PaymentStatus.FAILED,
            'CANCELLED': PaymentStatus.CANCELLED,
            'TIMEOUT': PaymentStatus.FAILED
        }
        
        return status_mapping.get(mtn_status.upper(), PaymentStatus.PENDING)
    
    def cancel_payment(self, payment: Payment) -> dict:
        """
        Cancel MTN MoMo payment (if possible)
        
        Args:
            payment: Payment instance
            
        Returns:
            Dictionary with cancellation result
        """
        try:
            # MTN MoMo doesn't support payment cancellation via API
            # We can only update our local status
            
            if payment.status in [PaymentStatus.COMPLETED, PaymentStatus.FAILED]:
                return {
                    'success': False,
                    'error': f'Cannot cancel payment with status: {payment.status}'
                }
            
            self.update_payment_status(
                payment=payment,
                status=PaymentStatus.CANCELLED,
                notes="Payment cancelled by user"
            )
            
            return {
                'success': True,
                'message': 'Payment cancelled successfully'
            }
            
        except Exception as e:
            self.logger.error(f"Error cancelling MTN MoMo payment: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def handle_webhook(self, payload: dict, headers: dict) -> dict:
        """
        Handle MTN MoMo webhook callback
        
        Args:
            payload: Webhook payload
            headers: Request headers
            
        Returns:
            Processing result
        """
        try:
            # Extract payment ID from callback URL or payload
            payment_id = payload.get('payment_id') or headers.get('X-Payment-Id')
            
            if not payment_id:
                return {'success': False, 'error': 'Payment ID not found in webhook'}
            
            payment = Payment.objects.get(id=payment_id)
            mobile_money = payment.mobile_money_details
            
            # Update callback information
            mobile_money.callback_received = True
            mobile_money.callback_at = timezone.now()
            mobile_money.callback_payload = payload
            mobile_money.save()
            
            # Verify payment status
            verification_result = self.verify_payment(payment)
            
            if verification_result['success']:
                return {
                    'success': True,
                    'payment_id': payment_id,
                    'status': verification_result['status']
                }
            else:
                return {
                    'success': False,
                    'payment_id': payment_id,
                    'error': verification_result['error']
                }
                
        except Payment.DoesNotExist:
            return {'success': False, 'error': 'Payment not found'}
        except Exception as e:
            self.logger.error(f"Error handling MTN MoMo webhook: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def get_payment_status_from_provider(self, payment: Payment) -> str:
        """
        Get current payment status from MTN
        
        Args:
            payment: Payment instance
            
        Returns:
            Provider payment status
        """
        result = self.verify_payment(payment)
        return result.get('provider_status', 'UNKNOWN') if result['success'] else 'ERROR'
    
    def check_account_status(self, phone_number: str) -> dict:
        """
        Check if phone number is active on MTN MoMo
        
        Args:
            phone_number: Phone number to check
            
        Returns:
            Account status result
        """
        try:
            access_token = self.get_access_token()
            
            # Clean phone number (remove +256 or +)
            clean_phone = phone_number.replace('+256', '').replace('+', '')
            
            url = f"{self.base_url}{self.endpoints['account_status'].format(phone=clean_phone)}"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'X-Target-Environment': self.environment,
                'Ocp-Apim-Subscription-Key': self.subscription_key
            }
            
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                account_data = response.json()
                return {
                    'success': True,
                    'active': account_data.get('result', False),
                    'data': account_data
                }
            else:
                return {
                    'success': False,
                    'active': False,
                    'error': f"Status check failed: {response.status_code}"
                }
                
        except Exception as e:
            self.logger.error(f"Error checking MTN account status: {str(e)}")
            return {
                'success': False,
                'active': False,
                'error': str(e)
            }
    
    def retry_failed_payment(self, payment: Payment) -> dict:
        """
        Retry a failed payment
        
        Args:
            payment: Payment instance
            
        Returns:
            Retry result
        """
        try:
            if payment.status not in [PaymentStatus.FAILED, PaymentStatus.PENDING]:
                return {
                    'success': False,
                    'error': f'Cannot retry payment with status: {payment.status}'
                }
            
            mobile_money = payment.mobile_money_details
            
            # Check retry limits
            if mobile_money.retry_count >= mobile_money.max_retries:
                return {
                    'success': False,
                    'error': 'Maximum retry attempts exceeded'
                }
            
            # Increment retry count
            mobile_money.retry_count += 1
            mobile_money.save()
            
            # Process payment again
            payment_data = {
                'order': payment.order,
                'amount': payment.amount,
                'user': payment.user,
                'phone_number': mobile_money.phone_number,
                'customer_name': mobile_money.customer_name
            }
            
            return self.process_payment(payment_data)
            
        except Exception as e:
            self.logger.error(f"Error retrying MTN MoMo payment: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }