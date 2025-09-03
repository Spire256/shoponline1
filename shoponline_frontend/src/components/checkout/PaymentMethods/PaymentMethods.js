// src/components/checkout/PaymentMethods/PaymentMethods.js
import React, { useState, useEffect } from 'react';
import { CreditCard, Smartphone, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import paymentsAPI from '../../../services/api/paymentsAPI';
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
  const [mtnConfig, setMtnConfig] = useState(null);

  useEffect(() => {
    fetchPaymentMethods();
    initializeMTNConfig();
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

  const initializeMTNConfig = () => {
    // Get MTN configuration from environment variables
    const config = paymentsAPI.getMTNConfig();
    setMtnConfig(config);
    
    // Log configuration status for debugging
    if (process.env.REACT_APP_DEBUG === 'true') {
      console.log('MTN Configuration:', {
        enabled: config.enabled,
        hasSubscriptionKey: !!config.subscriptionKey,
        environment: config.targetEnvironment,
        baseURL: config.baseURL,
      });
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await paymentsAPI.getPaymentMethods();
      if (response.success) {
        // Filter payment methods based on configuration
        let filteredMethods = response.data;
        
        // Only show MTN if properly configured
        if (!paymentsAPI.isMTNConfigured()) {
          filteredMethods = filteredMethods.filter(method => method.payment_method !== 'mtn_momo');
        }
        
        setPaymentConfigs(filteredMethods);
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
      
      // Use the payment method specific validation
      const response = await paymentsAPI.checkPhoneNumber(phone, method);

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

    // Check if MTN is properly configured
    if (method.payment_method === 'mtn_momo' && !paymentsAPI.isMTNConfigured()) {
      return false;
    }

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

  const renderMTNSpecificInfo = () => {
    if (selectedMethod !== 'mtn_momo') return null;

    return (
      <div className="mtn-specific-info">
        <div className="info-card">
          <div className="info-header">
            <i className="fas fa-info-circle" />
            <h5>MTN Mobile Money Tips</h5>
          </div>
          <div className="info-content">
            <ul>
              <li>Ensure you have enough balance for the transaction</li>
              <li>Keep your phone nearby to receive the payment prompt</li>
              <li>The payment request expires after 5 minutes</li>
              <li>
                You can also dial <strong>*165#</strong> to check your balance
              </li>
            </ul>
          </div>
        </div>

        {/* Show MTN configuration status in development */}
        {process.env.REACT_APP_DEBUG === 'true' && mtnConfig && (
          <div className="debug-info">
            <details>
              <summary>MTN Configuration Status (Debug)</summary>
              <div className="config-details">
                <p><strong>Environment:</strong> {mtnConfig.targetEnvironment}</p>
                <p><strong>Base URL:</strong> {mtnConfig.baseURL}</p>
                <p><strong>Subscription Key:</strong> {mtnConfig.subscriptionKey ? 
                  `${mtnConfig.subscriptionKey.substring(0, 8)}...` : 'Not configured'}</p>
                <p><strong>Service Enabled:</strong> {mtnConfig.enabled ? 'Yes' : 'No'}</p>
              </div>
            </details>
          </div>
        )}

        <div className="troubleshooting">
          <details>
            <summary>Having payment issues?</summary>
            <div className="troubleshooting-content">
              <h6>Common solutions:</h6>
              <ul>
                <li>
                  <strong>No payment prompt received:</strong> Check if your phone has network
                  coverage and restart if necessary
                </li>
                <li>
                  <strong>Payment failed:</strong> Verify you have sufficient balance and try again
                </li>
                <li>
                  <strong>PIN issues:</strong> Make sure you're using your correct MTN Mobile Money
                  PIN
                </li>
                <li>
                  <strong>Account blocked:</strong> Contact MTN customer service on 100 or visit an
                  MTN service center
                </li>
              </ul>

              <div className="contact-mtn">
                <h6>Need help from MTN?</h6>
                <div className="contact-options">
                  <div className="contact-option">
                    <i className="fas fa-phone" />
                    <span>Call: 100 (toll-free from MTN line)</span>
                  </div>
                  <div className="contact-option">
                    <i className="fas fa-code" />
                    <span>USSD: *165# for Mobile Money menu</span>
                  </div>
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
    );
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

      {/* Render MTN-specific information */}
      {renderMTNSpecificInfo()}
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
          const isMTN = config.payment_method === 'mtn_momo';

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
                    <h4>
                      {config.display_name}
                      {/* Show sandbox indicator for MTN in development */}
                      {isMTN && process.env.REACT_APP_DEBUG === 'true' && mtnConfig?.targetEnvironment === 'sandbox' && (
                        <span className="sandbox-badge">Sandbox</span>
                      )}
                    </h4>
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
                    {isMTN && !paymentsAPI.isMTNConfigured() ? (
                      'MTN Mobile Money is not properly configured'
                    ) : (
                      <>
                        Amount must be between {formatCurrency(config.min_amount)}
                        and {formatCurrency(config.max_amount)}
                      </>
                    )}
                  </span>
                </div>
              )}

              {/* Show MTN configuration warning in development */}
              {isMTN && isSelected && process.env.REACT_APP_DEBUG === 'true' && (
                <div className="mtn-config-status">
                  {paymentsAPI.isMTNConfigured() ? (
                    <div className="config-success">
                      <CheckCircle size={16} />
                      <span>MTN configuration verified</span>
                    </div>
                  ) : (
                    <div className="config-warning">
                      <AlertCircle size={16} />
                      <span>MTN configuration incomplete</span>
                    </div>
                  )}
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

      {/* MTN Service Status Display (Development only) */}
      {process.env.REACT_APP_DEBUG === 'true' && selectedMethod === 'mtn_momo' && mtnConfig && (
        <div className="mtn-debug-panel">
          <details>
            <summary>MTN Service Information (Debug)</summary>
            <div className="debug-content">
              <table className="debug-table">
                <tbody>
                  <tr>
                    <td>Service Status:</td>
                    <td className={mtnConfig.enabled ? 'status-enabled' : 'status-disabled'}>
                      {mtnConfig.enabled ? 'Enabled' : 'Disabled'}
                    </td>
                  </tr>
                  <tr>
                    <td>Environment:</td>
                    <td>{mtnConfig.targetEnvironment}</td>
                  </tr>
                  <tr>
                    <td>Base URL:</td>
                    <td>{mtnConfig.baseURL}</td>
                  </tr>
                  <tr>
                    <td>Subscription Key:</td>
                    <td>{mtnConfig.subscriptionKey ? 
                      `${mtnConfig.subscriptionKey.substring(0, 8)}...${mtnConfig.subscriptionKey.substring(-4)}` : 
                      'Not configured'}</td>
                  </tr>
                  <tr>
                    <td>Secondary Key:</td>
                    <td>{mtnConfig.secondaryKey ? 
                      `${mtnConfig.secondaryKey.substring(0, 8)}...${mtnConfig.secondaryKey.substring(-4)}` : 
                      'Not configured'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default PaymentMethods;