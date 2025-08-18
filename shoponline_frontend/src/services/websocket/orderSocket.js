// src/services/websocket/orderSocket.js
import { websocketService } from './websocketService';
import { authService } from '../auth/authService';

/**
 * Order Socket Service
 * Handles real-time order updates via WebSocket
 */
class OrderSocketService {
  constructor() {
    this.endpoint = '/orders/';
    this.isConnected = false;
    this.subscribedOrders = new Set();
    this.orderUpdates = new Map();

    // Order update callbacks
    this.callbacks = {
      onOrderUpdate: [],
      onOrderStatusChange: [],
      onPaymentUpdate: [],
      onCODAlert: [],
      onConnectionChange: [],
    };

    // Auto-connect when user is authenticated
    this.initializeConnection();
  }

  /**
   * Initialize order updates connection
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
   * Connect to order updates WebSocket
   * @returns {Promise<boolean>} Connection success status
   */
  async connect() {
    try {
      if (this.isConnected) {
        return true;
      }

      const user = authService.getCurrentUserFromStorage();
      if (!user) {
        console.warn('Cannot connect to order updates: User not authenticated');
        return false;
      }

      await websocketService.connect(this.endpoint, {
        userId: user.id,
        userRole: user.role,
        onOpen: () => {
          this.isConnected = true;
          console.log('Order updates WebSocket connected');
          this.notifyConnectionChange(true);

          // Re-subscribe to previously subscribed orders
          this.resubscribeToOrders();
        },
        onClose: () => {
          this.isConnected = false;
          console.log('Order updates WebSocket disconnected');
          this.notifyConnectionChange(false);
        },
        onMessage: data => {
          this.handleOrderMessage(data);
        },
        onError: error => {
          console.error('Order updates WebSocket error:', error);
          this.isConnected = false;
          this.notifyConnectionChange(false);
        },
      });

      // Set up WebSocket event listeners
      this.setupEventListeners();

      return true;
    } catch (error) {
      console.error('Failed to connect to order updates WebSocket:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Disconnect from order updates WebSocket
   */
  disconnect() {
    if (websocketService.isConnected(this.endpoint)) {
      websocketService.disconnect(this.endpoint);
    }
    this.isConnected = false;
    this.subscribedOrders.clear();
    this.orderUpdates.clear();
    this.notifyConnectionChange(false);
  }

  /**
   * Set up WebSocket event listeners
   */
  setupEventListeners() {
    // Listen for order updates
    websocketService.on(`${this.endpoint}:order_update`, data => {
      this.handleOrderUpdate(data);
    });

    // Listen for order status changes
    websocketService.on(`${this.endpoint}:order_status_change`, data => {
      this.handleOrderStatusChange(data);
    });

    // Listen for payment updates
    websocketService.on(`${this.endpoint}:payment_update`, data => {
      this.handlePaymentUpdate(data);
    });

    // Listen for COD alerts (admin only)
    websocketService.on(`${this.endpoint}:cod_alert`, data => {
      this.handleCODAlert(data);
    });

    // Listen for order confirmation
    websocketService.on(`${this.endpoint}:order_confirmed`, data => {
      this.handleOrderConfirmation(data);
    });

    // Listen for delivery updates
    websocketService.on(`${this.endpoint}:delivery_update`, data => {
      this.handleDeliveryUpdate(data);
    });
  }

  /**
   * Handle incoming order message
   * @param {Object} data - Message data
   */
  handleOrderMessage(data) {
    switch (data.type) {
      case 'order_update':
        this.handleOrderUpdate(data.order);
        break;
      case 'order_status_change':
        this.handleOrderStatusChange(data);
        break;
      case 'payment_update':
        this.handlePaymentUpdate(data.payment);
        break;
      case 'cod_alert':
        this.handleCODAlert(data.order);
        break;
      case 'order_confirmed':
        this.handleOrderConfirmation(data.order);
        break;
      case 'delivery_update':
        this.handleDeliveryUpdate(data);
        break;
      case 'subscription_confirmed':
        console.log(`Subscribed to order ${data.order_id} updates`);
        break;
      case 'subscription_error':
        console.error(`Failed to subscribe to order ${data.order_id}:`, data.error);
        break;
      default:
        console.log('Unknown order message type:', data.type);
    }
  }

  /**
   * Handle order update
   * @param {Object} order - Updated order data
   */
  handleOrderUpdate(order) {
    // Store update locally
    this.orderUpdates.set(order.id, {
      ...order,
      lastUpdated: new Date().toISOString(),
    });

    // Notify callbacks
    this.notifyOrderUpdate(order);

    console.log(`Order ${order.order_number} updated:`, order.status);
  }

  /**
   * Handle order status change
   * @param {Object} data - Status change data
   */
  handleOrderStatusChange(data) {
    const { order_id, old_status, new_status, order } = data;

    console.log(`Order ${order_id} status changed from ${old_status} to ${new_status}`);

    // Update stored order data
    if (this.orderUpdates.has(order_id)) {
      const storedOrder = this.orderUpdates.get(order_id);
      storedOrder.status = new_status;
      storedOrder.lastUpdated = new Date().toISOString();
    }

    // Notify callbacks
    this.notifyOrderStatusChange({
      orderId: order_id,
      oldStatus: old_status,
      newStatus: new_status,
      order: order,
    });

    // Show specific notifications for important status changes
    this.showStatusChangeNotification(order_id, old_status, new_status);
  }

  /**
   * Handle payment update
   * @param {Object} payment - Updated payment data
   */
  handlePaymentUpdate(payment) {
    console.log(`Payment ${payment.reference_number} updated:`, payment.status);

    // Notify callbacks
    this.notifyPaymentUpdate(payment);

    // Show payment notification
    this.showPaymentNotification(payment);
  }

  /**
   * Handle COD alert (admin only)
   * @param {Object} order - COD order data
   */
  handleCODAlert(order) {
    if (!authService.isAdmin()) {
      return;
    }

    console.log(`New COD order alert: ${order.order_number}`);

    // Notify callbacks
    this.notifyCODAlert(order);

    // Show COD alert notification
    this.showCODAlertNotification(order);
  }

  /**
   * Handle order confirmation
   * @param {Object} order - Confirmed order data
   */
  handleOrderConfirmation(order) {
    console.log(`Order ${order.order_number} confirmed`);

    // Update stored order data
    this.orderUpdates.set(order.id, {
      ...order,
      lastUpdated: new Date().toISOString(),
    });

    // Notify callbacks
    this.notifyOrderUpdate(order);
  }

  /**
   * Handle delivery update
   * @param {Object} data - Delivery update data
   */
  handleDeliveryUpdate(data) {
    const { order_id, delivery_status, message } = data;

    console.log(`Delivery update for order ${order_id}: ${delivery_status}`);

    // Update stored order data
    if (this.orderUpdates.has(order_id)) {
      const storedOrder = this.orderUpdates.get(order_id);
      storedOrder.delivery_status = delivery_status;
      storedOrder.lastUpdated = new Date().toISOString();
    }

    // Notify callbacks
    this.notifyOrderUpdate(data);
  }

  /**
   * Subscribe to order updates
   * @param {string} orderId - Order ID to subscribe to
   */
  subscribeToOrder(orderId) {
    if (!websocketService.isConnected(this.endpoint)) {
      console.warn('Cannot subscribe to order: WebSocket not connected');
      return false;
    }

    websocketService.send(this.endpoint, {
      type: 'subscribe_order',
      order_id: orderId,
    });

    this.subscribedOrders.add(orderId);
    return true;
  }

  /**
   * Unsubscribe from order updates
   * @param {string} orderId - Order ID to unsubscribe from
   */
  unsubscribeFromOrder(orderId) {
    if (!websocketService.isConnected(this.endpoint)) {
      return false;
    }

    websocketService.send(this.endpoint, {
      type: 'unsubscribe_order',
      order_id: orderId,
    });

    this.subscribedOrders.delete(orderId);
    this.orderUpdates.delete(orderId);
    return true;
  }

  /**
   * Subscribe to all user orders (client) or all orders (admin)
   */
  subscribeToUserOrders() {
    if (!websocketService.isConnected(this.endpoint)) {
      console.warn('Cannot subscribe to user orders: WebSocket not connected');
      return false;
    }

    websocketService.send(this.endpoint, {
      type: 'subscribe_user_orders',
    });

    return true;
  }

  /**
   * Subscribe to COD alerts (admin only)
   */
  subscribeToCODAlerts() {
    if (!authService.isAdmin()) {
      console.warn('COD alerts are only available for admin users');
      return false;
    }

    if (!websocketService.isConnected(this.endpoint)) {
      console.warn('Cannot subscribe to COD alerts: WebSocket not connected');
      return false;
    }

    websocketService.send(this.endpoint, {
      type: 'subscribe_cod_alerts',
    });

    return true;
  }

  /**
   * Re-subscribe to previously subscribed orders
   */
  resubscribeToOrders() {
    // Re-subscribe to individual orders
    this.subscribedOrders.forEach(orderId => {
      this.subscribeToOrder(orderId);
    });

    // Re-subscribe to user orders
    this.subscribeToUserOrders();

    // Re-subscribe to COD alerts if admin
    if (authService.isAdmin()) {
      this.subscribeToCODAlerts();
    }
  }

  /**
   * Show status change notification
   * @param {string} orderId - Order ID
   * @param {string} oldStatus - Previous status
   * @param {string} newStatus - New status
   */
  showStatusChangeNotification(orderId, oldStatus, newStatus) {
    const statusMessages = {
      pending: 'Order is being processed',
      confirmed: 'Order confirmed',
      processing: 'Order is being prepared',
      shipped: 'Order has been shipped',
      out_for_delivery: 'Order is out for delivery',
      delivered: 'Order delivered successfully',
      cancelled: 'Order has been cancelled',
      refunded: 'Order has been refunded',
    };

    const message = statusMessages[newStatus] || `Order status updated to ${newStatus}`;

    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('Order Update', {
        body: message,
        icon: '/icons/order-icon.png',
        tag: `order_${orderId}`,
        data: { orderId, newStatus },
      });

      notification.onclick = () => {
        window.focus();
        if (authService.isAdmin()) {
          window.location.href = `/admin/orders/${orderId}`;
        } else {
          window.location.href = `/orders/${orderId}`;
        }
        notification.close();
      };
    }
  }

  /**
   * Show payment notification
   * @param {Object} payment - Payment data
   */
  showPaymentNotification(payment) {
    const statusMessages = {
      completed: 'Payment completed successfully',
      failed: 'Payment failed',
      cancelled: 'Payment was cancelled',
      processing: 'Payment is being processed',
    };

    const message = statusMessages[payment.status] || `Payment status: ${payment.status}`;

    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('Payment Update', {
        body: message,
        icon: '/icons/payment-icon.png',
        tag: `payment_${payment.id}`,
        data: { paymentId: payment.id, status: payment.status },
      });

      notification.onclick = () => {
        window.focus();
        window.location.href = `/orders/${payment.order_id}`;
        notification.close();
      };
    }
  }

  /**
   * Show COD alert notification (admin only)
   * @param {Object} order - COD order data
   */
  showCODAlertNotification(order) {
    if (!authService.isAdmin()) {
      return;
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('New COD Order', {
        body: `Order #${order.order_number} - UGX ${order.total_amount?.toLocaleString()}`,
        icon: '/icons/cod-icon.png',
        tag: `cod_${order.id}`,
        requireInteraction: true,
        data: { orderId: order.id, orderNumber: order.order_number },
      });

      notification.onclick = () => {
        window.focus();
        window.location.href = `/admin/orders/${order.id}`;
        notification.close();
      };
    }

    // Play COD alert sound
    this.playCODAlertSound();
  }

  /**
   * Play COD alert sound
   */
  playCODAlertSound() {
    try {
      const audio = new Audio('/sounds/cod-alert.mp3');
      audio.volume = 0.7;
      audio.play().catch(error => {
        console.error('Error playing COD alert sound:', error);
      });
    } catch (error) {
      console.error('Error with COD alert sound:', error);
    }
  }

  /**
   * Add order update callback
   * @param {string} event - Event type
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    const callbackKey = `on${event.charAt(0).toUpperCase() + event.slice(1)}`;
    if (this.callbacks[callbackKey]) {
      this.callbacks[callbackKey].push(callback);
    }
  }

  /**
   * Remove order update callback
   * @param {string} event - Event type
   * @param {Function} callback - Callback function to remove
   */
  off(event, callback) {
    const callbackKey = `on${event.charAt(0).toUpperCase() + event.slice(1)}`;
    const callbackArray = this.callbacks[callbackKey];
    if (callbackArray) {
      const index = callbackArray.indexOf(callback);
      if (index > -1) {
        callbackArray.splice(index, 1);
      }
    }
  }

  /**
   * Notify order update callbacks
   * @param {Object} order - Order data
   */
  notifyOrderUpdate(order) {
    this.callbacks.onOrderUpdate.forEach(callback => {
      try {
        callback(order);
      } catch (error) {
        console.error('Error in order update callback:', error);
      }
    });
  }

  /**
   * Notify order status change callbacks
   * @param {Object} statusData - Status change data
   */
  notifyOrderStatusChange(statusData) {
    this.callbacks.onOrderStatusChange.forEach(callback => {
      try {
        callback(statusData);
      } catch (error) {
        console.error('Error in order status change callback:', error);
      }
    });
  }

  /**
   * Notify payment update callbacks
   * @param {Object} payment - Payment data
   */
  notifyPaymentUpdate(payment) {
    this.callbacks.onPaymentUpdate.forEach(callback => {
      try {
        callback(payment);
      } catch (error) {
        console.error('Error in payment update callback:', error);
      }
    });
  }

  /**
   * Notify COD alert callbacks
   * @param {Object} order - COD order data
   */
  notifyCODAlert(order) {
    this.callbacks.onCODAlert.forEach(callback => {
      try {
        callback(order);
      } catch (error) {
        console.error('Error in COD alert callback:', error);
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
   * Get stored order updates
   * @returns {Map} Map of order updates
   */
  getOrderUpdates() {
    return new Map(this.orderUpdates);
  }

  /**
   * Get specific order update
   * @param {string} orderId - Order ID
   * @returns {Object|null} Order data or null
   */
  getOrderUpdate(orderId) {
    return this.orderUpdates.get(orderId) || null;
  }

  /**
   * Get subscribed orders
   * @returns {Set} Set of subscribed order IDs
   */
  getSubscribedOrders() {
    return new Set(this.subscribedOrders);
  }

  /**
   * Get connection status
   * @returns {boolean} Connection status
   */
  getConnectionStatus() {
    return this.isConnected;
  }

  /**
   * Clear stored order updates
   */
  clearOrderUpdates() {
    this.orderUpdates.clear();
  }

  /**
   * Send order action (admin only)
   * @param {string} orderId - Order ID
   * @param {string} action - Action to perform
   * @param {Object} data - Additional action data
   */
  sendOrderAction(orderId, action, data = {}) {
    if (!authService.isAdmin()) {
      console.warn('Order actions are only available for admin users');
      return false;
    }

    if (!websocketService.isConnected(this.endpoint)) {
      console.warn('Cannot send order action: WebSocket not connected');
      return false;
    }

    websocketService.send(this.endpoint, {
      type: 'order_action',
      order_id: orderId,
      action: action,
      data: data,
    });

    return true;
  }

  /**
   * Update order status (admin only)
   * @param {string} orderId - Order ID
   * @param {string} newStatus - New status
   * @param {string} notes - Status change notes
   */
  updateOrderStatus(orderId, newStatus, notes = '') {
    return this.sendOrderAction(orderId, 'update_status', {
      status: newStatus,
      notes: notes,
    });
  }

  /**
   * Assign order to admin (admin only)
   * @param {string} orderId - Order ID
   * @param {string} adminId - Admin user ID
   */
  assignOrder(orderId, adminId) {
    return this.sendOrderAction(orderId, 'assign', {
      admin_id: adminId,
    });
  }

  /**
   * Add order note (admin only)
   * @param {string} orderId - Order ID
   * @param {string} note - Note to add
   */
  addOrderNote(orderId, note) {
    return this.sendOrderAction(orderId, 'add_note', {
      note: note,
    });
  }
}

// Create and export singleton instance
const orderSocket = new OrderSocketService();
export { orderSocket };
