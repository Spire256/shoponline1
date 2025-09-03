// src/components/products/ProductList/ProductList.js - Updated for backend integration
import React, { useState, useEffect, useCallback } from 'react';
import { Grid, List, Filter, SortAsc } from 'lucide-react';
import ProductGrid from './ProductGrid';
import ProductFilters from './ProductFilters';
import ProductSort from './ProductSort';
import productsAPI from '../../../services/api/productsAPI';
import { usePagination } from '../../../hooks/usePagination';
import LoadingSpinner from '../../common/UI/Loading/Spinner';
import './ProductList.css';

const ProductList = ({
  categoryId = null,
  searchQuery = '',
  initialFilters = {},
  showFilters = true,
  showSort = true,
  showViewToggle = true,
  pageSize = 12,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [filters, setFilters] = useState(initialFilters);
  const [sortOption, setSortOption] = useState('-created_at');
  
  // Product data state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [productsData, setProductsData] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Load products function
  const loadProducts = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        page_size: pageSize,
        ordering: sortOption,
        ...filters,
      };

      // Add category filter if provided
      if (categoryId) {
        params.category = categoryId;
      }

      // Add search query if provided
      if (searchQuery) {
        params.search = searchQuery;
      }

      let response;
      if (searchQuery) {
        // Use search endpoint for search queries
        response = await productsAPI.searchProducts(searchQuery, params);
      } else if (categoryId) {
        // Use category products endpoint
        response = await productsAPI.getProductsByCategory(categoryId, params);
      } else {
        // Use general products endpoint
        response = await productsAPI.getProducts(params);
      }

      setProducts(response.results || []);
      setProductsData(response);
      setTotalCount(response.count || 0);
      setTotalPages(Math.ceil((response.count || 0) / pageSize));
      setCurrentPage(page);

    } catch (err) {
      console.error('Error loading products:', err);
      setError(err.message || 'Failed to load products. Please try again.');
      setProducts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [categoryId, searchQuery, filters, sortOption, pageSize]);

  // Load products on component mount and when dependencies change
  useEffect(() => {
    loadProducts(1);
  }, [loadProducts]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const handleSortChange = useCallback((newSort) => {
    setSortOption(newSort);
    setCurrentPage(1); // Reset to first page when sort changes
  }, []);

  const handlePageChange = useCallback((page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      loadProducts(page);
      // Scroll to top on page change
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [loadProducts, totalPages, currentPage]);

  const clearFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(1);
  }, []);

  const toggleFiltersPanel = () => {
    setShowFiltersPanel(!showFiltersPanel);
  };

  const toggleViewMode = () => {
    setViewMode(prev => (prev === 'grid' ? 'list' : 'grid'));
  };

  // Get active filters count
  const activeFiltersCount = Object.keys(filters).filter(
    key => filters[key] !== '' && filters[key] !== null && filters[key] !== undefined
  ).length;

  // Pagination controls
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const goToPage = (page) => {
    handlePageChange(page);
  };

  const nextPage = () => {
    if (canGoNext) {
      handlePageChange(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (canGoPrev) {
      handlePageChange(currentPage - 1);
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="product-list__loading">
        <LoadingSpinner size="large" />
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div className={`product-list ${className}`}>
      {/* Header Controls */}
      <div className="product-list__header">
        <div className="product-list__info">
          <h2 className="products-title">
            {searchQuery ? `Search Results` : categoryId ? 'Products' : 'All Products'}
            {totalCount > 0 && <span className="products-count">({totalCount})</span>}
          </h2>
          {searchQuery && <p className="search-info">Results for "{searchQuery}"</p>}
        </div>

        <div className="product-list__controls">
          {/* Filters Toggle */}
          {showFilters && (
            <button
              className={`filter-toggle ${showFiltersPanel ? 'active' : ''}`}
              onClick={toggleFiltersPanel}
            >
              <Filter size={18} />
              Filters
              {activeFiltersCount > 0 && <span className="filter-count">{activeFiltersCount}</span>}
            </button>
          )}

          {/* Sort Dropdown */}
          {showSort && (
            <div className="sort-wrapper">
              <ProductSort value={sortOption} onChange={handleSortChange} />
            </div>
          )}

          {/* View Toggle */}
          {showViewToggle && (
            <div className="view-toggle">
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <Grid size={18} />
              </button>
              <button
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <List size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="product-list__content">
        {/* Filters Panel */}
        {showFilters && (
          <div className={`filters-panel ${showFiltersPanel ? 'open' : ''}`}>
            <ProductFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
              categoryId={categoryId}
            />
          </div>
        )}

        {/* Products Grid/List */}
        <div className="products-container">
          {error ? (
            <div className="products-error">
              <h3>Error Loading Products</h3>
              <p>{error}</p>
              <button onClick={() => loadProducts(currentPage)} className="retry-btn">
                Try Again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="no-products">
              <h3>No Products Found</h3>
              <p>
                {searchQuery
                  ? `No products match your search for "${searchQuery}"`
                  : activeFiltersCount > 0
                  ? 'No products match your current filters'
                  : 'No products available at the moment'}
              </p>
              {activeFiltersCount > 0 && (
                <button onClick={clearFilters} className="clear-filters-btn">
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <ProductGrid products={products} viewMode={viewMode} loading={loading} />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="product-list__pagination">
                  <div className="pagination-info">
                    Showing {(currentPage - 1) * pageSize + 1} to{' '}
                    {Math.min(currentPage * pageSize, totalCount)} of {totalCount}{' '}
                    products
                  </div>

                  <div className="pagination-controls">
                    <button className="page-btn prev" onClick={prevPage} disabled={!canGoPrev}>
                      Previous
                    </button>

                    <div className="page-numbers">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                            onClick={() => goToPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button className="page-btn next" onClick={nextPage} disabled={!canGoNext}>
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Loading Overlay for Pagination */}
      {loading && products.length > 0 && (
        <div className="loading-overlay">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
};

export default ProductList;