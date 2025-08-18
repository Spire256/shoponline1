import React, { useState, useEffect } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';

const OrderFilters = ({ filters, onFilterChange, loading }) => {
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [isExpanded, setIsExpanded] = useState(false);
  const debouncedSearch = useDebounce(localSearch, 500);

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refunded', label: 'Refunded' },
  ];

  const paymentMethodOptions = [
    { value: '', label: 'All Payment Methods' },
    { value: 'mtn_momo', label: 'MTN Mobile Money' },
    { value: 'airtel_money', label: 'Airtel Money' },
    { value: 'cash_on_delivery', label: 'Cash on Delivery' },
  ];

  useEffect(() => {
    onFilterChange({ search: debouncedSearch });
  }, [debouncedSearch, onFilterChange]);

  const handleFilterChange = (field, value) => {
    onFilterChange({ [field]: value });
  };

  const handleDateChange = (field, value) => {
    onFilterChange({ [field]: value });
  };

  const clearFilters = () => {
    setLocalSearch('');
    onFilterChange({
      status: '',
      payment_method: '',
      date_from: '',
      date_to: '',
      search: '',
    });
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(value => value !== '' && value !== null);
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== '' && value !== null).length;
  };

  return (
    <div className="order-filters">
      <div className="filters-header">
        <div className="search-container">
          <div className="search-input-wrapper">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 21L16.514 16.506M19 10.5A8.5 8.5 0 1110.5 2A8.5 8.5 0 0119 10.5Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by order number, email, or name..."
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              className="search-input"
            />
            {localSearch && (
              <button type="button" className="clear-search" onClick={() => setLocalSearch('')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="filters-actions">
          <button
            type="button"
            className={`filter-toggle ${isExpanded ? 'expanded' : ''}`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 4A1 1 0 014 3H20A1 1 0 0121 4V6A1 1 0 0120.707 6.293L14 13V20A1 1 0 0113.707 20.707L10 17V13L3.293 6.293A1 1 0 013 6V4Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Filters
            {getActiveFiltersCount() > 0 && (
              <span className="filter-count">{getActiveFiltersCount()}</span>
            )}
          </button>

          {hasActiveFilters() && (
            <button
              type="button"
              className="clear-filters"
              onClick={clearFilters}
              disabled={loading}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="filters-content">
          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="statusFilter">Order Status</label>
              <select
                id="statusFilter"
                value={filters.status || ''}
                onChange={e => handleFilterChange('status', e.target.value)}
                disabled={loading}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="paymentMethodFilter">Payment Method</label>
              <select
                id="paymentMethodFilter"
                value={filters.payment_method || ''}
                onChange={e => handleFilterChange('payment_method', e.target.value)}
                disabled={loading}
              >
                {paymentMethodOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="dateFrom">Date From</label>
              <input
                type="date"
                id="dateFrom"
                value={filters.date_from || ''}
                onChange={e => handleDateChange('date_from', e.target.value)}
                disabled={loading}
                max={filters.date_to || new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="dateTo">Date To</label>
              <input
                type="date"
                id="dateTo"
                value={filters.date_to || ''}
                onChange={e => handleDateChange('date_to', e.target.value)}
                disabled={loading}
                min={filters.date_from || ''}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="quick-filters">
            <span className="quick-filters-label">Quick Filters:</span>
            <div className="quick-filter-buttons">
              <button
                type="button"
                className={`quick-filter ${filters.status === 'pending' ? 'active' : ''}`}
                onClick={() =>
                  handleFilterChange('status', filters.status === 'pending' ? '' : 'pending')
                }
                disabled={loading}
              >
                Pending Orders
              </button>
              <button
                type="button"
                className={`quick-filter ${filters.status === 'delivered' ? 'active' : ''}`}
                onClick={() =>
                  handleFilterChange('status', filters.status === 'delivered' ? '' : 'delivered')
                }
                disabled={loading}
              >
                Completed
              </button>
              <button
                type="button"
                className={`quick-filter ${
                  filters.payment_method === 'cash_on_delivery' ? 'active' : ''
                }`}
                onClick={() =>
                  handleFilterChange(
                    'payment_method',
                    filters.payment_method === 'cash_on_delivery' ? '' : 'cash_on_delivery'
                  )
                }
                disabled={loading}
              >
                COD Orders
              </button>
              <button
                type="button"
                className={`quick-filter ${filters.date_from === getTodayDate() ? 'active' : ''}`}
                onClick={() => {
                  const today = getTodayDate();
                  handleDateChange('date_from', filters.date_from === today ? '' : today);
                  handleDateChange('date_to', filters.date_from === today ? '' : today);
                }}
                disabled={loading}
              >
                Today's Orders
              </button>
            </div>
          </div>
        </div>
      )}

      {hasActiveFilters() && (
        <div className="active-filters">
          <span className="active-filters-label">Active Filters:</span>
          <div className="active-filter-tags">
            {filters.status && (
              <span className="filter-tag">
                Status: {statusOptions.find(opt => opt.value === filters.status)?.label}
                <button
                  type="button"
                  onClick={() => handleFilterChange('status', '')}
                  className="remove-filter"
                >
                  ×
                </button>
              </span>
            )}
            {filters.payment_method && (
              <span className="filter-tag">
                Payment:{' '}
                {paymentMethodOptions.find(opt => opt.value === filters.payment_method)?.label}
                <button
                  type="button"
                  onClick={() => handleFilterChange('payment_method', '')}
                  className="remove-filter"
                >
                  ×
                </button>
              </span>
            )}
            {filters.date_from && (
              <span className="filter-tag">
                From: {filters.date_from}
                <button
                  type="button"
                  onClick={() => handleDateChange('date_from', '')}
                  className="remove-filter"
                >
                  ×
                </button>
              </span>
            )}
            {filters.date_to && (
              <span className="filter-tag">
                To: {filters.date_to}
                <button
                  type="button"
                  onClick={() => handleDateChange('date_to', '')}
                  className="remove-filter"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

export default OrderFilters;
