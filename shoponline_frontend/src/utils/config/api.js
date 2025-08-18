/**
 * API Configuration for ShopOnline Uganda E-commerce Platform
 * Centralized configuration for all API endpoints, settings, and utilities
 */

/**
 * Environment Configuration
 */
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Base API Configuration
 */
export const API_CONFIG = {
  // Base URLs
  BASE_URL: isDevelopment ? 'http://localhost:8000' : 'https://api.shoponline.ug',

  API_VERSION: 'v1',

  // Request timeout (30 seconds)
  TIMEOUT: 30000,

  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second

  // Rate limiting
  RATE_LIMIT_DELAY: 100, // ms between requests

  // Upload limits
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'text/plain'],
};

/**
 * API Endpoints Configuration
 */
export const API_ENDPOINTS = {
  // Base API URL
  get BASE() {
    return `${API_CONFIG.BASE_URL}/api/${API_CONFIG.API_VERSION}`;
  },

  // Authentication endpoints
  AUTH: {
    get BASE() {
      return `${API_ENDPOINTS.BASE}/auth`;
    },
    LOGIN: '/login/',
    REGISTER_CLIENT: '/register/client/',
    REGISTER_ADMIN: '/register/admin/',
    LOGOUT: '/logout/',
    REFRESH_TOKEN: '/token/refresh/',
    PROFILE: '/profile/',

    // Admin invitations
    INVITATIONS: '/invitations/',
    INVITATION_DETAIL: id => `/invitations/${id}/`,
    VALIDATE_INVITATION: token => `/invitations/validate/${token}/`,
  },

  // Product endpoints
  PRODUCTS: {
    get BASE() {
      return `${API_ENDPOINTS.BASE}/products`;
    },
    LIST: '/products/',
    DETAIL: id => `/products/${id}/`,
    IMAGES: productId => `/products/${productId}/images/`,
    ATTRIBUTES: productId => `/products/${productId}/attributes/`,
    VARIANTS: productId => `/products/${productId}/variants/`,
    ANALYTICS: '/analytics/',
    TOP_PRODUCTS: '/top/',
    RECOMMENDATIONS: '/recommendations/',
    PRICE_HISTORY: id => `/products/${id}/price-history/`,
    INVENTORY: '/inventory/',
    DUPLICATE: id => `/products/${id}/duplicate/`,
    COMPARE: '/compare/',
    REVIEW_SUMMARY: id => `/products/${id}/reviews/summary/`,
  },

  // Category endpoints
  CATEGORIES: {
    get BASE() {
      return `${API_ENDPOINTS.BASE}/categories`;
    },
    LIST: '/',
    DETAIL: slug => `/${slug}/`,
    TREE: '/tree/',
    FEATURED: '/featured/',
    PRODUCTS: slug => `/${slug}/products/`,
    BULK_ACTION: '/bulk_action/',
    SEARCH: '/search/',
    TOGGLE_FEATURED: slug => `/${slug}/toggle_featured/`,
    TOGGLE_ACTIVE: slug => `/${slug}/toggle_active/`,
    STATS: '/stats/',
  },

  // Flash sales endpoints
  FLASH_SALES: {
    get BASE() {
      return `${API_ENDPOINTS.BASE}/flash-sales`;
    },
    SALES: '/api/v1/flash-sales/sales/',
    SALE_DETAIL: id => `/api/v1/flash-sales/sales/${id}/`,
    PRODUCTS: '/api/v1/flash-sales/products/',
    PRODUCT_DETAIL: id => `/api/v1/flash-sales/products/${id}/`,
  },

  // Order endpoints
  ORDERS: {
    get BASE() {
      return `${API_ENDPOINTS.BASE}/orders`;
    },
    LIST_CREATE: '/',
    DETAIL: id => `/${id}/`,
    CANCEL: id => `/${id}/cancel/`,
    CONFIRM: id => `/${id}/confirm/`,
    DELIVER: id => `/${id}/deliver/`,
    NOTES: id => `/${id}/notes/`,
    COD_ORDERS: '/cod/',
    VERIFY_COD: id => `/${id}/verify-cod/`,
    ANALYTICS: '/analytics/',
    CUSTOMER_SUMMARY: '/customer-summary/',
    BULK_UPDATE: '/bulk-update/',
    TRACKING: orderNumber => `/track/${orderNumber}/`,
  },

  // Payment endpoints
  PAYMENTS: {
    get BASE() {
      return `${API_ENDPOINTS.BASE}/payments`;
    },
    METHODS: '/methods/',
    CREATE: '/create/',
    DETAIL: id => `/${id}/`,
    LIST: '/',
    VERIFY: id => `/${id}/verify/`,
    CANCEL: id => `/${id}/cancel/`,
    RECEIPT: id => `/${id}/receipt/`,
    CHECK_PHONE: '/check-phone/',

    // Webhooks
    MTN_WEBHOOK: '/webhooks/mtn/',
    AIRTEL_WEBHOOK: '/webhooks/airtel/',

    // Admin endpoints
    ADMIN_LIST: '/admin/payments/',
    ADMIN_UPDATE_STATUS: id => `/admin/${id}/update-status/`,
    ADMIN_COD: '/admin/cod/',
    ADMIN_ASSIGN_COD: id => `/admin/cod/${id}/assign/`,
    ADMIN_DELIVERY_ATTEMPT: id => `/admin/cod/${id}/delivery-attempt/`,
    ADMIN_COMPLETE_COD: id => `/admin/cod/${id}/complete/`,
    ADMIN_BULK_ASSIGN: '/admin/cod/bulk-assign/',
    ADMIN_ANALYTICS: '/admin/analytics/',
    ADMIN_WEBHOOKS: '/admin/webhooks/',
    ADMIN_RETRY: id => `/admin/${id}/retry/`,
    ADMIN_METHODS: '/admin/methods/',
    ADMIN_UPDATE_METHOD: method => `/admin/methods/${method}/`,
  },

  // Notification endpoints
  NOTIFICATIONS: {
    get BASE() {
      return `${API_ENDPOINTS.BASE}/notifications`;
    },
    LIST: '/',
    DETAIL: id => `/${id}/`,
    MARK_READ: '/mark-as-read/',
    MARK_ALL_READ: '/mark-all-read/',
    COUNTS: '/counts/',
    SETTINGS: '/settings/',
    ADMIN_LIST: '/admin/',
    TEST_NOTIFICATION: '/admin/test-notification/',
    BROADCAST: '/admin/broadcast/',
  },

  // Admin dashboard endpoints
  ADMIN: {
    get BASE() {
      return `${API_ENDPOINTS.BASE}/admin`;
    },
    HOMEPAGE_CONTENT: '/homepage-content/',
    BANNERS: '/banners/',
    FEATURED_PRODUCTS: '/featured-products/',
    SITE_SETTINGS: '/site-settings/',
    ANALYTICS: '/analytics/',
  },

  // Utility endpoints
  UTILS: {
    HEALTH: '/health/',
    API_ROOT: `/api/${API_CONFIG.API_VERSION}/`,
  },
};

