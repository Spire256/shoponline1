import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, RotateCcw, Star, DollarSign } from 'lucide-react';

const SearchFilters = ({ filters, onFiltersChange, onClearFilters, visible, loading }) => {
  const [categories, setCategories] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    attributes: false,
    features: false,
    rating: false,
  });

  // Load categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories/?is_active=true', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCategories(data.results || []);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Handle filter change
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  };

  // Toggle section expansion
  const toggleSection = section => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Filter section component
  const FilterSection = ({ title, children, sectionKey, icon }) => (
    <div className="filter-section">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="filter-section-header"
        type="button"
      >
        <div className="filter-section-title">
          {icon}
          <span>{title}</span>
        </div>
        {expandedSections[sectionKey] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {expandedSections[sectionKey] && <div className="filter-section-content">{children}</div>}
    </div>
  );

  // Price range component
  const PriceRange = () => (
    <div className="price-range">
      <div className="price-inputs">
        <div className="price-input-group">
          <label>Min Price</label>
          <input
            type="number"
            placeholder="0"
            value={filters.min_price}
            onChange={e => handleFilterChange('min_price', e.target.value)}
            min="0"
            step="1000"
          />
        </div>
        <div className="price-separator">-</div>
        <div className="price-input-group">
          <label>Max Price</label>
          <input
            type="number"
            placeholder="No limit"
            value={filters.max_price}
            onChange={e => handleFilterChange('max_price', e.target.value)}
            min="0"
            step="1000"
          />
        </div>
      </div>
    </div>
  );

  // Rating filter component
  const RatingFilter = () => {
    const ratings = [5, 4, 3, 2, 1];

    return (
      <div className="rating-filter">
        {ratings.map(rating => (
          <label key={rating} className="rating-option">
            <input
              type="radio"
              name="rating"
              value={rating}
              checked={filters.rating_min === rating.toString()}
              onChange={e => handleFilterChange('rating_min', e.target.value)}
            />
            <div className="rating-display">
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={i < rating ? 'star-filled' : 'star-empty'}
                    fill={i < rating ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
              <span className="rating-text">
                {rating} {rating === 1 ? 'star' : 'stars'} & up
              </span>
            </div>
          </label>
        ))}
      </div>
    );
  };

  // Checkbox filter component
  const CheckboxFilter = ({ label, checked, onChange, disabled }) => (
    <label className={`checkbox-filter ${disabled ? 'disabled' : ''}`}>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} />
      <span className="checkbox-custom" />
      <span className="checkbox-label">{label}</span>
    </label>
  );

  // Select filter component
  const SelectFilter = ({ label, value, onChange, options, placeholder }) => (
    <div className="select-filter">
      <label className="select-label">{label}</label>
      <select value={value} onChange={onChange} className="select-input">
        <option value="">{placeholder || `All ${label}`}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  // Text input filter
  const TextFilter = ({ label, value, onChange, placeholder }) => (
    <div className="text-filter">
      <label className="text-label">{label}</label>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="text-input"
      />
    </div>
  );

  // Count active filters
  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => {
      if (typeof value === 'boolean') return value;
      return value && value !== '';
    }).length;
  };

  const activeFiltersCount = getActiveFiltersCount();

  if (!visible) {
    return null;
  }

  return (
    <div className={`search-filters ${loading ? 'loading' : ''}`}>
      <div className="filters-header">
        <h3 className="filters-title">
          Filters
          {activeFiltersCount > 0 && (
            <span className="active-filters-count">({activeFiltersCount})</span>
          )}
        </h3>
        <button
          onClick={onClearFilters}
          className="clear-filters-btn"
          disabled={activeFiltersCount === 0}
          type="button"
        >
          <RotateCcw size={16} />
          Clear All
        </button>
      </div>

      <div className="filters-content">
        {/* Category Filter */}
        <FilterSection
          title="Category"
          sectionKey="category"
          icon={<div className="section-icon">📂</div>}
        >
          <div className="category-filter">
            <select
              value={filters.category}
              onChange={e => handleFilterChange('category', e.target.value)}
              className="category-select"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.product_count})
                </option>
              ))}
            </select>
          </div>
        </FilterSection>

        {/* Price Filter */}
        <FilterSection title="Price Range" sectionKey="price" icon={<DollarSign size={16} />}>
          <PriceRange />
        </FilterSection>

        {/* Product Attributes */}
        <FilterSection
          title="Product Attributes"
          sectionKey="attributes"
          icon={<div className="section-icon">🏷️</div>}
        >
          <div className="attributes-filters">
            <TextFilter
              label="Brand"
              value={filters.brand}
              onChange={e => handleFilterChange('brand', e.target.value)}
              placeholder="Enter brand name..."
            />

            <TextFilter
              label="Material"
              value={filters.material}
              onChange={e => handleFilterChange('material', e.target.value)}
              placeholder="e.g. Cotton, Leather..."
            />

            <TextFilter
              label="Color"
              value={filters.color}
              onChange={e => handleFilterChange('color', e.target.value)}
              placeholder="e.g. Red, Blue..."
            />

            <TextFilter
              label="Size"
              value={filters.size}
              onChange={e => handleFilterChange('size', e.target.value)}
              placeholder="e.g. M, L, XL..."
            />

            <SelectFilter
              label="Condition"
              value={filters.condition}
              onChange={e => handleFilterChange('condition', e.target.value)}
              options={[
                { value: 'new', label: 'New' },
                { value: 'refurbished', label: 'Refurbished' },
                { value: 'used', label: 'Used' },
              ]}
            />
          </div>
        </FilterSection>

        {/* Product Features */}
        <FilterSection
          title="Product Features"
          sectionKey="features"
          icon={<div className="section-icon">✨</div>}
        >
          <div className="features-filters">
            <CheckboxFilter
              label="In Stock Only"
              checked={filters.in_stock}
              onChange={e => handleFilterChange('in_stock', e.target.checked)}
            />

            <CheckboxFilter
              label="On Sale"
              checked={filters.on_sale}
              onChange={e => handleFilterChange('on_sale', e.target.checked)}
            />

            <CheckboxFilter
              label="Featured Products"
              checked={filters.is_featured}
              onChange={e => handleFilterChange('is_featured', e.target.checked)}
            />
          </div>
        </FilterSection>

        {/* Rating Filter */}
        <FilterSection title="Customer Rating" sectionKey="rating" icon={<Star size={16} />}>
          <RatingFilter />
        </FilterSection>
      </div>

      {/* Filter Actions (Mobile) */}
      <div className="filters-actions mobile-only">
        <button
          onClick={onClearFilters}
          className="btn btn-outline"
          disabled={activeFiltersCount === 0}
          type="button"
        >
          Clear Filters
        </button>
        <button
          onClick={() => {
            /* Close filters on mobile */
          }}
          className="btn btn-primary"
          type="button"
        >
          Apply Filters ({activeFiltersCount})
        </button>
      </div>
    </div>
  );
};

export default SearchFilters;
