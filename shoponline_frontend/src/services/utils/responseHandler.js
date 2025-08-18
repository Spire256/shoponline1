// src/services/utils/responseHandler.js
import {
  validateAPIResponse,
  extractPaginationInfo,
  formatAPIError,
  transformResponseData,
} from './apiHelpers';

/**
 * Response Handler
 * Standardizes API response processing and error handling
 */
class ResponseHandler {
  constructor() {
    this.transformers = new Map();
    this.validators = new Map();
  }

  /**
   * Process API response with standardized format
   * @param {Object} response - Axios response object
   * @param {Object} options - Processing options
   * @returns {Object} Standardized response
   */
  processResponse(response, options = {}) {
    const {
      expectsPagination = false,
      expectedFields = [],
      transformer = null,
      validateResponse = true,
    } = options;

    try {
      const result = {
        success: true,
        data: response.data,
        status: response.status,
        headers: response.headers,
        timestamp: new Date().toISOString(),
      };

      // Validate response structure if required
      if (validateResponse && expectedFields.length > 0) {
        const validation = validateAPIResponse(response.data, expectedFields);
        if (!validation.isValid) {
          return this.createErrorResponse(
            `Invalid response structure: ${validation.errors.join(', ')}`,
            response.status
          );
        }
      }

      // Extract pagination information
      if (expectsPagination) {
        const paginationInfo = extractPaginationInfo(response.data);
        result.pagination = paginationInfo;
        result.data = response.data.results || response.data;
      }

      // Transform data if transformer provided
      if (transformer) {
        result.data = transformResponseData(result.data, transformer);
      }

      // Add metadata
      result.metadata = {
        requestId: response.config?.requestId,
        duration: response.config?.metadata?.duration,
        cached: false, // Would be set by cache layer
      };

      return result;
    } catch (error) {
      console.error('Error processing response:', error);
      return this.createErrorResponse('Failed to process response', response.status);
    }
  }

  /**
   * Process API error with standardized format
   * @param {Object} error - Axios error object
   * @param {Object} options - Processing options
   * @returns {Object} Standardized error response
   */
  processError(error, options = {}) {
    const {
      includeOriginalError = false,
      customErrorMessages = {},
      fallbackMessage = 'An unexpected error occurred',
    } = options;

    const formattedError = formatAPIError(error);
    const status = error.response?.status;

    // Use custom error message if provided
    if (customErrorMessages[status]) {
      formattedError.message = customErrorMessages[status];
    }

    const result = {
      success: false,
      error: formattedError.message || fallbackMessage,
      errorType: formattedError.type,
      errorCode: formattedError.code,
      status: status,
      timestamp: new Date().toISOString(),
    };

    // Add validation details for validation errors
    if (formattedError.type === 'validation' && formattedError.details) {
      result.validationErrors = this.processValidationErrors(formattedError.details);
    }

    // Add original error for debugging (development only)
    if (includeOriginalError && process.env.NODE_ENV === 'development') {
      result.originalError = {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
      };
    }

    // Add metadata
    result.metadata = {
      requestId: error.config?.requestId,
      duration: error.config?.metadata?.duration,
      isRetryable: this.isRetryableError(error),
      isNetworkError: !error.response,
      isAuthError: status === 401,
    };

    return result;
  }

  /**
   * Process validation errors into structured format
   * @param {Object} validationData - Raw validation error data
   * @returns {Object} Structured validation errors
   */
  processValidationErrors(validationData) {
    const validationErrors = {
      fields: {},
      nonFieldErrors: [],
      summary: '',
    };

    if (!validationData || typeof validationData !== 'object') {
      return validationErrors;
    }

    Object.keys(validationData).forEach(field => {
      const errors = validationData[field];

      if (field === 'non_field_errors') {
        validationErrors.nonFieldErrors = Array.isArray(errors) ? errors : [errors];
      } else {
        validationErrors.fields[field] = {
          errors: Array.isArray(errors) ? errors : [errors],
          hasError: true,
        };
      }
    });

    // Create summary message
    const allErrors = [
      ...validationErrors.nonFieldErrors,
      ...Object.values(validationErrors.fields).flatMap(field => field.errors),
    ];

    if (allErrors.length > 0) {
      validationErrors.summary = allErrors.join('. ');
    }

    return validationErrors;
  }

