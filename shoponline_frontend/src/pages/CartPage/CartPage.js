import React, { useState, useEffect } from 'react';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import CartItems from './CartItems';
import CartTotals from './CartTotals';
import './CartPage.css';

const CartPage = () => {
  const { user } = useAuth();
  const {
    cartItems,
    cartTotal,
    cartSubtotal,
    totalSavings,
    itemCount,
    clearCart,
    isLoading
  } = useCart();

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Track cart page view
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: 'Shopping Cart',
        page_location: window.location.href,
      });
    }
  }, []);

  const handleContinueShopping = () => {
    window.location.href = '/';
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      return;
    }

    // Track checkout initiation
    if (window.gtag) {
      window.gtag('event', 'begin_checkout', {
        currency: 'UGX',
        value: cartTotal,
        items: cartItems.map(item => ({
          item_id: item.product_id,
          item_name: item.product_name,
          category: item.product_category,
          quantity: item.quantity,
          price: item.unit_price,
        })),
      });
    }

    setIsProcessing(true);
    window.location.href = '/checkout';
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart? This action cannot be undone.')) {
      clearCart();
    }
  };

  if (isLoading) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="cart-loading">
            <div className="loading-spinner" />
            <p>Loading your cart...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-header">
          <div className="cart-breadcrumb">
            <button
              onClick={handleContinueShopping}
              className="breadcrumb-link"
            >
              Home
            </button>
            <span className="breadcrumb-separator">›</span>
            <span className="breadcrumb-current">Shopping Cart</span>
          </div>

          <div className="cart-title-section">
            <h1 className="cart-title">
              Your Shopping Cart
              {itemCount > 0 && <span className="cart-item-count">({itemCount} items)</span>}
            </h1>

            {cartItems.length > 0 && (
              <button
                onClick={handleClearCart}
                className="clear-cart-btn"
              >
                Clear Cart
              </button>
            )}
          </div>
        </div>

        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </div>
            <h2>Your cart is empty</h2>
            <p>Add some products to get started with your shopping.</p>
            <button
              onClick={handleContinueShopping}
              className="continue-shopping-btn"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="cart-content">
            <div className="cart-main">
              <div className="cart-items-section">
                <div className="cart-items-header">
                  <h2>Items in Your Cart</h2>
                  {totalSavings > 0 && (
                    <div className="total-savings-badge">
                      <span className="savings-icon">🎉</span>
                      You're saving UGX {totalSavings.toLocaleString()}!
                    </div>
                  )}
                </div>

                <CartItems />
              </div>

              <div className="cart-actions">
                <button
                  onClick={handleContinueShopping}
                  className="continue-shopping-secondary"
                >
                  ← Continue Shopping
                </button>
              </div>
            </div>

            <div className="cart-sidebar">
              <CartTotals
                onCheckout={handleCheckout}
                isProcessing={isProcessing}
              />

              {/* Security badges */}
              <div className="security-badges">
                <div className="security-badge">
                  <div className="badge-icon">🔒</div>
                  <div className="badge-text">
                    <strong>Secure Checkout</strong>
                    <p>Your information is protected</p>
                  </div>
                </div>

                <div className="security-badge">
                  <div className="badge-icon">🚚</div>
                  <div className="badge-text">
                    <strong>Local Delivery</strong>
                    <p>Fast delivery across Uganda</p>
                  </div>
                </div>

                <div className="security-badge">
                  <div className="badge-icon">💳</div>
                  <div className="badge-text">
                    <strong>Mobile Money</strong>
                    <p>MTN & Airtel Money accepted</p>
                  </div>
                </div>
              </div>

              {/* Recently viewed or recommended products */}
              <div className="cart-recommendations">
                <h3>You might also like</h3>
                <div className="recommendation-placeholder">
                  <p>Loading recommendations...</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Flash sales notification */}
        {cartItems.some(item => item.is_flash_sale_item) && (
          <div className="flash-sale-notice">
            <div className="flash-sale-icon">⚡</div>
            <div className="flash-sale-text">
              <strong>Flash Sale Items in Cart!</strong>
              <p>Complete your purchase soon to secure these special prices.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;