import React, { useState } from 'react';
import { ordersAPI } from '../../../services/api/ordersAPI';
import { formatCurrency, formatDate, formatDateTime } from '../../../utils/helpers/formatters';
import Modal from '../../common/UI/Modal/Modal';
import Alert from '../../common/UI/Alert/Alert';

const OrderCard = ({ order, onOrderUpdate }) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState(null);

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

  const getPaymentMethodIcon = method => {
    const icons = {
      mtn_momo: '📱',
      airtel_money: '📱',
      cash_on_delivery: '💰',
    };
    return icons[method] || '💳';
  };

  const getPaymentMethodColor = method => {
    const colors = {
      mtn_momo: '#ffeb3b',
      airtel_money: '#f44336',
      cash_on_delivery: '#4caf50',
    };
    return colors[method] || '#2563eb';
  };

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

      onOrderUpdate(response);
      setShowCancelModal(false);
      setCancelReason('');
    } catch (err) {
      console.error('Error cancelling order:', err);
      setError(err.response?.data?.error || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const canTrackOrder = () => {
    return ['confirmed', 'processing', 'out_for_delivery'].includes(order.status);
  };

  const handleViewDetails = () => {
    window.location.href = `/orders/${order.id}`;
  };

  const handleTrackOrder = () => {
    window.location.href = `/orders/track/${order.order_number}`;
  };

  return (
    <>
      <div className="order-card">
        <div className="order-card-header">
          <div className="order-info">
            <h3 className="order-number">#{order.order_number}</h3>
            <span className="order-date">{formatDate(order.created_at)}</span>
          </div>
          <div className="order-status-container">
            <span
              className="order-status"
              style={{
                backgroundColor: `${getStatusColor(order.status)}20`,
                color: getStatusColor(order.status),
                border: `1px solid ${getStatusColor(order.status)}40`,
              }}
            >
              {order.status_display}
            </span>
          </div>
        </div>

        <div className="order-card-content">
          <div className="order-summary">
            <div className="order-items-preview">
              <span className="items-count">
                {order.items_count} {order.items_count === 1 ? 'item' : 'items'}
              </span>
              {order.has_flash_sale_items && (
                <span className="flash-sale-badge">⚡ Flash Sale</span>
              )}
            </div>

            <div className="order-amount">
              <div className="total-amount">{formatCurrency(order.total_amount)}</div>
              {order.flash_sale_savings > 0 && (
                <div className="savings-amount">
                  Saved {formatCurrency(order.flash_sale_savings)}
                </div>
              )}
            </div>
          </div>

          <div className="payment-info">
            <div className="payment-method">
              <span
                className="payment-method-badge"
                style={{
                  backgroundColor: `${getPaymentMethodColor(order.payment_method)}20`,
                  color: getPaymentMethodColor(order.payment_method),
                  border: `1px solid ${getPaymentMethodColor(order.payment_method)}40`,
                }}
              >
                {getPaymentMethodIcon(order.payment_method)} {order.payment_method_display}
              </span>
            </div>

            {order.is_cash_on_delivery && (
              <div className="cod-info">
                {order.cod_verified ? (
                  <span className="cod-verified">✓ Verified</span>
                ) : (
                  <span className="cod-pending">⏳ Pending Verification</span>
                )}
              </div>
            )}
          </div>

          {order.estimated_delivery && (
            <div className="delivery-info">
              <span className="delivery-label">Estimated Delivery:</span>
              <span className="delivery-date">{formatDate(order.estimated_delivery)}</span>
            </div>
          )}

          {order.tracking_number && (
            <div className="tracking-info">
              <span className="tracking-label">Tracking:</span>
              <span className="tracking-number">{order.tracking_number}</span>
            </div>
          )}
        </div>

        <div className="order-card-actions">
          <button onClick={handleViewDetails} className="btn btn-outline">
            View Details
          </button>

          {canTrackOrder() && (
            <button onClick={handleTrackOrder} className="btn btn-outline">
              Track Order
            </button>
          )}

          {order.can_be_cancelled && (
            <button className="btn btn-outline btn-danger" onClick={() => setShowCancelModal(true)}>
              Cancel Order
            </button>
          )}

          {order.status === 'delivered' && (
            <button className="btn btn-outline">Reorder Items</button>
          )}
        </div>

        {order.status === 'cancelled' && order.cancelled_at && (
          <div className="cancellation-info">
            <span>Cancelled on {formatDateTime(order.cancelled_at)}</span>
          </div>
        )}

        {order.status === 'delivered' && order.delivered_at && (
          <div className="delivery-confirmation">
            <span>✓ Delivered on {formatDateTime(order.delivered_at)}</span>
          </div>
        )}
      </div>

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

          {error && <Alert type="error" message={error} />}

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

export default OrderCard;
