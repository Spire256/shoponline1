// src/contexts/NotificationContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Notification action types
const NOTIFICATION_ACTIONS = {
  LOAD_NOTIFICATIONS: 'LOAD_NOTIFICATIONS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  UPDATE_NOTIFICATION: 'UPDATE_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  MARK_AS_READ: 'MARK_AS_READ',
  MARK_ALL_AS_READ: 'MARK_ALL_AS_READ',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  UPDATE_COUNTS: 'UPDATE_COUNTS',
  CLEAR_NOTIFICATIONS: 'CLEAR_NOTIFICATIONS',
};

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  totalCount: 0,
  typeCounts: {},
  isLoading: true,
  error: null,
  settings: {
    soundEnabled: true,
    desktopEnabled: true,
    emailEnabled: true,
    position: 'top-right',
  },
};

// Notification reducer
const notificationReducer = (state, action) => {
  switch (action.type) {
    case NOTIFICATION_ACTIONS.LOAD_NOTIFICATIONS:
      return {
        ...state,
        notifications: action.payload.notifications,
        unreadCount: action.payload.unreadCount || 0,
        totalCount: action.payload.totalCount || 0,
        typeCounts: action.payload.typeCounts || {},
        isLoading: false,
        error: null,
      };

    case NOTIFICATION_ACTIONS.ADD_NOTIFICATION: {
      const newNotification = {
        id: action.payload.id || Date.now(),
        ...action.payload,
        createdAt: new Date().toISOString(),
        isRead: false,
      };

      return {
        ...state,
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
        totalCount: state.totalCount + 1,
        error: null,
      };
    }

    case NOTIFICATION_ACTIONS.UPDATE_NOTIFICATION: {
      const updatedNotifications = state.notifications.map(notification =>
        notification.id === action.payload.id
          ? { ...notification, ...action.payload.updates }
          : notification
      );

      return {
        ...state,
        notifications: updatedNotifications,
        error: null,
      };
    }

    case NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION: {
      const filteredNotifications = state.notifications.filter(
        notification => notification.id !== action.payload.id
      );

      const removedNotification = state.notifications.find(
        notification => notification.id === action.payload.id
      );

      return {
        ...state,
        notifications: filteredNotifications,
        unreadCount:
          removedNotification && !removedNotification.isRead
            ? state.unreadCount - 1
            : state.unreadCount,
        totalCount: state.totalCount - 1,
        error: null,
      };
    }

    case NOTIFICATION_ACTIONS.MARK_AS_READ: {
      const updatedNotifications = state.notifications.map(notification =>
        action.payload.includes(notification.id) && !notification.isRead
          ? { ...notification, isRead: true, readAt: new Date().toISOString() }
          : notification
      );

      const markedCount = action.payload.filter(id => {
        const notification = state.notifications.find(n => n.id === id);
        return notification && !notification.isRead;
      }).length;

      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: Math.max(0, state.unreadCount - markedCount),
        error: null,
      };
    }

    case NOTIFICATION_ACTIONS.MARK_ALL_AS_READ: {
      const updatedNotifications = state.notifications.map(notification =>
        !notification.isRead
          ? { ...notification, isRead: true, readAt: new Date().toISOString() }
          : notification
      );

      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: 0,
        error: null,
      };
    }

    case NOTIFICATION_ACTIONS.UPDATE_COUNTS:
      return {
        ...state,
        unreadCount: action.payload.unreadCount || 0,
        totalCount: action.payload.totalCount || 0,
        typeCounts: action.payload.typeCounts || {},
      };

    case NOTIFICATION_ACTIONS.CLEAR_NOTIFICATIONS:
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
        totalCount: 0,
        typeCounts: {},
      };

    case NOTIFICATION_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case NOTIFICATION_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    default:
      return state;
  }
};

// Create context
const NotificationContext = createContext();

