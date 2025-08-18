// src/utils/constants/api.js - COMPLETE MERGED VERSION
/**
 * API endpoints constants for ShopOnline Uganda E-commerce Platform
 * MERGED: Fixed version combined with existing version to include all features
 * Contains all API endpoint URLs used throughout the frontend application.
 * Organized by feature/module to match the Django backend structure.
 */

// Base configuration
const API_VERSION = 'v1';
const BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_BASE = `${BASE_URL}/api/${API_VERSION}`;

// =============================================================================
// AUTHENTICATION ENDPOINTS
// =============================================================================

export const AUTH_ENDPOINTS = {
  // Registration
  REGISTER_CLIENT: `${API_BASE}/auth/register/client/`,
  REGISTER_ADMIN: `${API_BASE}/auth/register/admin/`,

  // Authentication
  LOGIN: `${API_BASE}/auth/login/`,
  LOGOUT: `${API_BASE}/auth/logout/`,
  TOKEN_REFRESH: `${API_BASE}/auth/token/refresh/`,

  // Profile management
  PROFILE: `${API_BASE}/auth/profile/`,

  // Admin invitations
  INVITATIONS: `${API_BASE}/auth/invitations/`,
  INVITATION_DETAIL: id => `${API_BASE}/auth/invitations/${id}/`,
  VALIDATE_INVITATION: token => `${API_BASE}/auth/invitations/validate/${token}/`,

  // Password management
  FORGOT_PASSWORD: `${API_BASE}/auth/forgot-password/`,
  RESET_PASSWORD: `${API_BASE}/auth/reset-password/`,
  CHANGE_PASSWORD: `${API_BASE}/auth/change-password/`,

  // Email verification
  VERIFY_EMAIL: `${API_BASE}/auth/verify-email/`,
  RESEND_VERIFICATION: `${API_BASE}/auth/resend-verification/`,
};

// =============================================================================
// PRODUCT ENDPOINTS - MERGED WITH ALL FEATURES
// =============================================================================

export const PRODUCT_ENDPOINTS = {
  // Main product operations - FIXED: Corrected URL pattern
  PRODUCTS: `${API_BASE}/products/`,
  PRODUCT_DETAIL: id => `${API_BASE}/products/${id}/`,

  // Product images
  PRODUCT_IMAGES: productId => `${API_BASE}/products/${productId}/images/`,
  PRODUCT_IMAGE_DETAIL: (productId, imageId) =>
    `${API_BASE}/products/${productId}/images/${imageId}/`,

  // Product attributes and variants
  PRODUCT_ATTRIBUTES: productId => `${API_BASE}/products/${productId}/attributes/`,
  PRODUCT_VARIANTS: productId => `${API_BASE}/products/${productId}/variants/`,

  // Analytics and insights
  PRODUCT_ANALYTICS: `${API_BASE}/products/analytics/`,
  TOP_PRODUCTS: `${API_BASE}/products/top/`,
  PRODUCT_RECOMMENDATIONS: `${API_BASE}/products/recommendations/`,

  // Product history and tracking
  PRODUCT_PRICE_HISTORY: productId => `${API_BASE}/products/${productId}/price-history/`,

  // Inventory management
  PRODUCT_INVENTORY: `${API_BASE}/products/inventory/`,

  // Product operations
  FEATURED_PRODUCTS: `${API_BASE}/products/featured/`,
  SEARCH_PRODUCTS: `${API_BASE}/products/search/`,
  PRODUCT_DUPLICATE: productId => `${API_BASE}/products/${productId}/duplicate/`,
  PRODUCT_COMPARE: `${API_BASE}/products/compare/`,

  // Reviews
  PRODUCT_REVIEW_SUMMARY: productId =>
    `${API_BASE}/products/${productId}/reviews/summary/`,
};

// =============================================================================
// CATEGORY ENDPOINTS - FIXED
// =============================================================================

export const CATEGORY_ENDPOINTS = {
  // Main category operations
  CATEGORIES: `${API_BASE}/categories/`,
  CATEGORY_DETAIL: slug => `${API_BASE}/categories/${slug}/`,

  // Category structure - FIXED: Match backend URL patterns
  CATEGORY_TREE: `${API_BASE}/categories/tree/`,
  FEATURED_CATEGORIES: `${API_BASE}/categories/featured/`,
  ROOT_CATEGORIES: `${API_BASE}/categories/?parent=root&is_active=true`,

  // Category products
  CATEGORY_PRODUCTS: slug => `${API_BASE}/categories/${slug}/products/`,

  // Category operations
  CATEGORY_BULK_ACTION: `${API_BASE}/categories/bulk_action/`,
  CATEGORY_SEARCH: `${API_BASE}/categories/search/`,
  TOGGLE_FEATURED: slug => `${API_BASE}/categories/${slug}/toggle_featured/`,
  TOGGLE_ACTIVE: slug => `${API_BASE}/categories/${slug}/toggle_active/`,

  // Category statistics
  CATEGORY_STATS: `${API_BASE}/categories/stats/`,
};