  /**
   * Check if error is retryable
   * @param {Object} error - Error object
   * @returns {boolean} Whether error is retryable
   */
  isRetryableError(error) {
    if (!error.response) {
      // Network errors are retryable
      return true;
    }

    const status = error.response.status;

    // Server errors (5xx) are retryable
    if (status >= 500) return true;

    // Rate limiting and timeouts are retryable
    if (status === 429 || status === 408) return true;

    // Client errors (4xx) are generally not retryable
    return false;
  }

  /**
   * Create standardized error response
   * @param {string} message - Error message
   * @param {number} status - HTTP status code
   * @param {Object} additionalData - Additional error data
   * @returns {Object} Error response
   */
  createErrorResponse(message, status = 500, additionalData = {}) {
    return {
      success: false,
      error: message,
      status: status,
      timestamp: new Date().toISOString(),
      ...additionalData,
    };
  }

  /**
   * Create standardized success response
   * @param {*} data - Response data
   * @param {string} message - Success message
   * @param {Object} additionalData - Additional response data
   * @returns {Object} Success response
   */
  createSuccessResponse(data, message = 'Success', additionalData = {}) {
    return {
      success: true,
      data: data,
      message: message,
      timestamp: new Date().toISOString(),
      ...additionalData,
    };
  }

  /**
   * Register data transformer for specific endpoint
   * @param {string} endpoint - API endpoint pattern
   * @param {Function} transformer - Transformer function
   */
  registerTransformer(endpoint, transformer) {
    this.transformers.set(endpoint, transformer);
  }

  /**
   * Register response validator for specific endpoint
   * @param {string} endpoint - API endpoint pattern
   * @param {Array} requiredFields - Required fields for validation
   */
  registerValidator(endpoint, requiredFields) {
    this.validators.set(endpoint, requiredFields);
  }

  /**
   * Get transformer for endpoint
   * @param {string} endpoint - API endpoint
   * @returns {Function|null} Transformer function or null
   */
  getTransformer(endpoint) {
    // Exact match first
    if (this.transformers.has(endpoint)) {
      return this.transformers.get(endpoint);
    }

    // Pattern matching
    for (const [pattern, transformer] of this.transformers.entries()) {
      if (endpoint.includes(pattern)) {
        return transformer;
      }
    }

    return null;
  }

  /**
   * Get validator for endpoint
   * @param {string} endpoint - API endpoint
   * @returns {Array} Required fields array
   */
  getValidator(endpoint) {
    // Exact match first
    if (this.validators.has(endpoint)) {
      return this.validators.get(endpoint);
    }

    // Pattern matching
    for (const [pattern, validator] of this.validators.entries()) {
      if (endpoint.includes(pattern)) {
        return validator;
      }
    }

    return [];
  }

  /**
   * Process list response (with optional pagination)
   * @param {Object} response - API response
   * @param {Object} options - Processing options
   * @returns {Object} Processed list response
   */
  processListResponse(response, options = {}) {
    return this.processResponse(response, {
      expectsPagination: true,
      ...options,
    });
  }

  /**
   * Process detail response (single item)
   * @param {Object} response - API response
   * @param {Object} options - Processing options
   * @returns {Object} Processed detail response
   */
  processDetailResponse(response, options = {}) {
    return this.processResponse(response, {
      expectsPagination: false,
      ...options,
    });
  }

  /**
   * Process create/update response
   * @param {Object} response - API response
   * @param {string} action - Action performed ('created' or 'updated')
   * @param {Object} options - Processing options
   * @returns {Object} Processed create/update response
   */
  processCreateUpdateResponse(response, action = 'saved', options = {}) {
    const result = this.processResponse(response, options);

    if (result.success) {
      result.message = `Item ${action} successfully`;
      result.action = action;
    }

    return result;
  }

  /**
   * Process delete response
   * @param {Object} response - API response
   * @param {Object} options - Processing options
   * @returns {Object} Processed delete response
   */
  processDeleteResponse(response, options = {}) {
    return {
      success: true,
      message: 'Item deleted successfully',
      status: response.status,
      timestamp: new Date().toISOString(),
      metadata: {
        requestId: response.config?.requestId,
        duration: response.config?.metadata?.duration,
      },
    };
  }

