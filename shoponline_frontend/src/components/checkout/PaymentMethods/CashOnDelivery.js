// src/components/checkout/PaymentMethods/CashOnDelivery.js
import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../../utils/helpers/currencyHelpers';

const CashOnDelivery = ({
  initialData,
  onChange,
  errors = {},
  customerInfo,
  addressInfo,
  orderTotal,
}) => {
  const [formData, setFormData] = useState({
    delivery_phone: '',
    delivery_notes: '',
    preferred_time: '',
    contact_preference: 'phone',
    cash_amount: '',
    needs_change: false,
    ...initialData,
  });

  const [touched, setTouched] = useState({});
  const [estimatedChange, setEstimatedChange] = useState(0);

  // Auto-populate delivery phone from customer info
  useEffect(() => {
    if (customerInfo?.phone && !formData.delivery_phone) {
      const updatedData = {
        ...formData,
        delivery_phone: customerInfo.phone,
      };
      setFormData(updatedData);
      onChange(updatedData);
    }
  }, [customerInfo]);

  // Calculate estimated change
  useEffect(() => {
    if (formData.cash_amount && orderTotal) {
      const cashAmount = parseFloat(formData.cash_amount) || 0;
      const change = Math.max(0, cashAmount - orderTotal);
      setEstimatedChange(change);
    } else {
      setEstimatedChange(0);
    }
  }, [formData.cash_amount, orderTotal]);

  const preferredTimes = [
    { value: '', label: 'Any time' },
    { value: 'morning', label: 'Morning (8AM - 12PM)' },
    { value: 'afternoon', label: 'Afternoon (12PM - 5PM)' },
    { value: 'evening', label: 'Evening (5PM - 8PM)' },
    { value: 'weekend', label: 'Weekends only' },
  ];

  const contactPreferences = [
    { value: 'phone', label: 'Phone call', icon: 'fas fa-phone' },
    { value: 'sms', label: 'SMS/Text message', icon: 'fas fa-sms' },
    { value: 'both', label: 'Phone call and SMS', icon: 'fas fa-comments' },
  ];

  const validateField = (name, value) => {
    switch (name) {
      case 'delivery_phone':
        if (!value || !value.trim()) {
          return 'Delivery phone number is required';
        }
        const phoneRegex = /^(\+?256|0)[0-9]{9}$/;
        const cleanPhone = value.replace(/[\s\-()]/g, '');
        if (!phoneRegex.test(cleanPhone)) {
          return 'Please enter a valid Ugandan phone number';
        }
        return '';

      case 'cash_amount':
        if (formData.needs_change) {
          if (!value || !value.trim()) {
            return "Please specify the cash amount you'll pay with";
          }
          const amount = parseFloat(value);
          if (isNaN(amount) || amount <= 0) {
            return 'Please enter a valid amount';
          }
          if (amount < orderTotal) {
            return `Cash amount must be at least ${formatCurrency(orderTotal)}`;
          }
          if (amount > orderTotal * 5) {
            return 'Cash amount seems too high. Please confirm the amount.';
          }
        }
        return '';

      default:
        return '';
    }
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    const updatedValue = type === 'checkbox' ? checked : value;

    const updatedData = {
      ...formData,
      [name]: updatedValue,
    };

    // Reset cash amount if needs_change is unchecked
    if (name === 'needs_change' && !checked) {
      updatedData.cash_amount = '';
    }

    setFormData(updatedData);
    onChange(updatedData);
  };

  const handleBlur = e => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));
  };

  const formatPhoneNumber = phone => {
    if (!phone) return '';
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

  const getFieldClassName = fieldName => {
    let className = 'form-input';
    if (errors[fieldName]) {
      className += ' error';
    } else if (touched[fieldName] && formData[fieldName]) {
      className += ' success';
    }
    return className;
  };

  const getSuggestedAmounts = () => {
    if (!orderTotal) return [];

    const roundedTotal = Math.ceil(orderTotal / 1000) * 1000; // Round up to nearest 1000
    return [
      orderTotal, // Exact amount
      roundedTotal, // Rounded amount
      roundedTotal + 5000, // +5000
      roundedTotal + 10000, // +10000
    ].filter((amount, index, arr) => arr.indexOf(amount) === index); // Remove duplicates
  };

  return (
    <div className="cash-on-delivery-form">
      <div className="cod-header">
        <div className="cod-icon">
          <i className="fas fa-money-bill-wave" />
        </div>
        <div className="cod-info">
          <h4>Cash on Delivery</h4>
          <p>Pay with cash when your order is delivered to your doorstep</p>
        </div>
      </div>

      <div className="delivery-summary">
        <h5>Delivery Information</h5>
        <div className="summary-content">
          <div className="summary-item">
            <i className="fas fa-map-marker-alt" />
            <div>
              <strong>Delivery Address:</strong>
              <p>
                {addressInfo?.address_line_1}
                {addressInfo?.address_line_2 && <>, {addressInfo.address_line_2}</>}
                <br />
                {addressInfo?.city}, {addressInfo?.district}
                {addressInfo?.postal_code && <> {addressInfo.postal_code}</>}
              </p>
            </div>
          </div>

          <div className="summary-item">
            <i className="fas fa-money-bill" />
            <div>
              <strong>Amount to Pay:</strong>
              <p className="amount-highlight">{formatCurrency(orderTotal)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-group">
          <label htmlFor="delivery_phone" className="form-label">
            Delivery Contact Phone *
          </label>
          <div className="input-with-icon">
            <i className="fas fa-phone input-icon" />
            <input
              type="tel"
              id="delivery_phone"
              name="delivery_phone"
              value={formData.delivery_phone}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getFieldClassName('delivery_phone')}
              placeholder="+256 700 000 000"
              autoComplete="tel"
            />
          </div>
          {errors.delivery_phone && (
            <div className="form-error">
              <i className="fas fa-exclamation-triangle" />
              {errors.delivery_phone}
            </div>
          )}
          <div className="form-hint">
            <i className="fas fa-info-circle" />
            Our delivery team will call this number before delivery
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Contact Preference</label>
          <div className="radio-group">
            {contactPreferences.map(preference => (
              <label key={preference.value} className="radio-label">
                <input
                  type="radio"
                  name="contact_preference"
                  value={preference.value}
                  checked={formData.contact_preference === preference.value}
                  onChange={handleChange}
                />
                <span className="radio-custom" />
                <span className="radio-text">
                  <i className={preference.icon} />
                  {preference.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="preferred_time" className="form-label">
            Preferred Delivery Time
          </label>
          <select
            id="preferred_time"
            name="preferred_time"
            value={formData.preferred_time}
            onChange={handleChange}
            className="form-select"
          >
            {preferredTimes.map(time => (
              <option key={time.value} value={time.value}>
                {time.label}
              </option>
            ))}
          </select>
          <div className="form-hint">
            <i className="fas fa-clock" />
            We'll try to deliver within your preferred time frame
          </div>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="needs_change"
              checked={formData.needs_change}
              onChange={handleChange}
            />
            <span className="checkmark" />
            <span className="checkbox-text">I'll need change (paying with larger bills)</span>
          </label>
        </div>

        {formData.needs_change && (
          <div className="cash-amount-section">
            <div className="form-group">
              <label htmlFor="cash_amount" className="form-label">
                Cash Amount You'll Pay With *
              </label>
              <div className="input-with-icon">
                <span className="currency-symbol">UGX</span>
                <input
                  type="number"
                  id="cash_amount"
                  name="cash_amount"
                  value={formData.cash_amount}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getFieldClassName('cash_amount')}
                  placeholder="0"
                  min={orderTotal}
                  step="1000"
                />
              </div>
              {errors.cash_amount && (
                <div className="form-error">
                  <i className="fas fa-exclamation-triangle" />
                  {errors.cash_amount}
                </div>
              )}

              {estimatedChange > 0 && (
                <div className="change-calculation">
                  <div className="change-info">
                    <i className="fas fa-calculator" />
                    <span>
                      Change to give: <strong>{formatCurrency(estimatedChange)}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="suggested-amounts">
              <label className="form-label">Quick Select Amount:</label>
              <div className="amount-buttons">
                {getSuggestedAmounts().map(amount => (
                  <button
                    key={amount}
                    type="button"
                    className={`amount-btn ${formData.cash_amount == amount ? 'selected' : ''}`}
                    onClick={() =>
                      handleChange({
                        target: { name: 'cash_amount', value: amount.toString() },
                      })
                    }
                  >
                    {formatCurrency(amount)}
                    {amount === orderTotal && <span className="exact-label">Exact</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="delivery_notes" className="form-label">
            Special Delivery Instructions (Optional)
          </label>
          <textarea
            id="delivery_notes"
            name="delivery_notes"
            value={formData.delivery_notes}
            onChange={handleChange}
            className="form-textarea"
            placeholder="Any special instructions for our delivery team (e.g., gate code, apartment number, best time to call, etc.)"
            rows="3"
            maxLength="500"
          />
          <div className="character-count">{formData.delivery_notes.length}/500 characters</div>
        </div>
      </div>

      <div className="cod-process">
        <h5>How Cash on Delivery Works</h5>
        <div className="process-steps">
          <div className="process-step">
            <div className="step-icon">
              <i className="fas fa-shopping-cart" />
            </div>
            <div className="step-content">
              <strong>1. Order Confirmed</strong>
              <p>Your order is confirmed and prepared for delivery</p>
            </div>
          </div>

          <div className="process-step">
            <div className="step-icon">
              <i className="fas fa-phone" />
            </div>
            <div className="step-content">
              <strong>2. Delivery Call</strong>
              <p>Our delivery team will call you before arriving</p>
            </div>
          </div>

          <div className="process-step">
            <div className="step-icon">
              <i className="fas fa-truck" />
            </div>
            <div className="step-content">
              <strong>3. Delivery Arrives</strong>
              <p>Your order is delivered to your specified address</p>
            </div>
          </div>

          <div className="process-step">
            <div className="step-icon">
              <i className="fas fa-money-bill" />
            </div>
            <div className="step-content">
              <strong>4. Pay with Cash</strong>
              <p>Pay the exact amount or receive change if needed</p>
            </div>
          </div>
        </div>
      </div>

      <div className="cod-terms">
        <div className="terms-content">
          <h6>Cash on Delivery Terms:</h6>
          <ul>
            <li>Payment must be made in Ugandan Shillings (UGX)</li>
            <li>Please have the exact amount or inform us if you need change</li>
            <li>Delivery team will verify your identity before handover</li>
            <li>If you're not available, we'll attempt redelivery once</li>
            <li>Orders may be cancelled if payment cannot be collected after 2 attempts</li>
          </ul>
        </div>
      </div>

      <div className="security-notice">
        <div className="notice-content">
          <i className="fas fa-shield-alt" />
          <div className="notice-text">
            <strong>Security Note:</strong> Our delivery personnel carry official identification and
            will provide order confirmation details before collection.
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashOnDelivery;
