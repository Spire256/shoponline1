// src/services/payment/paymentService.js
import { apiClient } from '../api/apiClient';
import { mtnService } from './mtnService';
import { airtelService } from './airtelService';
import { codService } from './codService';

/**
 * Payment Service
 * Main service for handling all payment operations
 */
class PaymentService {
  constructor() {
    this.baseURL = '/api/v1/payments';

    // Payment methods
    this.PAYMENT_METHODS = {
      MTN_MOMO: 'mtn_momo',
      AIRTEL_MONEY: 'airtel_money',
      CASH_ON_DELIVERY: 'cod',
    };

    // Payment statuses
    this.PAYMENT_STATUSES = {
      PENDING: 'pending',
      PROCESSING: 'processing',
      COMPLETED: 'completed',
      FAILED: 'failed',
      CANCELLED: 'cancelled',
      REFUNDED: 'refunded',
    };

    // Payment services
    this.paymentServices = {
      [this.PAYMENT_METHODS.MTN_MOMO]: mtnService,
      [this.PAYMENT_METHODS.AIRTEL_MONEY]: airtelService,
      [this.PAYMENT_METHODS.CASH_ON_DELIVERY]: codService,
    };
  }

  /**
   * Get available payment methods
   * @returns {Promise<Object>} Available payment methods
   */
  async getPaymentMethods() {
    try {
      const response = await apiClient.get(`${this.baseURL}/methods/`);

      return {
        success: true,
        methods: response.data.results || response.data,
        message: 'Payment methods retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        methods: [],
      };
    }
  }

  /**
   * Create a new payment
   * @param {Object} paymentData - Payment creation data
   * @returns {Promise<Object>} Payment creation result
   */
  async createPayment(paymentData) {
    try {
      const response = await apiClient.post(`${this.baseURL}/create/`, {
        order_id: paymentData.orderId,
        payment_method: paymentData.paymentMethod,
        amount: paymentData.amount,
        ...paymentData.methodSpecificData,
      });

      // Process with specific payment service
      const paymentService = this.paymentServices[paymentData.paymentMethod];
      if (paymentService && paymentService.processPayment) {
        const processingResult = await paymentService.processPayment(response.data);

        if (!processingResult.success) {
          return processingResult;
        }
      }

      return {
        success: true,
        payment: response.data,
        message: 'Payment created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        details: error.response?.data,
      };
    }
  }