  /**
   * Process file upload response
   * @param {Object} response - API response
   * @param {Object} options - Processing options
   * @returns {Object} Processed upload response
   */
  processUploadResponse(response, options = {}) {
    const result = this.processResponse(response, options);

    if (result.success) {
      result.message = 'File uploaded successfully';
      result.uploadInfo = {
        filename: result.data.filename || result.data.name,
        size: result.data.size,
        type: result.data.content_type || result.data.type,
        url: result.data.url || result.data.file,
      };
    }

    return result;
  }

  /**
   * Process bulk operation response
   * @param {Object} response - API response
   * @param {string} operation - Operation performed
   * @param {Object} options - Processing options
   * @returns {Object} Processed bulk response
   */
  processBulkResponse(response, operation = 'processed', options = {}) {
    const result = this.processResponse(response, options);

    if (result.success) {
      const count = result.data.updated_count || result.data.count || 0;
      result.message = `${count} items ${operation}`;
      result.bulkInfo = {
        operation: operation,
        processedCount: count,
        failedCount: result.data.failed_count || 0,
        errors: result.data.errors || [],
      };
    }

    return result;
  }

  /**
   * Process search response
   * @param {Object} response - API response
   * @param {string} query - Search query
   * @param {Object} options - Processing options
   * @returns {Object} Processed search response
   */
  processSearchResponse(response, query, options = {}) {
    const result = this.processListResponse(response, options);

    if (result.success) {
      result.searchInfo = {
        query: query,
        resultCount: result.pagination?.totalItems || result.data?.length || 0,
        hasResults: (result.data?.length || 0) > 0,
      };
    }

    return result;
  }

  /**
   * Extract common data transformers
   */
  getCommonTransformers() {
    return {
      // Transform user data
      user: user => ({
        ...user,
        fullName: `${user.first_name} ${user.last_name}`,
        initials: `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase(),
        isAdmin: user.role === 'admin' || user.is_staff,
      }),

      // Transform product data
      product: product => ({
        ...product,
        formattedPrice: this.formatCurrency(product.price),
        isOnSale: product.sale_price && product.sale_price < product.price,
        discount: product.sale_price
          ? Math.round(((product.price - product.sale_price) / product.price) * 100)
          : 0,
      }),

      // Transform order data
      order: order => ({
        ...order,
        formattedTotal: this.formatCurrency(order.total_amount),
        statusLabel: this.getOrderStatusLabel(order.status),
        canCancel: ['pending', 'confirmed'].includes(order.status),
      }),

      // Transform payment data
      payment: payment => ({
        ...payment,
        formattedAmount: this.formatCurrency(payment.amount),
        statusLabel: this.getPaymentStatusLabel(payment.status),
        methodLabel: this.getPaymentMethodLabel(payment.payment_method),
      }),
    };
  }

  /**
   * Format currency helper
   * @param {number} amount - Amount to format
   * @returns {string} Formatted currency
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Get order status label
   * @param {string} status - Order status
   * @returns {string} Status label
   */
  getOrderStatusLabel(status) {
    const labels = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      refunded: 'Refunded',
    };

    return labels[status] || status.charAt(0).toUpperCase() + status.slice(1);
  }

  /**
   * Get payment status label
   * @param {string} status - Payment status
   * @returns {string} Status label
   */
  getPaymentStatusLabel(status) {
    const labels = {
      pending: 'Pending',
      processing: 'Processing',
      completed: 'Completed',
      failed: 'Failed',
      cancelled: 'Cancelled',
      refunded: 'Refunded',
    };

    return labels[status] || status.charAt(0).toUpperCase() + status.slice(1);
  }

  /**
   * Get payment method label
   * @param {string} method - Payment method
   * @returns {string} Method label
   */
  getPaymentMethodLabel(method) {
    const labels = {
      mtn_momo: 'MTN Mobile Money',
      airtel_money: 'Airtel Money',
      cod: 'Cash on Delivery',
    };

    return labels[method] || method;
  }
}

// Create and export singleton instance
const responseHandler = new ResponseHandler();

// Register common transformers
const commonTransformers = responseHandler.getCommonTransformers();
Object.keys(commonTransformers).forEach(key => {
  responseHandler.registerTransformer(key, commonTransformers[key]);
});

export { responseHandler };
