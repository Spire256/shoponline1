import React from 'react';
import { formatDateTime } from '../../../utils/helpers/formatters';

const OrderTimeline = ({ order, statusHistory = [] }) => {
  const getTimelineSteps = () => {
    const baseSteps = [
      {
        key: 'pending',
        label: 'Order Placed',
        description: 'Your order has been placed successfully',
        icon: '📝',
        timestamp: order.created_at,
      },
      {
        key: 'confirmed',
        label: 'Order Confirmed',
        description: 'We have confirmed your order and started processing',
        icon: '✅',
        timestamp: order.confirmed_at,
      },
      {
        key: 'processing',
        label: 'Processing',
        description: 'Your order is being prepared for delivery',
        icon: '⚙️',
        timestamp: null,
      },
      {
        key: 'out_for_delivery',
        label: 'Out for Delivery',
        description: 'Your order is on the way to you',
        icon: '🚚',
        timestamp: null,
      },
      {
        key: 'delivered',
        label: 'Delivered',
        description: 'Your order has been successfully delivered',
        icon: '📦',
        timestamp: order.delivered_at,
      },
    ];

    // Handle cancelled orders
    if (order.status === 'cancelled') {
      return [
        baseSteps[0], // Order placed
        order.confirmed_at ? baseSteps[1] : null, // Order confirmed (if it was confirmed)
        {
          key: 'cancelled',
          label: 'Order Cancelled',
          description: 'Your order has been cancelled',
          icon: '❌',
          timestamp: order.cancelled_at,
          isCancelled: true,
        },
      ].filter(Boolean);
    }

    // Handle refunded orders
    if (order.status === 'refunded') {
      return [
        ...baseSteps.filter(
          step =>
            step.timestamp ||
            getCurrentStepIndex(baseSteps, order.status) >=
              baseSteps.findIndex(s => s.key === step.key)
        ),
        {
          key: 'refunded',
          label: 'Order Refunded',
          description: 'Your order has been refunded',
          icon: '↩️',
          timestamp: null, // Would need refund timestamp from backend
          isRefunded: true,
        },
      ];
    }

    return baseSteps;
  };

  const getCurrentStepIndex = (steps, currentStatus) => {
    return steps.findIndex(step => step.key === currentStatus);
  };

  const getStepStatus = (step, stepIndex, currentStepIndex, isLastStep) => {
    if (step.isCancelled || step.isRefunded) {
      return 'error';
    }

    if (stepIndex < currentStepIndex) {
      return 'completed';
    }

    if (stepIndex === currentStepIndex) {
      return 'current';
    }

    return 'pending';
  };

  const steps = getTimelineSteps();
  const currentStepIndex = getCurrentStepIndex(steps, order.status);

  // Merge with status history for more detailed timestamps
  const enrichedSteps = steps.map(step => {
    const historyItem = statusHistory.find(h => h.new_status === step.key);
    return {
      ...step,
      timestamp: step.timestamp || (historyItem ? historyItem.created_at : null),
      changedBy: historyItem?.changed_by_name,
      notes: historyItem?.notes,
    };
  });

  return (
    <div className="order-timeline">
      <div className="timeline-container">
        {enrichedSteps.map((step, index) => {
          const status = getStepStatus(
            step,
            index,
            currentStepIndex,
            index === enrichedSteps.length - 1
          );
          const isLast = index === enrichedSteps.length - 1;

          return (
            <div key={step.key} className={`timeline-step timeline-step-${status}`}>
              <div className="timeline-connector">
                <div className="timeline-dot">
                  <span className="timeline-icon">{step.icon}</span>
                </div>
                {!isLast && <div className="timeline-line" />}
              </div>

              <div className="timeline-content">
                <div className="timeline-header">
                  <h4 className="timeline-label">{step.label}</h4>
                  <div className="timeline-status">
                    {status === 'completed' && (
                      <span className="status-badge completed">✓ Completed</span>
                    )}
                    {status === 'current' && (
                      <span className="status-badge current">● In Progress</span>
                    )}
                    {status === 'error' && (
                      <span className="status-badge error">
                        ● {step.isCancelled ? 'Cancelled' : 'Refunded'}
                      </span>
                    )}
                    {status === 'pending' && (
                      <span className="status-badge pending">○ Pending</span>
                    )}
                  </div>
                </div>

                <p className="timeline-description">{step.description}</p>

                {step.timestamp && (
                  <div className="timeline-timestamp">
                    <span className="timestamp-icon">🕐</span>
                    <span className="timestamp-text">{formatDateTime(step.timestamp)}</span>
                    {step.changedBy && <span className="changed-by">by {step.changedBy}</span>}
                  </div>
                )}

                {step.notes && (
                  <div className="timeline-notes">
                    <span className="notes-icon">📝</span>
                    <span className="notes-text">{step.notes}</span>
                  </div>
                )}

                {/* Special information for specific steps */}
                {step.key === 'confirmed' && order.payment_method === 'cash_on_delivery' && (
                  <div className="timeline-extra-info">
                    <div className="cod-info">
                      <span className="cod-icon">💰</span>
                      <span>Cash on Delivery - Payment due upon delivery</span>
                    </div>
                  </div>
                )}

                {step.key === 'out_for_delivery' && order.tracking_number && (
                  <div className="timeline-extra-info">
                    <div className="tracking-info">
                      <span className="tracking-icon">📦</span>
                      <span>Tracking: {order.tracking_number}</span>
                      <button
                        className="track-button"
                        onClick={() =>
                          (window.location.href = `/orders/track/${order.order_number}`)
                        }
                      >
                        Track Package
                      </button>
                    </div>
                  </div>
                )}

                {step.key === 'delivered' && order.is_cash_on_delivery && (
                  <div className="timeline-extra-info">
                    <div className="payment-confirmation">
                      <span className="payment-icon">💳</span>
                      <span>Payment collected upon delivery</span>
                    </div>
                  </div>
                )}

                {step.key === 'processing' && order.estimated_delivery && (
                  <div className="timeline-extra-info">
                    <div className="estimated-delivery">
                      <span className="delivery-icon">📅</span>
                      <span>Estimated delivery: {formatDateTime(order.estimated_delivery)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Status History */}
      {statusHistory.length > enrichedSteps.length && (
        <div className="additional-history">
          <h4>Additional Updates</h4>
          <div className="history-list">
            {statusHistory
              .filter(item => !enrichedSteps.some(step => step.key === item.new_status))
              .map((item, index) => (
                <div key={index} className="history-item">
                  <div className="history-timestamp">{formatDateTime(item.created_at)}</div>
                  <div className="history-change">
                    Status changed from <strong>{item.previous_status}</strong> to{' '}
                    <strong>{item.new_status}</strong>
                    {item.changed_by_name && <span> by {item.changed_by_name}</span>}
                  </div>
                  {item.notes && <div className="history-notes">{item.notes}</div>}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Real-time updates indicator */}
      {status === 'current' && ['processing', 'out_for_delivery'].includes(order.status) && (
        <div className="realtime-indicator">
          <div className="pulse-dot" />
          <span>We'll update you as your order progresses</span>
        </div>
      )}
    </div>
  );
};

export default OrderTimeline;
