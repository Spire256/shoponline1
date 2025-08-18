// src/services/auth/authInterceptor.js
import { tokenService } from './tokenService';

/**
 * Authentication Interceptor
 * Handles automatic token attachment and refresh for API requests
 */
class AuthInterceptor {
  constructor() {
    this.refreshPromise = null;
  }

  /**
   * Setup request interceptor for axios instance
   * @param {Object} axiosInstance - Axios instance to setup interceptor for
   */
  setupRequestInterceptor(axiosInstance) {
    axiosInstance.interceptors.request.use(
      config => {
        // Add authentication header if token exists
        const authHeader = tokenService.getAuthHeader();
        if (authHeader) {
          config.headers = {
            ...config.headers,
            ...authHeader,
          };
        }

        // Add content type if not specified
        if (!config.headers['Content-Type']) {
          config.headers['Content-Type'] = 'application/json';
        }

        // Add request timestamp for debugging
        config.metadata = {
          startTime: Date.now(),
        };

        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Setup response interceptor for axios instance
   * @param {Object} axiosInstance - Axios instance to setup interceptor for
   * @param {Function} onTokenRefresh - Callback when token is refreshed
   * @param {Function} onAuthError - Callback when authentication fails
   */
  setupResponseInterceptor(axiosInstance, onTokenRefresh, onAuthError) {
    axiosInstance.interceptors.response.use(
      response => {
        // Add response time for debugging
        if (response.config.metadata) {
          response.config.metadata.endTime = Date.now();
          response.config.metadata.duration =
            response.config.metadata.endTime - response.config.metadata.startTime;
        }

        return response;
      },
      async error => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized responses
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Attempt to refresh token
            const refreshResult = await this.refreshToken(axiosInstance);

            if (refreshResult.success) {
              // Update request headers with new token
              const authHeader = tokenService.getAuthHeader();
              if (authHeader) {
                originalRequest.headers = {
                  ...originalRequest.headers,
                  ...authHeader,
                };
              }

              // Notify about token refresh
              if (onTokenRefresh) {
                onTokenRefresh(refreshResult.accessToken);
              }

              // Retry original request
              return axiosInstance(originalRequest);
            } else {
              // Token refresh failed, handle authentication error
              if (onAuthError) {
                onAuthError(error);
              }
              return Promise.reject(error);
            }
          } catch (refreshError) {
            // Token refresh failed, handle authentication error
            if (onAuthError) {
              onAuthError(refreshError);
            }
            return Promise.reject(refreshError);
          }
        }

        // Handle other errors
        return Promise.reject(this.handleResponseError(error));
      }
    );
  }

