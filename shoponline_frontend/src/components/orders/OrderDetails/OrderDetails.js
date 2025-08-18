import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { ordersAPI } from '../../../services/api/ordersAPI';
import { formatCurrency, formatDateTime } from '../../../utils/helpers/formatters';
import OrderStatus from './OrderStatus';
import OrderItems from './OrderItems';
import OrderTimeline from './OrderTimeline';
import Loading from '../../common/UI/Loading/Spinner';
import Alert from '../../common/UI/Alert/Alert';
import Modal from '../../common/UI/Modal/Modal';
import './OrderDetails.css';

const OrderDetails = ({ orderId, onClose }) => {
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ordersAPI.getOrderById(orderId);
      setOrder(response);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Failed to load order details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      setError('Please provide a reason for cancellation');
      return;
    }

    try {
      setCancelling(true);
      setError(null);

      const response = await ordersAPI.cancelOrder(order.id, {
        reason: cancelReason,
      });

      setOrder(response);
      setShowCancelModal(false);
      setCancelReason('');
    } catch (err) {
      console.error('Error cancelling order:', err);
      setError(err.response?.data?.error || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const getPaymentMethodInfo = method => {
    const methods = {
      mtn_momo: { name: 'MTN Mobile Money', icon: '📱', color: '#ffeb3b' },
      airtel_money: { name: 'Airtel Money', icon: '📱', color: '#f44336' },
      cash_on_delivery: { name: 'Cash on Delivery', icon: '💰', color: '#4caf50' },
    };
    return methods[method] || { name: method, icon: '💳', color: '#2563eb' };
  };

  if (loading) {
    return (
      <div className="order-details-loading">
        <Loading />
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="order-details-error">
        <Alert type="error" message={error} />
        <button className="btn btn-primary" onClick={fetchOrderDetails}>
          Try Again
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-details-error">
        <Alert type="error" message="Order not found" />
      </div>
    );
  }

  const paymentMethod = getPaymentMethodInfo(order.payment_method);

  return (
    <>
      <div className="order-details">
        <div className="order-details-header">
          <div className="order-header-left">
            <h2>Order Details</h2>
            <div className="order-number-date">
              <span className="order-number">#{order.order_number}</span>
              <span className="order-date">Placed on {formatDateTime(order.created_at)}</span>
            </div>
          </div>

          <div className="order-header-right">
            <OrderStatus status={order.status} />
            {onClose && (
              <button className="close-btn" onClick={onClose}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="order-details-alert">
            <Alert type="error" message={error} />
          </div>
        )}

        <div className="order-details-content">
          {/* Order Timeline */}
          <div className="order-section">
            <h3>Order Progress</h3>
            <OrderTimeline order={order} statusHistory={order.status_history || []} />
          </div>

          {/* Order Items */}
          <div className="order-section">
            <h3>Order Items</h3>
            <OrderItems items={order.items || []} />
          </div>

          {/* Order Summary */}
          <div className="order-sections-grid">
            <div className="order-section">
              <h3>Order Summary</h3>
              <div className="order-summary-card">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="summary-row discount">
                    <span>Discount</span>
                    <span>-{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}
                {order.flash_sale_savings > 0 && (
                  <div className="summary-row savings">
                    <span>Flash Sale Savings</span>
                    <span>-{formatCurrency(order.flash_sale_savings)}</span>
                  </div>
                )}
                {order.delivery_fee > 0 && (
                  <div className="summary-row">
                    <span>Delivery Fee</span>
                    <span>{formatCurrency(order.delivery_fee)}</span>
                  </div>
                )}
                {order.tax_amount > 0 && (
                  <div className="summary-row">
                    <span>Tax</span>
                    <span>{formatCurrency(order.tax_amount)}</span>
                  </div>
                )}
                <div className="summary-row total">
                  <span>Total Amount</span>
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </div>

            <div className="order-section">
              <h3>Payment Information</h3>
              <div className="payment-info-card">
                <div className="payment-method-display">
                  <span
                    className="payment-icon"
                    style={{ backgroundColor: `${paymentMethod.color}20` }}
                  >
                    {paymentMethod.icon}
                  </span>
                  <div className="payment-details">
                    <div className="payment-method-name">{paymentMethod.name}</div>
                    <div className="payment-status">
                      Status:{' '}
                      <span className={`status-${order.payment_status}`}>
                        {order.payment_status_display}
                      </span>
                    </div>
                  </div>
                </div>

                {order.transaction_id && (
                  <div className="transaction-info">
                    <span className="label">Transaction ID:</span>
                    <span className="value">{order.transaction_id}</span>
                  </div>
                )}

                {order.payment_reference && (
                  <div className="transaction-info">
                    <span className="label">Reference:</span>
                    <span className="value">{order.payment_reference}</span>
                  </div>
                )}

                {order.is_cash_on_delivery && (
                  <div className="cod-status">
                    {order.cod_verified ? (
                      <span className="cod-verified">✓ COD Verified</span>
                    ) : (
                      <span className="cod-pending">⏳ Pending Verification</span>
                    )}
                    {order.cod_verification && order.cod_verification.verification_notes && (
                      <div className="cod-notes">
                        <span className="label">Notes:</span>
                        <span className="value">{order.cod_verification.verification_notes}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="order-section">
            <h3>Delivery Information</h3>
            <div className="delivery-info-card">
              <div className="delivery-address">
                <h4>Delivery Address</h4>
                <div className="address-details">
                  <p>
                    <strong>{order.customer_name}</strong>
                  </p>
                  <p>{order.delivery_address}</p>
                  <p>Phone: {order.phone}</p>
                  <p>Email: {order.email}</p>
                </div>
              </div>

              {order.delivery_notes && (
                <div className="delivery-notes">
                  <h4>Delivery Notes</h4>
                  <p>{order.delivery_notes}</p>
                </div>
              )}

              <div className="delivery-timeline">
                {order.estimated_delivery && (
                  <div className="delivery-estimate">
                    <span className="label">Estimated Delivery:</span>
                    <span className="date">{formatDateTime(order.estimated_delivery)}</span>
                  </div>
                )}

                {order.tracking_number && (
                  <div className="tracking-number">
                    <span className="label">Tracking Number:</span>
                    <span className="tracking">{order.tracking_number}</span>
                    <button
                      className="track-btn"
                      onClick={() => (window.location.href = `/orders/track/${order.order_number}`)}
                    >
                      Track Order
                    </button>
                  </div>
                )}

                {order.delivered_at && (
                  <div className="delivery-confirmed">
                    <span className="confirmed-icon">✓</span>
                    <span>Delivered on {formatDateTime(order.delivered_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Admin Notes */}
          {order.admin_notes && (
            <div className="order-section">
              <h3>Additional Notes</h3>
              <div className="admin-notes-card">
                <p>{order.admin_notes}</p>
              </div>
            </div>
          )}

          {/* Order Notes */}
          {order.notes && order.notes.length > 0 && (
            <div className="order-section">
              <h3>Order Notes</h3>
              <div className="order-notes-list">
                {order.notes
                  .filter(note => !note.is_internal || user?.is_admin)
                  .map(note => (
                    <div key={note.id} className={`note-item note-${note.note_type}`}>
                      <div className="note-header">
                        <span className="note-type">{note.note_type}</span>
                        <span className="note-date">{formatDateTime(note.created_at)}</span>
                        {note.created_by_name && (
                          <span className="note-author">by {note.created_by_name}</span>
                        )}
                      </div>
                      <div className="note-content">{note.note}</div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Order Actions */}
        <div className="order-actions">
          {order.can_be_cancelled && (
            <button className="btn btn-danger" onClick={() => setShowCancelModal(true)}>
              Cancel Order
            </button>
          )}

          {order.status === 'delivered' && (
            <button className="btn btn-outline">Reorder Items</button>
          )}

          <button className="btn btn-outline" onClick={() => window.print()}>
            Print Order
          </button>

          {order.tracking_number && (
            <button
              className="btn btn-primary"
              onClick={() => (window.location.href = `/orders/track/${order.order_number}`)}
            >
              Track Order
            </button>
          )}
        </div>
      </div>

      {/* Cancel Order Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setCancelReason('');
          setError(null);
        }}
        title="Cancel Order"
      >
        <div className="cancel-order-modal">
          <p>Are you sure you want to cancel order #{order.order_number}?</p>
          <p className="cancel-warning">This action cannot be undone.</p>

          <div className="form-group">
            <label htmlFor="cancelReason">Reason for cancellation *</label>
            <textarea
              id="cancelReason"
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Please provide a reason for cancelling this order..."
              rows="4"
              required
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setShowCancelModal(false)}
              disabled={cancelling}
            >
              Keep Order
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleCancelOrder}
              disabled={cancelling || !cancelReason.trim()}
            >
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default OrderDetails;
