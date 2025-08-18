// src/hooks/useAPI.js
import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from './useAuth';

/**
 * Custom hook for API calls with loading states, error handling, and authentication
 */
export const useAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { getAuthHeader, ensureValidToken } = useAuth();
  const cancelTokenRef = useRef(null);

  // Base API URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || '';

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cancelTokenRef.current) {
        cancelTokenRef.current.abort();
      }
    };
  }, []);

  // Generic API call function
  const apiCall = useCallback(
    async (endpoint, options = {}) => {
      setIsLoading(true);
      setError(null);

      // Create abort controller for this request
      cancelTokenRef.current = new AbortController();

      try {
        // Ensure valid token for authenticated requests
        if (options.authenticated !== false) {
          const tokenResult = await ensureValidToken();
          if (!tokenResult.success) {
            throw new Error(tokenResult.error || 'Authentication required');
          }
        }

        // Prepare request options
        const requestOptions = {
          method: options.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
            ...options.headers,
          },
          signal: cancelTokenRef.current.signal,
          ...options,
        };

        // Add body for POST, PUT, PATCH requests
        if (options.body && typeof options.body === 'object') {
          requestOptions.body = JSON.stringify(options.body);
        } else if (options.body) {
          requestOptions.body = options.body;
        }

        // Make the request
        const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
        const response = await fetch(url, requestOptions);

        // Handle different response types
        let data;
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else if (contentType && contentType.includes('text/')) {
          data = await response.text();
        } else {
          data = await response.blob();
        }

        if (response.ok) {
          setIsLoading(false);
          return { success: true, data, status: response.status, response };
        } else {
          // Handle API errors
          let errorMessage = 'Request failed';

          if (data && typeof data === 'object') {
            if (data.error) {
              errorMessage = data.error;
            } else if (data.message) {
              errorMessage = data.message;
            } else if (data.detail) {
              errorMessage = data.detail;
            } else {
              // Handle field-specific errors
              const firstError = Object.values(data)[0];
              if (Array.isArray(firstError)) {
                errorMessage = firstError[0];
              } else if (typeof firstError === 'string') {
                errorMessage = firstError;
              }
            }
          }

          const apiError = new Error(errorMessage);
          apiError.status = response.status;
          apiError.data = data;
          throw apiError;
        }
      } catch (error) {
        setIsLoading(false);

        if (error.name === 'AbortError') {
          console.log('Request cancelled');
          return { success: false, error: 'Request cancelled', cancelled: true };
        }

        const errorDetails = {
          message: error.message || 'Network error',
          status: error.status || null,
          data: error.data || null,
        };

        setError(errorDetails);
        console.error('API Error:', errorDetails);

        return {
          success: false,
          error: errorDetails.message,
          status: errorDetails.status,
          data: errorDetails.data,
        };
      }
    },
    [ensureValidToken, getAuthHeader, API_BASE_URL]
  );

  // GET request
  const get = useCallback(
    (endpoint, options = {}) => {
      return apiCall(endpoint, { method: 'GET', ...options });
    },
    [apiCall]
  );

  // POST request
  const post = useCallback(
    (endpoint, data, options = {}) => {
      return apiCall(endpoint, { method: 'POST', body: data, ...options });
    },
    [apiCall]
  );

  // PUT request
  const put = useCallback(
    (endpoint, data, options = {}) => {
      return apiCall(endpoint, { method: 'PUT', body: data, ...options });
    },
    [apiCall]
  );

  // PATCH request
  const patch = useCallback(
    (endpoint, data, options = {}) => {
      return apiCall(endpoint, { method: 'PATCH', body: data, ...options });
    },
    [apiCall]
  );

  // DELETE request
  const del = useCallback(
    (endpoint, options = {}) => {
      return apiCall(endpoint, { method: 'DELETE', ...options });
    },
    [apiCall]
  );

  // File upload
  const upload = useCallback(
    async (endpoint, formData, options = {}) => {
      const uploadOptions = {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type for FormData, let browser set it with boundary
          ...getAuthHeader(),
          ...options.headers,
        },
        ...options,
      };

      // Remove Content-Type if it was set
      delete uploadOptions.headers['Content-Type'];

      return apiCall(endpoint, uploadOptions);
    },
    [apiCall, getAuthHeader]
  );

  // Cancel current request
  const cancelRequest = useCallback(() => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.abort();
    }
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Specific API methods for common endpoints

  // Products API
  const products = {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return get(`/api/products/${query ? `?${query}` : ''}`);
    },
    getById: id => get(`/api/products/${id}/`),
    create: productData => post('/api/products/', productData),
    update: (id, productData) => patch(`/api/products/${id}/`, productData),
    delete: id => del(`/api/products/${id}/`),
    search: query => get(`/api/products/?search=${encodeURIComponent(query)}`),
  };

  // Categories API
  const categories = {
    getAll: () => get('/api/categories/'),
    getById: id => get(`/api/categories/${id}/`),
    create: categoryData => post('/api/categories/', categoryData),
    update: (id, categoryData) => patch(`/api/categories/${id}/`, categoryData),
    delete: id => del(`/api/categories/${id}/`),
  };

  // Orders API
  const orders = {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return get(`/api/orders/${query ? `?${query}` : ''}`);
    },
    getById: id => get(`/api/orders/${id}/`),
    create: orderData => post('/api/orders/', orderData),
    update: (id, orderData) => patch(`/api/orders/${id}/`, orderData),
    cancel: id => post(`/api/orders/${id}/cancel/`),
    getMyOrders: () => get('/api/orders/my-orders/'),
  };

  // Flash Sales API
  const flashSales = {
    getActive: () => get('/api/v1/flash-sales/sales/active_sales/'),
    getUpcoming: () => get('/api/v1/flash-sales/sales/upcoming_sales/'),
    getAll: () => get('/api/v1/flash-sales/sales/'),
    getById: id => get(`/api/v1/flash-sales/sales/${id}/with_products/`),
    create: saleData => post('/api/v1/flash-sales/sales/', saleData),
    update: (id, saleData) => patch(`/api/v1/flash-sales/sales/${id}/`, saleData),
    delete: id => del(`/api/v1/flash-sales/sales/${id}/`),
    addProducts: (id, products) =>
      post(`/api/v1/flash-sales/sales/${id}/add_products/`, { products }),
  };

  // Notifications API
  const notifications = {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return get(`/api/notifications/${query ? `?${query}` : ''}`);
    },
    markAsRead: ids => post('/api/notifications/mark-as-read/', { notification_ids: ids }),
    markAllAsRead: () => post('/api/notifications/mark-all-read/'),
    getCounts: () => get('/api/notifications/counts/'),
    getSettings: () => get('/api/notifications/settings/'),
    updateSettings: settings => patch('/api/notifications/settings/', settings),
  };

  // Admin Dashboard API
  const adminDashboard = {
    getOverview: () => get('/api/admin_dashboard/analytics/overview/'),
    getSalesChart: (period = '7days') =>
      get(`/api/admin_dashboard/analytics/sales_chart/?period=${period}`),
    getProductPerformance: () => get('/api/admin_dashboard/analytics/product_performance/'),
    getRecentOrders: (limit = 10) =>
      get(`/api/admin_dashboard/analytics/recent_orders/?limit=${limit}`),
    getFlashSalesPerformance: () => get('/api/admin_dashboard/analytics/flash_sales_performance/'),

    // Homepage content management
    getHomepageContent: () => get('/api/admin_dashboard/homepage-content/active_content/'),
    updateHomepageContent: (id, content) =>
      patch(`/api/admin_dashboard/homepage-content/${id}/`, content),

    // Banners management
    getBanners: () => get('/api/admin_dashboard/banners/'),
    getActiveBanners: () => get('/api/admin_dashboard/banners/active_banners/'),
    createBanner: bannerData => post('/api/admin_dashboard/banners/', bannerData),
    updateBanner: (id, bannerData) => patch(`/api/admin_dashboard/banners/${id}/`, bannerData),
    deleteBanner: id => del(`/api/admin_dashboard/banners/${id}/`),
    reorderBanners: orders =>
      post('/api/admin_dashboard/banners/reorder_banners/', { banner_orders: orders }),

    // Featured products management
    getFeaturedProducts: () => get('/api/admin_dashboard/featured-products/'),
    getActiveFeatured: () => get('/api/admin_dashboard/featured-products/active_featured/'),
    createFeatured: featuredData => post('/api/admin_dashboard/featured-products/', featuredData),
    updateFeatured: (id, featuredData) =>
      patch(`/api/admin_dashboard/featured-products/${id}/`, featuredData),
    deleteFeatured: id => del(`/api/admin_dashboard/featured-products/${id}/`),
    reorderFeatured: orders =>
      post('/api/admin_dashboard/featured-products/reorder_featured/', { featured_orders: orders }),

    // Site settings
    getSiteSettings: () => get('/api/admin_dashboard/site-settings/current_settings/'),
    updateSiteSettings: settings => post('/api/admin_dashboard/site-settings/', settings),
  };

  // Invitations API
  const invitations = {
    getAll: () => get('/api/accounts/invitations/'),
    send: email => post('/api/accounts/invitations/', { email }),
    cancel: id => del(`/api/accounts/invitations/${id}/`),
    validate: token =>
      get(`/api/accounts/invitations/validate/${token}/`, { authenticated: false }),
  };

  // File upload helper
  const uploadFile = useCallback(
    async (file, endpoint = '/api/upload/') => {
      const formData = new FormData();
      formData.append('file', file);

      return upload(endpoint, formData);
    },
    [upload]
  );

  // Batch API calls
  const batch = useCallback(
    async requests => {
      const results = await Promise.allSettled(
        requests.map(request => {
          const { method = 'GET', endpoint, data, options = {} } = request;

          switch (method.toLowerCase()) {
            case 'get':
              return get(endpoint, options);
            case 'post':
              return post(endpoint, data, options);
            case 'put':
              return put(endpoint, data, options);
            case 'patch':
              return patch(endpoint, data, options);
            case 'delete':
              return del(endpoint, options);
            default:
              return Promise.reject(new Error(`Unsupported method: ${method}`));
          }
        })
      );

      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return { success: true, data: result.value, index };
        } else {
          return { success: false, error: result.reason.message, index };
        }
      });
    },
    [get, post, put, patch, del]
  );

  // Retry mechanism for failed requests
  const retry = useCallback(async (apiFunction, maxRetries = 3, delay = 1000) => {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await apiFunction();
        if (result.success) {
          return result;
        }
        lastError = result.error;
      } catch (error) {
        lastError = error.message;
      }

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }

    return { success: false, error: lastError, retriesExhausted: true };
  }, []);

  // Cache for GET requests (simple in-memory cache)
  const cacheRef = useRef(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const cachedGet = useCallback(
    async (endpoint, options = {}) => {
      const cacheKey = `${endpoint}${JSON.stringify(options)}`;
      const cached = cacheRef.current.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('Returning cached response for:', endpoint);
        return cached.data;
      }

      const result = await get(endpoint, options);

      if (result.success) {
        cacheRef.current.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });
      }

      return result;
    },
    [get]
  );

  // Clear cache
  const clearCache = useCallback(pattern => {
    if (pattern) {
      // Clear specific pattern
      for (const key of cacheRef.current.keys()) {
        if (key.includes(pattern)) {
          cacheRef.current.delete(key);
        }
      }
    } else {
      // Clear all cache
      cacheRef.current.clear();
    }
  }, []);

  // Request queue for handling multiple simultaneous requests
  const requestQueueRef = useRef(new Map());

  const queuedRequest = useCallback(async (key, requestFunction) => {
    // If same request is already in progress, return the existing promise
    if (requestQueueRef.current.has(key)) {
      return requestQueueRef.current.get(key);
    }

    // Create new request promise
    const promise = requestFunction().finally(() => {
      requestQueueRef.current.delete(key);
    });

    requestQueueRef.current.set(key, promise);
    return promise;
  }, []);

  // Health check
  const healthCheck = useCallback(async () => {
    try {
      const result = await get('/api/health/', { authenticated: false });
      return result.success;
    } catch (error) {
      return false;
    }
  }, [get]);

  return {
    // State
    isLoading,
    error,

    // Core methods
    apiCall,
    get,
    post,
    put,
    patch,
    delete: del,
    upload,
    uploadFile,

    // Utilities
    cancelRequest,
    clearError,
    batch,
    retry,
    cachedGet,
    clearCache,
    queuedRequest,
    healthCheck,

    // Specific API endpoints
    products,
    categories,
    orders,
    flashSales,
    notifications,
    adminDashboard,
    invitations,
  };
};

export default useAPI;
