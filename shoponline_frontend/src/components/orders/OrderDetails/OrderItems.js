import React from 'react';
import { formatCurrency } from '../../../utils/helpers/formatters';

const OrderItems = ({ items = [] }) => {
  const getTotalSavings = () => {
    return items.reduce((total, item) => total + parseFloat(item.flash_sale_savings || 0), 0);
  };

  const getSubtotal = () => {
    return items.reduce((total, item) => total + parseFloat(item.total_price || 0), 0);
  };

  const hasFlashSaleItems = items.some(item => item.is_flash_sale_item);

  if (!items || items.length === 0) {
    return (
      <div className="order-items-empty">
        <p>No items found in this order</p>
      </div>
    );
  }

  return (
    <div className="order-items">
      <div className="order-items-list">
        {items.map((item, index) => (
          <div key={item.id || index} className="order-item">
            <div className="item-image">
              {item.product_image ? (
                <img
                  src={item.product_image}
                  alt={item.product_name}
                  onError={e => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="item-image-placeholder"
                style={{ display: item.product_image ? 'none' : 'flex' }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 16L8.586 11.414C9.367 10.633 10.633 10.633 11.414 11.414L16 16M14 14L15.586 12.414C16.367 11.633 17.633 11.633 18.414 12.414L20 14M14 8H14.01M6 20H18C19.105 20 20 19.105 20 18V6C20 4.895 19.105 4 18 4H6C4.895 4 4 4.895 4 6V18C4 19.105 4.895 20 6 20Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <div className="item-details">
              <div className="item-header">
                <h4 className="item-name">{item.product_name}</h4>
                {item.is_flash_sale_item && <span className="flash-sale-badge">⚡ Flash Sale</span>}
              </div>

              <div className="item-info">
                {item.product_sku && <div className="item-sku">SKU: {item.product_sku}</div>}

                {item.product_category && (
                  <div className="item-category">Category: {item.product_category}</div>
                )}

                {item.product_brand && (
                  <div className="item-brand">Brand: {item.product_brand}</div>
                )}
              </div>

              <div className="item-pricing">
                <div className="quantity-price">
                  <span className="quantity">Qty: {item.quantity}</span>
                  <span className="unit-price">
                    {item.is_flash_sale_item && item.original_price ? (
                      <>
                        <span className="original-price">
                          {formatCurrency(item.original_price)}
                        </span>
                        <span className="discounted-price">{formatCurrency(item.unit_price)}</span>
                      </>
                    ) : (
                      <span className="regular-price">{formatCurrency(item.unit_price)}</span>
                    )}
                    <span className="per-unit">each</span>
                  </span>
                </div>

                {item.is_flash_sale_item && item.flash_sale_discount > 0 && (
                  <div className="discount-info">
                    <span className="discount-percentage">{item.flash_sale_discount}% OFF</span>
                    <span className="savings">You saved {item.savings_display}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="item-total">
              <div className="total-price">{formatCurrency(item.total_price)}</div>
              {item.is_flash_sale_item && item.flash_sale_savings > 0 && (
                <div className="item-savings">Saved: {formatCurrency(item.flash_sale_savings)}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="order-items-summary">
        <div className="items-count">
          <strong>
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </strong>
        </div>

        <div className="summary-details">
          <div className="summary-row">
            <span>Items Subtotal:</span>
            <span>{formatCurrency(getSubtotal())}</span>
          </div>

          {hasFlashSaleItems && getTotalSavings() > 0 && (
            <div className="summary-row savings-row">
              <span>Total Flash Sale Savings:</span>
              <span className="savings-amount">-{formatCurrency(getTotalSavings())}</span>
            </div>
          )}
        </div>

        {hasFlashSaleItems && (
          <div className="flash-sale-info">
            <div className="flash-sale-note">
              <span className="flash-sale-icon">⚡</span>
              <span>You got some great deals with our Flash Sales!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderItems;
