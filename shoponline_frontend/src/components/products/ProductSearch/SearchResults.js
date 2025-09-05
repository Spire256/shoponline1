// src/components/products/ProductSearch/SearchResults.js - Updated for backend integration
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Grid, List, SortDesc, X, Loader } from 'lucide-react';
import ProductCard from '../ProductCard/ProductCard';
import ProductList from '../ProductList/ProductList';
import SearchFilters from './SearchFilters';
import Button from '../../common/UI/Button/Button';
import Loading from '../../common/UI/Loading/Spinner';
import productsAPI from '../../../services/api/productsAPI';
import { useDebounce } from '../../../hooks/useDebounce';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import './SearchResults.css';

const SearchResults = ({
  searchQuery = '',
  initialFilters = {},
  onResultsChange = null,
  showHeader = true,
  showFilters = true,
}) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);

  // View and filter state
  const [viewMode, setViewMode] = useLocalStorage('search_view_mode', 'grid');
  const [sortBy, setSortBy] = useLocalStorage('search_sort_by', '-created_at');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    price_min: '',
    price_max: '',
    brand: '',
    color: '',
    size: '',
    is_in_stock: false,
    is_on_sale: false,
    is_featured: false,
    min_rating: '',
    ...initialFilters,
  });

  // Debounce search query to avoid too many API calls
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Build search parameters
  const buildSearchParams = useCallback(() => {
    const params = {
      page: currentPage,
      page_size: viewMode === 'list' ? 20 : 24,
      ordering: sortBy,
    };

    // Add search query
    if (debouncedQuery.trim()) {
      params.search = debouncedQuery.trim();
    }

    // Add active filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        if (typeof value === 'boolean' && value) {
          params[key] = 'true';
        } else if (typeof value !== 'boolean') {
          params[key] = value;
        }
      }
    });

    return params;
  }, [debouncedQuery, currentPage, viewMode, sortBy, filters]);

  // Fetch search results
  const fetchResults = useCallback(async () => {
    // Don't search if no query and no initial filters
    if (!debouncedQuery.trim() && Object.keys(initialFilters).length === 0) {
      setResults([]);
      setTotalCount(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = buildSearchParams();
      let response;

      if (debouncedQuery.trim()) {
        // Use search endpoint
        response = await productsAPI.searchProducts(debouncedQuery.trim(), params);
      } else {
        // Use regular products endpoint with filters
        response = await productsAPI.getProducts(params);
      }

      if (response) {
        setResults(response.results || []);
        setTotalCount(response.count || 0);
        setTotalPages(Math.ceil((response.count || 0) / params.page_size));
        setHasNextPage(!!response.next);

        // Notify parent component of results change
        if (onResultsChange) {
          onResultsChange({
            results: response.results || [],
            count: response.count || 0,
            query: debouncedQuery,
            filters,
          });
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to fetch search results. Please try again.');
      setResults([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, buildSearchParams, initialFilters, onResultsChange]);

  // Effect to fetch results when parameters change
  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Reset to first page when query or filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedQuery, filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
    setCurrentPage(1);
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    setCurrentPage(1);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  const handleClearFilters = () => {
    setFilters({
      category: '',
      price_min: '',
      price_max: '',
      brand: '',
      color: '',
      size: '',
      is_in_stock: false,
      is_on_sale: false,
      is_featured: false,
      min_rating: '',
    });
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadMore = () => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'is_in_stock' && value === false) return false; // Default filter
      return value !== '' && value !== null && value !== undefined && value !== false;
    }).length;
  };

  const activeFilterCount = getActiveFilterCount();

  // Render sort dropdown
  const renderSortDropdown = () => (
    <div className="sort-dropdown">
      <label htmlFor="sort-select" className="sort-label">
        <SortDesc size={16} />
        Sort by:
      </label>
      <select
        id="sort-select"
        value={sortBy}
        onChange={e => handleSortChange(e.target.value)}
        className="sort-select"
      >
        <option value="-created_at">Newest First</option>
        <option value="created_at">Oldest First</option>
        <option value="price">Price: Low to High</option>
        <option value="-price">Price: High to Low</option>
        <option value="name">Name: A to Z</option>
        <option value="-name">Name: Z to A</option>
        <option value="-rating_average">Highest Rated</option>
        <option value="-view_count">Most Popular</option>
        <option value="-order_count">Best Sellers</option>
      </select>
    </div>
  );

  // Render view mode toggle
  const renderViewModeToggle = () => (
    <div className="view-mode-toggle">
      <button
        className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
        onClick={() => handleViewModeChange('grid')}
        aria-label="Grid view"
      >
        <Grid size={16} />
      </button>
      <button
        className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
        onClick={() => handleViewModeChange('list')}
        aria-label="List view"
      >
        <List size={16} />
      </button>
    </div>
  );

  // Render pagination
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const showEllipsis = totalPages > 7;

    if (showEllipsis) {
      // Show first page
      pages.push(1);

      // Show ellipsis if current page is far from start
      if (currentPage > 4) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 2);
      const end = Math.min(totalPages - 1, currentPage + 2);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Show ellipsis if current page is far from end
      if (currentPage < totalPages - 3) {
        pages.push('...');
      }

      // Show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    } else {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    }

    return (
      <div className="pagination">
        <button
          className="pagination-btn"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>

        <div className="pagination-pages">
          {pages.map((page, index) =>
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                ...
              </span>
            ) : (
              <button
                key={page}
                className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            )
          )}
        </div>

        <button
          className="pagination-btn"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="search-results">
      {/* Header */}
      {showHeader && (
        <div className="search-header">
          <div className="search-info">
            <h1 className="search-title">
              {debouncedQuery ? (
                <>
                  Search results for "<span className="search-query">{debouncedQuery}</span>"
                </>
              ) : (
                'All Products'
              )}
            </h1>

            {!loading && (
              <p className="search-count">
                {totalCount > 0 ? (
                  <>
                    Showing {(currentPage - 1) * (viewMode === 'list' ? 20 : 24) + 1}-
                    {Math.min(currentPage * (viewMode === 'list' ? 20 : 24), totalCount)} of {totalCount}{' '}
                    results
                  </>
                ) : (
                  'No results found'
                )}
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="search-controls">
            {showFilters && (
              <Button
                variant="outline"
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                className={`filters-btn ${activeFilterCount > 0 ? 'has-filters' : ''}`}
              >
                <Filter size={16} />
                Filters
                {activeFilterCount > 0 && <span className="filter-count">{activeFilterCount}</span>}
              </Button>
            )}

            {renderSortDropdown()}
            {renderViewModeToggle()}
          </div>
        </div>
      )}

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="active-filters">
          <div className="filter-tags">
            {Object.entries(filters).map(([key, value]) => {
              if (key === 'is_in_stock' && value === false) return null;
              if (!value || value === '' || value === false) return null;

              const filterLabels = {
                category: 'Category',
                price_min: 'Min Price',
                price_max: 'Max Price',
                brand: 'Brand',
                color: 'Color',
                size: 'Size',
                is_on_sale: 'On Sale',
                is_featured: 'Featured',
                min_rating: 'Min Rating',
              };

              return (
                <div key={key} className="filter-tag">
                  <span className="filter-label">{filterLabels[key] || key}:</span>
                  <span className="filter-value">
                    {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                  </span>
                  <button
                    className="remove-filter"
                    onClick={() => handleFilterChange({ [key]: key === 'is_in_stock' ? false : '' })}
                    aria-label={`Remove ${filterLabels[key] || key} filter`}
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>

          <Button variant="link" onClick={handleClearFilters} className="clear-filters-btn">
            Clear All Filters
          </Button>
        </div>
      )}

      <div className="search-content">
        {/* Filters Panel */}
        {showFilters && (
          <div className={`filters-panel ${showFiltersPanel ? 'open' : ''}`}>
            <div className="filters-header">
              <h3>Filters</h3>
              <button
                className="close-filters"
                onClick={() => setShowFiltersPanel(false)}
                aria-label="Close filters"
              >
                <X size={20} />
              </button>
            </div>

            <SearchFilters
              filters={filters}
              onFiltersChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              availableFilters={{
                categories: [], // This would be populated from API
                brands: [],
                colors: [],
                sizes: [],
                priceRange: { min: 0, max: 10000000 }, // UGX range
              }}
            />
          </div>
        )}

        {/* Results */}
        <div className="search-results-content">
          {loading && currentPage === 1 ? (
            <div className="search-loading">
              <Loading />
              <p>Searching for products...</p>
            </div>
          ) : error ? (
            <div className="search-error">
              <div className="error-icon">
                <Search size={48} />
              </div>
              <h3>Search Error</h3>
              <p>{error}</p>
              <Button variant="primary" onClick={fetchResults}>
                Try Again
              </Button>
            </div>
          ) : results.length === 0 ? (
            <div className="no-results">
              <div className="no-results-icon">
                <Search size={48} />
              </div>
              <h3>No products found</h3>
              <p>
                {debouncedQuery ? (
                  <>
                    We couldn't find any products matching "<strong>{debouncedQuery}</strong>"
                  </>
                ) : (
                  'No products match your current filters.'
                )}
              </p>

              <div className="no-results-suggestions">
                <h4>Try:</h4>
                <ul>
                  <li>Checking your spelling</li>
                  <li>Using different keywords</li>
                  <li>Removing some filters</li>
                  <li>Searching for a more general term</li>
                </ul>
              </div>

              {activeFilterCount > 0 && (
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="clear-filters-cta"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Results Grid/List */}
              {viewMode === 'grid' ? (
                <div className="products-grid">
                  {results.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      showQuickActions={true}
                      showCompare={true}
                      className="search-result-card"
                    />
                  ))}
                </div>
              ) : (
                <div className="products-list">
                  {results.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      size="large"
                      showQuickActions={true}
                      className="search-result-list-item"
                    />
                  ))}
                </div>
              )}

              {/* Loading More */}
              {loading && currentPage > 1 && (
                <div className="loading-more">
                  <Loader className="spinning" size={20} />
                  <span>Loading more results...</span>
                </div>
              )}

              {/* Pagination or Load More */}
              {totalPages > 1 && (
                <div className="results-pagination">
                  {viewMode === 'list' && hasNextPage ? (
                    <div className="load-more-container">
                      <Button
                        variant="outline"
                        onClick={handleLoadMore}
                        disabled={loading}
                        className="load-more-btn"
                      >
                        {loading ? 'Loading...' : 'Load More Products'}
                      </Button>
                    </div>
                  ) : (
                    renderPagination()
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Filters Overlay (Mobile) */}
      {showFiltersPanel && (
        <div className="filters-overlay" onClick={() => setShowFiltersPanel(false)} />
      )}
    </div>
  );
};

export default SearchResults;