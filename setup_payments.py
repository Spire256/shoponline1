# setup_payments.py
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'shoponline.settings.development')
django.setup()

from apps.payments.models import PaymentMethodConfig, PaymentMethod
from decimal import Decimal

def setup_payment_methods():
    """Create payment method configurations"""
    
    # Clear existing configs
    PaymentMethodConfig.objects.all().delete()
    
    # MTN Mobile Money
    mtn_config = PaymentMethodConfig.objects.create(
        payment_method=PaymentMethod.MTN_MOMO,
        is_active=True,
        display_name='MTN Mobile Money',
        description='Pay with MTN Mobile Money - fast and secure',
        min_amount=Decimal('50.00'),
        max_amount=Decimal('5000000.00'),
        fixed_fee=Decimal('0.00'),
        percentage_fee=Decimal('1.5000')
    )
    
    # Airtel Money
    airtel_config = PaymentMethodConfig.objects.create(
        payment_method=PaymentMethod.AIRTEL_MONEY,
        is_active=True,
        display_name='Airtel Money',
        description='Pay with Airtel Money - quick and convenient',
        min_amount=Decimal('1000.00'),
        max_amount=Decimal('5000000.00'),
        fixed_fee=Decimal('0.00'),
        percentage_fee=Decimal('1.2000')
    )
    
    # Cash on Delivery
    cod_config = PaymentMethodConfig.objects.create(
        payment_method=PaymentMethod.CASH_ON_DELIVERY,
        is_active=True,
        display_name='Cash on Delivery',
        description='Pay cash when your order is delivered',
        min_amount=Decimal('5000.00'),
        max_amount=Decimal('1000000.00'),
        fixed_fee=Decimal('0.00'),
        percentage_fee=Decimal('0.0000')
    )
    
    print("✓ Payment method configurations created successfully!")
    print(f"Total configs: {PaymentMethodConfig.objects.count()}")
    
    for config in PaymentMethodConfig.objects.all():
        print(f"- {config.display_name} ({config.payment_method})")

if __name__ == "__main__":
    setup_payment_methods()