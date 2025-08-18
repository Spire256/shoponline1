import React, { useState, useEffect } from 'react';
import { CreditCard, Smartphone, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { paymentAPI } from '../../../services/api/paymentsAPI';
import './PaymentMethods.css';

const PaymentMethods = ({
  selectedMethod,
  onMethodSelect,
  onPaymentData,
  orderAmount,
  disabled = false,
}) => {
  const [paymentConfigs, setPaymentConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [phoneValidation, setPhoneValidation] = useState({ isValid: false, message: '' });
  const [validatingPhone, setValidatingPhone] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  useEffect(() => {
    // Update payment data when form fields change
    const paymentData = {
      phone_number: phoneNumber,
      customer_name: customerName,
      delivery_address: deliveryAddress,
      delivery_phone: deliveryPhone,
      delivery_notes: deliveryNotes,
    };
    onPaymentData(paymentData);
  }, [phoneNumber, customerName, deliveryAddress, deliveryPhone, deliveryNotes, onPaymentData]);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.getPaymentMethods();
      if (response.success) {
        setPaymentConfigs(response.data);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const validatePhoneNumber = async (phone, method) => {
    if (!phone || phone.length < 10) {
      setPhoneValidation({ isValid: false, message: '' });
      return;
    }

    try {
      setValidatingPhone(true);
      const response = await paymentAPI.checkPhoneNumber({
        phone_number: phone,
        payment_method: method,
      });

      setPhoneValidation({
        isValid: response.valid,
        message: response.message,
      });
    } catch (error) {
      setPhoneValidation({
        isValid: false,
        message: 'Unable to validate phone number',
      });
    } finally {
      setValidatingPhone(false);
    }
  };

  const handlePhoneChange = value => {
    setPhoneNumber(value);

    // Auto-validate for mobile money methods
    if (selectedMethod && ['mtn_momo', 'airtel_money'].includes(selectedMethod)) {
      const timeoutId = setTimeout(() => {
        validatePhoneNumber(value, selectedMethod);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const isMethodAvailable = method => {
    const config = paymentConfigs.find(c => c.payment_method === method.payment_method);
    if (!config) return false;

    return orderAmount >= config.min_amount && orderAmount <= config.max_amount;
  };

  const getPaymentMethodIcon = method => {
    switch (method) {
      case 'mtn_momo':
        return <Smartphone className="payment-icon mtn-icon" />;
      case 'airtel_money':
        return <Smartphone className="payment-icon airtel-icon" />;
      case 'cod':
        return <DollarSign className="payment-icon cod-icon" />;
      default:
        return <CreditCard className="payment-icon" />;
    }
  };

  const renderMobileMoneyForm = () => (
    <div className="payment-form">
      <div className="form-group">
        <label htmlFor="phoneNumber">Phone Number *</label>
        <div className="phone-input-container">
          <input
            type="tel"
            id="phoneNumber"
            className={`form-input ${
              phoneValidation.isValid ? 'valid' : phoneValidation.message ? 'invalid' : ''
            }`}
            placeholder="0700000000 or +256700000000"
            value={phoneNumber}
            onChange={e => handlePhoneChange(e.target.value)}
            disabled={disabled}
            required
          />
          {validatingPhone && (
            <div className="validation-spinner">
              <div className="spinner" />
            </div>
          )}
          {phoneValidation.message && (
            <div className={`validation-message ${phoneValidation.isValid ? 'valid' : 'invalid'}`}>
              {phoneValidation.isValid ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span>{phoneValidation.message}</span>
            </div>
          )}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="customerName">Full Name (Optional)</label>
        <input
          type="text"
          id="customerName"
          className="form-input"
          placeholder="Enter your full name"
          value={customerName}
          onChange={e => setCustomerName(e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="mobile-money-info">
        <div className="info-box">
          <AlertCircle size={20} />
          <div>
            <h4>How it works:</h4>
            <ol>
              <li>Enter your phone number above</li>
              <li>Click "Place Order" to continue</li>
              <li>You'll receive a payment prompt on your phone</li>
              <li>Enter your Mobile Money PIN to complete payment</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCODForm = () => (
    <div className="payment-form">
      <div className="form-group">
        <label htmlFor="deliveryAddress">Delivery Address *</label>
        <textarea
          id="deliveryAddress"
          className="form-textarea"
          placeholder="Enter your full delivery address including landmarks"
          value={deliveryAddress}
          onChange={e => setDeliveryAddress(e.target.value)}
          disabled={disabled}
          required
          rows={3}
        />
      </div>

      <div className="form-group">
        <label htmlFor="deliveryPhone">Delivery Phone Number *</label>
        <input
          type="tel"
          id="deliveryPhone"
          className="form-input"
          placeholder="0700000000 or +256700000000"
          value={deliveryPhone}
          onChange={e => setDeliveryPhone(e.target.value)}
          disabled={disabled}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="deliveryNotes">Delivery Notes (Optional)</label>
        <textarea
          id="deliveryNotes"
          className="form-textarea"
          placeholder="Any special delivery instructions..."
          value={deliveryNotes}
          onChange={e => setDeliveryNotes(e.target.value)}
          disabled={disabled}
          rows={2}
        />
      </div>

      <div className="cod-info">
        <div className="info-box">
          <DollarSign size={20} />
          <div>
            <h4>Cash on Delivery:</h4>
            <ul>
              <li>Pay with cash when your order is delivered</li>
              <li>Our team will contact you to arrange delivery</li>
              <li>Have exact change ready: {formatCurrency(orderAmount)}</li>
              <li>Delivery within Kampala and surrounding areas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="payment-methods-loading">
        <div className="spinner" />
        <p>Loading payment methods...</p>
      </div>
    );
  }

  return (
    <div className="payment-methods">
      <h3 className="payment-methods-title">Select Payment Method</h3>

      <div className="payment-options">
        {paymentConfigs.map(config => {
          const isAvailable = isMethodAvailable(config);
          const isSelected = selectedMethod === config.payment_method;

          return (
            <div
              key={config.payment_method}
              className={`payment-option ${isSelected ? 'selected' : ''} ${
                !isAvailable ? 'disabled' : ''
              }`}
              onClick={() => isAvailable && !disabled && onMethodSelect(config.payment_method)}
            >
              <div className="payment-option-header">
                <div className="payment-option-info">
                  {getPaymentMethodIcon(config.payment_method)}
                  <div className="payment-option-details">
                    <h4>{config.display_name}</h4>
                    <p>{config.description}</p>
                    {config.fixed_fee > 0 && (
                      <span className="payment-fee">Fee: {formatCurrency(config.fixed_fee)}</span>
                    )}
                  </div>
                </div>

                <div className="payment-option-radio">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={isSelected}
                    onChange={() => {}}
                    disabled={!isAvailable || disabled}
                  />
                </div>
              </div>

              {!isAvailable && (
                <div className="payment-unavailable">
                  <AlertCircle size={16} />
                  <span>
                    Amount must be between {formatCurrency(config.min_amount)}
                    and {formatCurrency(config.max_amount)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment Form */}
      {selectedMethod && (
        <div className="payment-form-container">
          {['mtn_momo', 'airtel_money'].includes(selectedMethod) && renderMobileMoneyForm()}
          {selectedMethod === 'cod' && renderCODForm()}
        </div>
      )}
    </div>
  );
};

export default PaymentMethods;
