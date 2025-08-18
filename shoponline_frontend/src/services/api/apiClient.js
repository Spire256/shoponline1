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

// Log the final URL for debugging
if (process.env.REACT_APP_DEBUG_MODE === 'true') {
  console.log('🔧 API Base URL configured:', getBaseURL());
}

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Add request/response logging for development
if (process.env.REACT_APP_DEBUG_MODE === 'true') {
  apiClient.interceptors.request.use(request => {
    console.log('🚀 Starting Request:', request.method?.toUpperCase(), request.url);
    return request;
  });
  
  apiClient.interceptors.response.use(
    response => {
      console.log('✅ Response:', response.status, response.config.url);
      return response;
    },
    error => {
      console.error('❌ Response Error:', error.response?.status, error.config?.url);
      return Promise.reject(error);
    }
  );
}

// Enhanced token management with multiple fallbacks
const getAccessToken = () => {
  // Try multiple storage locations
  const sources = [
    localStorage.getItem('access_token'),
    localStorage.getItem('accessToken'),
    localStorage.getItem(process.env.REACT_APP_SESSION_STORAGE_KEY),
    localStorage.getItem(process.env.REACT_APP_LOCAL_STORAGE_KEY)
  ];

  for (const source of sources) {
    if (source) {
      try {
        // Try to parse as JSON first
        const parsed = JSON.parse(source);
        return parsed.access || parsed.access_token || parsed.accessToken;
      } catch (e) {
        // If not JSON, assume it's a plain token string
        return source;
      }
    }
  }
  return null;
};

const getRefreshToken = () => {
  const sources = [
    localStorage.getItem('refresh_token'),
    localStorage.getItem('refreshToken'),
    localStorage.getItem(process.env.REACT_APP_SESSION_STORAGE_KEY),
    localStorage.getItem(process.env.REACT_APP_LOCAL_STORAGE_KEY)
  ];

  for (const source of sources) {
    if (source) {
      try {
        const parsed = JSON.parse(source);
        return parsed.refresh || parsed.refresh_token || parsed.refreshToken;
      } catch (e) {
        // If not JSON and this is from refresh_token key, use as is
        if (source === localStorage.getItem('refresh_token') || 
            source === localStorage.getItem('refreshToken')) {
          return source;
        }
      }
    }
  }
  return null;
};
// Request interceptor to add JWT token
apiClient.interceptors.request.use(
  config => {
    const token = getAccessToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
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
          
          // Store the new access token
          localStorage.setItem('access_token', access);
          
          // Update other storage locations if they exist
          if (process.env.REACT_APP_SESSION_STORAGE_KEY) {
            const existingData = localStorage.getItem(process.env.REACT_APP_SESSION_STORAGE_KEY);
            try {
              const data = existingData ? JSON.parse(existingData) : {};
              data.access = access;
              localStorage.setItem(process.env.REACT_APP_SESSION_STORAGE_KEY, JSON.stringify(data));
            } catch (e) {
              localStorage.setItem(process.env.REACT_APP_SESSION_STORAGE_KEY, access);
            }
          }

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear all tokens and redirect to login
        const keysToRemove = [
          'access_token',
          'accessToken', 
          'refresh_token',
          'refreshToken',
          process.env.REACT_APP_SESSION_STORAGE_KEY,
          process.env.REACT_APP_LOCAL_STORAGE_KEY
        ].filter(Boolean);
        
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
        });
        
        // Redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// File upload instance for multipart/form-data requests
const fileUploadClient = axios.create({
  baseURL: getBaseURL(),
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) * 2 || 20000, // Longer timeout for file uploads
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
          localStorage.setItem('access_token', access);
          
          if (process.env.REACT_APP_SESSION_STORAGE_KEY) {
            const existingData = localStorage.getItem(process.env.REACT_APP_SESSION_STORAGE_KEY);
            try {
              const data = existingData ? JSON.parse(existingData) : {};
              data.access = access;
              localStorage.setItem(process.env.REACT_APP_SESSION_STORAGE_KEY, JSON.stringify(data));
            } catch (e) {
              localStorage.setItem(process.env.REACT_APP_SESSION_STORAGE_KEY, access);
            }
          }

          originalRequest.headers.Authorization = `Bearer ${access}`;
          return fileUploadClient(originalRequest);
        }
      } catch (refreshError) {
        const keysToRemove = [
          'access_token',
          'accessToken', 
          'refresh_token',
          'refreshToken',
          process.env.REACT_APP_SESSION_STORAGE_KEY,
          process.env.REACT_APP_LOCAL_STORAGE_KEY
        ].filter(Boolean);
        
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
        });
        
        window.location.href = '/login';
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
      errors: data?.errors || data?.field_errors || {},
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
  };

  return new Intl.DateTimeFormat('en-UG', { ...defaultOptions, ...options }).format(new Date(date));
};

// Debug helper for development
export const logApiCall = (method, url, data = null) => {
  if (process.env.REACT_APP_DEBUG_MODE === 'true' && process.env.REACT_APP_SHOW_DEVTOOLS === 'true') {
    console.group(`🌐 API ${method.toUpperCase()}: ${url}`);
    if (data) console.log('📤 Request Data:', data);
    console.log('🔗 Full URL:', `${getBaseURL()}${url}`);
    console.groupEnd();
  }
};

// Export configured clients
export { apiClient, fileUploadClient };
export default apiClient;