// =============================================================================
// FLASH SALES ENDPOINTS - FIXED TO MATCH BACKEND EXACTLY
// =============================================================================

export const FLASH_SALES_ENDPOINTS = {
  // Flash sales management
  FLASH_SALES: `${API_BASE}/flash-sales/sales/`,
  FLASH_SALE_DETAIL: id => `${API_BASE}/flash-sales/sales/${id}/`,

  // Flash sale products
  FLASH_SALE_PRODUCTS: `${API_BASE}/flash-sales/products/`,
  FLASH_SALE_PRODUCT_DETAIL: id => `${API_BASE}/flash-sales/products/${id}/`,

  // FIXED: Flash sale operations with correct endpoint names from backend
  ACTIVE_FLASH_SALES: `${API_BASE}/flash-sales/sales/active_sales/`,
  UPCOMING_FLASH_SALES: `${API_BASE}/flash-sales/sales/upcoming_sales/`,
  FLASH_SALE_WITH_PRODUCTS: id => `${API_BASE}/flash-sales/sales/${id}/with_products/`,
  FLASH_SALE_ANALYTICS: `${API_BASE}/flash-sales/analytics/`,

  // FIXED: Flash sale actions with correct endpoint names from backend
  ADD_PRODUCTS_TO_SALE: id => `${API_BASE}/flash-sales/sales/${id}/add_products/`,
  ACTIVATE_FLASH_SALE: id => `${API_BASE}/flash-sales/sales/${id}/activate/`,
  DEACTIVATE_FLASH_SALE: id => `${API_BASE}/flash-sales/sales/${id}/deactivate/`,
  FLASH_SALE_ANALYTICS_DETAIL: id => `${API_BASE}/flash-sales/sales/${id}/analytics/`,
};

// =============================================================================
// ORDER ENDPOINTS
// =============================================================================

export const ORDER_ENDPOINTS = {
  // Order management
  ORDERS: `${API_BASE}/orders/`,
  ORDER_DETAIL: id => `${API_BASE}/orders/${id}/`,

  // Order actions
  CANCEL_ORDER: id => `${API_BASE}/orders/${id}/cancel/`,
  CONFIRM_ORDER: id => `${API_BASE}/orders/${id}/confirm/`,
  MARK_DELIVERED: id => `${API_BASE}/orders/${id}/deliver/`,

  // Order notes
  ORDER_NOTES: orderId => `${API_BASE}/orders/${orderId}/notes/`,

  // Cash on Delivery
  COD_ORDERS: `${API_BASE}/orders/cod/`,
  VERIFY_COD_ORDER: id => `${API_BASE}/orders/${id}/verify-cod/`,

  // Analytics and reporting
  ORDER_ANALYTICS: `${API_BASE}/orders/analytics/`,
  CUSTOMER_ORDER_SUMMARY: `${API_BASE}/orders/customer-summary/`,

  // Bulk operations
  BULK_UPDATE_ORDERS: `${API_BASE}/orders/bulk-update/`,

  // Order tracking
  ORDER_TRACKING: orderNumber => `${API_BASE}/orders/track/${orderNumber}/`,
};

// =============================================================================
// PAYMENT ENDPOINTS
// =============================================================================

export const PAYMENT_ENDPOINTS = {
  // Payment methods
  PAYMENT_METHODS: `${API_BASE}/payments/methods/`,

  // Payment processing
  CREATE_PAYMENT: `${API_BASE}/payments/create/`,
  PAYMENT_DETAIL: id => `${API_BASE}/payments/${id}/`,
  PAYMENT_LIST: `${API_BASE}/payments/`,
  VERIFY_PAYMENT: id => `${API_BASE}/payments/${id}/verify/`,
  CANCEL_PAYMENT: id => `${API_BASE}/payments/${id}/cancel/`,
  PAYMENT_RECEIPT: id => `${API_BASE}/payments/${id}/receipt/`,

  // Utility endpoints
  CHECK_PHONE: `${API_BASE}/payments/check-phone/`,

  // Webhook endpoints
  MTN_WEBHOOK: `${API_BASE}/payments/webhooks/mtn/`,
  AIRTEL_WEBHOOK: `${API_BASE}/payments/webhooks/airtel/`,

  // Admin payment management
  ADMIN_PAYMENTS: `${API_BASE}/payments/admin/payments/`,
  ADMIN_UPDATE_PAYMENT_STATUS: id => `${API_BASE}/payments/admin/${id}/update-status/`,
  ADMIN_COD_PAYMENTS: `${API_BASE}/payments/admin/cod/`,
  ADMIN_ASSIGN_COD: id => `${API_BASE}/payments/admin/cod/${id}/assign/`,
  ADMIN_DELIVERY_ATTEMPT: id => `${API_BASE}/payments/admin/cod/${id}/delivery-attempt/`,
  ADMIN_COMPLETE_COD: id => `${API_BASE}/payments/admin/cod/${id}/complete/`,
  ADMIN_BULK_ASSIGN_COD: `${API_BASE}/payments/admin/cod/bulk-assign/`,
  ADMIN_PAYMENT_ANALYTICS: `${API_BASE}/payments/admin/analytics/`,
  ADMIN_WEBHOOK_LOGS: `${API_BASE}/payments/admin/webhooks/`,
  ADMIN_RETRY_PAYMENT: id => `${API_BASE}/payments/admin/${id}/retry/`,

  // Payment method configuration
  ADMIN_PAYMENT_METHODS: `${API_BASE}/payments/admin/methods/`,
  ADMIN_UPDATE_PAYMENT_METHOD: method => `${API_BASE}/payments/admin/methods/${method}/`,
};