/**
 * HTTP Methods
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
};

/**
 * Request Headers Configuration
 */
export const HEADERS = {
  DEFAULT: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },

  MULTIPART: {
    Accept: 'application/json',
    // Don't set Content-Type for multipart, let browser set it
  },

  AUTH: token => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }),

  WEBHOOK: {
    'Content-Type': 'application/json',
    'User-Agent': 'ShopOnline-Uganda/1.0',
  },
};

/**
 * Response Status Codes
 */
export const STATUS_CODES = {
  // Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your internet connection.',
  TIMEOUT: 'Request timeout. Please try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access forbidden. Please check your permissions.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION: 'Please check your input and try again.',
  RATE_LIMITED: 'Too many requests. Please wait a moment.',

  // Uganda-specific messages
  PAYMENT_FAILED:
    'Payment failed. Please check your Mobile Money balance or try a different method.',
  MOBILE_MONEY_ERROR: 'Mobile Money service is temporarily unavailable.',
  COD_UNAVAILABLE: 'Cash on Delivery is not available for your location.',
  DELIVERY_ERROR: 'Delivery service is temporarily unavailable.',
};

/**
 * Request Configuration Presets
 */
export const REQUEST_CONFIGS = {
  // Standard API request
  DEFAULT: {
    timeout: API_CONFIG.TIMEOUT,
    headers: HEADERS.DEFAULT,
  },

  // File upload request
  UPLOAD: {
    timeout: 60000, // 60 seconds for uploads
    headers: HEADERS.MULTIPART,
  },

  // Quick request (for real-time updates)
  QUICK: {
    timeout: 5000, // 5 seconds
    headers: HEADERS.DEFAULT,
  },

  // Long polling request
  LONG_POLL: {
    timeout: 120000, // 2 minutes
    headers: HEADERS.DEFAULT,
  },

  // Webhook request
  WEBHOOK: {
    timeout: 10000, // 10 seconds
    headers: HEADERS.WEBHOOK,
  },
};

