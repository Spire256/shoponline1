// src/components/checkout/Checkout/OrderSummary.js
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../../utils/helpers/currencyHelpers';

const OrderSummary = ({
  items = [],
  total = 0,
  currentStep,
  order = null,
  showEditButton = true,
}) => {
  const navigate = useNavigate();
  const [showAllItems, setShowAllItems] = useState(false);

  // Calculate order totals
  const calculations = useMemo(() => {
    if (order) {
      return {
        subtotal: parseFloat(order.subtotal || 0),
        taxAmount: parseFloat(order.tax_amount || 0),
        deliveryFee: parseFloat(order.delivery_fee || 0),
        discountAmount: parseFloat(order.discount_amount || 0),
        flashSaleSavings: parseFloat(order.flash_sale_savings || 0),
        total: parseFloat(order.total_amount || 0),
      };
    }

    // Calculate from cart items
    const subtotal = items.reduce((sum, item) => {
      const itemPrice = parseFloat(item.price || 0);
      const itemQuantity = parseInt(item.quantity || 0);
      return sum + itemPrice * itemQuantity;
    }, 0);

    const flashSaleSavings = items.reduce((sum, item) => {
      if (item.is_flash_sale && item.original_price) {
        const savings =
          (parseFloat(item.original_price) - parseFloat(item.price)) * parseInt(item.quantity);
        return sum + savings;
      }
      return sum;
    }, 0);

    const taxAmount = 0; // No tax for now
    const deliveryFee = 0; // No delivery fee for now
    const discountAmount = 0; // No additional discounts

    return {
      subtotal,
      taxAmount,
      deliveryFee,
      discountAmount,
      flashSaleSavings,
      total: subtotal + taxAmount + deliveryFee - discountAmount,
    };
  }, [items, order]);

  const displayItems = order ? order.items : items;
  const itemsToShow = showAllItems ? displayItems : displayItems.slice(0, 3);
  const hasMoreItems = displayItems.length > 3;

  const handleEditCart = () => {
    navigate('/cart');
  };

  const handleToggleItems = () => {
    setShowAllItems(!showAllItems);
  };

  const formatItemPrice = item => {
    if (order) {
      return formatCurrency(parseFloat(item.unit_price || 0));
    }
    return formatCurrency(parseFloat(item.price || 0));
  };

  const getItemImage = item => {
    if (order) {
      return item.product_image || '/images/placeholder-product.jpg';
    }
    return item.image || '/images/placeholder-product.jpg';
  };

  const getItemName = item => {
    if (order) {
      return item.product_name;
    }
    return item.name;
  };

  const getItemQuantity = item => {
    return parseInt(item.quantity || 0);
  };

  return (
    <div className="order-summary">
      <div className="summary-header">
        <h3>Order Summary</h3>
        {showEditButton && currentStep !== 'confirmation' && (
          <button type="button" className="btn-edit-cart" onClick={handleEditCart}>
            <i className="fas fa-edit" />
            Edit Cart
          </button>
        )}
      </div>

      <div className="summary-items">
        <div className="items-list">
          {itemsToShow.map((item, index) => (
            <div key={index} className="summary-item">
              <div className="item-image">
                <img
                  src={getItemImage(item)}
                  alt={getItemName(item)}
                  onError={e => {
                    e.target.src = '/images/placeholder-product.jpg';
                  }}
                />
              </div>

              <div className="item-details">
                <div className="item-name">
                  {getItemName(item)}
                  {order && item.is_flash_sale_item && (
                    <span className="flash-sale-badge">
                      <i className="fas fa-bolt" />
                      Flash Sale
                    </span>
                  )}
                </div>

                <div className="item-price-qty">
                  <span className="item-quantity">Qty: {getItemQuantity(item)}</span>
                  <span className="item-price">
                    {formatItemPrice(item)}
                    {order && item.is_flash_sale_item && item.original_price && (
                      <span className="original-price">
                        {formatCurrency(parseFloat(item.original_price))}
                      </span>
                    )}
                  </span>
                </div>

                <div className="item-total">
                  Total:{' '}
                  {formatCurrency(
                    parseFloat(formatItemPrice(item).replace(/[^0-9.]/g, '')) *
                      getItemQuantity(item)
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {hasMoreItems && (
          <button type="button" className="btn-toggle-items" onClick={handleToggleItems}>
            {showAllItems ? (
              <>
                <i className="fas fa-chevron-up" />
                Show Less ({displayItems.length - 3} less)
              </>
            ) : (
              <>
                <i className="fas fa-chevron-down" />
                Show More ({displayItems.length - 3} more)
              </>
            )}
          </button>
        )}
      </div>

      <div className="summary-totals">
        <div className="total-row subtotal">
          <span>Subtotal</span>
          <span>{formatCurrency(calculations.subtotal)}</span>
        </div>

        {calculations.flashSaleSavings > 0 && (
          <div className="total-row savings">
            <span>
              <i className="fas fa-bolt" />
              Flash Sale Savings
            </span>
            <span className="savings-amount">-{formatCurrency(calculations.flashSaleSavings)}</span>
          </div>
        )}

        {calculations.discountAmount > 0 && (
          <div className="total-row discount">
            <span>Discount</span>
            <span className="discount-amount">-{formatCurrency(calculations.discountAmount)}</span>
          </div>
        )}

        {calculations.taxAmount > 0 && (
          <div className="total-row tax">
            <span>Tax</span>
            <span>{formatCurrency(calculations.taxAmount)}</span>
          </div>
        )}

        {calculations.deliveryFee > 0 && (
          <div className="total-row delivery">
            <span>Delivery Fee</span>
            <span>{formatCurrency(calculations.deliveryFee)}</span>
          </div>
        )}

        <div className="total-row final-total">
          <span>Total</span>
          <span className="total-amount">{formatCurrency(calculations.total)}</span>
        </div>
      </div>

      {/* Security badges */}
      <div className="summary-security">
        <div className="security-badges">
          <div className="security-badge">
            <i className="fas fa-shield-alt" />
            <span>Secure Checkout</span>
          </div>
          <div className="security-badge">
            <i className="fas fa-lock" />
            <span>SSL Protected</span>
          </div>
        </div>

        <div className="payment-methods-accepted">
          <p>We Accept:</p>
          <div className="payment-logos">
            <img src="/images/payment/mtn-logo.png" alt="MTN Mobile Money" />
            <img src="/images/payment/airtel-logo.png" alt="Airtel Money" />
            <img src="/images/payment/cod-icon.png" alt="Cash on Delivery" />
          </div>
        </div>
      </div>

      {/* Order progress for mobile */}
      {currentStep && (
        <div className="summary-progress mobile-only">
          <div className="progress-info">
            <span>
              {currentStep === 'customer_info' && 'Complete your details to continue'}
              {currentStep === 'payment' && 'Choose your payment method'}
              {currentStep === 'confirmation' && 'Order confirmed!'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderSummary;
