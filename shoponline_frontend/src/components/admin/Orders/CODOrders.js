// src/components/admin/Orders/CODOrders.js

import React, { useState, useEffect, useCallback } from 'react';
import OrderStatus from './OrderStatus';
import { useAuth } from '../../../hooks/useAuth';
import { useNotifications } from '../../../hooks/useNotifications';

const CODOrders = ({ onRefresh, onViewOrder }) => {
  const { user } = useAuth();
  const { showNotification } = useNotifications();

  // State management
  const [codOrders, setCodOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);

  // Filter states
  const [verificationFilter, setVerificationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);

  // Modal states
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedOrderForVerification, setSelectedOrderForVerification] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [bulkVerifying, setBulkVerifying] = useState(false);

  // COD Statistics
  const [codStats, setCodStats] = useState({
    total: 0,
    pending_verification: 0,
    verified: 0,
    delivered_paid: 0,
    rejected: 0,
  });

  // Fetch COD orders
  const fetchCODOrders = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: page.toString(),
          page_size: '20',
        });

        // Add filters
        if (verificationFilter) {
          params.append('verification_status', verificationFilter);
        }
        if (statusFilter) {
          params.append('status', statusFilter);
        }
        if (searchTerm) {
          params.append('search', searchTerm);
        }

        const response = await fetch(`/api/orders/cod/?${params}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch COD orders: ${response.status}`);
        }

        const data = await response.json();

        setCodOrders(data.results || []);
        setTotalPages(Math.ceil(data.count / 20));
        setTotalOrders(data.count);
        setCurrentPage(page);

        // Calculate stats from the results
        calculateStats(data.results);
      } catch (err) {
        console.error('Error fetching COD orders:', err);
        setError(err.message);
        showNotification('Failed to load COD orders', 'error');
      } finally {
        setLoading(false);
      }
    },
    [verificationFilter, statusFilter, searchTerm, showNotification]
  );

  // Calculate COD statistics
  const calculateStats = orders => {
    const stats = {
      total: orders.length,
      pending_verification: 0,
      verified: 0,
      delivered_paid: 0,
      rejected: 0,
    };

    orders.forEach(order => {
      if (order.cod_verification) {
        switch (order.cod_verification.verification_status) {
          case 'pending':
            stats.pending_verification++;
            break;
          case 'verified':
            stats.verified++;
            break;
          case 'delivered_paid':
            stats.delivered_paid++;
            break;
          case 'rejected':
            stats.rejected++;
            break;
        }
      } else {
        stats.pending_verification++;
      }
    });

    setCodStats(stats);
  };

  // Initial load
  useEffect(() => {
    fetchCODOrders();
  }, [fetchCODOrders]);

  // Handle filter changes
  const handleFilterChange = (type, value) => {
    switch (type) {
      case 'verification':
        setVerificationFilter(value);
        break;
      case 'status':
        setStatusFilter(value);
        break;
      case 'search':
        setSearchTerm(value);
        break;
    }
    setCurrentPage(1);
  };

  // Handle order selection
  const handleOrderSelect = (orderId, isSelected) => {
    if (isSelected) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  // Handle select all
  const handleSelectAll = isSelected => {
    if (isSelected) {
      setSelectedOrders(codOrders.map(order => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  // Handle verify single order
  const handleVerifyOrder = order => {
    setSelectedOrderForVerification(order);
    setVerificationNotes('');
    setShowVerificationModal(true);
  };

  // Handle confirm verification
  const handleConfirmVerification = async () => {
    if (!selectedOrderForVerification) return;

    try {
      const response = await fetch(`/api/orders/${selectedOrderForVerification.id}/verify-cod/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: verificationNotes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to verify COD order');
      }

      // Refresh orders
      await fetchCODOrders(currentPage);
      setShowVerificationModal(false);
      setSelectedOrderForVerification(null);
      setVerificationNotes('');
      showNotification('COD order verified successfully', 'success');
      onRefresh();
    } catch (err) {
      console.error('Error verifying COD order:', err);
      showNotification('Failed to verify COD order', 'error');
    }
  };

  // Handle bulk verification
  const handleBulkVerification = async () => {
    if (selectedOrders.length === 0) {
      showNotification('Please select orders to verify', 'warning');
      return;
    }

    setBulkVerifying(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const orderId of selectedOrders) {
        try {
          await fetch(`/api/orders/${orderId}/verify-cod/`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              notes: 'Bulk verification by admin',
            }),
          });
          successCount++;
        } catch (err) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        showNotification(`Successfully verified ${successCount} orders`, 'success');
      }
      if (errorCount > 0) {
        showNotification(`Failed to verify ${errorCount} orders`, 'error');
      }

      // Refresh and clear selection
      setSelectedOrders([]);
      await fetchCODOrders(currentPage);
      onRefresh();
    } finally {
      setBulkVerifying(false);
    }
  };

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
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-UG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get verification status display
  const getVerificationStatusDisplay = order => {
    if (!order.cod_verification) {
      return { status: 'pending', label: 'Pending Verification', class: 'pending' };
    }

    const status = order.cod_verification.verification_status;
    switch (status) {
      case 'verified':
        return { status, label: '✅ Verified', class: 'verified' };
      case 'delivered_paid':
        return { status, label: '💰 Delivered & Paid', class: 'completed' };
      case 'rejected':
        return { status, label: '❌ Rejected', class: 'rejected' };
      default:
        return { status, label: '⏳ Pending', class: 'pending' };
    }
  };

  if (loading && codOrders.length === 0) {
    return (
      <div className="cod-orders">
        <div className="cod-orders__loading">
          <div className="loading-spinner" />
          <p>Loading COD orders...</p>
        </div>
      </div>
    );
  }

  if (error && codOrders.length === 0) {
    return (
      <div className="cod-orders">
        <div className="cod-orders__error">
          <div className="error-icon">⚠️</div>
          <h3>Failed to Load COD Orders</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => fetchCODOrders()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cod-orders">
      {/* COD Statistics */}
      <div className="cod-stats">
        <div className="stat-card total">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>{codStats.total}</h3>
            <p>Total COD Orders</p>
          </div>
        </div>
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{codStats.pending_verification}</h3>
            <p>Pending Verification</p>
          </div>
        </div>
        <div className="stat-card verified">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{codStats.verified}</h3>
            <p>Verified</p>
          </div>
        </div>
        <div className="stat-card completed">
          <div className="stat-icon">🎉</div>
          <div className="stat-content">
            <h3>{codStats.delivered_paid}</h3>
            <p>Delivered & Paid</p>
          </div>
        </div>
      </div>

      {/* COD Filters */}
      <div className="cod-filters">
        <div className="filter-row">
          <div className="filter-group">
            <label>Search COD Orders</label>
            <input
              type="text"
              placeholder="Search by order #, customer name, or phone..."
              value={searchTerm}
              onChange={e => handleFilterChange('search', e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <label>Verification Status</label>
            <select
              value={verificationFilter}
              onChange={e => handleFilterChange('verification', e.target.value)}
              className="filter-select"
            >
              <option value="">All Verification Status</option>
              <option value="pending">⏳ Pending Verification</option>
              <option value="verified">✅ Verified</option>
              <option value="delivered_paid">💰 Delivered & Paid</option>
              <option value="rejected">❌ Rejected</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Order Status</label>
            <select
              value={statusFilter}
              onChange={e => handleFilterChange('status', e.target.value)}
              className="filter-select"
            >
              <option value="">All Order Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>

          <div className="filter-group">
            <button
              className="btn btn-secondary"
              onClick={() => fetchCODOrders(currentPage)}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <div className="bulk-actions">
          <div className="bulk-info">
            <span>{selectedOrders.length} order(s) selected</span>
          </div>
          <div className="bulk-buttons">
            <button
              className="btn btn-success"
              onClick={handleBulkVerification}
              disabled={bulkVerifying}
            >
              {bulkVerifying ? 'Verifying...' : '✅ Bulk Verify'}
            </button>
            <button className="btn btn-secondary" onClick={() => setSelectedOrders([])}>
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* COD Orders Table */}
      <div className="cod-table-container">
        <table className="cod-table">
          <thead>
            <tr>
              <th className="checkbox-column">
                <input
                  type="checkbox"
                  checked={selectedOrders.length === codOrders.length && codOrders.length > 0}
                  onChange={e => handleSelectAll(e.target.checked)}
                />
              </th>
              <th>Order #</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Amount</th>
              <th>Order Status</th>
              <th>Verification Status</th>
              <th>Order Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {codOrders.length === 0 ? (
              <tr className="empty-row">
                <td colSpan="9">
                  <div className="empty-state">
                    <div className="empty-icon">💰</div>
                    <h3>No COD Orders Found</h3>
                    <p>No cash on delivery orders match your current filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              codOrders.map(order => {
                const verificationStatus = getVerificationStatusDisplay(order);
                return (
                  <tr
                    key={order.id}
                    className={`cod-row ${selectedOrders.includes(order.id) ? 'selected' : ''}`}
                  >
                    <td onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={e => handleOrderSelect(order.id, e.target.checked)}
                      />
                    </td>

                    <td className="order-number">
                      <span className="order-number-text">{order.order_number}</span>
                    </td>

                    <td className="customer-info">
                      <div className="customer-details">
                        <div className="customer-name">{order.customer_name}</div>
                        <div className="customer-email">{order.email}</div>
                      </div>
                    </td>

                    <td className="phone">
                      <span className="phone-number">{order.phone}</span>
                    </td>

                    <td className="amount">
                      <span className="amount-value">{formatCurrency(order.total_amount)}</span>
                    </td>

                    <td className="order-status">
                      <OrderStatus status={order.status} />
                    </td>

                    <td className="verification-status">
                      <span className={`verification-badge ${verificationStatus.class}`}>
                        {verificationStatus.label}
                      </span>
                    </td>

                    <td className="order-date">
                      <span className="date-text">{formatDate(order.created_at)}</span>
                    </td>

                    <td className="actions" onClick={e => e.stopPropagation()}>
                      <div className="action-buttons">
                        <button
                          className="action-btn view"
                          onClick={() => onViewOrder(order)}
                          title="View Details"
                        >
                          👁️
                        </button>

                        {verificationStatus.status === 'pending' && (
                          <button
                            className="action-btn verify"
                            onClick={() => handleVerifyOrder(order)}
                            title="Verify COD Order"
                          >
                            ✅
                          </button>
                        )}

                        {order.status === 'pending' && (
                          <button
                            className="action-btn confirm"
                            onClick={async () => {
                              try {
                                await fetch(`/api/orders/${order.id}/confirm/`, {
                                  method: 'POST',
                                  headers: {
                                    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                                  },
                                });
                                fetchCODOrders(currentPage);
                                onRefresh();
                                showNotification('Order confirmed', 'success');
                              } catch (err) {
                                showNotification('Failed to confirm order', 'error');
                              }
                            }}
                            title="Confirm Order"
                          >
                            📋
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="cod-pagination">
          <div className="pagination-info">
            <span>
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={() => fetchCODOrders(currentPage - 1)}
              disabled={currentPage === 1}
            >
              ⏪ Previous
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(1, currentPage - 2) + i;
              if (page > totalPages) return null;

              return (
                <button
                  key={page}
                  className={`page-btn ${page === currentPage ? 'active' : ''}`}
                  onClick={() => fetchCODOrders(page)}
                >
                  {page}
                </button>
              );
            })}

            <button
              className="pagination-btn"
              onClick={() => fetchCODOrders(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next ⏩
            </button>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {showVerificationModal && selectedOrderForVerification && (
        <div className="verification-modal">
          <div className="modal-overlay" onClick={() => setShowVerificationModal(false)} />
          <div className="modal-content">
            <div className="modal-header">
              <h3>Verify COD Order</h3>
              <button className="btn btn-close" onClick={() => setShowVerificationModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="order-summary">
                <h4>Order Details</h4>
                <div className="summary-grid">
                  <div className="summary-item">
                    <label>Order Number:</label>
                    <span>{selectedOrderForVerification.order_number}</span>
                  </div>
                  <div className="summary-item">
                    <label>Customer:</label>
                    <span>{selectedOrderForVerification.customer_name}</span>
                  </div>
                  <div className="summary-item">
                    <label>Phone:</label>
                    <span>{selectedOrderForVerification.phone}</span>
                  </div>
                  <div className="summary-item">
                    <label>Amount:</label>
                    <span>{formatCurrency(selectedOrderForVerification.total_amount)}</span>
                  </div>
                </div>
              </div>

              <div className="verification-form">
                <div className="form-group">
                  <label>Verification Notes:</label>
                  <textarea
                    value={verificationNotes}
                    onChange={e => setVerificationNotes(e.target.value)}
                    placeholder="Add any notes about the verification process..."
                    rows="4"
                    className="verification-textarea"
                  />
                </div>

                <div className="verification-checklist">
                  <h5>Verification Checklist:</h5>
                  <div className="checklist-items">
                    <div className="checklist-item">
                      <input type="checkbox" id="phone-verified" />
                      <label htmlFor="phone-verified">Customer phone number verified</label>
                    </div>
                    <div className="checklist-item">
                      <input type="checkbox" id="address-confirmed" />
                      <label htmlFor="address-confirmed">Delivery address confirmed</label>
                    </div>
                    <div className="checklist-item">
                      <input type="checkbox" id="payment-confirmed" />
                      <label htmlFor="payment-confirmed">Payment method confirmed</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowVerificationModal(false)}>
                Cancel
              </button>
              <button className="btn btn-success" onClick={handleConfirmVerification}>
                ✅ Verify Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Panel */}
      <div className="cod-quick-actions">
        <h4>Quick Actions</h4>
        <div className="quick-actions-grid">
          <button
            className="quick-action-btn pending"
            onClick={() => handleFilterChange('verification', 'pending')}
          >
            <span className="icon">⏳</span>
            <span>Pending Verification</span>
            <span className="count">{codStats.pending_verification}</span>
          </button>
          <button
            className="quick-action-btn verified"
            onClick={() => handleFilterChange('verification', 'verified')}
          >
            <span className="icon">✅</span>
            <span>Verified Orders</span>
            <span className="count">{codStats.verified}</span>
          </button>
          <button
            className="quick-action-btn completed"
            onClick={() => handleFilterChange('verification', 'delivered_paid')}
          >
            <span className="icon">💰</span>
            <span>Delivered & Paid</span>
            <span className="count">{codStats.delivered_paid}</span>
          </button>
        </div>
      </div>

      {/* COD Instructions */}
      <div className="cod-instructions">
        <h4>COD Order Management Instructions</h4>
        <div className="instructions-content">
          <div className="instruction-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h5>Review Order Details</h5>
              <p>
                Check customer information, delivery address, and order items before verification.
              </p>
            </div>
          </div>
          <div className="instruction-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h5>Verify Customer Contact</h5>
              <p>
                Call the customer to confirm the order and verify their phone number and delivery
                address.
              </p>
            </div>
          </div>
          <div className="instruction-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h5>Mark as Verified</h5>
              <p>
                Once verified, mark the order as verified to proceed with processing and delivery.
              </p>
            </div>
          </div>
          <div className="instruction-step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h5>Track Delivery</h5>
              <p>
                Monitor the delivery process and mark as "Delivered & Paid" once payment is
                collected.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CODOrders;
