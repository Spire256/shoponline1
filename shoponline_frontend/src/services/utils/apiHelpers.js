// src/services/utils/apiHelpers.js
import { API_ENDPOINTS } from '../../utils/constants/api';
import { formatCurrency, formatDate, formatPhoneNumber } from '../../utils/helpers/formatters';

/**
 * API Helper utilities for consistent API interactions
 */
class ApiHelpers {

  /**
   * Format API endpoint with parameters
   * @param {string} endpoint - Base endpoint
   * @param {Object} params - URL parameters
   * @returns {string} Formatted endpoint
   */
  static formatEndpoint(endpoint, params = {}) {
    let formattedEndpoint = endpoint;

    // Replace URL parameters
    Object.keys(params).forEach(key => {
      formattedEndpoint = formattedEndpoint.replace(`:${key}`, params[key]);
    });

    return formattedEndpoint;
  }

  /**
   * Build query string from parameters
   * @param {Object} params - Query parameters
   * @returns {string} Query string
   */
  static buildQueryString(params = {}) {
    const filteredParams = Object.keys(params)
      .filter(key => params[key] !== null && params[key] !== undefined && params[key] !== '')
      .reduce((obj, key) => {
        obj[key] = params[key];
        return obj;
      }, {});

    if (Object.keys(filteredParams).length === 0) {
      return '';
    }

    const searchParams = new URLSearchParams();
    Object.keys(filteredParams).forEach(key => {
      if (Array.isArray(filteredParams[key])) {
        filteredParams[key].forEach(value => {
          searchParams.append(key, value);
        });
      } else {
        searchParams.append(key, filteredParams[key]);
      }
    });

    return `?${searchParams.toString()}`;
  }

  /**
   * Handle API response
   * @param {Response} response - Fetch response
   * @returns {Promise<Object>} Parsed response data
   */
  static async handleResponse(response) {
    const contentType = response.headers.get('content-type');

    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const error = new Error(data.message || data.detail || 'API Error');
      error.status = response.status;
      error.statusText = response.statusText;
      error.data = data;
      throw error;
    }

