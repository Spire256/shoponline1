import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertCircle,
  Phone,
  User,
  CreditCard,
  Clock,
  CheckCircle2,
  X,
  RefreshCw,
  Filter,
  Eye,
  MoreVertical,
} from 'lucide-react';

const CODNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unread, today
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock data for demonstration since localStorage is not available
  const mockNotifications = [
    {
      id: 1,
      title: "New COD Order Received",
      message: "A new cash on delivery order has been placed and requires immediate attention.",
      priority: "high",
      is_read: false,
      created_at: new Date().toISOString(),
      time_ago: "2 minutes ago",
      data: {
        order_number: "ORD-2025-001",
        customer_name: "John Doe",
        customer_phone: "+256700123456",
        total_amount: "150000",
        order_id: "123"
      }
    },
    {
      id: 2,
      title: "COD Payment Pending",
      message: "Customer has received the order but payment is still pending verification.",
      priority: "medium",
      is_read: true,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      read_at: new Date().toISOString(),
      time_ago: "1 hour ago",
      data: {
        order_number: "ORD-2025-002",
        customer_name: "Jane Smith",
        customer_phone: "+256700654321",
        total_amount: "89000",
        order_id: "124"
      }
    }
  ];

  // Fetch COD notifications
  const fetchCODNotifications = async () => {
    try {
      setLoading(true);
      // Simulate API call with mock data since localStorage is not available
      setTimeout(() => {
        setNotifications(mockNotifications);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Filter notifications based on selected filter
  useEffect(() => {
    let filtered = notifications;

    switch (filter) {
      case 'unread':
        filtered = notifications.filter(n => !n.is_read);
        break;
      case 'today':
        const today = new Date().toDateString();
        filtered = notifications.filter(n =>
          new Date(n.created_at).toDateString() === today
        );
        break;
      default:
        filtered = notifications;
    }

    setFilteredNotifications(filtered);
  }, [notifications, filter]);

  // Mark notification as read
  const markAsRead = async notificationIds => {
    try {
      // Simulate API call - in real implementation, this would use localStorage token
      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notificationIds.includes(notification.id)
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification
        )
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  // Handle notification click
  const handleNotificationClick = notification => {
    setSelectedNotification(notification);
    setIsModalOpen(true);

    if (!notification.is_read) {
      markAsRead([notification.id]);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      // Simulate API call - in real implementation, this would use localStorage token
      setNotifications(prev =>
        prev.map(notification => ({
          ...notification,
          is_read: true,
          read_at: new Date().toISOString()
        }))
      );
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Get priority color
  const getPriorityColor = priority => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  useEffect(() => {
    fetchCODNotifications();

    // Set up WebSocket connection for real-time updates
    const setupWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/notifications/`;

      try {
        const ws = new WebSocket(wsUrl);

        ws.onmessage = event => {
          const data = JSON.parse(event.data);

          // Fixed the syntax error by adding proper if condition
          if (
            data.type === 'cod_alert' ||
            (data.type === 'notification' && data.data.notification_type === 'cod_order')
          ) {
            // Add new COD notification to the top of the list
            setNotifications(prev => [data.data, ...prev]);

            // Show browser notification if supported
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('New COD Order!', {
                body: data.data.message || `Order #${data.data.order_number}`,
                icon: '/favicon.ico',
                tag: `cod-${data.data.id}`,
              });
            }
          }
        };

        return () => ws.close();
      } catch (error) {
        console.error('WebSocket connection failed:', error);
        return () => {}; // Return empty cleanup function if WebSocket fails
      }
    };

    const cleanup = setupWebSocket();
    return cleanup;
  }, []);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <CreditCard className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">COD Notifications</h1>
            <p className="text-gray-600">Cash on Delivery order alerts</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Mark all as read
            </button>
          )}
          <button
            onClick={fetchCODNotifications}
            disabled={loading}
            className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total COD Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
            </div>
            <Bell className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unread</p>
              <p className="text-2xl font-bold text-orange-600">{unreadCount}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's COD Orders</p>
              <p className="text-2xl font-bold text-green-600">
                {
                  notifications.filter(
                    n => new Date(n.created_at).toDateString() === new Date().toDateString()
                  ).length
                }
              </p>
            </div>
            <Clock className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'unread', label: 'Unread' },
              { key: 'today', label: 'Today' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  filter === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-gray-200">
        {loading && (
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading notifications...</span>
          </div>
        )}

        {error && (
          <div className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchCODNotifications}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && filteredNotifications.length === 0 && (
          <div className="p-8 text-center">
            <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No COD notifications</h3>
            <p className="text-gray-600">
              {filter === 'unread'
                ? 'All COD notifications have been read.'
                : filter === 'today' ? 'No COD orders received today.' :
                  'No COD notifications received yet.'}
            </p>
          </div>
        )}

        {!loading && !error && filteredNotifications.length > 0 && (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map(notification => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full" />
                      )}
                      <span
                        className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(
                          notification.priority
                        )}`}
                      >
                        {notification.priority?.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-gray-700 mb-3">{notification.message}</p>

                    {notification.data && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {notification.data.order_number && (
                          <div className="flex items-center space-x-1">
                            <span className="text-gray-500">Order:</span>
                            <span className="font-medium">#{notification.data.order_number}</span>
                          </div>
                        )}
                        {notification.data.customer_name && (
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">{notification.data.customer_name}</span>
                          </div>
                        )}
                        {notification.data.customer_phone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">
                              {notification.data.customer_phone}
                            </span>
                          </div>
                        )}
                        {notification.data.total_amount && (
                          <div className="flex items-center space-x-1">
                            <span className="text-gray-500">Amount:</span>
                            <span className="font-bold text-green-600">
                              UGX {parseFloat(notification.data.total_amount).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-500 mb-2">{notification.time_ago}</p>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notification Detail Modal */}
      {isModalOpen && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">COD Order Details</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{selectedNotification.title}</h3>
                  <p className="text-gray-700">{selectedNotification.message}</p>
                </div>

                {selectedNotification.data && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    {Object.entries(selectedNotification.data).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 capitalize">
                          {key.replace(/_/g, ' ')}:
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {key === 'total_amount'
                            ? `UGX ${parseFloat(value).toLocaleString()}`
                            : value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>
                    Received: {new Date(selectedNotification.created_at).toLocaleString()}
                  </span>
                  {selectedNotification.is_read && selectedNotification.read_at && (
                    <span>Read: {new Date(selectedNotification.read_at).toLocaleString()}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Handle view order action - opens in new tab
                  window.open(`/admin/orders/${selectedNotification.data?.order_id}`, '_blank');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>View Order</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CODNotifications;