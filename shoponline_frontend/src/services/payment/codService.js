// src/services/payment/codService.js
import { apiClient } from '../api/apiClient';

/**
 * Cash on Delivery Service
 * Handles Cash on Delivery payment processing and management
 */
class CODService {
  constructor() {
    this.baseURL = '/api/v1/payments';
    this.paymentMethod = 'cod';
  }

  /**
   * Process Cash on Delivery payment
   * @param {Object} paymentData - Payment data including delivery details
   * @returns {Promise<Object>} Processing result
   */
  async processPayment(paymentData) {
    try {
      // Validate COD payment data
      const validation = this.validateCODPaymentData(paymentData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          details: validation.errors,
        };
      }

      // Process COD payment via API
      const response = await apiClient.post(`${this.baseURL}/create/`, {
        order_id: paymentData.orderId,
        payment_method: 'cod',
        amount: paymentData.amount,
        delivery_address: paymentData.deliveryAddress,
        delivery_phone: paymentData.deliveryPhone,
        delivery_notes: paymentData.deliveryNotes || '',
        customer_name: paymentData.customerName || '',
      });

      return {
        success: true,
        payment: response.data,
        paymentId: response.data.id,
        referenceNumber: response.data.reference_number,
        message:
          'Cash on Delivery order created successfully. Our team will contact you for delivery.',
        deliveryInfo: {
          address: paymentData.deliveryAddress,
          phone: paymentData.deliveryPhone,
          notes: paymentData.deliveryNotes || '',
          estimatedDelivery: this.calculateEstimatedDelivery(),
        },
        instructions: this.getCODInstructions(),
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
   * Get COD payment details
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Object>} Payment details with COD specific info
   */
  async getPaymentDetails(paymentId) {
    try {
      const response = await apiClient.get(`${this.baseURL}/${paymentId}/`);

      return {
        success: true,
        payment: response.data,
        codDetails: response.data.cod_details,
        deliveryStatus: this.getDeliveryStatus(response.data.cod_details),
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Update delivery information
   * @param {string} paymentId - Payment ID
   * @param {Object} deliveryData - Updated delivery information
   * @returns {Promise<Object>} Update result
   */
  async updateDeliveryInfo(paymentId, deliveryData) {
    try {
      const response = await apiClient.patch(`${this.baseURL}/${paymentId}/`, {
        delivery_address: deliveryData.address,
        delivery_phone: deliveryData.phone,
        delivery_notes: deliveryData.notes,
      });

      return {
        success: true,
        payment: response.data,
        message: 'Delivery information updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Cancel COD payment
   * @param {string} paymentId - Payment ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelPayment(paymentId, reason = 'Customer cancelled') {
    try {
      const response = await apiClient.post(`${this.baseURL}/${paymentId}/cancel/`, {
        reason,
      });

      return {
        success: true,
        payment: response.data.payment,
        message: 'COD order cancelled successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Validate COD payment data
   * @param {Object} paymentData - Payment data to validate
   * @returns {Object} Validation result
   */
  validateCODPaymentData(paymentData) {
    const validation = {
      isValid: false,
      errors: {},
    };

    // Required fields validation
    if (!paymentData.deliveryAddress || paymentData.deliveryAddress.trim().length < 10) {
      validation.errors.deliveryAddress =
        'Please provide a detailed delivery address (minimum 10 characters)';
    }

    if (!paymentData.deliveryPhone) {
      validation.errors.deliveryPhone = 'Delivery phone number is required';
    } else if (!this.isValidUgandanPhoneNumber(paymentData.deliveryPhone)) {
      validation.errors.deliveryPhone = 'Please enter a valid Ugandan phone number';
    }

    if (!paymentData.amount || paymentData.amount <= 0) {
      validation.errors.amount = 'Payment amount must be greater than 0';
    }

    if (paymentData.amount < 1000) {
      validation.errors.amount = 'Minimum COD order amount is UGX 1,000';
    }

    if (paymentData.amount > 10000000) {
      validation.errors.amount = 'Maximum COD order amount is UGX 10,000,000';
    }

    if (!paymentData.orderId) {
      validation.errors.orderId = 'Order ID is required';
    }

    // Address validation
    if (paymentData.deliveryAddress) {
      const addressValidation = this.validateDeliveryAddress(paymentData.deliveryAddress);
      if (!addressValidation.isValid) {
        validation.errors.deliveryAddress = addressValidation.error;
      }
    }

    validation.isValid = Object.keys(validation.errors).length === 0;
    return validation;
  }

  /**
   * Validate delivery address
   * @param {string} address - Delivery address
   * @returns {Object} Address validation result
   */
  validateDeliveryAddress(address) {
    const validation = {
      isValid: false,
      error: null,
      warnings: [],
    };

    const trimmedAddress = address.trim();

    if (trimmedAddress.length < 10) {
      validation.error = 'Address must be at least 10 characters long';
      return validation;
    }

    if (trimmedAddress.length > 500) {
      validation.error = 'Address cannot exceed 500 characters';
      return validation;
    }

    // Check for common address components
    const hasStreetInfo = /\b(street|road|avenue|lane|close|crescent|way|drive|st|rd|ave)\b/i.test(
      trimmedAddress
    );
    const hasLocationInfo =
      /\b(kampala|entebbe|jinja|mbale|gulu|mbarara|masaka|soroti|lira|arua|fort portal|hoima|kasese)\b/i.test(
        trimmedAddress
      );

    if (!hasStreetInfo && !hasLocationInfo) {
      validation.warnings.push('Consider including street name or landmark for easier delivery');
    }

    // Check for phone numbers in address (should be separate)
    const hasPhoneInAddress = /\b\d{10,}\b/.test(trimmedAddress);
    if (hasPhoneInAddress) {
      validation.warnings.push('Phone numbers should be provided separately, not in the address');
    }

    validation.isValid = true;
    return validation;
  }

  /**
   * Check if phone number is valid Ugandan number
   * @param {string} phoneNumber - Phone number to validate
   * @returns {boolean} True if valid
   */
  isValidUgandanPhoneNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/[\s-]/g, '');

    const patterns = [
      /^(\+256|256)[0-9]{9}$/, // +256XXXXXXXXX or 256XXXXXXXXX
      /^0[0-9]{9}$/, // 0XXXXXXXXX
    ];

    return patterns.some(pattern => pattern.test(cleaned));
  }

  /**
   * Format phone number for display
   * @param {string} phoneNumber - Phone number to format
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(phoneNumber) {
    let cleaned = phoneNumber.replace(/[\s-]/g, '');

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
   * Calculate estimated delivery time
   * @param {string} address - Delivery address (optional for more precise calculation)
   * @returns {Object} Estimated delivery information
   */
  calculateEstimatedDelivery(address = '') {
    const currentDate = new Date();
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
    const currentHour = currentDate.getHours();

    let deliveryDays = 1; // Default next day delivery

    // Weekend and after-hours orders
    if (isWeekend || currentHour >= 17 || currentHour < 8) {
      deliveryDays = 2;
    }

    // Check if address suggests remote location
    const remoteKeywords = ['village', 'rural', 'remote', 'countryside'];
    const isRemoteArea = remoteKeywords.some(keyword =>
      address.toLowerCase().includes(keyword)
    );

    if (isRemoteArea) {
      deliveryDays += 1;
    }

    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + deliveryDays);

    let notes;
    if (isWeekend) {
      notes = 'Weekend orders are processed on Monday';
    } else if (isRemoteArea) {
      notes = 'Additional time needed for remote delivery';
    } else {
      notes = 'Standard delivery time';
    }

    return {
      estimatedDays: deliveryDays,
      estimatedDate: estimatedDate.toDateString(),
      deliveryWindow: '9:00 AM - 6:00 PM',
      notes: notes,
    };
  }

  /**
   * Get COD payment instructions
   * @returns {Object} COD instructions and guidelines
   */
  getCODInstructions() {
    return {
      steps: [
        'Your order has been confirmed for Cash on Delivery',
        'Our delivery team will contact you within 24 hours',
        'Prepare the exact payment amount in cash',
        'Pay the delivery agent when your order arrives',
        'Inspect your items before making payment',
      ],
      importantNotes: [
        'Have the exact amount ready to avoid delays',
        'You can inspect items before payment',
        'Keep your phone accessible for delivery coordination',
        'Additional delivery charges may apply for remote areas',
      ],
      paymentTips: [
        'Count the cash in front of the delivery agent',
        'Ask for a receipt after payment',
        'Check all items are included in your order',
        'Report any issues immediately',
      ],
      contactInfo: {
        customerService: '+256 700 123 456',
        whatsapp: '+256 700 123 456',
        email: 'support@shoponline.com',
        hours: '8:00 AM - 8:00 PM (Monday - Saturday)',
      },
    };
  }

  /**
   * Get delivery status information
   * @param {Object} codDetails - COD details object
   * @returns {Object} Delivery status information
   */
  getDeliveryStatus(codDetails) {
    if (!codDetails) {
      return {
        status: 'unknown',
        message: 'Delivery status not available',
        canCancel: false,
      };
    }

    if (codDetails.collected_at) {
      return {
        status: 'completed',
        message: 'Order delivered and payment collected',
        canCancel: false,
        collectedAt: new Date(codDetails.collected_at),
        collectedBy: codDetails.collected_by,
      };
    }

    if (codDetails.delivery_attempts > 0) {
      return {
        status: 'attempted',
        message: `Delivery attempted ${codDetails.delivery_attempts} time(s)`,
        canCancel: true,
        lastAttempt: codDetails.last_attempt_at ? new Date(codDetails.last_attempt_at) : null,
        nextAttempt: this.calculateNextDeliveryAttempt(codDetails.delivery_attempts),
      };
    }

    if (codDetails.assigned_to) {
      return {
        status: 'assigned',
        message: 'Order assigned to delivery agent',
        canCancel: true,
        assignedTo: codDetails.assigned_to,
      };
    }

    return {
      status: 'pending',
      message: 'Order is being prepared for delivery',
      canCancel: true,
      estimatedDelivery: this.calculateEstimatedDelivery(),
    };
  }

  /**
   * Calculate next delivery attempt time
   * @param {number} attemptCount - Number of previous attempts
   * @returns {Date} Next attempt date
   */
  calculateNextDeliveryAttempt(attemptCount) {
    const nextAttempt = new Date();

    // Add delay based on attempt count
    if (attemptCount === 1) {
      nextAttempt.setHours(nextAttempt.getHours() + 4); // 4 hours later
    } else if (attemptCount === 2) {
      nextAttempt.setDate(nextAttempt.getDate() + 1); // Next day
    } else {
      nextAttempt.setDate(nextAttempt.getDate() + 2); // 2 days later
    }

    // Ensure delivery is within business hours
    if (nextAttempt.getHours() < 9) {
      nextAttempt.setHours(9, 0, 0, 0);
    } else if (nextAttempt.getHours() >= 18) {
      nextAttempt.setDate(nextAttempt.getDate() + 1);
      nextAttempt.setHours(9, 0, 0, 0);
    }

    return nextAttempt;
  }

  /**
   * Get COD payment fees (if any)
   * @param {number} amount - Order amount
   * @param {string} deliveryArea - Delivery area
   * @returns {Object} Fee information
   */
  calculateDeliveryFees(amount, deliveryArea = 'kampala') {
    const feeStructure = {
      kampala: {
        baseFee: 2000,
        freeDeliveryThreshold: 50000,
      },
      suburbs: {
        baseFee: 3000,
        freeDeliveryThreshold: 75000,
      },
      remote: {
        baseFee: 5000,
        freeDeliveryThreshold: 100000,
      },
    };

    const areaFees = feeStructure[deliveryArea] || feeStructure.kampala;
    const deliveryFee = amount >= areaFees.freeDeliveryThreshold ? 0 : areaFees.baseFee;

    return {
      amount: amount,
      deliveryFee: deliveryFee,
      total: amount + deliveryFee,
      isFreeDelivery: deliveryFee === 0,
      freeDeliveryThreshold: areaFees.freeDeliveryThreshold,
    };
  }

  /**
   * Track delivery status
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Object>} Delivery tracking information
   */
  async trackDelivery(paymentId) {
    try {
      const response = await apiClient.get(`${this.baseURL}/${paymentId}/track/`);

      return {
        success: true,
        tracking: response.data,
        timeline: this.formatDeliveryTimeline(response.data.timeline),
        currentStatus: response.data.status,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Format delivery timeline for display
   * @param {Array} timeline - Raw timeline data
   * @returns {Array} Formatted timeline
   */
  formatDeliveryTimeline(timeline = []) {
    return timeline.map(event => ({
      status: event.status,
      timestamp: new Date(event.timestamp),
      title: this.getTimelineEventTitle(event.status),
      description: event.description || this.getTimelineEventDescription(event.status),
      icon: this.getTimelineEventIcon(event.status),
    }));
  }

  /**
   * Get timeline event title
   * @param {string} status - Event status
   * @returns {string} Event title
   */
  getTimelineEventTitle(status) {
    const titles = {
      created: 'Order Placed',
      confirmed: 'Order Confirmed',
      assigned: 'Assigned to Delivery Agent',
      out_for_delivery: 'Out for Delivery',
      delivery_attempted: 'Delivery Attempted',
      delivered: 'Order Delivered',
      cancelled: 'Order Cancelled',
    };

    return titles[status] || status.replace('_', ' ').toUpperCase();
  }

  /**
   * Get timeline event description
   * @param {string} status - Event status
   * @returns {string} Event description
   */
  getTimelineEventDescription(status) {
    const descriptions = {
      created: 'COD order has been placed and is being processed',
      confirmed: 'Order confirmed and prepared for delivery',
      assigned: 'Order assigned to delivery agent',
      out_for_delivery: 'Delivery agent is on the way to your location',
      delivery_attempted: 'Delivery was attempted but unsuccessful',
      delivered: 'Order successfully delivered and payment collected',
      cancelled: 'Order was cancelled',
    };

    return descriptions[status] || 'Status updated';
  }

  /**
   * Get timeline event icon
   * @param {string} status - Event status
   * @returns {string} Icon name
   */
  getTimelineEventIcon(status) {
    const icons = {
      created: 'shopping-cart',
      confirmed: 'check-circle',
      assigned: 'user',
      out_for_delivery: 'truck',
      delivery_attempted: 'clock',
      delivered: 'package',
      cancelled: 'x-circle',
    };

    return icons[status] || 'circle';
  }

  /**
   * Get delivery areas and fees
   * @returns {Object} Delivery areas with fee structure
   */
  getDeliveryAreas() {
    return {
      kampala: {
        name: 'Kampala City',
        fee: 2000,
        freeDeliveryThreshold: 50000,
        estimatedDays: 1,
        areas: [
          'Central Division',
          'Kawempe Division',
          'Makindye Division',
          'Nakawa Division',
          'Rubaga Division',
        ],
      },
      suburbs: {
        name: 'Kampala Suburbs',
        fee: 3000,
        freeDeliveryThreshold: 75000,
        estimatedDays: 1,
        areas: ['Entebbe', 'Wakiso', 'Mukono', 'Nansana', 'Kira', 'Gayaza', 'Bombo', 'Mpigi'],
      },
      upcountry: {
        name: 'Other Towns',
        fee: 5000,
        freeDeliveryThreshold: 100000,
        estimatedDays: 2,
        areas: ['Jinja', 'Mbale', 'Mbarara', 'Gulu', 'Lira', 'Fort Portal', 'Masaka', 'Soroti'],
      },
    };
  }
}

// Create and export singleton instance
const codService = new CODService();
export { codService };