// src/components/products/ProductList/ProductList.js
import React, { useState, useEffect, useCallback } from 'react';
import { Grid, List, Filter, SortAsc } from 'lucide-react';
import ProductGrid from './ProductGrid';
import ProductFilters from './ProductFilters';
import ProductSort from './ProductSort';
import { useAPI } from '../../../hooks/useAPI';
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
  const [sortOption, setSortOption] = useState('created_at_desc');

  const {
    data: productsData,
    loading,
    error,
    refetch,
  } = useAPI('/api/products/products/', {
    params: {
      page_size: pageSize,
      category: categoryId,
      search: searchQuery,
      ordering: sortOption,
      ...filters,
    },
  });

  const { currentPage, totalPages, goToPage, nextPage, prevPage, canGoNext, canGoPrev } =
    usePagination({
      totalItems: productsData?.count || 0,
      itemsPerPage: pageSize,
      onPageChange: page => {
        refetch({ page });
      },
    });

  const products = productsData?.results || [];

  const handleFilterChange = useCallback(newFilters => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleSortChange = useCallback(newSort => {
    setSortOption(newSort);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
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

  if (loading && products.length === 0) {
    return (
      <div className="product-list__loading">
        <LoadingSpinner size="large" />
        <p>Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-list__error">
        <h3>Error Loading Products</h3>
        <p>{error.message || 'Something went wrong while loading products.'}</p>
        <button onClick={() => refetch()} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`product-list ${className}`}>
      {/* Header Controls */}
      <div className="product-list__header">
        <div className="product-list__info">
          <h2 className="products-title">
            Products
            {productsData?.count && <span className="products-count">({productsData.count})</span>}
          </h2>
          {searchQuery && <p className="search-info">Search results for "{searchQuery}"</p>}
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
          {products.length === 0 ? (
            <div className="no-products">
              <h3>No Products Found</h3>
              <p>
                {searchQuery
                  ? `No products match your search for "${searchQuery}"`
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
                    {Math.min(currentPage * pageSize, productsData.count)} of {productsData.count}{' '}
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