/**
 * API Route Builder Utilities
 */
export const routeBuilder = {
  /**
   * Build URL with query parameters
   * @param {string} baseUrl - Base URL
   * @param {Object} params - Query parameters
   * @returns {string} Complete URL
   */
  buildUrl(baseUrl, params = {}) {
    const url = new URL(baseUrl, API_CONFIG.BASE_URL);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        url.searchParams.append(key, value);
      }
    });

    return url.toString();
  },

  /**
   * Build pagination URL
   * @param {string} baseUrl - Base URL
   * @param {number} page - Page number
   * @param {number} pageSize - Page size
   * @param {Object} filters - Additional filters
   * @returns {string} Paginated URL
   */
  buildPaginatedUrl(baseUrl, page = 1, pageSize = 20, filters = {}) {
    return this.buildUrl(baseUrl, {
      page,
      page_size: pageSize,
      ...filters,
    });
  },

  /**
   * Build search URL
   * @param {string} baseUrl - Base URL
   * @param {string} query - Search query
   * @param {Object} filters - Search filters
   * @returns {string} Search URL
   */
  buildSearchUrl(baseUrl, query, filters = {}) {
    return this.buildUrl(baseUrl, {
      search: query,
      ...filters,
    });
  },

  /**
   * Build filter URL
   * @param {string} baseUrl - Base URL
   * @param {Object} filters - Filters to apply
   * @returns {string} Filtered URL
   */
  buildFilterUrl(baseUrl, filters = {}) {
    // Remove empty filters
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});

    return this.buildUrl(baseUrl, cleanFilters);
  },
};

/**
 * Cache Configuration
 */
export const CACHE_CONFIG = {
  // Cache durations (in milliseconds)
  DURATIONS: {
    SHORT: 5 * 60 * 1000, // 5 minutes
    MEDIUM: 15 * 60 * 1000, // 15 minutes
    LONG: 60 * 60 * 1000, // 1 hour
    VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
  },

  // Cache keys
  KEYS: {
    PRODUCTS: 'products',
    CATEGORIES: 'categories',
    FLASH_SALES: 'flash_sales',
    USER_PROFILE: 'user_profile',
    CART: 'cart',
    HOMEPAGE_CONTENT: 'homepage_content',
  },

  // Cacheable endpoints
  CACHEABLE: ['products/', 'categories/', 'homepage-content/', 'banners/', 'featured-products/'],
};

/**
 * WebSocket Configuration
 */
export const WEBSOCKET_CONFIG = {
  BASE_URL: isDevelopment ? 'ws://localhost:8000/ws' : 'wss://api.shoponline.ug/ws',

  ENDPOINTS: {
    NOTIFICATIONS: '/notifications/',
    ORDERS: '/orders/',
    ADMIN: '/admin/',
    FLASH_SALES: '/flash-sales/',
  },

  RECONNECT_INTERVAL: 5000, // 5 seconds
  MAX_RECONNECT_ATTEMPTS: 10,
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
};

