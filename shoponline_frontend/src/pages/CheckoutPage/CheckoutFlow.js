import React from 'react';

const CheckoutFlow = ({
  currentStep,
  onStepChange,
  customerInfo,
  onCustomerInfoChange,
  deliveryInfo,
  onDeliveryInfoChange,
  ugandaDistricts,
  validateStep,
}) => {
  const steps = [
    { number: 1, title: 'Customer Information', icon: '👤' },
    { number: 2, title: 'Delivery Address', icon: '📍' },
    { number: 3, title: 'Payment Method', icon: '💳' },
  ];

  const validatePhoneNumber = phone => {
    const patterns = [
      /^\+256[0-9]{9}$/, // +256xxxxxxxxx
      /^256[0-9]{9}$/, // 256xxxxxxxxx
      /^0[0-9]{9}$/, // 0xxxxxxxxx
      /^[0-9]{9}$/, // xxxxxxxxx
    ];
    return patterns.some(pattern => pattern.test(phone));
  };

  const validateEmail = email => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const renderStepIndicator = () => (
    <div className="checkout-steps">
      {steps.map(step => (
        <div
          key={step.number}
          className={`step ${currentStep === step.number ? 'active' : ''} ${
            currentStep > step.number ? 'completed' : ''
          }`}
          onClick={() => {
            if (currentStep > step.number || validateStep(step.number - 1)) {
              onStepChange(step.number);
            }
          }}
        >
          <div className="step-icon">{currentStep > step.number ? '✓' : step.icon}</div>
          <div className="step-title">{step.title}</div>
        </div>
      ))}
    </div>
  );

  const renderCustomerInfo = () => (
    <div className="checkout-step customer-info">
      <h2>Customer Information</h2>
      <div className="form-group-row">
        <div className="form-group">
          <label htmlFor="first_name">First Name *</label>
          <input
            type="text"
            id="first_name"
            value={customerInfo.first_name}
            onChange={e => onCustomerInfoChange('first_name', e.target.value)}
            placeholder="Enter your first name"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="last_name">Last Name *</label>
          <input
            type="text"
            id="last_name"
            value={customerInfo.last_name}
            onChange={e => onCustomerInfoChange('last_name', e.target.value)}
            placeholder="Enter your last name"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="email">Email Address *</label>
        <input
          type="email"
          id="email"
          value={customerInfo.email}
          onChange={e => onCustomerInfoChange('email', e.target.value)}
          placeholder="Enter your email address"
          className={customerInfo.email && !validateEmail(customerInfo.email) ? 'error' : ''}
          required
        />
        {customerInfo.email && !validateEmail(customerInfo.email) && (
          <span className="error-message">Please enter a valid email address</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="phone">Phone Number *</label>
        <input
          type="tel"
          id="phone"
          value={customerInfo.phone}
          onChange={e => onCustomerInfoChange('phone', e.target.value)}
          placeholder="e.g., 0712345678 or +256712345678"
          className={customerInfo.phone && !validatePhoneNumber(customerInfo.phone) ? 'error' : ''}
          required
        />
        {customerInfo.phone && !validatePhoneNumber(customerInfo.phone) && (
          <span className="error-message">
            Please enter a valid Uganda phone number (e.g., 0712345678 or +256712345678)
          </span>
        )}
        <small className="form-help">We'll use this number to contact you about your order</small>
      </div>
    </div>
  );

  const renderDeliveryInfo = () => (
    <div className="checkout-step delivery-info">
      <h2>Delivery Address</h2>

      <div className="form-group">
        <label htmlFor="address_line_1">Street Address *</label>
        <input
          type="text"
          id="address_line_1"
          value={deliveryInfo.address_line_1}
          onChange={e => onDeliveryInfoChange('address_line_1', e.target.value)}
          placeholder="Enter your street address"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="address_line_2">Apartment, Suite, etc. (Optional)</label>
        <input
          type="text"
          id="address_line_2"
          value={deliveryInfo.address_line_2}
          onChange={e => onDeliveryInfoChange('address_line_2', e.target.value)}
          placeholder="Apartment, suite, unit, building, floor, etc."
        />
      </div>

      <div className="form-group-row">
        <div className="form-group">
          <label htmlFor="city">City *</label>
          <input
            type="text"
            id="city"
            value={deliveryInfo.city}
            onChange={e => onDeliveryInfoChange('city', e.target.value)}
            placeholder="Enter city"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="district">District *</label>
          <select
            id="district"
            value={deliveryInfo.district}
            onChange={e => onDeliveryInfoChange('district', e.target.value)}
            required
          >
            <option value="">Select District</option>
            {ugandaDistricts.map(district => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="postal_code">Postal Code (Optional)</label>
        <input
          type="text"
          id="postal_code"
          value={deliveryInfo.postal_code}
          onChange={e => onDeliveryInfoChange('postal_code', e.target.value)}
          placeholder="Enter postal code"
        />
      </div>

      <div className="form-group">
        <label htmlFor="delivery_notes">Delivery Notes (Optional)</label>
        <textarea
          id="delivery_notes"
          value={deliveryInfo.delivery_notes}
          onChange={e => onDeliveryInfoChange('delivery_notes', e.target.value)}
          placeholder="Any special delivery instructions (e.g., gate code, landmarks, preferred delivery time)"
          rows="3"
        />
        <small className="form-help">Help our delivery team find you easily</small>
      </div>

      <div className="delivery-info-notice">
        <div className="notice-icon">📦</div>
        <div className="notice-content">
          <h4>Delivery Information</h4>
          <ul>
            <li>Standard delivery fee: UGX 10,000</li>
            <li>Delivery within Kampala: 1-2 business days</li>
            <li>Other districts: 2-5 business days</li>
            <li>We deliver Monday to Saturday, 9 AM - 6 PM</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderStepNavigation = () => (
    <div className="step-navigation">
      {currentStep > 1 && (
        <button
          type="button"
          className="btn-secondary"
          onClick={() => onStepChange(currentStep - 1)}
        >
          ← Previous
        </button>
      )}

      {currentStep < 3 && (
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            if (validateStep(currentStep)) {
              onStepChange(currentStep + 1);
            } else {
              alert('Please fill in all required fields before continuing.');
            }
          }}
        >
          Next →
        </button>
      )}
    </div>
  );

  return (
    <div className="checkout-flow">
      {renderStepIndicator()}

      <div className="checkout-step-content">
        {currentStep === 1 && renderCustomerInfo()}
        {currentStep === 2 && renderDeliveryInfo()}

        {currentStep < 3 && renderStepNavigation()}
      </div>
    </div>
  );
};

export default CheckoutFlow;
