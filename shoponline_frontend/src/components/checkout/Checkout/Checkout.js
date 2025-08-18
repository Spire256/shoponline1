// src/components/checkout/Checkout/Checkout.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useCart } from '../../../hooks/useCart';
import { ordersAPI } from '../../../services/api/ordersAPI';
import { paymentsAPI } from '../../../services/api/paymentsAPI';
import CheckoutSteps from './CheckoutSteps';
import OrderSummary from './OrderSummary';
import CustomerForm from '../CustomerInfo/CustomerForm';
import AddressForm from '../CustomerInfo/AddressForm';
import PaymentMethods from '../PaymentMethods/PaymentMethods';
import OrderConfirmation from '../OrderConfirmation/OrderConfirmation';
import { formatCurrency } from '../../../utils/helpers/currencyHelpers';
import './Checkout.css';

const CHECKOUT_STEPS = {
  CUSTOMER_INFO: 'customer_info',
  PAYMENT: 'payment',
  CONFIRMATION: 'confirmation',
};

const Checkout = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();

  // Checkout state
  const [currentStep, setCurrentStep] = useState(CHECKOUT_STEPS.CUSTOMER_INFO);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data state
  const [customerInfo, setCustomerInfo] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone_number || '',
  });

  const [addressInfo, setAddressInfo] = useState({
    address_line_1: '',
    address_line_2: '',
    city: '',
    district: '',
    postal_code: '',
    delivery_notes: '',
  });

  const [paymentInfo, setPaymentInfo] = useState({
    method: '',
    phone_number: '',
    customer_name: '',
    delivery_address: '',
    delivery_phone: '',
    delivery_notes: '',
  });

  // Order and payment state
  const [createdOrder, setCreatedOrder] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);

  // Available payment methods
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true);

  // Load payment methods on component mount
  useEffect(() => {
    loadPaymentMethods();
  }, []);

  // Redirect if cart is empty
  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartItems, navigate]);

  const loadPaymentMethods = async () => {
    try {
      setPaymentMethodsLoading(true);
      const response = await paymentsAPI.getPaymentMethods();
      if (response.success) {
        setPaymentMethods(response.data);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    } finally {
      setPaymentMethodsLoading(false);
    }
  };

  const validateCustomerInfo = () => {
    const errors = [];

    if (!customerInfo.first_name.trim()) {
      errors.push('First name is required');
    }

    if (!customerInfo.last_name.trim()) {
      errors.push('Last name is required');
    }

    if (!customerInfo.email.trim()) {
      errors.push('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(customerInfo.email)) {
      errors.push('Please enter a valid email address');
    }

    if (!customerInfo.phone.trim()) {
      errors.push('Phone number is required');
    } else if (!/^(\+?256|0)[0-9]{9}$/.test(customerInfo.phone.replace(/\s/g, ''))) {
      errors.push('Please enter a valid Ugandan phone number');
    }

    return errors;
  };

  const validateAddressInfo = () => {
    const errors = [];

    if (!addressInfo.address_line_1.trim()) {
      errors.push('Street address is required');
    }

    if (!addressInfo.city.trim()) {
      errors.push('City is required');
    }

    if (!addressInfo.district.trim()) {
      errors.push('District is required');
    }

    return errors;
  };

  const validatePaymentInfo = () => {
    const errors = [];

    if (!paymentInfo.method) {
      errors.push('Please select a payment method');
    }

    if (paymentInfo.method === 'mtn_momo' || paymentInfo.method === 'airtel_money') {
      if (!paymentInfo.phone_number.trim()) {
        errors.push('Mobile money phone number is required');
      } else if (!/^(\+?256|0)[0-9]{9}$/.test(paymentInfo.phone_number.replace(/\s/g, ''))) {
        errors.push('Please enter a valid mobile money phone number');
      }
    }

    if (paymentInfo.method === 'cash_on_delivery') {
      if (!paymentInfo.delivery_address.trim()) {
        errors.push('Delivery address is required for cash on delivery');
      }
      if (!paymentInfo.delivery_phone.trim()) {
        errors.push('Delivery phone number is required for cash on delivery');
      }
    }

    return errors;
  };

  const handleCustomerInfoSubmit = data => {
    setCustomerInfo(data);
    setCurrentStep(CHECKOUT_STEPS.PAYMENT);
    setError('');
  };

  const handleAddressInfoSubmit = data => {
    setAddressInfo(data);
    // Address is part of customer info step
  };

  const handlePaymentSubmit = async data => {
    setPaymentInfo(data);

    // Validate all data before proceeding
    const customerErrors = validateCustomerInfo();
    const addressErrors = validateAddressInfo();
    const paymentErrors = validatePaymentInfo();

    const allErrors = [...customerErrors, ...addressErrors, ...paymentErrors];

    if (allErrors.length > 0) {
      setError(allErrors.join(', '));
      return;
    }

    await processOrder();
  };

  const processOrder = async () => {
    try {
      setLoading(true);
      setError('');

      // Prepare order data
      const orderData = {
        // Customer information
        first_name: customerInfo.first_name,
        last_name: customerInfo.last_name,
        email: customerInfo.email,
        phone: customerInfo.phone,

        // Address information
        address_line_1: addressInfo.address_line_1,
        address_line_2: addressInfo.address_line_2,
        city: addressInfo.city,
        district: addressInfo.district,
        postal_code: addressInfo.postal_code,
        delivery_notes: addressInfo.delivery_notes,

        // Payment method
        payment_method: paymentInfo.method,

        // Items from cart
        items: cartItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      };

      // Create order
      const orderResponse = await ordersAPI.createOrder(orderData);

      if (!orderResponse.success) {
        throw new Error(orderResponse.error || 'Failed to create order');
      }

      setCreatedOrder(orderResponse.data);

      // Process payment
      const paymentData = {
        order_id: orderResponse.data.id,
        payment_method: paymentInfo.method,
      };

      // Add method-specific payment data
      if (paymentInfo.method === 'mtn_momo' || paymentInfo.method === 'airtel_money') {
        paymentData.phone_number = paymentInfo.phone_number;
        paymentData.customer_name = `${customerInfo.first_name} ${customerInfo.last_name}`;
      } else if (paymentInfo.method === 'cash_on_delivery') {
        paymentData.delivery_address = `${addressInfo.address_line_1}, ${addressInfo.city}, ${addressInfo.district}`;
        paymentData.delivery_phone = paymentInfo.delivery_phone || customerInfo.phone;
        paymentData.delivery_notes = addressInfo.delivery_notes;
      }

      const paymentResponse = await paymentsAPI.createPayment(paymentData);

      if (!paymentResponse.success) {
        throw new Error(paymentResponse.error || 'Failed to process payment');
      }

      setPaymentResult(paymentResponse.data);
      setCurrentStep(CHECKOUT_STEPS.CONFIRMATION);

      // Clear cart on successful order
      clearCart();

      setSuccess('Order created successfully!');
    } catch (error) {
      console.error('Checkout error:', error);
      setError(error.message || 'An error occurred during checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStepChange = step => {
    // Only allow going backwards or to current step
    const stepOrder = [
      CHECKOUT_STEPS.CUSTOMER_INFO,
      CHECKOUT_STEPS.PAYMENT,
      CHECKOUT_STEPS.CONFIRMATION,
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    const targetIndex = stepOrder.indexOf(step);

    if (targetIndex <= currentIndex) {
      setCurrentStep(step);
      setError('');
    }
  };

  const handleBackStep = () => {
    if (currentStep === CHECKOUT_STEPS.PAYMENT) {
      setCurrentStep(CHECKOUT_STEPS.CUSTOMER_INFO);
    } else if (currentStep === CHECKOUT_STEPS.CONFIRMATION) {
      setCurrentStep(CHECKOUT_STEPS.PAYMENT);
    }
    setError('');
  };

  const getStepTitle = step => {
    switch (step) {
      case CHECKOUT_STEPS.CUSTOMER_INFO:
        return 'Customer Information';
      case CHECKOUT_STEPS.PAYMENT:
        return 'Payment Method';
      case CHECKOUT_STEPS.CONFIRMATION:
        return 'Order Confirmation';
      default:
        return 'Checkout';
    }
  };

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="checkout-empty">
        <h2>Your cart is empty</h2>
        <p>Please add items to your cart before proceeding to checkout.</p>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-content">
        <div className="checkout-header">
          <h1>Checkout</h1>
          <CheckoutSteps
            currentStep={currentStep}
            onStepChange={handleStepChange}
            steps={[
              {
                key: CHECKOUT_STEPS.CUSTOMER_INFO,
                label: 'Customer Info',
                completed: currentStep !== CHECKOUT_STEPS.CUSTOMER_INFO,
              },
              {
                key: CHECKOUT_STEPS.PAYMENT,
                label: 'Payment',
                completed: currentStep === CHECKOUT_STEPS.CONFIRMATION,
              },
              { key: CHECKOUT_STEPS.CONFIRMATION, label: 'Confirmation', completed: false },
            ]}
          />
        </div>

        {error && (
          <div className="checkout-error">
            <i className="fas fa-exclamation-triangle" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="checkout-success">
            <i className="fas fa-check-circle" />
            <span>{success}</span>
          </div>
        )}

        <div className="checkout-main">
          <div className="checkout-form">
            <div className="checkout-step-content">
              <h2>{getStepTitle(currentStep)}</h2>

              {currentStep === CHECKOUT_STEPS.CUSTOMER_INFO && (
                <div className="customer-info-section">
                  <CustomerForm
                    initialData={customerInfo}
                    onSubmit={handleCustomerInfoSubmit}
                    loading={loading}
                  />

                  <div className="address-section">
                    <h3>Delivery Address</h3>
                    <AddressForm
                      initialData={addressInfo}
                      onSubmit={handleAddressInfoSubmit}
                      loading={loading}
                    />
                  </div>
                </div>
              )}

              {currentStep === CHECKOUT_STEPS.PAYMENT && (
                <div className="payment-section">
                  <PaymentMethods
                    paymentMethods={paymentMethods}
                    loading={paymentMethodsLoading}
                    onSubmit={handlePaymentSubmit}
                    onBack={handleBackStep}
                    orderTotal={cartTotal}
                    initialData={paymentInfo}
                    customerInfo={customerInfo}
                    addressInfo={addressInfo}
                    processingPayment={loading}
                  />
                </div>
              )}

              {currentStep === CHECKOUT_STEPS.CONFIRMATION && (
                <div className="confirmation-section">
                  <OrderConfirmation
                    order={createdOrder}
                    payment={paymentResult}
                    customerInfo={customerInfo}
                    addressInfo={addressInfo}
                    paymentInfo={paymentInfo}
                    onBack={handleBackStep}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="checkout-sidebar">
            <OrderSummary
              items={cartItems}
              total={cartTotal}
              currentStep={currentStep}
              order={createdOrder}
              showEditButton={currentStep !== CHECKOUT_STEPS.CONFIRMATION}
            />
          </div>
        </div>
      </div>

      {loading && (
        <div className="checkout-loading-overlay">
          <div className="loading-spinner">
            <div className="spinner" />
            <p>Processing your order...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