/**
 * Payment API Configuration
 */
export const PAYMENT_CONFIG = {
  // MTN Mobile Money
  MTN: {
    BASE_URL: isDevelopment
      ? 'https://sandbox.momodeveloper.mtn.com'
      : 'https://momodeveloper.mtn.com',
    API_VERSION: 'v1_0',
    ENVIRONMENT: isDevelopment ? 'sandbox' : 'mtnyuganda',
    CURRENCY: 'UGX',
    CALLBACK_URL: `${API_CONFIG.BASE_URL}/api/v1/payments/webhooks/mtn/`,
  },

  // Airtel Money
  AIRTEL: {
    BASE_URL: isDevelopment ? 'https://openapiuat.airtel.africa' : 'https://openapi.airtel.africa',
    API_VERSION: 'v1',
    ENVIRONMENT: isDevelopment ? 'staging' : 'live',
    CURRENCY: 'UGX',
    COUNTRY: 'UG',
    CALLBACK_URL: `${API_CONFIG.BASE_URL}/api/v1/payments/webhooks/airtel/`,
  },

  // Cash on Delivery
  COD: {
    ADMIN_NOTIFICATION_DELAY: 1000, // 1 second
    AUTO_CONFIRM_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
    DELIVERY_WINDOW: {
      START_HOUR: 8, // 8 AM
      END_HOUR: 18, // 6 PM
    },
  },

  // Payment timeouts
  TIMEOUTS: {
    MTN_MOMO: 300000, // 5 minutes
    AIRTEL_MONEY: 300000, // 5 minutes
    COD: 86400000, // 24 hours
  },
};

/**
 * Uganda-specific Configuration
 */
export const UGANDA_CONFIG = {
  TIMEZONE: 'Africa/Kampala',
  CURRENCY: 'UGX',
  CURRENCY_SYMBOL: 'UGX',
  COUNTRY_CODE: '+256',

  // Phone number validation
  PHONE_PATTERNS: {
    MTN: /^(\+256|0)?(77|78|39)\d{7}$/,
    AIRTEL: /^(\+256|0)?(70|75|74)\d{7}$/,
    GENERAL: /^(\+256|0)?[7][0-9]\d{7}$/,
  },

  // Delivery regions
  DELIVERY_REGIONS: [
    'Central',
    'Eastern',
    'Northern',
    'Western',
    'Kampala',
    'Wakiso',
    'Mukono',
    'Jinja',
    'Mbale',
    'Gulu',
    'Lira',
    'Mbarara',
    'Fort Portal',
    'Kasese',
  ],

  // Business hours
  BUSINESS_HOURS: {
    START: 8, // 8 AM
    END: 18, // 6 PM
    TIMEZONE: 'Africa/Kampala',
  },
};

/**
 * Pagination Configuration
 */
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],

  // Page size for different content types
  CONTENT_PAGE_SIZES: {
    PRODUCTS: 20,
    CATEGORIES: 50,
    ORDERS: 25,
    FLASH_SALES: 10,
    NOTIFICATIONS: 15,
    ADMIN_PRODUCTS: 50,
    ADMIN_ORDERS: 25,
  },
};

/**
 * File Upload Configuration
 */
export const UPLOAD_CONFIG = {
  // File size limits
  MAX_SIZES: {
    IMAGE: 5 * 1024 * 1024, // 5MB
    DOCUMENT: 10 * 1024 * 1024, // 10MB
    AVATAR: 2 * 1024 * 1024, // 2MB
  },

  // Allowed file types
  ALLOWED_TYPES: {
    IMAGES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    DOCUMENTS: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    AVATARS: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  },

  // Image processing
  IMAGE_QUALITY: 0.85,
  THUMBNAIL_SIZES: {
    SMALL: { width: 150, height: 150 },
    MEDIUM: { width: 300, height: 300 },
    LARGE: { width: 600, height: 600 },
  },

  // Upload paths
  PATHS: {
    PRODUCTS: 'products/images/',
    CATEGORIES: 'categories/',
    BANNERS: 'banners/',
    AVATARS: 'users/avatars/',
    DOCUMENTS: 'documents/',
  },
};

