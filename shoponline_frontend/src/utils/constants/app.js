// Application constants for the Ugandan e-commerce platform
// Contains all app-wide configuration and constant values

// Application Information
export const APP_INFO = {
  NAME: 'Shop Online',
  FULL_NAME: "Shop Online - Uganda's Premier E-commerce Platform",
  VERSION: '1.0.0',
  DESCRIPTION:
    'A modern e-commerce platform designed specifically for Uganda with Mobile Money payments',
  AUTHOR: 'Shop Online Team',
  CONTACT_EMAIL: 'info@shoponline.com',
  SUPPORT_EMAIL: 'support@shoponline.com',
  ADMIN_EMAIL: 'admin@shoponline.com',
};

// Application Configuration
export const APP_CONFIG = {
  // Pagination
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 100,
  PRODUCTS_PER_PAGE: 12,
  ORDERS_PER_PAGE: 10,
  ADMIN_ITEMS_PER_PAGE: 20,

  // Search
  SEARCH_MIN_CHARACTERS: 2,
  SEARCH_DEBOUNCE_MS: 300,
  SEARCH_MAX_RESULTS: 50,

  // Image Configuration
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB in bytes
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  MAX_IMAGES_PER_PRODUCT: 10,
  IMAGE_QUALITY: 0.8,
  THUMBNAIL_SIZE: { width: 300, height: 300 },
  LARGE_IMAGE_SIZE: { width: 800, height: 800 },

  // Cart Configuration
  MAX_CART_ITEMS: 50,
  MAX_QUANTITY_PER_ITEM: 99,
  CART_STORAGE_KEY: 'shoponline_cart',
  CART_EXPIRY_DAYS: 30,

  // Authentication
  TOKEN_STORAGE_KEY: 'shoponline_token',
  REFRESH_TOKEN_KEY: 'shoponline_refresh',
  USER_STORAGE_KEY: 'shoponline_user',
  TOKEN_EXPIRY_BUFFER: 5 * 60 * 1000, // 5 minutes in milliseconds
  PASSWORD_MIN_LENGTH: 8,

  // Session Configuration
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  ADMIN_SESSION_TIMEOUT: 8 * 60 * 60 * 1000, // 8 hours for admin
  REMEMBER_ME_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days

  // API Configuration
  REQUEST_TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second

  // Flash Sales
  FLASH_SALE_COUNTDOWN_UPDATE: 1000, // Update every second
  FLASH_SALE_WARNING_TIME: 60 * 60 * 1000, // 1 hour warning

  // Notifications
  NOTIFICATION_DURATION: 5000, // 5 seconds
  MAX_NOTIFICATIONS: 5,
  WEBSOCKET_RECONNECT_INTERVAL: 5000, // 5 seconds

  // Validation
  PHONE_REGEX: /^(\+256|0)[7-9]\d{8}$/, // Uganda phone number format
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Currency
  CURRENCY: 'UGX',
  CURRENCY_SYMBOL: 'UGX',
  DECIMAL_PLACES: 0, // Uganda Shillings don't use decimal places
  THOUSAND_SEPARATOR: ',',

  // Localization
  DEFAULT_LOCALE: 'en-UG',
  TIMEZONE: 'Africa/Kampala',
  DATE_FORMAT: 'DD/MM/YYYY',
  TIME_FORMAT: 'HH:mm',
  DATETIME_FORMAT: 'DD/MM/YYYY HH:mm',

  // Performance
  LAZY_LOADING_THRESHOLD: 100, // pixels from viewport
  IMAGE_LAZY_LOADING: true,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes

  // Security
  CSP_NONCE_LENGTH: 32,
  RATE_LIMIT_REQUESTS: 100,
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes

  // Admin Configuration
  ADMIN_EMAIL_DOMAIN: '@shoponline.com',
  CLIENT_EMAIL_DOMAIN: '@gmail.com',
  INVITATION_EXPIRY: 48 * 60 * 60 * 1000, // 48 hours

  // File Upload
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
    'text/csv',
  ],
};

// UI Constants
export const UI_CONFIG = {
  // Blue Theme Colors (matching the platform theme)
  COLORS: {
    PRIMARY: '#2563eb',
    PRIMARY_DARK: '#1e40af',
    PRIMARY_LIGHT: '#3b82f6',
    ACCENT: '#60a5fa',
    SECONDARY: '#64748b',
    SUCCESS: '#10b981',
    WARNING: '#f59e0b',
    ERROR: '#ef4444',
    BACKGROUND: '#f8fafc',
    SURFACE: '#ffffff',
    TEXT_PRIMARY: '#1e293b',
    TEXT_SECONDARY: '#64748b',
    BORDER: '#e2e8f0',
  },

  // Breakpoints
  BREAKPOINTS: {
    XS: 480,
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    '2XL': 1536,
  },

  // Z-Index Scale
  Z_INDEX: {
    DROPDOWN: 1000,
    STICKY: 1020,
    FIXED: 1030,
    MODAL_BACKDROP: 1040,
    MODAL: 1050,
    POPOVER: 1060,
    TOOLTIP: 1070,
    TOAST: 1080,
  },

  // Spacing Scale
  SPACING: {
    XS: '0.25rem',
    SM: '0.5rem',
    MD: '1rem',
    LG: '1.5rem',
    XL: '2rem',
    '2XL': '3rem',
    '3XL': '4rem',
  },

  // Border Radius
  BORDER_RADIUS: {
    NONE: '0',
    SM: '0.125rem',
    DEFAULT: '0.25rem',
    MD: '0.375rem',
    LG: '0.5rem',
    XL: '0.75rem',
    '2XL': '1rem',
    FULL: '9999px',
  },

  // Typography
  FONT_SIZES: {
    XS: '0.75rem',
    SM: '0.875rem',
    BASE: '1rem',
    LG: '1.125rem',
    XL: '1.25rem',
    '2XL': '1.5rem',
    '3XL': '1.875rem',
    '4XL': '2.25rem',
  },

  // Animation Durations
  ANIMATION: {
    FAST: '150ms',
    DEFAULT: '300ms',
    SLOW: '500ms',
    VERY_SLOW: '1000ms',
  },
};

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_FLASH_SALES: true,
  ENABLE_WISHLIST: true,
  ENABLE_REVIEWS: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_ANALYTICS: true,
  ENABLE_WEBSOCKETS: true,
  ENABLE_PWA: true,
  ENABLE_DARK_MODE: false, // Future feature
  ENABLE_MULTI_LANGUAGE: false, // Future feature
  ENABLE_ADVANCED_SEARCH: true,
  ENABLE_PRODUCT_RECOMMENDATIONS: true,
  ENABLE_SOCIAL_LOGIN: false, // Future feature
  ENABLE_LIVE_CHAT: false, // Future feature
  MAINTENANCE_MODE: false,
};

