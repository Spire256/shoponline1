// src/components/admin/Orders/OrderTable.js

import React, { useState } from 'react';
import { 
  Eye, 
  Edit, 
  Check, 
  Truck, 
  Clock, 
  DollarSign, 
  MapPin,
  Phone,
  Mail,
  Package,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download
} from 'lucide-react';
import './OrderManagement.css';

const OrderTable = ({
  orders = [],
  loading = false,
  error = null,
  selectedOrders = [],
  currentPage = 1,
  totalPages = 0,
  onOrderSelect,
  onSelectAll,
  onViewOrder,
  onStatusUpdate,
  onConfirmOrder,
  onMarkDelivered,
  onPageChange,
  onRefresh
}) => {
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-UG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'status-warning',
      confirmed: 'status-info',
      processing: 'status-info',
      out_for_delivery: 'status-warning',
      delivered: 'status-success',
      cancelled: 'status-danger',
      refunded: 'status-secondary'
    };
    return colors[status] || 'status-secondary';
  };

  const getPaymentMethodColor = (method) => {
    const colors = {
      mtn_momo: 'payment-mtn',
      airtel_money: 'payment-airtel',
      cash_on_delivery: 'payment-cod'
    };
    return colors[method] || 'payment-default';
  };

  const getStatusActions = (order) => {
    const actions = [];

    if (order.status === 'pending') {
      actions.push({
        label: 'Confirm',
        icon: Check,
        action: () => onConfirmOrder(order.id),
        className: 'btn-success btn-sm'
      });
    }

    if (['confirmed', 'processing', 'out_for_delivery'].includes(order.status)) {
      actions.push({
        label: 'Mark Delivered',
        icon: Truck,
        action: () => onMarkDelivered(order.id),
        className: 'btn-info btn-sm'
      });
    }

    return actions;
  };

  if (loading && orders.length === 0) {
    return (
      <div className="table-container">
        <div className="table-loading">
          <div className="loading-spinner" />
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="table-container">
        <div className="table-error">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Orders</h3>
          <p>{error}</p>
          <button onClick={onRefresh} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      {/* Table Header */}
      <div className="table-header">
        <div className="table-title">
          <h3>Orders ({orders.length})</h3>
          {selectedOrders.length > 0 && (
            <span className="selection-count">
              {selectedOrders.length} selected
            </span>
          )}
        </div>
        
        <div className="table-actions">
          <div className="table-filters">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <button onClick={onRefresh} className="btn btn-outline" disabled={loading}>
            🔄 Refresh
          </button>

          <button className="btn btn-secondary">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="orders-table">
          <thead>
            <tr>
              <th className="checkbox-column">
                <input
                  type="checkbox"
                  checked={selectedOrders.length === orders.length && orders.length > 0}
                  onChange={onSelectAll}
                />
              </th>
              <th 
                className="sortable"
                onClick={() => handleSort('order_number')}
              >
                Order ID
                {sortField === 'order_number' && (
                  <span className={`sort-indicator ${sortOrder}`}>
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th>Customer</th>
              <th>Items</th>
              <th 
                className="sortable"
                onClick={() => handleSort('total_amount')}
              >
                Amount
                {sortField === 'total_amount' && (
                  <span className={`sort-indicator ${sortOrder}`}>
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th>Status</th>
              <th>Payment</th>
              <th 
                className="sortable"
                onClick={() => handleSort('created_at')}
              >
                Date
                {sortField === 'created_at' && (
                  <span className={`sort-indicator ${sortOrder}`}>
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-state">
                  <div className="empty-content">
                    <Package size={48} />
                    <h3>No Orders Found</h3>
                    <p>No orders match your current filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map(order => (
                <tr 
                  key={order.id} 
                  className={`order-row ${selectedOrders.includes(order.id) ? 'selected' : ''}`}
                >
                  {/* Checkbox */}
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order.id)}
                      onChange={() => onOrderSelect(order.id, !selectedOrders.includes(order.id))}
                    />
                  </td>

                  {/* Order Number */}
                  <td>
                    <div className="order-id">
                      <span className="order-number">{order.order_number}</span>
                      {order.is_cash_on_delivery && (
                        <span className="cod-badge">COD</span>
                      )}
                    </div>
                  </td>

                  {/* Customer */}
                  <td>
                    <div className="customer-info">
                      <div className="customer-name">
                        {order.first_name} {order.last_name}
                      </div>
                      <div className="customer-contact">
                        <span className="email">
                          <Mail size={12} />
                          {order.email}
                        </span>
                        <span className="phone">
                          <Phone size={12} />
                          {order.phone}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Items */}
                  <td>
                    <div className="order-items">
                      <span className="items-count">
                        {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                      </span>
                      {order.has_flash_sale_items && (
                        <span className="flash-sale-indicator">⚡ Flash Sale</span>
                      )}
                    </div>
                  </td>

                  {/* Amount */}
                  <td>
                    <div className="order-amount">
                      <span className="total-amount">
                        {formatCurrency(order.total_amount)}
                      </span>
                      {order.flash_sale_savings > 0 && (
                        <span className="savings">
                          Saved: {formatCurrency(order.flash_sale_savings)}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td>
                    <span className={`status-badge ${getStatusColor(order.status)}`}>
                      {order.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>

                  {/* Payment */}
                  <td>
                    <div className="payment-info">
                      <span className={`payment-method ${getPaymentMethodColor(order.payment_method)}`}>
                        {order.payment_method === 'mtn_momo' && (
                          <>
                            <DollarSign size={12} />
                            MTN MoMo
                          </>
                        )}
                        {order.payment_method === 'airtel_money' && (
                          <>
                            <DollarSign size={12} />
                            Airtel Money
                          </>
                        )}
                        {order.payment_method === 'cash_on_delivery' && (
                          <>
                            <DollarSign size={12} />
                            Cash on Delivery
                          </>
                        )}
                      </span>
                      <span className={`payment-status status-${order.payment_status}`}>
                        {order.payment_status}
                      </span>
                    </div>
                  </td>

                  {/* Date */}
                  <td>
                    <div className="order-date">
                      <span className="date-primary">
                        {formatDate(order.created_at)}
                      </span>
                      <span className="location">
                        <MapPin size={12} />
                        {order.city}, {order.district}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => onViewOrder(order)}
                        className="btn btn-outline btn-sm"
                        title="View Order"
                      >
                        <Eye size={14} />
                      </button>

                      {getStatusActions(order).map((action, index) => (
                        <button
                          key={index}
                          onClick={action.action}
                          className={action.className}
                          title={action.label}
                        >
                          <action.icon size={14} />
                        </button>
                      ))}

                      <select
                        value={order.status}
                        onChange={(e) => onStatusUpdate(order.id, { status: e.target.value })}
                        className="status-select"
                        title="Change Status"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
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
            Page {currentPage} of {totalPages}
          </div>
          
          <div className="pagination-controls">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn btn-outline btn-sm"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            
            <div className="page-numbers">
              {[...Array(Math.min(5, totalPages))].map((_, index) => {
                const page = Math.max(1, currentPage - 2) + index;
                if (page <= totalPages) {
                  return (
                    <button
                      key={page}
                      onClick={() => onPageChange(page)}
                      className={`btn ${currentPage === page ? 'btn-primary' : 'btn-outline'} btn-sm`}
                    >
                      {page}
                    </button>
                  );
                }
                return null;
              })}
            </div>
            
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn btn-outline btn-sm"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && orders.length > 0 && (
        <div className="table-loading-overlay">
          <div className="loading-spinner" />
        </div>
      )}
    </div>
  );
};

export default OrderTable;