  /**
   * Refresh authentication token
   * @param {Object} axiosInstance - Axios instance for API calls
   * @returns {Promise<Object>} Refresh result
   */
  async refreshToken(axiosInstance) {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh(axiosInstance);

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh
   * @param {Object} axiosInstance - Axios instance for API calls
   * @returns {Promise<Object>} Refresh result
   */
  async performTokenRefresh(axiosInstance) {
    try {
      const refreshToken = tokenService.getRefreshToken();

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axiosInstance.post('/api/v1/auth/token/refresh/', {
        refresh: refreshToken,
      });

      if (response.data.access) {
        tokenService.setAccessToken(response.data.access);

        return {
          success: true,
          accessToken: response.data.access,
        };
      } else {
        throw new Error('Invalid refresh response');
      }
    } catch (error) {
      // Clear tokens on refresh failure
      tokenService.clearTokens();

      return {
        success: false,
        error: error.message || 'Token refresh failed',
      };
    }
  }

  /**
   * Handle and format response errors
   * @param {Object} error - Axios error object
   * @returns {Object} Formatted error
   */
  handleResponseError(error) {
    const formattedError = {
      message: 'An error occurred',
      status: null,
      data: null,
      config: error.config,
    };

    if (error.response) {
      // Server responded with error status
      formattedError.status = error.response.status;
      formattedError.data = error.response.data;

      // Extract meaningful error messages
      if (error.response.data) {
        if (typeof error.response.data === 'string') {
          formattedError.message = error.response.data;
        } else if (error.response.data.message) {
          formattedError.message = error.response.data.message;
        } else if (error.response.data.error) {
          formattedError.message = error.response.data.error;
        } else if (error.response.data.detail) {
          formattedError.message = error.response.data.detail;
        } else if (error.response.data.non_field_errors) {
          formattedError.message = error.response.data.non_field_errors.join(', ');
        }
      }

      // Handle specific status codes
      switch (error.response.status) {
        case 400:
          formattedError.message =
            formattedError.message || 'Bad request. Please check your input.';
          break;
        case 401:
          formattedError.message = 'Authentication required. Please log in.';
          break;
        case 403:
          formattedError.message = 'Access denied. You do not have permission for this action.';
          break;
        case 404:
          formattedError.message = 'Resource not found.';
          break;
        case 422:
          formattedError.message =
            formattedError.message || 'Validation error. Please check your input.';
          break;
        case 429:
          formattedError.message = 'Too many requests. Please try again later.';
          break;
        case 500:
          formattedError.message = 'Server error. Please try again later.';
          break;
        default:
          if (!formattedError.message || formattedError.message === 'An error occurred') {
            formattedError.message = `Request failed with status ${error.response.status}`;
          }
      }
    } else if (error.request) {
      // Request made but no response received
      formattedError.message = 'Network error. Please check your connection.';
      formattedError.status = 0;
    } else {
      // Something else happened
      formattedError.message = error.message || 'An unexpected error occurred';
    }

    return formattedError;
  }

  /**
   * Check if error is related to authentication
   * @param {Object} error - Error object
   * @returns {boolean} True if authentication error
   */
  isAuthError(error) {
    return (
      error.status === 401 ||
      error.status === 403 ||
      (error.message && error.message.toLowerCase().includes('auth'))
    );
  }

  /**
   * Check if error is a network error
   * @param {Object} error - Error object
   * @returns {boolean} True if network error
   */
  isNetworkError(error) {
    return (
      error.status === 0 ||
      !error.status ||
      (error.message && error.message.toLowerCase().includes('network'))
    );
  }

  /**
   * Check if error is a server error
   * @param {Object} error - Error object
   * @returns {boolean} True if server error
   */
  isServerError(error) {
    return error.status >= 500;
  }

  /**
   * Check if error is a client error
   * @param {Object} error - Error object
   * @returns {boolean} True if client error
   */
  isClientError(error) {
    return error.status >= 400 && error.status < 500;
  }

  /**
   * Extract validation errors from response
   * @param {Object} error - Error object
   * @returns {Object} Formatted validation errors
   */
  getValidationErrors(error) {
    const validationErrors = {};

    if (error.data && typeof error.data === 'object') {
      // Handle Django REST framework validation errors
      Object.keys(error.data).forEach(field => {
        if (Array.isArray(error.data[field])) {
          validationErrors[field] = error.data[field];
        } else if (typeof error.data[field] === 'string') {
          validationErrors[field] = [error.data[field]];
        }
      });
    }

    return validationErrors;
  }

  /**
   * Create retry function for failed requests
   * @param {Object} axiosInstance - Axios instance
   * @param {Object} originalConfig - Original request config
   * @returns {Function} Retry function
   */
  createRetryFunction(axiosInstance, originalConfig) {
    return () => {
      return axiosInstance(originalConfig);
    };
  }

  /**
   * Setup automatic token refresh based on expiry
   * @param {Object} axiosInstance - Axios instance
   * @param {Function} onTokenRefresh - Callback when token is refreshed
   */
  setupAutoRefresh(axiosInstance, onTokenRefresh) {
    return tokenService.setupAutoRefresh(async () => {
      try {
        const result = await this.refreshToken(axiosInstance);
        if (result.success && onTokenRefresh) {
          onTokenRefresh(result.accessToken);
        }
      } catch (error) {
        console.error('Auto refresh failed:', error);
      }
    });
  }

  /**
   * Clean up interceptors
   * @param {Object} axiosInstance - Axios instance to clean up
   */
  cleanup(axiosInstance) {
    if (axiosInstance.interceptors) {
      axiosInstance.interceptors.request.clear();
      axiosInstance.interceptors.response.clear();
    }
  }

  /**
   * Get request metadata for debugging
   * @param {Object} config - Request config
   * @returns {Object} Request metadata
   */
  getRequestMetadata(config) {
    return {
      url: config.url,
      method: config.method?.toUpperCase(),
      hasAuth: Boolean(config.headers?.Authorization),
      timestamp: new Date().toISOString(),
      duration: config.metadata?.duration,
    };
  }

  /**
   * Log request/response for debugging
   * @param {string} type - 'request' or 'response' or 'error'
   * @param {Object} data - Data to log
   */
  debugLog(type, data) {
    if (process.env.NODE_ENV === 'development') {
      console.group(`[Auth Interceptor] ${type.toUpperCase()}`);
      console.log(data);
      console.groupEnd();
    }
  }
}

// Create and export singleton instance
const authInterceptor = new AuthInterceptor();
export { authInterceptor };
