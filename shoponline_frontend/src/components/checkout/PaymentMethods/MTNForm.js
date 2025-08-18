// src/components/checkout/PaymentMethods/MTNForm.js
import React from 'react';
import MobileMoneyForm from './MobileMoneyForm';

const MTNForm = ({ initialData, onChange, errors, customerInfo, orderTotal }) => {
  return (
    <div className="mtn-form">
      <MobileMoneyForm
        initialData={initialData}
        onChange={onChange}
        errors={errors}
        customerInfo={customerInfo}
        orderTotal={orderTotal}
        provider="mtn"
      />

      {/* MTN-specific information */}
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
    </div>
  );
};

export default MTNForm;
