// src/services/api/apiClient.js
import axios from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const API_VERSION = 'v1';

// Smart URL construction to prevent duplication
const getBaseURL = () => {
  let baseUrl = API_BASE_URL.trim();
  
  // Remove trailing slash if present
  baseUrl = baseUrl.replace(/\/$/, '');
  
  // Check if URL already includes /api/v1 or /api/v1/
  if (baseUrl.includes('/api/v1')) {
    // If it already includes /api/v1, use it as is
    return baseUrl;
  }
  
  // Otherwise, append /api/v1
  return `${baseUrl}/api/${API_VERSION}`;
};

// Fixed: Enhanced token management with consistent storage keys
const getAccessToken = () => {
  // Use consistent key first, then fallback to legacy keys
  return localStorage.getItem('access_token') || 
         localStorage.getItem('accessToken') || 
         localStorage.getItem('shoponline_access_token');
};

const getRefreshToken = () => {
  // Use consistent key first, then fallback to legacy keys
  return localStorage.getItem('refresh_token') || 
         localStorage.getItem('refreshToken') || 
         localStorage.getItem('shoponline_refresh_token');
};

// Fixed: Store tokens with consistent keys
const storeTokens = (accessToken, refreshToken) => {
  if (accessToken) {
    localStorage.setItem('access_token', accessToken);
  }
  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken);
  }
};

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor to add JWT token
apiClient.interceptors.request.use(
  config => {
    const token = getAccessToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request ID for tracking
    config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Fixed: Response interceptor with proper token refresh handling
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        
        if (refreshToken) {
          const response = await axios.post(
            `${getBaseURL()}/auth/token/refresh/`,
            {
              refresh: refreshToken,
            }
          );

          const { access } = response.data;
          
          // Fixed: Store tokens with consistent keys
          storeTokens(access, response.data.refresh || refreshToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear all tokens and redirect to login
        const keysToRemove = [
          'access_token',
          'refresh_token',
          'user',
          // Legacy keys for backwards compatibility
          'accessToken',
          'refreshToken',
          'shoponline_access_token',
          'shoponline_refresh_token',
          'shoponline_user',
        ];
        
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
        });
        
        // Dispatch logout event
        window.dispatchEvent(new CustomEvent('authError', { detail: 'Token refresh failed' }));
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// File upload instance for multipart/form-data requests
const fileUploadClient = axios.create({
  baseURL: getBaseURL(),
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) * 2 || 20000,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Add same interceptors to file upload client
fileUploadClient.interceptors.request.use(
  config => {
    const token = getAccessToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

fileUploadClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        
        if (refreshToken) {
          const response = await axios.post(
            `${getBaseURL()}/auth/token/refresh/`,
            {
              refresh: refreshToken,
            }
          );

          const { access } = response.data;
          storeTokens(access, response.data.refresh || refreshToken);

          originalRequest.headers.Authorization = `Bearer ${access}`;
          return fileUploadClient(originalRequest);
        }
      } catch (refreshError) {
        const keysToRemove = [
          'access_token',
          'refresh_token',
          'user',
          'accessToken',
          'refreshToken',
          'shoponline_access_token',
          'shoponline_refresh_token',
          'shoponline_user',
        ];
        
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
        });
        
        window.dispatchEvent(new CustomEvent('authError', { detail: 'Token refresh failed' }));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API Response handlers
export const handleApiResponse = response => {
  return response.data;
};

export const handleApiError = error => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;

    let message = 'An error occurred';
    if (data?.detail) {
      message = data.detail;
    } else if (data?.message) {
      message = data.message;
    } else if (data?.error) {
      message = data.error;
    } else if (typeof data === 'string') {
      message = data;
    }

    return {
      status,
      message,
      errors: data?.errors || data || {},
      data: data || null,
    };
  } else if (error.request) {
    // Network error
    return {
      status: 0,
      message: 'Network error. Please check your internet connection.',
      errors: {},
      data: null,
    };
  } else {
    // Other error
    return {
      status: 0,
      message: error.message || 'An unexpected error occurred',
      errors: {},
      data: null,
    };
  }
};

// API Call Logging function
export const logApiCall = (method, endpoint, data = null) => {
  // Only log in development environment
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      method: method.toUpperCase(),
      endpoint,
      baseURL: getBaseURL(),
      fullURL: `${getBaseURL()}${endpoint}`,
    };

    // Add data if provided (but don't log sensitive information)
    if (data) {
      // Filter out sensitive fields
      const sensitiveFields = ['password', 'token', 'refresh', 'access', 'authorization'];
      const filteredData = { ...data };
      
      Object.keys(filteredData).forEach(key => {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          filteredData[key] = '[REDACTED]';
        }
      });
      
      logData.data = filteredData;
    }

    console.log(`🌐 API Call:`, logData);
  }
};

// Utility functions
export const buildQueryString = params => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => query.append(key, item));
      } else {
        query.append(key, value);
      }
    }
  });

  return query.toString();
};

export const formatCurrency = (amount, currency = null) => {
  const defaultCurrency = currency || process.env.REACT_APP_CURRENCY_CODE || 'UGX';
  
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: defaultCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: defaultCurrency === 'UGX' ? 0 : 2,
  }).format(amount);
};

export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Kampala',
  };

  return new Intl.DateTimeFormat('en-UG', { ...defaultOptions, ...options }).format(new Date(date));
};

// Export configured clients
export { apiClient, fileUploadClient };
export default apiClient;