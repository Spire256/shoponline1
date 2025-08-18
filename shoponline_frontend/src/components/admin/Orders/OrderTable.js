// src/components/admin/Orders/OrderTable.js

import React, { useState } from 'react';
import OrderStatus from './OrderStatus';
import { useNotifications } from '../../../hooks/useNotifications';

const OrderTable = ({
  orders,
  loading,
  error,
  selectedOrders,
  currentPage,
  totalPages,
  onOrderSelect,
  onSelectAll,
  onViewOrder,
  onStatusUpdate,
  onConfirmOrder,
  onMarkDelivered,
  onPageChange,
  onRefresh,
}) => {
  const { showNotification } = useNotifications();
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  // Format currency
  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = dateString => {
    return new Date(dateString).toLocaleString('en-UG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle sort
  const handleSort = key => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Handle quick status update
  const handleQuickStatusUpdate = async (orderId, newStatus, event) => {
    event.stopPropagation();
    try {
      await onStatusUpdate(orderId, newStatus);
    } catch (err) {
      showNotification('Failed to update order status', 'error');
    }
  };

  // Handle quick actions
  const handleQuickAction = async (orderId, action, event) => {
    event.stopPropagation();

    switch (action) {
      case 'confirm':
        await onConfirmOrder(orderId);
        break;
      case 'deliver':
        await onMarkDelivered(orderId);
        break;
      case 'view':
        const order = orders.find(o => o.id === orderId);
        onViewOrder(order);
        break;
      default:
        break;
    }
  };

  // Generate pagination
  const generatePagination = () => {
    const pages = [];
    const maxVisible = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  if (error) {
    return (
      <div className="order-table-error">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Orders</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={onRefresh}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-table-container">
      {/* Table Actions */}
      <div className="table-actions">
        <div className="actions-left">
          <span className="results-info">
            Showing {orders.length} of {(currentPage - 1) * 20 + orders.length} orders
          </span>
        </div>
        <div className="actions-right">
          <button className="btn btn-outline" onClick={onRefresh} disabled={loading}>
            {loading ? '🔄 Refreshing...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="order-table-wrapper">
        <table className="order-table">
          <thead>
            <tr>
              <th className="checkbox-column">
                <input
                  type="checkbox"
                  checked={selectedOrders.length === orders.length && orders.length > 0}
                  onChange={e => onSelectAll(e.target.checked)}
                />
              </th>
              <th
                className={`sortable ${
                  sortConfig.key === 'order_number' ? sortConfig.direction : ''
                }`}
                onClick={() => handleSort('order_number')}
              >
                Order #
                <span className="sort-indicator">
                  {sortConfig.key === 'order_number' &&
                    (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </span>
              </th>
              <th
                className={`sortable ${
                  sortConfig.key === 'customer_name' ? sortConfig.direction : ''
                }`}
                onClick={() => handleSort('customer_name')}
              >
                Customer
                <span className="sort-indicator">
                  {sortConfig.key === 'customer_name' &&
                    (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </span>
              </th>
              <th>Contact</th>
              <th
                className={`sortable ${
                  sortConfig.key === 'total_amount' ? sortConfig.direction : ''
                }`}
                onClick={() => handleSort('total_amount')}
              >
                Amount
                <span className="sort-indicator">
                  {sortConfig.key === 'total_amount' &&
                    (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </span>
              </th>
              <th>Payment</th>
              <th>Status</th>
              <th>Items</th>
              <th
                className={`sortable ${
                  sortConfig.key === 'created_at' ? sortConfig.direction : ''
                }`}
                onClick={() => handleSort('created_at')}
              >
                Date
                <span className="sort-indicator">
                  {sortConfig.key === 'created_at' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </span>
              </th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Loading rows
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={`loading-${index}`} className="loading-row">
                  <td>
                    <div className="skeleton checkbox-skeleton" />
                  </td>
                  <td>
                    <div className="skeleton text-skeleton" />
                  </td>
                  <td>
                    <div className="skeleton text-skeleton" />
                  </td>
                  <td>
                    <div className="skeleton text-skeleton" />
                  </td>
                  <td>
                    <div className="skeleton text-skeleton" />
                  </td>
                  <td>
                    <div className="skeleton badge-skeleton" />
                  </td>
                  <td>
                    <div className="skeleton badge-skeleton" />
                  </td>
                  <td>
                    <div className="skeleton text-skeleton" />
                  </td>
                  <td>
                    <div className="skeleton text-skeleton" />
                  </td>
                  <td>
                    <div className="skeleton actions-skeleton" />
                  </td>
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr className="empty-row">
                <td colSpan="10">
                  <div className="empty-state">
                    <div className="empty-icon">📦</div>
                    <h3>No Orders Found</h3>
                    <p>No orders match your current filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map(order => (
                <tr
                  key={order.id}
                  className={`order-row ${selectedOrders.includes(order.id) ? 'selected' : ''}`}
                  onClick={() => onViewOrder(order)}
                >
                  <td onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order.id)}
                      onChange={e => onOrderSelect(order.id, e.target.checked)}
                    />
                  </td>

                  <td className="order-number">
                    <span className="order-number-text">{order.order_number}</span>
                  </td>

                  <td className="customer-info">
                    <div className="customer-name">{order.customer_name}</div>
                  </td>

                  <td className="contact-info">
                    <div className="contact-details">
                      <div className="email">{order.email}</div>
                      <div className="phone">{order.phone}</div>
                    </div>
                  </td>

                  <td className="amount">
                    <span className="amount-value">{formatCurrency(order.total_amount)}</span>
                  </td>

                  <td className="payment-method">
                    <div className="payment-info">
                      <span className={`payment-badge ${order.payment_method}`}>
                        {order.payment_method_display}
                      </span>
                      {order.is_cash_on_delivery && (
                        <span
                          className={`cod-status ${order.cod_verified ? 'verified' : 'pending'}`}
                        >
                          {order.cod_verified ? '✅' : '⏳'}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="status">
                    <OrderStatus status={order.status} />
                  </td>

                  <td className="items-count">
                    <span className="items-badge">{order.items_count} items</span>
                  </td>

                  <td className="order-date">
                    <span className="date-text">{formatDate(order.created_at)}</span>
                  </td>

                  <td className="actions" onClick={e => e.stopPropagation()}>
                    <div className="action-buttons">
                      <button
                        className="action-btn view"
                        onClick={e => handleQuickAction(order.id, 'view', e)}
                        title="View Details"
                      >
                        👁️
                      </button>

                      {order.status === 'pending' && (
                        <button
                          className="action-btn confirm"
                          onClick={e => handleQuickAction(order.id, 'confirm', e)}
                          title="Confirm Order"
                        >
                          ✅
                        </button>
                      )}

                      {['confirmed', 'processing', 'out_for_delivery'].includes(order.status) && (
                        <button
                          className="action-btn deliver"
                          onClick={e => handleQuickAction(order.id, 'deliver', e)}
                          title="Mark as Delivered"
                        >
                          🚚
                        </button>
                      )}

                      {/* Status dropdown for quick updates */}
                      <select
                        className="status-select"
                        value=""
                        onChange={e => {
                          if (e.target.value) {
                            handleQuickStatusUpdate(order.id, e.target.value, e);
                            e.target.value = '';
                          }
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        <option value="">Change Status</option>
                        {order.status !== 'confirmed' && <option value="confirmed">Confirm</option>}
                        {order.status !== 'processing' && (
                          <option value="processing">Processing</option>
                        )}
                        {order.status !== 'out_for_delivery' && (
                          <option value="out_for_delivery">Out for Delivery</option>
                        )}
                        {order.status !== 'delivered' && (
                          <option value="delivered">Delivered</option>
                        )}
                        {order.can_be_cancelled && <option value="cancelled">Cancel</option>}
                      </select>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="table-pagination">
          <div className="pagination-info">
            <span>
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
            >
              ⏮️ First
            </button>

            <button
              className="pagination-btn"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              ⏪ Previous
            </button>

            <div className="page-numbers">
              {generatePagination().map(page => (
                <button
                  key={page}
                  className={`page-btn ${page === currentPage ? 'active' : ''}`}
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              className="pagination-btn"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next ⏩
            </button>

            <button
              className="pagination-btn"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last ⏭️
            </button>
          </div>
        </div>
      )}

      {/* Table Footer Summary */}
      <div className="table-footer">
        <div className="footer-stats">
          <span className="stat">
            <strong>{orders.length}</strong> orders shown
          </span>
          {orders.length > 0 && (
            <>
              <span className="stat">
                Total Value:{' '}
                <strong>
                  {formatCurrency(
                    orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0)
                  )}
                </strong>
              </span>
              <span className="stat">
                COD Orders:{' '}
                <strong>{orders.filter(order => order.is_cash_on_delivery).length}</strong>
              </span>
              <span className="stat">
                Pending:{' '}
                <strong>{orders.filter(order => order.status === 'pending').length}</strong>
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderTable;
