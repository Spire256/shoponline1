import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Grid, List, SortAsc, SortDesc } from 'lucide-react';
import SearchFilters from './SearchFilters';
import SearchResults from './SearchResults';
import './SearchPage.css';

const SearchPage = () => {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter states
  const [filters, setFilters] = useState({
    category: '',
    min_price: '',
    max_price: '',
    brand: '',
    material: '',
    color: '',
    size: '',
    condition: '',
    rating_min: '',
    in_stock: false,
    on_sale: false,
    is_featured: false,
  });

  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('-created_at');

  // Search API call
  const performSearch = useCallback(
    async (query, currentFilters, page = 1, sort = sortBy) => {
      if (!query.trim()) {
        setProducts([]);
        setTotalResults(0);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.append('q', query);
        params.append('page', page.toString());
        params.append('ordering', sort);

        // Add filters to params
        Object.entries(currentFilters).forEach(([key, value]) => {
          if (value && value !== '') {
            if (typeof value === 'boolean') {
              if (value) params.append(key, 'true');
            } else {
              params.append(key, value.toString());
            }
          }
        });

        const response = await fetch(`/api/products/search/?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        setProducts(data.results || []);
        setTotalResults(data.count || 0);
        setTotalPages(Math.ceil((data.count || 0) / 12));
        setCurrentPage(page);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to search products. Please try again.');
        setProducts([]);
        setTotalResults(0);
      } finally {
        setLoading(false);
      }
    },
    [sortBy]
  );

  // Handle search input change
  const handleSearchChange = e => {
    setSearchQuery(e.target.value);
  };

  // Handle search submit
  const handleSearchSubmit = e => {
    e.preventDefault();
    setCurrentPage(1);
    performSearch(searchQuery, filters, 1, sortBy);
  };

  // Handle filter changes
  const handleFiltersChange = newFilters => {
    setFilters(newFilters);
    setCurrentPage(1);
    performSearch(searchQuery, newFilters, 1, sortBy);
  };

  // Handle sort change
  const handleSortChange = newSort => {
    setSortBy(newSort);
    performSearch(searchQuery, filters, currentPage, newSort);
  };

  // Handle pagination
  const handlePageChange = page => {
    if (page >= 1 && page <= totalPages) {
      performSearch(searchQuery, filters, page, sortBy);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Clear all filters
  const clearFilters = () => {
    const clearedFilters = {
      category: '',
      min_price: '',
      max_price: '',
      brand: '',
      material: '',
      color: '',
      size: '',
      condition: '',
      rating_min: '',
      in_stock: false,
      on_sale: false,
      is_featured: false,
    };
    setFilters(clearedFilters);
    setCurrentPage(1);
    performSearch(searchQuery, clearedFilters, 1, sortBy);
  };

  // Initial search on component mount
  useEffect(() => {
    // You can set initial search query here if needed
    // For now, we'll leave it empty until user searches
  }, []);

  // Sort options
  const sortOptions = [
    { value: '-created_at', label: 'Newest First' },
    { value: 'created_at', label: 'Oldest First' },
    { value: 'name', label: 'Name A-Z' },
    { value: '-name', label: 'Name Z-A' },
    { value: 'price', label: 'Price Low to High' },
    { value: '-price', label: 'Price High to Low' },
    { value: '-rating_average', label: 'Highest Rated' },
    { value: '-view_count', label: 'Most Popular' },
  ];

  return (
    <div className="search-page">
      {/* Search Header */}
      <div className="search-header">
        <div className="container">
          <div className="search-form-container">
            <div className="search-form">
              <div className="search-input-group">
                <Search className="search-icon" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search for products..."
                  className="search-input"
                  onKeyDown={e => e.key === 'Enter' && handleSearchSubmit(e)}
                />
                <button type="button" onClick={handleSearchSubmit} className="search-btn">
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="search-content">
          {/* Results Header */}
          {searchQuery && (
            <div className="search-results-header">
              <div className="results-info">
                <h1 className="results-title">Search Results for "{searchQuery}"</h1>
                {!loading && (
                  <p className="results-count">
                    {totalResults} {totalResults === 1 ? 'product' : 'products'} found
                  </p>
                )}
              </div>

              <div className="search-controls">
                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`filter-toggle ${showFilters ? 'active' : ''}`}
                >
                  <Filter size={18} />
                  Filters
                </button>

                {/* View Mode Toggle */}
                <div className="view-mode-toggle">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  >
                    <Grid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  >
                    <List size={18} />
                  </button>
                </div>

                {/* Sort Dropdown */}
                <div className="sort-dropdown">
                  <select
                    value={sortBy}
                    onChange={e => handleSortChange(e.target.value)}
                    className="sort-select"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="search-body">
            {/* Filters Sidebar */}
            <SearchFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={clearFilters}
              visible={showFilters}
              loading={loading}
            />

            {/* Search Results */}
            <div className={`search-results ${showFilters ? 'with-filters' : 'full-width'}`}>
              <SearchResults
                products={products}
                loading={loading}
                error={error}
                searchQuery={searchQuery}
                viewMode={viewMode}
                currentPage={currentPage}
                totalPages={totalPages}
                totalResults={totalResults}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
