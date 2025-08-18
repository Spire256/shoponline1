// src/components/products/ProductList/ProductGrid.js
import React from 'react';
import ProductCard from '../ProductCard/ProductCard';
import { useCart } from '../../../hooks/useCart';
import { useAuth } from '../../../hooks/useAuth';

const ProductGrid = ({
  products,
  viewMode = 'grid',
  loading = false,
  onProductClick,
  onQuickView,
  className = '',
}) => {
  const { addToCart } = useCart();
  const { user } = useAuth();

  const handleAddToCart = async product => {
    try {
      await addToCart(product, 1);
      // Show success notification
    } catch (error) {
      // Show error notification
      console.error('Failed to add to cart:', error);
    }
  };

  const handleToggleWishlist = async product => {
    if (!user) {
      // Redirect to login or show login modal
      return;
    }

    try {
      // API call to toggle wishlist
      console.log('Toggle wishlist for:', product.id);
      // Show success notification
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
    }
  };

  const handleQuickView = product => {
    if (onQuickView) {
      onQuickView(product);
    }
  };

  const handleProductClick = product => {
    if (onProductClick) {
      onProductClick(product);
    }
  };

  const getGridClasses = () => {
    const baseClass = 'product-grid';
    const modeClass = `product-grid--${viewMode}`;
    const loadingClass = loading ? 'product-grid--loading' : '';

    return `${baseClass} ${modeClass} ${loadingClass} ${className}`.trim();
  };

  const getCardSize = () => {
    switch (viewMode) {
      case 'list':
        return 'large';
      case 'grid':
      default:
        return 'medium';
    }
  };

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className={getGridClasses()}>
      {products.map(product => (
        <div key={product.id} className="product-grid__item">
          <ProductCard
            product={product}
            size={getCardSize()}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            onQuickView={handleQuickView}
            onClick={() => handleProductClick(product)}
            showQuickActions={true}
            className={loading ? 'loading' : ''}
          />
        </div>
      ))}

      {/* Loading placeholders */}
      {loading && (
        <>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`loading-${index}`} className="product-grid__item">
              <div className="product-card product-card--loading">
                <div className="product-card__image-placeholder">
                  <div className="loading-shimmer" />
                </div>
                <div className="product-card__content">
                  <div className="loading-text loading-text--small" />
                  <div className="loading-text loading-text--medium" />
                  <div className="loading-text loading-text--large" />
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default ProductGrid;
