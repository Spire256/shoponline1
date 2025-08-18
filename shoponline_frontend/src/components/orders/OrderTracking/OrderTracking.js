import React, { useState, useEffect } from 'react';
import { ordersAPI } from '../../../services/api/ordersAPI';
import { formatCurrency, formatDateTime } from '../../../utils/helpers/formatters';
import TrackingTimeline from './TrackingTimeline';
import Loading from '../../common/UI/Loading/Spinner';
import Alert from '../../common/UI/Alert/Alert';
import './OrderTracking.css';

const OrderTracking = ({ orderNumber }) => {
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchOrderNumber, setSearchOrderNumber] = useState(orderNumber || '');

  const fetchTrackingData = async orderNum => {
    try {
      setLoading(true);
      setError(null);
      const response = await ordersAPI.trackOrder(orderNum);
      setTrackingData(response);
    } catch (err) {
      console.error('Error fetching tracking data:', err);
      setError(
        err.response?.data?.error || 'Order not found or you do not have permission to view it'
      );
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderNumber) {
      fetchTrackingData(orderNumber);
    } else {
      setLoading(false);
    }
  }, [orderNumber]);

  const handleSearch = e => {
    e.preventDefault();
    if (searchOrderNumber.trim()) {
      fetchTrackingData(searchOrderNumber.trim());
    }
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

  const getStatusProgress = status => {
    const progressMap = {
      pending: 20,
      confirmed: 40,
      processing: 60,
      out_for_delivery: 80,
      delivered: 100,
      cancelled: 0,
      refunded: 0,
    };
    return progressMap[status] || 0;
  };

  const getEstimatedDeliveryMessage = () => {
    if (!trackingData) return null;

    if (trackingData.status === 'delivered') {
      return {
        type: 'success',
        message: `Order delivered on ${formatDateTime(
          trackingData.delivered_at || trackingData.created_at
        )}`,
      };
    }

    if (trackingData.status === 'cancelled') {
      return {
        type: 'error',
        message: 'Order has been cancelled',
      };
    }

    if (trackingData.estimated_delivery) {
      const estimatedDate = new Date(trackingData.estimated_delivery);
      const now = new Date();
      const isOverdue = estimatedDate < now && trackingData.status !== 'delivered';

      return {
        type: isOverdue ? 'warning' : 'info',
        message: isOverdue
          ? `Expected delivery was ${formatDateTime(
            trackingData.estimated_delivery
          )} - please contact support`
          : `Estimated delivery: ${formatDateTime(trackingData.estimated_delivery)}`,
      };
    }

    return {
      type: 'info',
      message: 'Delivery estimate will be updated soon',
    };
  };

  if (!orderNumber && !trackingData) {
    return (
      <div className="order-tracking">
        <div className="tracking-header">
          <h2>Track Your Order</h2>
          <p>Enter your order number to track its status</p>
        </div>

        <div className="tracking-search">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-group">
              <input
                type="text"
                placeholder="Enter order number (e.g., SHO20241201001)"
                value={searchOrderNumber}
                onChange={e => setSearchOrderNumber(e.target.value)}
                className="search-input"
                required
              />
              <button type="submit" className="search-btn" disabled={loading}>
                {loading ? 'Searching...' : 'Track Order'}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="tracking-error">
            <Alert type="error" message={error} />
          </div>
        )}

        <div className="tracking-help">
          <h3>Need Help?</h3>
          <div className="help-content">
            <div className="help-item">
              <div className="help-icon">📧</div>
              <div>
                <h4>Check Your Email</h4>
                <p>Your order number was sent to your email when you placed the order</p>
              </div>
            </div>
            <div className="help-item">
              <div className="help-icon">📱</div>
              <div>
                <h4>SMS Notification</h4>
                <p>Order updates are sent via SMS to your registered phone number</p>
              </div>
            </div>
            <div className="help-item">
              <div className="help-icon">💬</div>
              <div>
                <h4>Contact Support</h4>
                <p>Call us at +256 XXX XXX XXX or email support@shoponline.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="order-tracking">
        <div className="tracking-loading">
          <Loading />
          <p>Loading order tracking information...</p>
        </div>
      </div>
    );
  }

  if (error && !trackingData) {
    return (
      <div className="order-tracking">
        <div className="tracking-header">
          <h2>Track Your Order</h2>
        </div>

        <div className="tracking-search">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-group">
              <input
                type="text"
                placeholder="Enter order number"
                value={searchOrderNumber}
                onChange={e => setSearchOrderNumber(e.target.value)}
                className="search-input"
                required
              />
              <button type="submit" className="search-btn" disabled={loading}>
                {loading ? 'Searching...' : 'Track Order'}
              </button>
            </div>
          </form>
        </div>

        <Alert type="error" message={error} />
      </div>
    );
  }

  const estimatedDelivery = getEstimatedDeliveryMessage();

  return (
    <div className="order-tracking">
      <div className="tracking-header">
        <h2>Order Tracking</h2>
        <div className="order-info">
          <span className="order-number">#{trackingData.order_number}</span>
          <span className="order-date">Placed on {formatDateTime(trackingData.created_at)}</span>
        </div>
      </div>

      {/* Order Status Overview */}
      <div className="tracking-overview">
        <div className="status-card">
          <div className="status-header">
            <div className="current-status">
              <span
                className="status-indicator"
                style={{ backgroundColor: getStatusColor(trackingData.status) }}
              />
              <div className="status-text">
                <h3>{trackingData.status_display}</h3>
                <p>Current status of your order</p>
              </div>
            </div>
            <div className="status-actions">
              <button
                className="refresh-btn"
                onClick={() => fetchTrackingData(trackingData.order_number)}
                disabled={loading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M1 4V10H7M23 20V14H17M20.49 9A9 9 0 0 0 5.64 5.64L1 10M3.51 15A9 9 0 0 0 18.36 18.36L23 14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${getStatusProgress(trackingData.status)}%`,
                backgroundColor: getStatusColor(trackingData.status),
              }}
            />
          </div>

          {estimatedDelivery && (
            <div className={`delivery-estimate ${estimatedDelivery.type}`}>
              <div className="estimate-icon">
                {estimatedDelivery.type === 'success' && '✅'}
                {estimatedDelivery.type === 'warning' && '⚠️'}
                {estimatedDelivery.type === 'error' && '❌'}
                {estimatedDelivery.type === 'info' && 'ℹ️'}
              </div>
              <span>{estimatedDelivery.message}</span>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="order-summary-card">
          <h4>Order Summary</h4>
          <div className="summary-item">
            <span>Items:</span>
            <span>
              {trackingData.items_count} {trackingData.items_count === 1 ? 'item' : 'items'}
            </span>
          </div>
          <div className="summary-item">
            <span>Total:</span>
            <span className="total-amount">{formatCurrency(trackingData.total_amount)}</span>
          </div>
          <div className="summary-item">
            <span>Payment:</span>
            <span className={`payment-status ${trackingData.is_cash_on_delivery ? 'cod' : 'paid'}`}>
              {trackingData.is_cash_on_delivery ? 'Cash on Delivery' : 'Paid Online'}
            </span>
          </div>
        </div>
      </div>

      {/* Tracking Timeline */}
      <div className="tracking-timeline-section">
        <h3>Order Progress</h3>
        <TrackingTimeline
          orderData={trackingData}
          statusHistory={trackingData.status_history || []}
        />
      </div>

      {/* Tracking Number */}
      {trackingData.tracking_number && (
        <div className="tracking-number-section">
          <h3>Shipping Information</h3>
          <div className="tracking-number-card">
            <div className="tracking-info">
              <div className="tracking-icon">📦</div>
              <div className="tracking-details">
                <h4>Tracking Number</h4>
                <p className="tracking-code">{trackingData.tracking_number}</p>
                <p className="tracking-note">
                  You can use this number to track with our delivery partner
                </p>
              </div>
            </div>
            <button
              className="copy-btn"
              onClick={() => {
                navigator.clipboard.writeText(trackingData.tracking_number);
                // Show toast notification
              }}
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Contact Support */}
      <div className="support-section">
        <h3>Need Help?</h3>
        <div className="support-options">
          <div className="support-option">
            <div className="support-icon">📞</div>
            <div>
              <h4>Call Us</h4>
              <p>+256 XXX XXX XXX</p>
              <p className="support-hours">Mon-Fri 8AM-6PM</p>
            </div>
          </div>
          <div className="support-option">
            <div className="support-icon">📧</div>
            <div>
              <h4>Email Support</h4>
              <p>support@shoponline.com</p>
              <p className="support-hours">Response within 24 hours</p>
            </div>
          </div>
          <div className="support-option">
            <div className="support-icon">💬</div>
            <div>
              <h4>Live Chat</h4>
              <p>Chat with our support team</p>
              <button className="chat-btn">Start Chat</button>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Actions */}
      <div className="tracking-actions">
        {trackingData.status === 'delivered' && (
          <button className="btn btn-outline">Reorder Items</button>
        )}
        <button
          className="btn btn-outline"
          onClick={() =>
            (window.location.href = `/orders/${trackingData.order_number.replace('#', '')}`)
          }
        >
          View Full Order Details
        </button>
        <button className="btn btn-outline" onClick={() => window.print()}>
          Print Tracking Info
        </button>
      </div>
    </div>
  );
};

export default OrderTracking;
