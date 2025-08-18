import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { ordersAPI } from '../../../services/api/ordersAPI';
import OrderCard from './OrderCard';
import OrderFilters from './OrderFilters';
import Loading from '../../common/UI/Loading/Spinner';
import Alert from '../../common/UI/Alert/Alert';
import './OrderHistory.css';

const OrderHistory = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    payment_method: '',
    date_from: '',
    date_to: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false,
  });

  const fetchOrders = async (page = 1, currentFilters = filters) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        page_size: 10,
        ...currentFilters,
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) {
          delete params[key];
        }
      });

      const response = await ordersAPI.getOrders(params);

      setOrders(response.results);
      setPagination({
        currentPage: page,
        totalPages: Math.ceil(response.count / 10),
        totalItems: response.count,
        hasNext: response.next !== null,
        hasPrev: response.previous !== null,
      });
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load order history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1, filters);
  }, [filters]);

  const handleFilterChange = newFilters => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handlePageChange = page => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchOrders(page, filters);
    }
  };

  const handleOrderUpdate = updatedOrder => {
    setOrders(prev => prev.map(order => (order.id === updatedOrder.id ? updatedOrder : order)));
  };

  const getStatusColor = status => {
    const colors = {
      pending: '#f59e0b',
      confirmed: '#3b82f6',
      processing: '#8b5cf6',
      out_for_delivery: '#06b6d4',
      delivered: '#10b981',
      cancelled: '#ef4444',
      refunded: '#6b7280',
    };
    return colors[status] || '#6b7280';
  };

  if (loading && orders.length === 0) {
    return (
      <div className="order-history">
        <div className="order-history-header">
          <h2>Order History</h2>
        </div>
        <div className="loading-container">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className="order-history">
      <div className="order-history-header">
        <h2>Order History</h2>
        <p className="order-history-subtitle">Track all your orders and their current status</p>
      </div>

      <OrderFilters filters={filters} onFilterChange={handleFilterChange} loading={loading} />

      {error && <Alert type="error" message={error} />}

      <div className="order-history-content">
        {orders.length === 0 && !loading ? (
          <div className="no-orders">
            <div className="no-orders-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 11H15M9 15H12M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3>No Orders Found</h3>
            <p>
              {Object.values(filters).some(f => f !== '')
                ? 'No orders match your current filters. Try adjusting your search criteria.'
                : "You haven't placed any orders yet. Start shopping to see your orders here!"}
            </p>
            <button className="btn btn-primary" onClick={() => (window.location.href = '/')}>
              Start Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="order-history-stats">
              <div className="stat-item">
                <span className="stat-value">{pagination.totalItems}</span>
                <span className="stat-label">Total Orders</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  {orders.filter(order => order.status === 'delivered').length}
                </span>
                <span className="stat-label">Completed</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  {
                    orders.filter(order =>
                      ['pending', 'confirmed', 'processing'].includes(order.status)
                    ).length
                  }
                </span>
                <span className="stat-label">In Progress</span>
              </div>
            </div>

            <div className="orders-list">
              {orders.map(order => (
                <OrderCard key={order.id} order={order} onOrderUpdate={handleOrderUpdate} />
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev || loading}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M15 18L9 12L15 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Previous
                </button>

                <div className="pagination-info">
                  <span>
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <span className="pagination-total">({pagination.totalItems} total orders)</span>
                </div>

                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext || loading}
                >
                  Next
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9 18L15 12L9 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {loading && orders.length > 0 && (
        <div className="loading-overlay">
          <Loading />
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