  /**
   * Process payment with specific method
   * @param {string} paymentMethod - Payment method
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Payment processing result
   */
  async processPaymentMethod(paymentMethod, paymentData) {
    try {
      const paymentService = this.paymentServices[paymentMethod];

      if (!paymentService) {
        throw new Error(`Unsupported payment method: ${paymentMethod}`);
      }

      return await paymentService.processPayment(paymentData);
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Payment processing failed',
        paymentMethod,
      };
    }
  }

  /**
   * Get payment details
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Object>} Payment details
   */
  async getPayment(paymentId) {
    try {
      const response = await apiClient.get(`${this.baseURL}/${paymentId}/`);

      return {
        success: true,
        payment: response.data,
        message: 'Payment retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Get user's payment history
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Payment history
   */
  async getPaymentHistory(filters = {}) {
    try {
      const params = new URLSearchParams();

      if (filters.status) params.append('status', filters.status);
      if (filters.paymentMethod) params.append('payment_method', filters.paymentMethod);
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      if (filters.page) params.append('page', filters.page);
      if (filters.pageSize) params.append('page_size', filters.pageSize);

      const response = await apiClient.get(`${this.baseURL}/?${params}`);

      return {
        success: true,
        payments: response.data.results || response.data,
        pagination: {
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          currentPage: filters.page || 1,
          totalPages: Math.ceil(response.data.count / (filters.pageSize || 20)),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        payments: [],
      };
    }
  }

  /**
   * Verify payment status
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Object>} Payment verification result
   */
  async verifyPayment(paymentId) {
    try {
      const response = await apiClient.post(`${this.baseURL}/${paymentId}/verify/`);

      return {
        success: true,
        payment: response.data.payment,
        status: response.data.status,
        message: response.data.message || 'Payment verified successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Cancel payment
   * @param {string} paymentId - Payment ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelPayment(paymentId, reason = '') {
    try {
      const response = await apiClient.post(`${this.baseURL}/${paymentId}/cancel/`, {
        reason,
      });

      return {
        success: true,
        payment: response.data.payment,
        message: response.data.message || 'Payment cancelled successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Get payment receipt
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Object>} Payment receipt
   */
  async getPaymentReceipt(paymentId) {
    try {
      const response = await apiClient.get(`${this.baseURL}/${paymentId}/receipt/`);

      return {
        success: true,
        receipt: response.data,
        message: 'Receipt retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Check phone number for mobile money compatibility
   * @param {string} phoneNumber - Phone number to check
   * @param {string} provider - Provider (mtn or airtel)
   * @returns {Promise<Object>} Phone check result
   */
  async checkPhoneNumber(phoneNumber, provider) {
    try {
      const response = await apiClient.post(`${this.baseURL}/check-phone/`, {
        phone_number: phoneNumber,
        provider,
      });

      return {
        success: true,
        isValid: response.data.is_valid,
        provider: response.data.provider,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        isValid: false,
      };
    }
  }

  /**
   * Calculate payment fees
   * @param {string} paymentMethod - Payment method
   * @param {number} amount - Payment amount
   * @returns {Promise<Object>} Fee calculation result
   */
  async calculateFees(paymentMethod, amount) {
    try {
      // This would typically be an API call, but for now we'll calculate locally
      const feeStructure = {
        [this.PAYMENT_METHODS.MTN_MOMO]: {
          fixed: 500, // UGX 500 fixed fee
          percentage: 0.005, // 0.5%
        },
        [this.PAYMENT_METHODS.AIRTEL_MONEY]: {
          fixed: 500, // UGX 500 fixed fee
          percentage: 0.005, // 0.5%
        },
        [this.PAYMENT_METHODS.CASH_ON_DELIVERY]: {
          fixed: 0,
          percentage: 0,
        },
      };

      const fees = feeStructure[paymentMethod] || { fixed: 0, percentage: 0 };
      const calculatedFee = fees.fixed + amount * fees.percentage;
      const totalAmount = amount + calculatedFee;

      return {
        success: true,
        originalAmount: amount,
        fees: calculatedFee,
        totalAmount: totalAmount,
        breakdown: {
          fixedFee: fees.fixed,
          percentageFee: amount * fees.percentage,
          percentageRate: fees.percentage * 100,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Fee calculation failed',
        originalAmount: amount,
        fees: 0,
        totalAmount: amount,
      };
    }
  }

  /**
   * Get payment status display info
   * @param {string} status - Payment status
   * @returns {Object} Status display information
   */
  getPaymentStatusInfo(status) {
    const statusInfo = {
      [this.PAYMENT_STATUSES.PENDING]: {
        label: 'Pending',
        color: 'warning',
        icon: 'clock',
        description: 'Payment is waiting to be processed',
      },
      [this.PAYMENT_STATUSES.PROCESSING]: {
        label: 'Processing',
        color: 'info',
        icon: 'loader',
        description: 'Payment is being processed',
      },
      [this.PAYMENT_STATUSES.COMPLETED]: {
        label: 'Completed',
        color: 'success',
        icon: 'check-circle',
        description: 'Payment completed successfully',
      },
      [this.PAYMENT_STATUSES.FAILED]: {
        label: 'Failed',
        color: 'error',
        icon: 'x-circle',
        description: 'Payment failed to process',
      },
      [this.PAYMENT_STATUSES.CANCELLED]: {
        label: 'Cancelled',
        color: 'secondary',
        icon: 'x',
        description: 'Payment was cancelled',
      },
      [this.PAYMENT_STATUSES.REFUNDED]: {
        label: 'Refunded',
        color: 'info',
        icon: 'arrow-left',
        description: 'Payment was refunded',
      },
    };

    return (
      statusInfo[status] || {
        label: status,
        color: 'secondary',
        icon: 'help-circle',
        description: 'Unknown payment status',
      }
    );
  }

  /**
   * Get payment method display info
   * @param {string} method - Payment method
   * @returns {Object} Method display information
   */
  getPaymentMethodInfo(method) {
    const methodInfo = {
      [this.PAYMENT_METHODS.MTN_MOMO]: {
        label: 'MTN Mobile Money',
        shortLabel: 'MTN MoMo',
        icon: 'smartphone',
        color: '#FFCC00',
        description: 'Pay with MTN Mobile Money',
        instructions: 'Enter your MTN phone number to complete payment',
      },
      [this.PAYMENT_METHODS.AIRTEL_MONEY]: {
        label: 'Airtel Money',
        shortLabel: 'Airtel',
        icon: 'smartphone',
        color: '#FF0000',
        description: 'Pay with Airtel Money',
        instructions: 'Enter your Airtel phone number to complete payment',
      },
      [this.PAYMENT_METHODS.CASH_ON_DELIVERY]: {
        label: 'Cash on Delivery',
        shortLabel: 'COD',
        icon: 'truck',
        color: '#10B981',
        description: 'Pay when your order is delivered',
        instructions: 'Pay cash when your order is delivered to your address',
      },
    };

    return (
      methodInfo[method] || {
        label: method,
        shortLabel: method,
        icon: 'credit-card',
        color: '#6B7280',
        description: 'Unknown payment method',
        instructions: '',
      }
    );
  }

  /**
   * Validate payment data
   * @param {string} paymentMethod - Payment method
   * @param {Object} paymentData - Payment data to validate
   * @returns {Object} Validation result
   */
  validatePaymentData(paymentMethod, paymentData) {
    const validation = {
      isValid: false,
      errors: {},
      warnings: [],
    };

    // Common validation
    if (!paymentData.amount || paymentData.amount <= 0) {
      validation.errors.amount = 'Payment amount must be greater than 0';
    }

    if (paymentData.amount > 5000000) {
      // 5 million UGX limit
      validation.errors.amount = 'Payment amount exceeds maximum limit';
    }

    if (!paymentData.orderId) {
      validation.errors.orderId = 'Order ID is required';
    }

    // Method-specific validation
    switch (paymentMethod) {
      case this.PAYMENT_METHODS.MTN_MOMO:
      case this.PAYMENT_METHODS.AIRTEL_MONEY:
        if (!paymentData.phoneNumber) {
          validation.errors.phoneNumber = 'Phone number is required for mobile money payments';
        } else if (!this.isValidUgandanPhoneNumber(paymentData.phoneNumber)) {
          validation.errors.phoneNumber = 'Please enter a valid Ugandan phone number';
        }
        break;

      case this.PAYMENT_METHODS.CASH_ON_DELIVERY:
        if (!paymentData.deliveryAddress) {
          validation.errors.deliveryAddress = 'Delivery address is required for COD';
        }
        if (!paymentData.deliveryPhone) {
          validation.errors.deliveryPhone = 'Delivery phone number is required for COD';
        }
        break;
    }

    validation.isValid = Object.keys(validation.errors).length === 0;
    return validation;
  }

  /**
   * Validate Ugandan phone number
   * @param {string} phoneNumber - Phone number to validate
   * @returns {boolean} True if valid Ugandan phone number
   */
  isValidUgandanPhoneNumber(phoneNumber) {
    // Remove spaces and dashes
    const cleaned = phoneNumber.replace(/[\s-]/g, '');

    // Ugandan phone number patterns
    const patterns = [
      /^(\+256|256)[0-9]{9}$/, // +256XXXXXXXXX or 256XXXXXXXXX
      /^0[0-9]{9}$/, // 0XXXXXXXXX
    ];

    return patterns.some(pattern => pattern.test(cleaned));
  }

  /**
   * Format phone number for API
   * @param {string} phoneNumber - Phone number to format
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(phoneNumber) {
    let cleaned = phoneNumber.replace(/[\s-]/g, '');

    // Convert to international format
    if (cleaned.startsWith('0')) {
      cleaned = `+256${cleaned.slice(1)}`;
    } else if (cleaned.startsWith('256')) {
      cleaned = `+${cleaned}`;
    } else if (!cleaned.startsWith('+256')) {
      cleaned = `+256${cleaned}`;
    }

    return cleaned;
  }

  /**
   * Get payment retry options
   * @param {Object} payment - Payment object
   * @returns {Object} Retry options
   */
  getRetryOptions(payment) {
    const options = {
      canRetry: false,
      retryMethods: [],
      reason: '',
    };

    if (payment.status === this.PAYMENT_STATUSES.FAILED) {
      options.canRetry = true;
      options.retryMethods = [payment.payment_method]; // Same method first

      // Suggest alternative methods
      if (payment.payment_method === this.PAYMENT_METHODS.MTN_MOMO) {
        options.retryMethods.push(
          this.PAYMENT_METHODS.AIRTEL_MONEY,
          this.PAYMENT_METHODS.CASH_ON_DELIVERY
        );
      } else if (payment.payment_method === this.PAYMENT_METHODS.AIRTEL_MONEY) {
        options.retryMethods.push(
          this.PAYMENT_METHODS.MTN_MOMO,
          this.PAYMENT_METHODS.CASH_ON_DELIVERY
        );
      }
    }

    return options;
  }

  /**
   * Format currency amount
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code (default: UGX)
   * @returns {string} Formatted currency string
   */
  formatCurrency(amount, currency = 'UGX') {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Get payment timeline
   * @param {Object} payment - Payment object
   * @returns {Array} Payment timeline events
   */
  getPaymentTimeline(payment) {
    const timeline = [];

    timeline.push({
      status: 'created',
      timestamp: payment.created_at,
      title: 'Payment Created',
      description: `Payment initiated for ${this.formatCurrency(payment.amount)}`,
      icon: 'plus-circle',
      color: 'blue',
    });

    if (payment.status === this.PAYMENT_STATUSES.PROCESSING) {
      timeline.push({
        status: 'processing',
        timestamp: payment.updated_at,
        title: 'Payment Processing',
        description: 'Payment is being processed by provider',
        icon: 'loader',
        color: 'yellow',
      });
    }

    if (payment.status === this.PAYMENT_STATUSES.COMPLETED) {
      timeline.push({
        status: 'completed',
        timestamp: payment.processed_at || payment.updated_at,
        title: 'Payment Completed',
        description: 'Payment completed successfully',
        icon: 'check-circle',
        color: 'green',
      });
    }

    if (payment.status === this.PAYMENT_STATUSES.FAILED) {
      timeline.push({
        status: 'failed',
        timestamp: payment.updated_at,
        title: 'Payment Failed',
        description: payment.failure_reason || 'Payment processing failed',
        icon: 'x-circle',
        color: 'red',
      });
    }

    if (payment.status === this.PAYMENT_STATUSES.CANCELLED) {
      timeline.push({
        status: 'cancelled',
        timestamp: payment.updated_at,
        title: 'Payment Cancelled',
        description: 'Payment was cancelled',
        icon: 'x',
        color: 'gray',
      });
    }

    return timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  /**
   * Check if payment method is available
   * @param {string} method - Payment method to check
   * @returns {Promise<Object>} Availability check result
   */
  async isPaymentMethodAvailable(method) {
    try {
      const methods = await this.getPaymentMethods();

      if (!methods.success) {
        return { available: false, reason: 'Could not fetch payment methods' };
      }

      const availableMethod = methods.methods.find(m => m.payment_method === method);

      if (!availableMethod) {
        return { available: false, reason: 'Payment method not found' };
      }

      if (!availableMethod.is_active) {
        return { available: false, reason: 'Payment method is currently disabled' };
      }

      return {
        available: true,
        method: availableMethod,
        minAmount: availableMethod.min_amount,
        maxAmount: availableMethod.max_amount,
      };
    } catch (error) {
      return { available: false, reason: 'Error checking payment method availability' };
    }
  }

  /**
   * Get payment statistics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Payment statistics
   */
  async getPaymentStatistics(filters = {}) {
    try {
      const payments = await this.getPaymentHistory(filters);

      if (!payments.success) {
        return { success: false, error: payments.error };
      }

      const stats = {
        total: payments.payments.length,
        completed: 0,
        pending: 0,
        failed: 0,
        cancelled: 0,
        totalAmount: 0,
        completedAmount: 0,
        methodBreakdown: {},
        statusBreakdown: {},
      };

      payments.payments.forEach(payment => {
        // Status breakdown
        stats.statusBreakdown[payment.status] = (stats.statusBreakdown[payment.status] || 0) + 1;

        // Method breakdown
        stats.methodBreakdown[payment.payment_method] =
          (stats.methodBreakdown[payment.payment_method] || 0) + 1;

        // Amount calculations
        stats.totalAmount += parseFloat(payment.amount);

        if (payment.status === this.PAYMENT_STATUSES.COMPLETED) {
          stats.completed++;
          stats.completedAmount += parseFloat(payment.amount);
        } else if (payment.status === this.PAYMENT_STATUSES.PENDING) {
          stats.pending++;
        } else if (payment.status === this.PAYMENT_STATUSES.FAILED) {
          stats.failed++;
        } else if (payment.status === this.PAYMENT_STATUSES.CANCELLED) {
          stats.cancelled++;
        }
      });

      return { success: true, statistics: stats };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Create and export singleton instance
const paymentService = new PaymentService();
export { paymentService };
