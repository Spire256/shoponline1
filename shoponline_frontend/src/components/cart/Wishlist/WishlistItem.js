import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../../utils/helpers/currencyHelpers';
import { calculateDiscountedPrice } from '../../../utils/helpers/calculations';

const WishlistItem = ({ item, onRemove, onAddToCart, disabled = false, compact = false }) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [imageError, setImageError] = useState(false);

  const product = item.product || item;
  const originalPrice = parseFloat(product.price || 0);
  const discountPercent = product.flash_sale_discount || 0;
  const currentPrice =
    discountPercent > 0 ? calculateDiscountedPrice(originalPrice, discountPercent) : originalPrice;
  const savings = discountPercent > 0 ? originalPrice - currentPrice : 0;

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove(item.id);
    } catch (error) {
      setIsRemoving(false);
    }
  };

  const handleAddToCart = async () => {
    if (product.availability !== 'in_stock') return;

    setIsAddingToCart(true);
    try {
      await onAddToCart(product, 1);
    } catch (error) {
      console.error('Add to cart error:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const getAddedDate = () => {
    if (!item.added_at) return '';
    const date = new Date(item.added_at);
    return date.toLocaleDateString('en-UG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStockStatus = () => {
    switch (product.availability) {
      case 'out_of_stock':
        return { text: 'Out of Stock', class: 'out-of-stock' };
      case 'low_stock':
        return { text: `Only ${product.stock_quantity || 0} left`, class: 'low-stock' };
      case 'limited_stock':
        return { text: 'Limited Stock', class: 'limited-stock' };
      default:
        return { text: 'In Stock', class: 'in-stock' };
    }
  };

  const stockStatus = getStockStatus();

  return (
    <div
      className={`wishlist-item ${compact ? 'wishlist-item-compact' : ''} ${
        isRemoving ? 'removing' : ''
      }`}
    >
      <div className="wishlist-item-image">
        <Link to={`/products/${product.slug}`}>
          {!imageError && product.image ? (
            <img src={product.image} alt={product.name} onError={handleImageError} loading="lazy" />
          ) : (
            <div className="image-placeholder">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
              </svg>
            </div>
          )}
        </Link>

        {discountPercent > 0 && <div className="discount-badge">-{discountPercent}%</div>}

        <button
          className="remove-from-wishlist-btn"
          onClick={handleRemove}
          disabled={disabled || isRemoving}
          aria-label="Remove from wishlist"
        >
          {isRemoving ? (
            <div className="btn-spinner" />
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
            </svg>
          )}
        </button>
      </div>

      <div className="wishlist-item-details">
        <div className="wishlist-item-info">
          <h3 className="wishlist-item-name">
            <Link to={`/products/${product.slug}`}>{product.name}</Link>
          </h3>

          <div className="wishlist-item-meta">
            {product.rating && (
              <div className="rating">
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      viewBox="0 0 24 24"
                      fill={i < Math.floor(product.rating) ? 'currentColor' : 'none'}
                      stroke="currentColor"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <span className="rating-count">({product.review_count || 0})</span>
              </div>
            )}

            {!compact && <div className="added-date">Added {getAddedDate()}</div>}
          </div>

          <div className="wishlist-item-price">
            {discountPercent > 0 ? (
              <div className="price-with-discount">
                <span className="current-price">{formatCurrency(currentPrice)}</span>
                <span className="original-price">{formatCurrency(originalPrice)}</span>
                <span className="savings">Save {formatCurrency(savings)}</span>
              </div>
            ) : (
              <span className="current-price">{formatCurrency(currentPrice)}</span>
            )}
          </div>

          <div className={`stock-status ${stockStatus.class}`}>{stockStatus.text}</div>
        </div>

        <div className="wishlist-item-actions">
          <button
            className="btn btn-primary add-to-cart-btn"
            onClick={handleAddToCart}
            disabled={disabled || isAddingToCart || product.availability !== 'in_stock'}
          >
            {isAddingToCart ? (
              <>
                <div className="btn-spinner" />
                Adding...
              </>
            ) : product.availability !== 'in_stock' ? (
              'Out of Stock'
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17,18C15.89,18 15,18.89 15,20A2,2 0 0,0 17,22A2,2 0 0,0 19,20C19,18.89 18.1,18 17,18M1,2V4H3L6.6,11.59L5.24,14.04C5.09,14.32 5,14.65 5,15A2,2 0 0,0 7,17H19V15H7.42A0.25,0.25 0 0,1 7.17,14.75C7.17,14.7 7.18,14.66 7.2,14.63L8.1,13H15.55C16.3,13 16.96,12.58 17.3,11.97L20.88,5H5.21L4.27,3H1M7,18C5.89,18 5,18.89 5,20A2,2 0 0,0 7,22A2,2 0 0,0 9,20C9,18.89 8.1,18 7,18Z" />
                </svg>
                Add to Cart
              </>
            )}
          </button>

          {!compact && (
            <Link to={`/products/${product.slug}`} className="btn btn-outline view-product-btn">
              View Details
            </Link>
          )}
        </div>
      </div>

      {isRemoving && (
        <div className="wishlist-item-overlay">
          <div className="loading-spinner" />
        </div>
      )}
    </div>
  );
};

export default WishlistItem;
