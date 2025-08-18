// src/pages/HomePage/FeaturedProducts.js
import React, { useState, useRef, useEffect } from 'react';
import './HomePage.css';

const FeaturedProducts = ({ products = [], onProductClick, onViewAll }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollContainerRef = useRef(null);
  const itemWidth = 280; // Width of each product card + margin
  const visibleItems = 4; // Number of items visible at once

  const canScrollLeft = currentIndex > 0;
  const canScrollRight = currentIndex < products.length - visibleItems;

  const formatPrice = price => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const scrollToIndex = index => {
    if (scrollContainerRef.current && !isScrolling) {
      setIsScrolling(true);
      const newIndex = Math.max(0, Math.min(index, products.length - visibleItems));
      setCurrentIndex(newIndex);

      scrollContainerRef.current.scrollTo({
        left: newIndex * itemWidth,
        behavior: 'smooth',
      });

      setTimeout(() => setIsScrolling(false), 300);
    }
  };

  const scrollLeft = () => {
    scrollToIndex(currentIndex - 1);
  };

  const scrollRight = () => {
    scrollToIndex(currentIndex + 1);
  };

  const handleProductClick = product => {
    // Extract product details from the featured product object
    const productData = product.product_details || product;
    onProductClick?.(productData);
  };

  const renderProductCard = product => {
    const productData = product.product_details || product;
    const isOnSale = productData.original_price && productData.price < productData.original_price;
    const discountPercentage = isOnSale
      ? Math.round(
        ((productData.original_price - productData.price) / productData.original_price) * 100
      )
      : 0;

    return (
      <div
        key={product.id || productData.id}
        className="product-card featured"
        onClick={() => handleProductClick(product)}
      >
        <div className="product-image-container">
          <img
            src={
              productData.image_url ||
              productData.thumbnail_url ||
              '/images/placeholder-product.jpg'
            }
            alt={productData.name}
            loading="lazy"
            onError={e => {
              e.target.src = '/images/placeholder-product.jpg';
            }}
          />

          {/* Badges */}
          <div className="product-badges">
            {productData.is_featured && <span className="badge featured">Featured</span>}
            {isOnSale && <span className="badge sale">-{discountPercentage}%</span>}
            {!productData.is_in_stock && <span className="badge out-of-stock">Out of Stock</span>}
          </div>

          {/* Quick actions overlay */}
          <div className="product-overlay">
            <div className="product-actions">
              <button
                className="action-btn view"
                onClick={e => {
                  e.stopPropagation();
                  handleProductClick(product);
                }}
                aria-label="View product details"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="product-info">
          <div className="product-category">{productData.category?.name || 'Products'}</div>

          <h3 className="product-name" title={productData.name}>
            {productData.name}
          </h3>

          {productData.short_description && (
            <p className="product-description">
              {productData.short_description.length > 60
                ? `${productData.short_description.substring(0, 60)}...`
                : productData.short_description}
            </p>
          )}

          <div className="product-pricing">
            <span className="current-price">{formatPrice(productData.price)}</span>
            {isOnSale && (
              <span className="original-price">{formatPrice(productData.original_price)}</span>
            )}
          </div>

          {/* Rating */}
          {productData.rating_average > 0 && (
            <div className="product-rating">
              <div className="stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <svg
                    key={star}
                    className={star <= productData.rating_average ? 'filled' : ''}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <span className="rating-count">({productData.review_count})</span>
            </div>
          )}

          <div className="product-footer">
            {productData.is_in_stock ? (
              <div className="stock-status in-stock">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
                <span>In Stock</span>
              </div>
            ) : (
              <div className="stock-status out-of-stock">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m15 9-6 6" />
                  <path d="m9 9 6 6" />
                </svg>
                <span>Out of Stock</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="featured-products">
      <div className="container">
        <div className="section-header">
          <div className="section-title-group">
            <h2 className="section-title">Featured Products</h2>
            <p className="section-subtitle">Handpicked items just for you</p>
          </div>

          <div className="section-actions">
            {products.length > visibleItems && (
              <div className="scroll-controls">
                <button
                  className={`scroll-btn prev ${!canScrollLeft ? 'disabled' : ''}`}
                  onClick={scrollLeft}
                  disabled={!canScrollLeft}
                  aria-label="Scroll left"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <button
                  className={`scroll-btn next ${!canScrollRight ? 'disabled' : ''}`}
                  onClick={scrollRight}
                  disabled={!canScrollRight}
                  aria-label="Scroll right"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>
            )}

            <button className="view-all-btn" onClick={onViewAll}>
              View All Featured
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        <div className="products-container">
          <div
            className="products-scroll"
            ref={scrollContainerRef}
            style={{
              scrollSnapType: 'x mandatory',
              scrollBehavior: 'smooth',
            }}
          >
            <div className="products-grid">{products.map(renderProductCard)}</div>
          </div>

          {/* Scroll indicators */}
          {products.length > visibleItems && (
            <div className="scroll-indicators">
              {Array.from({ length: Math.ceil(products.length / visibleItems) }).map((_, index) => (
                <button
                  key={index}
                  className={`indicator ${
                    Math.floor(currentIndex / visibleItems) === index ? 'active' : ''
                  }`}
                  onClick={() => scrollToIndex(index * visibleItems)}
                  aria-label={`Go to page ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Mobile view all button */}
        <div className="mobile-view-all">
          <button className="view-all-btn mobile" onClick={onViewAll}>
            View All Featured Products
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
