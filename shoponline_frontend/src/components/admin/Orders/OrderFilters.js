// src/components/admin/Orders/OrderFilters.js

import React, { useState, useEffect } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';

const OrderFilters = ({ filters, onFilterChange, loading }) => {
  // Local state for form inputs
  const [localFilters, setLocalFilters] = useState(filters);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [datePreset, setDatePreset] = useState('');

  // Debounced search term
  const debouncedSearch = useDebounce(localFilters.search, 500);

  // Uganda districts for delivery filtering
  const ugandaDistricts = [
    'Kampala',
    'Wakiso',
    'Mukono',
    'Entebbe',
    'Jinja',
    'Mbale',
    'Gulu',
    'Lira',
    'Mbarara',
    'Fort Portal',
    'Kasese',
    'Kabale',
    'Masaka',
    'Soroti',
    'Arua',
    'Kitgum',
    'Moroto',
    'Hoima',
  ];

  // Order status options
  const statusOptions = [
    { value: 'pending', label: 'Pending', icon: '⏳' },
    { value: 'confirmed', label: 'Confirmed', icon: '✅' },
    { value: 'processing', label: 'Processing', icon: '⚙️' },
    { value: 'out_for_delivery', label: 'Out for Delivery', icon: '🚛' },
    { value: 'delivered', label: 'Delivered', icon: '🚚' },
    { value: 'cancelled', label: 'Cancelled', icon: '❌' },
    { value: 'refunded', label: 'Refunded', icon: '💸' },
  ];

  // Payment method options
  const paymentMethodOptions = [
    { value: 'mtn_momo', label: 'MTN Mobile Money', icon: '📱' },
    { value: 'airtel_money', label: 'Airtel Money', icon: '📱' },
    { value: 'cash_on_delivery', label: 'Cash on Delivery', icon: '💰' },
  ];

  // Date preset options
  const datePresets = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: 'This Week' },
    { value: 'last_week', label: 'Last Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'last_30_days', label: 'Last 30 Days' },
    { value: 'last_90_days', label: 'Last 90 Days' },
  ];

  // Update filters when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      handleFilterChange('search', debouncedSearch);
    }
  }, [debouncedSearch, filters.search]);

  // Handle individual filter changes
  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Handle local input changes (without immediate API call)
  const handleLocalChange = (key, value) => {
    setLocalFilters({ ...localFilters, [key]: value });
  };

  // Handle date preset selection
  const handleDatePreset = preset => {
    const today = new Date();
    let dateFrom = '';
    let dateTo = '';

    switch (preset) {
      case 'today':
        dateFrom = dateTo = today.toISOString().split('T')[0];
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        dateFrom = dateTo = yesterday.toISOString().split('T')[0];
        break;
      case 'this_week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        dateFrom = weekStart.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
        break;
      case 'last_week':
        const lastWeekEnd = new Date(today);
        lastWeekEnd.setDate(today.getDate() - today.getDay() - 1);
        const lastWeekStart = new Date(lastWeekEnd);
        lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
        dateFrom = lastWeekStart.toISOString().split('T')[0];
        dateTo = lastWeekEnd.toISOString().split('T')[0];
        break;
      case 'this_month':
        dateFrom = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
        break;
      case 'last_month':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        dateFrom = lastMonth.toISOString().split('T')[0];
        dateTo = lastMonthEnd.toISOString().split('T')[0];
        break;
      case 'last_30_days':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        dateFrom = thirtyDaysAgo.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
        break;
      case 'last_90_days':
        const ninetyDaysAgo = new Date(today);
        ninetyDaysAgo.setDate(today.getDate() - 90);
        dateFrom = ninetyDaysAgo.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
        break;
      default:
        return;
    }

    const newFilters = {
      ...localFilters,
      date_from: dateFrom,
      date_to: dateTo,
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
    setDatePreset(preset);
  };

  // Clear all filters
  const clearFilters = () => {
    const clearedFilters = {
      status: '',
      payment_method: '',
      is_cod: '',
      date_from: '',
      date_to: '',
      search: '',
    };
    setLocalFilters(clearedFilters);
    setDatePreset('');
    onFilterChange(clearedFilters);
  };

  // Check if any filters are active
  const hasActiveFilters = Object.values(localFilters).some(value => value !== '');

  return (
    <div className="order-filters">
      {/* Basic Filters Row */}
      <div className="filters-row basic-filters">
        {/* Search */}
        <div className="filter-group search-group">
          <label htmlFor="search-input">Search Orders</label>
          <div className="search-input-wrapper">
            <input
              id="search-input"
              type="text"
              placeholder="Search by order #, customer name, email, or phone..."
              value={localFilters.search}
              onChange={e => handleLocalChange('search', e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
            {localFilters.search && (
              <button
                className="clear-search"
                onClick={() => handleFilterChange('search', '')}
                type="button"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Status Filter */}
        <div className="filter-group">
          <label htmlFor="status-filter">Status</label>
          <select
            id="status-filter"
            value={localFilters.status}
            onChange={e => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            {statusOptions.map(status => (
              <option key={status.value} value={status.value}>
                {status.icon} {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Method Filter */}
        <div className="filter-group">
          <label htmlFor="payment-filter">Payment Method</label>
          <select
            id="payment-filter"
            value={localFilters.payment_method}
            onChange={e => handleFilterChange('payment_method', e.target.value)}
            className="filter-select"
          >
            <option value="">All Payment Methods</option>
            {paymentMethodOptions.map(method => (
              <option key={method.value} value={method.value}>
                {method.icon} {method.label}
              </option>
            ))}
          </select>
        </div>

        {/* COD Filter */}
        <div className="filter-group">
          <label htmlFor="cod-filter">Cash on Delivery</label>
          <select
            id="cod-filter"
            value={localFilters.is_cod}
            onChange={e => handleFilterChange('is_cod', e.target.value)}
            className="filter-select"
          >
            <option value="">All Orders</option>
            <option value="true">💰 COD Only</option>
            <option value="false">📱 Online Payment Only</option>
          </select>
        </div>

        {/* Toggle Advanced Filters */}
        <div className="filter-group">
          <button
            type="button"
            className={`toggle-advanced-btn ${showAdvancedFilters ? 'active' : ''}`}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            {showAdvancedFilters ? '▲ Less Filters' : '▼ More Filters'}
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="filters-row advanced-filters">
          {/* Date Presets */}
          <div className="filter-group">
            <label>Date Range Presets</label>
            <div className="date-presets">
              {datePresets.map(preset => (
                <button
                  key={preset.value}
                  type="button"
                  className={`preset-btn ${datePreset === preset.value ? 'active' : ''}`}
                  onClick={() => handleDatePreset(preset.value)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="filter-group">
            <label>Custom Date Range</label>
            <div className="date-range-inputs">
              <input
                type="date"
                value={localFilters.date_from}
                onChange={e => {
                  handleFilterChange('date_from', e.target.value);
                  setDatePreset(''); // Clear preset when custom date is set
                }}
                className="date-input"
                placeholder="From"
              />
              <span className="date-separator">to</span>
              <input
                type="date"
                value={localFilters.date_to}
                onChange={e => {
                  handleFilterChange('date_to', e.target.value);
                  setDatePreset(''); // Clear preset when custom date is set
                }}
                className="date-input"
                placeholder="To"
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter Actions */}
      <div className="filters-actions">
        <div className="actions-left">
          {hasActiveFilters && (
            <div className="active-filters">
              <span className="active-filters-label">Active Filters:</span>
              <div className="active-filter-tags">
                {localFilters.status && (
                  <span className="filter-tag">
                    Status: {statusOptions.find(s => s.value === localFilters.status)?.label}
                    <button onClick={() => handleFilterChange('status', '')}>✕</button>
                  </span>
                )}
                {localFilters.payment_method && (
                  <span className="filter-tag">
                    Payment:{' '}
                    {paymentMethodOptions.find(p => p.value === localFilters.payment_method)?.label}
                    <button onClick={() => handleFilterChange('payment_method', '')}>✕</button>
                  </span>
                )}
                {localFilters.is_cod && (
                  <span className="filter-tag">
                    {localFilters.is_cod === 'true' ? 'COD Only' : 'Online Payment Only'}
                    <button onClick={() => handleFilterChange('is_cod', '')}>✕</button>
                  </span>
                )}
                {localFilters.date_from && (
                  <span className="filter-tag">
                    From: {localFilters.date_from}
                    <button onClick={() => handleFilterChange('date_from', '')}>✕</button>
                  </span>
                )}
                {localFilters.date_to && (
                  <span className="filter-tag">
                    To: {localFilters.date_to}
                    <button onClick={() => handleFilterChange('date_to', '')}>✕</button>
                  </span>
                )}
                {localFilters.search && (
                  <span className="filter-tag">
                    Search: "{localFilters.search}"
                    <button onClick={() => handleFilterChange('search', '')}>✕</button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="actions-right">
          {hasActiveFilters && (
            <button
              type="button"
              className="clear-filters-btn"
              onClick={clearFilters}
              disabled={loading}
            >
              🗑️ Clear All Filters
            </button>
          )}

          <div className="export-actions">
            <button type="button" className="export-btn" disabled={loading}>
              📊 Export Results
            </button>
          </div>
        </div>
      </div>

      {/* Quick Filter Shortcuts */}
      <div className="quick-filters">
        <span className="quick-filters-label">Quick Filters:</span>
        <div className="quick-filter-buttons">
          <button
            type="button"
            className={`quick-filter-btn ${localFilters.status === 'pending' ? 'active' : ''}`}
            onClick={() =>
              handleFilterChange('status', localFilters.status === 'pending' ? '' : 'pending')
            }
          >
            ⏳ Pending Orders
          </button>
          <button
            type="button"
            className={`quick-filter-btn ${localFilters.is_cod === 'true' ? 'active' : ''}`}
            onClick={() =>
              handleFilterChange('is_cod', localFilters.is_cod === 'true' ? '' : 'true')
            }
          >
            💰 COD Orders
          </button>
          <button
            type="button"
            className={`quick-filter-btn ${localFilters.status === 'delivered' ? 'active' : ''}`}
            onClick={() =>
              handleFilterChange('status', localFilters.status === 'delivered' ? '' : 'delivered')
            }
          >
            🚚 Delivered Orders
          </button>
          <button
            type="button"
            className={`quick-filter-btn ${datePreset === 'today' ? 'active' : ''}`}
            onClick={() => handleDatePreset('today')}
          >
            📅 Today's Orders
          </button>
          <button
            type="button"
            className={`quick-filter-btn ${datePreset === 'this_week' ? 'active' : ''}`}
            onClick={() => handleDatePreset('this_week')}
          >
            📆 This Week
          </button>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="filters-loading">
          <div className="loading-bar" />
        </div>
      )}
    </div>
  );
};

export default OrderFilters;
