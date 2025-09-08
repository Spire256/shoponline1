import React, { useState, useEffect, useMemo } from 'react';
import { Star, Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import Button from '../../common/UI/Button/Button';
import { formatCurrency } from '../../../utils/helpers/formatters';
import categoriesAPI from '../../../services/api/categoriesAPI';
import productsAPI from '../../../services/api/productsAPI';
import './SearchFilters.css';

const SearchFilters = ({
  filters = {},
  onFiltersChange,
  onClearFilters,
  availableFilters = {},
  className = '',
  loading = false,
}) => {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000000 });
  const [loadingData, setLoadingData] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    category: true,
    brand: false,
    attributes: false,
    rating: false,
    availability: true,
  });

  // Initialize default filters to match backend expectations
  const defaultFilters = {
    category: '',
    price_min: '',
    price_max: '',
    brand: '',
    color: '',
    size: '',
    condition: '',
    rating_min: '',
    in_stock: true, // Default to true as per backend logic
    on_sale: false,
    is_featured: false,
    material: '',
    ...filters
  };

  useEffect(() => {
    fetchFilterData();
  }, []);

  const fetchFilterData = async () => {
    try {
      setLoadingData(true);

      // Fetch categories using the correct endpoint
      const categoriesResponse = await categoriesAPI.getCategories();
      if (categoriesResponse.results) {
        setCategories(categoriesResponse.results);
      }

      // Fetch filter options from products API if available
      try {
        const filterOptions = await productsAPI.getProductFilters();
        if (filterOptions.brands) setBrands(filterOptions.brands);
        if (filterOptions.colors) setColors(filterOptions.colors);
        if (filterOptions.sizes) setSizes(filterOptions.sizes);
        if (filterOptions.price_range) setPriceRange(filterOptions.price_range);
      } catch (error) {
        // Use fallback data if filter endpoint doesn't exist
        setBrands(availableFilters.brands || [
          'Samsung', 'Apple', 'Nike', 'Adidas', 'Sony', 'LG', 'HP', 'Dell', 'Canon', 'Microsoft'
        ]);
        setColors(availableFilters.colors || [
          'Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Gray', 'Brown', 'Silver'
        ]);
        setSizes(availableFilters.sizes || [
          'XS', 'S', 'M', 'L', 'XL', 'XXL', '32', '34', '36', '38', '40', '42'
        ]);
        setPriceRange(availableFilters.priceRange || { min: 0, max: 10000000 });
      }

    } catch (error) {
      console.error('Error fetching filter data:', error);
      // Set fallback data
      setCategories([
        { id: '1', name: 'Electronics', slug: 'electronics' },
        { id: '2', name: 'Fashion', slug: 'fashion' },
        { id: '3', name: 'Home & Garden', slug: 'home-garden' },
        { id: '4', name: 'Sports', slug: 'sports' },
        { id: '5', name: 'Books', slug: 'books' },
      ]);
    } finally {
      setLoadingData(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const updatedFilters = {
      ...defaultFilters,
      [key]: value,
    };

    // Special handling for boolean filters
    if (key === 'in_stock' || key === 'on_sale' || key === 'is_featured') {
      updatedFilters[key] = Boolean(value);
    }

    // Clear dependent filters
    if (key === 'category') {
      updatedFilters.brand = '';
      updatedFilters.color = '';
      updatedFilters.size = '';
    }

    onFiltersChange(updatedFilters);
  };

  const handlePriceRangeChange = (key, value) => {
    if (value === '') {
      handleFilterChange(key, '');
      return;
    }

    const numValue = Number(value);
    if (isNaN(numValue) || numValue < 0) {
      return;
    }

    // Validate price range
    if (key === 'price_min' && defaultFilters.price_max && numValue > defaultFilters.price_max) {
      return;
    }
    if (key === 'price_max' && defaultFilters.price_min && numValue < defaultFilters.price_min) {
      return;
    }

    handleFilterChange(key, numValue);
  };

  const handlePriceRangeSelect = (min, max) => {
    onFiltersChange({
      ...defaultFilters,
      price_min: min || '',
      price_max: max || '',
    });
  };

  const toggleSection = section => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const removeFilter = (filterKey) => {
    const clearedValue = ['in_stock'].includes(filterKey) ? true : 
                        ['on_sale', 'is_featured'].includes(filterKey) ? false : '';
    
    handleFilterChange(filterKey, clearedValue);
  };

  const renderSection = (title, key, children, hasActiveFilters = false) => (
    <div className={`filter-section ${expandedSections[key] ? 'expanded' : ''}`}>
      <button
        className={`section-header ${hasActiveFilters ? 'has-active-filters' : ''}`}
        onClick={() => toggleSection(key)}
        type="button"
      >
        <span className="section-title">{title}</span>
        {hasActiveFilters && <div className="active-indicator" />}
        {expandedSections[key] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expandedSections[key] && <div className="section-content">{children}</div>}
    </div>
  );

  const renderActiveFilters = () => {
    const activeFilters = Object.entries(defaultFilters)
      .filter(([key, value]) => {
        if (key === 'in_stock' && value === true) return false;
        if ((key === 'on_sale' || key === 'is_featured') && value === false) return false;
        return value !== '' && value !== null && value !== undefined;
      });

    if (activeFilters.length === 0) return null;

    return (
      <div className="active-filters">
        <h4>Active Filters:</h4>
        <div className="active-filters-list">
          {activeFilters.map(([key, value]) => {
            let displayValue = value;
            
            if (key === 'price_min') displayValue = `Min: ${formatCurrency(value)}`;
            else if (key === 'price_max') displayValue = `Max: ${formatCurrency(value)}`;
            else if (key === 'rating_min') displayValue = `${value}+ stars`;
            else if (key === 'category') {
              const category = categories.find(cat => cat.id === value || cat.slug === value);
              displayValue = category ? category.name : value;
            }
            else if (typeof value === 'boolean') displayValue = key.replace('_', ' ');

            return (
              <div key={key} className="active-filter-tag">
                <span>{displayValue}</span>
                <button 
                  onClick={() => removeFilter(key)} 
                  className="remove-filter"
                  type="button"
                  aria-label={`Remove ${key} filter`}
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPriceFilter = () => {
    const hasActivePriceFilter = defaultFilters.price_min || defaultFilters.price_max;

    return renderSection(
      'Price Range',
      'price',
      <div className="price-filter">
        <div className="price-inputs">
          <div className="price-input-group">
            <label htmlFor="price-min">Min Price (UGX)</label>
            <input
              id="price-min"
              type="number"
              value={defaultFilters.price_min || ''}
              onChange={e => handlePriceRangeChange('price_min', e.target.value)}
              placeholder="0"
              min="0"
              max={priceRange.max}
              className="price-input"
            />
          </div>
          <div className="price-separator">to</div>
          <div className="price-input-group">
            <label htmlFor="price-max">Max Price (UGX)</label>
            <input
              id="price-max"
              type="number"
              value={defaultFilters.price_max || ''}
              onChange={e => handlePriceRangeChange('price_max', e.target.value)}
              placeholder="Any"
              min={defaultFilters.price_min || 0}
              max={priceRange.max}
              className="price-input"
            />
          </div>
        </div>

        <div className="price-ranges">
          <h5>Quick Select:</h5>
          <div className="price-range-buttons">
            {[
              { label: 'Under 50K', min: '', max: 50000 },
              { label: '50K - 100K', min: 50000, max: 100000 },
              { label: '100K - 500K', min: 100000, max: 500000 },
              { label: '500K - 1M', min: 500000, max: 1000000 },
              { label: '1M - 5M', min: 1000000, max: 5000000 },
              { label: 'Over 5M', min: 5000000, max: '' },
            ].map(range => (
              <button
                key={range.label}
                type="button"
                className={`price-range-btn ${
                  defaultFilters.price_min === range.min && defaultFilters.price_max === range.max ? 'active' : ''
                }`}
                onClick={() => handlePriceRangeSelect(range.min, range.max)}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {hasActivePriceFilter && (
          <div className="current-range">
            <span>Current range: </span>
            <strong>
              {defaultFilters.price_min ? formatCurrency(defaultFilters.price_min) : '0'} -{' '}
              {defaultFilters.price_max ? formatCurrency(defaultFilters.price_max) : 'Any'}
            </strong>
          </div>
        )}
      </div>,
      hasActivePriceFilter
    );
  };

  const renderCategoryFilter = () => {
    const hasActiveCategoryFilter = defaultFilters.category;

    return renderSection(
      'Categories',
      'category',
      <div className="category-filter">
        <div className="category-list">
          <label className="category-item">
            <input
              type="radio"
              name="category"
              value=""
              checked={!defaultFilters.category}
              onChange={() => handleFilterChange('category', '')}
            />
            <span className="category-name">All Categories</span>
          </label>

          {categories.map(category => (
            <label key={category.id} className="category-item">
              <input
                type="radio"
                name="category"
                value={category.id}
                checked={defaultFilters.category === category.id}
                onChange={() => handleFilterChange('category', category.id)}
              />
              <span className="category-name">{category.name}</span>
              {category.product_count && (
                <span className="category-count">({category.product_count})</span>
              )}
            </label>
          ))}
        </div>
      </div>,
      hasActiveCategoryFilter
    );
  };

  const renderBrandFilter = () => {
    const hasActiveBrandFilter = defaultFilters.brand;
    const [brandSearch, setBrandSearch] = useState('');

    const filteredBrands = brands.filter(brand =>
      brand.toLowerCase().includes(brandSearch.toLowerCase())
    );

    return renderSection(
      'Brands',
      'brand',
      <div className="brand-filter">
        <input
          type="text"
          value={brandSearch}
          onChange={e => setBrandSearch(e.target.value)}
          placeholder="Search brands..."
          className="brand-search"
        />

        <div className="brand-list">
          <label className="brand-item">
            <input
              type="radio"
              name="brand"
              value=""
              checked={!defaultFilters.brand}
              onChange={() => handleFilterChange('brand', '')}
            />
            <span className="brand-name">All Brands</span>
          </label>

          {filteredBrands.slice(0, 10).map(brand => (
            <label key={brand} className="brand-item">
              <input
                type="radio"
                name="brand"
                value={brand}
                checked={defaultFilters.brand === brand}
                onChange={() => handleFilterChange('brand', brand)}
              />
              <span className="brand-name">{brand}</span>
            </label>
          ))}
        </div>
      </div>,
      hasActiveBrandFilter
    );
  };

  const renderAttributesFilter = () => {
    const hasActiveAttributeFilter = defaultFilters.color || defaultFilters.size || defaultFilters.material;

    return renderSection(
      'Product Attributes',
      'attributes',
      <div className="attributes-filter">
        {/* Color Filter */}
        <div className="attribute-group">
          <h5>Color</h5>
          <div className="color-grid">
            <button
              type="button"
              className={`color-option ${!defaultFilters.color ? 'selected' : ''}`}
              onClick={() => handleFilterChange('color', '')}
              title="Any Color"
            >
              Any
            </button>
            {colors.map(color => (
              <button
                key={color}
                type="button"
                className={`color-option ${defaultFilters.color === color ? 'selected' : ''}`}
                onClick={() => handleFilterChange('color', defaultFilters.color === color ? '' : color)}
                title={color}
                style={{
                  backgroundColor: color.toLowerCase(),
                  border: color.toLowerCase() === 'white' ? '1px solid #cbd5e1' : 'none',
                }}
              >
                {defaultFilters.color === color && <Check size={12} color={color.toLowerCase() === 'white' || color.toLowerCase() === 'yellow' ? '#000' : '#fff'} />}
              </button>
            ))}
          </div>
        </div>

        {/* Size Filter */}
        <div className="attribute-group">
          <h5>Size</h5>
          <div className="size-grid">
            <button
              type="button"
              className={`size-option ${!defaultFilters.size ? 'selected' : ''}`}
              onClick={() => handleFilterChange('size', '')}
            >
              Any
            </button>
            {sizes.map(size => (
              <button
                key={size}
                type="button"
                className={`size-option ${defaultFilters.size === size ? 'selected' : ''}`}
                onClick={() => handleFilterChange('size', defaultFilters.size === size ? '' : size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Condition Filter */}
        <div className="attribute-group">
          <h5>Condition</h5>
          <div className="condition-options">
            {[
              { value: '', label: 'Any Condition' },
              { value: 'new', label: 'New' },
              { value: 'used', label: 'Used' },
              { value: 'refurbished', label: 'Refurbished' }
            ].map(condition => (
              <label key={condition.value} className="condition-item">
                <input
                  type="radio"
                  name="condition"
                  value={condition.value}
                  checked={defaultFilters.condition === condition.value}
                  onChange={() => handleFilterChange('condition', condition.value)}
                />
                <span className="condition-name">{condition.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>,
      hasActiveAttributeFilter
    );
  };

  const renderRatingFilter = () => {
    const hasActiveRatingFilter = defaultFilters.rating_min;

    return renderSection(
      'Customer Rating',
      'rating',
      <div className="rating-filter">
        <label className="rating-item">
          <input
            type="radio"
            name="rating"
            value=""
            checked={!defaultFilters.rating_min}
            onChange={() => handleFilterChange('rating_min', '')}
          />
          <span className="rating-text">Any Rating</span>
        </label>

        {[4, 3, 2, 1].map(rating => (
          <label key={rating} className="rating-item">
            <input
              type="radio"
              name="rating"
              value={rating}
              checked={defaultFilters.rating_min === rating}
              onChange={() => handleFilterChange('rating_min', rating)}
            />
            <div className="rating-display">
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill={i < rating ? '#fbbf24' : 'none'}
                    color={i < rating ? '#fbbf24' : '#cbd5e1'}
                  />
                ))}
              </div>
              <span className="rating-text">& up</span>
            </div>
          </label>
        ))}
      </div>,
      hasActiveRatingFilter
    );
  };

  const renderAvailabilityFilter = () => {
    const hasActiveAvailabilityFilter = !defaultFilters.in_stock || defaultFilters.on_sale || defaultFilters.is_featured;

    return renderSection(
      'Availability & Features',
      'availability',
      <div className="availability-filter">
        <label className="availability-item">
          <input
            type="checkbox"
            checked={defaultFilters.in_stock}
            onChange={e => handleFilterChange('in_stock', e.target.checked)}
          />
          <span className="availability-text">In Stock Only</span>
        </label>

        <label className="availability-item">
          <input
            type="checkbox"
            checked={defaultFilters.on_sale || false}
            onChange={e => handleFilterChange('on_sale', e.target.checked)}
          />
          <span className="availability-text">On Sale</span>
        </label>

        <label className="availability-item">
          <input
            type="checkbox"
            checked={defaultFilters.is_featured || false}
            onChange={e => handleFilterChange('is_featured', e.target.checked)}
          />
          <span className="availability-text">Featured Products</span>
        </label>
      </div>,
      hasActiveAvailabilityFilter
    );
  };

  const getActiveFilterCount = () => {
    return Object.entries(defaultFilters).filter(([key, value]) => {
      if (key === 'in_stock' && value === true) return false;
      if ((key === 'on_sale' || key === 'is_featured') && value === false) return false;
      return value !== '' && value !== null && value !== undefined;
    }).length;
  };

  const activeFilterCount = getActiveFilterCount();

  if (loadingData && !categories.length) {
    return (
      <div className={`search-filters ${className}`}>
        <div className="filters-loading">
          <div className="loading-spinner" />
          <p>Loading filters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`search-filters ${className} ${loading ? 'updating' : ''}`}>
      <div className="filters-header">
        <div className="filters-header-info">
          <h3>Filter Products</h3>
          {activeFilterCount > 0 && (
            <span className="active-count">
              {activeFilterCount} active filter{activeFilterCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {activeFilterCount > 0 && renderActiveFilters()}

      <div className="filters-content">
        {renderPriceFilter()}
        {renderCategoryFilter()}
        {renderBrandFilter()}
        {renderAttributesFilter()}
        {renderRatingFilter()}
        {renderAvailabilityFilter()}
      </div>

      <div className="filters-actions">
        <Button
          variant="outline"
          onClick={onClearFilters}
          disabled={activeFilterCount === 0 || loading}
          className="clear-all-btn"
        >
          Clear All {activeFilterCount > 0 && `(${activeFilterCount})`}
        </Button>
      </div>

      {loading && (
        <div className="filters-loading-overlay">
          <div className="loading-spinner small" />
        </div>
      )}
    </div>
  );
};

export default SearchFilters;