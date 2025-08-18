// src/services/utils/httpClient.js
import axios from 'axios';
import { tokenService } from '../auth/tokenService';
import { authInterceptor } from '../auth/authInterceptor';

/**
 * HTTP Client Configuration
 * Configured axios instance with authentication and error handling
 */

// Create axios instance with base configuration
const httpClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000',
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Request interceptor to add authentication and request metadata
 */
httpClient.interceptors.request.use(
  config => {
    // Add authentication header if token exists
    const authHeader = tokenService.getAuthHeader();
    if (authHeader) {
      config.headers = {
        ...config.headers,
        ...authHeader,
      };
    }

    // Add request timestamp for performance monitoring
    config.metadata = {
      startTime: Date.now(),
    };

    // Add request ID for debugging
    config.requestId = generateRequestId();

    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 HTTP Request [${config.requestId}]:`, {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
        params: config.params,
      });
    }

    return config;
  },
  error => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for handling responses and errors
 */
httpClient.interceptors.response.use(
  response => {
    // Calculate request duration
    if (response.config.metadata) {
      response.config.metadata.endTime = Date.now();
      response.config.metadata.duration =
        response.config.metadata.endTime - response.config.metadata.startTime;
    }

    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ HTTP Response [${response.config.requestId}]:`, {
        status: response.status,
        duration: `${response.config.metadata?.duration}ms`,
        data: response.data,
      });
    }

    return response;
  },
  async error => {
    const originalRequest = error.config;

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ HTTP Error [${originalRequest?.requestId}]:`, {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
    }

    // Handle 401 Unauthorized - Token refresh logic
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token
        const refreshToken = tokenService.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post('/api/v1/auth/token/refresh/', {
          refresh: refreshToken,
        });

        if (response.data.access) {
          // Update stored token
          tokenService.setAccessToken(response.data.access);

          // Update request headers with new token
          const authHeader = tokenService.getAuthHeader();
          if (authHeader) {
            originalRequest.headers = {
              ...originalRequest.headers,
              ...authHeader,
            };
          }

          // Retry original request
          return httpClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        tokenService.clearTokens();
        window.dispatchEvent(new CustomEvent('authTokenExpired'));
        return Promise.reject(refreshError);
      }
    }

    // Handle network errors
    if (!error.response) {
      error.isNetworkError = true;
      error.userMessage = 'Network error. Please check your internet connection.';
    } else {
      error.userMessage = getErrorMessage(error.response);
    }

    return Promise.reject(error);
  }
);

/**
 * Setup authentication interceptors
 */
authInterceptor.setupRequestInterceptor(httpClient);
authInterceptor.setupResponseInterceptor(
  httpClient,
  accessToken => {
    // Token refreshed callback
    window.dispatchEvent(
      new CustomEvent('authTokenRefreshed', {
        detail: { accessToken },
      })
    );
  },
  error => {
    // Authentication error callback
    window.dispatchEvent(
      new CustomEvent('authError', {
        detail: { error },
      })
    );
  }
);

/**
 * Generate unique request ID for debugging
 * @returns {string} Unique request ID
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract user-friendly error message from response
 * @param {Object} response - Error response
 * @returns {string} User-friendly error message
 */
function getErrorMessage(response) {
  const { status, data } = response;

  // Handle different response data formats
  if (typeof data === 'string') {
    return data;
  }

  if (data?.message) {
    return data.message;
  }

  if (data?.error) {
    return data.error;
  }

  if (data?.detail) {
    return data.detail;
  }

  if (data?.non_field_errors) {
    return Array.isArray(data.non_field_errors)
      ? data.non_field_errors.join(', ')
      : data.non_field_errors;
  }

  // Handle validation errors
  if (data && typeof data === 'object') {
    const validationErrors = [];
    for (const [field, errors] of Object.entries(data)) {
      if (Array.isArray(errors)) {
        validationErrors.push(`${field}: ${errors.join(', ')}`);
      } else if (typeof errors === 'string') {
        validationErrors.push(`${field}: ${errors}`);
      }
    }
    if (validationErrors.length > 0) {
      return validationErrors.join('; ');
    }
  }

  // Default status-based messages
  const statusMessages = {
    400: 'Bad request. Please check your input.',
    401: 'Authentication required. Please log in.',
    403: 'Access denied. You do not have permission for this action.',
    404: 'Resource not found.',
    422: 'Validation error. Please check your input.',
    429: 'Too many requests. Please try again later.',
    500: 'Server error. Please try again later.',
    502: 'Service unavailable. Please try again later.',
    503: 'Service unavailable. Please try again later.',
    504: 'Request timeout. Please try again.',
  };

  return statusMessages[status] || `Request failed with status ${status}`;
}

/**
 * HTTP Client utility methods
 */
const httpUtils = {
  /**
   * Make GET request with error handling
   * @param {string} url - Request URL
   * @param {Object} config - Request configuration
   * @returns {Promise} Request promise
   */
  async get(url, config = {}) {
    try {
      const response = await httpClient.get(url, config);
      return {
        success: true,
        data: response.data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      return {
        success: false,
        error: error.userMessage || error.message,
        status: error.response?.status,
        originalError: error,
      };
    }
  },

  /**
   * Make POST request with error handling
   * @param {string} url - Request URL
   * @param {*} data - Request data
   * @param {Object} config - Request configuration
   * @returns {Promise} Request promise
   */
  async post(url, data = null, config = {}) {
    try {
      const response = await httpClient.post(url, data, config);
      return {
        success: true,
        data: response.data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      return {
        success: false,
        error: error.userMessage || error.message,
        status: error.response?.status,
        originalError: error,
      };
    }
  },

  /**
   * Make PUT request with error handling
   * @param {string} url - Request URL
   * @param {*} data - Request data
   * @param {Object} config - Request configuration
   * @returns {Promise} Request promise
   */
  async put(url, data = null, config = {}) {
    try {
      const response = await httpClient.put(url, data, config);
      return {
        success: true,
        data: response.data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      return {
        success: false,
        error: error.userMessage || error.message,
        status: error.response?.status,
        originalError: error,
      };
    }
  },

  /**
   * Make PATCH request with error handling
   * @param {string} url - Request URL
   * @param {*} data - Request data
   * @param {Object} config - Request configuration
   * @returns {Promise} Request promise
   */
  async patch(url, data = null, config = {}) {
    try {
      const response = await httpClient.patch(url, data, config);
      return {
        success: true,
        data: response.data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      return {
        success: false,
        error: error.userMessage || error.message,
        status: error.response?.status,
        originalError: error,
      };
    }
  },

  /**
   * Make DELETE request with error handling
   * @param {string} url - Request URL
   * @param {Object} config - Request configuration
   * @returns {Promise} Request promise
   */
  async delete(url, config = {}) {
    try {
      const response = await httpClient.delete(url, config);
      return {
        success: true,
        data: response.data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      return {
        success: false,
        error: error.userMessage || error.message,
        status: error.response?.status,
        originalError: error,
      };
    }
  },

  /**
   * Upload file with progress tracking
   * @param {string} url - Upload URL
   * @param {FormData} formData - Form data with file
   * @param {Function} onProgress - Progress callback
   * @returns {Promise} Upload promise
   */
  async uploadFile(url, formData, onProgress = null) {
    try {
      const response = await httpClient.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: progressEvent => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted, progressEvent);
          }
        },
      });

      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error: error.userMessage || error.message,
        status: error.response?.status,
        originalError: error,
      };
    }
  },

  /**
   * Download file
   * @param {string} url - Download URL
   * @param {string} filename - Filename for download
   * @returns {Promise} Download promise
   */
  async downloadFile(url, filename = null) {
    try {
      const response = await httpClient.get(url, {
        responseType: 'blob',
      });

      // Create blob URL and trigger download
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up blob URL
      window.URL.revokeObjectURL(downloadUrl);

      return {
        success: true,
        message: 'File downloaded successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.userMessage || error.message,
        originalError: error,
      };
    }
  },

  /**
   * Make request with retry logic
   * @param {Function} requestFn - Request function
   * @param {number} maxRetries - Maximum retry attempts
   * @param {number} delay - Delay between retries (ms)
   * @returns {Promise} Request promise
   */
  async withRetry(requestFn, maxRetries = 3, delay = 1000) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;

        // Don't retry on client errors (4xx) except 408, 429
        if (error.response?.status >= 400 && error.response?.status < 500) {
          if (error.response.status !== 408 && error.response.status !== 429) {
            throw error;
          }
        }

        if (attempt === maxRetries) {
          throw error;
        }

        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
      }
    }

    throw lastError;
  },

  /**
   * Cancel all pending requests
   */
  cancelAllRequests() {
    // This would be enhanced with axios cancel tokens in a real implementation
    console.log('Cancelling all pending requests...');
  },
};

/**
 * Request/Response logging for debugging
 */
if (process.env.NODE_ENV === 'development') {
  // Performance monitoring
  let totalRequests = 0;
  let totalResponseTime = 0;

  httpClient.interceptors.response.use(
    response => {
      if (response.config.metadata?.duration) {
        totalRequests++;
        totalResponseTime += response.config.metadata.duration;

        // Log performance stats every 10 requests
        if (totalRequests % 10 === 0) {
          console.log(`📊 HTTP Performance (last ${totalRequests} requests):`, {
            averageResponseTime: `${Math.round(totalResponseTime / totalRequests)}ms`,
            totalRequests: totalRequests,
          });
        }
      }
      return response;
    },
    error => error
  );
}

/**
 * Health check utility
 */
const healthCheck = {
  /**
   * Check API health
   * @returns {Promise<Object>} Health check result
   */
  async checkAPI() {
    try {
      const response = await httpClient.get('/health/', { timeout: 5000 });
      return {
        healthy: true,
        status: response.status,
        data: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        status: error.response?.status,
        timestamp: new Date().toISOString(),
      };
    }
  },

  /**
   * Check authentication status
   * @returns {Promise<Object>} Auth check result
   */
  async checkAuth() {
    try {
      const response = await httpClient.get('/api/v1/auth/profile/', { timeout: 5000 });
      return {
        authenticated: true,
        user: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        authenticated: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  },
};

// Export configured HTTP client and utilities
export { httpClient, httpUtils, healthCheck };
