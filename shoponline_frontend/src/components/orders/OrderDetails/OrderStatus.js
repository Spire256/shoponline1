import React from 'react';

const OrderStatus = ({ status, size = 'medium', showIcon = true }) => {
  const getStatusConfig = status => {
    const configs = {
      pending: {
        label: 'Pending',
        color: '#f59e0b',
        bgColor: '#fef3c7',
        icon: '⏳',
        description: 'Your order is being processed',
      },
      confirmed: {
        label: 'Confirmed',
        color: '#3b82f6',
        bgColor: '#dbeafe',
        icon: '✓',
        description: 'Your order has been confirmed',
      },
      processing: {
        label: 'Processing',
        color: '#8b5cf6',
        bgColor: '#f3e8ff',
        icon: '⚙️',
        description: 'Your order is being prepared',
      },
      out_for_delivery: {
        label: 'Out for Delivery',
        color: '#06b6d4',
        bgColor: '#cffafe',
        icon: '🚚',
        description: 'Your order is on the way',
      },
      delivered: {
        label: 'Delivered',
        color: '#10b981',
        bgColor: '#d1fae5',
        icon: '📦',
        description: 'Your order has been delivered',
      },
      cancelled: {
        label: 'Cancelled',
        color: '#ef4444',
        bgColor: '#fee2e2',
        icon: '❌',
        description: 'Your order has been cancelled',
      },
      refunded: {
        label: 'Refunded',
        color: '#6b7280',
        bgColor: '#f3f4f6',
        icon: '↩️',
        description: 'Your order has been refunded',
      },
    };

    return (
      configs[status] || {
        label: status,
        color: '#6b7280',
        bgColor: '#f3f4f6',
        icon: '❓',
        description: 'Status unknown',
      }
    );
  };

  const getSizeStyles = size => {
    const sizes = {
      small: {
        padding: '4px 8px',
        fontSize: '11px',
        iconSize: '12px',
        borderRadius: '12px',
      },
      medium: {
        padding: '6px 12px',
        fontSize: '13px',
        iconSize: '14px',
        borderRadius: '16px',
      },
      large: {
        padding: '8px 16px',
        fontSize: '15px',
        iconSize: '16px',
        borderRadius: '20px',
      },
    };

    return sizes[size] || sizes.medium;
  };

  const config = getStatusConfig(status);
  const sizeStyles = getSizeStyles(size);

  const statusStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: showIcon ? '6px' : '0',
    padding: sizeStyles.padding,
    backgroundColor: config.bgColor,
    color: config.color,
    border: `1px solid ${config.color}40`,
    borderRadius: sizeStyles.borderRadius,
    fontSize: sizeStyles.fontSize,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
  };

  const iconStyle = {
    fontSize: sizeStyles.iconSize,
    lineHeight: 1,
  };

  return (
    <span className="order-status-badge" style={statusStyle} title={config.description}>
      {showIcon && (
        <span className="status-icon" style={iconStyle}>
          {config.icon}
        </span>
      )}
      <span className="status-text">{config.label}</span>
    </span>
  );
};

export default OrderStatus;
