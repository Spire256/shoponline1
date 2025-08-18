// src/services/utils/errorHandler.js

/**
 * Global Error Handler
 * Centralized error handling and logging service
 */
class ErrorHandler {
  constructor() {
    this.errorListeners = [];
    this.errorLog = [];
    this.maxLogSize = 100;

    // Initialize error handling
    this.setupGlobalErrorHandling();
  }

  /**
   * Setup global error handling
   */
  setupGlobalErrorHandling() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', event => {
      console.error('Unhandled promise rejection:', event.reason);

      this.logError({
        type: 'unhandled_promise_rejection',
        error: event.reason,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      });

      // Prevent default browser behavior
      event.preventDefault();
    });

    // Handle JavaScript errors
    window.addEventListener('error', event => {
      console.error('JavaScript error:', event.error);

      this.logError({
        type: 'javascript_error',
        error: event.error,
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      });
    });

    // Handle resource loading errors
    window.addEventListener(
      'error',
      event => {
        if (event.target !== window) {
          console.error('Resource loading error:', event.target);

          this.logError({
            type: 'resource_loading_error',
            element: event.target.tagName,
            source: event.target.src || event.target.href,
            timestamp: new Date().toISOString(),
            url: window.location.href,
          });
        }
      },
      true
    );

    // Handle authentication errors
    window.addEventListener('authError', event => {
      this.handleAuthError(event.detail.error);
    });

    // Handle network errors
    window.addEventListener('networkError', event => {
      this.handleNetworkError(event.detail.error);
    });
  }

  /**
   * Log error to internal log and external services
   * @param {Object} errorInfo - Error information
   */
  logError(errorInfo) {
    // Add to internal log
    this.errorLog.unshift(errorInfo);

    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Notify error listeners
    this.notifyErrorListeners(errorInfo);

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalLogger(errorInfo);
    }
  }

  /**
   * Handle API errors
   * @param {Object} error - API error object
   * @returns {Object} Formatted error information
   */
  handleAPIError(error) {
    const errorInfo = {
      type: 'api_error',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      requestUrl: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: this.extractErrorMessage(error),
      data: error.response?.data,
      isNetworkError: !error.response,
      isAuthError: error.response?.status === 401,
      isValidationError: error.response?.status === 422 || error.response?.status === 400,
      originalError: error,
    };

    this.logError(errorInfo);

    return {
      message: errorInfo.message,
      type: this.getErrorType(errorInfo),
      canRetry: this.canRetryError(errorInfo),
      shouldShowToUser: this.shouldShowToUser(errorInfo),
      errorInfo,
    };
  }

  /**
   * Handle authentication errors
   * @param {Object} error - Authentication error
   */
  handleAuthError(error) {
    const errorInfo = {
      type: 'auth_error',
      error: error,
      message: 'Authentication failed',
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    this.logError(errorInfo);

    // Clear any stored authentication data
    localStorage.removeItem('shoponline_user');

    // Redirect to login page
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login?expired=true';
    }
  }

  /**
   * Handle network errors
   * @param {Object} error - Network error
   */
  handleNetworkError(error) {
    const errorInfo = {
      type: 'network_error',
      error: error,
      message: 'Network connection failed',
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    this.logError(errorInfo);

    // Show network error notification
    this.showNetworkErrorNotification();
  }

  /**
   * Handle validation errors
   * @param {Object} error - Validation error
   * @returns {Object} Formatted validation errors
   */
  handleValidationError(error) {
    const validationErrors = {};
    const errorData = error.response?.data;

    if (errorData && typeof errorData === 'object') {
      Object.keys(errorData).forEach(field => {
        if (Array.isArray(errorData[field])) {
          validationErrors[field] = errorData[field];
        } else if (typeof errorData[field] === 'string') {
          validationErrors[field] = [errorData[field]];
        }
      });
    }

    return {
      hasValidationErrors: Object.keys(validationErrors).length > 0,
      validationErrors,
      message: this.formatValidationMessage(validationErrors),
    };
  }

  /**
   * Extract error message from error object
   * @param {Object} error - Error object
   * @returns {string} Error message
   */
  extractErrorMessage(error) {
    // Network error
    if (!error.response) {
      return 'Network error. Please check your internet connection.';
    }

    const { data, status } = error.response;

    // Try different message formats
    if (typeof data === 'string') return data;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    if (data?.detail) return data.detail;
    if (data?.non_field_errors) {
      return Array.isArray(data.non_field_errors)
        ? data.non_field_errors.join(', ')
        : data.non_field_errors;
    }

    // Fallback to status-based messages
    const statusMessages = {
      400: 'Bad request. Please check your input.',
      401: 'Authentication required. Please log in.',
      403: 'Access denied.',
      404: 'Resource not found.',
      422: 'Please check your input.',
      429: 'Too many requests. Please try again later.',
      500: 'Server error. Please try again later.',
      502: 'Service unavailable.',
      503: 'Service temporarily unavailable.',
      504: 'Request timeout.',
    };

    return statusMessages[status] || `Request failed (${status})`;
  }

  /**
   * Get error type classification
   * @param {Object} errorInfo - Error information
   * @returns {string} Error type
   */
  getErrorType(errorInfo) {
    if (errorInfo.isNetworkError) return 'network';
    if (errorInfo.isAuthError) return 'authentication';
    if (errorInfo.isValidationError) return 'validation';
    if (errorInfo.status >= 500) return 'server';
    if (errorInfo.status >= 400) return 'client';
    return 'unknown';
  }

  /**
   * Determine if error can be retried
   * @param {Object} errorInfo - Error information
   * @returns {boolean} Can retry status
   */
  canRetryError(errorInfo) {
    // Network errors can be retried
    if (errorInfo.isNetworkError) return true;

    // Server errors can be retried
    if (errorInfo.status >= 500) return true;

    // Rate limiting can be retried after delay
    if (errorInfo.status === 429) return true;

    // Timeout errors can be retried
    if (errorInfo.status === 408) return true;

    return false;
  }

  /**
   * Determine if error should be shown to user
   * @param {Object} errorInfo - Error information
   * @returns {boolean} Should show to user
   */
  shouldShowToUser(errorInfo) {
    // Don't show auth errors (handled by redirect)
    if (errorInfo.isAuthError) return false;

    // Show validation errors
    if (errorInfo.isValidationError) return true;

    // Show user-facing errors
    if (errorInfo.status === 404 || errorInfo.status === 403) return true;

    // Show network errors
    if (errorInfo.isNetworkError) return true;

    // Show server errors
    if (errorInfo.status >= 500) return true;

    return true;
  }

  /**
   * Format validation message
   * @param {Object} validationErrors - Validation errors object
   * @returns {string} Formatted message
   */
  formatValidationMessage(validationErrors) {
    const errorMessages = [];

    Object.keys(validationErrors).forEach(field => {
      const fieldErrors = validationErrors[field];
      const fieldName = this.formatFieldName(field);

      if (Array.isArray(fieldErrors)) {
        fieldErrors.forEach(error => {
          errorMessages.push(`${fieldName}: ${error}`);
        });
      }
    });

    return errorMessages.length > 0
      ? errorMessages.join('. ')
      : 'Please check your input and try again.';
  }

  /**
   * Format field name for user display
   * @param {string} field - Field name
   * @returns {string} Formatted field name
   */
  formatFieldName(field) {
    return field
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .toLowerCase()
      .replace(/^./, str => str.toUpperCase());
  }

  /**
   * Show network error notification
   */
  showNetworkErrorNotification() {
    // Check if notification is already shown
    if (document.querySelector('.network-error-notification')) {
      return;
    }

    const notification = document.createElement('div');
    notification.className = 'network-error-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 10000;
      max-width: 300px;
    `;
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span>⚠️</span>
        <span>Network connection lost. Please check your internet connection.</span>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: none; border: none; color: white; cursor: pointer; font-size: 16px; padding: 0;
        ">×</button>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 10000);
  }

  /**
   * Add error listener
   * @param {Function} listener - Error listener callback
   */
  addErrorListener(listener) {
    this.errorListeners.push(listener);
  }

  /**
   * Remove error listener
   * @param {Function} listener - Error listener callback
   */
  removeErrorListener(listener) {
    const index = this.errorListeners.indexOf(listener);
    if (index > -1) {
      this.errorListeners.splice(index, 1);
    }
  }

  /**
   * Notify error listeners
   * @param {Object} errorInfo - Error information
   */
  notifyErrorListeners(errorInfo) {
    this.errorListeners.forEach(listener => {
      try {
        listener(errorInfo);
      } catch (error) {
        console.error('Error in error listener:', error);
      }
    });
  }

  /**
   * Send error to external logging service
   * @param {Object} errorInfo - Error information
   */
  async sendToExternalLogger(errorInfo) {
    try {
      // This would integrate with services like Sentry, LogRocket, etc.
      // For now, we'll just log to console in production
      if (process.env.REACT_APP_SENTRY_DSN) {
        // Sentry integration would go here
      }
    } catch (error) {
      console.error('Failed to send error to external logger:', error);
    }
  }

  /**
   * Get error statistics
   * @returns {Object} Error statistics
   */
  getErrorStats() {
    const stats = {
      total: this.errorLog.length,
      byType: {},
      recent: this.errorLog.slice(0, 10),
      last24Hours: [],
    };

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    this.errorLog.forEach(error => {
      // Count by type
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;

      // Last 24 hours
      if (new Date(error.timestamp) > oneDayAgo) {
        stats.last24Hours.push(error);
      }
    });

    return stats;
  }

  /**
   * Clear error log
   */
  clearErrorLog() {
    this.errorLog = [];
  }

  /**
   * Export error log for debugging
   * @returns {string} JSON string of error log
   */
  exportErrorLog() {
    return JSON.stringify(this.errorLog, null, 2);
  }

  /**
   * Create error report
   * @returns {Object} Comprehensive error report
   */
  createErrorReport() {
    const userAgent = navigator.userAgent;
    const stats = this.getErrorStats();

    return {
      timestamp: new Date().toISOString(),
      userAgent: userAgent,
      url: window.location.href,
      user: this.getCurrentUser(),
      stats: stats,
      recentErrors: stats.recent,
      systemInfo: {
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
      },
    };
  }

  /**
   * Get current user info (safely)
   * @returns {Object|null} Current user or null
   */
  getCurrentUser() {
    try {
      const userData = localStorage.getItem('shoponline_user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  /**
   * Handle React error boundary errors
   * @param {Error} error - React error
   * @param {Object} errorInfo - Error info from React
   */
  handleReactError(error, errorInfo) {
    this.logError({
      type: 'react_error',
      error: error,
      errorInfo: errorInfo,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    });
  }

  /**
   * Test error handling (development only)
   */
  testErrorHandling() {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    console.log('Testing error handling...');

    // Test JavaScript error
    setTimeout(() => {
      throw new Error('Test error from errorHandler');
    }, 1000);

    // Test promise rejection
    setTimeout(() => {
      Promise.reject(new Error('Test promise rejection'));
    }, 2000);
  }
}

// Create and export singleton instance
const errorHandler = new ErrorHandler();

export { errorHandler };
