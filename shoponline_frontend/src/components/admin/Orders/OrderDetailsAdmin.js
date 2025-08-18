// src/components/admin/Orders/OrderDetailsAdmin.js

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useNotifications } from '../../../hooks/useNotifications';
import OrderStatus from './OrderStatus';

const OrderDetailsAdmin = ({ order, isOpen, onClose, onOrderUpdate }) => {
  const { user } = useAuth();
  const { showNotification } = useNotifications();

  // State management
  const [orderDetails, setOrderDetails] = useState(order);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'items', 'history', 'notes'

  // Form states
  const [editMode, setEditMode] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    status: orderDetails?.status || '',
    admin_notes: '',
    tracking_number: orderDetails?.tracking_number || '',
    estimated_delivery: orderDetails?.estimated_delivery || '',
  });

  // Note form state
  const [newNote, setNewNote] = useState({
    note_type: 'admin',
    note: '',
    is_internal: true,
  });

  // Fetch complete order details
  useEffect(() => {
    if (isOpen && order?.id) {
      fetchOrderDetails();
    }
  }, [isOpen, order?.id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${order.id}/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }

      const data = await response.json();
      setOrderDetails(data);
      setStatusUpdate({
        status: data.status,
        admin_notes: '',
        tracking_number: data.tracking_number || '',
        estimated_delivery: data.estimated_delivery || '',
      });
    } catch (err) {
      console.error('Error fetching order details:', err);
      showNotification('Failed to load order details', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/orders/${orderDetails.id}/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(statusUpdate),
      });

      if (!response.ok) {
        throw new Error('Failed to update order');
      }

      const updatedOrder = await response.json();
      setOrderDetails(updatedOrder);
      setEditMode(false);
      showNotification('Order updated successfully', 'success');
      onOrderUpdate();
    } catch (err) {
      console.error('Error updating order:', err);
      showNotification('Failed to update order', 'error');
    } finally {
      setUpdating(false);
    }
  };

  // Handle add note
  const handleAddNote = async () => {
    if (!newNote.note.trim()) {
      showNotification('Please enter a note', 'warning');
      return;
    }

    try {
      const response = await fetch(`/api/orders/${orderDetails.id}/notes/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newNote),
      });

      if (!response.ok) {
        throw new Error('Failed to add note');
      }

      // Refresh order details
      await fetchOrderDetails();
      setNewNote({ note_type: 'admin', note: '', is_internal: true });
      showNotification('Note added successfully', 'success');
    } catch (err) {
      console.error('Error adding note:', err);
      showNotification('Failed to add note', 'error');
    }
  };

  // Handle COD verification
  const handleCODVerification = async (verificationNotes = '') => {
    try {
      const response = await fetch(`/api/orders/${orderDetails.id}/verify-cod/`, {
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

      await fetchOrderDetails();
      showNotification('COD order verified successfully', 'success');
      onOrderUpdate();
    } catch (err) {
      console.error('Error verifying COD order:', err);
      showNotification('Failed to verify COD order', 'error');
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

  if (!isOpen || !orderDetails) {
    return null;
  }

  return (
    <div className="order-details-modal">
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-content">
        {/* Modal Header */}
        <div className="modal-header">
          <div className="header-left">
            <h2>Order Details</h2>
            <div className="order-basic-info">
              <span className="order-number">#{orderDetails.order_number}</span>
              <OrderStatus status={orderDetails.status} />
              {orderDetails.is_cash_on_delivery && <span className="payment-badge cod">COD</span>}
              {orderDetails.has_flash_sale_items && (
                <span className="payment-badge flash-sale">Flash Sale</span>
              )}
            </div>
          </div>
          <div className="header-right">
            <button className="btn btn-secondary" onClick={() => setEditMode(!editMode)}>
              {editMode ? 'Cancel Edit' : '✏️ Edit'}
            </button>
            <button className="btn btn-close" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="modal-loading">
            <div className="loading-spinner" />
            <p>Loading order details...</p>
          </div>
        )}

        {/* Modal Content */}
        {!loading && (
          <>
            {/* Tab Navigation */}
            <div className="tab-navigation">
              <button
                className={`tab-nav-button ${activeTab === 'details' ? 'active' : ''}`}
                onClick={() => setActiveTab('details')}
              >
                Order Details
              </button>
              <button
                className={`tab-nav-button ${activeTab === 'items' ? 'active' : ''}`}
                onClick={() => setActiveTab('items')}
              >
                Items ({orderDetails.items?.length || 0})
              </button>
              <button
                className={`tab-nav-button ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                History
              </button>
              <button
                className={`tab-nav-button ${activeTab === 'notes' ? 'active' : ''}`}
                onClick={() => setActiveTab('notes')}
              >
                Notes ({orderDetails.notes?.length || 0})
              </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {/* Order Details Tab */}
              {activeTab === 'details' && (
                <div className="order-details-tab">
                  <div className="details-grid">
                    {/* Customer Information */}
                    <div className="details-section">
                      <h3>Customer Information</h3>
                      <div className="info-grid">
                        <div className="info-item">
                          <label>Name:</label>
                          <span>{orderDetails.customer_name}</span>
                        </div>
                        <div className="info-item">
                          <label>Email:</label>
                          <span>{orderDetails.email}</span>
                        </div>
                        <div className="info-item">
                          <label>Phone:</label>
                          <span>{orderDetails.phone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Information */}
                    <div className="details-section">
                      <h3>Delivery Address</h3>
                      <div className="address-display">
                        <p>{orderDetails.address_line_1}</p>
                        {orderDetails.address_line_2 && <p>{orderDetails.address_line_2}</p>}
                        <p>
                          {orderDetails.city}, {orderDetails.district}
                        </p>
                        {orderDetails.postal_code && <p>{orderDetails.postal_code}</p>}
                        {orderDetails.delivery_notes && (
                          <div className="delivery-notes">
                            <strong>Delivery Notes:</strong>
                            <p>{orderDetails.delivery_notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Status & Tracking */}
                    <div className="details-section">
                      <h3>Order Status & Tracking</h3>
                      {editMode ? (
                        <div className="edit-form">
                          <div className="form-row">
                            <label>Status:</label>
                            <select
                              value={statusUpdate.status}
                              onChange={e =>
                                setStatusUpdate({
                                  ...statusUpdate,
                                  status: e.target.value,
                                })
                              }
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="processing">Processing</option>
                              <option value="out_for_delivery">Out for Delivery</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                          <div className="form-row">
                            <label>Tracking Number:</label>
                            <input
                              type="text"
                              value={statusUpdate.tracking_number}
                              onChange={e =>
                                setStatusUpdate({
                                  ...statusUpdate,
                                  tracking_number: e.target.value,
                                })
                              }
                              placeholder="Enter tracking number"
                            />
                          </div>
                          <div className="form-row">
                            <label>Estimated Delivery:</label>
                            <input
                              type="datetime-local"
                              value={statusUpdate.estimated_delivery}
                              onChange={e =>
                                setStatusUpdate({
                                  ...statusUpdate,
                                  estimated_delivery: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="form-row">
                            <label>Admin Notes:</label>
                            <textarea
                              value={statusUpdate.admin_notes}
                              onChange={e =>
                                setStatusUpdate({
                                  ...statusUpdate,
                                  admin_notes: e.target.value,
                                })
                              }
                              placeholder="Add notes about this update..."
                              rows="3"
                            />
                          </div>
                          <div className="form-actions">
                            <button
                              className="btn btn-primary"
                              onClick={handleStatusUpdate}
                              disabled={updating}
                            >
                              {updating ? 'Updating...' : 'Update Order'}
                            </button>
                            <button
                              className="btn btn-secondary"
                              onClick={() => setEditMode(false)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="status-display">
                          <div className="info-grid">
                            <div className="info-item">
                              <label>Current Status:</label>
                              <OrderStatus status={orderDetails.status} />
                            </div>
                            <div className="info-item">
                              <label>Payment Status:</label>
                              <span className={`payment-status ${orderDetails.payment_status}`}>
                                {orderDetails.payment_status_display}
                              </span>
                            </div>
                            <div className="info-item">
                              <label>Payment Method:</label>
                              <span className="payment-method">
                                {orderDetails.payment_method_display}
                              </span>
                            </div>
                            {orderDetails.tracking_number && (
                              <div className="info-item">
                                <label>Tracking Number:</label>
                                <span className="tracking-number">
                                  {orderDetails.tracking_number}
                                </span>
                              </div>
                            )}
                            {orderDetails.estimated_delivery && (
                              <div className="info-item">
                                <label>Estimated Delivery:</label>
                                <span>{formatDate(orderDetails.estimated_delivery)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Payment Information */}
                    <div className="details-section">
                      <h3>Payment Information</h3>
                      <div className="payment-details">
                        <div className="payment-summary">
                          <div className="payment-row">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(orderDetails.subtotal)}</span>
                          </div>
                          {orderDetails.flash_sale_savings > 0 && (
                            <div className="payment-row savings">
                              <span>Flash Sale Savings:</span>
                              <span>-{formatCurrency(orderDetails.flash_sale_savings)}</span>
                            </div>
                          )}
                          {orderDetails.delivery_fee > 0 && (
                            <div className="payment-row">
                              <span>Delivery Fee:</span>
                              <span>{formatCurrency(orderDetails.delivery_fee)}</span>
                            </div>
                          )}
                          {orderDetails.tax_amount > 0 && (
                            <div className="payment-row">
                              <span>Tax:</span>
                              <span>{formatCurrency(orderDetails.tax_amount)}</span>
                            </div>
                          )}
                          <div className="payment-row total">
                            <span>Total Amount:</span>
                            <span>{formatCurrency(orderDetails.total_amount)}</span>
                          </div>
                        </div>

                        {orderDetails.payment_reference && (
                          <div className="payment-reference">
                            <label>Payment Reference:</label>
                            <span>{orderDetails.payment_reference}</span>
                          </div>
                        )}

                        {orderDetails.transaction_id && (
                          <div className="transaction-id">
                            <label>Transaction ID:</label>
                            <span>{orderDetails.transaction_id}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* COD Verification */}
                    {orderDetails.is_cash_on_delivery && (
                      <div className="details-section cod-section">
                        <h3>Cash on Delivery</h3>
                        <div className="cod-status">
                          <div className="cod-verification">
                            <span className="verification-label">Verification Status:</span>
                            <span
                              className={`verification-status ${
                                orderDetails.cod_verified ? 'verified' : 'pending'
                              }`}
                            >
                              {orderDetails.cod_verified
                                ? '✅ Verified'
                                : '⏳ Pending Verification'}
                            </span>
                          </div>

                          {!orderDetails.cod_verified && (
                            <button
                              className="btn btn-success"
                              onClick={() => handleCODVerification('Order verified by admin')}
                            >
                              ✅ Verify COD Order
                            </button>
                          )}
                        </div>

                        {orderDetails.cod_verification && (
                          <div className="cod-details">
                            <div className="info-grid">
                              <div className="info-item">
                                <label>Verification Status:</label>
                                <span>{orderDetails.cod_verification.verification_status}</span>
                              </div>
                              {orderDetails.cod_verification.verified_by_name && (
                                <div className="info-item">
                                  <label>Verified By:</label>
                                  <span>{orderDetails.cod_verification.verified_by_name}</span>
                                </div>
                              )}
                              {orderDetails.cod_verification.verification_date && (
                                <div className="info-item">
                                  <label>Verification Date:</label>
                                  <span>
                                    {formatDate(orderDetails.cod_verification.verification_date)}
                                  </span>
                                </div>
                              )}
                            </div>
                            {orderDetails.cod_verification.verification_notes && (
                              <div className="verification-notes">
                                <label>Verification Notes:</label>
                                <p>{orderDetails.cod_verification.verification_notes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Order Timestamps */}
                    <div className="details-section">
                      <h3>Order Timeline</h3>
                      <div className="timeline">
                        <div className="timeline-item">
                          <span className="timeline-label">Order Created:</span>
                          <span className="timeline-date">
                            {formatDate(orderDetails.created_at)}
                          </span>
                        </div>
                        {orderDetails.confirmed_at && (
                          <div className="timeline-item">
                            <span className="timeline-label">Order Confirmed:</span>
                            <span className="timeline-date">
                              {formatDate(orderDetails.confirmed_at)}
                            </span>
                          </div>
                        )}
                        {orderDetails.delivered_at && (
                          <div className="timeline-item">
                            <span className="timeline-label">Order Delivered:</span>
                            <span className="timeline-date">
                              {formatDate(orderDetails.delivered_at)}
                            </span>
                          </div>
                        )}
                        {orderDetails.cancelled_at && (
                          <div className="timeline-item cancelled">
                            <span className="timeline-label">Order Cancelled:</span>
                            <span className="timeline-date">
                              {formatDate(orderDetails.cancelled_at)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Items Tab */}
              {activeTab === 'items' && (
                <div className="order-items-tab">
                  <div className="items-header">
                    <h3>Order Items ({orderDetails.items?.length || 0})</h3>
                    {orderDetails.has_flash_sale_items && (
                      <div className="flash-sale-info">
                        <span className="flash-sale-badge">⚡ Flash Sale Items</span>
                        <span className="savings-amount">
                          Total Savings: {formatCurrency(orderDetails.flash_sale_savings)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="items-list">
                    {orderDetails.items?.map((item, index) => (
                      <div key={item.id} className="order-item">
                        <div className="item-image">
                          {item.product_image ? (
                            <img src={item.product_image} alt={item.product_name} />
                          ) : (
                            <div className="placeholder-image">📦</div>
                          )}
                        </div>

                        <div className="item-details">
                          <h4 className="item-name">{item.product_name}</h4>
                          {item.product_sku && <p className="item-sku">SKU: {item.product_sku}</p>}
                          {item.product_category && (
                            <p className="item-category">Category: {item.product_category}</p>
                          )}
                          {item.product_brand && (
                            <p className="item-brand">Brand: {item.product_brand}</p>
                          )}
                        </div>

                        <div className="item-pricing">
                          <div className="quantity">
                            <span>Qty: {item.quantity}</span>
                          </div>

                          {item.is_flash_sale_item ? (
                            <div className="flash-sale-pricing">
                              <div className="original-price">
                                {formatCurrency(item.original_price)}
                              </div>
                              <div className="sale-price">{formatCurrency(item.unit_price)}</div>
                              <div className="discount-badge">
                                -{item.discount_percentage_display}
                              </div>
                              <div className="savings">Saved: {item.savings_display}</div>
                            </div>
                          ) : (
                            <div className="regular-pricing">
                              <div className="unit-price">{formatCurrency(item.unit_price)}</div>
                            </div>
                          )}

                          <div className="item-total">
                            <strong>{formatCurrency(item.total_price)}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order History Tab */}
              {activeTab === 'history' && (
                <div className="order-history-tab">
                  <h3>Order Status History</h3>
                  <div className="history-list">
                    {orderDetails.status_history?.length > 0 ? (
                      orderDetails.status_history.map((history, index) => (
                        <div key={history.id} className="history-item">
                          <div className="history-status">
                            <span className="status-change">
                              {history.previous_status} → {history.new_status}
                            </span>
                            <span className="status-date">{formatDate(history.created_at)}</span>
                          </div>
                          <div className="history-details">
                            {history.changed_by_name && (
                              <p className="changed-by">Changed by: {history.changed_by_name}</p>
                            )}
                            {history.notes && <p className="history-notes">{history.notes}</p>}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-history">
                        <p>No status changes recorded yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Order Notes Tab */}
              {activeTab === 'notes' && (
                <div className="order-notes-tab">
                  <div className="notes-header">
                    <h3>Order Notes</h3>
                    <button className="btn btn-primary" onClick={() => setActiveTab('add-note')}>
                      + Add Note
                    </button>
                  </div>

                  {/* Add Note Form */}
                  <div className="add-note-form">
                    <div className="form-row">
                      <label>Note Type:</label>
                      <select
                        value={newNote.note_type}
                        onChange={e =>
                          setNewNote({
                            ...newNote,
                            note_type: e.target.value,
                          })
                        }
                      >
                        <option value="admin">Admin Note</option>
                        <option value="customer">Customer Note</option>
                        <option value="delivery">Delivery Note</option>
                        <option value="system">System Note</option>
                      </select>
                    </div>
                    <div className="form-row">
                      <label>Note:</label>
                      <textarea
                        value={newNote.note}
                        onChange={e =>
                          setNewNote({
                            ...newNote,
                            note: e.target.value,
                          })
                        }
                        placeholder="Enter your note here..."
                        rows="3"
                      />
                    </div>
                    <div className="form-row checkbox-row">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={newNote.is_internal}
                          onChange={e =>
                            setNewNote({
                              ...newNote,
                              is_internal: e.target.checked,
                            })
                          }
                        />
                        Internal note (not visible to customer)
                      </label>
                    </div>
                    <div className="form-actions">
                      <button
                        className="btn btn-primary"
                        onClick={handleAddNote}
                        disabled={!newNote.note.trim()}
                      >
                        Add Note
                      </button>
                    </div>
                  </div>

                  {/* Existing Notes */}
                  <div className="notes-list">
                    {orderDetails.notes?.length > 0 ? (
                      orderDetails.notes.map((note, index) => (
                        <div key={note.id} className={`note-item ${note.note_type}`}>
                          <div className="note-header">
                            <span className="note-type">{note.note_type}</span>
                            <span className="note-date">{formatDate(note.created_at)}</span>
                            {note.created_by_name && (
                              <span className="note-author">by {note.created_by_name}</span>
                            )}
                            {note.is_internal && <span className="internal-badge">Internal</span>}
                          </div>
                          <div className="note-content">
                            <p>{note.note}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-notes">
                        <p>No notes added yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions Footer */}
            <div className="modal-footer">
              <div className="quick-actions">
                {orderDetails.status === 'pending' && (
                  <button
                    className="btn btn-success"
                    onClick={() => handleStatusUpdate('confirmed')}
                  >
                    ✅ Confirm Order
                  </button>
                )}

                {['confirmed', 'processing', 'out_for_delivery'].includes(orderDetails.status) && (
                  <button
                    className="btn btn-success"
                    onClick={() => handleStatusUpdate('delivered')}
                  >
                    🚚 Mark as Delivered
                  </button>
                )}

                {orderDetails.can_be_cancelled && (
                  <button
                    className="btn btn-danger"
                    onClick={() => handleStatusUpdate('cancelled')}
                  >
                    ❌ Cancel Order
                  </button>
                )}

                {orderDetails.is_cash_on_delivery && !orderDetails.cod_verified && (
                  <button className="btn btn-warning" onClick={() => handleCODVerification()}>
                    💰 Verify COD
                  </button>
                )}

                <button className="btn btn-outline" onClick={() => window.print()}>
                  🖨️ Print Order
                </button>
              </div>

              <div className="footer-right">
                <button className="btn btn-secondary" onClick={onClose}>
                  Close
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderDetailsAdmin;
