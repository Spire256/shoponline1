// src/services/websocket/websocketService.js
import { tokenService } from '../auth/tokenService';

/**
 * WebSocket Service
 * Handles WebSocket connections for real-time communication
 */
class WebSocketService {
  constructor() {
    this.connections = new Map();
    this.reconnectAttempts = new Map();
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.heartbeatInterval = 30000; // 30 seconds
    this.heartbeatTimer = null;
    this.isConnecting = false;

    // Event listeners
    this.eventListeners = new Map();
  }

  /**
   * Create WebSocket connection
   * @param {string} endpoint - WebSocket endpoint
   * @param {Object} options - Connection options
   * @returns {Promise<WebSocket>} WebSocket connection
   */
  async connect(endpoint, options = {}) {
    try {
      if (
        this.connections.has(endpoint) &&
        this.connections.get(endpoint).readyState === WebSocket.OPEN
      ) {
        return this.connections.get(endpoint);
      }

      this.isConnecting = true;
      const wsUrl = this.buildWebSocketUrl(endpoint, options);
      const ws = new WebSocket(wsUrl);

      // Set up event listeners
      ws.onopen = event => {
        console.log(`WebSocket connected to ${endpoint}`);
        this.isConnecting = false;
        this.reconnectAttempts.set(endpoint, 0);

        // Start heartbeat
        this.startHeartbeat(ws);

        // Trigger onopen callback if provided
        if (options.onOpen) {
          options.onOpen(event);
        }

        // Emit connection event
        this.emit(`${endpoint}:connected`, { endpoint, event });
      };

      ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(endpoint, data, event);

          // Trigger onMessage callback if provided
          if (options.onMessage) {
            options.onMessage(data, event);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = event => {
        console.log(`WebSocket disconnected from ${endpoint}:`, event.code, event.reason);
        this.stopHeartbeat();
        this.connections.delete(endpoint);

        // Trigger onClose callback if provided
        if (options.onClose) {
          options.onClose(event);
        }

        // Emit disconnection event
        this.emit(`${endpoint}:disconnected`, { endpoint, event });

        // Attempt reconnection if not intentional
        if (event.code !== 1000 && event.code !== 1001) {
          this.scheduleReconnect(endpoint, options);
        }
      };

      ws.onerror = error => {
        console.error(`WebSocket error on ${endpoint}:`, error);
        this.isConnecting = false;

        // Trigger onError callback if provided
        if (options.onError) {
          options.onError(error);
        }

        // Emit error event
        this.emit(`${endpoint}:error`, { endpoint, error });
      };

      this.connections.set(endpoint, ws);
      return ws;
    } catch (error) {
      this.isConnecting = false;
      console.error(`Failed to connect to ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Disconnect WebSocket
   * @param {string} endpoint - Endpoint to disconnect
   */
  disconnect(endpoint) {
    const ws = this.connections.get(endpoint);
    if (ws) {
      ws.close(1000, 'Client disconnecting');
      this.connections.delete(endpoint);
      this.reconnectAttempts.delete(endpoint);
    }
  }

  /**
   * Disconnect all WebSocket connections
   */
  disconnectAll() {
    this.connections.forEach((ws, endpoint) => {
      this.disconnect(endpoint);
    });
    this.stopHeartbeat();
  }

  /**
   * Send message through WebSocket
   * @param {string} endpoint - Target endpoint
   * @param {Object} data - Data to send
   * @returns {boolean} Success status
   */
  send(endpoint, data) {
    const ws = this.connections.get(endpoint);

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn(`Cannot send message: WebSocket ${endpoint} not connected`);
      return false;
    }

    try {
      ws.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Error sending message to ${endpoint}:`, error);
      return false;
    }
  }

  /**
   * Check if endpoint is connected
   * @param {string} endpoint - Endpoint to check
   * @returns {boolean} Connection status
   */
  isConnected(endpoint) {
    const ws = this.connections.get(endpoint);
    return ws && ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection state
   * @param {string} endpoint - Endpoint to check
   * @returns {number} WebSocket ready state
   */
  getConnectionState(endpoint) {
    const ws = this.connections.get(endpoint);
    return ws ? ws.readyState : WebSocket.CLOSED;
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback to remove
   */
  off(event, callback) {
    if (!this.eventListeners.has(event)) {
      return;
    }

    const listeners = this.eventListeners.get(event);
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }

    if (listeners.length === 0) {
      this.eventListeners.delete(event);
    }
  }

  /**
   * Emit event to listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (!this.eventListeners.has(event)) {
      return;
    }

    this.eventListeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  /**
   * Build WebSocket URL
   * @param {string} endpoint - WebSocket endpoint
   * @param {Object} options - Connection options
   * @returns {string} Complete WebSocket URL
   */
  buildWebSocketUrl(endpoint, options = {}) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = options.host || window.location.host;
    const baseUrl = `${protocol}//${host}/ws`;

    // Add authentication token if available
    const token = tokenService.getAccessToken();
    const params = new URLSearchParams();

    if (token) {
      params.append('token', token);
    }

    if (options.userId) {
      params.append('user_id', options.userId);
    }

    const queryString = params.toString();
    return `${baseUrl}${endpoint}${queryString ? `?${queryString}` : ''}`;
  }

  /**
   * Handle incoming WebSocket message
   * @param {string} endpoint - Source endpoint
   * @param {Object} data - Message data
   * @param {MessageEvent} event - Original message event
   */
  handleMessage(endpoint, data, event) {
    const messageType = data.type || 'message';

    // Handle different message types
    switch (messageType) {
      case 'heartbeat':
        this.handleHeartbeat(endpoint, data);
        break;
      case 'notification':
        this.handleNotification(data.data);
        break;
      case 'order_update':
        this.handleOrderUpdate(data.data);
        break;
      case 'payment_update':
        this.handlePaymentUpdate(data.data);
        break;
      case 'cod_alert':
        this.handleCODAlert(data.data);
        break;
      case 'flash_sale_update':
        this.handleFlashSaleUpdate(data.data);
        break;
      case 'system_message':
        this.handleSystemMessage(data.data);
        break;
      default:
        // Emit generic message event
        this.emit(`${endpoint}:message`, { data, event });
        this.emit(`${endpoint}:${messageType}`, data.data || data);
    }
  }

  /**
   * Handle heartbeat message
   * @param {string} endpoint - Source endpoint
   * @param {Object} data - Heartbeat data
   */
  handleHeartbeat(endpoint, data) {
    // Respond to heartbeat if required
    if (data.requireResponse) {
      this.send(endpoint, {
        type: 'heartbeat_response',
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Handle notification message
   * @param {Object} notification - Notification data
   */
  handleNotification(notification) {
    this.emit('notification', notification);

    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: `notification_${notification.id}`,
      });
    }
  }

  /**
   * Handle order update message
   * @param {Object} orderData - Order update data
   */
  handleOrderUpdate(orderData) {
    this.emit('order_update', orderData);
  }

  /**
   * Handle payment update message
   * @param {Object} paymentData - Payment update data
   */
  handlePaymentUpdate(paymentData) {
    this.emit('payment_update', paymentData);
  }

  /**
   * Handle COD alert message
   * @param {Object} codData - COD alert data
   */
  handleCODAlert(codData) {
    this.emit('cod_alert', codData);

    // Special handling for admin COD alerts
    if (codData.type === 'new_cod_order') {
      this.showCODNotification(codData);
    }
  }

  /**
   * Handle flash sale update message
   * @param {Object} flashSaleData - Flash sale update data
   */
  handleFlashSaleUpdate(flashSaleData) {
    this.emit('flash_sale_update', flashSaleData);
  }

  /**
   * Handle system message
   * @param {Object} systemData - System message data
   */
  handleSystemMessage(systemData) {
    this.emit('system_message', systemData);

    if (systemData.level === 'critical') {
      console.warn('Critical system message:', systemData.message);
    }
  }

  /**
   * Show COD notification
   * @param {Object} codData - COD data
   */
  showCODNotification(codData) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('New COD Order', {
        body: `Order #${codData.order_number} - UGX ${codData.total_amount}`,
        icon: '/favicon.ico',
        tag: `cod_order_${codData.order_id}`,
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        window.location.href = `/admin/orders/${codData.order_id}`;
        notification.close();
      };
    }
  }

  /**
   * Start heartbeat mechanism
   * @param {WebSocket} ws - WebSocket connection
   */
  startHeartbeat(ws) {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'heartbeat',
            timestamp: Date.now(),
          })
        );
      }
    }, this.heartbeatInterval);
  }

  /**
   * Stop heartbeat mechanism
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Schedule reconnection attempt
   * @param {string} endpoint - Endpoint to reconnect
   * @param {Object} options - Connection options
   */
  scheduleReconnect(endpoint, options) {
    const attempts = this.reconnectAttempts.get(endpoint) || 0;

    if (attempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnection attempts reached for ${endpoint}`);
      this.emit(`${endpoint}:max_reconnects_reached`, { endpoint, attempts });
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, attempts); // Exponential backoff

    console.log(`Scheduling reconnection attempt ${attempts + 1} for ${endpoint} in ${delay}ms`);

    setTimeout(() => {
      if (!this.isConnecting && !this.isConnected(endpoint)) {
        this.reconnectAttempts.set(endpoint, attempts + 1);
        this.emit(`${endpoint}:reconnecting`, { endpoint, attempt: attempts + 1 });
        this.connect(endpoint, options);
      }
    }, delay);
  }

  /**
   * Request notification permission
   * @returns {Promise<string>} Permission status
   */
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      return 'not-supported';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Get connection statistics
   * @returns {Object} Connection statistics
   */
  getConnectionStats() {
    const stats = {
      totalConnections: this.connections.size,
      connectedEndpoints: [],
      disconnectedEndpoints: [],
      reconnectAttempts: {},
    };

    this.connections.forEach((ws, endpoint) => {
      if (ws.readyState === WebSocket.OPEN) {
        stats.connectedEndpoints.push(endpoint);
      } else {
        stats.disconnectedEndpoints.push(endpoint);
      }
    });

    this.reconnectAttempts.forEach((attempts, endpoint) => {
      stats.reconnectAttempts[endpoint] = attempts;
    });

    return stats;
  }

  /**
   * Set connection options
   * @param {Object} options - Global connection options
   */
  setGlobalOptions(options) {
    if (options.maxReconnectAttempts !== undefined) {
      this.maxReconnectAttempts = options.maxReconnectAttempts;
    }

    if (options.reconnectDelay !== undefined) {
      this.reconnectDelay = options.reconnectDelay;
    }

    if (options.heartbeatInterval !== undefined) {
      this.heartbeatInterval = options.heartbeatInterval;
    }
  }

  /**
   * Create WebSocket connection with retry logic
   * @param {string} endpoint - WebSocket endpoint
   * @param {Object} options - Connection options
   * @returns {Promise<WebSocket>} WebSocket connection
   */
  async connectWithRetry(endpoint, options = {}) {
    const maxRetries = options.maxRetries || 3;
    const retryDelay = options.retryDelay || 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.connect(endpoint, options);
      } catch (error) {
        console.error(`Connection attempt ${attempt} failed for ${endpoint}:`, error);

        if (attempt === maxRetries) {
          throw new Error(`Failed to connect to ${endpoint} after ${maxRetries} attempts`);
        }

        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }

  /**
   * Batch send messages
   * @param {string} endpoint - Target endpoint
   * @param {Array} messages - Array of messages to send
   * @returns {number} Number of successfully sent messages
   */
  batchSend(endpoint, messages) {
    let successCount = 0;

    messages.forEach(message => {
      if (this.send(endpoint, message)) {
        successCount++;
      }
    });

    return successCount;
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.disconnectAll();
    this.eventListeners.clear();
    this.reconnectAttempts.clear();
  }

  /**
   * Get WebSocket ready state name
   * @param {number} readyState - WebSocket ready state
   * @returns {string} Ready state name
   */
  getReadyStateName(readyState) {
    const states = {
      [WebSocket.CONNECTING]: 'CONNECTING',
      [WebSocket.OPEN]: 'OPEN',
      [WebSocket.CLOSING]: 'CLOSING',
      [WebSocket.CLOSED]: 'CLOSED',
    };

    return states[readyState] || 'UNKNOWN';
  }

  /**
   * Debug connection information
   * @param {string} endpoint - Endpoint to debug (optional)
   * @returns {Object} Debug information
   */
  debug(endpoint = null) {
    if (endpoint) {
      const ws = this.connections.get(endpoint);
      return {
        endpoint,
        connected: this.isConnected(endpoint),
        readyState: ws ? this.getReadyStateName(ws.readyState) : 'NOT_FOUND',
        reconnectAttempts: this.reconnectAttempts.get(endpoint) || 0,
      };
    }

    const debugInfo = {
      connections: {},
      stats: this.getConnectionStats(),
      eventListeners: Array.from(this.eventListeners.keys()),
    };

    this.connections.forEach((ws, ep) => {
      debugInfo.connections[ep] = {
        readyState: this.getReadyStateName(ws.readyState),
        reconnectAttempts: this.reconnectAttempts.get(ep) || 0,
      };
    });

    return debugInfo;
  }
}

// Create and export singleton instance
const websocketService = new WebSocketService();

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  websocketService.cleanup();
});

export { websocketService };
