import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../../hooks/useCart';
import CartBadge from './CartBadge';
import './CartIcon.css';

const CartIcon = ({
  showDropdown = true,
  variant = 'header', // 'header', 'mobile', 'fab'
  size = 'medium', // 'small', 'medium', 'large'
}) => {
  const navigate = useNavigate();
  const { cartItems, getTotalItems, getCartTotal, loading } = useCart();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastItemCount, setLastItemCount] = useState(0);

  const totalItems = getTotalItems();
  const cartTotal = getCartTotal();

  // Animate cart icon when items are added
  useEffect(() => {
    if (totalItems > lastItemCount && lastItemCount > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
    setLastItemCount(totalItems);
  }, [totalItems, lastItemCount]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (isDropdownOpen && !event.target.closest('.cart-icon-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isDropdownOpen]);

  const handleCartClick = e => {
    e.preventDefault();

    if (variant === 'fab') {
      navigate('/cart');
      return;
    }

    if (showDropdown && totalItems > 0) {
      setIsDropdownOpen(!isDropdownOpen);
    } else {
      navigate('/cart');
    }
  };

  const handleViewCart = () => {
    setIsDropdownOpen(false);
    navigate('/cart');
  };

  const handleCheckout = () => {
    setIsDropdownOpen(false);
    navigate('/checkout');
  };

  const getIconClasses = () => {
    const baseClasses = ['cart-icon-container'];

    baseClasses.push(`cart-icon-${variant}`);
    baseClasses.push(`cart-icon-${size}`);

    if (isAnimating) baseClasses.push('cart-icon-animate');
    if (isDropdownOpen) baseClasses.push('cart-icon-active');
    if (totalItems > 0) baseClasses.push('cart-icon-has-items');

    return baseClasses.join(' ');
  };

  const renderCartIcon = () => (
    <div className="cart-icon-wrapper">
      <svg className="cart-icon-svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7Z" />
      </svg>
      <CartBadge count={totalItems} variant={variant} />
    </div>
  );

  const renderDropdownContent = () => (
    <div className="cart-dropdown">
      <div className="cart-dropdown-header">
        <h3>Shopping Cart</h3>
        <span className="cart-item-count">{totalItems} items</span>
      </div>

      <div className="cart-dropdown-items">
        {cartItems.slice(0, 3).map(item => (
          <div key={item.id || item.product_id} className="cart-dropdown-item">
            <div className="item-image">
              <img
                src={item.product?.image || item.image || '/assets/placeholder.jpg'}
                alt={item.product?.name || item.name}
                loading="lazy"
              />
            </div>
            <div className="item-details">
              <h4>{item.product?.name || item.name}</h4>
              <div className="item-price">
                <span className="quantity">{item.quantity}x</span>
                <span className="price">
                  UGX {((item.product?.price || item.price) * item.quantity).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}

        {cartItems.length > 3 && (
          <div className="cart-dropdown-more">+{cartItems.length - 3} more items</div>
        )}
      </div>

      <div className="cart-dropdown-footer">
        <div className="cart-total">
          <span>Total: UGX {cartTotal.toLocaleString()}</span>
        </div>
        <div className="cart-dropdown-actions">
          <button className="btn btn-outline btn-sm" onClick={handleViewCart}>
            View Cart
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleCheckout}>
            Checkout
          </button>
        </div>
      </div>
    </div>
  );

  const renderEmptyDropdown = () => (
    <div className="cart-dropdown cart-dropdown-empty">
      <div className="empty-cart-icon">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M17,18C15.89,18 15,18.89 15,20A2,2 0 0,0 17,22A2,2 0 0,0 19,20C19,18.89 18.1,18 17,18M1,2V4H3L6.6,11.59L5.24,14.04C5.09,14.32 5,14.65 5,15A2,2 0 0,0 7,17H19V15H7.42A0.25,0.25 0 0,1 7.17,14.75C7.17,14.7 7.18,14.66 7.2,14.63L8.1,13H15.55C16.3,13 16.96,12.58 17.3,11.97L20.88,5H5.21L4.27,3H1M7,18C5.89,18 5,18.89 5,20A2,2 0 0,0 7,22A2,2 0 0,0 9,20C9,18.89 8.1,18 7,18Z" />
        </svg>
      </div>
      <p>Your cart is empty</p>
      <Link to="/" className="btn btn-primary btn-sm">
        Start Shopping
      </Link>
    </div>
  );

  if (variant === 'fab') {
    return (
      <button
        className={getIconClasses()}
        onClick={handleCartClick}
        aria-label={`Shopping cart with ${totalItems} items`}
        disabled={loading}
      >
        {renderCartIcon()}
        {totalItems > 0 && <span className="cart-total-fab">UGX {cartTotal.toLocaleString()}</span>}
      </button>
    );
  }

  return (
    <div className={getIconClasses()}>
      <button
        className="cart-icon-button"
        onClick={handleCartClick}
        aria-label={`Shopping cart with ${totalItems} items`}
        aria-expanded={isDropdownOpen}
        disabled={loading}
      >
        {renderCartIcon()}
      </button>

      {showDropdown && isDropdownOpen && (
        <>
          <div className="cart-dropdown-overlay" onClick={() => setIsDropdownOpen(false)} />
          {totalItems > 0 ? renderDropdownContent() : renderEmptyDropdown()}
        </>
      )}
    </div>
  );
};

export default CartIcon;
