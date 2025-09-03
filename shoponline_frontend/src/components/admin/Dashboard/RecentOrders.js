import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle, Clock, Truck, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import './Dashboard.css';

const RecentOrders = ({ orders: propOrders, loading: propLoading, onRefresh }) => {
  const [orders, setOrders] = useState(propOrders || []);
  const [loading, setLoading] = useState(propLoading || false);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  // Fetch orders if not provided via props
  useEffect(() => {
    if (!propOrders) {
      fetchOrders();
    } else {
      setOrders(propOrders);
    }
  }, [propOrders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/v1/admin/analytics/recent_orders/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.orders || data || []);
    } catch (err) {
      console.error('Error fetching recent orders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      fetchOrders();
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-4 h-4 text-amber-500" />,
      confirmed: <CheckCircle className="w-4 h-4 text-blue-500" />,
      processing: <RefreshCw className="w-4 h-4 text-purple-500" />,
      out_for_delivery: <Truck className="w-4 h-4 text-indigo-500" />,
      delivered: <CheckCircle className="w-4 h-4 text-green-500" />,
      cancelled: <XCircle className="w-4 h-4 text-red-500" />,
      cod_pending: <AlertTriangle className="w-4 h-4 text-orange-500" />,
    };
    return icons[status] || <Clock className="w-4 h-4 text-gray-500" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-800 border-amber-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      processing: 'bg-purple-100 text-purple-800 border-purple-200',
      out_for_delivery: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      cod_pending: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPaymentMethodDisplay = (method, isCoD) => {
    if (isCoD || method === 'cash_on_delivery') return 'Cash on Delivery';
    if (method === 'mtn_momo') return 'MTN MoMo';
    if (method === 'airtel_money') return 'Airtel Money';
    return method?.replace('_', ' ').toUpperCase() || 'Unknown';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-UG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const filterTabs = [
    { id: 'all', label: 'All Orders', icon: '📋' },
    { id: 'pending', label: 'Pending', icon: '⏳' },
    { id: 'confirmed', label: 'Confirmed', icon: '✅' },
    { id: 'delivered', label: 'Delivered', icon: '🚚' },
    { id: 'cod', label: 'COD Orders', icon: '💰' },
  ];

  const filteredOrders = orders.filter(order => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'cod') return order.is_cash_on_delivery || order.payment_method === 'cash_on_delivery';
    return order.status === activeFilter;
  });

  const orderCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cod: orders.filter(o => o.is_cash_on_delivery || o.payment_method === 'cash_on_delivery').length,
  };

  if (loading && (!orders || orders.length === 0)) {
    return (
      <div className="recent-orders-container">
        <div className="card-header">
          <h3>Recent Orders</h3>
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

  if (error) {
    return (
      <div className="recent-orders-container">
        <div className="card-header">
          <h3>Recent Orders</h3>
        </div>
        <div className="card-body">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h4>Failed to Load Orders</h4>
            <p>{error}</p>
            <button onClick={handleRefresh} className="btn btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="recent-orders-container">
      <div className="card-header">
        <div className="header-content">
          <h3>Recent Orders</h3>
          <p>Latest customer orders and their status</p>
        </div>
        <button 
          onClick={handleRefresh} 
          className="btn btn-secondary btn-sm"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="filter-tabs">
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            className={`filter-tab ${activeFilter === tab.id ? 'active' : ''}`}
            onClick={() => setActiveFilter(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
            <span className="tab-count">({orderCounts[tab.id]})</span>
          </button>
        ))}
      </div>

      <div className="orders-table">
        {/* Desktop Table Header */}
        <div className="table-header hidden md:grid">
          <div className="header-cell">Order</div>
          <div className="header-cell">Customer</div>
          <div className="header-cell">Items</div>
          <div className="header-cell">Amount</div>
          <div className="header-cell">Payment</div>
          <div className="header-cell">Status</div>
          <div className="header-cell">Date</div>
          <div className="header-cell">Actions</div>
        </div>

        {/* Table Body */}
        <div className="table-body">
          {filteredOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h4>No Orders Found</h4>
              <p>
                {activeFilter === 'all' 
                  ? 'No orders have been placed yet.'
                  : `No ${activeFilter} orders found.`
                }
              </p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order.id} className="table-row">
                {/* Order Info */}
                <div className="table-cell order-info-cell" data-label="Order">
                  <div className="order-info">
                    <div className="order-number-text">
                      #{order.order_number || order.id}
                    </div>
                    {(order.is_cash_on_delivery || order.payment_method === 'cash_on_delivery') && (
                      <span className="cod-indicator-small">COD</span>
                    )}
                  </div>
                </div>

                {/* Customer Info */}
                <div className="table-cell customer-info-cell" data-label="Customer">
                  <div className="customer-info">
                    <div className="customer-name">
                      {order.customer_name || order.first_name + ' ' + order.last_name || 'Guest'}
                    </div>
                    <div className="customer-email">
                      {order.customer_email || order.email}
                    </div>
                  </div>
                </div>

                {/* Items Count */}
                <div className="table-cell items-info-cell" data-label="Items">
                  <div className="items-info">
                    <span className="items-count">{order.items_count || order.orderitem_set?.length || 0}</span>
                    <span className="items-text">items</span>
                  </div>
                </div>

                {/* Amount */}
                <div className="table-cell amount-cell" data-label="Amount">
                  <div className="amount-value">
                    {formatCurrency(order.total_amount || order.amount)}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="table-cell payment-cell" data-label="Payment">
                  <span className={`payment-badge ${
                    order.payment_method === 'mtn_momo' ? 'mtn' :
                    order.payment_method === 'airtel_money' ? 'airtel' : 'cod'
                  }`}>
                    {getPaymentMethodDisplay(order.payment_method, order.is_cash_on_delivery)}
                  </span>
                </div>

                {/* Status */}
                <div className="table-cell status-cell" data-label="Status">
                  <span className={`status-badge ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="status-text">
                      {order.status?.replace('_', ' ').toUpperCase()}
                    </span>
                  </span>
                </div>

                {/* Date */}
                <div className="table-cell date-cell" data-label="Date">
                  <div className="order-date">
                    {formatDate(order.created_at || order.createdAt)}
                  </div>
                </div>

                {/* Actions */}
                <div className="table-cell actions-cell" data-label="Actions">
                  <div className="action-buttons">
                    <button 
                      className="btn btn-sm btn-outline-primary"
                      title="View Order"
                      onClick={() => console.log('View order:', order.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Orders Summary */}
      <div className="orders-summary">
        <div className="summary-stats">
          <div className="summary-stat">
            <span className="stat-label">Total Orders:</span>
            <span className="stat-value">{orderCounts.all}</span>
          </div>
          <div className="summary-stat">
            <span className="stat-label">Pending:</span>
            <span className="stat-value warning">{orderCounts.pending}</span>
          </div>
          <div className="summary-stat">
            <span className="stat-label">COD Orders:</span>
            <span className="stat-value info">{orderCounts.cod}</span>
          </div>
        </div>
        
        <div className="view-all-actions">
          <button className="btn btn-outline-primary">
            View All Orders
          </button>
          <button className="btn btn-primary">
            Manage Orders
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecentOrders;