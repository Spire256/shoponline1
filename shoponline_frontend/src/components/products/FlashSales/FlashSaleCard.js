import React, { useState, useContext } from 'react';
import { ShoppingCart, Heart, Eye, Zap, Clock, AlertCircle } from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import Button from '../../common/UI/Button/Button';
import { CartContext } from '../../../contexts/CartContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { NotificationContext } from '../../../contexts/NotificationContext';
import { format_ugx_currency } from '../../../utils/helpers/currencyHelpers';
import './FlashSales.css';

const FlashSaleCard = ({
  product,
  flashSale,
  showTimer = true,
  compact = false,
  className = '',
}) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { addToCart, isProductInCart } = useContext(CartContext);
  const { isAuthenticated } = useContext(AuthContext);
  const { showNotification } = useContext(NotificationContext);

  const handleAddToCart = async () => {
    if (!product.is_in_stock || product.is_sold_out) {
      showNotification('Product is out of stock', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const cartItem = {
        productId: product.id,
        variantId: null,
        quantity: 1,
        price: product.flash_sale_price,
        originalPrice: product.original_price,
        isFlashSale: true,
      };

      await addToCart(cartItem);
      showNotification('Added to cart successfully!', 'success');
    } catch (error) {
      showNotification('Failed to add to cart', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWishlistToggle = () => {
    if (!isAuthenticated) {
      showNotification('Please login to add to wishlist', 'info');
      return;
    }

    setIsWishlisted(!isWishlisted);
    showNotification(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist', 'success');
  };

  const handleProductClick = () => {
    window.location.href = `/products/${product.id}`;
  };

  const getStockPercentage = () => {
    if (!product.stock_limit) return 100;
    return ((product.stock_limit - product.sold_quantity) / product.stock_limit) * 100;
  };

  const stockPercentage = getStockPercentage();
  const isInCart = isProductInCart(product.id);

  return (
    <div className={`flash-sale-card ${compact ? 'compact' : ''} ${className}`}>
      {/* Flash Sale Badge */}
      <div className="flash-sale-badge">
        <Zap size={14} />
        <span>Flash Sale</span>
      </div>

      {/* Discount Badge */}
      <div className="discount-badge">-{product.discount_percentage}%</div>

      {/* Product Image */}
      <div className="product-image-container" onClick={handleProductClick}>
        <img
          src={product.image_url || '/api/placeholder/250/250'}
          alt={product.name}
          className="product-image"
          loading="lazy"
        />

        {/* Overlay Actions */}
        <div className="image-overlay">
          <div className="overlay-actions">
            <button
              className="overlay-btn"
              onClick={e => {
                e.stopPropagation();
                handleProductClick();
              }}
              aria-label="View product"
            >
              <Eye size={16} />
            </button>

            <button
              className={`overlay-btn wishlist ${isWishlisted ? 'active' : ''}`}
              onClick={e => {
                e.stopPropagation();
                handleWishlistToggle();
              }}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart size={16} fill={isWishlisted ? '#ef4444' : 'none'} />
            </button>
          </div>
        </div>

        {/* Stock Status Overlay */}
        {(product.is_sold_out || !product.is_in_stock) && (
          <div className="stock-overlay">
            <span className="stock-status">Sold Out</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="product-info">
        <div className="product-category">{product.category?.name || 'Flash Sale'}</div>

        <h3 className="product-name" onClick={handleProductClick} title={product.name}>
          {product.name}
        </h3>

        {/* Pricing */}
        <div className="product-pricing">
          <div className="flash-price">{format_ugx_currency(product.flash_sale_price)}</div>

          {product.original_price && (
            <div className="original-price">{format_ugx_currency(product.original_price)}</div>
          )}

          <div className="savings">
            Save {format_ugx_currency(product.original_price - product.flash_sale_price)}
          </div>
        </div>

        {/* Stock Progress */}
        {product.stock_limit && !compact && (
          <div className="stock-progress">
            <div className="progress-header">
              <span className="progress-label">
                {product.sold_quantity}/{product.stock_limit} sold
              </span>
              <span className="progress-percentage">
                {Math.round((product.sold_quantity / product.stock_limit) * 100)}%
              </span>
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(100, (product.sold_quantity / product.stock_limit) * 100)}%`,
                }}
              />
            </div>

            <div className="stock-remaining">
              <AlertCircle size={12} />
              <span>Only {product.stock_limit - product.sold_quantity} left!</span>
            </div>
          </div>
        )}

        {/* Timer */}
        {showTimer && flashSale && !compact && (
          <div className="card-timer">
            <Clock size={14} />
            <CountdownTimer
              endTime={flashSale.end_time}
              format="compact"
              className="inline-timer"
            />
          </div>
        )}

        {/* Actions */}
        <div className="product-actions">
          {product.is_in_stock && !product.is_sold_out ? (
            <Button
              variant="primary"
              size={compact ? 'small' : 'medium'}
              onClick={handleAddToCart}
              disabled={isLoading}
              className="add-to-cart-btn"
            >
              <ShoppingCart size={16} />
              {isInCart ? 'In Cart' : 'Add to Cart'}
            </Button>
          ) : (
            <Button
              variant="outline"
              size={compact ? 'small' : 'medium'}
              disabled
              className="sold-out-btn"
            >
              Sold Out
            </Button>
          )}

          {!compact && (
            <Button
              variant="link"
              size="small"
              onClick={handleProductClick}
              className="view-details-btn"
            >
              View Details
            </Button>
          )}
        </div>

        {/* Flash Sale Info */}
        {!compact && (
          <div className="flash-sale-info">
            <div className="sale-name">{flashSale?.name}</div>
            <div className="urgency-text">⚡ Limited time offer!</div>
          </div>
        )}
      </div>

      {/* Compact Timer */}
      {showTimer && flashSale && compact && (
        <div className="compact-timer">
          <CountdownTimer endTime={flashSale.end_time} format="minimal" className="mini-timer" />
        </div>
      )}
    </div>
  );
};

export default FlashSaleCard;
