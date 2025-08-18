// src/components/admin/Orders/OrderStatus.js

import React from 'react';

const OrderStatus = ({ status, size = 'medium', showIcon = true }) => {
  // Status configuration with colors, icons, and labels
  const statusConfig = {
    pending: {
      label: 'Pending',
      icon: '⏳',
      class: 'pending',
      color: '#f59e0b', // Orange
      bgColor: '#fef3c7',
      description: 'Order is waiting for confirmation',
    },
    confirmed: {
      label: 'Confirmed',
      icon: '✅',
      class: 'confirmed',
      color: '#10b981', // Green
      bgColor: '#d1fae5',
      description: 'Order has been confirmed and is being processed',
    },
    processing: {
      label: 'Processing',
      icon: '⚙️',
      class: 'processing',
      color: '#3b82f6', // Blue
      bgColor: '#dbeafe',
      description: 'Order is being prepared',
    },
    out_for_delivery: {
      label: 'Out for Delivery',
      icon: '🚛',
      class: 'out-for-delivery',
      color: '#8b5cf6', // Purple
      bgColor: '#ede9fe',
      description: 'Order is out for delivery',
    },
    delivered: {
      label: 'Delivered',
      icon: '🚚',
      class: 'delivered',
      color: '#059669', // Dark Green
      bgColor: '#a7f3d0',
      description: 'Order has been successfully delivered',
    },
    cancelled: {
      label: 'Cancelled',
      icon: '❌',
      class: 'cancelled',
      color: '#ef4444', // Red
      bgColor: '#fecaca',
      description: 'Order has been cancelled',
    },
    refunded: {
      label: 'Refunded',
      icon: '💸',
      class: 'refunded',
      color: '#6b7280', // Gray
      bgColor: '#f3f4f6',
      description: 'Order has been refunded',
    },
  };

  // Get status configuration
  const config = statusConfig[status] || {
    label: status || 'Unknown',
    icon: '❓',
    class: 'unknown',
    color: '#6b7280',
    bgColor: '#f3f4f6',
    description: 'Unknown status',
  };

  // Size variants
  const sizeClasses = {
    small: 'order-status--small',
    medium: 'order-status--medium',
    large: 'order-status--large',
  };

  return (
    <span
      className={`order-status ${config.class} ${sizeClasses[size]}`}
      style={{
        '--status-color': config.color,
        '--status-bg-color': config.bgColor,
      }}
      title={config.description}
    >
      {showIcon && <span className="order-status__icon">{config.icon}</span>}
      <span className="order-status__label">{config.label}</span>
    </span>
  );
};

