// src/hooks/useWebSocket.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';

/**
 * Custom hook for WebSocket connections
 * Handles real-time notifications, order updates, etc.
 */
export const useWebSocket = (url, options = {}) => {
  const {
    onMessage = () => {},
    onConnect = () => {},
    onDisconnect = () => {},
    onError = () => {},
    shouldConnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const [connectionState, setConnectionState] = useState('Disconnected');
  const [lastMessage, setLastMessage] = useState(null);
  const [connectionError, setConnectionError] = useState(null);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const { accessToken, isAuthenticated } = useAuth();

  // Build WebSocket URL with auth token
  const buildWebSocketUrl = useCallback(() => {
    if (!url) return null;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const baseUrl = url.startsWith('ws') ? url : `${wsProtocol}//${window.location.host}${url}`;

    // Add auth token as query parameter
    if (isAuthenticated && accessToken) {
      const separator = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${separator}token=${accessToken}`;
    }

    return baseUrl;
  }, [url, accessToken, isAuthenticated]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    const wsUrl = buildWebSocketUrl();

    if (!wsUrl || !shouldConnect) return;

    try {
      wsRef.current = new WebSocket(wsUrl);
      setConnectionState('Connecting');
      setConnectionError(null);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setConnectionState('Connected');
        reconnectAttemptsRef.current = 0;
        onConnect();
      };

      wsRef.current.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          onMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
          setLastMessage({ raw: event.data });
          onMessage({ raw: event.data });
        }
      };

      wsRef.current.onclose = event => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setConnectionState('Disconnected');
        wsRef.current = null;
        onDisconnect(event);

        // Attempt to reconnect if not a manual disconnect
        if (
          event.code !== 1000 &&
          shouldConnect &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          scheduleReconnect();
        }
      };

      wsRef.current.onerror = error => {
        console.error('WebSocket error:', error);
        setConnectionError('Connection error occurred');
        setConnectionState('Error');
        onError(error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionError('Failed to create connection');
      setConnectionState('Error');
    }
  }, [
    buildWebSocketUrl,
    shouldConnect,
    onConnect,
    onMessage,
    onDisconnect,
    onError,
    maxReconnectAttempts,
  ]);

  // Schedule reconnection
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectAttemptsRef.current += 1;
    setConnectionState(`Reconnecting (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, reconnectInterval);
  }, [connect, reconnectInterval, maxReconnectAttempts]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    setConnectionState('Disconnected');
  }, []);

  // Send message
  const sendMessage = useCallback(message => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        const messageString = typeof message === 'string' ? message : JSON.stringify(message);
        wsRef.current.send(messageString);
        return { success: true };
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        return { success: false, error: error.message };
      }
    } else {
      return { success: false, error: 'WebSocket not connected' };
    }
  }, []);

  // Send JSON message
  const sendJSON = useCallback(
    data => {
      return sendMessage(JSON.stringify(data));
    },
    [sendMessage]
  );

  // Effect to handle connection
  useEffect(() => {
    if (shouldConnect && isAuthenticated) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [shouldConnect, isAuthenticated, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Connection state helpers
  const isConnected = connectionState === 'Connected';
  const isConnecting =
    connectionState === 'Connecting' || connectionState.startsWith('Reconnecting');
  const isDisconnected = connectionState === 'Disconnected';
  const hasError = connectionState === 'Error';

  return {
    // Connection state
    connectionState,
    isConnected,
    isConnecting,
    isDisconnected,
    hasError,
    connectionError,

    // Last received message
    lastMessage,

    // Actions
    connect,
    disconnect,
    sendMessage,
    sendJSON,

    // Connection info
    reconnectAttempts: reconnectAttemptsRef.current,
    maxReconnectAttempts,
  };
};

// Hook for admin notifications WebSocket
export const useAdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const { isAuthenticated, isAdmin } = useAuth();

  const handleMessage = useCallback(data => {
    if (data.type === 'notification') {
      setNotifications(prev => [data.payload, ...prev.slice(0, 49)]); // Keep last 50

      // Show browser notification for important notifications
      if (data.payload.priority === 'high' || data.payload.type === 'cod_order') {
        showBrowserNotification(data.payload);
      }
    }
  }, []);

  const showBrowserNotification = notification => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/assets/icons/logo-192.png',
        tag: notification.id,
      });
    }
  };

  const { connectionState, sendMessage } = useWebSocket('/ws/admin/notifications/', {
    onMessage: handleMessage,
    shouldConnect: isAuthenticated && isAdmin(),
  });

  // Mark notification as read
  const markAsRead = useCallback(notificationId => {
    setNotifications(prev =>
      prev.map(notif => (notif.id === notificationId ? { ...notif, isRead: true } : notif))
    );
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    connectionState,
    markAsRead,
    clearNotifications,
    unreadCount: notifications.filter(n => !n.isRead).length,
  };
};

// Hook for order status updates WebSocket
export const useOrderUpdates = (orderId = null) => {
  const [orderUpdate, setOrderUpdate] = useState(null);
  const { isAuthenticated } = useAuth();

  const handleMessage = useCallback(
    data => {
      if (data.type === 'order_update') {
        // If we're listening for a specific order, filter by ID
        if (!orderId || data.payload.orderId === orderId) {
          setOrderUpdate(data.payload);
        }
      }
    },
    [orderId]
  );

  const wsUrl = orderId ? `/ws/orders/${orderId}/` : '/ws/orders/';

  const { connectionState, sendMessage } = useWebSocket(wsUrl, {
    onMessage: handleMessage,
    shouldConnect: isAuthenticated,
  });

  return {
    orderUpdate,
    connectionState,
    clearUpdate: () => setOrderUpdate(null),
  };
};

// Hook for flash sales countdown WebSocket
export const useFlashSalesWebSocket = () => {
  const [activeSales, setActiveSales] = useState([]);
  const [expiredSales, setExpiredSales] = useState([]);

  const handleMessage = useCallback(data => {
    switch (data.type) {
      case 'flash_sale_started':
        setActiveSales(prev => [...prev, data.payload]);
        break;
      case 'flash_sale_ending_soon':
        // Could trigger special UI notifications
        console.log('Flash sale ending soon:', data.payload);
        break;
      case 'flash_sale_expired':
        setExpiredSales(prev => [...prev, data.payload]);
        setActiveSales(prev => prev.filter(sale => sale.id !== data.payload.id));
        break;
      case 'flash_sale_timer_update':
        setActiveSales(prev =>
          prev.map(sale =>
            sale.id === data.payload.saleId
              ? { ...sale, timeRemaining: data.payload.timeRemaining }
              : sale
          )
        );
        break;
      default:
        break;
    }
  }, []);

  const { connectionState } = useWebSocket('/ws/flash-sales/', {
    onMessage: handleMessage,
    shouldConnect: true, // Always connect for flash sales updates
  });

  return {
    activeSales,
    expiredSales,
    connectionState,
  };
};

export default useWebSocket;
