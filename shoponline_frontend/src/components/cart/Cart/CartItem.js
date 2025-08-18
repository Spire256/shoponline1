import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../../utils/helpers/currencyHelpers';
import { calculateDiscountedPrice } from '../../../utils/helpers/calculations';

const CartItem = ({ item, onQuantityUpdate, onRemove, disabled = false, compact = false }) => {
  const [quantity, setQuantity] = useState(item.quantity || 1);
  const [isUpdating, setIsUpdating] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Sync local quantity with prop changes
  useEffect(() => {
    setQuantity(item.quantity || 1);
  }, [item.quantity]);

  const handleQuantityChange = async newQuantity => {
    if (newQuantity < 1 || newQuantity > 99) return;
    if (newQuantity === quantity) return;

    setIsUpdating(true);
    setQuantity(newQuantity);

    try {
      await onQuantityUpdate(item.product_id || item.id, newQuantity);
    } catch (error) {
      // Revert quantity on error
      setQuantity(item.quantity || 1);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    setIsUpdating(true);
    try {
      await onRemove(item.product_id || item.id);
    } catch (error) {
      setIsUpdating(false);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Calculate prices
  const originalPrice = parseFloat(item.product?.price || item.price || 0);
  const discountPercent = item.product?.flash_sale_discount || item.flash_sale_discount || 0;
  const currentPrice =
    discountPercent > 0 ? calculateDiscountedPrice(originalPrice, discountPercent) : originalPrice;
  const itemTotal = currentPrice * quantity;
  const savings = discountPercent > 0 ? (originalPrice - currentPrice) * quantity : 0;

  // Product details
  const product = item.product || item;
  const productName = product.name || product.title || 'Unknown Product';
  const productImage = product.image || product.thumbnail || product.images?.[0];
  const productSlug = product.slug || product.id;
  const availability = product.availability || product.stock_status || 'in_stock';
  const stockQuantity = product.stock_quantity || product.stock || 0;

  return (
    <div
      className={`cart-item ${compact ? 'cart-item-compact' : ''} ${isUpdating ? 'updating' : ''}`}
    >
      <div className="cart-item-image">
        <Link to={`/products/${productSlug}`}>
          {!imageError && productImage ? (
            <img src={productImage} alt={productName} onError={handleImageError} loading="lazy" />
          ) : (
            <div className="image-placeholder">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
              </svg>
            </div>
          )}
        </Link>
        {discountPercent > 0 && <div className="discount-badge">-{discountPercent}%</div>}
      </div>

      <div className="cart-item-details">
        <div className="cart-item-info">
          <h3 className="cart-item-name">
            <Link to={`/products/${productSlug}`}>{productName}</Link>
          </h3>

          {product.variant && <p className="cart-item-variant">{product.variant}</p>}

          <div className="cart-item-price">
            {discountPercent > 0 ? (
              <>
                <span className="current-price">{formatCurrency(currentPrice)}</span>
                <span className="original-price">{formatCurrency(originalPrice)}</span>
              </>
            ) : (
              <span className="current-price">{formatCurrency(currentPrice)}</span>
            )}
          </div>

          {availability !== 'in_stock' && (
            <div className="stock-warning">
              {availability === 'out_of_stock' ? (
                <span className="out-of-stock">Out of Stock</span>
              ) : availability === 'low_stock' ? (
                <span className="low-stock">Only {stockQuantity} left</span>
              ) : (
                <span className="limited-stock">Limited Stock</span>
              )}
            </div>
          )}
        </div>

        <div className="cart-item-actions">
          <div className="quantity-controls">
            <label htmlFor={`quantity-${item.id}`} className="sr-only">
              Quantity
            </label>
            <button
              className="quantity-btn quantity-decrease"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={disabled || isUpdating || quantity <= 1}
              aria-label="Decrease quantity"
            >
              -
            </button>
            <input
              id={`quantity-${item.id}`}
              type="number"
              className="quantity-input"
              value={quantity}
              onChange={e => {
                const newQuantity = parseInt(e.target.value) || 1;
                if (newQuantity !== quantity) {
                  handleQuantityChange(newQuantity);
                }
              }}
              min="1"
              max="99"
              disabled={disabled || isUpdating}
            />
            <button
              className="quantity-btn quantity-increase"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={
                disabled ||
                isUpdating ||
                quantity >= 99 ||
                (stockQuantity > 0 && quantity >= stockQuantity)
              }
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <button
            className="btn btn-outline btn-sm remove-btn"
            onClick={handleRemove}
            disabled={disabled || isUpdating}
            aria-label="Remove item from cart"
          >
            {isUpdating ? (
              <div className="btn-spinner" />
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                </svg>
                {!compact && 'Remove'}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="cart-item-total">
        <div className="item-total-price">{formatCurrency(itemTotal)}</div>
        {savings > 0 && <div className="item-savings">You save: {formatCurrency(savings)}</div>}
      </div>

      {isUpdating && (
        <div className="cart-item-overlay">
          <div className="loading-spinner" />
        </div>
      )}
    </div>
  );
};

export default CartItem;
