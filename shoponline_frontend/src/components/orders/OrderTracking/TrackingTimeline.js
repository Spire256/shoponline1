import React from 'react';
import { formatDateTime, formatDate } from '../../../utils/helpers/formatters';

const TrackingTimeline = ({ orderData, statusHistory = [] }) => {
  const getTrackingSteps = () => {
    const steps = [
      {
        key: 'pending',
        title: 'Order Placed',
        description: 'Your order has been received and is being reviewed',
        icon: '📝',
        timestamp: orderData.created_at,
        status: 'completed',
      },
      {
        key: 'confirmed',
        title: 'Order Confirmed',
        description: 'Your order has been confirmed and payment verified',
        icon: '✅',
        timestamp: orderData.confirmed_at,
        status: getStepStatus('confirmed'),
      },
      {
        key: 'processing',
        title: 'Preparing Order',
        description: 'Your items are being picked and packed',
        icon: '📦',
        timestamp: getStatusTimestamp('processing'),
        status: getStepStatus('processing'),
      },
      {
        key: 'out_for_delivery',
        title: 'Out for Delivery',
        description: 'Your order is on the way to your delivery address',
        icon: '🚚',
        timestamp: getStatusTimestamp('out_for_delivery'),
        status: getStepStatus('out_for_delivery'),
      },
      {
        key: 'delivered',
        title: 'Delivered',
        description: 'Your order has been successfully delivered',
        icon: '🎉',
        timestamp: orderData.delivered_at,
        status: getStepStatus('delivered'),
      },
    ];

    // Handle cancelled orders
    if (orderData.status === 'cancelled') {
      const cancelledStep = {
        key: 'cancelled',
        title: 'Order Cancelled',
        description: 'Your order has been cancelled',
        icon: '❌',
        timestamp: orderData.cancelled_at || new Date().toISOString(),
        status: 'cancelled',
      };

      // Find where to insert the cancelled step
      const confirmedIndex = steps.findIndex(s => s.key === 'confirmed');
      const hasBeenConfirmed = orderData.confirmed_at;

      if (hasBeenConfirmed) {
        // Insert after confirmed step
        steps.splice(confirmedIndex + 1, steps.length - confirmedIndex - 1, cancelledStep);
      } else {
        // Insert after pending step
        steps.splice(1, steps.length - 1, cancelledStep);
      }
    }

    return steps.filter(step => step.status !== 'hidden');
  };

  function getStepStatus(stepKey) {
    const statusOrder = ['pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered'];
    const currentStatusIndex = statusOrder.indexOf(orderData.status);
    const stepIndex = statusOrder.indexOf(stepKey);

    if (orderData.status === 'cancelled') {
      if (stepKey === 'pending') return 'completed';
      if (stepKey === 'confirmed' && orderData.confirmed_at) return 'completed';
      return 'cancelled';
    }

    if (stepIndex <= currentStatusIndex) {
      return 'completed';
    } else if (stepIndex === currentStatusIndex + 1) {
      return 'current';
    } else {
      return 'pending';
    }
  }

  function getStatusTimestamp(status) {
    const historyItem = statusHistory.find(h => h.new_status === status);
    return historyItem ? historyItem.created_at : null;
  }

  const steps = getTrackingSteps();

  const getStepClass = status => {
    const classes = {
      completed: 'timeline-step-completed',
      current: 'timeline-step-current',
      pending: 'timeline-step-pending',
      cancelled: 'timeline-step-cancelled',
    };
    return classes[status] || 'timeline-step-pending';
  };

  const getTimeDisplay = timestamp => {
    if (!timestamp) return null;

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays === 0) {
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return diffMins < 1 ? 'Just now' : `${diffMins} minutes ago`;
      }
      return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return formatDate(timestamp);
    }
  };

  return (
    <div className="tracking-timeline">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const stepClass = getStepClass(step.status);

        return (
          <div key={step.key} className={`tracking-step ${stepClass}`}>
            {/* Timeline connector */}
            <div className="step-connector">
              <div className="step-dot">
                <span className="step-icon">{step.icon}</span>
              </div>
              {!isLast && <div className="connector-line" />}
            </div>

            {/* Step content */}
            <div className="step-content">
              <div className="step-header">
                <h4 className="step-title">{step.title}</h4>
                <div className="step-status">
                  {step.status === 'completed' && (
                    <span className="status-badge completed">✓ Complete</span>
                  )}
                  {step.status === 'current' && (
                    <span className="status-badge current">● In Progress</span>
                  )}
                  {step.status === 'pending' && (
                    <span className="status-badge pending">○ Pending</span>
                  )}
                  {step.status === 'cancelled' && (
                    <span className="status-badge cancelled">✕ Cancelled</span>
                  )}
                </div>
              </div>

              <p className="step-description">{step.description}</p>

              {step.timestamp && (
                <div className="step-timestamp">
                  <span className="timestamp-relative">{getTimeDisplay(step.timestamp)}</span>
                  <span className="timestamp-absolute">{formatDateTime(step.timestamp)}</span>
                </div>
              )}

              {/* Special content for specific steps */}
              {step.key === 'confirmed' && orderData.is_cash_on_delivery && (
                <div className="step-extra">
                  <div className="cod-notice">
                    <span className="cod-icon">💰</span>
                    <span>Payment due on delivery</span>
                  </div>
                </div>
              )}

              {step.key === 'out_for_delivery' && orderData.tracking_number && (
                <div className="step-extra">
                  <div className="tracking-info">
                    <span className="tracking-icon">📦</span>
                    <span>Tracking: {orderData.tracking_number}</span>
                  </div>
                </div>
              )}

              {step.key === 'processing' && orderData.estimated_delivery && (
                <div className="step-extra">
                  <div className="delivery-estimate">
                    <span className="estimate-icon">📅</span>
                    <span>Expected delivery: {formatDate(orderData.estimated_delivery)}</span>
                  </div>
                </div>
              )}

              {step.key === 'delivered' && orderData.is_cash_on_delivery && (
                <div className="step-extra">
                  <div className="payment-confirmation">
                    <span className="payment-icon">💳</span>
                    <span>Payment collected successfully</span>
                  </div>
                </div>
              )}

              {/* Status history details */}
              {step.status === 'current' && step.key !== 'pending' && (
                <div className="step-progress">
                  <div className="progress-indicator">
                    <div className="progress-dots">
                      <span className="dot active" />
                      <span className="dot active" />
                      <span className="dot" />
                    </div>
                    <span className="progress-text">In progress...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Additional status updates */}
      {statusHistory.length > 0 && (
        <div className="additional-updates">
          <h4>Recent Updates</h4>
          {statusHistory
            .slice(0, 3) // Show only recent 3 updates
            .map((update, index) => (
              <div key={index} className="update-item">
                <div className="update-time">{getTimeDisplay(update.created_at)}</div>
                <div className="update-content">
                  <span className="update-text">
                    Status updated to <strong>{update.new_status.replace('_', ' ')}</strong>
                  </span>
                  {update.notes && <div className="update-notes">{update.notes}</div>}
                  {update.changed_by_name && (
                    <div className="update-by">by {update.changed_by_name}</div>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Live tracking indicator for active orders */}
      {['processing', 'out_for_delivery'].includes(orderData.status) && (
        <div className="live-tracking">
          <div className="live-indicator">
            <div className="pulse-dot" />
            <span>Live tracking active - we'll update you automatically</span>
          </div>
          <div className="next-update">Next update expected in 2-4 hours</div>
        </div>
      )}
    </div>
  );
};

export default TrackingTimeline;
