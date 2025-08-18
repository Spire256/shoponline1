import React, { useState, useContext } from 'react';
import { ShoppingCart, Heart, Share2, Eye, Plus, Minus, AlertCircle } from 'lucide-react';
import { CartContext } from '../../../contexts/CartContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { NotificationContext } from '../../../contexts/NotificationContext';
import { FlashSalesContext } from '../../../contexts/FlashSalesContext';
import Button from '../../common/UI/Button/Button';
import { format_ugx_currency } from '../../../utils/helpers/currencyHelpers';
import './ProductActions.css';

const ProductActions = ({ product, variant = null, onVariantChange = null }) => {
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { addToCart, isProductInCart, getProductQuantityInCart } = useContext(CartContext);
  const { user, isAuthenticated } = useContext(AuthContext);
  const { showNotification } = useContext(NotificationContext);
  const { getProductFlashSalePrice, isProductInFlashSale } = useContext(FlashSalesContext);

  // Get current product pricing (including flash sale pricing)
  const getCurrentPricing = () => {
    const flashSaleInfo = getProductFlashSalePrice(product.id);

    if (flashSaleInfo && isProductInFlashSale(product.id)) {
      return {
        currentPrice: flashSaleInfo.flash_sale_price,
        originalPrice: flashSaleInfo.original_price,
        savings: flashSaleInfo.savings,
        discountPercentage: flashSaleInfo.discount_percentage,
        isOnSale: true,
        isFlashSale: true,
      };
    }

    return {
      currentPrice: variant ? variant.price : product.price,
      originalPrice: product.original_price,
      savings: product.original_price ? product.original_price - product.price : 0,
      discountPercentage: product.discount_percentage || 0,
      isOnSale: product.is_on_sale || false,
      isFlashSale: false,
    };
  };

  const pricing = getCurrentPricing();
  const isInCart = isProductInCart(product.id, variant?.id);
  const cartQuantity = getProductQuantityInCart(product.id, variant?.id);

  // Check stock availability
  const getStockInfo = () => {
    if (variant) {
      return {
        isInStock: variant.is_in_stock && variant.stock_quantity > 0,
        stockQuantity: variant.stock_quantity,
        maxQuantity: Math.min(variant.stock_quantity, 10),
      };
    }

    return {
      isInStock: product.is_in_stock && product.stock_quantity > 0,
      stockQuantity: product.stock_quantity,
      maxQuantity: Math.min(product.stock_quantity, 10),
    };
  };

  const stockInfo = getStockInfo();

  const handleQuantityChange = change => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= stockInfo.maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    if (!stockInfo.isInStock) {
      showNotification('Product is out of stock', 'error');
      return;
    }

    if (quantity > stockInfo.stockQuantity) {
      showNotification(`Only ${stockInfo.stockQuantity} items available`, 'error');
      return;
    }

    setIsLoading(true);

    try {
      const cartItem = {
        productId: product.id,
        variantId: variant?.id || null,
        quantity: quantity,
        price: pricing.currentPrice,
        originalPrice: pricing.originalPrice,
        isFlashSale: pricing.isFlashSale,
      };

      await addToCart(cartItem);

      showNotification(`${product.name} added to cart successfully!`, 'success');

      // Reset quantity to 1 after adding
      setQuantity(1);
    } catch (error) {
      showNotification(error.message || 'Failed to add product to cart', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!stockInfo.isInStock) {
      showNotification('Product is out of stock', 'error');
      return;
    }

    setIsLoading(true);

    try {
      // Add to cart first
      const cartItem = {
        productId: product.id,
        variantId: variant?.id || null,
        quantity: quantity,
        price: pricing.currentPrice,
        originalPrice: pricing.originalPrice,
        isFlashSale: pricing.isFlashSale,
      };

      await addToCart(cartItem);

      // Redirect to checkout
      window.location.href = '/checkout';
    } catch (error) {
      showNotification(error.message || 'Failed to proceed to checkout', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      showNotification('Please login to add items to wishlist', 'info');
      return;
    }

    setIsWishlisted(!isWishlisted);
    showNotification(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist', 'success');
  };

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: product.short_description || product.description,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to copying URL
        await navigator.clipboard.writeText(window.location.href);
        showNotification('Product link copied to clipboard!', 'success');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <div className="product-actions">
      {/* Pricing Section */}
      <div className="product-pricing">
        <div className="price-container">
          <span className="current-price">{format_ugx_currency(pricing.currentPrice)}</span>

          {pricing.originalPrice && pricing.isOnSale && (
            <span className="original-price">{format_ugx_currency(pricing.originalPrice)}</span>
          )}

          {pricing.isFlashSale && (
            <div className="flash-sale-badge">
              <span className="flash-icon">⚡</span>
              Flash Sale
            </div>
          )}
        </div>

        {pricing.isOnSale && (
          <div className="savings-info">
            <span className="discount-badge">-{pricing.discountPercentage}%</span>
            <span className="savings-text">You save {format_ugx_currency(pricing.savings)}</span>
          </div>
        )}
      </div>

      {/* Stock Status */}
      <div className={`stock-status ${stockInfo.isInStock ? 'in-stock' : 'out-of-stock'}`}>
        {stockInfo.isInStock ? (
          <div className="stock-info">
            <span className="stock-indicator" />
            <span className="stock-text">
              {stockInfo.stockQuantity > 10 ? 'In Stock' : `Only ${stockInfo.stockQuantity} left`}
            </span>
          </div>
        ) : (
          <div className="stock-info">
            <AlertCircle className="stock-icon" size={16} />
            <span className="stock-text">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Quantity Selector */}
      {stockInfo.isInStock && (
        <div className="quantity-selector">
          <label className="quantity-label">Quantity:</label>
          <div className="quantity-controls">
            <button
              className="quantity-btn"
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus size={16} />
            </button>

            <input
              type="number"
              className="quantity-input"
              value={quantity}
              min="1"
              max={stockInfo.maxQuantity}
              onChange={e => {
                const value = parseInt(e.target.value) || 1;
                if (value >= 1 && value <= stockInfo.maxQuantity) {
                  setQuantity(value);
                }
              }}
            />

            <button
              className="quantity-btn"
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= stockInfo.maxQuantity}
              aria-label="Increase quantity"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons">
        {stockInfo.isInStock ? (
          <div className="primary-actions">
            <Button
              variant="primary"
              size="large"
              onClick={handleAddToCart}
              disabled={isLoading}
              className="add-to-cart-btn"
            >
              <ShoppingCart size={20} />
              {isInCart ? `In Cart (${cartQuantity})` : 'Add to Cart'}
            </Button>

            <Button
              variant="secondary"
              size="large"
              onClick={handleBuyNow}
              disabled={isLoading}
              className="buy-now-btn"
            >
              Buy Now
            </Button>
          </div>
        ) : (
          <div className="out-of-stock-actions">
            <Button variant="outline" size="large" disabled={true} className="out-of-stock-btn">
              Out of Stock
            </Button>

            {isAuthenticated && (
              <Button
                variant="link"
                size="medium"
                onClick={() => showNotification("We'll notify you when back in stock", 'info')}
                className="notify-btn"
              >
                Notify When Available
              </Button>
            )}
          </div>
        )}

        {/* Secondary Actions */}
        <div className="secondary-actions">
          <button
            className={`action-btn wishlist-btn ${isWishlisted ? 'wishlisted' : ''}`}
            onClick={handleWishlistToggle}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart size={20} fill={isWishlisted ? '#ef4444' : 'none'} />
            <span className="action-text">{isWishlisted ? 'Wishlisted' : 'Wishlist'}</span>
          </button>

          <button className="action-btn share-btn" onClick={handleShare} aria-label="Share product">
            <Share2 size={20} />
            <span className="action-text">Share</span>
          </button>
        </div>
      </div>

      {/* Additional Info */}
      {pricing.isFlashSale && (
        <div className="flash-sale-info">
          <div className="flash-sale-timer">
            <span className="timer-label">Flash Sale ends in:</span>
            {/* This would be connected to a countdown timer component */}
            <span className="timer-display">2h 45m 30s</span>
          </div>
        </div>
      )}

      {/* Delivery Info */}
      <div className="delivery-info">
        <div className="delivery-item">
          <span className="delivery-icon">🚚</span>
          <span className="delivery-text">Free delivery within Kampala</span>
        </div>

        <div className="delivery-item">
          <span className="delivery-icon">📦</span>
          <span className="delivery-text">Same day delivery available</span>
        </div>

        <div className="delivery-item">
          <span className="delivery-icon">💰</span>
          <span className="delivery-text">Cash on Delivery available</span>
        </div>
      </div>

      {/* Product Views */}
      <div className="product-stats">
        <div className="stats-item">
          <Eye size={16} />
          <span>{product.view_count || 0} views</span>
        </div>

        {product.rating_average > 0 && (
          <div className="stats-item">
            <span className="rating-stars">{'★'.repeat(Math.round(product.rating_average))}</span>
            <span>({product.review_count} reviews)</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductActions;
