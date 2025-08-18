import React, { useState } from 'react';
import {
  ShoppingCart,
  CreditCard,
  AlertTriangle,
  Package,
  Zap,
  Info,
  Clock,
  Check,
  Eye,
  MoreVertical,
  Phone,
  User,
  DollarSign,
} from 'lucide-react';

const NotificationItem = ({ notification, onMarkAsRead, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Get icon based on notification type
  const getNotificationIcon = type => {
    const iconMap = {
      order_created: ShoppingCart,
      cod_order: CreditCard,
      payment_received: DollarSign,
      flash_sale_started: Zap,
      low_stock: Package,
      system_alert: AlertTriangle,
      admin_invitation: User,
      flash_sale_ending: Clock,
    };

    const IconComponent = iconMap[type] || Info;
    return <IconComponent size={20} />;
  };

  // Get priority styling
  const getPriorityStyle = priority => {
    const styles = {
      critical: 'priority-critical',
      high: 'priority-high',
      medium: 'priority-medium',
      low: 'priority-low',
    };
    return styles[priority] || styles.medium;
  };

  // Get notification type styling
  const getTypeStyle = type => {
    const styles = {
      order_created: 'type-order',
      cod_order: 'type-cod urgent',
      payment_received: 'type-payment',
      flash_sale_started: 'type-flash-sale',
      low_stock: 'type-stock',
      system_alert: 'type-system',
      admin_invitation: 'type-admin',
    };
    return styles[type] || 'type-default';
  };

  // Format time ago
  const formatTimeAgo = dateString => {
    const now = new Date();
    const notificationTime = new Date(dateString);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Handle mark as read
  const handleMarkAsRead = async e => {
    e.stopPropagation();
    if (!notification.is_read) {
      await onMarkAsRead([notification.id]);
    }
    setShowMenu(false);
  };

  // Handle view details
  const handleViewDetails = e => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
    if (!notification.is_read) {
      onMarkAsRead([notification.id]);
    }
    setShowMenu(false);
  };

  // Render COD order details
  const renderCODDetails = () => {
    if (notification.notification_type !== 'cod_order' || !notification.data) return null;

    const { order_number, customer_name, customer_phone, total_amount } = notification.data;

    return (
      <div className="cod-details">
        <div className="cod-header">
          <span className="cod-badge">URGENT - Cash on Delivery</span>
        </div>
        <div className="cod-info">
          <div className="cod-row">
            <ShoppingCart size={16} />
            <span>Order #{order_number}</span>
          </div>
          {customer_name && (
            <div className="cod-row">
              <User size={16} />
              <span>{customer_name}</span>
            </div>
          )}
          {customer_phone && (
            <div className="cod-row">
              <Phone size={16} />
              <span>{customer_phone}</span>
            </div>
          )}
          <div className="cod-row amount">
            <DollarSign size={16} />
            <span>UGX {parseFloat(total_amount || 0).toLocaleString()}</span>
          </div>
        </div>
        <div className="cod-actions">
          <button className="cod-action-btn primary">View Order Details</button>
          <button className="cod-action-btn secondary">Call Customer</button>
        </div>
      </div>
    );
  };

  // Render order details
  const renderOrderDetails = () => {
    if (notification.notification_type !== 'order_created' || !notification.data) return null;

    const { order_number, total_amount, payment_method } = notification.data;

    return (
      <div className="order-details">
        <div className="order-info">
          <div className="order-row">
            <ShoppingCart size={16} />
            <span>Order #{order_number}</span>
          </div>
          <div className="order-row">
            <DollarSign size={16} />
            <span>UGX {parseFloat(total_amount || 0).toLocaleString()}</span>
          </div>
          {payment_method && (
            <div className="order-row">
              <CreditCard size={16} />
              <span>{payment_method.toUpperCase()}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render flash sale details
  const renderFlashSaleDetails = () => {
    if (!notification.notification_type.includes('flash_sale') || !notification.data) return null;

    const { sale_name, discount_percentage, end_time } = notification.data;

    return (
      <div className="flash-sale-details">
        <div className="sale-info">
          {sale_name && (
            <div className="sale-row">
              <Zap size={16} />
              <span>{sale_name}</span>
            </div>
          )}
          {discount_percentage && (
            <div className="sale-row">
              <span className="discount-badge">{discount_percentage}% OFF</span>
            </div>
          )}
          {end_time && (
            <div className="sale-row">
              <Clock size={16} />
              <span>Ends: {new Date(end_time).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`notification-item ${!notification.is_read ? 'unread' : 'read'} ${getPriorityStyle(
        notification.priority
      )}`}
    >
      {/* Priority Indicator */}
      <div className={`priority-indicator ${notification.priority}`} />

      {/* Main Content */}
      <div className="notification-content" onClick={handleViewDetails}>
        {/* Header */}
        <div className="notification-header">
          <div className="notification-icon">
            <div className={`icon-wrapper ${getTypeStyle(notification.notification_type)}`}>
              {getNotificationIcon(notification.notification_type)}
            </div>
          </div>

          <div className="notification-main">
            <div className="notification-title-row">
              <h4 className="notification-title">{notification.title}</h4>
              <div className="notification-meta">
                <span className="notification-time">{formatTimeAgo(notification.created_at)}</span>
                {!notification.is_read && <div className="unread-dot" />}
              </div>
            </div>

            <p className="notification-message">{notification.message}</p>

            <div className="notification-tags">
              <span className={`type-tag ${getTypeStyle(notification.notification_type)}`}>
                {notification.notification_type.replace('_', ' ').toUpperCase()}
              </span>
              <span className={`priority-tag ${notification.priority}`}>
                {notification.priority.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="notification-actions">
            <button
              className="action-toggle"
              onClick={e => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
            >
              <MoreVertical size={16} />
            </button>

            {showMenu && (
              <div className="actions-menu">
                <button onClick={handleViewDetails} className="menu-item">
                  <Eye size={14} />
                  {isExpanded ? 'Collapse' : 'Expand'}
                </button>
                {!notification.is_read && (
                  <button onClick={handleMarkAsRead} className="menu-item">
                    <Check size={14} />
                    Mark as Read
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="notification-details">
            {notification.notification_type === 'cod_order' && renderCODDetails()}
            {notification.notification_type === 'order_created' && renderOrderDetails()}
            {notification.notification_type.includes('flash_sale') && renderFlashSaleDetails()}

            {/* Additional Data */}
            {notification.data && Object.keys(notification.data).length > 0 && (
              <div className="additional-data">
                <h5>Additional Information:</h5>
                <div className="data-grid">
                  {Object.entries(notification.data).map(([key, value]) => (
                    <div key={key} className="data-item">
                      <span className="data-key">{key.replace('_', ' ')}:</span>
                      <span className="data-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="timestamps">
              <div className="timestamp-item">
                <Clock size={14} />
                <span>Created: {new Date(notification.created_at).toLocaleString()}</span>
              </div>
              {notification.read_at && (
                <div className="timestamp-item">
                  <Check size={14} />
                  <span>Read: {new Date(notification.read_at).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions for COD Orders */}
      {notification.notification_type === 'cod_order' && !isExpanded && (
        <div className="quick-actions">
          <button className="quick-action-btn urgent">View Order</button>
          <button className="quick-action-btn secondary">Call Customer</button>
        </div>
      )}

      {/* Click overlay to close menu */}
      {showMenu && (
        <div
          className="menu-overlay"
          onClick={e => {
            e.stopPropagation();
            setShowMenu(false);
          }}
        />
      )}
    </div>
  );
};

export default NotificationItem;
