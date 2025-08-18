// src/services/api/paymentsAPI.js
import apiClient, { handleApiResponse, handleApiError, buildQueryString } from './apiClient';

const paymentsAPI = {
  // Get payment methods configuration
  getPaymentMethods: async () => {
    try {
      const response = await apiClient.get('/payments/methods/');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Create new payment
  createPayment: async paymentData => {
    try {
      const response = await apiClient.post('/payments/create/', paymentData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get payment details
  getPayment: async paymentId => {
    try {
      const response = await apiClient.get(`/payments/${paymentId}/`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get all payments (user's own payments)
  getPayments: async (params = {}) => {
    try {
      const queryString = buildQueryString(params);
      const url = queryString ? `/payments/?${queryString}` : '/payments/';
      const response = await apiClient.get(url);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Verify payment status
  verifyPayment: async paymentId => {
    try {
      const response = await apiClient.post(`/payments/${paymentId}/verify/`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Cancel payment
  cancelPayment: async paymentId => {
    try {
      const response = await apiClient.post(`/payments/${paymentId}/cancel/`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get payment receipt
  getPaymentReceipt: async paymentId => {
    try {
      const response = await apiClient.get(`/payments/${paymentId}/receipt/`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Download payment receipt
  downloadPaymentReceipt: async (paymentId, format = 'pdf') => {
    try {
      const response = await apiClient.get(`/payments/${paymentId}/receipt/?format=${format}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Mobile Money specific methods
  initiateMTNPayment: async paymentData => {
    try {
      const response = await apiClient.post('/payments/mtn/initiate/', paymentData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  initiateAirtelPayment: async paymentData => {
    try {
      const response = await apiClient.post('/payments/airtel/initiate/', paymentData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Check phone number compatibility
  checkPhoneNumber: async (phoneNumber, provider = 'auto') => {
    try {
      const response = await apiClient.post('/payments/check-phone/', {
        phone_number: phoneNumber,
        provider,
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Cash on Delivery specific methods
  createCODPayment: async codData => {
    try {
      const response = await apiClient.post('/payments/cod/create/', codData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Admin methods
  admin: {
    // Get all payments (admin only)
    getAllPayments: async (params = {}) => {
      try {
        const queryString = buildQueryString(params);
        const url = queryString
          ? `/payments/admin/payments/?${queryString}`
          : '/payments/admin/payments/';
        const response = await apiClient.get(url);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Update payment status (admin only)
    updatePaymentStatus: async (paymentId, statusData) => {
      try {
        const response = await apiClient.patch(
          `/payments/admin/${paymentId}/update-status/`,
          statusData
        );
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Get COD payments (admin only)
    getCODPayments: async (params = {}) => {
      try {
        const queryString = buildQueryString(params);
        const url = queryString ? `/payments/admin/cod/?${queryString}` : '/payments/admin/cod/';
        const response = await apiClient.get(url);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Assign COD payment to admin
    assignCODPayment: async (paymentId, adminId) => {
      try {
        const response = await apiClient.post(`/payments/admin/cod/${paymentId}/assign/`, {
          admin_id: adminId,
        });
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Record delivery attempt
    recordDeliveryAttempt: async (paymentId, attemptData) => {
      try {
        const response = await apiClient.post(
          `/payments/admin/cod/${paymentId}/delivery-attempt/`,
          attemptData
        );
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Complete COD payment
    completeCODPayment: async (paymentId, completionData) => {
      try {
        const response = await apiClient.post(
          `/payments/admin/cod/${paymentId}/complete/`,
          completionData
        );
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Bulk assign COD payments
    bulkAssignCOD: async (paymentIds, adminId) => {
      try {
        const response = await apiClient.post('/payments/admin/cod/bulk-assign/', {
          payment_ids: paymentIds,
          admin_id: adminId,
        });
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Get payment analytics
    getPaymentAnalytics: async (period = '30d') => {
      try {
        const response = await apiClient.get(`/payments/admin/analytics/?period=${period}`);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Get webhook logs
    getWebhookLogs: async (params = {}) => {
      try {
        const queryString = buildQueryString(params);
        const url = queryString
          ? `/payments/admin/webhooks/?${queryString}`
          : '/payments/admin/webhooks/';
        const response = await apiClient.get(url);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Retry failed payment
    retryFailedPayment: async paymentId => {
      try {
        const response = await apiClient.post(`/payments/admin/${paymentId}/retry/`);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Get payment method configurations
    getPaymentMethodConfigs: async () => {
      try {
        const response = await apiClient.get('/payments/admin/methods/');
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Update payment method configuration
    updatePaymentMethodConfig: async (method, configData) => {
      try {
        const response = await apiClient.patch(`/payments/admin/methods/${method}/`, configData);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },
  },

  // Utility Functions
  formatPaymentData: payment => {
    return {
      id: payment.id,
      orderId: payment.order,
      amount: parseFloat(payment.amount),
      currency: payment.currency,
      paymentMethod: payment.payment_method,
      paymentMethodDisplay: payment.payment_method_display,
      status: payment.status,
      statusDisplay: payment.status_display,
      referenceNumber: payment.reference_number,
      transactionId: payment.transaction_id,
      externalTransactionId: payment.external_transaction_id,
      providerFee: payment.provider_fee ? parseFloat(payment.provider_fee) : 0,
      failureReason: payment.failure_reason,
      notes: payment.notes,
      mobileMoneyDetails: payment.mobile_money_details,
      codDetails: payment.cod_details,
      transactions: payment.transactions || [],
      createdAt: new Date(payment.created_at),
      updatedAt: new Date(payment.updated_at),
      processedAt: payment.processed_at ? new Date(payment.processed_at) : null,
      expiresAt: payment.expires_at ? new Date(payment.expires_at) : null,
    };
  },

  getPaymentMethodIcon: method => {
    const icons = {
      mtn_momo: '📱',
      airtel_money: '📲',
      cash_on_delivery: '💰',
    };
    return icons[method] || '💳';
  },

  getPaymentStatusColor: status => {
    const colors = {
      pending: 'orange',
      processing: 'blue',
      completed: 'green',
      failed: 'red',
      cancelled: 'gray',
      refunded: 'purple',
    };
    return colors[status] || 'gray';
  },

  getPaymentStatusIcon: status => {
    const icons = {
      pending: '⏳',
      processing: '🔄',
      completed: '✅',
      failed: '❌',
      cancelled: '🚫',
      refunded: '↩️',
    };
    return icons[status] || '❓';
  },

  validatePaymentData: paymentData => {
    const errors = {};

    if (!paymentData.order_id) {
      errors.order_id = 'Order ID is required';
    }

    if (!paymentData.payment_method) {
      errors.payment_method = 'Payment method is required';
    }

    // Mobile money validation
    if (['mtn_momo', 'airtel_money'].includes(paymentData.payment_method)) {
      if (!paymentData.phone_number) {
        errors.phone_number = 'Phone number is required for mobile money payments';
      } else if (!paymentsAPI.validateUgandanPhoneNumber(paymentData.phone_number)) {
        errors.phone_number = 'Please enter a valid Ugandan phone number';
      }
    }

    // COD validation
    if (paymentData.payment_method === 'cash_on_delivery') {
      if (!paymentData.delivery_address) {
        errors.delivery_address = 'Delivery address is required for cash on delivery';
      }
      if (!paymentData.delivery_phone) {
        errors.delivery_phone = 'Delivery phone number is required for cash on delivery';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  validateUgandanPhoneNumber: phoneNumber => {
    const ugandanPatterns = [
      /^\+256[0-9]{9}$/, // +256xxxxxxxxx
      /^256[0-9]{9}$/, // 256xxxxxxxxx
      /^0[0-9]{9}$/, // 0xxxxxxxxx
      /^[0-9]{9}$/, // xxxxxxxxx
    ];

    const cleanedNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    return ugandanPatterns.some(pattern => pattern.test(cleanedNumber));
  },

  normalizePhoneNumber: phoneNumber => {
    let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');

    if (cleaned.startsWith('0')) {
      cleaned = `+256${cleaned.substring(1)}`;
    } else if (cleaned.startsWith('256')) {
      cleaned = `+${cleaned}`;
    } else if (!cleaned.startsWith('+256')) {
      cleaned = `+256${cleaned}`;
    }

    return cleaned;
  },

  detectMobileProvider: phoneNumber => {
    const normalizedNumber = paymentsAPI.normalizePhoneNumber(phoneNumber);

    // MTN Uganda prefixes
    const mtnPrefixes = ['77', '78', '76'];
    // Airtel Uganda prefixes
    const airtelPrefixes = ['70', '75', '74'];

    const prefix = normalizedNumber.substring(4, 6);

    if (mtnPrefixes.includes(prefix)) {
      return 'mtn_momo';
    } else if (airtelPrefixes.includes(prefix)) {
      return 'airtel_money';
    }

    return 'unknown';
  },

  formatCurrency: (amount, currency = 'UGX') => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },

  calculateProviderFee: (amount, paymentMethod) => {
    // Simplified fee calculation - in real app, get from payment method config
    const feeRates = {
      mtn_momo: 0.015, // 1.5%
      airtel_money: 0.015, // 1.5%
      cash_on_delivery: 0, // No fee
    };

    const rate = feeRates[paymentMethod] || 0;
    return amount * rate;
  },

  calculateTotalWithFees: (amount, paymentMethod) => {
    const fee = paymentsAPI.calculateProviderFee(amount, paymentMethod);
    return amount + fee;
  },

  isPaymentExpired: payment => {
    if (!payment.expires_at) return false;
    return new Date() > new Date(payment.expires_at);
  },

  canRetryPayment: payment => {
    return payment.status === 'failed' && !paymentsAPI.isPaymentExpired(payment);
  },

  canCancelPayment: payment => {
    return (
      ['pending', 'processing'].includes(payment.status) && !paymentsAPI.isPaymentExpired(payment)
    );
  },

  getPaymentInstructions: (paymentMethod, phoneNumber = '') => {
    const instructions = {
      mtn_momo: `
        1. Dial *165# on your MTN phone
        2. Select option 1 (Send Money)
        3. Enter merchant code when prompted
        4. Enter amount: UGX {amount}
        5. Enter PIN to confirm
        6. You will receive SMS confirmation
      `,
      airtel_money: `
        1. Dial *185# on your Airtel phone
        2. Select option 1 (Send Money)
        3. Enter merchant number when prompted
        4. Enter amount: UGX {amount}
        5. Enter PIN to confirm
        6. You will receive SMS confirmation
      `,
      cash_on_delivery: `
        1. Your order will be prepared for delivery
        2. Our delivery team will contact you
        3. Pay the exact amount in cash upon delivery
        4. Ensure you have the exact amount ready
        5. You will receive a receipt after payment
      `,
    };

    return instructions[paymentMethod] || 'Please follow the payment instructions provided.';
  },
};

export default paymentsAPI;
