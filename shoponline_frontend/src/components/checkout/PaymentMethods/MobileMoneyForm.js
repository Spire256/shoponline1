// src/components/checkout/PaymentMethods/MobileMoneyForm.js
import React, { useState, useEffect } from 'react';
import { paymentsAPI } from '../../../services/api/paymentsAPI';

const MobileMoneyForm = ({
  initialData,
  onChange,
  errors = {},
  customerInfo,
  orderTotal,
  provider, // 'mtn' or 'airtel'
}) => {
  const [formData, setFormData] = useState({
    phone_number: '',
    customer_name: '',
    ...initialData,
  });

  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [touched, setTouched] = useState({});

  // Auto-populate customer name from customerInfo
  useEffect(() => {
    if (customerInfo && !formData.customer_name) {
      const fullName = `${customerInfo.first_name} ${customerInfo.last_name}`.trim();
      const updatedData = {
        ...formData,
        customer_name: fullName,
      };
      setFormData(updatedData);
      onChange(updatedData);
    }
  }, [customerInfo]);

  // Auto-populate phone from customerInfo if available
  useEffect(() => {
    if (customerInfo?.phone && !formData.phone_number) {
      const updatedData = {
        ...formData,
        phone_number: customerInfo.phone,
      };
      setFormData(updatedData);
      onChange(updatedData);
    }
  }, [customerInfo]);

  const validatePhoneNumber = phone => {
    if (!phone || !phone.trim()) {
      return 'Phone number is required';
    }

    // Uganda phone number validation
    const phoneRegex = /^(\+?256|0)[0-9]{9}$/;
    const cleanPhone = phone.replace(/[\s\-()]/g, '');

    if (!phoneRegex.test(cleanPhone)) {
      return 'Please enter a valid Ugandan phone number (e.g., +256700000000 or 0700000000)';
    }

    // Provider-specific validation
    if (provider === 'mtn') {
      // MTN prefixes: 077, 078, 076, 039
      const mtnPrefixes = ['077', '078', '076', '039'];
      const phoneStart = cleanPhone.startsWith('0')
        ? cleanPhone.substring(1, 4)
        : cleanPhone.startsWith('+256') ? cleanPhone.substring(4, 7)
        : cleanPhone.startsWith('256') ? cleanPhone.substring(3, 6) : '';

      if (!mtnPrefixes.includes(phoneStart)) {
        return 'Please enter an MTN phone number (077, 078, 076, or 039)';
      }
    } else if (provider === 'airtel') {
      // Airtel prefixes: 070, 075, 074
      const airtelPrefixes = ['070', '075', '074'];
      const phoneStart = cleanPhone.startsWith('0')
        ? cleanPhone.substring(1, 4)
        : cleanPhone.startsWith('+256') ? cleanPhone.substring(4, 7)
        : cleanPhone.startsWith('256') ? cleanPhone.substring(3, 6) : '';

      if (!airtelPrefixes.includes(phoneStart)) {
        return 'Please enter an Airtel phone number (070, 075, or 074)';
      }
    }

    return '';
  };

  const validateCustomerName = name => {
    if (!name || !name.trim()) {
      return 'Customer name is required';
    }
    if (name.trim().length < 2) {
      return 'Customer name must be at least 2 characters';
    }
    return '';
  };

  const formatPhoneNumber = phone => {
    const cleanPhone = phone.replace(/[\s\-()]/g, '');

    if (cleanPhone.startsWith('+256')) {
      return cleanPhone;
    } else if (cleanPhone.startsWith('256')) {
      return `+${cleanPhone}`;
    } else if (cleanPhone.startsWith('0')) {
      return `+256${cleanPhone.substring(1)}`;
    } else {
      return `+256${cleanPhone}`;
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    const updatedData = {
      ...formData,
      [name]: value,
    };

    setFormData(updatedData);
    onChange(updatedData);

    // Clear validation result when phone changes
    if (name === 'phone_number') {
      setValidationResult(null);
    }
  };

  const handleBlur = e => {
    const { name, value } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));

    // Auto-validate phone number on blur
    if (name === 'phone_number' && value && !validatePhoneNumber(value)) {
      handleValidatePhone();
    }
  };

  const handleValidatePhone = async () => {
    const phoneError = validatePhoneNumber(formData.phone_number);
    if (phoneError) {
      setValidationResult({
        valid: false,
        message: phoneError,
      });
      return;
    }

    try {
      setValidating(true);
      const formattedPhone = formatPhoneNumber(formData.phone_number);

      const response = await paymentsAPI.checkPhoneNumber({
        phone_number: formattedPhone,
        payment_method: provider === 'mtn' ? 'mtn_momo' : 'airtel_money',
      });

      setValidationResult({
        valid: response.valid,
        message: response.message,
        details: response.details,
      });
    } catch (error) {
      setValidationResult({
        valid: false,
        message: 'Unable to validate phone number. Please try again.',
        error: true,
      });
    } finally {
      setValidating(false);
    }
  };

  const getFieldClassName = fieldName => {
    let className = 'form-input';

    if (errors[fieldName]) {
      className += ' error';
    } else if (fieldName === 'phone_number' && validationResult) {
      className += validationResult.valid ? ' success' : ' error';
    } else if (touched[fieldName] && formData[fieldName]) {
      className += ' success';
    }

    return className;
  };

  const getProviderName = () => {
    return provider === 'mtn' ? 'MTN Mobile Money' : 'Airtel Money';
  };

  const getProviderIcon = () => {
    return provider === 'mtn' ? '/images/payment/mtn-logo.png' : '/images/payment/airtel-logo.png';
  };

  const getPhoneExamples = () => {
    if (provider === 'mtn') {
      return '+256 77X XXX XXX, +256 78X XXX XXX';
    } else {
      return '+256 70X XXX XXX, +256 75X XXX XXX';
    }
  };

  return (
    <div className="mobile-money-form">
      <div className="provider-header">
        <img src={getProviderIcon()} alt={getProviderName()} className="provider-logo" />
        <div className="provider-info">
          <h4>{getProviderName()}</h4>
          <p>Enter your mobile money details to complete payment</p>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="phone_number" className="form-label">
          {getProviderName()} Phone Number *
        </label>
        <div className="input-with-icon">
          <i className="fas fa-mobile-alt input-icon" />
          <input
            type="tel"
            id="phone_number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            onBlur={handleBlur}
            className={getFieldClassName('phone_number')}
            placeholder={`e.g., ${getPhoneExamples()}`}
            autoComplete="tel"
          />
          {validating && (
            <div className="input-validation-spinner">
              <div className="spinner-small" />
            </div>
          )}
        </div>

        {errors.phone_number && (
          <div className="form-error">
            <i className="fas fa-exclamation-triangle" />
            {errors.phone_number}
          </div>
        )}

        {validationResult && !errors.phone_number && (
          <div className={`form-validation ${validationResult.valid ? 'success' : 'error'}`}>
            <i
              className={`fas fa-${
                validationResult.valid ? 'check-circle' : 'exclamation-triangle'
              }`}
            ></i>
            {validationResult.message}
          </div>
        )}

        <div className="form-hint">
          <i className="fas fa-info-circle" />
          Make sure you have sufficient balance and your phone is switched on
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="customer_name" className="form-label">
          Account Holder Name *
        </label>
        <div className="input-with-icon">
          <i className="fas fa-user input-icon" />
          <input
            type="text"
            id="customer_name"
            name="customer_name"
            value={formData.customer_name}
            onChange={handleChange}
            onBlur={handleBlur}
            className={getFieldClassName('customer_name')}
            placeholder="Name as registered on your mobile money account"
            autoComplete="name"
          />
        </div>

        {errors.customer_name && (
          <div className="form-error">
            <i className="fas fa-exclamation-triangle" />
            {errors.customer_name}
          </div>
        )}

        <div className="form-hint">
          <i className="fas fa-info-circle" />
          This should match the name on your {getProviderName()} account
        </div>
      </div>

      {/* Payment instructions */}
      <div className="payment-instructions">
        <h5>How to complete your payment:</h5>
        <div className="instruction-steps">
          {provider === 'mtn' ? (
            <>
              <div className="step">
                <span className="step-number">1</span>
                <div className="step-content">
                  <strong>Wait for USSD prompt:</strong> You'll receive a payment request on your
                  phone
                </div>
              </div>
              <div className="step">
                <span className="step-number">2</span>
                <div className="step-content">
                  <strong>Enter PIN:</strong> Enter your MTN Mobile Money PIN to approve
                </div>
              </div>
              <div className="step">
                <span className="step-number">3</span>
                <div className="step-content">
                  <strong>Confirmation:</strong> You'll receive a confirmation SMS
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="step">
                <span className="step-number">1</span>
                <div className="step-content">
                  <strong>Payment request:</strong> You'll receive a payment request notification
                </div>
              </div>
              <div className="step">
                <span className="step-number">2</span>
                <div className="step-content">
                  <strong>Approve payment:</strong> Open the notification and enter your Airtel
                  Money PIN
                </div>
              </div>
              <div className="step">
                <span className="step-number">3</span>
                <div className="step-content">
                  <strong>Success:</strong> Payment confirmation will be sent to you
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payment summary */}
      <div className="payment-summary">
        <div className="summary-row">
          <span>Payment Method:</span>
          <strong>{getProviderName()}</strong>
        </div>
        <div className="summary-row">
          <span>Amount to Pay:</span>
          <strong>UGX {orderTotal?.toLocaleString()}</strong>
        </div>
        {formData.phone_number && (
          <div className="summary-row">
            <span>From Phone:</span>
            <strong>{formatPhoneNumber(formData.phone_number)}</strong>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileMoneyForm;