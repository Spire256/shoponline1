// src/services/websocket/notificationSocket.js
import { websocketService } from './websocketService';
import { authService } from '../auth/authService';

/**
 * Notification Socket Service
 * Handles real-time notifications via WebSocket
 */
class NotificationSocketService {
  constructor() {
    this.endpoint = '/notifications/';
    this.isConnected = false;
    this.notifications = [];
    this.unreadCount = 0;

    // Notification callbacks
    this.callbacks = {
      onNotification: [],
      onUnreadCountUpdate: [],
      onConnectionChange: [],
    };

    // Auto-connect when user is authenticated
    this.initializeConnection();
  }

  /**
   * Initialize notification connection
   */
  async initializeConnection() {
    if (authService.isAuthenticated()) {
      await this.connect();
    }

    // Listen for authentication changes
    window.addEventListener('userLoggedOut', () => {
      this.disconnect();
    });

    window.addEventListener('userDataUpdated', () => {
      if (authService.isAuthenticated() && !this.isConnected) {
        this.connect();
      }
    });
  }

  /**
   * Connect to notification WebSocket
   * @returns {Promise<boolean>} Connection success status
   */
  async connect() {
    try {
      if (this.isConnected) {
        return true;
      }

      const user = authService.getCurrentUserFromStorage();
      if (!user) {
        console.warn('Cannot connect to notifications: User not authenticated');
        return false;
      }

      await websocketService.connect(this.endpoint, {
        userId: user.id,
        onOpen: () => {
          this.isConnected = true;
          console.log('Notification WebSocket connected');
          this.notifyConnectionChange(true);

          // Request initial notification count
          this.requestNotificationCount();
        },
        onClose: () => {
          this.isConnected = false;
          console.log('Notification WebSocket disconnected');
          this.notifyConnectionChange(false);
        },
        onMessage: data => {
          this.handleNotificationMessage(data);
        },
        onError: error => {
          console.error('Notification WebSocket error:', error);
          this.isConnected = false;
          this.notifyConnectionChange(false);
        },
      });

      // Set up WebSocket event listeners
      this.setupEventListeners();

      return true;
    } catch (error) {
      console.error('Failed to connect to notification WebSocket:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Disconnect from notification WebSocket
   */
  disconnect() {
    if (websocketService.isConnected(this.endpoint)) {
      websocketService.disconnect(this.endpoint);
    }
    this.isConnected = false;
    this.notifications = [];
    this.unreadCount = 0;
    this.notifyConnectionChange(false);
  }

  /**
   * Set up WebSocket event listeners
   */
  setupEventListeners() {
    // Listen for new notifications
    websocketService.on(`${this.endpoint}:notification`, data => {
      this.handleNewNotification(data);
    });

    // Listen for notification count updates
    websocketService.on(`${this.endpoint}:notification_count`, data => {
      this.handleNotificationCount(data);
    });

    // Listen for notification read status updates
    websocketService.on(`${this.endpoint}:notification_read`, data => {
      this.handleNotificationRead(data);
    });

    // Listen for bulk read updates
    websocketService.on(`${this.endpoint}:notifications_read`, data => {
      this.handleBulkNotificationRead(data);
    });
  }

  /**
   * Handle incoming notification message
   * @param {Object} data - Message data
   */
  handleNotificationMessage(data) {
    switch (data.type) {
      case 'new_notification':
        this.handleNewNotification(data.notification);
        break;
      case 'notification_count':
        this.handleNotificationCount(data);
        break;
      case 'notification_read':
        this.handleNotificationRead(data);
        break;
      case 'notifications_read':
        this.handleBulkNotificationRead(data);
        break;
      default:
        console.log('Unknown notification message type:', data.type);
    }
  }

  /**
   * Handle new notification
   * @param {Object} notification - Notification data
   */
  handleNewNotification(notification) {
    // Add to local notifications list
    this.notifications.unshift(notification);

    // Update unread count
    if (!notification.is_read) {
      this.unreadCount++;
      this.notifyUnreadCountUpdate(this.unreadCount);
    }

    // Notify callbacks
    this.notifyNewNotification(notification);

    // Show browser notification if enabled
    this.showBrowserNotification(notification);

    // Play notification sound if enabled
    this.playNotificationSound(notification);
  }

  /**
   * Handle notification count update
   * @param {Object} data - Count data
   */
  handleNotificationCount(data) {
    this.unreadCount = data.unread_count || 0;
    this.notifyUnreadCountUpdate(this.unreadCount);
  }

  /**
   * Handle notification read status update
   * @param {Object} data - Read status data
   */
  handleNotificationRead(data) {
    const notificationId = data.notification_id;

    // Update local notification
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.is_read) {
      notification.is_read = true;
      notification.read_at = new Date().toISOString();
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.notifyUnreadCountUpdate(this.unreadCount);
    }
  }

  /**
   * Handle bulk notification read update
   * @param {Object} data - Bulk read data
   */
  handleBulkNotificationRead(data) {
    const updatedCount = data.updated_count || 0;

    // Update local notifications
    this.notifications.forEach(notification => {
      if (!notification.is_read) {
        notification.is_read = true;
        notification.read_at = new Date().toISOString();
      }
    });

    this.unreadCount = Math.max(0, this.unreadCount - updatedCount);
    this.notifyUnreadCountUpdate(this.unreadCount);
  }

  /**
   * Request notification count from server
   */
  requestNotificationCount() {
    if (websocketService.isConnected(this.endpoint)) {
      websocketService.send(this.endpoint, {
        type: 'get_notification_count',
      });
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   */
  markAsRead(notificationId) {
    if (websocketService.isConnected(this.endpoint)) {
      websocketService.send(this.endpoint, {
        type: 'mark_notification_read',
        notification_id: notificationId,
      });
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead() {
    if (websocketService.isConnected(this.endpoint)) {
      websocketService.send(this.endpoint, {
        type: 'mark_all_notifications_read',
      });
    }
  }

  /**
   * Subscribe to notification type
   * @param {string} notificationType - Type of notification to subscribe to
   */
  subscribe(notificationType) {
    if (websocketService.isConnected(this.endpoint)) {
      websocketService.send(this.endpoint, {
        type: 'subscribe',
        notification_type: notificationType,
      });
    }
  }

  /**
   * Unsubscribe from notification type
   * @param {string} notificationType - Type of notification to unsubscribe from
   */
  unsubscribe(notificationType) {
    if (websocketService.isConnected(this.endpoint)) {
      websocketService.send(this.endpoint, {
        type: 'unsubscribe',
        notification_type: notificationType,
      });
    }
  }

  /**
   * Show browser notification
   * @param {Object} notification - Notification data
   */
  async showBrowserNotification(notification) {
    // Check if browser notifications are enabled
    if (!this.isBrowserNotificationEnabled()) {
      return;
    }

    try {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: this.getNotificationIcon(notification.notification_type),
        tag: `notification_${notification.id}`,
        data: notification,
        requireInteraction: notification.priority === 'high',
      });

      browserNotification.onclick = () => {
        this.handleNotificationClick(notification);
        browserNotification.close();
      };

      // Auto-close after 5 seconds unless high priority
      if (notification.priority !== 'high') {
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }

  /**
   * Check if browser notifications are enabled
   * @returns {boolean} Notification permission status
   */
  isBrowserNotificationEnabled() {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  /**
   * Get notification icon based on type
   * @param {string} type - Notification type
   * @returns {string} Icon URL
   */
  getNotificationIcon(type) {
    const icons = {
      order: '/icons/order-icon.png',
      payment: '/icons/payment-icon.png',
      cod: '/icons/cod-icon.png',
      flash_sale: '/icons/flash-sale-icon.png',
      system: '/icons/system-icon.png',
      promotion: '/icons/promotion-icon.png',
      default: '/favicon.ico',
    };

    return icons[type] || icons.default;
  }

  /**
   * Handle notification click
   * @param {Object} notification - Notification data
   */
  handleNotificationClick(notification) {
    // Mark as read
    this.markAsRead(notification.id);

    // Navigate based on notification type
    const navigation = this.getNotificationNavigation(notification);
    if (navigation) {
      window.focus();
      if (navigation.external) {
        window.open(navigation.url, '_blank');
      } else {
        window.location.href = navigation.url;
      }
    }
  }

  /**
   * Get navigation URL for notification
   * @param {Object} notification - Notification data
   * @returns {Object|null} Navigation information
   */
  getNotificationNavigation(notification) {
    const { notification_type, data } = notification;

    switch (notification_type) {
      case 'order':
        return {
          url: data.order_id ? `/orders/${data.order_id}` : '/orders',
          external: false,
        };
      case 'payment':
        return {
          url: data.payment_id ? `/payments/${data.payment_id}` : '/orders',
          external: false,
        };
      case 'cod':
        if (authService.isAdmin()) {
          return {
            url: data.order_id ? `/admin/orders/${data.order_id}` : '/admin/orders',
            external: false,
          };
        }
        return {
          url: data.order_id ? `/orders/${data.order_id}` : '/orders',
          external: false,
        };
      case 'flash_sale':
        return {
          url: '/flash-sales',
          external: false,
        };
      case 'promotion':
        return {
          url: data.promotion_url || '/products',
          external: false,
        };
      default:
        return null;
    }
  }

  /**
   * Play notification sound
   * @param {Object} notification - Notification data
   */
  playNotificationSound(notification) {
    // Check if sound is enabled (would be from user preferences)
    const soundEnabled = this.isNotificationSoundEnabled();

    if (!soundEnabled) {
      return;
    }

    try {
      const soundFile = this.getNotificationSound(notification.notification_type);
      const audio = new Audio(soundFile);
      audio.volume = 0.5;
      audio.play().catch(error => {
        console.error('Error playing notification sound:', error);
      });
    } catch (error) {
      console.error('Error with notification sound:', error);
    }
  }

  /**
   * Check if notification sound is enabled
   * @returns {boolean} Sound preference status
   */
  isNotificationSoundEnabled() {
    // This would typically check user preferences
    // For now, return a default value
    return localStorage.getItem('notification_sound') !== 'false';
  }

  /**
   * Get notification sound file
   * @param {string} type - Notification type
   * @returns {string} Sound file URL
   */
  getNotificationSound(type) {
    const sounds = {
      order: '/sounds/order-sound.mp3',
      payment: '/sounds/payment-sound.mp3',
      cod: '/sounds/cod-sound.mp3',
      flash_sale: '/sounds/flash-sale-sound.mp3',
      default: '/sounds/default-notification.mp3',
    };

    return sounds[type] || sounds.default;
  }

  /**
   * Add notification callback
   * @param {string} event - Event type ('notification', 'unreadCount', 'connection')
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (this.callbacks[`on${event.charAt(0).toUpperCase() + event.slice(1)}`]) {
      this.callbacks[`on${event.charAt(0).toUpperCase() + event.slice(1)}`].push(callback);
    }
  }

  /**
   * Remove notification callback
   * @param {string} event - Event type
   * @param {Function} callback - Callback function to remove
   */
  off(event, callback) {
    const callbackArray = this.callbacks[`on${event.charAt(0).toUpperCase() + event.slice(1)}`];
    if (callbackArray) {
      const index = callbackArray.indexOf(callback);
      if (index > -1) {
        callbackArray.splice(index, 1);
      }
    }
  }

  /**
   * Notify new notification callbacks
   * @param {Object} notification - Notification data
   */
  notifyNewNotification(notification) {
    this.callbacks.onNotification.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in notification callback:', error);
      }
    });
  }

  /**
   * Notify unread count update callbacks
   * @param {number} count - Unread count
   */
  notifyUnreadCountUpdate(count) {
    this.callbacks.onUnreadCountUpdate.forEach(callback => {
      try {
        callback(count);
      } catch (error) {
        console.error('Error in unread count callback:', error);
      }
    });
  }

  /**
   * Notify connection change callbacks
   * @param {boolean} isConnected - Connection status
   */
  notifyConnectionChange(isConnected) {
    this.callbacks.onConnectionChange.forEach(callback => {
      try {
        callback(isConnected);
      } catch (error) {
        console.error('Error in connection change callback:', error);
      }
    });
  }

  /**
   * Get current notifications
   * @returns {Array} Array of notifications
   */
  getNotifications() {
    return [...this.notifications];
  }

  /**
   * Get unread notification count
   * @returns {number} Unread count
   */
  getUnreadCount() {
    return this.unreadCount;
  }

  /**
   * Get connection status
   * @returns {boolean} Connection status
   */
  getConnectionStatus() {
    return this.isConnected;
  }

  /**
   * Clear all notifications
   */
  clearNotifications() {
    this.notifications = [];
    this.unreadCount = 0;
    this.notifyUnreadCountUpdate(this.unreadCount);
  }

  /**
   * Enable notification preferences
   * @param {Object} preferences - Notification preferences
   */
  setPreferences(preferences) {
    if (preferences.sound !== undefined) {
      localStorage.setItem('notification_sound', preferences.sound.toString());
    }

    if (preferences.browser !== undefined) {
      if (preferences.browser && !this.isBrowserNotificationEnabled()) {
        websocketService.requestNotificationPermission();
      }
    }

    // Send preferences to server if connected
    if (websocketService.isConnected(this.endpoint)) {
      websocketService.send(this.endpoint, {
        type: 'update_preferences',
        preferences: preferences,
      });
    }
  }
}

// Create and export singleton instance
const notificationSocket = new NotificationSocketService();
export { notificationSocket };
