// src/components/products/ProductList/ProductFilters.js
import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { useAPI } from '../../../hooks/useAPI';

const ProductFilters = ({
  filters,
  onFilterChange,
  onClearFilters,
  categoryId = null,
  className = '',
}) => {
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    category: true,
    rating: true,
    condition: true,
    availability: true,
    brand: false,
    attributes: false,
  });

  const [priceRange, setPriceRange] = useState({
    min: filters.min_price || '',
    max: filters.max_price || '',
  });

  // Fetch filter options
  const { data: categoriesData } = useAPI('/api/categories/categories/', {
    params: { page_size: 100, is_active: true },
  });

  const { data: brandsData } = useAPI('/api/products/products/', {
    params: {
      distinct: 'brand',
      brand__isnull: false,
      brand__ne: '',
    },
  });

  const categories = categoriesData?.results || [];
  const brands = brandsData?.brands || [];

  const conditionOptions = [
    { value: 'new', label: 'New' },
    { value: 'used', label: 'Used' },
    { value: 'refurbished', label: 'Refurbished' },
  ];

  const availabilityOptions = [
    { value: 'in_stock', label: 'In Stock', key: 'is_in_stock' },
    { value: 'on_sale', label: 'On Sale', key: 'is_on_sale' },
    { value: 'featured', label: 'Featured', key: 'is_featured' },
  ];

  useEffect(() => {
    // Debounced price filter update
    const timer = setTimeout(() => {
      if (priceRange.min !== filters.min_price || priceRange.max !== filters.max_price) {
        onFilterChange({
          min_price: priceRange.min || null,
          max_price: priceRange.max || null,
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [priceRange, filters.min_price, filters.max_price, onFilterChange]);

  const toggleSection = section => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleCheckboxChange = (filterKey, value, checked) => {
    let currentValues = filters[filterKey] || [];
    if (typeof currentValues === 'string') {
      currentValues = currentValues.split(',').filter(Boolean);
    }

    let newValues;
    if (checked) {
      newValues = [...currentValues, value];
    } else {
      newValues = currentValues.filter(v => v !== value);
    }

    onFilterChange({
      [filterKey]: newValues.length > 0 ? newValues.join(',') : null,
    });
  };

  const handleSingleSelectChange = (filterKey, value) => {
    const currentValue = filters[filterKey];
    onFilterChange({
      [filterKey]: currentValue === value ? null : value,
    });
  };

  const handlePriceChange = (field, value) => {
    setPriceRange(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRatingFilter = rating => {
    onFilterChange({
      rating_gte: filters.rating_gte === rating ? null : rating,
    });
  };

  const isFilterActive = (filterKey, value = null) => {
    if (value === null) {
      return (
        filters[filterKey] !== null && filters[filterKey] !== undefined && filters[filterKey] !== ''
      );
    }

    const filterValue = filters[filterKey];
    if (Array.isArray(filterValue)) {
      return filterValue.includes(value);
    }
    if (typeof filterValue === 'string') {
      return filterValue.split(',').includes(value);
    }
    return filterValue === value;
  };

  const getActiveFiltersCount = () => {
    return Object.keys(filters).filter(
      key => filters[key] !== null && filters[key] !== undefined && filters[key] !== ''
    ).length;
  };

  const renderFilterSection = (title, sectionKey, children) => {
    const isExpanded = expandedSections[sectionKey];

    return (
      <div className="filter-section">
        <button className="filter-section__header" onClick={() => toggleSection(sectionKey)}>
          <span className="filter-section__title">{title}</span>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {isExpanded && <div className="filter-section__content">{children}</div>}
      </div>
    );
  };

  return (
    <div className={`product-filters ${className}`}>
      <div className="filters-header">
        <h3 className="filters-title">Filters</h3>
        {getActiveFiltersCount() > 0 && (
          <button className="clear-all-btn" onClick={onClearFilters}>
            <X size={16} />
            Clear All
          </button>
        )}
      </div>

      <div className="filters-content">
        {/* Price Range Filter */}
        {renderFilterSection(
          'Price Range',
          'price',
          <div className="price-filter">
            <div className="price-inputs">
              <div className="price-input-group">
                <label>Min Price (UGX)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={priceRange.min}
                  onChange={e => handlePriceChange('min', e.target.value)}
                  className="price-input"
                />
              </div>
              <div className="price-input-group">
                <label>Max Price (UGX)</label>
                <input
                  type="number"
                  placeholder="No limit"
                  value={priceRange.max}
                  onChange={e => handlePriceChange('max', e.target.value)}
                  className="price-input"
                />
              </div>
            </div>
          </div>
        )}

        {/* Category Filter (only if not viewing specific category) */}
        {!categoryId &&
          categories.length > 0 &&
          renderFilterSection(
            'Categories',
            'category',
            <div className="category-filter">
              {categories.slice(0, 10).map(category => (
                <label key={category.id} className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={isFilterActive('category', category.id)}
                    onChange={e => handleCheckboxChange('category', category.id, e.target.checked)}
                  />
                  <span className="checkbox-label">
                    {category.name}
                    {category.product_count && (
                      <span className="count">({category.product_count})</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          )}

        {/* Rating Filter */}
        {renderFilterSection(
          'Customer Rating',
          'rating',
          <div className="rating-filter">
            {[5, 4, 3, 2, 1].map(rating => (
              <button
                key={rating}
                className={`rating-option ${isFilterActive('rating_gte', rating) ? 'active' : ''}`}
                onClick={() => handleRatingFilter(rating)}
              >
                <div className="rating-stars">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} size={14} className={i < rating ? 'filled' : ''} />
                  ))}
                </div>
                <span className="rating-text">& Up</span>
              </button>
            ))}
          </div>
        )}

        {/* Availability Filter */}
        {renderFilterSection(
          'Availability',
          'availability',
          <div className="availability-filter">
            {availabilityOptions.map(option => (
              <label key={option.value} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={isFilterActive(option.key, true)}
                  onChange={e =>
                    onFilterChange({
                      [option.key]: e.target.checked || null,
                    })
                  }
                />
                <span className="checkbox-label">{option.label}</span>
              </label>
            ))}
          </div>
        )}

        {/* Condition Filter */}
        {renderFilterSection(
          'Condition',
          'condition',
          <div className="condition-filter">
            {conditionOptions.map(option => (
              <label key={option.value} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={isFilterActive('condition', option.value)}
                  onChange={e => handleCheckboxChange('condition', option.value, e.target.checked)}
                />
                <span className="checkbox-label">{option.label}</span>
              </label>
            ))}
          </div>
        )}

        {/* Brand Filter */}
        {brands.length > 0 &&
          renderFilterSection(
            'Brand',
            'brand',
            <div className="brand-filter">
              {brands.slice(0, 10).map(brand => (
                <label key={brand} className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={isFilterActive('brand', brand)}
                    onChange={e => handleCheckboxChange('brand', brand, e.target.checked)}
                  />
                  <span className="checkbox-label">{brand}</span>
                </label>
              ))}
            </div>
          )}
      </div>
    </div>
  );
};

export default ProductFilters;
