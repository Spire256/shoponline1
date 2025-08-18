import React, { useState, useEffect } from 'react';
import { useAPI } from '../../hooks/useAPI';

const OrderHistoryTab = ({ orderSummary, user }) => {
  const { apiCall, loading, error } = useAPI();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: 'all',
    payment_method: 'all',
    date_range: 'all',
  });
  const [selectedOrder, setSelectedOrder] = useState(null);

  const ordersPerPage = 10;

  useEffect(() => {
    fetchOrders();
  }, [currentPage, filters]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        page_size: ordersPerPage,
      });

      // Add filters
      if (filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.payment_method !== 'all') {
        params.append('payment_method', filters.payment_method);
      }
      if (filters.date_range !== 'all') {
        const dateFilter = getDateRangeFilter(filters.date_range);
        if (dateFilter.date_from) params.append('date_from', dateFilter.date_from);
        if (dateFilter.date_to) params.append('date_to', dateFilter.date_to);
      }

      const response = await apiCall(`/api/orders/?${params.toString()}`, 'GET');
      setOrders(response.data.results || []);
      setTotalPages(Math.ceil((response.data.count || 0) / ordersPerPage));
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  const getDateRangeFilter = range => {
    const today = new Date();
    let date_from = null;

    switch (range) {
      case 'last_week':
        date_from = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last_month':
        date_from = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last_3_months':
        date_from = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'last_year':
        date_from = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return {};
    }

    return {
      date_from: date_from.toISOString().split('T')[0],
      date_to: today.toISOString().split('T')[0],
    };
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value,
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const getStatusBadgeClass = status => {
    const statusClasses = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      processing: 'status-processing',
      out_for_delivery: 'status-delivery',
      delivered: 'status-delivered',
      cancelled: 'status-cancelled',
      refunded: 'status-refunded',
    };
    return statusClasses[status] || 'status-default';
  };

  const getStatusDisplay = status => {
    const statusDisplays = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      processing: 'Processing',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      refunded: 'Refunded',
    };
    return statusDisplays[status] || status;
  };

  const getPaymentMethodDisplay = method => {
    const methodDisplays = {
      mtn_momo: 'MTN Mobile Money',
      airtel_money: 'Airtel Money',
      cash_on_delivery: 'Cash on Delivery',
    };
    return methodDisplays[method] || method;
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = amount => {
    return `UGX ${Number(amount).toLocaleString()}`;
  };

  const handleViewOrder = async orderId => {
    try {
      const response = await apiCall(`/api/orders/${orderId}/`, 'GET');
      setSelectedOrder(response.data);
    } catch (err) {
      console.error('Failed to fetch order details:', err);
    }
  };

  const handleCancelOrder = async orderId => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      await apiCall(`/api/orders/${orderId}/cancel/`, 'POST');
      // Refresh orders
      fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      console.error('Failed to cancel order:', err);
      alert('Failed to cancel order. Please try again.');
    }
  };

  const OrderDetailModal = ({ order, onClose }) => {
    if (!order) return null;

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content order-detail-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Order Details</h3>
            <button className="modal-close" onClick={onClose}>
              ×
            </button>
          </div>

          <div className="modal-body">
            <div className="order-summary">
              <div className="order-info-grid">
                <div className="info-item">
                  <label>Order Number</label>
                  <span className="order-number">{order.order_number}</span>
                </div>
                <div className="info-item">
                  <label>Status</label>
                  <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                    {getStatusDisplay(order.status)}
                  </span>
                </div>
                <div className="info-item">
                  <label>Order Date</label>
                  <span>{formatDate(order.created_at)}</span>
                </div>
                <div className="info-item">
                  <label>Payment Method</label>
                  <span>{getPaymentMethodDisplay(order.payment_method)}</span>
                </div>
              </div>
            </div>

            <div className="order-items">
              <h4>Items Ordered</h4>
              {order.items?.map(item => (
                <div key={item.id} className="order-item">
                  <div className="item-image">
                    {item.product_image ? (
                      <img src={item.product_image} alt={item.product_name} />
                    ) : (
                      <div className="image-placeholder">📦</div>
                    )}
                  </div>
                  <div className="item-details">
                    <h5>{item.product_name}</h5>
                    <p className="item-meta">
                      Quantity: {item.quantity} × {formatCurrency(item.unit_price)}
                    </p>
                    {item.is_flash_sale_item && (
                      <p className="flash-sale-info">🔥 Flash Sale: Saved {item.savings_display}</p>
                    )}
                  </div>
                  <div className="item-total">{formatCurrency(item.total_price)}</div>
                </div>
              ))}
            </div>

            <div className="order-totals">
              <div className="total-line">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.delivery_fee > 0 && (
                <div className="total-line">
                  <span>Delivery Fee:</span>
                  <span>{formatCurrency(order.delivery_fee)}</span>
                </div>
              )}
              {order.discount_amount > 0 && (
                <div className="total-line discount">
                  <span>Discount:</span>
                  <span>-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              {order.flash_sale_savings > 0 && (
                <div className="total-line savings">
                  <span>Flash Sale Savings:</span>
                  <span>-{formatCurrency(order.flash_sale_savings)}</span>
                </div>
              )}
              <div className="total-line total">
                <span>Total:</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
            </div>

            <div className="delivery-address">
              <h4>Delivery Address</h4>
              <div className="address-details">
                <p>{order.delivery_address}</p>
                {order.delivery_notes && (
                  <p className="delivery-notes">
                    <strong>Notes:</strong> {order.delivery_notes}
                  </p>
                )}
              </div>
            </div>

            {order.tracking_number && (
              <div className="tracking-info">
                <h4>Tracking Information</h4>
                <p>
                  <strong>Tracking Number:</strong> {order.tracking_number}
                </p>
                {order.estimated_delivery && (
                  <p>
                    <strong>Estimated Delivery:</strong> {formatDate(order.estimated_delivery)}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="button secondary" onClick={onClose}>
              Close
            </button>
            {order.can_be_cancelled && (
              <button className="button danger" onClick={() => handleCancelOrder(order.id)}>
                Cancel Order
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="order-history-tab">
      {/* Summary Cards */}
      {orderSummary && (
        <div className="order-summary-cards">
          <div className="summary-card">
            <div className="summary-icon">📦</div>
            <div className="summary-content">
              <h3>{orderSummary.total_orders}</h3>
              <p>Total Orders</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">💰</div>
            <div className="summary-content">
              <h3>{formatCurrency(orderSummary.total_spent)}</h3>
              <p>Total Spent</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">✅</div>
            <div className="summary-content">
              <h3>{orderSummary.completed_orders}</h3>
              <p>Completed Orders</p>
            </div>
          </div>
          {orderSummary.total_savings > 0 && (
            <div className="summary-card savings">
              <div className="summary-icon">🔥</div>
              <div className="summary-content">
                <h3>{formatCurrency(orderSummary.total_savings)}</h3>
                <p>Total Savings</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="order-filters">
        <div className="filter-group">
          <label>Status:</label>
          <select
            value={filters.status}
            onChange={e => handleFilterChange('status', e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Payment Method:</label>
          <select
            value={filters.payment_method}
            onChange={e => handleFilterChange('payment_method', e.target.value)}
          >
            <option value="all">All Methods</option>
            <option value="mtn_momo">MTN Mobile Money</option>
            <option value="airtel_money">Airtel Money</option>
            <option value="cash_on_delivery">Cash on Delivery</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Date Range:</label>
          <select
            value={filters.date_range}
            onChange={e => handleFilterChange('date_range', e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="last_week">Last Week</option>
            <option value="last_month">Last Month</option>
            <option value="last_3_months">Last 3 Months</option>
            <option value="last_year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="orders-list">
        {loading && (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading your orders...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <p>Failed to load orders: {error}</p>
            <button onClick={fetchOrders} className="retry-button">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No Orders Found</h3>
            <p>
              {filters.status !== 'all' ||
              filters.payment_method !== 'all' ||
              filters.date_range !== 'all'
                ? 'No orders match your current filters.'
                : "You haven't placed any orders yet."}
            </p>
            {filters.status !== 'all' ||
            filters.payment_method !== 'all' ||
            filters.date_range !== 'all' ? (
                <button
                  onClick={() => {
                    setFilters({ status: 'all', payment_method: 'all', date_range: 'all' });
                    setCurrentPage(1);
                  }}
                  className="clear-filters-button"
                >
                Clear Filters
                </button>
              ) : (
                <button onClick={() => (window.location.href = '/')} className="shop-now-button">
                Start Shopping
                </button>
              )}
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <>
            <div className="orders-table">
              <div className="table-header">
                <div className="header-cell">Order</div>
                <div className="header-cell">Date</div>
                <div className="header-cell">Status</div>
                <div className="header-cell">Payment</div>
                <div className="header-cell">Total</div>
                <div className="header-cell">Actions</div>
              </div>

              {orders.map(order => (
                <div key={order.id} className="table-row">
                  <div className="table-cell order-info">
                    <div className="order-number">#{order.order_number}</div>
                    <div className="items-count">{order.items_count} items</div>
                  </div>
                  <div className="table-cell">{formatDate(order.created_at)}</div>
                  <div className="table-cell">
                    <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                      {getStatusDisplay(order.status)}
                    </span>
                  </div>
                  <div className="table-cell">
                    <div className="payment-info">
                      <div>{getPaymentMethodDisplay(order.payment_method)}</div>
                      {order.is_cash_on_delivery && !order.cod_verified && (
                        <div className="cod-status">Pending Verification</div>
                      )}
                    </div>
                  </div>
                  <div className="table-cell total-amount">
                    {formatCurrency(order.total_amount)}
                  </div>
                  <div className="table-cell actions">
                    <button
                      className="action-button view"
                      onClick={() => handleViewOrder(order.id)}
                    >
                      View
                    </button>
                    {order.status === 'pending' && (
                      <button
                        className="action-button cancel"
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className={`page-button ${currentPage === 1 ? 'disabled' : ''}`}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>

                <div className="page-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2
                    )
                    .map((page, index, array) => (
                      <React.Fragment key={page}>
                        {index > 0 && array[index - 1] < page - 1 && (
                          <span className="page-ellipsis">...</span>
                        )}
                        <button
                          className={`page-number ${currentPage === page ? 'active' : ''}`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    ))}
                </div>

                <button
                  className={`page-button ${currentPage === totalPages ? 'disabled' : ''}`}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
};

export default OrderHistoryTab;