// =============================================================================
// NOTIFICATION ENDPOINTS - FIXED
// =============================================================================

export const NOTIFICATION_ENDPOINTS = {
  // Client notifications - FIXED: Match backend URL patterns
  NOTIFICATIONS: `${API_BASE}/notifications/`,
  NOTIFICATION_DETAIL: id => `${API_BASE}/notifications/${id}/`,
  MARK_AS_READ: `${API_BASE}/notifications/mark-as-read/`,
  MARK_ALL_READ: `${API_BASE}/notifications/mark-all-read/`,
  NOTIFICATION_COUNTS: `${API_BASE}/notifications/counts/`,
  NOTIFICATION_SETTINGS: `${API_BASE}/notifications/settings/`,

  // Admin notifications - FIXED: Match backend URL patterns
  ADMIN_NOTIFICATIONS: `${API_BASE}/notifications/admin/`,
  SEND_TEST_NOTIFICATION: `${API_BASE}/notifications/admin/test-notification/`,
  BROADCAST_NOTIFICATION: `${API_BASE}/notifications/admin/broadcast/`,
};

// =============================================================================
// ADMIN DASHBOARD ENDPOINTS
// =============================================================================

export const ADMIN_ENDPOINTS = {
  // Homepage content management
  HOMEPAGE_CONTENT: `${API_BASE}/admin/homepage-content/`,
  HOMEPAGE_CONTENT_DETAIL: id => `${API_BASE}/admin/homepage-content/${id}/`,

  // Banner management
  BANNERS: `${API_BASE}/admin/banners/`,
  BANNER_DETAIL: id => `${API_BASE}/admin/banners/${id}/`,

  // Featured products
  FEATURED_PRODUCTS: `${API_BASE}/admin/featured-products/`,
  FEATURED_PRODUCT_DETAIL: id => `${API_BASE}/admin/featured-products/${id}/`,

  // Site settings
  SITE_SETTINGS: `${API_BASE}/admin/site-settings/`,
  SITE_SETTING_DETAIL: id => `${API_BASE}/admin/site-settings/${id}/`,

  // Analytics
  DASHBOARD_ANALYTICS: `${API_BASE}/admin/analytics/`,
};

// =============================================================================
// UTILITY ENDPOINTS
// =============================================================================

export const UTILITY_ENDPOINTS = {
  // Health check
  HEALTH_CHECK: `${BASE_URL}/health/`,

  // API root
  API_ROOT: `${API_BASE}/`,

  // File upload
  UPLOAD_IMAGE: `${API_BASE}/upload/image/`,
  UPLOAD_DOCUMENT: `${API_BASE}/upload/document/`,

  // Search
  GLOBAL_SEARCH: `${API_BASE}/search/`,
};

// =============================================================================
// WEBSOCKET ENDPOINTS
// =============================================================================

const WS_BASE = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

export const WEBSOCKET_ENDPOINTS = {
  // Admin notifications
  ADMIN_NOTIFICATIONS: `${WS_BASE}/ws/admin/notifications/`,

  // Order updates
  ORDER_UPDATES: `${WS_BASE}/ws/orders/`,

  // Payment status
  PAYMENT_STATUS: `${WS_BASE}/ws/payments/`,

  // Flash sale timers
  FLASH_SALE_TIMERS: `${WS_BASE}/ws/flash-sales/`,
};

// =============================================================================
// QUERY PARAMETER HELPERS
// =============================================================================