// Notification provider component
export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
    loadNotificationCounts();
  }, []);

  // Load notifications from API
  const loadNotifications = async (params = {}) => {
    dispatch({ type: NOTIFICATION_ACTIONS.SET_LOADING, payload: true });

    try {
      const queryParams = new URLSearchParams({
        limit: params.limit || '20',
        ...params,
      });

      const response = await fetch(`/api/notifications/?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({
          type: NOTIFICATION_ACTIONS.LOAD_NOTIFICATIONS,
          payload: {
            notifications: data.results || data,
            totalCount: data.count || data.length,
          },
        });
      } else {
        throw new Error('Failed to load notifications');
      }
    } catch (error) {
      dispatch({
        type: NOTIFICATION_ACTIONS.SET_ERROR,
        payload: error.message,
      });
    }
  };

  // Load notification counts
  const loadNotificationCounts = async () => {
    try {
      const response = await fetch('/api/notifications/counts/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({
          type: NOTIFICATION_ACTIONS.UPDATE_COUNTS,
          payload: data,
        });
      }
    } catch (error) {
      console.error('Failed to load notification counts:', error);
    }
  };

  // Add new notification (real-time)
  const addNotification = notification => {
    dispatch({
      type: NOTIFICATION_ACTIONS.ADD_NOTIFICATION,
      payload: notification,
    });

    // Play notification sound if enabled
    if (state.settings.soundEnabled) {
      playNotificationSound();
    }

    // Show desktop notification if enabled
    if (state.settings.desktopEnabled) {
      showDesktopNotification(notification);
    }
  };

  // Mark notifications as read
  const markAsRead = async notificationIds => {
    try {
      const response = await fetch('/api/notifications/mark-as-read/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          notification_ids: notificationIds,
        }),
      });

      if (response.ok) {
        dispatch({
          type: NOTIFICATION_ACTIONS.MARK_AS_READ,
          payload: notificationIds,
        });
        return { success: true };
      } else {
        throw new Error('Failed to mark notifications as read');
      }
    } catch (error) {
      dispatch({
        type: NOTIFICATION_ACTIONS.SET_ERROR,
        payload: error.message,
      });
      return { success: false, error: error.message };
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        dispatch({ type: NOTIFICATION_ACTIONS.MARK_ALL_AS_READ });
        return { success: true };
      } else {
        throw new Error('Failed to mark all notifications as read');
      }
    } catch (error) {
      dispatch({
        type: NOTIFICATION_ACTIONS.SET_ERROR,
        payload: error.message,
      });
      return { success: false, error: error.message };
    }
  };

  // Remove notification
  const removeNotification = async notificationId => {
    try {
      // Optimistically remove from state
      dispatch({
        type: NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION,
        payload: { id: notificationId },
      });

      const response = await fetch(`/api/notifications/${notificationId}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        // Reload notifications if delete failed
        loadNotifications();
        throw new Error('Failed to remove notification');
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    dispatch({ type: NOTIFICATION_ACTIONS.CLEAR_NOTIFICATIONS });
  };

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/assets/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(console.error);
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  };

  // Show desktop notification
  const showDesktopNotification = notification => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/assets/icons/logo-192.png',
        tag: notification.id,
      });
    }
  };

  // Request desktop notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  // Filter notifications by type
  const getNotificationsByType = type => {
    return state.notifications.filter(notification => notification.notification_type === type);
  };

  // Filter unread notifications
  const getUnreadNotifications = () => {
    return state.notifications.filter(notification => !notification.isRead);
  };

  // Get notifications by priority
  const getNotificationsByPriority = priority => {
    return state.notifications.filter(notification => notification.priority === priority);
  };

  // Get recent notifications (last 24 hours)
  const getRecentNotifications = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    return state.notifications.filter(
      notification => new Date(notification.createdAt || notification.created_at) > yesterday
    );
  };

  // Update notification settings
  const updateSettings = newSettings => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: { ...state.settings, ...newSettings },
    });

    // Save to localStorage
    localStorage.setItem(
      'notificationSettings',
      JSON.stringify({
        ...state.settings,
        ...newSettings,
      })
    );
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: NOTIFICATION_ACTIONS.SET_ERROR, payload: null });
  };

  // Context value
  const value = {
    // State
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    totalCount: state.totalCount,
    typeCounts: state.typeCounts,
    isLoading: state.isLoading,
    error: state.error,
    settings: state.settings,

    // Actions
    loadNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    requestNotificationPermission,
    updateSettings,
    clearError,

    // Filters
    getNotificationsByType,
    getUnreadNotifications,
    getNotificationsByPriority,
    getRecentNotifications,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

// Custom hook to use notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
