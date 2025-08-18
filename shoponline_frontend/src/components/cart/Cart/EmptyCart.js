import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

const EmptyCart = ({ compact = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStartShopping = () => {
    navigate('/');
  };

  const handleViewCategories = () => {
    navigate('/categories');
  };

  const handleViewFlashSales = () => {
    navigate('/flash-sales');
  };

  if (compact) {
    return (
      <div className="empty-cart empty-cart-compact">
        <div className="empty-cart-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M17,18C15.89,18 15,18.89 15,20A2,2 0 0,0 17,22A2,2 0 0,0 19,20C19,18.89 18.1,18 17,18M1,2V4H3L6.6,11.59L5.24,14.04C5.09,14.32 5,14.65 5,15A2,2 0 0,0 7,17H19V15H7.42A0.25,0.25 0 0,1 7.17,14.75C7.17,14.7 7.18,14.66 7.2,14.63L8.1,13H15.55C16.3,13 16.96,12.58 17.3,11.97L20.88,5H5.21L4.27,3H1M7,18C5.89,18 5,18.89 5,20A2,2 0 0,0 7,22A2,2 0 0,0 9,20C9,18.89 8.1,18 7,18Z" />
          </svg>
        </div>
        <p>Your cart is empty</p>
        <button className="btn btn-primary btn-sm" onClick={handleStartShopping}>
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="empty-cart">
      <div className="empty-cart-content">
        <div className="empty-cart-illustration">
          <svg viewBox="0 0 200 200" fill="none">
            <circle
              cx="100"
              cy="100"
              r="80"
              stroke="#e2e8f0"
              strokeWidth="2"
              strokeDasharray="8,8"
            />
            <path d="M70 85h60l-8 40H78l-8-40z" stroke="#3b82f6" strokeWidth="2" fill="none" />
            <circle cx="85" cy="135" r="5" fill="#3b82f6" />
            <circle cx="115" cy="135" r="5" fill="#3b82f6" />
            <path d="M60 75h10l8 10h52l8-10h10" stroke="#3b82f6" strokeWidth="2" fill="none" />
          </svg>
        </div>

        <div className="empty-cart-message">
          <h2>Your shopping cart is empty</h2>
          <p>
            Looks like you haven't added any items to your cart yet. Start exploring our amazing
            products and deals!
          </p>
        </div>

        <div className="empty-cart-actions">
          <button className="btn btn-primary btn-lg" onClick={handleStartShopping}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,7H18V6A6,6 0 0,0 6,6V7H5A1,1 0 0,0 4,8V19A3,3 0 0,0 7,22H17A3,3 0 0,0 20,19V8A1,1 0 0,0 19,7M8,6A4,4 0 0,1 16,6V7H8V6M18,19A1,1 0 0,1 17,20H7A1,1 0 0,1 6,19V9H8V10A1,1 0 0,0 10,10A1,1 0 0,0 10,8V9H14V10A1,1 0 0,0 16,10A1,1 0 0,0 16,8V9H18V19Z" />
            </svg>
            Start Shopping
          </button>

          <button className="btn btn-outline btn-lg" onClick={handleViewCategories}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M16,6H22V8H16V6M16,10H22V12H16V10M10,6H14V8H10V6M10,10H14V12H10V10M4,6H8V8H4V6M4,10H8V12H4V10M16,14H22V16H16V14M10,14H14V16H10V14M4,14H8V16H4V14M16,18H22V20H16V18M10,18H14V20H10V18M4,18H8V20H4V18Z" />
            </svg>
            Browse Categories
          </button>
        </div>

        <div className="empty-cart-suggestions">
          <h3>Popular right now</h3>
          <div className="suggestion-links">
            <Link to="/flash-sales" className="suggestion-link">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7,2V13H10V22L17,10H13L17,2H7Z" />
              </svg>
              Flash Sales
            </Link>

            <Link to="/categories/electronics" className="suggestion-link">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M21,16V4H3V16H21M21,2A2,2 0 0,1 23,4V16A2,2 0 0,1 21,18H14L16,21V22H8V21L10,18H3C1.89,18 1,17.1 1,16V4C1,2.89 1.89,2 3,2H21Z" />
              </svg>
              Electronics
            </Link>

            <Link to="/categories/fashion" className="suggestion-link">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A2,2 0 0,1 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4A2,2 0 0,1 12,2M21,9V7L15,1H9L3,7V9H21M3,10V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V10H3Z" />
              </svg>
              Fashion
            </Link>

            <Link to="/categories/home" className="suggestion-link">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z" />
              </svg>
              Home & Living
            </Link>
          </div>
        </div>

        {!user && (
          <div className="empty-cart-auth-prompt">
            <div className="auth-prompt-content">
              <h4>Save your favorites</h4>
              <p>Sign in to save items to your cart and access them from any device.</p>
              <div className="auth-prompt-actions">
                <Link to="/login" className="btn btn-outline btn-sm">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="shopping-benefits">
          <div className="benefit-item">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M9,11H7L12,6L17,11H15V16H9V11M5,20V18H19V20H5Z" />
            </svg>
            <span>Free Delivery</span>
          </div>

          <div className="benefit-item">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,17.4 15.4,18 14.8,18H9.2C8.6,18 8,17.4 8,16V13C8,12.4 8.6,11.5 9.2,11.5V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.7 10.5,10V11.5H13.5V10C13.5,8.7 12.8,8.2 12,8.2Z" />
            </svg>
            <span>Secure Payment</span>
          </div>

          <div className="benefit-item">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z" />
            </svg>
            <span>24/7 Support</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyCart;
