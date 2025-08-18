// src/pages/HomePage/FlashSalesHomepage.js
import React, { useState, useEffect, useCallback } from 'react';
import './HomePage.css';

const FlashSalesHomepage = ({ flashSales = [], onViewAll, onProductClick }) => {
  const [timeRemaining, setTimeRemaining] = useState({});
  const [currentSaleIndex, setCurrentSaleIndex] = useState(0);

  // Format price in UGX
  const formatPrice = price => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Calculate time remaining for each flash sale
  const calculateTimeRemaining = useCallback(() => {
    const now = Date.now();
    const newTimeRemaining = {};

    flashSales.forEach(sale => {
      const timeLeft = sale.time_remaining * 1000; // Convert to milliseconds
      if (timeLeft > 0) {
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

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
  }, [flashSales]);

  // Update countdown every second
  useEffect(() => {
    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [calculateTimeRemaining]);

  // Auto-rotate flash sales if multiple
  useEffect(() => {
    if (flashSales.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSaleIndex(prev => (prev + 1) % flashSales.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [flashSales.length]);

  const handleProductClick = product => {
    onProductClick?.(product);
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
    const products = sale.flash_sale_products?.slice(0, 4) || [];

    return products.map(flashProduct => {
      const product = flashProduct.product_detail || flashProduct.product;
      const discountPercentage = Math.round(
        flashProduct.discount_percentage || sale.discount_percentage
      );

      return (
        <div
          key={flashProduct.id}
          className="flash-product-card"
          onClick={() => handleProductClick(product)}
        >
          <div className="product-image-container">
            <img
              src={product.image_url || product.thumbnail_url || '/images/placeholder-product.jpg'}
              alt={product.name}
              loading="lazy"
              onError={e => {
                e.target.src = '/images/placeholder-product.jpg';
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
                Save {formatPrice(flashProduct.savings_amount)}
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
    });
  };

  if (!flashSales || flashSales.length === 0) {
    return null;
  }

  const activeFlashSales = flashSales.filter(sale => sale.is_running && !sale.is_expired);

  if (activeFlashSales.length === 0) {
    return null;
  }

  const currentSale = activeFlashSales[currentSaleIndex] || activeFlashSales[0];

  return (
    <section className="flash-sales-homepage">
      <div className="container">
        <div className="flash-sales-header">
          <div className="header-content">
            <div className="header-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
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

            <button
              className="view-all-btn flash"
              onClick={onViewAll}
            >
              View All Flash Sales
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
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
          <div className="flash-products-grid">{renderFlashSaleProducts(currentSale)}</div>

          {currentSale.flash_sale_products?.length > 4 && (
            <div className="more-products-info">
              <p>+{currentSale.flash_sale_products.length - 4} more products in this flash sale</p>
              <button
                className="view-sale-btn"
                onClick={onViewAll}
              >
                View Complete Sale
              </button>
            </div>
          )}
        </div>

        {/* Flash Sale Navigation */}
        {activeFlashSales.length > 1 && (
          <div className="flash-sales-nav">
            <div className="nav-indicators">
              {activeFlashSales.map((_, index) => (
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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
                </svg>
              </div>
              <div className="feature-text">
                <h4>Limited Time</h4>
                <p>Exclusive deals that won't last long</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div className="feature-text">
                <h4>Best Prices</h4>
                <p>Guaranteed lowest prices on selected items</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
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
          <button
            className="cta-button primary large"
            onClick={onViewAll}
          >
            Shop Flash Sales Now
          </button>
        </div>
      </div>
    </section>
  );
};

export default FlashSalesHomepage;