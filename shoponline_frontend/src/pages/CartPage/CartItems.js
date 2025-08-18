import React, { useState } from 'react';
import { useCart } from '../../hooks/useCart';

const CartItems = () => {
  const { cartItems, updateQuantity, removeFromCart, isLoading } = useCart();

  const [loadingItems, setLoadingItems] = useState(new Set());

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(productId);
      return;
    }

    setLoadingItems(prev => new Set(prev).add(productId));

    try {
      await updateQuantity(productId, newQuantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setLoadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleRemoveItem = async productId => {
    if (!window.confirm('Remove this item from your cart?')) {
      return;
    }

    setLoadingItems(prev => new Set(prev).add(productId));

    try {
      await removeFromCart(productId);

      // Track removal event
      if (window.gtag) {
        const item = cartItems.find(item => item.product_id === productId);
        if (item) {
          window.gtag('event', 'remove_from_cart', {
            currency: 'UGX',
            value: item.unit_price * item.quantity,
            items: [
              {
                item_id: item.product_id,
                item_name: item.product_name,
                category: item.product_category,
                quantity: item.quantity,
                price: item.unit_price,
              },
            ],
          });
        }
      }
    } catch (error) {
      console.error('Failed to remove item:', error);
    } finally {
      setLoadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const formatPrice = price => {
    return `UGX ${price.toLocaleString()}`;
  };

  const getDiscountPercentage = (originalPrice, currentPrice) => {
    if (!originalPrice || originalPrice <= currentPrice) return 0;
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  };

  if (isLoading) {
    return (
      <div className="cart-items-loading">
        <div className="loading-spinner" />
        <p>Loading cart items...</p>
      </div>
    );
  }

  return (
    <div className="cart-items">
      {cartItems.map(item => {
        const isItemLoading = loadingItems.has(item.product_id);
        const discountPercentage = getDiscountPercentage(item.original_price, item.unit_price);

        return (
          <div key={item.product_id} className={`cart-item ${isItemLoading ? 'loading' : ''}`}>
            <div className="item-image">
              <img
                src={item.product_image || '/assets/placeholder.jpg'}
                alt={item.product_name}
                onError={e => {
                  e.target.src = '/assets/placeholder.jpg';
                }}
              />
              {item.is_flash_sale_item && <div className="flash-sale-badge">⚡ Flash Sale</div>}
            </div>

            <div className="item-details">
              <div className="item-header">
                <h3 className="item-name">{item.product_name}</h3>
                <button
                  className="remove-item-btn"
                  onClick={() => handleRemoveItem(item.product_id)}
                  disabled={isItemLoading}
                  title="Remove item"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </div>

              <div className="item-meta">
                {item.product_sku && <span className="item-sku">SKU: {item.product_sku}</span>}
                {item.product_category && (
                  <span className="item-category">{item.product_category}</span>
                )}
                {item.product_brand && <span className="item-brand">{item.product_brand}</span>}
              </div>

              <div className="item-pricing">
                <div className="price-display">
                  <span className="current-price">{formatPrice(item.unit_price)}</span>
                  {item.original_price && item.original_price > item.unit_price && (
                    <div className="price-comparison">
                      <span className="original-price">{formatPrice(item.original_price)}</span>
                      <span className="discount-badge">-{discountPercentage}%</span>
                    </div>
                  )}
                </div>

                {item.is_flash_sale_item && item.flash_sale_savings > 0 && (
                  <div className="savings-display">
                    <span className="savings-amount">
                      You save: {formatPrice(item.flash_sale_savings)}
                    </span>
                  </div>
                )}
              </div>

              <div className="item-actions">
                <div className="quantity-controls">
                  <label className="quantity-label">Quantity:</label>
                  <div className="quantity-input-group">
                    <button
                      className="quantity-btn decrease"
                      onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                      disabled={isItemLoading || item.quantity <= 1}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      className="quantity-input"
                      value={item.quantity}
                      onChange={e => {
                        const newQuantity = parseInt(e.target.value) || 1;
                        if (newQuantity !== item.quantity) {
                          handleQuantityChange(item.product_id, newQuantity);
                        }
                      }}
                      min="1"
                      max="99"
                      disabled={isItemLoading}
                    />
                    <button
                      className="quantity-btn increase"
                      onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                      disabled={isItemLoading || item.quantity >= 99}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="item-total">
                  <span className="total-label">Total:</span>
                  <span className="total-amount">{formatPrice(item.total_price)}</span>
                </div>
              </div>

              {isItemLoading && (
                <div className="item-loading-overlay">
                  <div className="item-loading-spinner" />
                  <span>Updating...</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Cart summary info */}
      <div className="cart-items-summary">
        <div className="items-count">
          Total: {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
        </div>

        {cartItems.some(item => item.is_flash_sale_item) && (
          <div className="flash-sale-notice">
            <span className="flash-icon">⚡</span>
            <span>Flash sale prices applied automatically</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartItems;
