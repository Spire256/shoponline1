// src/services/payment/mtnService.js
import { apiClient } from '../api/apiClient';

/**
 * MTN Mobile Money Service
 * Handles MTN Mobile Money payment processing
 */
class MTNService {
  constructor() {
    this.baseURL = '/api/v1/payments';
    this.provider = 'mtn';
  }

  /**
   * Process MTN Mobile Money payment
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Processing result
   */
  async processPayment(paymentData) {
    try {
      // Validate MTN payment data
      const validation = this.validateMTNPaymentData(paymentData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          details: validation.errors,
        };
      }

      const formattedPhone = this.formatPhoneNumber(paymentData.phoneNumber);

      // Check if phone number is valid MTN number
      const phoneCheck = await this.checkMTNPhoneNumber(formattedPhone);
      if (!phoneCheck.isValid) {
        return {
          success: false,
          error: 'Invalid MTN phone number',
          message: 'Please enter a valid MTN phone number',
        };
      }

      // Process payment via API
      const response = await apiClient.post(`${this.baseURL}/create/`, {
        order_id: paymentData.orderId,
        payment_method: 'mtn_momo',
        amount: paymentData.amount,
        phone_number: formattedPhone,
        customer_name: paymentData.customerName || '',
        callback_url: paymentData.callbackUrl,
      });

      return {
        success: true,
        payment: response.data,
        paymentId: response.data.id,
        referenceNumber: response.data.reference_number,
        message: 'MTN payment initiated. Please check your phone for the payment prompt.',
        instructions: this.getPaymentInstructions(),
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
   * Check MTN phone number validity
   * @param {string} phoneNumber - Phone number to check
   * @returns {Promise<Object>} Validation result
   */
  async checkMTNPhoneNumber(phoneNumber) {
    try {
      const response = await apiClient.post(`${this.baseURL}/check-phone/`, {
        phone_number: phoneNumber,
        provider: this.provider,
      });

      return {
        isValid: response.data.is_valid,
        provider: response.data.provider,
        message: response.data.message,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Verify MTN payment status
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Object>} Verification result
   */
  async verifyPayment(paymentId) {
    try {
      const response = await apiClient.post(`${this.baseURL}/${paymentId}/verify/`);

      return {
        success: true,
        status: response.data.status,
        payment: response.data.payment,
        providerStatus: response.data.provider_status,
        transactionId: response.data.transaction_id,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Cancel MTN payment
   * @param {string} paymentId - Payment ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelPayment(paymentId, reason = 'User cancelled') {
    try {
      const response = await apiClient.post(`${this.baseURL}/${paymentId}/cancel/`, {
        reason,
      });

      return {
        success: true,
        payment: response.data.payment,
        message: 'MTN payment cancelled successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Get MTN account balance (admin only)
   * @returns {Promise<Object>} Balance information
   */
  async getAccountBalance() {
    try {
      const response = await apiClient.get(`${this.baseURL}/admin/mtn/balance/`);

      return {
        success: true,
        balance: response.data.balance,
        currency: response.data.currency,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Validate MTN payment data
   * @param {Object} paymentData - Payment data to validate
   * @returns {Object} Validation result
   */
  validateMTNPaymentData(paymentData) {
    const validation = {
      isValid: false,
      errors: {},
    };

    if (!paymentData.phoneNumber) {
      validation.errors.phoneNumber = 'Phone number is required';
    } else if (!this.isValidMTNNumber(paymentData.phoneNumber)) {
      validation.errors.phoneNumber = 'Please enter a valid MTN phone number';
    }

    if (!paymentData.amount || paymentData.amount <= 0) {
      validation.errors.amount = 'Payment amount must be greater than 0';
    }

    if (paymentData.amount < 500) {
      validation.errors.amount = 'Minimum payment amount is UGX 500';
    }

    if (paymentData.amount > 2500000) {
      validation.errors.amount = 'Maximum payment amount is UGX 2,500,000';
    }

    if (!paymentData.orderId) {
      validation.errors.orderId = 'Order ID is required';
    }

    validation.isValid = Object.keys(validation.errors).length === 0;
    return validation;
  }

  /**
   * Check if phone number is valid MTN number
   * @param {string} phoneNumber - Phone number to check
   * @returns {boolean} True if valid MTN number
   */
  isValidMTNNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/[\s-]/g, '');

    // MTN Uganda prefixes: 077, 078, 039
    const mtnPatterns = [
      /^(\+256|256|0)77[0-9]{7}$/,
      /^(\+256|256|0)78[0-9]{7}$/,
      /^(\+256|256|0)39[0-9]{7}$/,
    ];

    return mtnPatterns.some(pattern => pattern.test(cleaned));
  }

  /**
   * Format phone number for MTN API
   * @param {string} phoneNumber - Phone number to format
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(phoneNumber) {
    let cleaned = phoneNumber.replace(/[\s-]/g, '');

    // Convert to international format without + sign
    if (cleaned.startsWith('0')) {
      cleaned = `256${cleaned.slice(1)}`;
    } else if (cleaned.startsWith('+256')) {
      cleaned = cleaned.slice(1);
    } else if (!cleaned.startsWith('256')) {
      cleaned = `256${cleaned}`;
    }

    return cleaned;
  }

  /**
   * Get payment instructions for users
   * @returns {Object} Payment instructions
   */
  getPaymentInstructions() {
    return {
      steps: [
        'You will receive a payment prompt on your MTN phone',
        'Enter your MTN Mobile Money PIN to confirm',
        'Wait for payment confirmation',
        'Your order will be processed once payment is confirmed',
      ],
      tips: [
        'Ensure your MTN Mobile Money account has sufficient balance',
        'Keep your phone nearby to receive the payment prompt',
        'The payment will timeout in 2 minutes if not completed',
        "Contact support if you don't receive the payment prompt",
      ],
      troubleshooting: {
        'No payment prompt': 'Check if your phone number is correct and MTN service is active',
        'Insufficient balance': 'Top up your MTN Mobile Money account and try again',
        'PIN incorrect': 'Enter your correct MTN Mobile Money PIN',
        'Transaction timeout': 'Try the payment again within the time limit',
      },
    };
  }

  /**
   * Get MTN transaction fees
   * @param {number} amount - Transaction amount
   * @returns {Object} Fee information
   */
  calculateFees(amount) {
    // MTN fee structure (example - should be updated with actual rates)
    let fee = 0;

    if (amount <= 2500) {
      fee = 110;
    } else if (amount <= 5000) {
      fee = 220;
    } else if (amount <= 15000) {
      fee = 330;
    } else if (amount <= 50000) {
      fee = 550;
    } else if (amount <= 250000) {
      fee = 1100;
    } else {
      fee = amount * 0.005; // 0.5% for amounts above 250,000
    }

    return {
      amount: amount,
      fee: fee,
      total: amount + fee,
      feePercentage: (fee / amount) * 100,
    };
  }

  /**
   * Get payment status message
   * @param {string} status - Payment status
   * @returns {string} User-friendly status message
   */
  getStatusMessage(status) {
    const statusMessages = {
      pending: 'Payment is being processed...',
      processing: 'Waiting for your confirmation on MTN',
      completed: 'Payment completed successfully!',
      failed: 'Payment failed. Please try again.',
      cancelled: 'Payment was cancelled.',
      timeout: 'Payment timed out. Please try again.',
    };

    return statusMessages[status] || 'Unknown payment status';
  }

  /**
   * Parse MTN error codes
   * @param {string} errorCode - MTN error code
   * @returns {string} User-friendly error message
   */
  parseErrorCode(errorCode) {
    const errorMessages = {
      INSUFFICIENT_BALANCE: 'Insufficient balance in your MTN Mobile Money account',
      INVALID_PIN: 'Incorrect MTN Mobile Money PIN entered',
      TRANSACTION_TIMEOUT: 'Transaction timed out. Please try again',
      USER_CANCELLED: 'Transaction was cancelled by user',
      NETWORK_ERROR: 'Network error. Please check your connection and try again',
      SERVICE_UNAVAILABLE: 'MTN Mobile Money service is temporarily unavailable',
      INVALID_PHONE: 'Invalid phone number. Please check and try again',
      TRANSACTION_LIMIT: 'Transaction amount exceeds your daily limit',
    };

    return errorMessages[errorCode] || 'An error occurred during payment processing';
  }

  /**
   * Check MTN service status
   * @returns {Promise<Object>} Service status
   */
  async checkServiceStatus() {
    try {
      const response = await apiClient.get(`${this.baseURL}/admin/mtn/status/`);

      return {
        success: true,
        status: response.data.status,
        isActive: response.data.is_active,
        message: response.data.message,
        lastChecked: response.data.last_checked,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        status: 'unknown',
      };
    }
  }

  /**
   * Retry failed MTN payment
   * @param {string} paymentId - Payment ID to retry
   * @returns {Promise<Object>} Retry result
   */
  async retryPayment(paymentId) {
    try {
      const response = await apiClient.post(`${this.baseURL}/admin/${paymentId}/retry/`);

      return {
        success: true,
        payment: response.data.payment,
        message: 'Payment retry initiated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Get MTN payment analytics
   * @param {Object} dateRange - Date range for analytics
   * @returns {Promise<Object>} Analytics data
   */
  async getPaymentAnalytics(dateRange = {}) {
    try {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('start_date', dateRange.startDate);
      if (dateRange.endDate) params.append('end_date', dateRange.endDate);
      params.append('payment_method', 'mtn_momo');

      const response = await apiClient.get(`${this.baseURL}/admin/analytics/?${params}`);

      return {
        success: true,
        analytics: response.data,
        totalTransactions: response.data.total_transactions,
        successfulTransactions: response.data.successful_transactions,
        successRate: response.data.success_rate,
        totalAmount: response.data.total_amount,
        averageAmount: response.data.average_amount,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Get MTN daily transaction limits
   * @returns {Object} Transaction limits
   */
  getTransactionLimits() {
    return {
      individual: {
        daily: 2500000, // UGX 2.5M
        monthly: 20000000, // UGX 20M
        single: 2500000, // UGX 2.5M per transaction
      },
      business: {
        daily: 50000000, // UGX 50M
        monthly: 200000000, // UGX 200M
        single: 10000000, // UGX 10M per transaction
      },
      minimum: 500, // UGX 500
    };
  }

  /**
   * Check if amount is within limits
   * @param {number} amount - Amount to check
   * @param {string} accountType - Account type (individual/business)
   * @returns {Object} Limit check result
   */
  checkTransactionLimits(amount, accountType = 'individual') {
    const limits = this.getTransactionLimits();
    const accountLimits = limits[accountType] || limits.individual;

    const result = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    if (amount < limits.minimum) {
      result.isValid = false;
      result.errors.push(`Minimum transaction amount is UGX ${limits.minimum.toLocaleString()}`);
    }

    if (amount > accountLimits.single) {
      result.isValid = false;
      result.errors.push(
        `Maximum single transaction amount is UGX ${accountLimits.single.toLocaleString()}`
      );
    }

    if (amount > accountLimits.single * 0.8) {
      result.warnings.push('Transaction amount is close to the maximum limit');
    }

    return result;
  }

  /**
   * Generate MTN payment reference
   * @returns {string} Unique payment reference
   */
  generatePaymentReference() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `MTN${timestamp.slice(-8)}${random}`;
  }

  /**
   * Format MTN transaction history for display
   * @param {Array} transactions - Raw transaction data
   * @returns {Array} Formatted transactions
   */
  formatTransactionHistory(transactions) {
    return transactions.map(transaction => ({
      id: transaction.id,
      reference: transaction.reference_number,
      amount: parseFloat(transaction.amount),
      status: transaction.status,
      statusMessage: this.getStatusMessage(transaction.status),
      phoneNumber: transaction.mobile_money_details?.phone_number,
      customerName: transaction.mobile_money_details?.customer_name,
      createdAt: new Date(transaction.created_at),
      updatedAt: new Date(transaction.updated_at),
      providerReference: transaction.mobile_money_details?.provider_transaction_id,
      fees: parseFloat(transaction.provider_fee || 0),
      description: `MTN Payment - ${transaction.reference_number}`,
    }));
  }

  /**
   * Get MTN network coverage info
   * @returns {Object} Network coverage information
   */
  getNetworkCoverage() {
    return {
      coverage: 'nationwide',
      regions: [
        'Central Region',
        'Western Region',
        'Eastern Region',
        'Northern Region',
        'Southwestern Region',
      ],
      majorTowns: [
        'Kampala',
        'Entebbe',
        'Jinja',
        'Mbale',
        'Gulu',
        'Mbarara',
        'Fort Portal',
        'Masaka',
        'Soroti',
        'Arua',
      ],
      serviceHours: '24/7',
      supportContact: '100', // MTN customer care
    };
  }

  /**
   * Get MTN promotional offers (if any)
   * @returns {Array} Current promotional offers
   */
  getPromotionalOffers() {
    return [
      {
        title: 'Zero Fees on First Payment',
        description: 'No transaction fees on your first MTN Mobile Money payment',
        validUntil: '2024-12-31',
        minAmount: 1000,
        maxAmount: 50000,
        isActive: true,
      },
      {
        title: 'Weekend Special',
        description: '50% off transaction fees on weekends',
        validDays: ['Saturday', 'Sunday'],
        discount: 0.5,
        isActive: false,
      },
    ];
  }

  /**
   * Validate MTN account status
   * @param {string} phoneNumber - Phone number to validate
   * @returns {Promise<Object>} Account validation result
   */
  async validateAccount(phoneNumber) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const response = await apiClient.post(`${this.baseURL}/validate-account/`, {
        phone_number: formattedPhone,
        provider: 'mtn',
      });

      return {
        success: true,
        isActive: response.data.is_active,
        accountType: response.data.account_type,
        accountName: response.data.account_name,
        status: response.data.status,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        isActive: false,
      };
    }
  }

  /**
   * Get recommended retry delay for failed transactions
   * @param {number} attemptCount - Number of previous attempts
   * @returns {number} Delay in milliseconds
   */
  getRetryDelay(attemptCount) {
    // Exponential backoff: 2^attempt * 1000ms, max 30 seconds
    const delay = Math.min(Math.pow(2, attemptCount) * 1000, 30000);
    return delay;
  }

  /**
   * Create payment verification polling function
   * @param {string} paymentId - Payment ID to poll
   * @param {Function} onUpdate - Callback for status updates
   * @param {Object} options - Polling options
   * @returns {Function} Stop polling function
   */
  createPaymentPolling(paymentId, onUpdate, options = {}) {
    const {
      interval = 3000, // 3 seconds
      maxAttempts = 40, // 2 minutes total
      timeout = 120000, // 2 minutes timeout
    } = options;

    let attempts = 0;
    const startTime = Date.now();
    let intervalId;

    const poll = async () => {
      try {
        attempts++;

        // Check timeout
        if (Date.now() - startTime > timeout) {
          clearInterval(intervalId);
          onUpdate({ status: 'timeout', error: 'Payment verification timeout' });
          return;
        }

        // Check max attempts
        if (attempts > maxAttempts) {
          clearInterval(intervalId);
          onUpdate({ status: 'max_attempts', error: 'Maximum verification attempts reached' });
          return;
        }

        const result = await this.verifyPayment(paymentId);

        if (result.success) {
          onUpdate({
            status: result.status,
            payment: result.payment,
            attempt: attempts,
          });

          // Stop polling if payment is completed, failed, or cancelled
          if (['completed', 'failed', 'cancelled'].includes(result.status)) {
            clearInterval(intervalId);
          }
        } else {
          onUpdate({
            status: 'error',
            error: result.error,
            attempt: attempts,
          });
        }
      } catch (error) {
        onUpdate({
          status: 'error',
          error: error.message,
          attempt: attempts,
        });
      }
    };

    // Start polling
    intervalId = setInterval(poll, interval);
    poll(); // Initial poll

    // Return function to stop polling
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }
}

// Create and export singleton instance
const mtnService = new MTNService();
export { mtnService };
