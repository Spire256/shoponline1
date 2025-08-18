import React, { useState } from 'react';
import './Dashboard.css';

const RecentOrders = ({ orders, loading, onRefresh }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-UG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = status => {
    const statusConfig = {
      pending: { class: 'warning', icon: '⏳', label: 'Pending' },
      confirmed: { class: 'info', icon: '✅', label: 'Confirmed' },
      processing: { class: 'primary', icon: '⚡', label: 'Processing' },
      out_for_delivery: { class: 'purple', icon: '🚚', label: 'Out for Delivery' },
      delivered: { class: 'success', icon: '📦', label: 'Delivered' },
      cancelled: { class: 'danger', icon: '❌', label: 'Cancelled' },
      refunded: { class: 'secondary', icon: '💰', label: 'Refunded' },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`status-badge ${config.class}`}>
        <span className="status-icon">{config.icon}</span>
        <span className="status-text">{config.label}</span>
      </span>
    );
  };

  const getPaymentMethodBadge = (paymentMethod, isCOD) => {
    const methodConfig = {
      mtn_momo: { class: 'mtn', icon: '📱', label: 'MTN MoMo' },
      airtel_money: { class: 'airtel', icon: '📱', label: 'Airtel Money' },
      cash_on_delivery: { class: 'cod', icon: '💵', label: 'Cash on Delivery' },
    };

    const config = methodConfig[paymentMethod] || methodConfig.cash_on_delivery;

    return (
      <span className={`payment-badge ${config.class}`}>
        <span className="payment-icon">{config.icon}</span>
        <span className="payment-text">{config.label}</span>
        {isCOD && <span className="cod-indicator">COD</span>}
      </span>
    );
  };

  const filterOrders = (orders, filter) => {
    if (!orders) return [];

    switch (filter) {
      case 'pending':
        return orders.filter(order => order.status === 'pending');
      case 'cod':
        return orders.filter(order => order.is_cash_on_delivery);
      case 'today':
        const today = new Date().toDateString();
        return orders.filter(order => new Date(order.created_at).toDateString() === today);
      default:
        return orders;
    }
  };

  const filteredOrders = filterOrders(orders, selectedFilter);
  const pendingCount = orders?.filter(order => order.status === 'pending').length || 0;
  const codCount = orders?.filter(order => order.is_cash_on_delivery).length || 0;
  const todayCount =
    orders?.filter(order => new Date(order.created_at).toDateString() === new Date().toDateString())
      .length || 0;

  if (loading) {
    return (
      <div className="recent-orders-container">
        <div className="card-header">
          <div className="header-title">
            <h3>Recent Orders</h3>
            <p>Latest orders from your customers</p>
          </div>
        </div>
        <div className="card-body">
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Loading recent orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="recent-orders-container">
      <div className="card">
        <div className="card-header">
          <div className="header-title">
            <h3>Recent Orders</h3>
            <p>Latest orders from your customers</p>
          </div>

          <div className="header-actions">
            <div className="filter-tabs">
              <button
                className={`filter-tab ${selectedFilter === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedFilter('all')}
              >
                All ({orders?.length || 0})
              </button>
              <button
                className={`filter-tab ${selectedFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setSelectedFilter('pending')}
              >
                <span className="tab-icon">⏳</span>
                Pending ({pendingCount})
              </button>
              <button
                className={`filter-tab ${selectedFilter === 'cod' ? 'active' : ''}`}
                onClick={() => setSelectedFilter('cod')}
              >
                <span className="tab-icon">💵</span>
                COD ({codCount})
              </button>
              <button
                className={`filter-tab ${selectedFilter === 'today' ? 'active' : ''}`}
                onClick={() => setSelectedFilter('today')}
              >
                <span className="tab-icon">📅</span>
                Today ({todayCount})
              </button>
            </div>

            <button
              onClick={onRefresh}
              className="btn btn-outline-primary btn-sm refresh-btn"
              disabled={loading}
            >
              <span className="refresh-icon">🔄</span>
              Refresh
            </button>
          </div>
        </div>

        <div className="card-body">
          {!filteredOrders || filteredOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h4>No orders found</h4>
              <p>
                {selectedFilter === 'all'
                  ? 'No orders have been placed yet.'
                  : `No ${selectedFilter} orders found.`}
              </p>
            </div>
          ) : (
            <div className="orders-table">
              <div className="table-header">
                <div className="header-cell order-number">Order</div>
                <div className="header-cell customer">Customer</div>
                <div className="header-cell items">Items</div>
                <div className="header-cell amount">Amount</div>
                <div className="header-cell payment">Payment</div>
                <div className="header-cell status">Status</div>
                <div className="header-cell date">Date</div>
                <div className="header-cell actions">Actions</div>
              </div>

              <div className="table-body">
                {filteredOrders.map(order => (
                  <div key={order.id} className="table-row">
                    <div className="table-cell order-number">
                      <div className="order-info">
                        <span className="order-number-text">#{order.order_number}</span>
                        {order.is_cash_on_delivery && (
                          <span className="cod-indicator-small">COD</span>
                        )}
                      </div>
                    </div>

                    <div className="table-cell customer">
                      <div className="customer-info">
                        <div className="customer-name">{order.customer_name}</div>
                        <div className="customer-email">{order.customer_email}</div>
                      </div>
                    </div>

                    <div className="table-cell items">
                      <div className="items-info">
                        <span className="items-count">{order.items_count}</span>
                        <span className="items-text">
                          {order.items_count === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                    </div>

                    <div className="table-cell amount">
                      <div className="amount-info">
                        <span className="amount-value">{formatCurrency(order.total_amount)}</span>
                      </div>
                    </div>

                    <div className="table-cell payment">
                      {getPaymentMethodBadge(order.payment_method, order.is_cash_on_delivery)}
                    </div>

                    <div className="table-cell status">{getStatusBadge(order.status)}</div>

                    <div className="table-cell date">
                      <div className="date-info">
                        <span className="date-text">{formatDate(order.created_at)}</span>
                      </div>
                    </div>

                    <div className="table-cell actions">
                      <div className="action-buttons">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          title="View Order Details"
                        >
                          👁️
                        </button>

                        {order.status === 'pending' && (
                          <button className="btn btn-sm btn-success" title="Confirm Order">
                            ✅
                          </button>
                        )}

                        {order.is_cash_on_delivery && order.status !== 'delivered' && (
                          <button className="btn btn-sm btn-warning" title="Mark as Paid">
                            💰
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Summary */}
          {filteredOrders && filteredOrders.length > 0 && (
            <div className="orders-summary">
              <div className="summary-stats">
                <div className="summary-stat">
                  <span className="stat-label">Total Orders:</span>
                  <span className="stat-value">{filteredOrders.length}</span>
                </div>

                <div className="summary-stat">
                  <span className="stat-label">Total Value:</span>
                  <span className="stat-value">
                    {formatCurrency(
                      filteredOrders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0)
                    )}
                  </span>
                </div>

                <div className="summary-stat">
                  <span className="stat-label">Pending:</span>
                  <span className="stat-value warning">
                    {filteredOrders.filter(o => o.status === 'pending').length}
                  </span>
                </div>

                <div className="summary-stat">
                  <span className="stat-label">COD Orders:</span>
                  <span className="stat-value info">
                    {filteredOrders.filter(o => o.is_cash_on_delivery).length}
                  </span>
                </div>
              </div>

              <div className="view-all-actions">
                <button className="btn btn-primary">View All Orders</button>
                <button className="btn btn-outline-secondary">Export Data</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentOrders;