export const QUERY_PARAMS = {
  // Pagination
  PAGE: 'page',
  PAGE_SIZE: 'page_size',

  // Filtering
  SEARCH: 'search',
  CATEGORY: 'category',
  STATUS: 'status',
  PRICE_MIN: 'price_min',
  PRICE_MAX: 'price_max',

  // Sorting
  ORDERING: 'ordering',

  // Product specific
  IN_STOCK: 'in_stock',
  FEATURED: 'featured',
  ON_SALE: 'on_sale',

  // Date filters
  DATE_FROM: 'date_from',
  DATE_TO: 'date_to',

  // Admin filters
  USER_TYPE: 'user_type',
  PAYMENT_METHOD: 'payment_method',
  IS_COD: 'is_cod',
};

// =============================================================================
// HTTP METHODS
// =============================================================================

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
};

// =============================================================================
// API RESPONSE STATUS CODES
// =============================================================================

export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
};

// =============================================================================
// API CONFIGURATION
// =============================================================================

export const API_CONFIG = {
  BASE_URL,
  API_BASE,
  API_VERSION,
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second

  // Request headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },

  // File upload headers
  UPLOAD_HEADERS: {
    Accept: 'application/json',
    // Content-Type will be set automatically for multipart/form-data
  },
};

// =============================================================================
// ERROR HANDLING
// =============================================================================

export const API_ERROR_CODES = {
  // Authentication errors
  AUTH_001: 'Invalid credentials',
  AUTH_002: 'Account not activated',
  AUTH_003: 'Token expired',
  AUTH_004: 'Invalid token',
  AUTH_005: 'Insufficient permissions',

  // Validation errors
  VAL_001: 'Invalid email format',
  VAL_002: 'Invalid phone number',
  VAL_003: 'Password too weak',
  VAL_004: 'Required field missing',
  VAL_005: 'Invalid file format',

  // Payment errors
  PAY_001: 'Payment method not supported',
  PAY_002: 'Insufficient funds',
  PAY_003: 'Payment gateway error',
  PAY_004: 'Invalid payment amount',
  PAY_005: 'Payment timeout',

  // Order errors
  ORD_001: 'Product out of stock',
  ORD_002: 'Invalid order status transition',
  ORD_003: 'Order not found',
  ORD_004: 'Cannot cancel order',
  ORD_005: 'Delivery address required',

  // Flash sale errors
  FLS_001: 'Flash sale not active',
  FLS_002: 'Flash sale expired',
  FLS_003: 'Product not in flash sale',
  FLS_004: 'Flash sale limit exceeded',

  // Admin invitation errors
  INV_001: 'Invalid invitation token',
  INV_002: 'Invitation expired',
  INV_003: 'Invitation already used',
  INV_004: 'Invalid email domain for admin',
};

// =============================================================================
// DEVELOPMENT HELPERS
// =============================================================================

export const DEV_ENDPOINTS = {
  // Mock data endpoints (development only)
  MOCK_PRODUCTS: `${API_BASE}/dev/mock-products/`,
  MOCK_ORDERS: `${API_BASE}/dev/mock-orders/`,
  MOCK_USERS: `${API_BASE}/dev/mock-users/`,

  // Test endpoints
  TEST_EMAIL: `${API_BASE}/dev/test-email/`,
  TEST_SMS: `${API_BASE}/dev/test-sms/`,
  TEST_PAYMENT: `${API_BASE}/dev/test-payment/`,
};

// =============================================================================
// EXPORTED OBJECTS
// =============================================================================

// Combined endpoints object for easy access
export const API_ENDPOINTS = {
  ...AUTH_ENDPOINTS,
  ...PRODUCT_ENDPOINTS,
  ...CATEGORY_ENDPOINTS,
  ...FLASH_SALES_ENDPOINTS,
  ...ORDER_ENDPOINTS,
  ...PAYMENT_ENDPOINTS,
  ...NOTIFICATION_ENDPOINTS,
  ...ADMIN_ENDPOINTS,
  ...UTILITY_ENDPOINTS,
  ...WEBSOCKET_ENDPOINTS,
};

// Helper function to build URLs with query parameters
export const buildUrl = (baseUrl, params = {}) => {
  const url = new URL(baseUrl);
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
      url.searchParams.append(key, params[key]);
    }
  });
  return url.toString();
};

// Helper function to get paginated URL
export const getPaginatedUrl = (baseUrl, page = 1, pageSize = 20, filters = {}) => {
  return buildUrl(baseUrl, {
    [QUERY_PARAMS.PAGE]: page,
    [QUERY_PARAMS.PAGE_SIZE]: pageSize,
    ...filters,
  });
};

// Helper function to validate endpoint URL
export const isValidEndpoint = url => {
  try {
    new URL(url);
    return url.startsWith(API_BASE) || url.startsWith(WS_BASE);
  } catch {
    return false;
  }
};

// Development flag
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

export default API_ENDPOINTS;