// Error Messages
export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  TIMEOUT: 'Request timed out. Please try again.',
  UNAUTHORIZED: 'You are not authorized to access this resource.',
  FORBIDDEN: "Access forbidden. You don't have permission.",
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  PAYMENT_FAILED: 'Payment failed. Please try again or use a different payment method.',
  OUT_OF_STOCK: 'This item is currently out of stock.',
  CART_LIMIT: 'You have reached the maximum number of items in your cart.',
  IMAGE_SIZE: 'Image size must be less than 5MB.',
  IMAGE_TYPE: 'Only JPEG, PNG, and WebP images are allowed.',
  PHONE_INVALID: 'Please enter a valid Uganda phone number.',
  EMAIL_INVALID: 'Please enter a valid email address.',
  PASSWORD_WEAK: 'Password must be at least 8 characters long.',
  ADMIN_EMAIL_INVALID: 'Admin email must end with @shoponline.com.',
  CLIENT_EMAIL_INVALID: 'Client email must be a valid Gmail address.',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  INVITATION_EXPIRED: 'This invitation has expired.',
  FLASH_SALE_ENDED: 'This flash sale has ended.',
  MAX_QUANTITY_EXCEEDED: 'Maximum quantity per item is 99.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Successfully logged in!',
  LOGOUT: 'Successfully logged out!',
  REGISTER: 'Account created successfully!',
  PRODUCT_ADDED: 'Product added successfully!',
  PRODUCT_UPDATED: 'Product updated successfully!',
  PRODUCT_DELETED: 'Product deleted successfully!',
  CATEGORY_ADDED: 'Category added successfully!',
  CATEGORY_UPDATED: 'Category updated successfully!',
  CATEGORY_DELETED: 'Category deleted successfully!',
  ORDER_PLACED: 'Order placed successfully!',
  PAYMENT_SUCCESS: 'Payment completed successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PASSWORD_CHANGED: 'Password changed successfully!',
  INVITATION_SENT: 'Invitation sent successfully!',
  FLASH_SALE_CREATED: 'Flash sale created successfully!',
  FLASH_SALE_UPDATED: 'Flash sale updated successfully!',
  ITEM_ADDED_TO_CART: 'Item added to cart!',
  ITEM_REMOVED_FROM_CART: 'Item removed from cart!',
  ITEM_ADDED_TO_WISHLIST: 'Item added to wishlist!',
  ITEM_REMOVED_FROM_WISHLIST: 'Item removed from wishlist!',
  EMAIL_VERIFIED: 'Email verified successfully!',
  PASSWORD_RESET_SENT: 'Password reset link sent to your email!',
};

// Loading States
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  SUBMITTING: 'submitting',
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'shoponline_auth_token',
  REFRESH_TOKEN: 'shoponline_refresh_token',
  USER_DATA: 'shoponline_user',
  CART_DATA: 'shoponline_cart',
  WISHLIST_DATA: 'shoponline_wishlist',
  THEME_PREFERENCE: 'shoponline_theme',
  LANGUAGE_PREFERENCE: 'shoponline_language',
  RECENT_SEARCHES: 'shoponline_recent_searches',
  VIEWED_PRODUCTS: 'shoponline_viewed_products',
  GUEST_ID: 'shoponline_guest_id',
  REMEMBER_ME: 'shoponline_remember_me',
};

// Event Names for Custom Events
export const EVENTS = {
  USER_LOGIN: 'user:login',
  USER_LOGOUT: 'user:logout',
  CART_UPDATED: 'cart:updated',
  CART_ITEM_ADDED: 'cart:item_added',
  CART_ITEM_REMOVED: 'cart:item_removed',
  WISHLIST_UPDATED: 'wishlist:updated',
  ORDER_PLACED: 'order:placed',
  PAYMENT_COMPLETED: 'payment:completed',
  FLASH_SALE_STARTED: 'flash_sale:started',
  FLASH_SALE_ENDED: 'flash_sale:ended',
  PRODUCT_VIEWED: 'product:viewed',
  SEARCH_PERFORMED: 'search:performed',
  NOTIFICATION_RECEIVED: 'notification:received',
};

// Default export
export default {
  APP_INFO,
  APP_CONFIG,
  UI_CONFIG,
  FEATURE_FLAGS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOADING_STATES,
  STORAGE_KEYS,
  EVENTS,
};
