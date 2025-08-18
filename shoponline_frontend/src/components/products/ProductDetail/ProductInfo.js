// src/components/products/ProductDetail/ProductInfo.js
import React from 'react';
import { Star, Award, Truck, Shield, Clock } from 'lucide-react';

const ProductInfo = ({ product, selectedVariant = null, className = '' }) => {
  if (!product) return null;

  const formatPrice = price => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getCurrentPrice = () => {
    return selectedVariant?.price || product.price || 0;
  };

  const renderRating = () => {
    if (!product.rating_average || product.review_count === 0) {
      return (
        <div className="product-rating no-rating">
          <span className="no-rating-text">No reviews yet</span>
        </div>
      );
    }

    return (
      <div className="product-rating">
        <div className="rating-stars">
          {[1, 2, 3, 4, 5].map(star => (
            <Star
              key={star}
              className={star <= Math.floor(product.rating_average) ? 'filled' : ''}
              size={16}
              fill={star <= Math.floor(product.rating_average) ? '#fbbf24' : 'none'}
            />
          ))}
        </div>
        <span className="rating-text">
          {product.rating_average.toFixed(1)} ({product.review_count} review
          {product.review_count !== 1 ? 's' : ''})
        </span>
      </div>
    );
  };

  const renderBadges = () => {
    const badges = [];

    if (product.is_on_sale) {
      badges.push(
        <span key="sale" className="product-badge product-badge--sale">
          {product.discount_percentage}% OFF
        </span>
      );
    }

    if (product.is_featured) {
      badges.push(
        <span key="featured" className="product-badge product-badge--featured">
          <Award size={12} />
          Featured
        </span>
      );
    }

    if (product.condition && product.condition !== 'new') {
      badges.push(
        <span key="condition" className="product-badge product-badge--condition">
          {product.condition.charAt(0).toUpperCase() + product.condition.slice(1)}
        </span>
      );
    }

    if (product.view_count > 1000) {
      badges.push(
        <span key="popular" className="product-badge product-badge--popular">
          Popular
        </span>
      );
    }

    return badges.length > 0 ? <div className="product-badges">{badges}</div> : null;
  };

  const renderKeyFeatures = () => {
    const features = [];

    // Add delivery feature
    features.push({
      icon: <Truck size={16} />,
      title: 'Local Delivery',
      description: 'Same day delivery in Kampala',
    });

    // Add warranty if applicable
    if (product.condition === 'new') {
      features.push({
        icon: <Shield size={16} />,
        title: 'Warranty',
        description: 'Manufacturer warranty included',
      });
    }

    // Add return policy
    features.push({
      icon: <Clock size={16} />,
      title: '7-Day Returns',
      description: 'Easy returns within 7 days',
    });

    return (
      <div className="key-features">
        <h4 className="features-title">Key Features</h4>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-item">
              <div className="feature-icon">{feature.icon}</div>
              <div className="feature-content">
                <span className="feature-title">{feature.title}</span>
                <span className="feature-description">{feature.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSpecifications = () => {
    const specs = [
      { label: 'Brand', value: product.brand },
      { label: 'Model', value: product.model },
      { label: 'Color', value: product.color },
      { label: 'Size', value: product.size },
      { label: 'Weight', value: product.weight ? `${product.weight} kg` : null },
      { label: 'Material', value: product.material },
      { label: 'SKU', value: product.sku },
    ].filter(spec => spec.value);

    if (specs.length === 0) return null;

    return (
      <div className="product-specifications">
        <h4 className="specs-title">Specifications</h4>
        <div className="specs-grid">
          {specs.map((spec, index) => (
            <div key={index} className="spec-row">
              <span className="spec-label">{spec.label}:</span>
              <span className="spec-value">{spec.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAttributes = () => {
    if (!product.attributes || product.attributes.length === 0) return null;

    return (
      <div className="product-attributes">
        <h4 className="attributes-title">Additional Features</h4>
        <ul className="attributes-list">
          {product.attributes.map(attr => (
            <li key={attr.id} className="attribute-item">
              <strong>{attr.name}:</strong> {attr.value}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderStockInfo = () => {
    const stock = selectedVariant?.stock_quantity || product.stock_quantity || 0;
    const isLowStock = stock <= (product.low_stock_threshold || 10);

    return (
      <div className="stock-information">
        {product.is_in_stock ? (
          <div className={`stock-status in-stock ${isLowStock ? 'low-stock' : ''}`}>
            <span className="stock-indicator" />
            <span className="stock-text">
              {isLowStock ? `Only ${stock} left in stock` : 'In Stock'}
            </span>
          </div>
        ) : (
          <div className="stock-status out-of-stock">
            <span className="stock-indicator" />
            <span className="stock-text">Out of Stock</span>
          </div>
        )}

        {product.track_inventory && (
          <div className="inventory-info">
            Available: {stock} unit{stock !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    );
  };

  const renderPriceHistory = () => {
    if (!product.is_on_sale) return null;

    return (
      <div className="price-history">
        <div className="price-comparison">
          <div className="price-row original">
            <span className="price-label">Original Price:</span>
            <span className="price-value">{formatPrice(product.original_price)}</span>
          </div>
          <div className="price-row current">
            <span className="price-label">Sale Price:</span>
            <span className="price-value">{formatPrice(getCurrentPrice())}</span>
          </div>
          <div className="price-row savings">
            <span className="price-label">You Save:</span>
            <span className="price-value savings-amount">
              {formatPrice(product.original_price - getCurrentPrice())} (
              {product.discount_percentage}%)
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`product-info ${className}`}>
      {/* Badges */}
      {renderBadges()}

      {/* Basic Info */}
      <div className="product-basic-info">
        <h1 className="product-title">{product.name}</h1>

        {product.short_description && (
          <p className="product-subtitle">{product.short_description}</p>
        )}

        {/* Rating */}
        {renderRating()}

        {/* Category */}
        {product.category && (
          <div className="product-category">
            <span className="category-label">Category:</span>
            <span className="category-name">{product.category.name}</span>
          </div>
        )}
      </div>

      {/* Pricing */}
      <div className="product-pricing">
        <div className="price-display">
          <span className="current-price">{formatPrice(getCurrentPrice())}</span>
          {product.original_price && product.is_on_sale && (
            <span className="original-price">{formatPrice(product.original_price)}</span>
          )}
        </div>
        {renderPriceHistory()}
      </div>

      {/* Stock Information */}
      {renderStockInfo()}

      {/* Key Features */}
      {renderKeyFeatures()}

      {/* Quick Specifications */}
      {renderSpecifications()}

      {/* Attributes */}
      {renderAttributes()}

      {/* Tags */}
      {product.tags && (
        <div className="product-tags">
          <span className="tags-label">Tags:</span>
          <div className="tags-list">
            {product.tags.split(',').map((tag, index) => (
              <span key={index} className="tag">
                {tag.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* View Count */}
      {product.view_count > 0 && (
        <div className="product-stats">
          <span className="stat-item">
            {product.view_count.toLocaleString()} view{product.view_count !== 1 ? 's' : ''}
          </span>
          {product.order_count > 0 && (
            <span className="stat-item">{product.order_count.toLocaleString()} sold</span>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductInfo;
