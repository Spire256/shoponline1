# apps/payments/services/airtel_money_service.py
import requests
import uuid
import json
from decimal import Decimal
from django.conf import settings
from django.utils import timezone
from django.db import transaction

from .base_payment import BasePaymentService, PaymentServiceError, PaymentProcessingError
from ..models import Payment, MobileMoneyPayment, PaymentStatus, PaymentMethod

class AirtelMoneyService(BasePaymentService):
    """Airtel Money payment service"""
    
    def __init__(self):
        super().__init__()
        self.base_url = getattr(settings, 'AIRTEL_MONEY_BASE_URL', 'https://openapiuat.airtel.africa')
        self.client_id = getattr(settings, 'AIRTEL_MONEY_CLIENT_ID', '')
        self.client_secret = getattr(settings, 'AIRTEL_MONEY_CLIENT_SECRET', '')
        self.pin = getattr(settings, 'AIRTEL_MONEY_PIN', '')
        self.environment = getattr(settings, 'AIRTEL_MONEY_ENVIRONMENT', 'sandbox')
        self.callback_url = getattr(settings, 'AIRTEL_MONEY_CALLBACK_URL', '')
        
        # API endpoints
        self.endpoints = {
            'auth': '/auth/oauth2/token',
            'push_payment': '/merchant/v1/payments/',
            'payment_status': '/standard/v1/payments/{transaction_id}',
            'account_balance': '/standard/v1/users/balance',
            'user_details': '/standard/v1/users/{msisdn}'
        }
    
    def get_access_token(self) -> str:
        """
        Get OAuth access token from Airtel Money
        
        Returns:
            Access token string
        """
        try:
            url = f"{self.base_url}{self.endpoints['auth']}"
            
            headers = {
                'Content-Type': 'application/json',
                'Accept': '*/*'
            }
            
            payload = {
                'client_id': self.client_id,
                'client_secret': self.client_secret,
                'grant_type': 'client_credentials'
            }
            
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            
            token_data = response.json()
            return token_data.get('access_token')
            
        except requests.RequestException as e:
            self.logger.error(f"Error getting Airtel Money access token: {str(e)}")
            raise PaymentServiceError(f"Failed to get access token: {str(e)}")
    
    def process_payment(self, payment_data: dict) -> dict:
        """
        Process Airtel Money payment
        
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
                payment_method=PaymentMethod.AIRTEL_MONEY,
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
            
            # Process with Airtel API
            result = self._push_payment(payment, mobile_money)
            
            if result['success']:
                # Update mobile money details with provider response
                mobile_money.provider_request_id = result['transaction_id']
                mobile_money.response_payload = result['response']
                mobile_money.save()
                
                # Update payment status
                self.update_payment_status(
                    payment=payment,
                    status=PaymentStatus.PROCESSING,
                    transaction_id=result['transaction_id'],
                    provider_response=result['response'],
                    notes="Payment request sent to Airtel Money"
                )
                
                self.log_payment_activity(
                    payment=payment,
                    activity="Airtel Money payment initiated",
                    details={'transaction_id': result['transaction_id']}
                )
                
                return {
                    'success': True,
                    'payment_id': str(payment.id),
                    'reference_number': payment.reference_number,
                    'provider_reference': result['transaction_id'],
                    'status': 'processing',
                    'message': 'Payment request sent. Please approve the transaction on your phone.',
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
            self.logger.error(f"Error processing Airtel Money payment: {str(e)}")
            raise PaymentProcessingError(f"Payment processing failed: {str(e)}")
    
    def _push_payment(self, payment: Payment, mobile_money: MobileMoneyPayment) -> dict:
        """
        Send push payment request to Airtel Money API
        
        Args:
            payment: Payment instance
            mobile_money: MobileMoneyPayment instance
            
        Returns:
            Dictionary with request result
        """
        try:
            access_token = self.get_access_token()
            transaction_id = str(uuid.uuid4())
            
            url = f"{self.base_url}{self.endpoints['push_payment']}"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
                'Accept': '*/*',
                'X-Country': 'UG',  # Uganda
                'X-Currency': payment.currency
            }
            
            # Prepare payload
            payload = {
                'reference': payment.reference_number,
                'subscriber': {
                    'country': 'UG',
                    'currency': payment.currency,
                    'msisdn': mobile_money.phone_number.replace('+', '')
                },
                'transaction': {
                    'amount': str(payment.amount),
                    'country': 'UG',
                    'currency': payment.currency,
                    'id': transaction_id
                }
            }
            
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            
            if response.status_code in [200, 201]:
                response_data = response.json()
                
                # Check if request was successful
                if response_data.get('status', {}).get('success') == True:
                    return {
                        'success': True,
                        'transaction_id': transaction_id,
                        'response': {
                            'status_code': response.status_code,
                            'data': response_data,
                            'payload': payload
                        }
                    }
                else:
                    error_msg = response_data.get('status', {}).get('message', 'Unknown error')
                    return {
                        'success': False,
                        'error': f"Airtel API Error: {error_msg}",
                        'response': {
                            'status_code': response.status_code,
                            'error_data': response_data
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
                    'error': f"Airtel API Error: {error_data.get('message', 'Unknown error')}",
                    'response': {
                        'status_code': response.status_code,
                        'error_data': error_data
                    }
                }
                
        except Exception as e:
            self.logger.error(f"Error in Airtel push payment: {str(e)}")
            return {
                'success': False,
                'error': f"Request failed: {str(e)}"
            }
    
    def verify_payment(self, payment: Payment) -> dict:
        """
        Verify payment status with Airtel Money API
        
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
            
            url = f"{self.base_url}{self.endpoints['payment_status'].format(transaction_id=mobile_money.provider_request_id)}"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
                'Accept': '*/*',
                'X-Country': 'UG',
                'X-Currency': payment.currency
            }
            
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            
            status_data = response.json()
            
            # Extract status information
            transaction_data = status_data.get('data', {}).get('transaction', {})
            provider_status = transaction_data.get('status', '').upper()
            
            # Update mobile money details
            mobile_money.provider_status = provider_status
            mobile_money.provider_transaction_id = transaction_data.get('airtel_money_id', '')
            mobile_money.response_payload.update(status_data)
            mobile_money.save()
            
            # Map Airtel status to our payment status
            new_status = self._map_airtel_status_to_payment_status(provider_status)
            
            if new_status != payment.status:
                self.update_payment_status(
                    payment=payment,
                    status=new_status,
                    external_transaction_id=mobile_money.provider_transaction_id,
                    provider_response=status_data,
                    notes=f"Status updated from Airtel API: {provider_status}"
                )
            
            return {
                'success': True,
                'status': new_status,
                'provider_status': provider_status,
                'transaction_id': mobile_money.provider_transaction_id,
                'data': status_data
            }
            
        except Exception as e:
            self.logger.error(f"Error verifying Airtel Money payment: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _map_airtel_status_to_payment_status(self, airtel_status: str) -> str:
        """
        Map Airtel status to our payment status
        
        Args:
            airtel_status: Airtel payment status
            
        Returns:
            Our payment status
        """
        status_mapping = {
            'TS': PaymentStatus.COMPLETED,      # Transaction Successful
            'TF': PaymentStatus.FAILED,         # Transaction Failed
            'TA': PaymentStatus.PROCESSING,     # Transaction Ambiguous
            'TIP': PaymentStatus.PROCESSING,    # Transaction In Progress
            'TUP': PaymentStatus.PROCESSING,    # Transaction User Processing
            'TNF': PaymentStatus.FAILED,        # Transaction Not Found
            'FAILED': PaymentStatus.FAILED,
            'SUCCESS': PaymentStatus.COMPLETED,
            'PENDING': PaymentStatus.PROCESSING
        }
        
        return status_mapping.get(airtel_status.upper(), PaymentStatus.PENDING)
    
    def cancel_payment(self, payment: Payment) -> dict:
        """
        Cancel Airtel Money payment (if possible)
        
        Args:
            payment: Payment instance
            
        Returns:
            Dictionary with cancellation result
        """
        try:
            # Airtel Money doesn't support payment cancellation via API
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
            self.logger.error(f"Error cancelling Airtel Money payment: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def handle_webhook(self, payload: dict, headers: dict) -> dict:
        """
        Handle Airtel Money webhook callback
        
        Args:
            payload: Webhook payload
            headers: Request headers
            
        Returns:
            Processing result
        """
        try:
            # Extract transaction information from payload
            transaction_data = payload.get('transaction', {})
            reference = transaction_data.get('reference', '')
            
            if not reference:
                return {'success': False, 'error': 'Reference not found in webhook'}
            
            # Find payment by reference number
            payment = Payment.objects.get(reference_number=reference)
            mobile_money = payment.mobile_money_details
            
            # Update callback information
            mobile_money.callback_received = True
            mobile_money.callback_at = timezone.now()
            mobile_money.callback_payload = payload
            mobile_money.save()
            
            # Extract status from webhook
            status = transaction_data.get('status', '').upper()
            new_status = self._map_airtel_status_to_payment_status(status)
            
            # Update payment status
            if new_status != payment.status:
                self.update_payment_status(
                    payment=payment,
                    status=new_status,
                    external_transaction_id=transaction_data.get('airtel_money_id', ''),
                    provider_response=payload,
                    notes=f"Status updated from webhook: {status}"
                )
            
            return {
                'success': True,
                'payment_id': str(payment.id),
                'status': new_status
            }
            
        except Payment.DoesNotExist:
            return {'success': False, 'error': 'Payment not found'}
        except Exception as e:
            self.logger.error(f"Error handling Airtel Money webhook: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def get_payment_status_from_provider(self, payment: Payment) -> str:
        """
        Get current payment status from Airtel
        
        Args:
            payment: Payment instance
            
        Returns:
            Provider payment status
        """
        result = self.verify_payment(payment)
        return result.get('provider_status', 'UNKNOWN') if result['success'] else 'ERROR'
    
    def check_user_details(self, phone_number: str) -> dict:
        """
        Check user details for phone number on Airtel Money
        
        Args:
            phone_number: Phone number to check
            
        Returns:
            User details result
        """
        try:
            access_token = self.get_access_token()
            
            # Clean phone number (remove +256 or +)
            clean_phone = phone_number.replace('+256', '').replace('+', '')
            
            url = f"{self.base_url}{self.endpoints['user_details'].format(msisdn=clean_phone)}"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
                'Accept': '*/*',
                'X-Country': 'UG',
                'X-Currency': 'UGX'
            }
            
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                user_data = response.json()
                return {
                    'success': True,
                    'data': user_data,
                    'is_valid': user_data.get('status', {}).get('success', False)
                }
            else:
                return {
                    'success': False,
                    'error': f"User details check failed: {response.status_code}"
                }
                
        except Exception as e:
            self.logger.error(f"Error checking Airtel user details: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_account_balance(self) -> dict:
        """
        Get merchant account balance from Airtel Money
        
        Returns:
            Account balance result
        """
        try:
            access_token = self.get_access_token()
            
            url = f"{self.base_url}{self.endpoints['account_balance']}"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
                'Accept': '*/*',
                'X-Country': 'UG',
                'X-Currency': 'UGX'
            }
            
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                balance_data = response.json()
                return {
                    'success': True,
                    'data': balance_data
                }
            else:
                return {
                    'success': False,
                    'error': f"Balance check failed: {response.status_code}"
                }
                
        except Exception as e:
            self.logger.error(f"Error getting Airtel account balance: {str(e)}")
            return {
                'success': False,
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
            self.logger.error(f"Error retrying Airtel Money payment: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }