import React, { useState, useEffect } from 'react';

const PaymentSection = ({
  paymentMethod,
  setPaymentMethod,
  paymentDetails,
  setPaymentDetails,
  totals,
  onSubmit,
  isSubmitting,
  validatePaymentDetails,
}) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [phoneCheckLoading, setPhoneCheckLoading] = useState(false);

  useEffect(() => {
    // Load available payment methods
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      // Simulate API call - replace with actual API
      const response = await fetch('/api/payment-methods/');
      const methods = await response.json();

      // Fallback to default methods if API fails
      const defaultMethods = [
        {
          payment_method: 'mtn_momo',
          display_name: 'MTN Mobile Money',
          description: 'Pay using your MTN Mobile Money account',
          icon: '📱',
          is_active: true,
          min_amount: 1000,
          max_amount: 5000000,
        },
        {
          payment_method: 'airtel_money',
          display_name: 'Airtel Money',
          description: 'Pay using your Airtel Money account',
          icon: '💰',
          is_active: true,
          min_amount: 1000,
          max_amount: 5000000,
        },
        {
          payment_method: 'cash_on_delivery',
          display_name: 'Cash on Delivery',
          description: 'Pay with cash when your order is delivered',
          icon: '💵',
          is_active: true,
          min_amount: 5000,
          max_amount: 1000000,
        },
      ];

      setPaymentMethods(response.ok ? methods : defaultMethods);
    } catch (error) {
      console.error('Failed to load payment methods:', error);
    }
  };

  const validatePhoneNumber = phone => {
    const patterns = [
      /^\+256[0-9]{9}$/, // +256xxxxxxxxx
      /^256[0-9]{9}$/, // 256xxxxxxxxx
      /^0[0-9]{9}$/, // 0xxxxxxxxx
      /^[0-9]{9}$/, // xxxxxxxxx
    ];
    return patterns.some(pattern => pattern.test(phone));
  };

  const normalizePhoneNumber = phone => {
    // Remove spaces and special characters except +
    phone = phone.replace(/[^\d+]/g, '');

    if (phone.startsWith('0')) {
      return `+256${phone.substring(1)}`;
    } else if (phone.startsWith('256')) {
      return `+${phone}`;
    } else if (!phone.startsWith('+256')) {
      return `+256${phone}`;
    }
    return phone;
  };

  const checkPhoneNumber = async (phone, method) => {
    if (!validatePhoneNumber(phone)) {
      setIsPhoneValid(false);
      return;
    }

    setPhoneCheckLoading(true);
    try {
      const normalizedPhone = normalizePhoneNumber(phone);

      const response = await fetch('/api/payments/check-phone/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          phone_number: normalizedPhone,
          payment_method: method,
        }),
      });

      const result = await response.json();
      setIsPhoneValid(result.valid);

      if (result.valid) {
        updatePaymentDetails('phone_number', normalizedPhone);
      }
    } catch (error) {
      console.error('Phone check failed:', error);
      setIsPhoneValid(false);
    } finally {
      setPhoneCheckLoading(false);
    }
  };

  const updatePaymentDetails = (key, value) => {
    setPaymentDetails(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const renderPaymentMethodCard = method => (
    <div
      key={method.payment_method}
      className={`payment-method-card ${
        paymentMethod === method.payment_method ? 'selected' : ''
      } ${!method.is_active ? 'disabled' : ''}`}
      onClick={() => {
        if (method.is_active) {
          setPaymentMethod(method.payment_method);
          setPaymentDetails({});
        }
      }}
    >
      <div className="payment-method-icon">{method.icon}</div>
      <div className="payment-method-info">
        <h4>{method.display_name}</h4>
        <p>{method.description}</p>
        <div className="payment-limits">
          Min: UGX {method.min_amount?.toLocaleString()} -{method.max_amount?.toLocaleString()}
        </div>
      </div>
      <div className="payment-method-radio">
        <input
          type="radio"
          name="payment_method"
          value={method.payment_method}
          checked={paymentMethod === method.payment_method}
          onChange={() => {}}
          disabled={!method.is_active}
        />
      </div>
    </div>
  );

  const renderMobileMoneyForm = () => (
    <div className="payment-details-form">
      <h4>Mobile Money Details</h4>

      <div className="form-group">
        <label htmlFor="phone_number">Phone Number *</label>
        <input
          type="tel"
          id="phone_number"
          value={paymentDetails.phone_number || ''}
          onChange={e => {
            const phone = e.target.value;
            updatePaymentDetails('phone_number', phone);

            // Check phone validity after user stops typing
            if (phone.length >= 9) {
              setTimeout(() => checkPhoneNumber(phone, paymentMethod), 500);
            }
          }}
          placeholder="e.g., 0712345678 or +256712345678"
          className={paymentDetails.phone_number && !isPhoneValid ? 'error' : ''}
          required
        />
        {phoneCheckLoading && <span className="loading-text">Checking phone number...</span>}
        {paymentDetails.phone_number && !phoneCheckLoading && !isPhoneValid && (
          <span className="error-message">
            Phone number is not valid for{' '}
            {paymentMethod === 'mtn_momo' ? 'MTN Mobile Money' : 'Airtel Money'}
          </span>
        )}
        {isPhoneValid && (
          <span className="success-message">
            ✓ Phone number is valid for{' '}
            {paymentMethod === 'mtn_momo' ? 'MTN Mobile Money' : 'Airtel Money'}
          </span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="customer_name">Account Name *</label>
        <input
          type="text"
          id="customer_name"
          value={paymentDetails.customer_name || ''}
          onChange={e => updatePaymentDetails('customer_name', e.target.value)}
          placeholder="Enter the name on your mobile money account"
          required
        />
        <small className="form-help">
          This should match the name registered on your mobile money account
        </small>
      </div>

      <div className="payment-instructions">
        <div className="instruction-icon">ℹ️</div>
        <div className="instruction-content">
          <h5>Payment Instructions:</h5>
          <ol>
            <li>You'll receive an SMS/USSD prompt on your phone</li>
            <li>Enter your Mobile Money PIN to authorize payment</li>
            <li>You'll receive a confirmation SMS</li>
            <li>Your order will be processed immediately</li>
          </ol>
        </div>
      </div>
    </div>
  );

  const renderCashOnDeliveryForm = () => (
    <div className="payment-details-form">
      <h4>Cash on Delivery Details</h4>

      <div className="form-group">
        <label htmlFor="delivery_phone">Delivery Contact Number *</label>
        <input
          type="tel"
          id="delivery_phone"
          value={paymentDetails.delivery_phone || ''}
          onChange={e => updatePaymentDetails('delivery_phone', e.target.value)}
          placeholder="Phone number for delivery coordination"
          required
        />
        <small className="form-help">
          Our delivery team will call this number when they arrive
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="delivery_address">Delivery Address Confirmation *</label>
        <textarea
          id="delivery_address"
          value={paymentDetails.delivery_address || ''}
          onChange={e => updatePaymentDetails('delivery_address', e.target.value)}
          placeholder="Confirm or add details to your delivery address"
          rows="3"
          required
        />
      </div>

      <div className="cod-notice">
        <div className="notice-icon">⚠️</div>
        <div className="notice-content">
          <h5>Cash on Delivery Information:</h5>
          <ul>
            <li>Payment is due when your order is delivered</li>
            <li>Please have exact change ready (UGX {totals.total.toLocaleString()})</li>
            <li>Our delivery agent will provide a receipt</li>
            <li>COD fee: No additional charges</li>
            <li>Available for orders above UGX 5,000</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const selectedMethod = paymentMethods.find(method => method.payment_method === paymentMethod);

  // Check if order amount is within payment method limits
  const isAmountValid = selectedMethod
    ? totals.total >= selectedMethod.min_amount && totals.total <= selectedMethod.max_amount
    : false;

  return (
    <div className="payment-section">
      <h2>Payment Method</h2>

      <div className="payment-methods">{paymentMethods.map(renderPaymentMethodCard)}</div>

      {paymentMethod && !isAmountValid && selectedMethod && (
        <div className="amount-error">
          <span className="error-icon">⚠️</span>
          <span>
            Order amount (UGX {totals.total.toLocaleString()}) is outside the allowed range for{' '}
            {selectedMethod.display_name}. Allowed range: UGX{' '}
            {selectedMethod.min_amount.toLocaleString()} - UGX{' '}
            {selectedMethod.max_amount.toLocaleString()}
          </span>
        </div>
      )}

      {paymentMethod && isAmountValid && (
        <div className="payment-details">
          {(paymentMethod === 'mtn_momo' || paymentMethod === 'airtel_money') &&
            renderMobileMoneyForm()}
          {paymentMethod === 'cash_on_delivery' && renderCashOnDeliveryForm()}
        </div>
      )}

      {paymentMethod && isAmountValid && (
        <div className="payment-summary">
          <h3>Payment Summary</h3>
          <div className="summary-details">
            <div className="summary-row">
              <span>Payment Method:</span>
              <span>{selectedMethod?.display_name}</span>
            </div>
            <div className="summary-row">
              <span>Amount to Pay:</span>
              <span className="amount">UGX {totals.total.toLocaleString()}</span>
            </div>
            {paymentMethod !== 'cash_on_delivery' && (
              <div className="summary-row">
                <span>Processing Fee:</span>
                <span>UGX 0</span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="btn-primary btn-large"
            onClick={onSubmit}
            disabled={isSubmitting || !validatePaymentDetails() || !isAmountValid}
          >
            {isSubmitting ? (
              <>
                <span className="loading-spinner" />
                Processing...
              </>
            ) : (
              `Complete Order - UGX ${totals.total.toLocaleString()}`
            )}
          </button>
        </div>
      )}

      <div className="payment-security">
        <div className="security-badges">
          <div className="security-badge">
            <span className="security-icon">🔒</span>
            <span>SSL Secured</span>
          </div>
          <div className="security-badge">
            <span className="security-icon">🛡️</span>
            <span>Bank Level Security</span>
          </div>
          <div className="security-badge">
            <span className="security-icon">✅</span>
            <span>Verified Merchant</span>
          </div>
        </div>
        <p className="security-text">
          Your payment information is encrypted and secure. We never store your mobile money PIN or
          financial details.
        </p>
      </div>
    </div>
  );
};

export default PaymentSection;
