// src/pages/HomePage/CategoryShowcase.js
import React, { useState } from 'react';
import './HomePage.css';

const CategoryShowcase = ({ categories = [], onCategoryClick, onViewAll }) => {
  const [imageLoadErrors, setImageLoadErrors] = useState(new Set());

  const handleImageError = categoryId => {
    setImageLoadErrors(prev => new Set([...prev, categoryId]));
  };

  const getImageUrl = category => {
    if (imageLoadErrors.has(category.id)) {
      return '/images/placeholder-category.jpg';
    }
    return category.image_url || category.image || '/images/placeholder-category.jpg';
  };

  const handleCategoryClick = category => {
    onCategoryClick?.(category);
  };

  if (!categories || categories.length === 0) {
    return null;
  }

  // Split categories into main and secondary for different layouts
  const mainCategories = categories.slice(0, 3);
  const secondaryCategories = categories.slice(3, 6);

  return (
    <section className="category-showcase">
      <div className="container">
        <div className="section-header">
          <div className="section-title-group">
            <h2 className="section-title">Shop by Category</h2>
            <p className="section-subtitle">Explore our diverse range of products</p>
          </div>

          <button className="view-all-btn" onClick={onViewAll}>
            View All Categories
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>

        <div className="categories-content">
          {/* Main Categories Grid */}
          <div className="main-categories">
            {mainCategories.map((category, index) => (
              <div
                key={category.id}
                className={`category-card main ${index === 0 ? 'featured' : ''}`}
                onClick={() => handleCategoryClick(category)}
              >
                <div className="category-image-container">
                  <img
                    src={getImageUrl(category)}
                    alt={category.name}
                    loading="lazy"
                    onError={() => handleImageError(category.id)}
                  />
                  <div className="category-overlay">
                    <div className="overlay-gradient" />
                    <div className="category-content">
                      <h3 className="category-name">{category.name}</h3>
                      {category.description && (
                        <p className="category-description">
                          {category.description.length > 80
                            ? `${category.description.substring(0, 80)}...`
                            : category.description}
                        </p>
                      )}
                      <div className="category-stats">
                        <span className="product-count">
                          {category.product_count || 0} Products
                        </span>
                      </div>
                      <div className="category-cta">
                        <span className="cta-text">Shop Now</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Secondary Categories */}
          {secondaryCategories.length > 0 && (
            <div className="secondary-categories">
              {secondaryCategories.map(category => (
                <div
                  key={category.id}
                  className="category-card secondary"
                  onClick={() => handleCategoryClick(category)}
                >
                  <div className="category-image-container">
                    <img
                      src={getImageUrl(category)}
                      alt={category.name}
                      loading="lazy"
                      onError={() => handleImageError(category.id)}
                    />
                    <div className="category-overlay">
                      <div className="overlay-gradient" />
                    </div>
                  </div>
                  <div className="category-info">
                    <h4 className="category-name">{category.name}</h4>
                    <span className="product-count">{category.product_count || 0} Products</span>
                    <div className="category-arrow">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Features */}
        <div className="category-features">
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div className="feature-content">
                <h4>Premium Quality</h4>
                <p>All products are carefully selected for quality</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 11H1v12h22V11H15M9 11V7a4 4 0 1 1 8 0v4M9 11h6" />
                </svg>
              </div>
              <div className="feature-content">
                <h4>Secure Shopping</h4>
                <p>Your data and payments are always protected</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
                </svg>
              </div>
              <div className="feature-content">
                <h4>Fast Delivery</h4>
                <p>Quick delivery within Kampala and surrounding areas</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M14 9V5a3 3 0 0 0-6 0v4" />
                  <rect x="2" y="9" width="20" height="12" rx="2" ry="2" />
                </svg>
              </div>
              <div className="feature-content">
                <h4>Easy Returns</h4>
                <p>Hassle-free returns within 7 days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile view all button */}
        <div className="mobile-view-all">
          <button className="view-all-btn mobile" onClick={onViewAll}>
            Explore All Categories
          </button>
        </div>
      </div>
    </section>
  );
};

export default CategoryShowcase;
