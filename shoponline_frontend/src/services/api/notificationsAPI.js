// src/services/api/notificationsAPI.js - FIXED VERSION
import apiClient, { handleApiResponse, handleApiError, buildQueryString } from './apiClient';

const notificationsAPI = {
  // FIXED: Get user notifications with proper error handling
  getNotifications: async (params = {}) => {
    try {
      const queryString = buildQueryString(params);
      const url = queryString ? `/notifications/?${queryString}` : '/notifications/';
      const response = await apiClient.get(url);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Return empty structure to prevent UI crashes
      return { results: [], count: 0 };
    }
  },

  // Get single notification
  getNotification: async notificationId => {
    try {
      const response = await apiClient.get(`/notifications/${notificationId}/`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error fetching notification ${notificationId}:`, error);
      throw handleApiError(error);
    }
  },

  // FIXED: Get unread notifications count with proper error handling
  getUnreadCount: async () => {
    try {
      const response = await apiClient.get('/notifications/counts/');
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching notification counts:', error);
      // Return default counts structure to prevent UI crashes
      return {
        total_count: 0,
        unread_count: 0,
        type_counts: {}
      };
    }
  },

  // Mark notifications as read
  markAsRead: async notificationIds => {
    try {
      const response = await apiClient.post('/notifications/mark-as-read/', {
        notification_ids: Array.isArray(notificationIds) ? notificationIds : [notificationIds],
      });
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw handleApiError(error);
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const response = await apiClient.post('/notifications/mark-all-read/');
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw handleApiError(error);
    }
  },

  // Delete notification
  deleteNotification: async notificationId => {
    try {
      const response = await apiClient.delete(`/notifications/${notificationId}/`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error deleting notification ${notificationId}:`, error);
      throw handleApiError(error);
    }
  },

  // Delete multiple notifications
  deleteNotifications: async notificationIds => {
    try {
      const response = await apiClient.post('/notifications/bulk-delete/', {
        notification_ids: notificationIds,
      });
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error deleting notifications:', error);
      throw handleApiError(error);
    }
  },

  // Get notification settings
  getNotificationSettings: async () => {
    try {
      const response = await apiClient.get('/notifications/settings/');
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      throw handleApiError(error);
    }
  },

  // Update notification settings
  updateNotificationSettings: async settings => {
    try {
      const response = await apiClient.patch('/notifications/settings/', settings);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw handleApiError(error);
    }
  },

  // Admin notifications
  admin: {
    // FIXED: Get all notifications (admin view) with proper error handling
    getAllNotifications: async (params = {}) => {
      try {
        const queryString = buildQueryString(params);
        const url = queryString ? `/notifications/admin/?${queryString}` : '/notifications/admin/';
        const response = await apiClient.get(url);
        return handleApiResponse(response);
      } catch (error) {
        console.error('Error fetching admin notifications:', error);
        // Return empty structure to prevent UI crashes
        return { results: [], count: 0 };
      }
    },

    // Send test notification
    sendTestNotification: async testData => {
      try {
        const response = await apiClient.post('/notifications/admin/test-notification/', testData);
        return handleApiResponse(response);
      } catch (error) {
        console.error('Error sending test notification:', error);
        throw handleApiError(error);
      }
    },

    // Broadcast notification to all users
    broadcastNotification: async notificationData => {
      try {
        const response = await apiClient.post('/notifications/admin/broadcast/', notificationData);
        return handleApiResponse(response);
      } catch (error) {
        console.error('Error broadcasting notification:', error);
        throw handleApiError(error);
      }
    },

    // Send notification to specific users
    sendToUsers: async (userIds, notificationData) => {
      try {
        const response = await apiClient.post('/notifications/admin/send-to-users/', {
          user_ids: userIds,
          ...notificationData,
        });
        return handleApiResponse(response);
      } catch (error) {
        console.error('Error sending notification to users:', error);
        throw handleApiError(error);
      }
    },
  },

  // Utility functions - FIXED: Better null checking
  formatNotificationData: notification => {
    if (!notification) return null;
    
    return {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.notification_type,
      priority: notification.priority,
      method: notification.method,
      data: notification.data || {},
      isRead: notification.is_read,
      readAt: notification.read_at ? new Date(notification.read_at) : null,
      createdAt: new Date(notification.created_at),
      timeAgo: notification.time_ago,
      relatedObject: notification.content_object,
    };
  },

  getNotificationIcon: type => {
    const icons = {
      order_created: '🛍️',
      order_updated: '📦',
      cod_order: '💰',
      payment_received: '💳',
      admin_invitation: '👤',
      flash_sale_started: '⚡',
      flash_sale_ending: '⏰',
      low_stock: '📉',
      system_alert: '⚠️',
    };
    return icons[type] || '🔔';
  },

  getNotificationColor: priority => {
    const colors = {
      low: 'gray',
      medium: 'blue',
      high: 'orange',
      critical: 'red',
    };
    return colors[priority] || 'gray';
  },

  getPriorityIcon: priority => {
    const icons = {
      low: '📘',
      medium: '📙',
      high: '📕',
      critical: '🚨',
    };
    return icons[priority] || '📔';
  },

  // FIXED: Group notifications by date with proper error handling
  groupNotificationsByDate: notifications => {
    if (!notifications || !Array.isArray(notifications)) {
      return {};
    }
    
    const groups = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    notifications.forEach(notification => {
      try {
        const notificationDate = new Date(notification.created_at);
        const notificationDateOnly = new Date(
          notificationDate.getFullYear(),
          notificationDate.getMonth(),
          notificationDate.getDate()
        );

        let groupKey;
        if (notificationDateOnly.getTime() === today.getTime()) {
          groupKey = 'Today';
        } else if (notificationDateOnly.getTime() === yesterday.getTime()) {
          groupKey = 'Yesterday';
        } else {
          groupKey = notificationDateOnly.toLocaleDateString('en-UG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        }

        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(notification);
      } catch (error) {
        console.warn('Error grouping notification:', error);
      }
    });

    return groups;
  },

  filterNotificationsByType: (notifications, types) => {
    if (!notifications || !Array.isArray(notifications)) return [];
    if (!types || types.length === 0) return notifications;
    return notifications.filter(notification => types.includes(notification.notification_type));
  },

  filterNotificationsByPriority: (notifications, priorities) => {
    if (!notifications || !Array.isArray(notifications)) return [];
    if (!priorities || priorities.length === 0) return notifications;
    return notifications.filter(notification => priorities.includes(notification.priority));
  },

  sortNotifications: (notifications, sortBy = 'created_at', order = 'desc') => {
    if (!notifications || !Array.isArray(notifications)) return [];
    
    return [...notifications].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority] || 0;
          bValue = priorityOrder[b.priority] || 0;
          break;
        case 'read_status':
          aValue = a.is_read ? 1 : 0;
          bValue = b.is_read ? 1 : 0;
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }

      if (order === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  },

  getUnreadNotifications: notifications => {
    if (!notifications || !Array.isArray(notifications)) return [];
    return notifications.filter(notification => !notification.is_read);
  },

  getHighPriorityNotifications: notifications => {
    if (!notifications || !Array.isArray(notifications)) return [];
    return notifications.filter(notification =>
      ['high', 'critical'].includes(notification.priority)
    );
  },

  markNotificationAsRead: notification => {
    if (!notification || notification.is_read) {
      return Promise.resolve(notification);
    }
    return notificationsAPI.markAsRead(notification.id);
  },

  validateNotificationSettings: settings => {
    const errors = {};

    if (settings.sms_enabled && !settings.sms_phone_number) {
      errors.sms_phone_number = 'Phone number is required when SMS notifications are enabled';
    }

    if (
      settings.sms_phone_number &&
      !notificationsAPI.validatePhoneNumber(settings.sms_phone_number)
    ) {
      errors.sms_phone_number = 'Please enter a valid phone number';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  validatePhoneNumber: phoneNumber => {
    const ugandanPatterns = [/^\+256[0-9]{9}$/, /^256[0-9]{9}$/, /^0[0-9]{9}$/];
    return ugandanPatterns.some(pattern => pattern.test(phoneNumber));
  },

  formatTimeAgo: date => {
    try {
      const now = new Date();
      const notificationDate = new Date(date);
      const diffInSeconds = Math.floor((now - notificationDate) / 1000);

      if (diffInSeconds < 60) {
        return 'Just now';
      }

      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
      }

      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
      }

      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
      }

      return notificationDate.toLocaleDateString('en-UG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.warn('Error formatting time ago:', error);
      return 'Some time ago';
    }
  },

  shouldShowDesktopNotification: (notification, settings) => {
    // Check if desktop notification should be shown
    if (!settings || !settings.in_app_enabled) return false;
    if (notification.priority === 'critical') return true;
    if (notification.priority === 'high' && settings.high_priority_desktop) return true;
    return settings.desktop_enabled || false;
  },

  createDesktopNotification: notification => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const options = {
          body: notification.message,
          icon: '/favicon.ico',
          badge: '/badge-icon.png',
          tag: notification.id,
          requireInteraction: notification.priority === 'critical',
        };

        const desktopNotification = new Notification(notification.title, options);

        desktopNotification.onclick = () => {
          window.focus();
          desktopNotification.close();
          // Navigate to related page if applicable
        };

        return desktopNotification;
      } catch (error) {
        console.warn('Error creating desktop notification:', error);
        return null;
      }
    }
    return null;
  },

  requestNotificationPermission: async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      } catch (error) {
        console.warn('Error requesting notification permission:', error);
        return false;
      }
    }
    return Notification.permission === 'granted';
  },
};

export default notificationsAPI;