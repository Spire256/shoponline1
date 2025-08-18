import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import ProductCard from '../../components/products/ProductCard/ProductCard';
import LoadingSpinner from '../../components/common/UI/Loading/Spinner';
import Alert from '../../components/common/UI/Alert/Alert';

const CategoryProducts = ({ products, loading, pagination, onPageChange, categoryName }) => {
  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    const { currentPage, totalPages } = pagination;
    const pages = [];
    const maxVisiblePages = 5;

    // Calculate page range
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          onClick={() => onPageChange(currentPage - 1)}
          className="pagination__btn pagination__btn--prev"
          aria-label="Previous page"
        >
          ← Previous
        </button>
      );
    }

    // First page and ellipsis
    if (startPage > 1) {
      pages.push(
        <button key={1} onClick={() => onPageChange(1)} className="pagination__btn">
          1
        </button>
      );

      if (startPage > 2) {
        pages.push(
          <span key="ellipsis1" className="pagination__ellipsis">
            ...
          </span>
        );
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`pagination__btn ${i === currentPage ? 'pagination__btn--active' : ''}`}
          aria-current={i === currentPage ? 'page' : undefined}
        >
          {i}
        </button>
      );
    }

    // Last page and ellipsis
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="ellipsis2" className="pagination__ellipsis">
            ...
          </span>
        );
      }

      pages.push(
        <button
          key={totalPages}
          onClick={() => onPageChange(totalPages)}
          className="pagination__btn"
        >
          {totalPages}
        </button>
      );
    }

    // Next button
    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          onClick={() => onPageChange(currentPage + 1)}
          className="pagination__btn pagination__btn--next"
          aria-label="Next page"
        >
          Next →
        </button>
      );
    }

    return (
      <nav className="pagination" aria-label="Pagination Navigation">
        <div className="pagination__info">
          Showing {(currentPage - 1) * 12 + 1} - {Math.min(currentPage * 12, pagination.count)} of{' '}
          {pagination.count} products
        </div>
        <div className="pagination__controls">{pages}</div>
      </nav>
    );
  };

  const renderEmptyState = () => (
    <div className="category-products__empty">
      <div className="empty-state">
        <div className="empty-state__icon">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
            <path d="M11 8a3 3 0 1 0 0 6" />
          </svg>
        </div>
        <h3 className="empty-state__title">No Products Found</h3>
        <p className="empty-state__message">
          We couldn't find any products in the {categoryName} category that match your current
          filters.
        </p>
        <div className="empty-state__actions">
          <Link to="/products" className="btn btn--primary">
            Browse All Products
          </Link>
          <button onClick={() => window.location.reload()} className="btn btn--outline">
            Try Again
          </button>
        </div>
      </div>
    </div>
  );

  const renderLoadingState = () => (
    <div className="category-products__loading">
      <LoadingSpinner size="large" />
      <p>Loading products...</p>
    </div>
  );

  const renderProductsHeader = () => (
    <div className="category-products__header">
      <div className="category-products__title-section">
        <h2 className="category-products__title">Products in {categoryName}</h2>
        <p className="category-products__count">
          {pagination.count} {pagination.count === 1 ? 'product' : 'products'} found
        </p>
      </div>
    </div>
  );

  const renderProductGrid = () => {
    if (loading) {
      return renderLoadingState();
    }

    if (!products || products.length === 0) {
      return renderEmptyState();
    }

    return (
      <div className="category-products__grid">
        <div className="products-grid">
          {products.map(product => (
            <div key={product.id} className="products-grid__item">
              <ProductCard
                product={product}
                showQuickView={true}
                showCompare={true}
                showWishlist={true}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="category-products">
      {renderProductsHeader()}

      {renderProductGrid()}

      {!loading && products && products.length > 0 && renderPagination()}

      {/* Loading overlay for pagination */}
      {loading && products && products.length > 0 && (
        <div className="category-products__loading-overlay">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
};

CategoryProducts.propTypes = {
  products: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      original_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      image_url: PropTypes.string,
      thumbnail_url: PropTypes.string,
      is_featured: PropTypes.bool,
      is_in_stock: PropTypes.bool,
      is_on_sale: PropTypes.bool,
      discount_percentage: PropTypes.number,
      rating_average: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      review_count: PropTypes.number,
      short_description: PropTypes.string,
      category: PropTypes.object,
    })
  ),
  loading: PropTypes.bool.isRequired,
  pagination: PropTypes.shape({
    count: PropTypes.number.isRequired,
    next: PropTypes.string,
    previous: PropTypes.string,
    currentPage: PropTypes.number.isRequired,
    totalPages: PropTypes.number.isRequired,
  }).isRequired,
  onPageChange: PropTypes.func.isRequired,
  categoryName: PropTypes.string.isRequired,
};

CategoryProducts.defaultProps = {
  products: [],
};

export default CategoryProducts;
