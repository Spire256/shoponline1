// src/services/api/ordersAPI.js
import apiClient from './apiClient';

const ordersAPI = {
  // Get all orders (with filtering and pagination)
  getOrders: async (params = {}) => {
    try {
      const response = await apiClient.get('/orders/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  // Get order by ID
  getOrderById: async orderId => {
    try {
      const response = await apiClient.get(`/orders/${orderId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  },

  // Create new order
  createOrder: async orderData => {
    try {
      const response = await apiClient.post('/orders/', orderData);
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // Update order (admin only)
  updateOrder: async (orderId, updateData) => {
    try {
      const response = await apiClient.patch(`/orders/${orderId}/`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  },

  // Cancel order
  cancelOrder: async (orderId, cancelData) => {
    try {
      const response = await apiClient.post(`/orders/${orderId}/cancel/`, cancelData);
      return response.data;
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  },

  // Confirm order (admin only)
  confirmOrder: async orderId => {
    try {
      const response = await apiClient.post(`/orders/${orderId}/confirm/`);
      return response.data;
    } catch (error) {
      console.error('Error confirming order:', error);
      throw error;
    }
  },

  // Mark order as delivered (admin only)
  markAsDelivered: async orderId => {
    try {
      const response = await apiClient.post(`/orders/${orderId}/deliver/`);
      return response.data;
    } catch (error) {
      console.error('Error marking order as delivered:', error);
      throw error;
    }
  },

  // Get order notes
  getOrderNotes: async orderId => {
    try {
      const response = await apiClient.get(`/orders/${orderId}/notes/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order notes:', error);
      throw error;
    }
  },

  // Add order note (admin only)
  addOrderNote: async (orderId, noteData) => {
    try {
      const response = await apiClient.post(`/orders/${orderId}/notes/`, noteData);
      return response.data;
    } catch (error) {
      console.error('Error adding order note:', error);
      throw error;
    }
  },

  // Get COD orders (admin only)
  getCODOrders: async (params = {}) => {
    try {
      const response = await apiClient.get('/orders/cod/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching COD orders:', error);
      throw error;
    }
  },

  // Verify COD order (admin only)
  verifyCODOrder: async (orderId, verificationData) => {
    try {
      const response = await apiClient.post(`/orders/${orderId}/verify-cod/`, verificationData);
      return response.data;
    } catch (error) {
      console.error('Error verifying COD order:', error);
      throw error;
    }
  },

  // Get order analytics (admin only)
  getOrderAnalytics: async (params = {}) => {
    try {
      const response = await apiClient.get('/orders/analytics/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching order analytics:', error);
      throw error;
    }
  },

  // Get customer order summary
  getCustomerOrderSummary: async (customerEmail = null) => {
    try {
      const params = customerEmail ? { customer_email: customerEmail } : {};
      const response = await apiClient.get('/orders/customer-summary/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching customer order summary:', error);
      throw error;
    }
  },

  // Bulk update orders (admin only)
  bulkUpdateOrders: async bulkData => {
    try {
      const response = await apiClient.post('/orders/bulk-update/', bulkData);
      return response.data;
    } catch (error) {
      console.error('Error bulk updating orders:', error);
      throw error;
    }
  },

  // Track order by order number
  trackOrder: async orderNumber => {
    try {
      const response = await apiClient.get(`/orders/track/${orderNumber}/`);
      return response.data;
    } catch (error) {
      console.error('Error tracking order:', error);
      throw error;
    }
  },

  // Helper functions for order management
  helpers: {
    // Format order status for display
    formatOrderStatus: status => {
      const statusMap = {
        pending: 'Pending',
        confirmed: 'Confirmed',
        processing: 'Processing',
        out_for_delivery: 'Out for Delivery',
        delivered: 'Delivered',
        cancelled: 'Cancelled',
        refunded: 'Refunded',
      };
      return statusMap[status] || status;
    },

    // Format payment method for display
    formatPaymentMethod: method => {
      const methodMap = {
        mtn_momo: 'MTN Mobile Money',
        airtel_money: 'Airtel Money',
        cash_on_delivery: 'Cash on Delivery',
      };
      return methodMap[method] || method;
    },

    // Get order status color
    getOrderStatusColor: status => {
      const colors = {
        pending: '#f59e0b',
        confirmed: '#3b82f6',
        processing: '#8b5cf6',
        out_for_delivery: '#06b6d4',
        delivered: '#10b981',
        cancelled: '#ef4444',
        refunded: '#6b7280',
      };
      return colors[status] || '#6b7280';
    },

    // Check if order can be cancelled
    canCancelOrder: order => {
      return ['pending', 'confirmed'].includes(order.status);
    },

    // Check if order can be refunded
    canRefundOrder: order => {
      return order.status === 'delivered' && order.payment_status === 'completed';
    },

    // Calculate order progress percentage
    getOrderProgress: status => {
      const progressMap = {
        pending: 20,
        confirmed: 40,
        processing: 60,
        out_for_delivery: 80,
        delivered: 100,
        cancelled: 0,
        refunded: 0,
      };
      return progressMap[status] || 0;
    },

    // Generate order filters for admin
    getAdminOrderFilters: () => [
      { value: '', label: 'All Orders' },
      { value: 'pending', label: 'Pending Orders' },
      { value: 'confirmed', label: 'Confirmed Orders' },
      { value: 'processing', label: 'Processing Orders' },
      { value: 'out_for_delivery', label: 'Out for Delivery' },
      { value: 'delivered', label: 'Delivered Orders' },
      { value: 'cancelled', label: 'Cancelled Orders' },
      { value: 'cash_on_delivery', label: 'COD Orders' },
    ],

    // Generate date range options
    getDateRangeOptions: () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      const lastMonth = new Date(today);
      lastMonth.setMonth(today.getMonth() - 1);

      return [
        {
          label: 'Today',
          value: {
            date_from: today.toISOString().split('T')[0],
            date_to: today.toISOString().split('T')[0],
          },
        },
        {
          label: 'Yesterday',
          value: {
            date_from: yesterday.toISOString().split('T')[0],
            date_to: yesterday.toISOString().split('T')[0],
          },
        },
        {
          label: 'Last 7 days',
          value: {
            date_from: lastWeek.toISOString().split('T')[0],
            date_to: today.toISOString().split('T')[0],
          },
        },
        {
          label: 'Last 30 days',
          value: {
            date_from: lastMonth.toISOString().split('T')[0],
            date_to: today.toISOString().split('T')[0],
          },
        },
      ];
    },

    // Validate order data before submission
    validateOrderData: orderData => {
      const errors = [];

      if (!orderData.first_name?.trim()) {
        errors.push('First name is required');
      }

      if (!orderData.last_name?.trim()) {
        errors.push('Last name is required');
      }

      if (!orderData.email?.trim()) {
        errors.push('Email is required');
      } else if (!/\S+@\S+\.\S+/.test(orderData.email)) {
        errors.push('Please enter a valid email address');
      }

      if (!orderData.phone?.trim()) {
        errors.push('Phone number is required');
      }

      if (!orderData.address_line_1?.trim()) {
        errors.push('Address is required');
      }

      if (!orderData.city?.trim()) {
        errors.push('City is required');
      }

      if (!orderData.district?.trim()) {
        errors.push('District is required');
      }

      if (!orderData.payment_method) {
        errors.push('Payment method is required');
      }

      if (!orderData.items || orderData.items.length === 0) {
        errors.push('At least one item is required');
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    },
  },
};

export { ordersAPI };
