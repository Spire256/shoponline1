// src/components/admin/Notifications/NotificationCenter.js - FIXED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Settings, Filter, CheckCircle } from 'lucide-react';
import NotificationItem from './NotificationItem';
import CODNotifications from './CODNotifications';
import notificationsAPI from '../../../services/api/notificationsAPI';
import './Notifications.css';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // WebSocket connection - FIXED: Proper error handling and connection management
  useEffect(() => {
    let ws = null;
    let reconnectTimeout = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const baseReconnectDelay = 1000; // Start with 1 second

    const connectWebSocket = () => {
      // Skip WebSocket connection if we've exceeded max attempts
      if (reconnectAttempts >= maxReconnectAttempts) {
        console.warn('Max WebSocket reconnection attempts reached. Switching to polling mode.');
        setWsConnected(false);
        return;
      }

      try {
        // FIXED: Use correct backend WebSocket URL
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const backendHost = process.env.REACT_APP_BACKEND_HOST || 'localhost:8000';
        const wsUrl = `${protocol}//${backendHost}/ws/notifications/`;

        // Check if WebSocket is supported
        if (!window.WebSocket) {
          console.warn('WebSocket not supported in this browser');
          setWsConnected(false);
          return;
        }

        console.log('Attempting WebSocket connection to:', wsUrl);
        ws = new WebSocket(wsUrl);

        // Set connection timeout
        const connectionTimeout = setTimeout(() => {
          if (ws.readyState === WebSocket.CONNECTING) {
            console.warn('WebSocket connection timeout');
            ws.close();
          }
        }, 10000); // 10 second timeout

        ws.onopen = () => {
          console.log('WebSocket connected successfully');
          setWsConnected(true);
          reconnectAttempts = 0; // Reset attempts on successful connection
          
          // Clear timeouts
          clearTimeout(connectionTimeout);
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
          }
        };

        ws.onmessage = event => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'notification') {
              // Add new notification to the list
              setNotifications(prev => [data.data, ...prev]);
              // Update counts
              fetchNotificationCounts();
              // Show browser notification for urgent COD orders
              if (data.data.notification_type === 'cod_order') {
                showBrowserNotification(data.data);
              }
            }
          } catch (error) {
            console.warn('Error parsing WebSocket message:', error);
          }
        };

        ws.onclose = (event) => {
          console.log('WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
          setWsConnected(false);
          clearTimeout(connectionTimeout);
          
          // Only attempt reconnection if it wasn't a manual close
          if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(baseReconnectDelay * Math.pow(2, reconnectAttempts), 30000);
            console.log(`Attempting reconnection ${reconnectAttempts}/${maxReconnectAttempts} in ${delay}ms`);
            
            reconnectTimeout = setTimeout(connectWebSocket, delay);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error occurred:', error);
          setWsConnected(false);
          clearTimeout(connectionTimeout);
        };

      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        setWsConnected(false);
        
        // Retry with exponential backoff if under max attempts
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          const delay = Math.min(baseReconnectDelay * Math.pow(2, reconnectAttempts), 30000);
          reconnectTimeout = setTimeout(connectWebSocket, delay);
        }
      }
    };

    // Only attempt WebSocket connection if backend is available
    const shouldConnectWebSocket = process.env.REACT_APP_ENABLE_WEBSOCKET !== 'false';
    
    if (shouldConnectWebSocket) {
      connectWebSocket();
    } else {
      console.log('WebSocket disabled by configuration');
      setWsConnected(false);
    }

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Component unmounting');
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  // Fallback polling when WebSocket is not connected
  useEffect(() => {
    let pollingInterval = null;

    if (!wsConnected) {
      // Poll for new notifications every 30 seconds when WebSocket is down
      pollingInterval = setInterval(() => {
        fetchNotifications();
        fetchNotificationCounts();
      }, 30000);
    }

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [wsConnected]);

  // Show browser notification for urgent alerts
  const showBrowserNotification = notification => {
    if (Notification.permission === 'granted') {
      try {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: `notification-${notification.id}`,
        });
      } catch (error) {
        console.warn('Error showing browser notification:', error);
      }
    }
  };

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(error => {
        console.warn('Error requesting notification permission:', error);
      });
    }
  }, []);

  // FIXED: Fetch notifications with proper API usage and error handling
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = {};
      if (filters.type) params.type = filters.type;
      if (filters.priority) params.priority = filters.priority;
      if (filters.is_read !== '') params.is_read = filters.is_read;

      let response;
      if (activeTab === 'admin') {
        response = await notificationsAPI.admin.getAllNotifications(params);
      } else {
        response = await notificationsAPI.getNotifications(params);
      }

      // Handle different response structures
      let notificationsData;
      if (response && typeof response === 'object') {
        notificationsData = response.results || response.data || response || [];
      } else {
        notificationsData = [];
      }

      setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      
      // If it's a network error and WebSocket is also down, show user feedback
      if (!wsConnected && (error.code === 'NETWORK_ERROR' || error.message.includes('fetch'))) {
        console.warn('Both WebSocket and HTTP requests failing. Check backend connection.');
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters, wsConnected]);

  // FIXED: Fetch notification counts with proper error handling
  const fetchNotificationCounts = async () => {
    try {
      const countsData = await notificationsAPI.getUnreadCount();
      
      // Ensure counts data has the expected structure
      const validCounts = {
        total_count: countsData?.total_count || 0,
        unread_count: countsData?.unread_count || 0,
        type_counts: countsData?.type_counts || {},
      };
      
      setCounts(validCounts);
    } catch (error) {
      console.error('Error fetching notification counts:', error);
      // Keep existing counts on error to avoid UI flashing
      setCounts(prev => ({
        total_count: prev.total_count || 0,
        unread_count: prev.unread_count || 0,
        type_counts: prev.type_counts || {},
      }));
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchNotificationCounts();
  }, [fetchNotifications]);

  // FIXED: Mark all as read with proper error handling
  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ 
          ...notif, 
          is_read: true, 
          read_at: new Date().toISOString() 
        }))
      );
      
      // Refresh counts
      await fetchNotificationCounts();
    } catch (error) {
      console.error('Error marking all as read:', error);
      // Could add toast notification here for user feedback
    }
  };

  // FIXED: Mark selected as read with proper error handling
  const markSelectedAsRead = async notificationIds => {
    try {
      // Ensure notificationIds is an array
      const idsArray = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
      
      await notificationsAPI.markAsRead(idsArray);
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          idsArray.includes(notif.id)
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
      
      // Refresh counts
      await fetchNotificationCounts();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      // Could add toast notification here for user feedback
    }
  };

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'cod') {
      return notification.notification_type === 'cod_order';
    }
    if (activeTab === 'unread') {
      return !notification.is_read;
    }
    if (activeTab === 'admin') {
      const adminTypes = [
        'order_created',
        'cod_order',
        'payment_received',
        'flash_sale_started',
        'low_stock',
        'system_alert',
      ];
      return adminTypes.includes(notification.notification_type);
    }
    return true;
  });

  const tabs = [
    { id: 'all', label: 'All', count: counts.total_count },
    { id: 'unread', label: 'Unread', count: counts.unread_count },
    { id: 'cod', label: 'COD Orders', count: counts.type_counts.cod_order || 0 },
    {
      id: 'admin',
      label: 'Admin Alerts',
      count: Object.values(counts.type_counts).reduce((a, b) => a + b, 0),
    },
  ];

  return (
    <div className="notification-center">
      {/* Header */}
      <div className="notification-header">
        <div className="header-left">
          <div className="header-title">
            <Bell className="header-icon" size={24} />
            <h2>Notification Center</h2>
            <div className={`connection-status ${wsConnected ? 'connected' : 'disconnected'}`}>
              <div className="status-dot" />
              <span>{wsConnected ? 'Live' : 'Polling'}</span>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <button
            onClick={markAllAsRead}
            className="action-btn mark-read-btn"
            disabled={counts.unread_count === 0 || loading}
          >
            <CheckCircle size={16} />
            Mark All Read ({counts.unread_count})
          </button>

          <button className="action-btn settings-btn">
            <Settings size={16} />
            Settings
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="notification-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-label">{tab.label}</span>
            {tab.count > 0 && (
              <span className={`tab-count ${tab.id === 'cod' ? 'urgent' : ''}`}>{tab.count}</span>
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
          >
            <option value="">All Status</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </select>
        </div>
      </div>

      {/* COD Notifications - Special Section */}
      {activeTab === 'cod' && <CODNotifications notifications={filteredNotifications} />}

      {/* Notifications List */}
      <div className="notifications-container">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <Bell className="empty-icon" size={48} />
            <h3>No notifications</h3>
            <p>You're all caught up! No {activeTab} notifications at the moment.</p>
          </div>
        ) : (
          <div className="notifications-list">
            {filteredNotifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markSelectedAsRead}
                onUpdate={fetchNotifications}
              />
            ))}
          </div>
        )}
      </div>

      {/* Load More Button */}
      {!loading && filteredNotifications.length > 0 && (
        <div className="load-more-container">
          <button className="load-more-btn">Load More Notifications</button>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;