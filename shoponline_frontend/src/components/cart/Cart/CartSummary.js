import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { formatCurrency } from '../../../utils/helpers/currencyHelpers';

const CartSummary = ({
  subtotal = 0,
  total = 0,
  itemCount = 0,
  showCheckoutButton = true,
  disabled = false,
  compact = false,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate additional fees and discounts
  const deliveryFee = 0; // Free delivery as per platform requirements
  const taxRate = 0.18; // 18% VAT for Uganda
  const taxAmount = subtotal * taxRate;
  const totalSavings = subtotal - total; // If there are flash sale discounts
  const finalTotal = total + deliveryFee + (taxAmount > 0 ? taxAmount : 0);

  const handleProceedToCheckout = async () => {
    if (itemCount === 0) return;

    setIsProcessing(true);

    try {
      // If user is not logged in, redirect to login with return URL
      if (!user) {
        navigate('/login?redirect=/checkout');
        return;
      }

      // Navigate to checkout page
      navigate('/checkout');
    } catch (error) {
      console.error('Checkout navigation error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinueShopping = () => {
    navigate('/');
  };

  if (compact) {
    return (
      <div className="cart-summary cart-summary-compact">
        <div className="summary-row summary-total">
          <span>Total ({itemCount} items):</span>
          <strong>{formatCurrency(finalTotal)}</strong>
        </div>
        {showCheckoutButton && (
          <button
            className="btn btn-primary btn-block checkout-btn"
            onClick={handleProceedToCheckout}
            disabled={disabled || isProcessing || itemCount === 0}
          >
            {isProcessing ? (
              <>
                <div className="btn-spinner" />
                Processing...
              </>
            ) : (
              'Checkout'
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="cart-summary">
      <h3 className="summary-title">Order Summary</h3>

      <div className="summary-details">
        <div className="summary-row">
          <span>Subtotal ({itemCount} items):</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>

        {totalSavings > 0 && (
          <div className="summary-row savings-row">
            <span>Flash Sale Savings:</span>
            <span className="savings-amount">-{formatCurrency(totalSavings)}</span>
          </div>
        )}

        <div className="summary-row">
          <span>Delivery Fee:</span>
          <span className={deliveryFee === 0 ? 'free-delivery' : ''}>
            {deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}
          </span>
        </div>

        {taxAmount > 0 && (
          <div className="summary-row">
            <span>VAT (18%):</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
        )}

        <div className="summary-divider" />

        <div className="summary-row summary-total">
          <span>Total:</span>
          <strong>{formatCurrency(finalTotal)}</strong>
        </div>

        {totalSavings > 0 && (
          <div className="total-savings">
            <span>You're saving {formatCurrency(totalSavings)}!</span>
          </div>
        )}
      </div>

      {showCheckoutButton && (
        <div className="summary-actions">
          <button
            className="btn btn-primary btn-block checkout-btn"
            onClick={handleProceedToCheckout}
            disabled={disabled || isProcessing || itemCount === 0}
          >
            {isProcessing ? (
              <>
                <div className="btn-spinner" />
                Processing...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7Z" />
                </svg>
                Secure Checkout
              </>
            )}
          </button>

          <button
            className="btn btn-outline btn-block continue-shopping-btn"
            onClick={handleContinueShopping}
            disabled={isProcessing}
          >
            Continue Shopping
          </button>
        </div>
      )}

      <div className="security-badges">
        <div className="security-item">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,17.4 15.4,18 14.8,18H9.2C8.6,18 8,17.4 8,16V13C8,12.4 8.6,11.5 9.2,11.5V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.7 10.5,10V11.5H13.5V10C13.5,8.7 12.8,8.2 12,8.2Z" />
          </svg>
          <span>Secure Payment</span>
        </div>

        <div className="security-item">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M9,11H7L12,6L17,11H15V16H9V11M5,20V18H19V20H5Z" />
          </svg>
          <span>Free Delivery</span>
        </div>

        <div className="security-item">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z" />
          </svg>
          <span>24/7 Support</span>
        </div>
      </div>

      <div className="payment-methods">
        <h4>We Accept:</h4>
        <div className="payment-icons">
          <div className="payment-method">
            <img src="/assets/icons/mtn-momo.png" alt="MTN Mobile Money" />
          </div>
          <div className="payment-method">
            <img src="/assets/icons/airtel-money.png" alt="Airtel Money" />
          </div>
          <div className="payment-method">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z" />
            </svg>
            <span>Cash on Delivery</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartSummary;
