// src/components/categories/CategoryList/CategoryList.js

import React, { useState, useEffect } from 'react';
import { Search, Filter, Grid, List, Loader2, AlertCircle } from 'lucide-react';
import CategoryCard from '../CategoryCard/CategoryCard';
import CategoryGrid from './CategoryGrid';
import './CategoryList.css';

const CategoryList = ({
  categories = [],
  loading = false,
  error = null,
  onSearch,
  onFilter,
  onLoadMore,
  hasMore = false,
  variant = 'grid', // 'grid' | 'list'
  showSearch = true,
  showFilters = true,
  showViewToggle = true,
  filters = {},
  searchQuery = '',
  title = 'Categories',
  emptyMessage = 'No categories found',
}) => {
  const [viewMode, setViewMode] = useState(variant);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [localFilters, setLocalFilters] = useState(filters);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch && localSearchQuery !== searchQuery) {
        onSearch(localSearchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchQuery, onSearch, searchQuery]);

  // Handle filter changes
  const handleFilterChange = (filterKey, value) => {
    const newFilters = { ...localFilters, [filterKey]: value };
    setLocalFilters(newFilters);
    if (onFilter) {
      onFilter(newFilters);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    const clearedFilters = {};
    setLocalFilters(clearedFilters);
    if (onFilter) {
      onFilter(clearedFilters);
    }
  };

  // Filter options
  const filterOptions = [
    {
      key: 'featured',
      label: 'Featured Only',
      type: 'boolean',
      value: localFilters.featured || false,
    },
    {
      key: 'parent',
      label: 'Parent Category',
      type: 'select',
      value: localFilters.parent || '',
      options: [
        { value: '', label: 'All Categories' },
        { value: 'root', label: 'Root Categories Only' },
      ],
    },
    {
      key: 'sort_by',
      label: 'Sort By',
      type: 'select',
      value: localFilters.sort_by || 'sort_order',
      options: [
        { value: 'sort_order', label: 'Default Order' },
        { value: 'name', label: 'Name A-Z' },
        { value: '-name', label: 'Name Z-A' },
        { value: '-created_at', label: 'Newest First' },
        { value: 'created_at', label: 'Oldest First' },
        { value: 'product_count', label: 'Product Count' },
      ],
    },
  ];

  const hasActiveFilters = Object.values(localFilters).some(
    value => value !== '' && value !== false && value !== null
  );

  return (
    <div className="category-list">
      {/* Header */}
      <div className="category-list__header">
        <div className="category-list__title-section">
          <h2 className="category-list__title">{title}</h2>
          <p className="category-list__count">
            {loading ? 'Loading...' : `${categories.length} categories`}
          </p>
        </div>

        <div className="category-list__controls">
          {/* Search */}
          {showSearch && (
            <div className="category-list__search">
              <div className="search-input-wrapper">
                <Search className="search-input-icon" size={20} />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={localSearchQuery}
                  onChange={e => setLocalSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
          )}

          {/* Filters Toggle */}
          {showFilters && (
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={`filter-toggle ${hasActiveFilters ? 'active' : ''}`}
            >
              <Filter size={18} />
              Filters
              {hasActiveFilters && <span className="filter-count-badge" />}
            </button>
          )}

          {/* View Toggle */}
          {showViewToggle && (
            <div className="view-toggle">
              <button
                onClick={() => setViewMode('grid')}
                className={`view-toggle__btn ${viewMode === 'grid' ? 'active' : ''}`}
                aria-label="Grid view"
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`view-toggle__btn ${viewMode === 'list' ? 'active' : ''}`}
                aria-label="List view"
              >
                <List size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && showFiltersPanel && (
        <div className="category-list__filters">
          <div className="filters-header">
            <h3>Filter Categories</h3>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="clear-filters-btn">
                Clear All
              </button>
            )}
          </div>

          <div className="filters-grid">
            {filterOptions.map(filter => (
              <div key={filter.key} className="filter-item">
                <label className="filter-label">{filter.label}</label>

                {filter.type === 'boolean' && (
                  <label className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={filter.value}
                      onChange={e => handleFilterChange(filter.key, e.target.checked)}
                    />
                    <span className="checkbox-checkmark" />
                    Show featured categories only
                  </label>
                )}

                {filter.type === 'select' && (
                  <select
                    value={filter.value}
                    onChange={e => handleFilterChange(filter.key, e.target.value)}
                    className="filter-select"
                  >
                    {filter.options.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="category-list__content">
        {/* Error State */}
        {error && (
          <div className="category-list__error">
            <AlertCircle size={48} />
            <h3>Something went wrong</h3>
            <p>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && categories.length === 0 && (
          <div className="category-list__loading">
            <Loader2 className="spinner" size={48} />
            <p>Loading categories...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && categories.length === 0 && (
          <div className="category-list__empty">
            <div className="empty-icon">📦</div>
            <h3>No categories found</h3>
            <p>{emptyMessage}</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="clear-filters-btn primary">
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Categories Grid/List */}
        {!error && categories.length > 0 && (
          <CategoryGrid categories={categories} viewMode={viewMode} loading={loading} />
        )}

        {/* Load More */}
        {hasMore && !loading && (
          <div className="category-list__load-more">
            <button onClick={onLoadMore} className="load-more-btn">
              Load More Categories
            </button>
          </div>
        )}

        {/* Loading More Indicator */}
        {loading && categories.length > 0 && (
          <div className="category-list__loading-more">
            <Loader2 className="spinner" size={24} />
            <span>Loading more categories...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryList;
