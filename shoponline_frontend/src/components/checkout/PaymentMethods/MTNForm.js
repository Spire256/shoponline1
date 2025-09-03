// src/components/checkout/PaymentMethods/MTNForm.js
import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Smartphone, Info } from 'lucide-react';
import { mtnService } from '../../../services/payment/mtnService';
import paymentsAPI from '../../../services/api/paymentsAPI';
import MobileMoneyForm from './MobileMoneyForm';

const MTNForm = ({ initialData, onChange, errors, customerInfo, orderTotal }) => {
  const [mtnConfig, setMtnConfig] = useState(null);
  const [serviceStatus, setServiceStatus] = useState({ checking: false, status: 'unknown' });
  const [phoneValidation, setPhoneValidation] = useState({ isValid: false, message: '', checking: false });

  useEffect(() => {
    initializeMTNConfig();
    checkMTNServiceStatus();
  }, []);

  useEffect(() => {
    // Validate phone number when it changes
    if (initialData?.phone_number && initialData.phone_number.length >= 10) {
      validateMTNPhoneNumber(initialData.phone_number);
    }
  }, [initialData?.phone_number]);

  const initializeMTNConfig = () => {
    const config = paymentsAPI.getMTNConfig();
    setMtnConfig(config);
    
    // Log configuration for debugging
    if (process.env.REACT_APP_DEBUG === 'true') {
      console.log('MTN Form Configuration:', {
        enabled: config.enabled,
        environment: config.targetEnvironment,
        hasSubscriptionKey: !!config.subscriptionKey,
        subscriptionKeyPreview: config.subscriptionKey ? 
          `${config.subscriptionKey.substring(0, 8)}...` : 'Not configured'
      });
    }
  };

  const checkMTNServiceStatus = async () => {
    if (!mtnService.isEnabled()) {
      setServiceStatus({ checking: false, status: 'disabled', message: 'MTN service is disabled' });
      return;
    }

    try {
      setServiceStatus({ checking: true, status: 'checking' });
      const result = await mtnService.checkServiceStatus();
      
      setServiceStatus({
        checking: false,
        status: result.success ? 'active' : 'error',
        message: result.message || (result.success ? 'Service is active' : 'Service check failed'),
        lastChecked: new Date().toISOString()
      });
    } catch (error) {
      setServiceStatus({
        checking: false,
        status: 'error',
        message: 'Unable to check service status',
        error: error.message
      });
    }
  };

  const validateMTNPhoneNumber = async (phoneNumber) => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setPhoneValidation({ isValid: false, message: '', checking: false });
      return;
    }

    try {
      setPhoneValidation({ isValid: false, message: 'Validating...', checking: true });
      
      const result = await mtnService.checkMTNPhoneNumber(phoneNumber);
      
      setPhoneValidation({
        isValid: result.isValid,
        message: result.message || (result.isValid ? 'Valid MTN number' : 'Invalid MTN number'),
        checking: false,
        provider: result.provider
      });
    } catch (error) {
      setPhoneValidation({
        isValid: false,
        message: 'Unable to validate phone number',
        checking: false,
        error: error.message
      });
    }
  };

  const handleFormChange = (data) => {
    // Add MTN-specific validation and formatting
    if (data.phone_number) {
      data.phone_number = mtnService.formatPhoneNumber(data.phone_number);
      
      // Validate MTN number format
      if (!mtnService.isValidMTNNumber(data.phone_number)) {
        data._validation_errors = {
          ...data._validation_errors,
          phone_number: 'Please enter a valid MTN phone number (077xxxxxxx, 078xxxxxxx, or 039xxxxxxx)'
        };
      }
    }

    onChange(data);
  };

  const renderMTNConfigurationStatus = () => {
    if (process.env.REACT_APP_DEBUG !== 'true') return null;

    return (
      <div className="mtn-config-status debug-panel">
        <details>
          <summary>
            <Info size={16} />
            MTN Configuration Status (Debug Mode)
          </summary>
          <div className="config-details">
            <div className="config-item">
              <span className="config-label">Service Enabled:</span>
              <span className={`config-value ${mtnConfig?.enabled ? 'success' : 'error'}`}>
                {mtnConfig?.enabled ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="config-item">
              <span className="config-label">Environment:</span>
              <span className="config-value">{mtnConfig?.targetEnvironment || 'Not set'}</span>
            </div>
            <div className="config-item">
              <span className="config-label">Base URL:</span>
              <span className="config-value">{mtnConfig?.baseURL || 'Not set'}</span>
            </div>
            <div className="config-item">
              <span className="config-label">Subscription Key:</span>
              <span className={`config-value ${mtnConfig?.subscriptionKey ? 'success' : 'error'}`}>
                {mtnConfig?.subscriptionKey ? 
                  `${mtnConfig.subscriptionKey.substring(0, 8)}...${mtnConfig.subscriptionKey.slice(-4)}` : 
                  'Not configured'}
              </span>
            </div>
            <div className="config-item">
              <span className="config-label">Secondary Key:</span>
              <span className={`config-value ${mtnConfig?.secondaryKey ? 'success' : 'warning'}`}>
                {mtnConfig?.secondaryKey ? 
                  `${mtnConfig.secondaryKey.substring(0, 8)}...${mtnConfig.secondaryKey.slice(-4)}` : 
                  'Not configured'}
              </span>
            </div>
            <div className="config-item">
              <span className="config-label">Service Status:</span>
              <span className={`config-value ${
                serviceStatus.status === 'active' ? 'success' : 
                serviceStatus.status === 'checking' ? 'warning' : 'error'
              }`}>
                {serviceStatus.checking ? 'Checking...' : serviceStatus.message}
              </span>
            </div>
          </div>
        </details>
      </div>
    );
  };

  const renderMTNSpecificInfo = () => (
    <div className="mtn-specific-info">
      <div className="info-card">
        <div className="info-header">
          <Smartphone className="mtn-icon" />
          <h5>MTN Mobile Money Payment</h5>
        </div>
        <div className="info-content">
          <div className="payment-instructions">
            <h6>How to complete your payment:</h6>
            <ol>
              <li>Enter your MTN phone number below</li>
              <li>Click "Place Order" to initiate payment</li>
              <li>You'll receive a payment prompt on your phone</li>
              <li>Enter your MTN Mobile Money PIN to confirm</li>
              <li>Wait for payment confirmation</li>
            </ol>
          </div>

          <div className="mtn-tips">
            <h6>Important tips:</h6>
            <ul>
              <li>Ensure your MTN Mobile Money account has sufficient balance</li>
              <li>Keep your phone nearby to receive the payment prompt</li>
              <li>The payment request expires after 5 minutes</li>
              <li>You can dial *165# to check your balance</li>
            </ul>
          </div>

          {/* Show transaction limits */}
          <div className="transaction-limits">
            <h6>Transaction Limits:</h6>
            <div className="limits-grid">
              <div className="limit-item">
                <span className="limit-label">Minimum:</span>
                <span className="limit-value">UGX 500</span>
              </div>
              <div className="limit-item">
                <span className="limit-label">Maximum:</span>
                <span className="limit-value">UGX 2,500,000</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MTN Configuration Status Panel */}
      {renderMTNConfigurationStatus()}

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

  return (
    <div className="mtn-form">
      <MobileMoneyForm
        initialData={initialData}
        onChange={handleFormChange}
        errors={errors}
        customerInfo={customerInfo}
        orderTotal={orderTotal}
        provider="mtn"
        phoneValidation={phoneValidation}
        onPhoneValidate={validateMTNPhoneNumber}
      />

      {/* MTN-specific information */}
      {renderMTNSpecificInfo()}

      {/* Service Status Indicator */}
      <div className="service-status">
        <div className={`status-indicator ${serviceStatus.status}`}>
          <div className="status-icon">
            {serviceStatus.checking ? (
              <div className="spinner-small" />
            ) : serviceStatus.status === 'active' ? (
              <CheckCircle size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
          </div>
          <span className="status-text">
            {serviceStatus.checking ? 'Checking MTN service...' : serviceStatus.message}
          </span>
          {serviceStatus.status !== 'active' && !serviceStatus.checking && (
            <button 
              className="retry-status-btn"
              onClick={checkMTNServiceStatus}
              type="button"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MTNForm;