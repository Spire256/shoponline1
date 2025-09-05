// src/pages/HomePage/FlashSalesHomepage.js - FIXED VERSION
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { ChevronRight, Clock, Zap, Eye, ShoppingCart, Heart } from 'lucide-react';
import { FlashSalesContext } from '../../contexts/FlashSalesContext';
import { CartContext } from '../../contexts/CartContext';
import { AuthContext } from '../../contexts/AuthContext';
import Button from '../../components/common/UI/Button/Button';
import CountdownTimer from '../../components/products/FlashSales/CountdownTimer';
import './HomePage.css';

const FlashSalesHomepage = ({ 
  onViewAll, 
  onProductClick,
  className = '',
  maxProducts = 4 
}) => {
  const [timeRemaining, setTimeRemaining] = useState({});
  const [currentSaleIndex, setCurrentSaleIndex] = useState(0);

  const flashSalesContext = useContext(FlashSalesContext);
  const { addToCart } = useContext(CartContext) || {};
  const { isAuthenticated } = useContext(AuthContext) || {};

  // Use context data or fallback to empty arrays
  const activeSales = flashSalesContext?.activeSales || [];
  const loading = flashSalesContext?.isLoading?.active || false;
  const error = flashSalesContext?.error;

  // Format price in UGX
  const formatPrice = price => {
    const numPrice = parseFloat(price) || 0;
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  // Calculate time remaining for each flash sale
  const calculateTimeRemaining = useCallback(() => {
    const now = Date.now();
    const newTimeRemaining = {};

    activeSales.forEach(sale => {
      const endTime = new Date(sale.end_time).getTime();
      const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
      
      if (timeLeft > 0) {
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (24 * 3600)) / 3600);
        const minutes = Math.floor((timeLeft % 3600) / 60);
        const seconds = Math.floor(timeLeft % 60);

        newTimeRemaining[sale.id] = {
          days,
          hours,
          minutes,
          seconds,
          total: timeLeft,
        };
      } else {
        newTimeRemaining[sale.id] = {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0,
        };
      }
    });

    setTimeRemaining(newTimeRemaining);
  }, [activeSales]);

  // Update countdown every second
  useEffect(() => {
    if (activeSales.length === 0) return;

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [calculateTimeRemaining, activeSales]);

  // Auto-rotate flash sales if multiple
  useEffect(() => {
    if (activeSales.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSaleIndex(prev => (prev + 1) % activeSales.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [activeSales.length]);

  const handleProductClick = product => {
    if (onProductClick) {
      onProductClick(product);
    } else {
      // Default navigation to product page
      window.location.href = `/products/${product.slug || product.id}`;
    }
  };

  const handleAddToCart = async (product, flashSaleProduct) => {
    if (!addToCart) {
      console.warn('AddToCart function not available');
      return;
    }

    if (!product.is_in_stock || flashSaleProduct.is_sold_out) {
      console.warn('Product is out of stock');
      return;
    }

    try {
      const cartItem = {
        productId: product.id,
        variantId: null,
        quantity: 1,
        price: flashSaleProduct.flash_sale_price,
        originalPrice: flashSaleProduct.original_price,
        isFlashSale: true,
      };

      await addToCart(cartItem);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const renderCountdownTimer = saleId => {
    const time = timeRemaining[saleId];
    if (!time || time.total <= 0) {
      return <span className="timer-expired">Sale Ended</span>;
    }

    return (
      <div className="countdown-timer">
        {time.days > 0 && (
          <div className="timer-segment">
            <span className="timer-number">{time.days.toString().padStart(2, '0')}</span>
            <span className="timer-label">Days</span>
          </div>
        )}
        <div className="timer-segment">
          <span className="timer-number">{time.hours.toString().padStart(2, '0')}</span>
          <span className="timer-label">Hours</span>
        </div>
        <div className="timer-separator">:</div>
        <div className="timer-segment">
          <span className="timer-number">{time.minutes.toString().padStart(2, '0')}</span>
          <span className="timer-label">Min</span>
        </div>
        <div className="timer-separator">:</div>
        <div className="timer-segment">
          <span className="timer-number">{time.seconds.toString().padStart(2, '0')}</span>
          <span className="timer-label">Sec</span>
        </div>
      </div>
    );
  };

  const renderFlashSaleProducts = sale => {
    if (!sale.flash_sale_products || sale.flash_sale_products.length === 0) {
      return null;
    }

    const products = sale.flash_sale_products.slice(0, maxProducts);

    return products.map(flashProduct => {
      const product = flashProduct.product_detail || flashProduct.product;
      if (!product) return null;

      const discountPercentage = Math.round(
        flashProduct.discount_percentage || sale.discount_percentage || 0
      );

      return (
        <div
          key={flashProduct.id}
          className="flash-product-card"
          onClick={() => handleProductClick(product)}
        >
          <div className="product-image-container">
            <img
              src={product.image || product.image_url || product.thumbnail_url || '/api/placeholder/250/250'}
              alt={product.name}
              loading="lazy"
              onError={e => {
                e.target.src = '/api/placeholder/250/250';
              }}
            />

            <div className="flash-badge">
              <span className="discount-percent">-{discountPercentage}%</span>
            </div>

            {flashProduct.is_sold_out && (
              <div className="sold-out-overlay">
                <span>Sold Out</span>
              </div>
            )}

            <div className="product-actions">
              <button
                className="action-btn view-btn"
                onClick={e => {
                  e.stopPropagation();
                  handleProductClick(product);
                }}
                title="View Product"
              >
                <Eye size={16} />
              </button>

              {!flashProduct.is_sold_out && product.is_in_stock !== false && (
                <button
                  className="action-btn cart-btn"
                  onClick={e => {
                    e.stopPropagation();
                    handleAddToCart(product, flashProduct);
                  }}
                  title="Add to Cart"
                >
                  <ShoppingCart size={16} />
                </button>
              )}

              {isAuthenticated && (
                <button
                  className="action-btn wishlist-btn"
                  onClick={e => {
                    e.stopPropagation();
                    // Handle wishlist toggle
                  }}
                  title="Add to Wishlist"
                >
                  <Heart size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="product-info">
            <h4 className="product-name" title={product.name}>
              {product.name.length > 40 ? `${product.name.substring(0, 40)}...` : product.name}
            </h4>

            <div className="product-pricing">
              <span className="flash-price">{formatPrice(flashProduct.flash_sale_price)}</span>
              <span className="original-price">{formatPrice(flashProduct.original_price)}</span>
            </div>

            <div className="savings-info">
              <span className="savings-amount">
                Save {formatPrice(flashProduct.original_price - flashProduct.flash_sale_price)}
              </span>
            </div>

            {flashProduct.stock_limit && (
              <div className="stock-progress">
                <div className="stock-info">
                  <span>Sold: {flashProduct.sold_quantity}</span>
                  <span>Available: {flashProduct.stock_limit - flashProduct.sold_quantity}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(flashProduct.sold_quantity / flashProduct.stock_limit) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }).filter(Boolean);
  };

  // Loading state
  if (loading) {
    return (
      <section className={`flash-sales-homepage loading ${className}`}>
        <div className="container">
          <div className="flash-sales-header">
            <div className="header-content">
              <div className="header-badge">
                <Zap />
                <span>Flash Sale</span>
              </div>
              <h2 className="section-title">Loading Flash Sales...</h2>
            </div>
          </div>
          <div className="loading-content">
            <div className="loading-spinner" />
            <p>Loading amazing deals...</p>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className={`flash-sales-homepage error ${className}`}>
        <div className="container">
          <div className="flash-sales-header">
            <div className="header-content">
              <div className="header-badge">
                <Zap />
                <span>Flash Sale</span>
              </div>
              <h2 className="section-title">Flash Sales Unavailable</h2>
              <p className="section-subtitle">Please try again later</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // No active sales
  if (!activeSales || activeSales.length === 0) {
    return null;
  }

  const currentSale = activeSales[currentSaleIndex] || activeSales[0];
  const saleProducts = renderFlashSaleProducts(currentSale);

  // Don't render if no products
  if (!saleProducts || saleProducts.length === 0) {
    return null;
  }

  return (
    <section className={`flash-sales-homepage ${className}`}>
      <div className="container">
        <div className="flash-sales-header">
          <div className="header-content">
            <div className="header-badge">
              <Zap />
              <span>Flash Sale</span>
            </div>

            <h2 className="section-title">
              {currentSale.name}
              <span className="discount-highlight">
                {Math.round(currentSale.discount_percentage)}% OFF
              </span>
            </h2>

            {currentSale.description && (
              <p className="section-subtitle">{currentSale.description}</p>
            )}
          </div>

          <div className="header-actions">
            <div className="timer-container">
              <span className="timer-label">Ends in:</span>
              {renderCountdownTimer(currentSale.id)}
            </div>

            {onViewAll && (
              <Button
                variant="outline"
                onClick={onViewAll}
                className="view-all-btn flash"
              >
                View All Flash Sales
                <ChevronRight size={16} />
              </Button>
            )}
          </div>
        </div>

        {/* Flash Sale Banner */}
        {currentSale.banner_image && (
          <div className="flash-sale-banner">
            <img
              src={currentSale.banner_image}
              alt={currentSale.name}
              loading="lazy"
            />
            <div className="banner-overlay">
              <div className="banner-content">
                <h3>Don't Miss Out!</h3>
                <p>Limited time offer with amazing savings</p>
              </div>
            </div>
          </div>
        )}

        {/* Flash Sale Products */}
        <div className="flash-products-section">
          <div className="flash-products-grid">{saleProducts}</div>

          {currentSale.flash_sale_products?.length > maxProducts && (
            <div className="more-products-info">
              <p>+{currentSale.flash_sale_products.length - maxProducts} more products in this flash sale</p>
              {onViewAll && (
                <Button
                  variant="link"
                  onClick={onViewAll}
                  className="view-sale-btn"
                >
                  View Complete Sale
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Flash Sale Navigation */}
        {activeSales.length > 1 && (
          <div className="flash-sales-nav">
            <div className="nav-indicators">
              {activeSales.map((_, index) => (
                <button
                  key={index}
                  className={`nav-dot ${index === currentSaleIndex ? 'active' : ''}`}
                  onClick={() => setCurrentSaleIndex(index)}
                  aria-label={`View flash sale ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Flash Sale Features */}
        <div className="flash-sale-features">
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">
                <Clock />
              </div>
              <div className="feature-text">
                <h4>Limited Time</h4>
                <p>Exclusive deals that won't last long</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <Zap />
              </div>
              <div className="feature-text">
                <h4>Best Prices</h4>
                <p>Guaranteed lowest prices on selected items</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <Eye />
              </div>
              <div className="feature-text">
                <h4>Quality Assured</h4>
                <p>All flash sale items maintain our quality standards</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile CTA */}
        <div className="mobile-flash-cta">
          {onViewAll && (
            <Button
              variant="primary"
              size="large"
              onClick={onViewAll}
              className="cta-button"
            >
              Shop Flash Sales Now
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};

export default FlashSalesHomepage;