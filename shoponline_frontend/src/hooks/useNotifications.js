// src/hooks/useNotifications.js
import { useContext, useCallback, useMemo } from 'react';
import NotificationContext from '../contexts/NotificationContext';
import { useWebSocket } from './useWebSocket';
import { useAuth } from './useAuth';

/**
 * Custom hook for notifications functionality
 * Provides access to notifications state and methods with real-time updates
 */
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  const { isAuthenticated, isAdmin } = useAuth();

  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }

  const {
    notifications,
    unreadCount,
    totalCount,
    typeCounts,
    isLoading,
    error,
    settings,
    loadNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    requestNotificationPermission,
    updateSettings,
    clearError,
    getNotificationsByType,
    getUnreadNotifications,
    getNotificationsByPriority,
    getRecentNotifications,
  } = context;

  // Set up WebSocket for real-time notifications
  const { connectionState: wsConnectionState } = useWebSocket('/ws/notifications/', {
    onMessage: data => {
      if (data.type === 'notification') {
        addNotification(data.payload);

        // Play sound for high priority notifications
        if (data.payload.priority === 'high' || data.payload.priority === 'critical') {
          playNotificationSound();
        }

        // Show browser notification
        if (settings.desktopEnabled) {
          showBrowserNotification(data.payload);
        }
      }
    },
    shouldConnect: isAuthenticated,
  });

  // Enhanced load notifications with filters
  const loadNotificationsWithFilters = useCallback(
    async (filters = {}) => {
      const params = {
        limit: filters.limit || 20,
        offset: filters.offset || 0,
        is_read: filters.isRead,
        type: filters.type,
        priority: filters.priority,
        ...filters,
      };

      return loadNotifications(params);
    },
    [loadNotifications]
  );

  // Mark single notification as read
  const markSingleAsRead = useCallback(
    async notificationId => {
      return markAsRead([notificationId]);
    },
    [markAsRead]
  );

  // Mark multiple notifications as read
  const markMultipleAsRead = useCallback(
    async notificationIds => {
      return markAsRead(notificationIds);
    },
    [markAsRead]
  );

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (!settings.soundEnabled) return;

    try {
      const audio = new Audio('/assets/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(console.error);
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }, [settings.soundEnabled]);

  // Show browser notification
  const showBrowserNotification = useCallback(
    notification => {
      if (!settings.desktopEnabled) return;

      if ('Notification' in window && Notification.permission === 'granted') {
        const browserNotification = new Notification(notification.title, {
          body: notification.message,
          icon: '/assets/icons/logo-192.png',
          tag: notification.id,
          requireInteraction: notification.priority === 'critical',
        });

        // Auto close after 5 seconds for non-critical notifications
        if (notification.priority !== 'critical') {
          setTimeout(() => browserNotification.close(), 5000);
        }

        // Handle click
        browserNotification.onclick = () => {
          window.focus();
          markSingleAsRead(notification.id);
          browserNotification.close();
        };
      }
    },
    [settings.desktopEnabled, markSingleAsRead]
  );

  // Create local notification (for in-app display)
  const showLocalNotification = useCallback(
    notification => {
      const localNotification = {
        id: Date.now(),
        title: notification.title,
        message: notification.message,
        type: notification.type || 'info',
        priority: notification.priority || 'medium',
        autoClose: notification.autoClose !== false,
        duration: notification.duration || 5000,
      };

      addNotification(localNotification);
      return localNotification.id;
    },
    [addNotification]
  );

  // Create success notification
  const showSuccess = useCallback(
    (title, message, options = {}) => {
      return showLocalNotification({
        title,
        message,
        type: 'success',
        priority: 'medium',
        ...options,
      });
    },
    [showLocalNotification]
  );

  // Create error notification
  const showError = useCallback(
    (title, message, options = {}) => {
      return showLocalNotification({
        title,
        message,
        type: 'error',
        priority: 'high',
        autoClose: false,
        ...options,
      });
    },
    [showLocalNotification]
  );

  // Create warning notification
  const showWarning = useCallback(
    (title, message, options = {}) => {
      return showLocalNotification({
        title,
        message,
        type: 'warning',
        priority: 'medium',
        ...options,
      });
    },
    [showLocalNotification]
  );

  // Create info notification
  const showInfo = useCallback(
    (title, message, options = {}) => {
      return showLocalNotification({
        title,
        message,
        type: 'info',
        priority: 'low',
        ...options,
      });
    },
    [showLocalNotification]
  );

  // Get notifications grouped by type
  const getGroupedNotifications = useMemo(() => {
    const grouped = {};

    notifications.forEach(notification => {
      const type = notification.notification_type || 'general';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(notification);
    });

    return grouped;
  }, [notifications]);

  // Get high priority unread notifications
  const getHighPriorityNotifications = useCallback(() => {
    return notifications.filter(
      notification =>
        !notification.is_read &&
        (notification.priority === 'high' || notification.priority === 'critical')
    );
  }, [notifications]);

  // Get COD order notifications (for admins)
  const getCODNotifications = useCallback(() => {
    if (!isAdmin()) return [];

    return getNotificationsByType('cod_order').filter(notification => !notification.is_read);
  }, [getNotificationsByType, isAdmin]);

  // Get order notifications
  const getOrderNotifications = useCallback(() => {
    return getNotificationsByType('order_created').concat(getNotificationsByType('order_updated'));
  }, [getNotificationsByType]);

  // Get flash sale notifications
  const getFlashSaleNotifications = useCallback(() => {
    return getNotificationsByType('flash_sale_started').concat(
      getNotificationsByType('flash_sale_ending')
    );
  }, [getNotificationsByType]);

  // Check if user has unread critical notifications
  const hasCriticalNotifications = useMemo(() => {
    return notifications.some(
      notification => !notification.is_read && notification.priority === 'critical'
    );
  }, [notifications]);

  // Get notification badge count (for UI display)
  const getBadgeCount = useCallback(
    (maxDisplay = 99) => {
      if (unreadCount === 0) return '';
      if (unreadCount > maxDisplay) return `${maxDisplay}+`;
      return unreadCount.toString();
    },
    [unreadCount]
  );

  // Update notification settings with validation
  const updateNotificationSettings = useCallback(
    async newSettings => {
      try {
        // Validate settings
        if (newSettings.desktopEnabled && Notification.permission !== 'granted') {
          const granted = await requestNotificationPermission();
          if (!granted) {
            newSettings.desktopEnabled = false;
          }
        }

        const result = await updateSettings(newSettings);

        if (result.success) {
          showSuccess('Settings Updated', 'Notification settings have been saved');
        }

        return result;
      } catch (error) {
        showError('Settings Error', 'Failed to update notification settings');
        return { success: false, error: error.message };
      }
    },
    [updateSettings, requestNotificationPermission, showSuccess, showError]
  );

  // Auto-mark notifications as read after viewing
  const autoMarkAsRead = useCallback(
    (notificationId, delay = 3000) => {
      setTimeout(() => {
        const notification = notifications.find(n => n.id === notificationId);
        if (notification && !notification.is_read) {
          markSingleAsRead(notificationId);
        }
      }, delay);
    },
    [notifications, markSingleAsRead]
  );

  return {
    // State
    notifications,
    unreadCount,
    totalCount,
    typeCounts,
    isLoading,
    error,
    settings,

    // Connection status
    wsConnectionState,
    isConnected: wsConnectionState === 'Connected',

    // Basic actions
    loadNotifications: loadNotificationsWithFilters,
    markAsRead: markSingleAsRead,
    markMultipleAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    clearError,

    // Notification creation
    showLocalNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,

    // Filtering and grouping
    getGroupedNotifications,
    getNotificationsByType,
    getUnreadNotifications,
    getNotificationsByPriority,
    getRecentNotifications,
    getHighPriorityNotifications,
    getCODNotifications,
    getOrderNotifications,
    getFlashSaleNotifications,

    // Status checks
    hasCriticalNotifications,
    hasUnreadNotifications: unreadCount > 0,

    // UI utilities
    getBadgeCount,
    autoMarkAsRead,

    // Settings management
    updateSettings: updateNotificationSettings,
    requestNotificationPermission,
  };
};

/**
 * Hook for admin-specific notifications
 */
export const useAdminNotifications = () => {
  const { isAdmin } = useAuth();
  const notifications = useNotifications();

  if (!isAdmin()) {
    throw new Error('useAdminNotifications can only be used by admin users');
  }

  // Get admin-specific notification types
  const getAdminNotifications = useCallback(() => {
    const adminTypes = [
      'order_created',
      'cod_order',
      'payment_received',
      'admin_invitation',
      'flash_sale_started',
      'low_stock',
      'system_alert',
    ];

    return notifications.notifications.filter(notification =>
      adminTypes.includes(notification.notification_type)
    );
  }, [notifications.notifications]);

  // Get urgent admin notifications
  const getUrgentNotifications = useCallback(() => {
    return notifications
      .getHighPriorityNotifications()
      .filter(notification =>
        ['cod_order', 'system_alert', 'low_stock'].includes(notification.notification_type)
      );
  }, [notifications]);

  return {
    ...notifications,
    adminNotifications: getAdminNotifications(),
    urgentNotifications: getUrgentNotifications(),
    urgentCount: getUrgentNotifications().length,
  };
};

export default useNotifications;
