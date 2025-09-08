// src/components/admin/Orders/OrderFilters.js

import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar, CreditCard, Package, Users } from 'lucide-react';
import './OrderFilters.css';

const OrderFilters = ({ filters, onFilterChange, loading }) => {
  const [localFilters, setLocalFilters] = useState({
    status: '',
    payment_method: '',
    is_cod: '',
    date_from: '',
    date_to: '',
    search: '',
    ...filters,
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(prev => ({ ...prev, ...filters }));
  }, [filters]);

  // Handle search with debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalFilters(prev => ({ ...prev, search: value }));

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for search
    const newTimeout = setTimeout(() => {
      onFilterChange({ ...localFilters, search: value });
    }, 500);

    setSearchTimeout(newTimeout);
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    const clearedFilters = {
      status: '',
      payment_method: '',
      is_cod: '',
      date_from: '',
      date_to: '',
      search: '',
    };
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return Object.values(localFilters).some(value => value !== '');
  };

  // Quick filter presets
  const quickFilters = [
    {
      label: 'Pending Orders',
      icon: Package,
      filters: { status: 'pending' },
    },
    {
      label: 'COD Orders',
      icon: CreditCard,
      filters: { is_cod: 'true' },
    },
    {
      label: 'Today\'s Orders',
      icon: Calendar,
      filters: { date_from: new Date().toISOString().split('T')[0] },
    },
    {
      label: 'Completed Orders',
      icon: Package,
      filters: { status: 'delivered' },
    },
  ];

  // Apply quick filter
  const applyQuickFilter = (quickFilter) => {
    const newFilters = { ...localFilters, ...quickFilter.filters };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="order-filters">
      <div className="filters-header">
        <div className="filters-title">
          <Filter className="title-icon" />
          <h3>Filter Orders</h3>
          {hasActiveFilters() && (
            <span className="active-filters-count">
              {Object.values(localFilters).filter(v => v !== '').length} active
            </span>
          )}
        </div>

        <div className="filters-actions">
          <button
            className="toggle-advanced-btn"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            Advanced Filters
          </button>

          {hasActiveFilters() && (
            <button
              className="clear-filters-btn"
              onClick={clearAllFilters}
              disabled={loading}
            >
              <X className="btn-icon" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-input-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search by order number, customer name, email..."
            value={localFilters.search}
            onChange={handleSearchChange}
            className="search-input"
            disabled={loading}
          />
          {localFilters.search && (
            <button
              className="clear-search-btn"
              onClick={() => handleFilterChange('search', '')}
            >
              <X className="clear-icon" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Filters */}
      <div className="quick-filters">
        <div className="quick-filters-label">Quick Filters:</div>
        <div className="quick-filters-buttons">
          {quickFilters.map((filter, index) => {
            const Icon = filter.icon;
            return (
              <button
                key={index}
                className="quick-filter-btn"
                onClick={() => applyQuickFilter(filter)}
                disabled={loading}
              >
                <Icon className="filter-icon" />
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Filters Row */}
      <div className="main-filters">
        <div className="filter-group">
          <label className="filter-label">Status</label>
          <select
            className="filter-select"
            value={localFilters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            disabled={loading}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Payment Method</label>
          <select
            className="filter-select"
            value={localFilters.payment_method}
            onChange={(e) => handleFilterChange('payment_method', e.target.value)}
            disabled={loading}
          >
            <option value="">All Methods</option>
            <option value="mtn_momo">MTN Mobile Money</option>
            <option value="airtel_money">Airtel Money</option>
            <option value="cash_on_delivery">Cash on Delivery</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">COD Orders</label>
          <select
            className="filter-select"
            value={localFilters.is_cod}
            onChange={(e) => handleFilterChange('is_cod', e.target.value)}
            disabled={loading}
          >
            <option value="">All Orders</option>
            <option value="true">COD Only</option>
            <option value="false">Non-COD Only</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="advanced-filters">
          <div className="advanced-filters-header">
            <h4>Advanced Filters</h4>
            <button
              className="close-advanced-btn"
              onClick={() => setShowAdvancedFilters(false)}
            >
              <X className="close-icon" />
            </button>
          </div>

          <div className="advanced-filters-content">
            <div className="filter-row">
              <div className="filter-group">
                <label className="filter-label">
                  <Calendar className="label-icon" />
                  Date From
                </label>
                <input
                  type="date"
                  className="filter-input"
                  value={localFilters.date_from}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">
                  <Calendar className="label-icon" />
                  Date To
                </label>
                <input
                  type="date"
                  className="filter-input"
                  value={localFilters.date_to}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="filter-row">
              <div className="filter-group">
                <label className="filter-label">
                  <CreditCard className="label-icon" />
                  Payment Status
                </label>
                <select
                  className="filter-select"
                  value={localFilters.payment_status || ''}
                  onChange={(e) => handleFilterChange('payment_status', e.target.value)}
                  disabled={loading}
                >
                  <option value="">All Payment Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">
                  <Users className="label-icon" />
                  Customer Type
                </label>
                <select
                  className="filter-select"
                  value={localFilters.customer_type || ''}
                  onChange={(e) => handleFilterChange('customer_type', e.target.value)}
                  disabled={loading}
                >
                  <option value="">All Customers</option>
                  <option value="registered">Registered</option>
                  <option value="guest">Guest</option>
                </select>
              </div>
            </div>

            <div className="filter-row">
              <div className="filter-group">
                <label className="filter-label">Amount Range</label>
                <div className="amount-range">
                  <input
                    type="number"
                    className="filter-input amount-input"
                    placeholder="Min amount"
                    value={localFilters.min_amount || ''}
                    onChange={(e) => handleFilterChange('min_amount', e.target.value)}
                    disabled={loading}
                  />
                  <span className="range-separator">to</span>
                  <input
                    type="number"
                    className="filter-input amount-input"
                    placeholder="Max amount"
                    value={localFilters.max_amount || ''}
                    onChange={(e) => handleFilterChange('max_amount', e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters() && (
        <div className="active-filters-summary">
          <div className="active-filters-header">
            <span className="summary-title">Active Filters:</span>
          </div>
          <div className="active-filters-list">
            {Object.entries(localFilters).map(([key, value]) => {
              if (!value) return null;

              let displayLabel = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              let displayValue = value;

              // Format display values
              if (key === 'is_cod') {
                displayLabel = 'COD';
                displayValue = value === 'true' ? 'Yes' : 'No';
              } else if (key === 'payment_method') {
                displayLabel = 'Payment';
                displayValue = value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              } else if (key === 'status') {
                displayValue = value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              }

              return (
                <div key={key} className="active-filter-tag">
                  <span className="filter-tag-content">
                    <strong>{displayLabel}:</strong> {displayValue}
                  </span>
                  <button
                    className="remove-filter-btn"
                    onClick={() => handleFilterChange(key, '')}
                  >
                    <X className="remove-icon" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="filters-summary">
        <div className="summary-info">
          <span className="summary-text">
            {loading ? 'Applying filters...' : 'Filters applied'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrderFilters;