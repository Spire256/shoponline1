// src/services/payment/airtelService.js
import { apiClient } from '../api/apiClient';

/**
 * Airtel Money Service
 * Handles Airtel Money payment processing
 */
class AirtelService {
  constructor() {
    this.baseURL = '/api/v1/payments';
    this.provider = 'airtel';
  }

  /**
   * Process Airtel Money payment
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Processing result
   */
  async processPayment(paymentData) {
    try {
      // Validate Airtel payment data
      const validation = this.validateAirtelPaymentData(paymentData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          details: validation.errors,
        };
      }

      const formattedPhone = this.formatPhoneNumber(paymentData.phoneNumber);

      // Check if phone number is valid Airtel number
      const phoneCheck = await this.checkAirtelPhoneNumber(formattedPhone);
      if (!phoneCheck.isValid) {
        return {
          success: false,
          error: 'Invalid Airtel phone number',
          message: 'Please enter a valid Airtel phone number',
        };
      }

      // Process payment via API
      const response = await apiClient.post(`${this.baseURL}/create/`, {
        order_id: paymentData.orderId,
        payment_method: 'airtel_money',
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
        message: 'Airtel payment initiated. Please check your phone for the payment prompt.',
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
   * Check Airtel phone number validity
   * @param {string} phoneNumber - Phone number to check
   * @returns {Promise<Object>} Validation result
   */
  async checkAirtelPhoneNumber(phoneNumber) {
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
   * Verify Airtel payment status
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
   * Cancel Airtel payment
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
        message: 'Airtel payment cancelled successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Get Airtel account balance (admin only)
   * @returns {Promise<Object>} Balance information
   */
  async getAccountBalance() {
    try {
      const response = await apiClient.get(`${this.baseURL}/admin/airtel/balance/`);

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
   * Validate Airtel payment data
   * @param {Object} paymentData - Payment data to validate
   * @returns {Object} Validation result
   */
  validateAirtelPaymentData(paymentData) {
    const validation = {
      isValid: false,
      errors: {},
    };

    if (!paymentData.phoneNumber) {
      validation.errors.phoneNumber = 'Phone number is required';
    } else if (!this.isValidAirtelNumber(paymentData.phoneNumber)) {
      validation.errors.phoneNumber = 'Please enter a valid Airtel phone number';
    }

    if (!paymentData.amount || paymentData.amount <= 0) {
      validation.errors.amount = 'Payment amount must be greater than 0';
    }

    if (paymentData.amount < 500) {
      validation.errors.amount = 'Minimum payment amount is UGX 500';
    }

    if (paymentData.amount > 5000000) {
      validation.errors.amount = 'Maximum payment amount is UGX 5,000,000';
    }

    if (!paymentData.orderId) {
      validation.errors.orderId = 'Order ID is required';
    }

    validation.isValid = Object.keys(validation.errors).length === 0;
    return validation;
  }

  /**
   * Check if phone number is valid Airtel number
   * @param {string} phoneNumber - Phone number to check
   * @returns {boolean} True if valid Airtel number
   */
  isValidAirtelNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/[\s-]/g, '');

    // Airtel Uganda prefixes: 070, 075, 020
    const airtelPatterns = [
      /^(\+256|256|0)70[0-9]{7}$/,
      /^(\+256|256|0)75[0-9]{7}$/,
      /^(\+256|256|0)20[0-9]{7}$/,
    ];

    return airtelPatterns.some(pattern => pattern.test(cleaned));
  }

  /**
   * Format phone number for Airtel API
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
        'You will receive a payment prompt on your Airtel phone',
        'Enter your Airtel Money PIN to authorize the payment',
        'Wait for payment confirmation',
        'Your order will be processed once payment is confirmed',
      ],
      tips: [
        'Ensure your Airtel Money account has sufficient balance',
        'Keep your phone nearby to receive the payment prompt',
        'The payment will timeout in 2 minutes if not completed',
        "Contact support if you don't receive the payment prompt",
      ],
      troubleshooting: {
        'No payment prompt': 'Check if your phone number is correct and Airtel service is active',
        'Insufficient balance': 'Top up your Airtel Money account and try again',
        'PIN incorrect': 'Enter your correct Airtel Money PIN',
        'Transaction timeout': 'Try the payment again within the time limit',
      },
    };
  }

  /**
   * Get Airtel transaction fees
   * @param {number} amount - Transaction amount
   * @returns {Object} Fee information
   */
  calculateFees(amount) {
    // Airtel fee structure (example - should be updated with actual rates)
    let fee = 0;

    if (amount <= 2500) {
      fee = 100;
    } else if (amount <= 5000) {
      fee = 200;
    } else if (amount <= 15000) {
      fee = 300;
    } else if (amount <= 50000) {
      fee = 500;
    } else if (amount <= 250000) {
      fee = 1000;
    } else {
      fee = amount * 0.004; // 0.4% for amounts above 250,000
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
      processing: 'Waiting for your confirmation on Airtel',
      completed: 'Payment completed successfully!',
      failed: 'Payment failed. Please try again.',
      cancelled: 'Payment was cancelled.',
      timeout: 'Payment timed out. Please try again.',
    };

    return statusMessages[status] || 'Unknown payment status';
  }

  /**
   * Parse Airtel error codes
   * @param {string} errorCode - Airtel error code
   * @returns {string} User-friendly error message
   */
  parseErrorCode(errorCode) {
    const errorMessages = {
      TS: 'Transaction successful',
      TF: 'Transaction failed - insufficient balance or other error',
      TA: 'Transaction ambiguous - please contact support',
      TIP: 'Transaction in progress - please wait',
      TUP: 'Transaction pending user approval',
      TNF: 'Transaction not found',
      INSUFFICIENT_BALANCE: 'Insufficient balance in your Airtel Money account',
      INVALID_PIN: 'Incorrect Airtel Money PIN entered',
      TRANSACTION_TIMEOUT: 'Transaction timed out. Please try again',
      USER_CANCELLED: 'Transaction was cancelled by user',
      NETWORK_ERROR: 'Network error. Please check your connection and try again',
      SERVICE_UNAVAILABLE: 'Airtel Money service is temporarily unavailable',
      INVALID_PHONE: 'Invalid phone number. Please check and try again',
      TRANSACTION_LIMIT: 'Transaction amount exceeds your daily limit',
    };

    return errorMessages[errorCode] || 'An error occurred during payment processing';
  }

  /**
   * Check Airtel service status
   * @returns {Promise<Object>} Service status
   */
  async checkServiceStatus() {
    try {
      const response = await apiClient.get(`${this.baseURL}/admin/airtel/status/`);

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
   * Retry failed Airtel payment
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
   * Get Airtel payment analytics
   * @param {Object} dateRange - Date range for analytics
   * @returns {Promise<Object>} Analytics data
   */
  async getPaymentAnalytics(dateRange = {}) {
    try {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('start_date', dateRange.startDate);
      if (dateRange.endDate) params.append('end_date', dateRange.endDate);
      params.append('payment_method', 'airtel_money');

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
   * Get Airtel daily transaction limits
   * @returns {Object} Transaction limits
   */
  getTransactionLimits() {
    return {
      individual: {
        daily: 5000000, // UGX 5M
        monthly: 50000000, // UGX 50M
        single: 5000000, // UGX 5M per transaction
      },
      business: {
        daily: 100000000, // UGX 100M
        monthly: 500000000, // UGX 500M
        single: 20000000, // UGX 20M per transaction
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
   * Generate Airtel payment reference
   * @returns {string} Unique payment reference
   */
  generatePaymentReference() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `AML${timestamp.slice(-8)}${random}`;
  }

  /**
   * Format Airtel transaction history for display
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
      description: `Airtel Payment - ${transaction.reference_number}`,
    }));
  }

  /**
   * Get Airtel network coverage info
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
      supportContact: '175', // Airtel customer care
    };
  }

  /**
   * Get Airtel promotional offers (if any)
   * @returns {Array} Current promotional offers
   */
  getPromotionalOffers() {
    return [
      {
        title: 'New User Bonus',
        description: 'Get 50% off transaction fees for your first 3 payments',
        validUntil: '2024-12-31',
        minAmount: 1000,
        maxDiscount: 1000,
        isActive: true,
      },
      {
        title: 'High Value Discount',
        description: 'Reduced fees for transactions above UGX 100,000',
        minAmount: 100000,
        discount: 0.3, // 30% off
        isActive: true,
      },
    ];
  }

  /**
   * Validate Airtel account status
   * @param {string} phoneNumber - Phone number to validate
   * @returns {Promise<Object>} Account validation result
   */
  async validateAccount(phoneNumber) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const response = await apiClient.post(`${this.baseURL}/validate-account/`, {
        phone_number: formattedPhone,
        provider: 'airtel',
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
    // Exponential backoff: 2^attempt * 1500ms, max 45 seconds
    const delay = Math.min(Math.pow(2, attemptCount) * 1500, 45000);
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
      interval = 4000, // 4 seconds (Airtel can be slower)
      maxAttempts = 30, // 2 minutes total
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

  /**
   * Get user details from Airtel Money
   * @param {string} phoneNumber - Phone number to check
   * @returns {Promise<Object>} User details result
   */
  async getUserDetails(phoneNumber) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const response = await apiClient.post(`${this.baseURL}/airtel/user-details/`, {
        phone_number: formattedPhone,
      });

      return {
        success: true,
        userDetails: response.data.data,
        isValid: response.data.is_valid,
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
   * Get Airtel Money service configuration
   * @returns {Object} Service configuration
   */
  getServiceConfig() {
    return {
      provider: 'airtel',
      displayName: 'Airtel Money',
      currency: 'UGX',
      country: 'Uganda',
      timeout: 120000, // 2 minutes
      retryAttempts: 3,
      pollingInterval: 4000,
      supportedOperations: [
        'payment',
        'verification',
        'cancellation',
        'balance_check',
        'user_validation',
      ],
      features: {
        realTimeNotification: true,
        bulkPayments: false,
        recurringPayments: false,
        internationalTransfers: false,
      },
    };
  }
}

// Create and export singleton instance
const airtelService = new AirtelService();
export { airtelService };
