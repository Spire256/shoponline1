import React, { useState, useEffect, useContext } from 'react';
import CheckoutFlow from './CheckoutFlow';
import PaymentSection from './PaymentSection';
import './CheckoutPage.css';

const CheckoutPage = () => {
  // Mock context - replace with your actual contexts
  const cart = [
    { product_id: '1', name: 'Sample Product 1', price: 50000, quantity: 2, image: '' },
    { product_id: '2', name: 'Sample Product 2', price: 75000, quantity: 1, image: '' },
  ];

  const user = { first_name: 'John', last_name: 'Doe', email: 'john@gmail.com' };
  const isAuthenticated = true;

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  const [customerInfo, setCustomerInfo] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: '',
  });

  const [deliveryInfo, setDeliveryInfo] = useState({
    address_line_1: '',
    address_line_2: '',
    city: 'Kampala',
    district: 'Kampala',
    postal_code: '',
    delivery_notes: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDetails, setPaymentDetails] = useState({});

  // Uganda districts for dropdown
  const ugandaDistricts = [
    'Kampala',
    'Wakiso',
    'Mukono',
    'Entebbe',
    'Jinja',
    'Mbale',
    'Gulu',
    'Lira',
    'Mbarara',
    'Fort Portal',
    'Kasese',
    'Kabale',
    'Soroti',
    'Hoima',
    'Masaka',
    'Arua',
    'Kitgum',
    'Moroto',
  ];

  const handleStepChange = step => {
    setCurrentStep(step);
  };

  const handleCustomerInfoChange = (field, value) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDeliveryInfoChange = (field, value) => {
    setDeliveryInfo(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateStep = step => {
    switch (step) {
      case 1:
        return (
          customerInfo.first_name &&
          customerInfo.last_name &&
          customerInfo.email &&
          customerInfo.phone
        );
      case 2:
        return deliveryInfo.address_line_1 && deliveryInfo.city && deliveryInfo.district;
      case 3:
        return paymentMethod && validatePaymentDetails();
      default:
        return false;
    }
  };

  const validatePaymentDetails = () => {
    if (!paymentMethod) return false;

    switch (paymentMethod) {
      case 'mtn_momo':
      case 'airtel_money':
        return paymentDetails.phone_number && paymentDetails.customer_name;
      case 'cash_on_delivery':
        return paymentDetails.delivery_phone && paymentDetails.delivery_address;
      default:
        return false;
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const calculateTotals = () => {
    const subtotal = getCartTotal();
    const deliveryFee = 10000; // UGX 10,000 standard delivery fee
    const total = subtotal + deliveryFee;

    return {
      subtotal,
      deliveryFee,
      total,
    };
  };

  const createOrder = async () => {
    setIsSubmitting(true);

    try {
      const { subtotal, deliveryFee, total } = calculateTotals();

      // Prepare order items
      const items = cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }));

      const orderPayload = {
        ...customerInfo,
        ...deliveryInfo,
        payment_method: paymentMethod,
        items,
      };

      // Simulate API call to create order
      const response = await fetch('/api/orders/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create order');
      }

      const order = await response.json();
      setOrderData(order);

      // Proceed to payment
      await initiatePayment(order);
    } catch (error) {
      console.error('Order creation failed:', error);
      alert('Failed to create order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const initiatePayment = async order => {
    try {
      const paymentPayload = {
        order_id: order.id,
        payment_method: paymentMethod,
        ...paymentDetails,
      };

      // Simulate API call to create payment
      const response = await fetch('/api/payments/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(paymentPayload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to initiate payment');
      }

      const payment = await response.json();
      setPaymentData(payment);

      // Handle different payment methods
      handlePaymentResponse(payment);
    } catch (error) {
      console.error('Payment initiation failed:', error);
      alert('Failed to initiate payment. Please try again.');
    }
  };

  const handlePaymentResponse = payment => {
    switch (payment.payment_method) {
      case 'mtn_momo':
      case 'airtel_money':
        // Show mobile money confirmation dialog
        alert(
          `Payment request sent to ${paymentDetails.phone_number}. Please check your phone and enter your PIN to complete the payment.`
        );
        // In real app: navigate to order confirmation
        console.log('Navigate to order confirmation', { payment, order: orderData });
        break;

      case 'cash_on_delivery':
        // In real app: clear cart and navigate to success page
        alert('Order placed successfully! You will pay cash on delivery.');
        console.log('Navigate to order confirmation', { payment, order: orderData });
        break;

      default:
        alert('Unknown payment method');
    }
  };

  if (!cart || cart.length === 0) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="empty-checkout">
            <div className="empty-checkout-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Add some items to your cart before proceeding to checkout.</p>
            <button className="btn-primary" onClick={() => console.log('Navigate to products')}>
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-header">
          <h1>Checkout</h1>
          <div className="secure-checkout">
            <span className="secure-icon">🔒</span>
            <span>Secure Checkout</span>
          </div>
        </div>

        <div className="checkout-content">
          <div className="checkout-main">
            <CheckoutFlow
              currentStep={currentStep}
              onStepChange={handleStepChange}
              customerInfo={customerInfo}
              onCustomerInfoChange={handleCustomerInfoChange}
              deliveryInfo={deliveryInfo}
              onDeliveryInfoChange={handleDeliveryInfoChange}
              ugandaDistricts={ugandaDistricts}
              validateStep={validateStep}
            />

            {currentStep === 3 && (
              <PaymentSection
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                paymentDetails={paymentDetails}
                setPaymentDetails={setPaymentDetails}
                totals={totals}
                onSubmit={createOrder}
                isSubmitting={isSubmitting}
                validatePaymentDetails={validatePaymentDetails}
              />
            )}
          </div>

          <div className="checkout-sidebar">
            <div className="order-summary">
              <h3>Order Summary</h3>

              <div className="summary-items">
                {cart.map((item, index) => (
                  <div key={index} className="summary-item">
                    <div className="item-image">
                      <img
                        src={item.image || '/assets/images/placeholders/product-placeholder.jpg'}
                        alt={item.name}
                        onError={e => {
                          e.target.src = '/assets/images/placeholders/product-placeholder.jpg';
                        }}
                      />
                    </div>
                    <div className="item-details">
                      <h4>{item.name}</h4>
                      <p>Qty: {item.quantity}</p>
                      <p className="item-price">
                        UGX {(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="summary-totals">
                <div className="total-row">
                  <span>Subtotal</span>
                  <span>UGX {totals.subtotal.toLocaleString()}</span>
                </div>
                <div className="total-row">
                  <span>Delivery Fee</span>
                  <span>UGX {totals.deliveryFee.toLocaleString()}</span>
                </div>
                <div className="total-row total">
                  <span>Total</span>
                  <span>UGX {totals.total.toLocaleString()}</span>
                </div>
              </div>

              <div className="summary-actions">
                <button className="btn-secondary" onClick={() => console.log('Navigate to cart')}>
                  Back to Cart
                </button>

                {currentStep < 3 && (
                  <button
                    className="btn-primary"
                    onClick={() => {
                      if (validateStep(currentStep)) {
                        setCurrentStep(currentStep + 1);
                      } else {
                        alert('Please fill in all required fields');
                      }
                    }}
                  >
                    Continue
                  </button>
                )}
              </div>
            </div>

            <div className="checkout-security">
              <h4>Secure Payment</h4>
              <div className="security-features">
                <div className="security-item">
                  <span className="security-icon">🔐</span>
                  <span>SSL Encrypted</span>
                </div>
                <div className="security-item">
                  <span className="security-icon">✅</span>
                  <span>Secure Payment Gateway</span>
                </div>
                <div className="security-item">
                  <span className="security-icon">🛡️</span>
                  <span>Data Protection</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
