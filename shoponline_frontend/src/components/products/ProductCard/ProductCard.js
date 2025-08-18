// src/components/products/ProductCard/ProductCard.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Eye, Star } from 'lucide-react';
import ProductBadge from './ProductBadge';
import './ProductCard.css';

const ProductCard = ({
  product,
  onAddToCart,
  onToggleWishlist,
  onQuickView,
  showQuickActions = true,
  className = '',
  size = 'medium', // 'small', 'medium', 'large'
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const handleAddToCart = e => {
    e.preventDefault();
    e.stopPropagation();
    if (product.is_in_stock && onAddToCart) {
      onAddToCart(product);
    }
  };

  const handleToggleWishlist = e => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    if (onToggleWishlist) {
      onToggleWishlist(product);
    }
  };

  const handleQuickView = e => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(product);
    }
  };

  const formatPrice = price => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const renderRating = () => {
    if (!product.rating_average || product.review_count === 0) {
      return null;
    }

    return (
      <div className="product-card__rating">
        <div className="rating-stars">
          {[1, 2, 3, 4, 5].map(star => (
            <Star
              key={star}
              className={`star ${star <= Math.floor(product.rating_average) ? 'filled' : ''}`}
              size={14}
            />
          ))}
        </div>
        <span className="rating-text">
          {product.rating_average.toFixed(1)} ({product.review_count})
        </span>
      </div>
    );
  };

  return (
    <div className={`product-card product-card--${size} ${className}`}>
      <Link to={`/products/${product.slug}`} className="product-card__link">
        {/* Product Badges */}
        <div className="product-card__badges">
          {product.is_on_sale && (
            <ProductBadge type="sale" text={`${product.discount_percentage}% OFF`} />
          )}
          {product.is_featured && !product.is_on_sale && (
            <ProductBadge type="featured" text="Featured" />
          )}
          {!product.is_in_stock && <ProductBadge type="out-of-stock" text="Out of Stock" />}
          {product.condition && product.condition !== 'new' && (
            <ProductBadge
              type="condition"
              text={product.condition.charAt(0).toUpperCase() + product.condition.slice(1)}
            />
          )}
        </div>

        {/* Product Image */}
        <div className="product-card__image-container">
          {imageLoading && (
            <div className="product-card__image-placeholder">
              <div className="loading-spinner" />
            </div>
          )}

          <img
            src={
              imageError
                ? '/assets/images/placeholders/product-placeholder.jpg'
                : product.thumbnail_url || product.image_url
            }
            alt={product.name}
            className={`product-card__image ${imageLoading ? 'loading' : ''}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />

          {/* Quick Actions Overlay */}
          {showQuickActions && (
            <div className="product-card__actions">
              <button
                className={`action-btn wishlist-btn ${isWishlisted ? 'active' : ''}`}
                onClick={handleToggleWishlist}
                title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>

              <button
                className="action-btn quick-view-btn"
                onClick={handleQuickView}
                title="Quick View"
              >
                <Eye size={18} />
              </button>

              {product.is_in_stock && (
                <button
                  className="action-btn add-to-cart-btn"
                  onClick={handleAddToCart}
                  title="Add to Cart"
                >
                  <ShoppingCart size={18} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="product-card__content">
          {/* Category */}
          {product.category && (
            <div className="product-card__category">{product.category.name}</div>
          )}

          {/* Product Name */}
          <h3 className="product-card__name" title={product.name}>
            {product.name}
          </h3>

          {/* Product Description */}
          {size !== 'small' && product.short_description && (
            <p className="product-card__description">
              {product.short_description.length > 100
                ? `${product.short_description.substring(0, 100)}...`
                : product.short_description}
            </p>
          )}

          {/* Rating */}
          {size !== 'small' && renderRating()}

          {/* Price */}
          <div className="product-card__price">
            <span className="current-price">{formatPrice(product.price)}</span>
            {product.original_price && product.is_on_sale && (
              <span className="original-price">{formatPrice(product.original_price)}</span>
            )}
          </div>

          {/* Stock Status */}
          {size !== 'small' && product.track_inventory && (
            <div className="product-card__stock">
              {product.is_in_stock ? (
                <span className="in-stock">In Stock</span>
              ) : (
                <span className="out-of-stock">Out of Stock</span>
              )}
            </div>
          )}

          {/* Add to Cart Button (for larger cards) */}
          {size === 'large' && (
            <button
              className={`product-card__cart-btn ${!product.is_in_stock ? 'disabled' : ''}`}
              onClick={handleAddToCart}
              disabled={!product.is_in_stock}
            >
              <ShoppingCart size={16} />
              {product.is_in_stock ? 'Add to Cart' : 'Out of Stock'}
            </button>
          )}
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
