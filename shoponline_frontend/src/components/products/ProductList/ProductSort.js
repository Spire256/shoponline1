// src/components/products/ProductList/ProductSort.js
import React from 'react';
import { ChevronDown } from 'lucide-react';

const ProductSort = ({ value, onChange, options = null, className = '' }) => {
  const defaultSortOptions = [
    { value: 'created_at_desc', label: 'Newest First' },
    { value: 'created_at_asc', label: 'Oldest First' },
    { value: 'name_asc', label: 'Name: A to Z' },
    { value: 'name_desc', label: 'Name: Z to A' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'rating_desc', label: 'Highest Rated' },
    { value: 'rating_asc', label: 'Lowest Rated' },
    { value: 'popularity_desc', label: 'Most Popular' },
    { value: 'view_count_desc', label: 'Most Viewed' },
  ];

  const sortOptions = options || defaultSortOptions;
  const selectedOption = sortOptions.find(option => option.value === value);

  const handleSortChange = event => {
    const newValue = event.target.value;
    onChange(newValue);
  };

  // Convert sort value to API ordering format
  const getOrderingValue = sortValue => {
    const sortMap = {
      created_at_desc: '-created_at',
      created_at_asc: 'created_at',
      name_asc: 'name',
      name_desc: '-name',
      price_asc: 'price',
      price_desc: '-price',
      rating_desc: '-rating_average',
      rating_asc: 'rating_average',
      popularity_desc: '-order_count',
      view_count_desc: '-view_count',
    };
    return sortMap[sortValue] || '-created_at';
  };

  return (
    <div className={`product-sort ${className}`}>
      <label htmlFor="sort-select" className="sort-label">
        Sort by:
      </label>
      <div className="sort-select-wrapper">
        <select id="sort-select" value={value} onChange={handleSortChange} className="sort-select">
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="sort-select-icon" size={16} />
      </div>
    </div>
  );
};

// Custom hook for sort functionality
export const useProductSort = (initialSort = 'created_at_desc') => {
  const [sortValue, setSortValue] = React.useState(initialSort);

  const getOrderingParam = () => {
    const sortMap = {
      created_at_desc: '-created_at',
      created_at_asc: 'created_at',
      name_asc: 'name',
      name_desc: '-name',
      price_asc: 'price',
      price_desc: '-price',
      rating_desc: '-rating_average',
      rating_asc: 'rating_average',
      popularity_desc: '-order_count',
      view_count_desc: '-view_count',
    };
    return sortMap[sortValue] || '-created_at';
  };

  return {
    sortValue,
    setSortValue,
    orderingParam: getOrderingParam(),
  };
};

export default ProductSort;
