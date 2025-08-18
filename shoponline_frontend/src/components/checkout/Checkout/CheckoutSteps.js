// src/components/checkout/Checkout/CheckoutSteps.js
import React from 'react';

const CheckoutSteps = ({ currentStep, onStepChange, steps }) => {
  const handleStepClick = (stepKey, index) => {
    // Only allow clicking on completed steps or current step
    const currentIndex = steps.findIndex(step => step.key === currentStep);
    if (index <= currentIndex) {
      onStepChange(stepKey);
    }
  };

  const getStepStatus = (step, index) => {
    const currentIndex = steps.findIndex(s => s.key === currentStep);

    if (step.completed) {
      return 'completed';
    } else if (step.key === currentStep) {
      return 'current';
    } else if (index < currentIndex) {
      return 'completed';
    } else {
      return 'pending';
    }
  };

  const getStepIcon = (step, index) => {
    const status = getStepStatus(step, index);

    switch (status) {
      case 'completed':
        return <i className="fas fa-check" />;
      case 'current':
        return <span className="step-number">{index + 1}</span>;
      case 'pending':
      default:
        return <span className="step-number">{index + 1}</span>;
    }
  };

  return (
    <div className="checkout-steps">
      <div className="steps-container">
        {steps.map((step, index) => {
          const status = getStepStatus(step, index);
          const isClickable = status === 'completed' || status === 'current';

          return (
            <div key={step.key} className="step-wrapper">
              <div
                className={`checkout-step ${status} ${isClickable ? 'clickable' : ''}`}
                onClick={() => isClickable && handleStepClick(step.key, index)}
                role="button"
                tabIndex={isClickable ? 0 : -1}
                onKeyDown={e => {
                  if ((e.key === 'Enter' || e.key === ' ') && isClickable) {
                    e.preventDefault();
                    handleStepClick(step.key, index);
                  }
                }}
              >
                <div className="step-icon">{getStepIcon(step, index)}</div>

                <div className="step-content">
                  <div className="step-label">{step.label}</div>
                  <div className="step-description">
                    {step.key === 'customer_info' && 'Enter your details'}
                    {step.key === 'payment' && 'Choose payment method'}
                    {step.key === 'confirmation' && 'Review your order'}
                  </div>
                </div>
              </div>

              {index < steps.length - 1 && (
                <div className={`step-connector ${status === 'completed' ? 'completed' : ''}`}>
                  <div className="connector-line" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile version - simplified */}
      <div className="steps-mobile">
        <div className="mobile-step-info">
          <span className="current-step">
            Step {steps.findIndex(s => s.key === currentStep) + 1} of {steps.length}
          </span>
          <span className="step-title">{steps.find(s => s.key === currentStep)?.label}</span>
        </div>

        <div className="mobile-progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${((steps.findIndex(s => s.key === currentStep) + 1) / steps.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CheckoutSteps;
