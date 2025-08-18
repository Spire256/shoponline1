import React, { useState } from 'react';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';

const CartTotals = ({ onCheckout, isProcessing }) => {
  const { user } = useAuth();
  const { cartSubtotal, cartTotal, totalSavings, itemCount, cartItems } = useCart();

  const [deliveryMethod, setDeliveryMethod] = useState('standard');

  // Delivery fees (in UGX)
  const deliveryFees = {
    standard: 0, // Free standard delivery
    express: 15000, // Express delivery fee
    pickup: 0, // Store pickup - free
  };

  const taxRate = 0; // No tax for now, but structure is ready
  const deliveryFee = deliveryFees[deliveryMethod];
  const taxAmount = (cartSubtotal + deliveryFee) * taxRate;
  const finalTotal = cartSubtotal + deliveryFee + taxAmount;

  const formatPrice = price => {
    return `UGX ${price.toLocaleString()}`;
  };

  const getEstimatedDelivery = () => {
    const now = new Date();
    const deliveryDate = new Date();

    switch (deliveryMethod) {
      case 'express':
        deliveryDate.setDate(now.getDate() + 1);
        return `Tomorrow, ${deliveryDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })}`;
      case 'pickup':
        return 'Available in 2-4 hours';
      default:
        deliveryDate.setDate(now.getDate() + 2);
        return `${deliveryDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })}`;
    }
  };

  const hasFlashSaleItems = cartItems.some(item => item.is_flash_sale_item);

  return (
    <div className="cart-totals">
      <div className="totals-header">
        <h3>Order Summary</h3>
        <span className="items-count">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </span>
      </div>

      <div className="totals-content">
        {/* Subtotal */}
        <div className="total-line">
          <span className="total-label">Subtotal</span>
          <span className="total-value">{formatPrice(cartSubtotal)}</span>
        </div>

        {/* Flash sale savings */}
        {totalSavings > 0 && (
          <div className="total-line savings-line">
            <span className="total-label">
              <span className="savings-icon">🎉</span>
              Flash Sale Savings
            </span>
            <span className="total-value savings-value">-{formatPrice(totalSavings)}</span>
          </div>
        )}

        {/* Delivery options */}
        <div className="delivery-section">
          <h4 className="delivery-title">Delivery Options</h4>

          <div className="delivery-options">
            <label className="delivery-option">
              <input
                type="radio"
                name="delivery"
                value="standard"
                checked={deliveryMethod === 'standard'}
                onChange={e => setDeliveryMethod(e.target.value)}
              />
              <div className="delivery-info">
                <div className="delivery-name">Standard Delivery</div>
                <div className="delivery-details">2-3 business days • FREE</div>
              </div>
              <div className="delivery-price">Free</div>
            </label>

            <label className="delivery-option">
              <input
                type="radio"
                name="delivery"
                value="express"
                checked={deliveryMethod === 'express'}
                onChange={e => setDeliveryMethod(e.target.value)}
              />
              <div className="delivery-info">
                <div className="delivery-name">Express Delivery</div>
                <div className="delivery-details">Next day delivery</div>
              </div>
              <div className="delivery-price">{formatPrice(deliveryFees.express)}</div>
            </label>

            <label className="delivery-option">
              <input
                type="radio"
                name="delivery"
                value="pickup"
                checked={deliveryMethod === 'pickup'}
                onChange={e => setDeliveryMethod(e.target.value)}
              />
              <div className="delivery-info">
                <div className="delivery-name">Store Pickup</div>
                <div className="delivery-details">Ready in 2-4 hours</div>
              </div>
              <div className="delivery-price">Free</div>
            </label>
          </div>

          <div className="estimated-delivery">
            <strong>Estimated delivery: {getEstimatedDelivery()}</strong>
          </div>
        </div>

        {/* Delivery fee */}
        <div className="total-line">
          <span className="total-label">Delivery</span>
          <span className="total-value">{deliveryFee > 0 ? formatPrice(deliveryFee) : 'Free'}</span>
        </div>

        {/* Tax (if applicable) */}
        {taxAmount > 0 && (
          <div className="total-line">
            <span className="total-label">Tax</span>
            <span className="total-value">{formatPrice(taxAmount)}</span>
          </div>
        )}

        {/* Total */}
        <div className="total-line total-final">
          <span className="total-label">Total</span>
          <span className="total-value">{formatPrice(finalTotal)}</span>
        </div>

        {/* Flash sale urgency */}
        {hasFlashSaleItems && (
          <div className="urgency-notice">
            <div className="urgency-icon">⏰</div>
            <div className="urgency-text">
              <strong>Flash sale items in cart!</strong>
              <p>Secure these prices before they expire</p>
            </div>
          </div>
        )}

        {/* Checkout button */}
        <button
          className="checkout-btn"
          onClick={onCheckout}
          disabled={isProcessing || itemCount === 0}
        >
          {isProcessing ? (
            <>
              <div className="btn-spinner" />
              Processing...
            </>
          ) : (
            <>
              Proceed to Checkout
              <svg className="checkout-arrow" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
              </svg>
            </>
          )}
        </button>

        {/* Payment methods preview */}
        <div className="payment-methods-preview">
          <p className="payment-text">We accept:</p>
          <div className="payment-icons">
            <div className="payment-method">
              <span className="payment-icon mtn">📱</span>
              <span className="payment-name">MTN MoMo</span>
            </div>
            <div className="payment-method">
              <span className="payment-icon airtel">📱</span>
              <span className="payment-name">Airtel Money</span>
            </div>
            <div className="payment-method">
              <span className="payment-icon cod">💵</span>
              <span className="payment-name">Cash on Delivery</span>
            </div>
          </div>
        </div>

        {/* User authentication notice */}
        {!user && (
          <div className="auth-notice">
            <div className="auth-icon">👤</div>
            <div className="auth-text">
              <p>
                <strong>Have an account?</strong>
              </p>
              <p>Sign in for faster checkout</p>
              <button className="auth-link">Sign In</button>
            </div>
          </div>
        )}

        {/* Money back guarantee */}
        <div className="guarantee-notice">
          <div className="guarantee-icon">✅</div>
          <div className="guarantee-text">
            <strong>100% Satisfaction Guarantee</strong>
            <p>Not satisfied? Get your money back within 7 days</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartTotals;
