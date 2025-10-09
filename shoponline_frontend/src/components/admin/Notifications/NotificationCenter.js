import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Bell, Settings, Filter, CheckCircle, RefreshCw, Download, AlertCircle } from 'lucide-react';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    type: '',
    priority: '',
    is_read: '',
  });
  const [counts, setCounts] = useState({
    total_count: 0,
    unread_count: 0,
    type_counts: {},
  });
  const [wsConnected, setWsConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
    try {
      setError(null);
      if (!append) setLoading(true);

      const queryParams = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10',
        ...(filters.type && { type: filters.type }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.is_read !== '' && { is_read: filters.is_read }),
      });

      const response = await fetch(`/api/notifications?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (append) {
        setNotifications(prev => [...prev, ...data.notifications]);
      } else {
        setNotifications(data.notifications || []);
      }
      
      setCounts(data.counts || {
        total_count: 0,
        unread_count: 0,
        type_counts: {},
      });
      
      setHasMore(data.has_more || false);
      setPage(pageNum);
      
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  // Fetch notification counts
  const fetchCounts = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/counts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCounts(data);
      }
    } catch (err) {
      console.error('Error fetching counts:', err);
    }
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/notifications?token=${token}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      setWsConnected(true);
      console.log('WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'notification') {
          // Add new notification to the list
          setNotifications(prev => [data.notification, ...prev]);
          // Update counts
          fetchCounts();
        } else if (data.type === 'notification_read') {
          // Update notification read status
          setNotifications(prev => 
            prev.map(notif => 
              notif.id === data.notification_id 
                ? { ...notif, is_read: true, read_at: data.read_at }
                : notif
            )
          );
          fetchCounts();
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };
    
    ws.onclose = () => {
      setWsConnected(false);
      console.log('WebSocket disconnected');
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [fetchCounts]);

  // Initial load
  useEffect(() => {
    fetchNotifications(1, false);
    fetchCounts();
  }, [fetchNotifications]);

  // Refetch when filters change
  useEffect(() => {
    if (loading) return; // Don't refetch during initial load
    fetchNotifications(1, false);
  }, [filters, activeTab]);

  // Filter notifications based on active tab
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];

    if (activeTab === 'cod') {
      filtered = filtered.filter(n => n.notification_type === 'cod_order');
    } else if (activeTab === 'unread') {
      filtered = filtered.filter(n => !n.is_read);
    } else if (activeTab === 'admin') {
      const adminTypes = [
        'order_created',
        'cod_order',
        'payment_received',
        'flash_sale_started',
        'low_stock',
        'system_alert',
      ];
      filtered = filtered.filter(n => adminTypes.includes(n.notification_type));
    }

    return filtered;
  }, [notifications, activeTab]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications(1, false);
    await fetchCounts();
  }, [fetchNotifications, fetchCounts]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark all as read');
      }

      setNotifications(prev =>
        prev.map(notif => ({ 
          ...notif, 
          is_read: true, 
          read_at: new Date().toISOString() 
        }))
      );
      
      setCounts(prev => ({
        ...prev,
        unread_count: 0
      }));
    } catch (error) {
      console.error('Error marking all as read:', error);
      setError('Failed to mark all notifications as read');
    }
  }, []);

  // Mark selected as read
  const markSelectedAsRead = useCallback(async (notificationIds) => {
    try {
      const idsArray = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
      
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ notification_ids: idsArray }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark notifications as read');
      }
      
      setNotifications(prev =>
        prev.map(notif =>
          idsArray.includes(notif.id)
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
      
      const markedCount = idsArray.length;
      setCounts(prev => ({
        ...prev,
        unread_count: Math.max(0, prev.unread_count - markedCount)
      }));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      setError('Failed to mark notifications as read');
    }
  }, []);

  // Export notifications
  const handleExport = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/export', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export notifications');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notifications_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting notifications:', error);
      setError('Failed to export notifications');
    }
  }, []);

  // Load more notifications
  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchNotifications(page + 1, true);
    }
  }, [fetchNotifications, page, loading, hasMore]);

  const tabs = [
    { id: 'all', label: 'All', count: counts.total_count },
    { id: 'unread', label: 'Unread', count: counts.unread_count },
    { id: 'cod', label: 'COD Orders', count: counts.type_counts?.cod_order || 0 },
    {
      id: 'admin',
      label: 'Admin Alerts',
      count: Object.values(counts.type_counts || {}).reduce((a, b) => a + b, 0),
    },
  ];

  return (
    <div className="notification-center">
      {/* Header */}
      <div className="notification-header">
        <div className="header-left">
          <div className="header-title">
            <Bell className="header-icon" size={28} />
            <div className="title-content">
              <h2>Notification Center</h2>
              <div className={`connection-status ${wsConnected ? 'connected' : 'disconnected'}`}>
                <div className="status-dot" />
                <span>{wsConnected ? 'Live Updates' : 'Polling Mode'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <button
            onClick={handleRefresh}
            className="action-btn refresh-btn"
            disabled={refreshing}
            title="Refresh notifications"
          >
            <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
            Refresh
          </button>

          <button
            onClick={markAllAsRead}
            className="action-btn mark-read-btn"
            disabled={counts.unread_count === 0 || loading}
            title={`Mark all ${counts.unread_count} notifications as read`}
          >
            <CheckCircle size={16} />
            Mark All Read ({counts.unread_count})
          </button>

          <button 
            onClick={handleExport}
            className="action-btn export-btn"
            title="Export notifications"
          >
            <Download size={16} />
            Export
          </button>

          <button className="action-btn settings-btn" title="Notification settings">
            <Settings size={16} />
            Settings
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button 
            onClick={() => setError(null)}
            className="error-dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="notification-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            aria-label={`${tab.label} notifications (${tab.count})`}
          >
            <span className="tab-label">{tab.label}</span>
            {tab.count > 0 && (
              <span className={`tab-count ${tab.id === 'cod' ? 'urgent' : ''}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="notification-filters">
        <div className="filter-group">
          <Filter size={16} />
          <select
            value={filters.type}
            onChange={e => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="filter-select"
            aria-label="Filter by notification type"
          >
            <option value="">All Types</option>
            <option value="order_created">Order Created</option>
            <option value="cod_order">COD Orders</option>
            <option value="payment_received">Payment Received</option>
            <option value="flash_sale_started">Flash Sales</option>
            <option value="low_stock">Low Stock</option>
            <option value="system_alert">System Alerts</option>
          </select>
        </div>

        <div className="filter-group">
          <select
            value={filters.priority}
            onChange={e => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            className="filter-select"
            aria-label="Filter by priority"
          >
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="filter-group">
          <select
            value={filters.is_read}
            onChange={e => setFilters(prev => ({ ...prev, is_read: e.target.value }))}
            className="filter-select"
            aria-label="Filter by read status"
          >
            <option value="">All Status</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </select>
        </div>
      </div>

      {/* COD Notifications - Special Section */}
      {activeTab === 'cod' && (
        <CODNotifications 
          notifications={filteredNotifications}
          onRefresh={handleRefresh}
          onMarkAsRead={markSelectedAsRead}
        />
      )}

      {/* Main Notifications Container */}
      <div className="notifications-container">
        {loading && notifications.length === 0 ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <Bell className="empty-icon" size={64} />
            <h3>No notifications found</h3>
            <p>
              {activeTab === 'all' 
                ? "You're all caught up! No notifications at the moment."
                : `No ${activeTab} notifications found. Try adjusting your filters.`
              }
            </p>
            {activeTab !== 'all' && (
              <button 
                className="clear-filters-btn"
                onClick={() => {
                  setActiveTab('all');
                  setFilters({ type: '', priority: '', is_read: '' });
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="notifications-list">
            {filteredNotifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markSelectedAsRead}
                onUpdate={handleRefresh}
              />
            ))}
          </div>
        )}
      </div>

      {/* Load More Button */}
      {!loading && filteredNotifications.length > 0 && hasMore && (
        <div className="load-more-container">
          <button 
            className="load-more-btn"
            onClick={handleLoadMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More Notifications'}
          </button>
        </div>
      )}
    </div>
  );
};

// NotificationItem component
const NotificationItem = ({ notification, onMarkAsRead }) => {
  const [expanded, setExpanded] = useState(false);

  const getNotificationIcon = () => {
    switch (notification.notification_type) {
      case 'cod_order': return '🚨';
      case 'flash_sale_started': return '⚡';
      case 'low_stock': return '📦';
      case 'payment_received': return '💰';
      case 'order_created': return '🛍️';
      case 'system_alert': return '⚠️';
      default: return '🔔';
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className={`notification-item ${!notification.is_read ? 'unread' : ''}`}>
      <div className={`priority-indicator ${notification.priority}`} />
      
      <div className="notification-content" onClick={() => setExpanded(!expanded)}>
        <div className="notification-header">
          <div className="notification-icon">
            <div className={`icon-wrapper type-${notification.notification_type}`}>
              <span>{getNotificationIcon()}</span>
            </div>
          </div>
          
          <div className="notification-main">
            <div className="notification-title-row">
              <h4 className="notification-title">{notification.title}</h4>
              <div className="notification-meta">
                <span className="notification-time">{formatTime(notification.created_at)}</span>
                {!notification.is_read && <div className="unread-dot" />}
              </div>
            </div>
            
            <p className="notification-message">{notification.message}</p>
            
            <div className="notification-tags">
              <span className={`type-tag type-${notification.notification_type}`}>
                {notification.notification_type.replace('_', ' ').toUpperCase()}
              </span>
              <span className={`priority-tag ${notification.priority}`}>
                {notification.priority.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {expanded && notification.additional_data && (
          <div className="notification-details">
            <div className="additional-data">
              <h5>Additional Information</h5>
              <div className="data-grid">
                {Object.entries(notification.additional_data).map(([key, value]) => (
                  <div key={key} className="data-item">
                    <span className="data-key">{key.replace('_', ' ')}</span>
                    <span className="data-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="quick-actions">
        {!notification.is_read && (
          <button
            className="quick-action-btn mark-read"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
            title="Mark as read"
          >
            <CheckCircle size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

// CODNotifications component
const CODNotifications = ({ notifications, onRefresh, onMarkAsRead }) => {
  const codStats = useMemo(() => {
    const urgent = notifications.filter(n => n.priority === 'critical').length;
    const total = notifications.length;
    const totalAmount = notifications.reduce((sum, n) => {
      return sum + (n.additional_data?.amount || 0);
    }, 0);
    
    return { urgent, total, totalAmount };
  }, [notifications]);

  return (
    <div className="cod-notifications-container">
      <div className="cod-header">
        <div className="cod-stats">
          <div className="stat-card urgent">
            <div className="stat-icon">🚨</div>
            <div className="stat-info">
              <div className="stat-number">{codStats.urgent}</div>
              <div className="stat-label">Urgent COD</div>
            </div>
          </div>
          
          <div className="stat-card total">
            <div className="stat-icon">📦</div>
            <div className="stat-info">
              <div className="stat-number">{codStats.total}</div>
              <div className="stat-label">Total Orders</div>
            </div>
          </div>
          
          <div className="stat-card amount">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <div className="stat-number">UGX {codStats.totalAmount.toLocaleString()}</div>
              <div className="stat-label">Total Value</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="cod-orders-list">
        {notifications.length === 0 ? (
          <div className="empty-cod-state">
            <h3>No COD orders</h3>
            <p>All COD orders have been processed.</p>
          </div>
        ) : (
          notifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={onMarkAsRead}
              onUpdate={onRefresh}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;