/**
 * Search Configuration
 */
export const SEARCH_CONFIG = {
  // Search debounce delay
  DEBOUNCE_DELAY: 300,

  // Minimum search query length
  MIN_QUERY_LENGTH: 2,

  // Maximum search results
  MAX_RESULTS: 100,

  // Search filters
  FILTERS: {
    PRODUCTS: ['category', 'price_min', 'price_max', 'in_stock', 'brand'],
    CATEGORIES: ['parent', 'level'],
    ORDERS: ['status', 'payment_method', 'date_from', 'date_to'],
    USERS: ['role', 'is_active', 'date_joined'],
  },

  // Sort options
  SORT_OPTIONS: {
    PRODUCTS: [
      { value: 'name', label: 'Name (A-Z)' },
      { value: '-name', label: 'Name (Z-A)' },
      { value: 'price', label: 'Price (Low to High)' },
      { value: '-price', label: 'Price (High to Low)' },
      { value: '-created_at', label: 'Newest First' },
      { value: 'created_at', label: 'Oldest First' },
    ],
    ORDERS: [
      { value: '-created_at', label: 'Newest First' },
      { value: 'created_at', label: 'Oldest First' },
      { value: '-total_amount', label: 'Highest Value' },
      { value: 'total_amount', label: 'Lowest Value' },
    ],
  },
};

/**
 * Flash Sale Configuration
 */
export const FLASH_SALE_CONFIG = {
  // Timer update intervals
  TIMER_INTERVALS: {
    CRITICAL: 1000, // 1 second (< 1 hour remaining)
    HIGH: 1000, // 1 second (< 6 hours remaining)
    MEDIUM: 60000, // 1 minute (< 24 hours remaining)
    LOW: 300000, // 5 minutes (> 24 hours remaining)
  },

  // Discount limits
  MAX_DISCOUNT_PERCENTAGE: 90,
  MIN_DISCOUNT_PERCENTAGE: 5,

  // Display settings
  HOMEPAGE_DISPLAY_COUNT: 8,
  CARD_DISPLAY_COUNT: 12,

  // Notification thresholds
  NOTIFY_THRESHOLDS: {
    ENDING_SOON: 60 * 60 * 1000, // 1 hour
    LAST_CHANCE: 15 * 60 * 1000, // 15 minutes
  },
};

/**
 * Admin Configuration
 */
export const ADMIN_CONFIG = {
  // Dashboard refresh intervals
  DASHBOARD_REFRESH: 30000, // 30 seconds

  // Real-time updates
  REALTIME_ENDPOINTS: ['orders/', 'notifications/', 'payments/admin/cod/'],

  // Bulk operation limits
  BULK_LIMITS: {
    PRODUCTS: 100,
    ORDERS: 50,
    CATEGORIES: 25,
  },

  // Analytics refresh intervals
  ANALYTICS_REFRESH: {
    REAL_TIME: 10000, // 10 seconds
    HOURLY: 300000, // 5 minutes
    DAILY: 1800000, // 30 minutes
  },
};

/**
 * API Response Handlers
 */
export const responseHandlers = {
  /**
   * Handle success response
   * @param {Object} response - API response
   * @returns {Object} Processed response
   */
  handleSuccess(response) {
    return {
      success: true,
      data: response.data,
      status: response.status,
      headers: response.headers,
    };
  },

  /**
   * Handle error response
   * @param {Object} error - API error
   * @returns {Object} Processed error
   */
  handleError(error) {
    const response = error.response;

    return {
      success: false,
      error: {
        message: this.getErrorMessage(error),
        status: response?.status,
        code: response?.data?.code,
        details: response?.data?.detail || response?.data?.message,
        field_errors: response?.data?.errors || response?.data,
      },
    };
  },

  /**
   * Get appropriate error message
   * @param {Object} error - API error
   * @returns {string} Error message
   */
  getErrorMessage(error) {
    if (!error.response) {
      return ERROR_MESSAGES.NETWORK;
    }

    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case STATUS_CODES.UNAUTHORIZED:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case STATUS_CODES.FORBIDDEN:
        return ERROR_MESSAGES.FORBIDDEN;
      case STATUS_CODES.NOT_FOUND:
        return ERROR_MESSAGES.NOT_FOUND;
      case STATUS_CODES.UNPROCESSABLE_ENTITY:
        return data?.detail || ERROR_MESSAGES.VALIDATION;
      case STATUS_CODES.TOO_MANY_REQUESTS:
        return ERROR_MESSAGES.RATE_LIMITED;
      case STATUS_CODES.INTERNAL_SERVER_ERROR:
        return ERROR_MESSAGES.SERVER_ERROR;
      default:
        return data?.detail || data?.message || ERROR_MESSAGES.SERVER_ERROR;
    }
  },
};

