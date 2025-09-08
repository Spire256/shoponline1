import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Grid, List, SortDesc, X, Loader } from 'lucide-react';
import ProductCard from '../ProductCard/ProductCard';
import ProductList from '../ProductList/ProductList';
import SearchFilters from './SearchFilters';
import Button from '../../common/UI/Button/Button';
import Loading from '../../common/UI/Loading/Spinner';
import productsAPI from '../../../services/api/productsAPI';
import { useDebounce } from '../../../hooks/useDebounce';
// Note: Using React state instead of localStorage for Claude.ai compatibility
import './SearchResults.css';

const SearchResults = ({
  searchQuery = '',
  initialFilters = {},
  onResultsChange = null,
  showHeader = true,
  showFilters = true,
}) => {
  // CRITICAL: Initialize ALL arrays and objects with guaranteed safe values
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);

  // Safe prop conversion at the top level with additional null checks
  const safeSearchQuery = (searchQuery === null || searchQuery === undefined) ? '' : String(searchQuery);
  const safeInitialFilters = (!initialFilters || typeof initialFilters !== 'object' || Array.isArray(initialFilters)) ? {} : initialFilters;
  const safeOnResultsChange = (typeof onResultsChange === 'function') ? onResultsChange : null;

  // View and filter state with ultra-safe initialization (using React state instead of localStorage)
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('-created_at');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  
  // Initialize filters with absolute safety
  const [filters, setFilters] = useState(() => {
    const defaultFilters = {
      category: '',
      price_min: '',
      price_max: '',
      brand: '',
      color: '',
      size: '',
      condition: '',
      material: '',
      rating_min: '',
      in_stock: true,
      on_sale: false,
      is_featured: false,
    };

    // Safely merge initial filters
    try {
      if (safeInitialFilters && typeof safeInitialFilters === 'object') {
        Object.keys(safeInitialFilters).forEach(key => {
          if (key in defaultFilters && safeInitialFilters[key] !== null && safeInitialFilters[key] !== undefined) {
            defaultFilters[key] = safeInitialFilters[key];
          }
        });
      }
    } catch (e) {
      console.warn('Error merging initial filters:', e);
    }

    return defaultFilters;
  });

  // Debounce search query with guaranteed string
  const debouncedQuery = useDebounce(safeSearchQuery, 300);
  const safeDebouncedQuery = (debouncedQuery === null || debouncedQuery === undefined) ? '' : String(debouncedQuery);

  // Build search parameters with maximum safety
  const buildSearchParams = useCallback(() => {
    const params = {
      page: Math.max(1, Number(currentPage) || 1),
      page_size: viewMode === 'list' ? 20 : 24,
      ordering: String(sortBy || '-created_at'),
    };

    // Add search query with extra safety checks
    const queryToCheck = safeDebouncedQuery || '';
    const trimmedQuery = (typeof queryToCheck === 'string') ? queryToCheck.trim() : '';
    if (trimmedQuery && trimmedQuery.length > 0) {
      params.search = trimmedQuery;
    }

    // Add active filters with extreme safety
    if (filters && typeof filters === 'object') {
      try {
        Object.entries(filters).forEach(([key, value]) => {
          if (value === null || value === undefined || value === '') return;
          
          if (typeof value === 'boolean') {
            if (key === 'in_stock' && !value) {
              params[key] = 'false';
            } else if ((key === 'on_sale' || key === 'is_featured') && value) {
              params[key] = 'true';
            }
          } else {
            const strValue = String(value || '').trim();
            if (strValue && strValue.length > 0) {
              params[key] = strValue;
            }
          }
        });
      } catch (filterError) {
        console.warn('Error processing filters:', filterError);
      }
    }

    return params;
  }, [safeDebouncedQuery, currentPage, viewMode, sortBy, filters]);

  // Ultra-safe results fetcher
  const fetchResults = useCallback(async () => {
    try {
      const queryToCheck = safeDebouncedQuery || '';
      const trimmedQuery = (typeof queryToCheck === 'string') ? queryToCheck.trim() : '';
      const hasQuery = Boolean(trimmedQuery && trimmedQuery.length > 0);
      
      // Check for initial filters
      const hasInitialFilters = safeInitialFilters && typeof safeInitialFilters === 'object' && 
        Object.keys(safeInitialFilters).length > 0;
      
      // Check for active filters - more robust check
      const hasActiveFilters = filters && typeof filters === 'object' ? 
        Object.entries(filters).some(([key, value]) => {
          if (key === 'in_stock' && value === true) return false;
          if ((key === 'on_sale' || key === 'is_featured') && value === false) return false;
          return value !== null && value !== undefined && value !== '';
        }) : false;

      // Early return with safe empty state
      if (!hasQuery && !hasInitialFilters && !hasActiveFilters) {
        const emptyState = {
          results: [],
          count: 0,
          query: '',
          filters: filters || {},
        };

        setResults([]);
        setTotalCount(0);
        setTotalPages(1);
        setHasNextPage(false);
        
        if (safeOnResultsChange) {
          try {
            safeOnResultsChange(emptyState);
          } catch (cbError) {
            console.warn('Callback error:', cbError);
          }
        }
        return;
      }

      setLoading(true);
      setError(null);

      const params = buildSearchParams();
      let response = null;

      // Safe API call
      try {
        if (hasQuery && productsAPI?.searchProducts) {
          response = await productsAPI.searchProducts(trimmedQuery, params);
        } else if (productsAPI?.getProducts) {
          response = await productsAPI.getProducts(params);
        } else {
          throw new Error('API not available');
        }
      } catch (apiError) {
        console.error('API Error:', apiError);
        throw apiError;
      }

      // CRITICAL: Ultra-safe response processing
      let safeResults = [];
      let safeCount = 0;
      let safeNext = false;

      if (response !== null && response !== undefined && typeof response === 'object') {
        // Handle results array with extreme caution
        if (response.results !== null && response.results !== undefined) {
          if (Array.isArray(response.results)) {
            safeResults = [...response.results]; // Create a new array to avoid mutations
          } else if (typeof response.results === 'object' && 
                     response.results.length !== null && 
                     response.results.length !== undefined) {
            try {
              safeResults = Array.from(response.results);
            } catch {
              safeResults = [];
            }
          }
        }

        // Handle count
        if (typeof response.count === 'number' && !isNaN(response.count)) {
          safeCount = Math.max(0, response.count);
        }

        // Handle next
        safeNext = Boolean(response.next);
      }

      // Validate each result item and ensure it's a proper array
      const validResults = Array.isArray(safeResults) ? safeResults.filter((item, index) => {
        try {
          return item !== null && item !== undefined && typeof item === 'object' && 
            (item.id !== null && item.id !== undefined || 
             item.key !== null && item.key !== undefined || 
             index !== null && index !== undefined);
        } catch {
          return false;
        }
      }) : [];

      const pageSize = params.page_size || 24;
      const calculatedTotalPages = Math.max(1, Math.ceil(safeCount / pageSize));

      // Set state with validated data
      setResults(validResults);
      setTotalCount(safeCount);
      setTotalPages(calculatedTotalPages);
      setHasNextPage(safeNext);

      // Notify parent with safe data
      if (safeOnResultsChange) {
        try {
          safeOnResultsChange({
            results: validResults,
            count: safeCount,
            query: trimmedQuery,
            filters: filters || {},
          });
        } catch (cbError) {
          console.warn('Results callback error:', cbError);
        }
      }

    } catch (error) {
      console.error('Fetch error:', error);
      
      const errorMessage = error?.message || 'Failed to fetch search results';
      setError(errorMessage);
      setResults([]);
      setTotalCount(0);
      setTotalPages(1);
      setHasNextPage(false);

      if (safeOnResultsChange) {
        try {
          const queryToCheck = safeDebouncedQuery || '';
          const trimmedQuery = (typeof queryToCheck === 'string') ? queryToCheck.trim() : '';
          safeOnResultsChange({
            results: [],
            count: 0,
            query: trimmedQuery,
            filters: filters || {},
          });
        } catch (cbError) {
          console.warn('Error callback error:', cbError);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [safeDebouncedQuery, buildSearchParams, safeInitialFilters, safeOnResultsChange, filters]);

  // Effect to update filters when initialFilters change
  useEffect(() => {
    try {
      if (safeInitialFilters && typeof safeInitialFilters === 'object' && 
          Object.keys(safeInitialFilters).length > 0) {
        setFilters(prevFilters => {
          const current = prevFilters || {};
          const merged = { ...current };
          
          Object.keys(safeInitialFilters).forEach(key => {
            if (safeInitialFilters[key] !== null && safeInitialFilters[key] !== undefined) {
              merged[key] = safeInitialFilters[key];
            }
          });
          
          return merged;
        });
      }
    } catch (error) {
      console.warn('Error updating filters:', error);
    }
  }, [safeInitialFilters]);

  // Effect to fetch results
  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Reset to first page when query or filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [safeDebouncedQuery, filters]);

  // Safe handlers
  const handleFilterChange = useCallback((newFilters) => {
    try {
      if (newFilters && typeof newFilters === 'object') {
        setFilters(prevFilters => ({
          ...(prevFilters || {}),
          ...newFilters,
        }));
        setCurrentPage(1);
      }
    } catch (error) {
      console.warn('Filter change error:', error);
    }
  }, []);

  const handleSortChange = useCallback((newSortBy) => {
    const safeSortBy = String(newSortBy || '-created_at');
    setSortBy(safeSortBy);
    setCurrentPage(1);
  }, []);

  const handleViewModeChange = useCallback((mode) => {
    const safeMode = ['grid', 'list'].includes(mode) ? mode : 'grid';
    setViewMode(safeMode);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      category: '',
      price_min: '',
      price_max: '',
      brand: '',
      color: '',
      size: '',
      condition: '',
      material: '',
      rating_min: '',
      in_stock: true,
      on_sale: false,
      is_featured: false,
    });
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page) => {
    const safePage = Math.max(1, Number(page) || 1);
    const maxPage = Math.max(1, Number(totalPages) || 1);
    const validPage = Math.min(safePage, maxPage);
    
    setCurrentPage(validPage);
    
    if (typeof window !== 'undefined' && window.scrollTo) {
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        window.scrollTo(0, 0);
      }
    }
  }, [totalPages]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !loading) {
      setCurrentPage(prev => (Number(prev) || 1) + 1);
    }
  }, [hasNextPage, loading]);

  // Safe active filter counter
  const getActiveFilterCount = useCallback(() => {
    if (!filters || typeof filters !== 'object') return 0;
    
    try {
      return Object.entries(filters).filter(([key, value]) => {
        if (key === 'in_stock' && value === true) return false;
        if ((key === 'on_sale' || key === 'is_featured') && value === false) return false;
        return value !== null && value !== undefined && value !== '';
      }).length;
    } catch {
      return 0;
    }
  }, [filters]);

  const activeFilterCount = getActiveFilterCount();

  // Safe render functions
  const renderSortDropdown = () => (
    <div className="sort-dropdown">
      <label htmlFor="sort-select" className="sort-label">
        <SortDesc size={16} />
        Sort by:
      </label>
      <select
        id="sort-select"
        value={String(sortBy || '-created_at')}
        onChange={e => handleSortChange(e?.target?.value)}
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

  const renderViewModeToggle = () => {
    const safeViewMode = ['grid', 'list'].includes(viewMode) ? viewMode : 'grid';
    return (
      <div className="view-mode-toggle">
        <button
          className={`view-btn ${safeViewMode === 'grid' ? 'active' : ''}`}
          onClick={() => handleViewModeChange('grid')}
          aria-label="Grid view"
        >
          <Grid size={16} />
        </button>
        <button
          className={`view-btn ${safeViewMode === 'list' ? 'active' : ''}`}
          onClick={() => handleViewModeChange('list')}
          aria-label="List view"
        >
          <List size={16} />
        </button>
      </div>
    );
  };

  const renderPagination = () => {
    const safeTotalPages = Math.max(1, Number(totalPages) || 1);
    const safeCurrentPage = Math.max(1, Number(currentPage) || 1);

    if (safeTotalPages <= 1) return null;

    const pages = [];
    const showEllipsis = safeTotalPages > 7;

    try {
      if (showEllipsis) {
        pages.push(1);

        if (safeCurrentPage > 4) {
          pages.push('...');
        }

        const start = Math.max(2, safeCurrentPage - 2);
        const end = Math.min(safeTotalPages - 1, safeCurrentPage + 2);

        for (let i = start; i <= end; i++) {
          pages.push(i);
        }

        if (safeCurrentPage < safeTotalPages - 3) {
          pages.push('...');
        }

        if (safeTotalPages > 1) {
          pages.push(safeTotalPages);
        }
      } else {
        for (let i = 1; i <= safeTotalPages; i++) {
          pages.push(i);
        }
      }
    } catch (paginationError) {
      console.warn('Pagination error:', paginationError);
      return null;
    }

    return (
      <div className="pagination">
        <button
          className="pagination-btn"
          onClick={() => handlePageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1}
        >
          Previous
        </button>

        <div className="pagination-pages">
          {Array.isArray(pages) && pages.map((page, index) =>
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                ...
              </span>
            ) : (
              <button
                key={`page-${page}-${index}`}
                className={`pagination-page ${safeCurrentPage === page ? 'active' : ''}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            )
          )}
        </div>

        <button
          className="pagination-btn"
          onClick={() => handlePageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage === safeTotalPages}
        >
          Next
        </button>
      </div>
    );
  };

  const renderActiveFilters = () => {
    if (activeFilterCount === 0) return null;

    const filterLabels = {
      category: 'Category',
      price_min: 'Min Price',
      price_max: 'Max Price',
      brand: 'Brand',
      color: 'Color',
      size: 'Size',
      condition: 'Condition',
      material: 'Material',
      rating_min: 'Min Rating',
      in_stock: 'In Stock',
      on_sale: 'On Sale',
      is_featured: 'Featured',
    };

    if (!filters || typeof filters !== 'object') return null;

    const filterTags = [];

    try {
      Object.entries(filters).forEach(([key, value]) => {
        if (key === 'in_stock' && value === true) return;
        if ((key === 'on_sale' || key === 'is_featured') && value === false) return;
        if (value === null || value === undefined || value === '') return;

        let displayValue = String(value || '');
        
        if (key === 'price_min' || key === 'price_max') {
          const numValue = Number(value) || 0;
          displayValue = `UGX ${numValue.toLocaleString()}`;
        } else if (key === 'rating_min') {
          displayValue = `${Number(value) || 0}+ stars`;
        } else if (typeof value === 'boolean') {
          displayValue = filterLabels[key] || key;
        }

        filterTags.push(
          <div key={key} className="filter-tag">
            <span className="filter-label">{filterLabels[key] || key}:</span>
            <span className="filter-value">{displayValue}</span>
            <button
              className="remove-filter"
              onClick={() => {
                const clearedValue = key === 'in_stock' ? true : 
                                   (key === 'on_sale' || key === 'is_featured') ? false : '';
                handleFilterChange({ [key]: clearedValue });
              }}
              aria-label={`Remove ${filterLabels[key] || key} filter`}
            >
              <X size={12} />
            </button>
          </div>
        );
      });
    } catch (filterRenderError) {
      console.warn('Error rendering filter tags:', filterRenderError);
    }

    if (!Array.isArray(filterTags) || filterTags.length === 0) return null;

    return (
      <div className="active-filters">
        <div className="filter-tags">
          {filterTags}
        </div>
        <Button variant="link" onClick={handleClearFilters} className="clear-filters-btn">
          Clear All Filters
        </Button>
      </div>
    );
  };

  // CRITICAL: Safe results array processing with multiple layers of safety
  const safeResults = Array.isArray(results) ? results : [];
  const safeTotalCount = Math.max(0, Number(totalCount) || 0);
  const safeCurrentPage = Math.max(1, Number(currentPage) || 1);
  const safeViewMode = ['grid', 'list'].includes(viewMode) ? viewMode : 'grid';
  const pageSize = safeViewMode === 'list' ? 20 : 24;

  // Extra safety for the debounced query display
  const displayQuery = safeDebouncedQuery || '';
  const trimmedDisplayQuery = (typeof displayQuery === 'string') ? displayQuery.trim() : '';

  return (
    <div className="search-results">
      {/* Header */}
      {showHeader && (
        <div className="search-header">
          <div className="search-info">
            <h1 className="search-title">
              {trimmedDisplayQuery && trimmedDisplayQuery.length > 0 ? (
                <>
                  Search results for "<span className="search-query">{trimmedDisplayQuery}</span>"
                </>
              ) : (
                'All Products'
              )}
            </h1>

            {!loading && (
              <p className="search-count">
                {safeTotalCount > 0 ? (
                  <>
                    Showing {Math.max(1, (safeCurrentPage - 1) * pageSize + 1)}-
                    {Math.min(safeCurrentPage * pageSize, safeTotalCount)} of {safeTotalCount}{' '}
                    results
                  </>
                ) : (
                  'No results found'
                )}
              </p>
            )}
          </div>

          <div className="search-controls">
            {showFilters && (
              <Button
                variant="outline"
                onClick={() => setShowFiltersPanel(prev => !prev)}
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

      {renderActiveFilters()}

      <div className="search-content">
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
              filters={filters || {}}
              onFiltersChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              loading={loading}
            />
          </div>
        )}

        <div className="search-results-content">
          {loading && safeCurrentPage === 1 ? (
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
              <p>{String(error)}</p>
              <Button variant="primary" onClick={fetchResults}>
                Try Again
              </Button>
            </div>
          ) : safeResults.length === 0 ? (
            <div className="no-results">
              <div className="no-results-icon">
                <Search size={48} />
              </div>
              <h3>No products found</h3>
              <p>
                {trimmedDisplayQuery && trimmedDisplayQuery.length > 0 ? (
                  <>
                    We couldn't find any products matching "<strong>{trimmedDisplayQuery}</strong>"
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
              {safeViewMode === 'grid' ? (
                <div className="products-grid">
                  {Array.isArray(safeResults) && safeResults.map((product, index) => {
                    try {
                      if (!product || typeof product !== 'object') return null;
                      
                      const productId = product.id || product.key || `product-${index}`;
                      
                      return (
                        <ProductCard
                          key={productId}
                          product={product}
                          showQuickActions={true}
                          showCompare={true}
                          className="search-result-card"
                        />
                      );
                    } catch (productError) {
                      console.warn(`Product render error at index ${index}:`, productError);
                      return null;
                    }
                  }).filter(Boolean)}
                </div>
              ) : (
                <div className="products-list">
                  {Array.isArray(safeResults) && safeResults.map((product, index) => {
                    try {
                      if (!product || typeof product !== 'object') return null;
                      
                      const productId = product.id || product.key || `product-${index}`;
                      
                      return (
                        <ProductCard
                          key={productId}
                          product={product}
                          size="large"
                          showQuickActions={true}
                          className="search-result-list-item"
                        />
                      );
                    } catch (productError) {
                      console.warn(`Product render error at index ${index}:`, productError);
                      return null;
                    }
                  }).filter(Boolean)}
                </div>
              )}

              {loading && safeCurrentPage > 1 && (
                <div className="loading-more">
                  <Loader className="spinning" size={20} />
                  <span>Loading more results...</span>
                </div>
              )}

              {Math.max(1, Number(totalPages) || 1) > 1 && (
                <div className="results-pagination">
                  {safeViewMode === 'list' && hasNextPage ? (
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

      {showFiltersPanel && (
        <div className="filters-overlay" onClick={() => setShowFiltersPanel(false)} />
      )}
    </div>
  );
};

export default SearchResults;