// Progress indicator component for showing order timeline
export const OrderStatusProgress = ({ currentStatus, showLabels = true }) => {
  const statusFlow = ['pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered'];

  const currentIndex = statusFlow.indexOf(currentStatus);
  const isCancelled = currentStatus === 'cancelled';
  const isRefunded = currentStatus === 'refunded';

  if (isCancelled || isRefunded) {
    return (
      <div className="order-status-progress cancelled">
        <div className="progress-item active cancelled">
          <div className="progress-dot">
            <span className="progress-icon">{isCancelled ? '❌' : '💸'}</span>
          </div>
          {showLabels && (
            <div className="progress-label">{isCancelled ? 'Cancelled' : 'Refunded'}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="order-status-progress">
      {statusFlow.map((status, index) => {
        const config = {
          pending: { icon: '⏳', label: 'Pending' },
          confirmed: { icon: '✅', label: 'Confirmed' },
          processing: { icon: '⚙️', label: 'Processing' },
          out_for_delivery: { icon: '🚛', label: 'Out for Delivery' },
          delivered: { icon: '🚚', label: 'Delivered' },
        }[status];

        const isActive = index <= currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={status} className="progress-step">
            <div
              className={`progress-item ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}
            >
              <div className="progress-dot">
                <span className="progress-icon">{config.icon}</span>
              </div>
              {showLabels && <div className="progress-label">{config.label}</div>}
            </div>
            {index < statusFlow.length - 1 && (
              <div className={`progress-line ${isActive ? 'active' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// Compact status list for showing multiple statuses
export const OrderStatusList = ({ statuses, maxVisible = 3 }) => {
  const visibleStatuses = statuses.slice(0, maxVisible);
  const remainingCount = Math.max(0, statuses.length - maxVisible);

  return (
    <div className="order-status-list">
      {visibleStatuses.map((status, index) => (
        <OrderStatus key={`${status}-${index}`} status={status} size="small" />
      ))}
      {remainingCount > 0 && <span className="order-status-more">+{remainingCount} more</span>}
    </div>
  );
};

// Status change history component
export const OrderStatusHistory = ({ statusHistory }) => {
  if (!statusHistory || statusHistory.length === 0) {
    return (
      <div className="order-status-history empty">
        <p>No status changes recorded.</p>
      </div>
    );
  }

  return (
    <div className="order-status-history">
      <h4>Status History</h4>
      <div className="status-history-list">
        {statusHistory.map((history, index) => (
          <div key={history.id || index} className="status-history-item">
            <div className="history-timeline">
              <div className="timeline-dot">
                <OrderStatus status={history.new_status} size="small" showIcon={true} />
              </div>
              {index < statusHistory.length - 1 && <div className="timeline-line" />}
            </div>

            <div className="history-content">
              <div className="history-header">
                <div className="status-change">
                  <OrderStatus status={history.previous_status} size="small" />
                  <span className="arrow">→</span>
                  <OrderStatus status={history.new_status} size="small" />
                </div>
                <div className="history-meta">
                  <span className="history-date">
                    {new Date(history.created_at).toLocaleString()}
                  </span>
                  {history.changed_by_name && (
                    <span className="history-user">by {history.changed_by_name}</span>
                  )}
                </div>
              </div>

              {history.notes && (
                <div className="history-notes">
                  <p>{history.notes}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Status filter dropdown component
export const OrderStatusFilter = ({
  selectedStatus,
  onStatusChange,
  includeAll = true,
  placeholder = 'Filter by status',
}) => {
  const statusOptions = [
    { value: 'pending', label: 'Pending', icon: '⏳' },
    { value: 'confirmed', label: 'Confirmed', icon: '✅' },
    { value: 'processing', label: 'Processing', icon: '⚙️' },
    { value: 'out_for_delivery', label: 'Out for Delivery', icon: '🚛' },
    { value: 'delivered', label: 'Delivered', icon: '🚚' },
    { value: 'cancelled', label: 'Cancelled', icon: '❌' },
    { value: 'refunded', label: 'Refunded', icon: '💸' },
  ];

  return (
    <select
      className="order-status-filter"
      value={selectedStatus}
      onChange={e => onStatusChange(e.target.value)}
    >
      {includeAll && <option value="">{placeholder}</option>}
      {statusOptions.map(option => (
        <option key={option.value} value={option.value}>
          {option.icon} {option.label}
        </option>
      ))}
    </select>
  );
};

// Status statistics component
export const OrderStatusStats = ({ orderStats }) => {
  const statusItems = [
    { status: 'pending', count: orderStats.pending, label: 'Pending' },
    { status: 'confirmed', count: orderStats.confirmed, label: 'Confirmed' },
    { status: 'processing', count: orderStats.processing, label: 'Processing' },
    { status: 'delivered', count: orderStats.delivered, label: 'Delivered' },
    { status: 'cancelled', count: orderStats.cancelled, label: 'Cancelled' },
  ];

  return (
    <div className="order-status-stats">
      {statusItems.map(item => (
        <div key={item.status} className="status-stat-item">
          <OrderStatus status={item.status} size="small" />
          <span className="stat-count">{item.count}</span>
          <span className="stat-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default OrderStatus;