/**
 * Request Interceptor Configuration
 */
export const interceptorConfig = {
  /**
   * Request interceptor
   * @param {Object} config - Request configuration
   * @returns {Object} Modified request configuration
   */
  request(config) {
    // Add timestamp to prevent caching
    if (config.method === 'GET' && !config.cache) {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    // Add request ID for tracking
    config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add client information
    config.headers['X-Client-Platform'] = 'web';
    config.headers['X-Client-Version'] = '1.0.0';

    return config;
  },

  /**
   * Response interceptor
   * @param {Object} response - API response
   * @returns {Object} Processed response
   */
  response(response) {
    // Log successful responses in development
    if (isDevelopment) {
      console.log(
        `API Success: ${response.config.method?.toUpperCase()} ${response.config.url}`,
        response.data
      );
    }

    return responseHandlers.handleSuccess(response);
  },

  /**
   * Error interceptor
   * @param {Object} error - API error
   * @returns {Promise} Rejected promise with processed error
   */
  error(error) {
    // Log errors in development
    if (isDevelopment) {
      console.error(
        `API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        error.response?.data
      );
    }

    const processedError = responseHandlers.handleError(error);

    // Handle specific error cases
    if (error.response?.status === STATUS_CODES.UNAUTHORIZED) {
      // Trigger logout if token is invalid
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    return Promise.reject(processedError);
  },
};

/**
 * API Validation Rules
 */
export const VALIDATION_RULES = {
  EMAIL: {
    ADMIN: /^[a-zA-Z0-9._%+-]+@shoponline\.com$/,
    CLIENT: /^[a-zA-Z0-9._%+-]+@gmail\.com$/,
    GENERAL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  },

  PHONE: {
    UGANDA: /^(\+256|0)?[7][0-9]\d{7}$/,
    MTN: /^(\+256|0)?(77|78|39)\d{7}$/,
    AIRTEL: /^(\+256|0)?(70|75|74)\d{7}$/,
  },

  PASSWORD: {
    MIN_LENGTH: 8,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  },

  // Order validation
  ORDER: {
    MIN_AMOUNT: 1000, // UGX 1,000
    MAX_AMOUNT: 50000000, // UGX 50,000,000
    MAX_ITEMS: 50,
  },

  // Product validation
  PRODUCT: {
    NAME_MAX_LENGTH: 255,
    DESCRIPTION_MAX_LENGTH: 2000,
    SKU_PATTERN: /^[A-Z0-9-_]{3,20}$/,
    MIN_PRICE: 100, // UGX 100
    MAX_PRICE: 100000000, // UGX 100,000,000
  },
};

/**
 * API Utility Functions
 */
export const apiUtils = {
  /**
   * Check if response is successful
   * @param {Object} response - API response
   * @returns {boolean} Whether response is successful
   */
  isSuccessResponse(response) {
    return response && response.success === true;
  },

  /**
   * Extract error message from response
   * @param {Object} response - API response
   * @returns {string} Error message
   */
  getErrorMessage(response) {
    if (!response || !response.error) return ERROR_MESSAGES.SERVER_ERROR;

    return response.error.message || response.error.details || ERROR_MESSAGES.SERVER_ERROR;
  },

  /**
   * Extract field errors from response
   * @param {Object} response - API response
   * @returns {Object} Field errors object
   */
  getFieldErrors(response) {
    if (!response || !response.error || !response.error.field_errors) {
      return {};
    }

    return response.error.field_errors;
  },

  /**
   * Check if error is a network error
   * @param {Object} error - Error object
   * @returns {boolean} Whether error is network-related
   */
  isNetworkError(error) {
    return !error.response && error.request;
  },

  /**
   * Check if error is a timeout error
   * @param {Object} error - Error object
   * @returns {boolean} Whether error is timeout-related
   */
  isTimeoutError(error) {
    return error.code === 'ECONNABORTED';
  },

  /**
   * Build full API URL
   * @param {string} endpoint - API endpoint
   * @returns {string} Full API URL
   */
  buildApiUrl(endpoint) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${API_ENDPOINTS.BASE}/${cleanEndpoint}`;
  },

  /**
   * Format request for logging
   * @param {Object} config - Request configuration
   * @returns {string} Formatted request string
   */
  formatRequest(config) {
    return `${config.method?.toUpperCase()} ${config.url}`;
  },

  /**
   * Create request signature for caching
   * @param {Object} config - Request configuration
   * @returns {string} Request signature
   */
  createRequestSignature(config) {
    const { method, url, params, data } = config;
    const signature = JSON.stringify({ method, url, params, data });
    return btoa(signature);
  },
};

/**
 * Development Configuration
 */
export const DEV_CONFIG = {
  // Mock data settings
  USE_MOCK_DATA: false,
  MOCK_DELAY: 1000, // 1 second delay for mock responses

  // Debug settings
  LOG_API_CALLS: true,
  LOG_WEBSOCKET_EVENTS: true,
  LOG_CACHE_OPERATIONS: true,

  // Development tools
  ENABLE_DEV_TOOLS: isDevelopment,
  SHOW_API_RESPONSES: isDevelopment,
};

/**
 * Production Configuration
 */
export const PROD_CONFIG = {
  // Performance settings
  ENABLE_COMPRESSION: true,
  ENABLE_CACHING: true,
  CACHE_STATIC_ASSETS: true,

  // Security settings
  ENFORCE_HTTPS: true,
  ENABLE_CSP: true,
  ENABLE_HSTS: true,

  // Monitoring
  ENABLE_ERROR_TRACKING: true,
  ENABLE_PERFORMANCE_MONITORING: true,
};

/**
 * Feature Flags
 */
export const FEATURE_FLAGS = {
  // Core features
  FLASH_SALES: true,
  MOBILE_MONEY: true,
  CASH_ON_DELIVERY: true,
  GUEST_CHECKOUT: true,

  // Advanced features
  PRODUCT_REVIEWS: false, // Future feature
  PRODUCT_RECOMMENDATIONS: false, // Future feature
  WISHLIST: true,
  PRODUCT_COMPARISON: false, // Future feature

  // Admin features
  ADMIN_ANALYTICS: true,
  BULK_OPERATIONS: true,
  ADMIN_NOTIFICATIONS: true,
  CONTENT_MANAGEMENT: true,

  // Experimental features
  PWA_SUPPORT: false,
  OFFLINE_MODE: false,
  PUSH_NOTIFICATIONS: false,
};

/**
 * Export main configuration object
 */
export const API = {
  CONFIG: API_CONFIG,
  ENDPOINTS: API_ENDPOINTS,
  HEADERS,
  STATUS_CODES,
  ERROR_MESSAGES,
  REQUEST_CONFIGS,
  CACHE_CONFIG,
  WEBSOCKET_CONFIG,
  PAYMENT_CONFIG,
  UGANDA_CONFIG,
  PAGINATION_CONFIG,
  UPLOAD_CONFIG,
  SEARCH_CONFIG,
  VALIDATION_RULES,
  FEATURE_FLAGS,
  utils: apiUtils,
  routeBuilder,
  responseHandlers,
  interceptorConfig,
};

export default API;
