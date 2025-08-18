// src/components/admin/Orders/OrderManagement.js

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import OrderTable from './OrderTable';
import OrderFilters from './OrderFilters';
import CODOrders from './CODOrders';
import OrderDetailsAdmin from './OrderDetailsAdmin';
import { useAuth } from '../../../hooks/useAuth';
import { useNotifications } from '../../../hooks/useNotifications';
import './OrderManagement.css';

const OrderManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotifications();

  // State management
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    payment_method: '',
    is_cod: '',
    date_from: '',
    date_to: '',
    search: '',
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);

  // View states
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'cod', 'analytics'
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Order statistics
  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    delivered: 0,
    cancelled: 0,
    cod_pending: 0,
    cod_verified: 0,
  });

  // Fetch orders function
  const fetchOrders = useCallback(
    async (page = 1, appliedFilters = filters) => {
      try {
        setLoading(true);
        setError(null);

        // Build query parameters
        const params = new URLSearchParams({
          page: page.toString(),
          page_size: '20',
        });

        // Add filters
        Object.entries(appliedFilters).forEach(([key, value]) => {
          if (value && value !== '') {
            params.append(key, value);
          }
        });

        const response = await fetch(`/api/orders/?${params}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.status}`);
        }

        const data = await response.json();

        setOrders(data.results || []);
        setTotalPages(Math.ceil(data.count / 20));
        setTotalOrders(data.count);
        setCurrentPage(page);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err.message);
        showNotification('Failed to load orders', 'error');
      } finally {
        setLoading(false);
      }
    },
    [filters, showNotification]
  );

  // Fetch order statistics
  const fetchOrderStats = useCallback(async () => {
    try {
      const response = await fetch('/api/orders/analytics/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order statistics');
      }

      const data = await response.json();

      setOrderStats({
        total: data.total_orders,
        pending: data.pending_orders,
        confirmed: data.orders_by_status?.find(s => s.status === 'confirmed')?.count || 0,
        delivered: data.completed_orders,
        cancelled: data.cancelled_orders,
        cod_pending: data.cod_orders,
        cod_verified: 0, // This would need to be added to analytics
      });
    } catch (err) {
      console.error('Error fetching order stats:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (user && user.is_admin) {
      fetchOrders();
      fetchOrderStats();
    }
  }, [user, fetchOrders, fetchOrderStats, refreshTrigger]);

  // Handle filter changes
  const handleFilterChange = useCallback(
    newFilters => {
      setFilters(newFilters);
      setCurrentPage(1);
      fetchOrders(1, newFilters);
    },
    [fetchOrders]
  );

  // Handle page change
  const handlePageChange = useCallback(
    page => {
      fetchOrders(page, filters);
    },
    [fetchOrders, filters]
  );

  // Handle order selection
  const handleOrderSelect = useCallback((orderId, isSelected) => {
    if (isSelected) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  }, []);

  // Handle select all
  const handleSelectAll = useCallback(
    isSelected => {
      if (isSelected) {
        setSelectedOrders(orders.map(order => order.id));
      } else {
        setSelectedOrders([]);
      }
    },
    [orders]
  );

  // Handle order view
  const handleViewOrder = useCallback(order => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  }, []);

  // Handle order status update
  const handleStatusUpdate = useCallback(
    async (orderId, newStatus, notes = '') => {
      try {
        const response = await fetch(`/api/orders/${orderId}/`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: newStatus,
            admin_notes: notes,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update order status');
        }

        // Refresh orders
        setRefreshTrigger(prev => prev + 1);
        showNotification('Order status updated successfully', 'success');
      } catch (err) {
        console.error('Error updating order status:', err);
        showNotification('Failed to update order status', 'error');
      }
    },
    [showNotification]
  );

  // Handle bulk status update
  const handleBulkStatusUpdate = useCallback(
    async (newStatus, notes = '') => {
      if (selectedOrders.length === 0) {
        showNotification('Please select orders first', 'warning');
        return;
      }

      try {
        const response = await fetch('/api/orders/bulk-update/', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            order_ids: selectedOrders,
            status: newStatus,
            notes: notes,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update orders');
        }

        // Clear selections and refresh
        setSelectedOrders([]);
        setRefreshTrigger(prev => prev + 1);
        showNotification(`Successfully updated ${selectedOrders.length} orders`, 'success');
      } catch (err) {
        console.error('Error bulk updating orders:', err);
        showNotification('Failed to update orders', 'error');
      }
    },
    [selectedOrders, showNotification]
  );

  // Handle order confirmation
  const handleConfirmOrder = useCallback(
    async orderId => {
      try {
        const response = await fetch(`/api/orders/${orderId}/confirm/`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to confirm order');
        }

        setRefreshTrigger(prev => prev + 1);
        showNotification('Order confirmed successfully', 'success');
      } catch (err) {
        console.error('Error confirming order:', err);
        showNotification('Failed to confirm order', 'error');
      }
    },
    [showNotification]
  );

  // Handle mark as delivered
  const handleMarkDelivered = useCallback(
    async orderId => {
      try {
        const response = await fetch(`/api/orders/${orderId}/delivered/`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to mark order as delivered');
        }

        setRefreshTrigger(prev => prev + 1);
        showNotification('Order marked as delivered', 'success');
      } catch (err) {
        console.error('Error marking order as delivered:', err);
        showNotification('Failed to mark order as delivered', 'error');
      }
    },
    [showNotification]
  );

  // Render loading state
  if (loading && orders.length === 0) {
    return (
      <div className="order-management">
        <div className="order-management__header">
          <h1>Order Management</h1>
        </div>
        <div className="order-management__loading">
          <div className="loading-spinner" />
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error && orders.length === 0) {
    return (
      <div className="order-management">
        <div className="order-management__header">
          <h1>Order Management</h1>
        </div>
        <div className="order-management__error">
          <div className="error-icon">⚠️</div>
          <h3>Failed to Load Orders</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => fetchOrders()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-management">
      {/* Header */}
      <div className="order-management__header">
        <div className="header-left">
          <h1>Order Management</h1>
          <p className="header-subtitle">Manage and track all customer orders</p>
        </div>
        <div className="header-right">
          <button
            className="btn btn-secondary"
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Order Statistics */}
      <div className="order-stats">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>{orderStats.total}</h3>
            <p>Total Orders</p>
          </div>
        </div>
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{orderStats.pending}</h3>
            <p>Pending</p>
          </div>
        </div>
        <div className="stat-card confirmed">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{orderStats.confirmed}</h3>
            <p>Confirmed</p>
          </div>
        </div>
        <div className="stat-card delivered">
          <div className="stat-icon">🚚</div>
          <div className="stat-content">
            <h3>{orderStats.delivered}</h3>
            <p>Delivered</p>
          </div>
        </div>
        <div className="stat-card cod">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>{orderStats.cod_pending}</h3>
            <p>COD Orders</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="order-tabs">
        <button
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Orders ({totalOrders})
        </button>
        <button
          className={`tab-button ${activeTab === 'cod' ? 'active' : ''}`}
          onClick={() => setActiveTab('cod')}
        >
          COD Orders ({orderStats.cod_pending})
        </button>
      </div>

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <div className="bulk-actions">
          <div className="bulk-actions__info">
            <span>{selectedOrders.length} order(s) selected</span>
          </div>
          <div className="bulk-actions__buttons">
            <select
              className="bulk-status-select"
              onChange={e => {
                if (e.target.value) {
                  handleBulkStatusUpdate(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
            >
              <option value="">Update Status</option>
              <option value="confirmed">Confirm Orders</option>
              <option value="processing">Mark as Processing</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Mark as Delivered</option>
              <option value="cancelled">Cancel Orders</option>
            </select>
            <button className="btn btn-secondary" onClick={() => setSelectedOrders([])}>
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="order-content">
        {/* Filters */}
        <OrderFilters filters={filters} onFilterChange={handleFilterChange} loading={loading} />

        {/* Orders Display */}
        {activeTab === 'all' && (
          <OrderTable
            orders={orders}
            loading={loading}
            error={error}
            selectedOrders={selectedOrders}
            currentPage={currentPage}
            totalPages={totalPages}
            onOrderSelect={handleOrderSelect}
            onSelectAll={handleSelectAll}
            onViewOrder={handleViewOrder}
            onStatusUpdate={handleStatusUpdate}
            onConfirmOrder={handleConfirmOrder}
            onMarkDelivered={handleMarkDelivered}
            onPageChange={handlePageChange}
            onRefresh={() => setRefreshTrigger(prev => prev + 1)}
          />
        )}

        {activeTab === 'cod' && (
          <CODOrders
            onRefresh={() => setRefreshTrigger(prev => prev + 1)}
            onViewOrder={handleViewOrder}
          />
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <OrderDetailsAdmin
          order={selectedOrder}
          isOpen={showOrderDetails}
          onClose={() => {
            setShowOrderDetails(false);
            setSelectedOrder(null);
          }}
          onOrderUpdate={() => {
            setRefreshTrigger(prev => prev + 1);
            setShowOrderDetails(false);
            setSelectedOrder(null);
          }}
        />
      )}

      {/* Quick Actions Floating Panel */}
      <div className="quick-actions-panel">
        <h4>Quick Actions</h4>
        <div className="quick-actions-grid">
          <button
            className="quick-action-btn pending"
            onClick={() => handleFilterChange({ ...filters, status: 'pending' })}
          >
            <span className="icon">⏳</span>
            <span>Pending Orders</span>
            <span className="count">{orderStats.pending}</span>
          </button>
          <button className="quick-action-btn cod" onClick={() => setActiveTab('cod')}>
            <span className="icon">💰</span>
            <span>COD Orders</span>
            <span className="count">{orderStats.cod_pending}</span>
          </button>
          <button
            className="quick-action-btn delivered"
            onClick={() => handleFilterChange({ ...filters, status: 'delivered' })}
          >
            <span className="icon">🚚</span>
            <span>Delivered</span>
            <span className="count">{orderStats.delivered}</span>
          </button>
          <button
            className="quick-action-btn cancelled"
            onClick={() => handleFilterChange({ ...filters, status: 'cancelled' })}
          >
            <span className="icon">❌</span>
            <span>Cancelled</span>
            <span className="count">{orderStats.cancelled}</span>
          </button>
        </div>
      </div>

      {/* Export Options */}
      <div className="export-panel">
        <h4>Export Orders</h4>
        <div className="export-buttons">
          <button className="btn btn-outline">📊 Export CSV</button>
          <button className="btn btn-outline">📄 Export PDF</button>
          <button className="btn btn-outline">📈 Analytics Report</button>
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;
