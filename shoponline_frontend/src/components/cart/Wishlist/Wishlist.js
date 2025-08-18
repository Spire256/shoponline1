import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useCart } from '../../../hooks/useCart';
import WishlistItem from './WishlistItem';
import './Wishlist.css';

const Wishlist = ({ compact = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Mock wishlist data - replace with actual API call
  useEffect(() => {
    const fetchWishlist = async () => {
      setLoading(true);
      setError('');

      try {
        // Simulate API call
        setTimeout(() => {
          const mockWishlist = [
            {
              id: 1,
              product_id: 101,
              product: {
                id: 101,
                name: 'Samsung Galaxy S24 Ultra',
                price: 4500000,
                image: '/assets/products/galaxy-s24.jpg',
                slug: 'samsung-galaxy-s24-ultra',
                availability: 'in_stock',
                flash_sale_discount: 0,
                rating: 4.8,
                review_count: 245,
              },
              added_at: '2024-01-15T10:30:00Z',
            },
            {
              id: 2,
              product_id: 102,
              product: {
                id: 102,
                name: 'MacBook Pro 16" M3',
                price: 12000000,
                image: '/assets/products/macbook-pro.jpg',
                slug: 'macbook-pro-16-m3',
                availability: 'in_stock',
                flash_sale_discount: 15,
                rating: 4.9,
                review_count: 189,
              },
              added_at: '2024-01-14T15:20:00Z',
            },
          ];

          setWishlistItems(mockWishlist);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Failed to load wishlist. Please try again.');
        setLoading(false);
      }
    };

    if (user) {
      fetchWishlist();
    } else {
      // Load from localStorage for guest users
      const guestWishlist = JSON.parse(localStorage.getItem('guestWishlist') || '[]');
      setWishlistItems(guestWishlist);
      setLoading(false);
    }
  }, [user]);

  const handleRemoveFromWishlist = async itemId => {
    setIsUpdating(true);

    try {
      // Simulate API call or update localStorage
      if (user) {
        // API call to remove from wishlist
        // await removeFromWishlistAPI(itemId);
      } else {
        // Update localStorage
        const guestWishlist = wishlistItems.filter(item => item.id !== itemId);
        localStorage.setItem('guestWishlist', JSON.stringify(guestWishlist));
      }

      setWishlistItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Remove from wishlist error:', error);
      setError('Failed to remove item. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddToCart = async (product, quantity = 1) => {
    setIsUpdating(true);

    try {
      await addToCart(product, quantity);
      // Optionally remove from wishlist after adding to cart
      // handleRemoveFromWishlist(wishlistItems.find(item => item.product_id === product.id)?.id);
    } catch (error) {
      console.error('Add to cart error:', error);
      setError('Failed to add item to cart. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearWishlist = async () => {
    if (!window.confirm('Are you sure you want to clear your entire wishlist?')) {
      return;
    }

    setIsUpdating(true);

    try {
      if (user) {
        // API call to clear wishlist
        // await clearWishlistAPI();
      } else {
        localStorage.removeItem('guestWishlist');
      }

      setWishlistItems([]);
    } catch (error) {
      console.error('Clear wishlist error:', error);
      setError('Failed to clear wishlist. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleContinueShopping = () => {
    navigate('/');
  };

  if (!user && !compact) {
    return (
      <div className="wishlist-auth-required">
        <div className="auth-required-content">
          <div className="auth-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5 2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" />
            </svg>
          </div>
          <h2>Sign in to view your wishlist</h2>
          <p>Save your favorite items and access them from any device by creating an account.</p>
          <div className="auth-actions">
            <button
              className="btn btn-primary"
              onClick={() => navigate('/login?redirect=/wishlist')}
            >
              Sign In
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/register')}>
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`wishlist-container ${compact ? 'wishlist-compact' : ''}`}>
        <div className="wishlist-loading">
          <div className="loading-spinner" />
          <p>Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`wishlist-container ${compact ? 'wishlist-compact' : ''}`}>
        <div className="wishlist-error">
          <h3>Unable to load wishlist</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className={`wishlist-container ${compact ? 'wishlist-compact' : ''}`}>
        <div className="empty-wishlist">
          <div className="empty-wishlist-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5 2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" />
            </svg>
          </div>
          <h2>Your wishlist is empty</h2>
          <p>Save your favorite items to your wishlist and never lose track of what you love.</p>
          <button className="btn btn-primary" onClick={handleContinueShopping}>
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`wishlist-container ${compact ? 'wishlist-compact' : ''}`}>
      <div className="wishlist-header">
        <h2 className="wishlist-title">
          My Wishlist
          <span className="wishlist-count">({wishlistItems.length} items)</span>
        </h2>
        {!compact && wishlistItems.length > 0 && (
          <button
            className="btn btn-outline btn-sm clear-wishlist-btn"
            onClick={handleClearWishlist}
            disabled={isUpdating}
          >
            Clear All
          </button>
        )}
      </div>

      {error && (
        <div className="wishlist-error-message">
          <p>{error}</p>
          <button className="error-dismiss" onClick={() => setError('')}>
            ×
          </button>
        </div>
      )}

      <div className="wishlist-content">
        <div className="wishlist-items">
          {wishlistItems.map(item => (
            <WishlistItem
              key={item.id}
              item={item}
              onRemove={handleRemoveFromWishlist}
              onAddToCart={handleAddToCart}
              disabled={isUpdating}
              compact={compact}
            />
          ))}
        </div>

        {!compact && (
          <div className="wishlist-actions">
            <button
              className="btn btn-outline"
              onClick={handleContinueShopping}
              disabled={isUpdating}
            >
              Continue Shopping
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                // Add all items to cart
                wishlistItems.forEach(item => {
                  if (item.product.availability === 'in_stock') {
                    handleAddToCart(item.product, 1);
                  }
                });
              }}
              disabled={
                isUpdating || wishlistItems.every(item => item.product.availability !== 'in_stock')
              }
            >
              Add All to Cart
            </button>
          </div>
        )}
      </div>

      {!user && !compact && (
        <div className="wishlist-guest-notice">
          <p>
            <strong>Create an account</strong> to sync your wishlist across all devices.
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

export default Wishlist;
