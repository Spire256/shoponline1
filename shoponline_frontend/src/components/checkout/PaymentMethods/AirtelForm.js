// src/components/checkout/PaymentMethods/AirtelForm.js
import React from 'react';
import MobileMoneyForm from './MobileMoneyForm';

const AirtelForm = ({ initialData, onChange, errors, customerInfo, orderTotal }) => {
  return (
    <div className="airtel-form">
      <MobileMoneyForm
        initialData={initialData}
        onChange={onChange}
        errors={errors}
        customerInfo={customerInfo}
        orderTotal={orderTotal}
        provider="airtel"
      />

      {/* Airtel-specific information */}
      <div className="airtel-specific-info">
        <div className="info-card">
          <div className="info-header">
            <i className="fas fa-info-circle" />
            <h5>Airtel Money Tips</h5>
          </div>
          <div className="info-content">
            <ul>
              <li>Make sure your Airtel Money account is active and has sufficient balance</li>
              <li>Keep your phone on and within network coverage</li>
              <li>The payment authorization expires after 3 minutes</li>
              <li>
                You can check your balance by dialing <strong>*185#</strong>
              </li>
            </ul>
          </div>
        </div>

        <div className="payment-flow-info">
          <div className="info-header">
            <i className="fas fa-route" />
            <h5>What happens next?</h5>
          </div>
          <div className="flow-steps">
            <div className="flow-step">
              <div className="step-icon">
                <i className="fas fa-mobile-alt" />
              </div>
              <div className="step-text">
                <strong>2. Approve on Your Phone</strong>
                <p>You'll receive a notification or USSD prompt on your phone</p>
              </div>
            </div>

            <div className="flow-step">
              <div className="step-icon">
                <i className="fas fa-key" />
              </div>
              <div className="step-text">
                <strong>3. Enter Your PIN</strong>
                <p>Enter your Airtel Money PIN to authorize the payment</p>
              </div>
            </div>

            <div className="flow-step">
              <div className="step-icon">
                <i className="fas fa-check-circle" />
              </div>
              <div className="step-text">
                <strong>4. Payment Confirmed</strong>
                <p>You'll receive SMS confirmation and your order will be processed</p>
              </div>
            </div>
          </div>
        </div>

        <div className="troubleshooting">
          <details>
            <summary>Having payment issues?</summary>
            <div className="troubleshooting-content">
              <h6>Common solutions:</h6>
              <ul>
                <li>
                  <strong>No payment notification:</strong> Check network signal and ensure your
                  phone is on
                </li>
                <li>
                  <strong>Payment timeout:</strong> Transaction expired, please try placing the
                  order again
                </li>
                <li>
                  <strong>Insufficient funds:</strong> Top up your Airtel Money account and retry
                </li>
                <li>
                  <strong>Wrong PIN:</strong> Use your 4-digit Airtel Money PIN, not your SIM PIN
                </li>
                <li>
                  <strong>Account issues:</strong> Ensure your Airtel Money account is active and
                  not suspended
                </li>
              </ul>

              <div className="airtel-services">
                <h6>Airtel Money Services:</h6>
                <div className="services-grid">
                  <div className="service-item">
                    <i className="fas fa-phone" />
                    <div>
                      <strong>Customer Care</strong>
                      <span>Call 175 (from Airtel line)</span>
                    </div>
                  </div>
                  <div className="service-item">
                    <i className="fas fa-code" />
                    <div>
                      <strong>Balance Check</strong>
                      <span>Dial *185# for menu</span>
                    </div>
                  </div>
                  <div className="service-item">
                    <i className="fas fa-mobile-alt" />
                    <div>
                      <strong>Airtel Money App</strong>
                      <span>Available on Google Play Store</span>
                    </div>
                  </div>
                  <div className="service-item">
                    <i className="fas fa-map-marker-alt" />
                    <div>
                      <strong>Airtel Shop</strong>
                      <span>Visit nearest Airtel outlet</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="emergency-contact">
                <div className="emergency-info">
                  <i className="fas fa-exclamation-triangle" />
                  <div>
                    <strong>Emergency Support:</strong>
                    <p>
                      If you're charged but payment fails, contact our support with your transaction
                      reference number.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </details>
        </div>

        <div className="security-note">
          <div className="security-content">
            <i className="fas fa-shield-alt" />
            <div className="security-text">
              <strong>Security Notice:</strong>
              <p>
                Never share your Airtel Money PIN with anyone. We'll never ask for your PIN via
                phone or email.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AirtelForm;