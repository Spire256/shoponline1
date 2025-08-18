import React, { useState, useEffect } from 'react';
import { Star, Check, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '../../common/UI/Button/Button';
import { format_ugx_currency } from '../../../utils/helpers/currencyHelpers';
import { categoriesAPI } from '../../../services/api/categoriesAPI';
import './SearchFilters.css';

const SearchFilters = ({
  filters,
  onFiltersChange,
  onClearFilters,
  availableFilters = {},
  className = '',
}) => {
  const [categories, setCategories] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    category: true,
    brand: false,
    attributes: false,
    rating: false,
    availability: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      if (response.data && response.data.results) {
        setCategories(response.data.results);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([
        { id: '1', name: 'Electronics', slug: 'electronics' },
        { id: '2', name: 'Fashion', slug: 'fashion' },
        { id: '3', name: 'Home & Garden', slug: 'home-garden' },
        { id: '4', name: 'Sports', slug: 'sports' },
        { id: '5', name: 'Books', slug: 'books' },
      ]);
    }
  };

  const handleFilterChange = (key, value) => {
    onFiltersChange({ [key]: value });
  };

  const handlePriceRangeChange = (key, value) => {
    const numValue = value === '' ? '' : Number(value);
    if (value !== '' && (isNaN(numValue) || numValue < 0)) {
      return;
    }
    handleFilterChange(key, value === '' ? '' : numValue);
  };

  const toggleSection = section => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const renderSection = (title, key, children, hasActiveFilters = false) => (
    <div className={`filter-section ${expandedSections[key] ? 'expanded' : ''}`}>
      <button
        className={`section-header ${hasActiveFilters ? 'has-active-filters' : ''}`}
        onClick={() => toggleSection(key)}
      >
        <span className="section-title">{title}</span>
        {hasActiveFilters && <div className="active-indicator" />}
        {expandedSections[key] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expandedSections[key] && <div className="section-content">{children}</div>}
    </div>
  );

  const renderPriceFilter = () => {
    const hasActivePriceFilter = filters.price_min || filters.price_max;

    return renderSection(
      'Price Range',
      'price',
      <div className="price-filter">
        <div className="price-inputs">
          <div className="price-input-group">
            <label htmlFor="price-min">Min Price</label>
            <input
              id="price-min"
              type="number"
              value={filters.price_min || ''}
              onChange={e => handlePriceRangeChange('price_min', e.target.value)}
              placeholder="0"
              min="0"
              className="price-input"
            />
          </div>
          <div className="price-separator">to</div>
          <div className="price-input-group">
            <label htmlFor="price-max">Max Price</label>
            <input
              id="price-max"
              type="number"
              value={filters.price_max || ''}
              onChange={e => handlePriceRangeChange('price_max', e.target.value)}
              placeholder="Any"
              min="0"
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
              { label: 'Over 1M', min: 1000000, max: '' },
            ].map(range => (
              <button
                key={range.label}
                className={`price-range-btn ${
                  filters.price_min === range.min && filters.price_max === range.max ? 'active' : ''
                }`}
                onClick={() => {
                  onFiltersChange({
                    price_min: range.min,
                    price_max: range.max,
                  });
                }}
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
              {filters.price_min ? format_ugx_currency(filters.price_min) : '0'} -{' '}
              {filters.price_max ? format_ugx_currency(filters.price_max) : 'Any'}
            </strong>
          </div>
        )}
      </div>,
      hasActivePriceFilter
    );
  };

  const renderCategoryFilter = () => {
    const hasActiveCategoryFilter = filters.category;

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
              checked={!filters.category}
              onChange={e => handleFilterChange('category', '')}
            />
            <span className="category-name">All Categories</span>
          </label>

          {categories.map(category => (
            <label key={category.id} className="category-item">
              <input
                type="radio"
                name="category"
                value={category.id}
                checked={filters.category === category.id}
                onChange={e => handleFilterChange('category', e.target.value)}
              />
              <span className="category-name">{category.name}</span>
            </label>
          ))}
        </div>
      </div>,
      hasActiveCategoryFilter
    );
  };

  const renderBrandFilter = () => {
    const hasActiveBrandFilter = filters.brand;

    const brands = availableFilters.brands || [
      'Samsung',
      'Apple',
      'Nike',
      'Adidas',
      'Sony',
      'LG',
      'HP',
      'Dell',
    ];

    return renderSection(
      'Brands',
      'brand',
      <div className="brand-filter">
        <input
          type="text"
          value={filters.brand || ''}
          onChange={e => handleFilterChange('brand', e.target.value)}
          placeholder="Search brands..."
          className="brand-search"
        />

        <div className="brand-list">
          {brands
            .filter(
              brand => !filters.brand || brand.toLowerCase().includes(filters.brand.toLowerCase())
            )
            .slice(0, 10)
            .map(brand => (
              <label key={brand} className="brand-item">
                <input
                  type="checkbox"
                  checked={filters.brand === brand}
                  onChange={e => handleFilterChange('brand', e.target.checked ? brand : '')}
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
    const hasActiveAttributeFilter = filters.color || filters.size;

    const colors = availableFilters.colors || [
      'Black',
      'White',
      'Red',
      'Blue',
      'Green',
      'Yellow',
      'Pink',
      'Gray',
    ];

    const sizes = availableFilters.sizes || [
      'XS',
      'S',
      'M',
      'L',
      'XL',
      'XXL',
      '32',
      '34',
      '36',
      '38',
      '40',
      '42',
    ];

    return renderSection(
      'Product Attributes',
      'attributes',
      <div className="attributes-filter">
        <div className="attribute-group">
          <h5>Color</h5>
          <div className="color-grid">
            {colors.map(color => (
              <button
                key={color}
                className={`color-option ${filters.color === color ? 'selected' : ''}`}
                onClick={() => handleFilterChange('color', filters.color === color ? '' : color)}
                title={color}
                style={{
                  backgroundColor: color.toLowerCase(),
                  border: color.toLowerCase() === 'white' ? '1px solid #cbd5e1' : 'none',
                }}
              >
                {filters.color === color && <Check size={12} color="white" />}
              </button>
            ))}
          </div>
        </div>

        <div className="attribute-group">
          <h5>Size</h5>
          <div className="size-grid">
            {sizes.map(size => (
              <button
                key={size}
                className={`size-option ${filters.size === size ? 'selected' : ''}`}
                onClick={() => handleFilterChange('size', filters.size === size ? '' : size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>,
      hasActiveAttributeFilter
    );
  };

  const renderRatingFilter = () => {
    const hasActiveRatingFilter = filters.rating_min;

    return renderSection(
      'Customer Rating',
      'rating',
      <div className="rating-filter">
        {[4, 3, 2, 1].map(rating => (
          <label key={rating} className="rating-item">
            <input
              type="radio"
              name="rating"
              value={rating}
              checked={filters.rating_min === rating}
              onChange={e => handleFilterChange('rating_min', Number(e.target.value))}
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
    const hasActiveAvailabilityFilter = !filters.in_stock || filters.on_sale;

    return renderSection(
      'Availability',
      'availability',
      <div className="availability-filter">
        <label className="availability-item">
          <input
            type="checkbox"
            checked={filters.in_stock !== false}
            onChange={e => handleFilterChange('in_stock', e.target.checked)}
          />
          <span className="availability-text">In Stock Only</span>
        </label>

        <label className="availability-item">
          <input
            type="checkbox"
            checked={filters.on_sale || false}
            onChange={e => handleFilterChange('on_sale', e.target.checked)}
          />
          <span className="availability-text">On Sale</span>
        </label>
      </div>,
      hasActiveAvailabilityFilter
    );
  };

  const getActiveFilterCount = () => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'in_stock' && value === true) return false;
      return value !== '' && value !== null && value !== undefined && value !== false;
    }).length;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className={`search-filters ${className}`}>
      <div className="filters-header-info">
        <h3>Filter Products</h3>
        {activeFilterCount > 0 && (
          <span className="active-count">
            {activeFilterCount} active filter{activeFilterCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

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
          disabled={activeFilterCount === 0}
          className="clear-all-btn"
        >
          Clear All ({activeFilterCount})
        </Button>
      </div>
    </div>
  );
};

export default SearchFilters;
