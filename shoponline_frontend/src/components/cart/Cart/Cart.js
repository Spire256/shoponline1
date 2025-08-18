import React, { useState, useEffect } from 'react';
import { useCart } from '../../../hooks/useCart';
import { useAuth } from '../../../hooks/useAuth';
import CartItem from './CartItem';
import CartSummary from './CartSummary';
import EmptyCart from './EmptyCart';
import './Cart.css';

const Cart = ({ showCheckoutButton = true, compact = false }) => {
  const {
    cartItems,
    loading,
    error,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartSubtotal,
    getTotalItems,
  } = useCart();

  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');

  useEffect(() => {
    // Clear any previous errors when component mounts
    setUpdateError('');
  }, []);

  const handleQuantityUpdate = async (productId, newQuantity) => {
    setIsUpdating(true);
    setUpdateError('');

    try {
      await updateQuantity(productId, newQuantity);
    } catch (error) {
      setUpdateError('Failed to update quantity. Please try again.');
      console.error('Quantity update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveItem = async productId => {
    setIsUpdating(true);
    setUpdateError('');

    try {
      await removeFromCart(productId);
    } catch (error) {
      setUpdateError('Failed to remove item. Please try again.');
      console.error('Remove item error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      setIsUpdating(true);
      setUpdateError('');

      try {
        await clearCart();
      } catch (error) {
        setUpdateError('Failed to clear cart. Please try again.');
        console.error('Clear cart error:', error);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  if (loading) {
    return (
      <div className={`cart-container ${compact ? 'cart-compact' : ''}`}>
        <div className="cart-loading">
          <div className="loading-spinner" />
          <p>Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`cart-container ${compact ? 'cart-compact' : ''}`}>
        <div className="cart-error">
          <h3>Unable to load cart</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return <EmptyCart compact={compact} />;
  }

  return (
    <div className={`cart-container ${compact ? 'cart-compact' : ''}`}>
      <div className="cart-header">
        <h2 className="cart-title">
          Shopping Cart
          <span className="cart-item-count">({getTotalItems()} items)</span>
        </h2>
        {!compact && cartItems.length > 0 && (
          <button
            className="btn btn-outline btn-sm clear-cart-btn"
            onClick={handleClearCart}
            disabled={isUpdating}
          >
            Clear Cart
          </button>
        )}
      </div>

      {updateError && (
        <div className="cart-error-message">
          <p>{updateError}</p>
          <button className="error-dismiss" onClick={() => setUpdateError('')}>
            ×
          </button>
        </div>
      )}

      <div className="cart-content">
        <div className="cart-items">
          {cartItems.map(item => (
            <CartItem
              key={item.id || item.product_id}
              item={item}
              onQuantityUpdate={handleQuantityUpdate}
              onRemove={handleRemoveItem}
              disabled={isUpdating}
              compact={compact}
            />
          ))}
        </div>

        <div className="cart-sidebar">
          <CartSummary
            subtotal={getCartSubtotal()}
            total={getCartTotal()}
            itemCount={getTotalItems()}
            showCheckoutButton={showCheckoutButton}
            disabled={isUpdating}
            compact={compact}
          />
        </div>
      </div>

      {!user && !compact && (
        <div className="cart-guest-notice">
          <p>
            <strong>Create an account</strong> to save your cart and track your orders.
          </p>
          <div className="guest-actions">
            <a href="/login" className="btn btn-outline btn-sm">
              Sign In
            </a>
            <a href="/register" className="btn btn-primary btn-sm">
              Create Account
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
