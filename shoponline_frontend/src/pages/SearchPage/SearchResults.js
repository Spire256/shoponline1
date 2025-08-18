import React from 'react';
import {
  ShoppingCart,
  Heart,
  Star,
  Eye,
  ChevronLeft,
  ChevronRight,
  Search,
  AlertCircle,
} from 'lucide-react';

const SearchResults = ({
  products,
  loading,
  error,
  searchQuery,
  viewMode,
  currentPage,
  totalPages,
  totalResults,
  onPageChange,
}) => {
  // Loading state
  if (loading) {
    return (
      <div className="search-results-container">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Searching products...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="search-results-container">
        <div className="error-state">
          <AlertCircle size={48} className="error-icon" />
          <h3>Search Error</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No search query state
  if (!searchQuery) {
    return (
      <div className="search-results-container">
        <div className="no-search-state">
          <Search size={64} className="search-icon" />
          <h3>Start Your Search</h3>
          <p>Enter keywords in the search box above to find products</p>
          <div className="search-suggestions">
            <h4>Popular searches:</h4>
            <div className="suggestion-tags">
              <span className="suggestion-tag">Electronics</span>
              <span className="suggestion-tag">Clothing</span>
              <span className="suggestion-tag">Books</span>
              <span className="suggestion-tag">Home & Garden</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No results state
  if (products.length === 0 && searchQuery) {
    return (
      <div className="search-results-container">
        <div className="no-results-state">
          <Search size={64} className="search-icon" />
          <h3>No Results Found</h3>
          <p>We couldn't find any products matching "{searchQuery}"</p>
          <div className="search-tips">
            <h4>Try:</h4>
            <ul>
              <li>Check your spelling</li>
              <li>Use more general keywords</li>
              <li>Remove filters to see more results</li>
              <li>Browse our categories instead</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Format currency
  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Render rating stars
  const renderRating = (rating, reviewCount) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} size={14} className="star filled" fill="currentColor" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} size={14} className="star half-filled" fill="currentColor" />);
      } else {
        stars.push(<Star key={i} size={14} className="star empty" />);
      }
    }

    return (
      <div className="rating-display">
        <div className="stars">{stars}</div>
        <span className="rating-count">({reviewCount})</span>
      </div>
    );
  };

  // Product card component
  const ProductCard = ({ product }) => (
    <div className={`product-card ${viewMode}`}>
      <div className="product-image-container">
        <img
          src={product.image_url || '/api/placeholder/300/300'}
          alt={product.name}
          className="product-image"
          loading="lazy"
        />

        {/* Product badges */}
        <div className="product-badges">
          {product.is_featured && <span className="badge featured">Featured</span>}
          {product.is_on_sale && (
            <span className="badge sale">-{product.discount_percentage}%</span>
          )}
          {!product.is_in_stock && <span className="badge out-of-stock">Out of Stock</span>}
        </div>

        {/* Quick actions */}
        <div className="product-actions">
          <button className="action-btn wishlist" title="Add to Wishlist">
            <Heart size={18} />
          </button>
          <button className="action-btn quick-view" title="Quick View">
            <Eye size={18} />
          </button>
        </div>
      </div>

      <div className="product-info">
        <div className="product-category">{product.category?.name}</div>

        <h3 className="product-name">{product.name}</h3>

        <div className="product-description">{product.short_description}</div>

        {product.rating_average > 0 && (
          <div className="product-rating">
            {renderRating(product.rating_average, product.review_count)}
          </div>
        )}

        <div className="product-price">
          <span className="current-price">{formatCurrency(product.price)}</span>
          {product.original_price && product.original_price > product.price && (
            <span className="original-price">{formatCurrency(product.original_price)}</span>
          )}
        </div>

        <div className="product-footer">
          <button
            className={`btn btn-primary add-to-cart ${!product.is_in_stock ? 'disabled' : ''}`}
            disabled={!product.is_in_stock}
          >
            <ShoppingCart size={16} />
            {product.is_in_stock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  );

  // Pagination component
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 7;

      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 4) {
          for (let i = 1; i <= 5; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 3) {
          pages.push(1);
          pages.push('...');
          for (let i = totalPages - 4; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          pages.push(1);
          pages.push('...');
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        }
      }

      return pages;
    };

    return (
      <div className="pagination">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="pagination-btn prev"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        <div className="pagination-numbers">
          {getPageNumbers().map((page, index) =>
            page === '...' ? (
              <span key={index} className="pagination-ellipsis">
                ...
              </span>
            ) : (
              <button
                key={index}
                onClick={() => onPageChange(page)}
                className={`pagination-number ${currentPage === page ? 'active' : ''}`}
              >
                {page}
              </button>
            )
          )}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="pagination-btn next"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    );
  };

  return (
    <div className="search-results-container">
      {/* Results summary */}
      <div className="results-summary">
        <p>
          Showing {(currentPage - 1) * 12 + 1}-{Math.min(currentPage * 12, totalResults)} of{' '}
          {totalResults} products
        </p>
      </div>

      {/* Products grid/list */}
      <div className={`products-container ${viewMode}-view`}>
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      <Pagination />
    </div>
  );
};

export default SearchResults;