    return data;
  }

  /**
   * Handle API errors consistently
   * @param {Error} error - API error
   * @returns {Object} Formatted error response
   */
  static handleError(error) {
    console.error('API Error:', error);

    // Network errors
    if (!error.status) {
      return {
        success: false,
        error: 'Network error. Please check your connection.',
        status: 0,
        data: null,
      };
    }

    // HTTP errors
    const errorMessages = {
      400: 'Bad request. Please check your input.',
      401: 'Authentication required. Please login.',
      403: "Access denied. You don't have permission.",
      404: 'Resource not found.',
      409: 'Conflict. Resource already exists.',
      422: 'Validation error. Please check your input.',
      429: 'Too many requests. Please try again later.',
      500: 'Server error. Please try again later.',
      502: 'Bad gateway. Service temporarily unavailable.',
      503: 'Service unavailable. Please try again later.',
      504: 'Gateway timeout. Please try again.',
    };

    const message =
      error.data?.message ||
      error.data?.detail ||
      errorMessages[error.status] ||
      'An unexpected error occurred.';

    return {
      success: false,
      error: message,
      status: error.status,
      data: error.data || null,
    };
  }

  /**
   * Format request headers with authentication
   * @param {Object} customHeaders - Custom headers
   * @param {boolean} includeAuth - Include auth token
   * @returns {Object} Headers object
   */
  static formatHeaders(customHeaders = {}, includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...customHeaders,
    };

    // Add authentication header if required
    if (includeAuth) {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Format form data headers
   * @param {Object} customHeaders - Custom headers
   * @returns {Object} Headers for form data
   */
  static formatFormDataHeaders(customHeaders = {}) {
    const headers = {
      // Don't set Content-Type for FormData, let browser set it
      Accept: 'application/json',
      ...customHeaders,
    };

    const token = localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Prepare request body
   * @param {any} data - Request data
   * @returns {string|FormData} Formatted request body
   */
  static prepareRequestBody(data) {
    if (data instanceof FormData) {
      return data;
    }

    if (data === null || data === undefined) {
      return null;
    }

    return JSON.stringify(data);
  }

  /**
   * Create pagination parameters
   * @param {number} page - Page number
   * @param {number} pageSize - Items per page
   * @param {Object} additionalParams - Additional query parameters
   * @returns {Object} Pagination parameters
   */
  static createPaginationParams(page = 1, pageSize = 20, additionalParams = {}) {
    return {
      page: page,
      page_size: pageSize,
      ...additionalParams,
    };
  }

  /**
   * Format product data for API
   * @param {Object} product - Product data
   * @returns {Object} Formatted product data
   */
  static formatProductData(product) {
    const formattedProduct = { ...product };

    // Format price
    if (formattedProduct.price) {
      formattedProduct.formatted_price = formatCurrency(formattedProduct.price);
    }

    // Format sale price
    if (formattedProduct.sale_price) {
      formattedProduct.formatted_sale_price = formatCurrency(formattedProduct.sale_price);
    }

    // Calculate discount percentage
    if (formattedProduct.price && formattedProduct.sale_price) {
      const discount =
        ((formattedProduct.price - formattedProduct.sale_price) / formattedProduct.price) * 100;
      formattedProduct.discount_percentage = Math.round(discount);
    }

    // Format dates
    if (formattedProduct.created_at) {
      formattedProduct.formatted_created_at = formatDate(formattedProduct.created_at);
    }

    if (formattedProduct.updated_at) {
      formattedProduct.formatted_updated_at = formatDate(formattedProduct.updated_at);
    }

    return formattedProduct;
  }

  /**
   * Format order data for API
   * @param {Object} order - Order data
   * @returns {Object} Formatted order data
   */
  static formatOrderData(order) {
    const formattedOrder = { ...order };

    // Format amounts
    if (formattedOrder.subtotal) {
      formattedOrder.formatted_subtotal = formatCurrency(formattedOrder.subtotal);
    }

    if (formattedOrder.total_amount) {
      formattedOrder.formatted_total = formatCurrency(formattedOrder.total_amount);
    }

    if (formattedOrder.tax_amount) {
      formattedOrder.formatted_tax = formatCurrency(formattedOrder.tax_amount);
    }

    // Format dates
    if (formattedOrder.created_at) {
      formattedOrder.formatted_created_at = formatDate(formattedOrder.created_at);
    }

    if (formattedOrder.updated_at) {
      formattedOrder.formatted_updated_at = formatDate(formattedOrder.updated_at);
    }

    // Format phone numbers
    if (formattedOrder.customer_phone) {
      formattedOrder.formatted_phone = formatPhoneNumber(formattedOrder.customer_phone);
    }

    return formattedOrder;
  }

  /**
   * Format payment data for API
   * @param {Object} payment - Payment data
   * @returns {Object} Formatted payment data
   */
  static formatPaymentData(payment) {
    const formattedPayment = { ...payment };

    // Format amount
    if (formattedPayment.amount) {
      formattedPayment.formatted_amount = formatCurrency(formattedPayment.amount);
    }

    // Format dates
    if (formattedPayment.created_at) {
      formattedPayment.formatted_created_at = formatDate(formattedPayment.created_at);
    }

    if (formattedPayment.processed_at) {
      formattedPayment.formatted_processed_at = formatDate(formattedPayment.processed_at);
    }

    if (formattedPayment.expires_at) {
      formattedPayment.formatted_expires_at = formatDate(formattedPayment.expires_at);
    }

    // Format phone numbers for mobile money
    if (formattedPayment.mobile_money_details?.phone_number) {
      formattedPayment.mobile_money_details.formatted_phone =
        formatPhoneNumber(formattedPayment.mobile_money_details.phone_number);
    }

    // Format status
    formattedPayment.status_display = this.formatPaymentStatus(formattedPayment.status);

    return formattedPayment;
  }

  /**
   * Format payment status for display
   * @param {string} status - Payment status
   * @returns {string} Formatted status
   */
  static formatPaymentStatus(status) {
    const statusMap = {
      pending: 'Pending',
      processing: 'Processing',
      completed: 'Completed',
      failed: 'Failed',
      cancelled: 'Cancelled',
      refunded: 'Refunded',
    };

    return statusMap[status] || status;
  }

  /**
   * Format flash sale data for API
   * @param {Object} flashSale - Flash sale data
   * @returns {Object} Formatted flash sale data
   */
  static formatFlashSaleData(flashSale) {
    const formattedFlashSale = { ...flashSale };

    // Format dates
    if (formattedFlashSale.start_time) {
      formattedFlashSale.formatted_start_time = formatDate(formattedFlashSale.start_time);
    }

    if (formattedFlashSale.end_time) {
      formattedFlashSale.formatted_end_time = formatDate(formattedFlashSale.end_time);
    }

    // Calculate time remaining
    if (formattedFlashSale.end_time) {
      const endTime = new Date(formattedFlashSale.end_time);
      const now = new Date();
      const timeRemaining = endTime.getTime() - now.getTime();

      formattedFlashSale.time_remaining = timeRemaining > 0 ? timeRemaining : 0;
      formattedFlashSale.is_active =
        timeRemaining > 0 && new Date(formattedFlashSale.start_time) <= now;
    }

    // Format discount
    if (formattedFlashSale.discount_percentage) {
      formattedFlashSale.formatted_discount = `${formattedFlashSale.discount_percentage}% OFF`;
    }

    return formattedFlashSale;
  }

  /**
   * Format user data for API
   * @param {Object} user - User data
   * @returns {Object} Formatted user data
   */
  static formatUserData(user) {
    const formattedUser = { ...user };

    // Format dates
    if (formattedUser.date_joined) {
      formattedUser.formatted_date_joined = formatDate(formattedUser.date_joined);
    }

    if (formattedUser.last_login) {
      formattedUser.formatted_last_login = formatDate(formattedUser.last_login);
    }

    // Format phone number
    if (formattedUser.phone_number) {
      formattedUser.formatted_phone = formatPhoneNumber(formattedUser.phone_number);
    }

    // Format role
    formattedUser.role_display = formattedUser.role === 'admin' ? 'Administrator' : 'Client';

    return formattedUser;
  }

  /**
   * Format notification data for API
   * @param {Object} notification - Notification data
   * @returns {Object} Formatted notification data
   */
  static formatNotificationData(notification) {
    const formattedNotification = { ...notification };

    // Format dates
    if (formattedNotification.created_at) {
      formattedNotification.formatted_created_at = formatDate(formattedNotification.created_at);
    }

    if (formattedNotification.read_at) {
      formattedNotification.formatted_read_at = formatDate(formattedNotification.read_at);
    }

    // Format time ago
    if (formattedNotification.created_at) {
      formattedNotification.time_ago = this.formatTimeAgo(formattedNotification.created_at);
    }

    return formattedNotification;
  }

  /**
   * Format time ago from timestamp
   * @param {string} timestamp - ISO timestamp
   * @returns {string} Time ago string
   */
  static formatTimeAgo(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
    }

    return formatDate(timestamp);
  }

  /**
   * Validate phone number for Uganda
   * @param {string} phoneNumber - Phone number to validate
   * @returns {Object} Validation result
   */
  static validateUgandaPhoneNumber(phoneNumber) {
    if (!phoneNumber) {
      return { valid: false, error: 'Phone number is required' };
    }

    // Remove spaces and special characters
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');

    // Uganda phone number patterns
    const patterns = [
      /^(\+256|256)?[0-9]{9}$/, // +256XXXXXXXXX or 256XXXXXXXXX
      /^0[0-9]{9}$/, // 0XXXXXXXXX
      /^[7-9][0-9]{8}$/, // XXXXXXXXX (starting with 7, 8, or 9)
    ];

    const isValid = patterns.some(pattern => pattern.test(cleanPhone));

    if (!isValid) {
      return {
        valid: false,
        error: 'Invalid Uganda phone number format. Use +256XXXXXXXXX, 256XXXXXXXXX, or 0XXXXXXXXX'
      };
    }

    // Format to standard format
    let formattedPhone = cleanPhone;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = `+256${formattedPhone.substring(1)}`;
    } else if (formattedPhone.startsWith('256')) {
      formattedPhone = `+${formattedPhone}`;
    } else if (!formattedPhone.startsWith('+256')) {
      formattedPhone = `+256${formattedPhone}`;
    }

    return {
      valid: true,
      formatted: formattedPhone,
      provider: this.detectMobileProvider(formattedPhone),
    };
  }

  /**
   * Detect mobile money provider from phone number
   * @param {string} phoneNumber - Phone number
   * @returns {string} Provider name
   */
  static detectMobileProvider(phoneNumber) {
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)\+]/g, '');

    // MTN Uganda prefixes (after 256)
    const mtnPrefixes = ['77', '78', '76', '39'];
    // Airtel Uganda prefixes (after 256)
    const airtelPrefixes = ['75', '74', '20', '70'];

    if (cleanPhone.length >= 5) {
      const prefix = cleanPhone.substring(cleanPhone.length - 9, cleanPhone.length - 7);

      if (mtnPrefixes.includes(prefix)) {
        return 'mtn';
      } else if (airtelPrefixes.includes(prefix)) {
        return 'airtel';
      }
    }

    return 'unknown';
  }

  /**
   * Create file upload form data
   * @param {Object} data - Form data
   * @param {File|FileList} files - Files to upload
   * @param {string} fileFieldName - Field name for files
   * @returns {FormData} Form data for upload
   */
  static createFormData(data = {}, files = null, fileFieldName = 'files') {
    const formData = new FormData();

    // Add regular form fields
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        if (Array.isArray(data[key])) {
          data[key].forEach(value => {
            formData.append(key, value);
          });
        } else if (typeof data[key] === 'object') {
          formData.append(key, JSON.stringify(data[key]));
        } else {
          formData.append(key, data[key]);
        }
      }
    });

    // Add files
    if (files) {
      if (files instanceof FileList) {
        Array.from(files).forEach(file => {
          formData.append(fileFieldName, file);
        });
      } else if (files instanceof File) {
        formData.append(fileFieldName, files);
      } else if (Array.isArray(files)) {
        files.forEach(file => {
          formData.append(fileFieldName, file);
        });
      }
    }

    return formData;
  }

  /**
   * Retry API request with exponential backoff
   * @param {Function} apiCall - API call function
   * @param {number} maxRetries - Maximum retry attempts
   * @param {number} baseDelay - Base delay in milliseconds
   * @returns {Promise} API response
   */
  static async retryRequest(apiCall, maxRetries = 3, baseDelay = 1000) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error;

        // Don't retry on certain error types
        if (
          error.status === 400 ||
          error.status === 401 ||
          error.status === 403 ||
          error.status === 404
        ) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Create cache key for API requests
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Request parameters
   * @returns {string} Cache key
   */
  static createCacheKey(endpoint, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});

    return `${endpoint}_${JSON.stringify(sortedParams)}`;
  }

  /**
   * Check if response should be cached
   * @param {string} method - HTTP method
   * @param {number} status - Response status
   * @returns {boolean} Should cache
   */
  static shouldCache(method, status) {
    return method === 'GET' && status === 200;
  }

  /**
   * Format API success response
   * @param {any} data - Response data
   * @param {string} message - Success message
   * @returns {Object} Formatted success response
   */
  static formatSuccessResponse(data, message = 'Success') {
    return {
      success: true,
      message,
      data,
      error: null,
      status: 200,
    };
  }

  /**
   * Check if user has role permissions
   * @param {Object} user - User object
   * @param {Array|string} roles - Required roles
   * @returns {boolean} Has permission
   */
  static hasRolePermission(user, roles) {
    if (!user || !user.role) {
      return false;
    }

    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }

    return user.role === roles;
  }

  /**
   * Check if user is admin
   * @param {Object} user - User object
   * @returns {boolean} Is admin
   */
  static isAdmin(user) {
    return this.hasRolePermission(user, 'admin');
  }

  /**
   * Check if user is client
   * @param {Object} user - User object
   * @returns {boolean} Is client
   */
  static isClient(user) {
    return this.hasRolePermission(user, 'client');
  }
}

export default ApiHelpers;