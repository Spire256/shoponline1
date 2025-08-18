/**
 * Environment configuration for ShopOnline Uganda E-commerce Platform
 *
 * Manages environment-specific settings including:
 * - API URLs and endpoints
 * - Feature flags
 * - Debug configurations
 * - External service configurations
 */

// =============================================================================
// ENVIRONMENT DETECTION
// =============================================================================

export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
  TEST: 'test',
};

export const CURRENT_ENV = process.env.NODE_ENV || ENVIRONMENTS.DEVELOPMENT;

export const isDevelopment = () => CURRENT_ENV === ENVIRONMENTS.DEVELOPMENT;
export const isStaging = () => CURRENT_ENV === ENVIRONMENTS.STAGING;
export const isProduction = () => CURRENT_ENV === ENVIRONMENTS.PRODUCTION;
export const isTesting = () => CURRENT_ENV === ENVIRONMENTS.TEST;

// =============================================================================
// API CONFIGURATION
// =============================================================================

const getApiConfig = () => {
  const configs = {
    [ENVIRONMENTS.DEVELOPMENT]: {
      API_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
      WS_URL: process.env.REACT_APP_WS_URL || 'ws://localhost:8000',
      CDN_URL: process.env.REACT_APP_CDN_URL || 'http://localhost:8000/media',
      STATIC_URL: process.env.REACT_APP_STATIC_URL || 'http://localhost:8000/static',
    },

    [ENVIRONMENTS.STAGING]: {
      API_URL: process.env.REACT_APP_API_URL || 'https://staging-api.shoponline.ug',
      WS_URL: process.env.REACT_APP_WS_URL || 'wss://staging-api.shoponline.ug',
      CDN_URL: process.env.REACT_APP_CDN_URL || 'https://staging-cdn.shoponline.ug',
      STATIC_URL: process.env.REACT_APP_STATIC_URL || 'https://staging-static.shoponline.ug',
    },

    [ENVIRONMENTS.PRODUCTION]: {
      API_URL: process.env.REACT_APP_API_URL || 'https://api.shoponline.ug',
      WS_URL: process.env.REACT_APP_WS_URL || 'wss://api.shoponline.ug',
      CDN_URL: process.env.REACT_APP_CDN_URL || 'https://cdn.shoponline.ug',
      STATIC_URL: process.env.REACT_APP_STATIC_URL || 'https://static.shoponline.ug',
    },

    [ENVIRONMENTS.TEST]: {
      API_URL: 'http://localhost:8000',
      WS_URL: 'ws://localhost:8000',
      CDN_URL: 'http://localhost:8000/media',
      STATIC_URL: 'http://localhost:8000/static',
    },
  };

  return configs[CURRENT_ENV] || configs[ENVIRONMENTS.DEVELOPMENT];
};

export const API_CONFIG = getApiConfig();

// =============================================================================
// FEATURE FLAGS
// =============================================================================

export const FEATURE_FLAGS = {
  // Core features
  FLASH_SALES_ENABLED: process.env.REACT_APP_FLASH_SALES_ENABLED !== 'false',
  MOBILE_MONEY_ENABLED: process.env.REACT_APP_MOBILE_MONEY_ENABLED !== 'false',
  COD_ENABLED: process.env.REACT_APP_COD_ENABLED !== 'false',

  // Payment providers
  MTN_MOMO_ENABLED: process.env.REACT_APP_MTN_MOMO_ENABLED !== 'false',
  AIRTEL_MONEY_ENABLED: process.env.REACT_APP_AIRTEL_MONEY_ENABLED !== 'false',

  // Advanced features
  REAL_TIME_NOTIFICATIONS: process.env.REACT_APP_REAL_TIME_NOTIFICATIONS !== 'false',
  ANALYTICS_ENABLED: process.env.REACT_APP_ANALYTICS_ENABLED !== 'false',
  PWA_ENABLED: process.env.REACT_APP_PWA_ENABLED !== 'false',

  // Admin features
  BULK_OPERATIONS: process.env.REACT_APP_BULK_OPERATIONS !== 'false',
  ADVANCED_SEARCH: process.env.REACT_APP_ADVANCED_SEARCH !== 'false',
  EXPORT_FEATURES: process.env.REACT_APP_EXPORT_FEATURES !== 'false',

  // Debug features
  DEBUG_MODE: process.env.REACT_APP_DEBUG_MODE === 'true' || isDevelopment(),
  API_LOGGING: process.env.REACT_APP_API_LOGGING === 'true' || isDevelopment(),
  PERFORMANCE_MONITORING: process.env.REACT_APP_PERFORMANCE_MONITORING === 'true',

  // Third-party integrations
  GOOGLE_ANALYTICS: process.env.REACT_APP_GOOGLE_ANALYTICS_ID && isProduction(),
  SENTRY_MONITORING: process.env.REACT_APP_SENTRY_DSN && (isProduction() || isStaging()),

  // Experimental features
  VOICE_SEARCH: process.env.REACT_APP_VOICE_SEARCH === 'true',
  IMAGE_SEARCH: process.env.REACT_APP_IMAGE_SEARCH === 'true',
  AUGMENTED_REALITY: process.env.REACT_APP_AR_ENABLED === 'true',

  // Security features
  TWO_FACTOR_AUTH: process.env.REACT_APP_2FA_ENABLED === 'true',
  ADVANCED_SECURITY: process.env.REACT_APP_ADVANCED_SECURITY === 'true',
};

// =============================================================================
// DEBUG CONFIGURATION
// =============================================================================

export const DEBUG_CONFIG = {
  ENABLED: FEATURE_FLAGS.DEBUG_MODE,

  // Console logging levels
  LOG_LEVELS: {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug',
  },

  // What to log
  LOG_API_REQUESTS: FEATURE_FLAGS.API_LOGGING,
  LOG_API_RESPONSES: FEATURE_FLAGS.API_LOGGING,
  LOG_ERRORS: true,
  LOG_PERFORMANCE: FEATURE_FLAGS.PERFORMANCE_MONITORING,
  LOG_USER_ACTIONS: isDevelopment(),
  LOG_WEBSOCKET_EVENTS: isDevelopment(),

  // Console styling
  STYLES: {
    error: 'color: #ef4444; font-weight: bold;',
    warn: 'color: #f59e0b; font-weight: bold;',
    info: 'color: #3b82f6; font-weight: bold;',
    debug: 'color: #6b7280;',
    api: 'color: #10b981; font-weight: bold;',
    websocket: 'color: #8b5cf6; font-weight: bold;',
  },
};

// =============================================================================
// PERFORMANCE CONFIGURATION
// =============================================================================

export const PERFORMANCE_CONFIG = {
  // API timeouts
  API_TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000, // 30 seconds
  UPLOAD_TIMEOUT: parseInt(process.env.REACT_APP_UPLOAD_TIMEOUT) || 60000, // 60 seconds

  // Request limits
  MAX_CONCURRENT_REQUESTS: parseInt(process.env.REACT_APP_MAX_CONCURRENT_REQUESTS) || 10,
  REQUEST_RETRY_ATTEMPTS: parseInt(process.env.REACT_APP_RETRY_ATTEMPTS) || 3,
  REQUEST_RETRY_DELAY: parseInt(process.env.REACT_APP_RETRY_DELAY) || 1000,

  // Cache settings
  CACHE_ENABLED: process.env.REACT_APP_CACHE_ENABLED !== 'false',
  CACHE_TTL: parseInt(process.env.REACT_APP_CACHE_TTL) || 300000, // 5 minutes

  // Image optimization
  IMAGE_LAZY_LOADING: process.env.REACT_APP_IMAGE_LAZY_LOADING !== 'false',
  IMAGE_COMPRESSION: process.env.REACT_APP_IMAGE_COMPRESSION !== 'false',

  // Bundle optimization
  CODE_SPLITTING: process.env.REACT_APP_CODE_SPLITTING !== 'false',
  PRELOAD_CRITICAL_ROUTES: process.env.REACT_APP_PRELOAD_ROUTES !== 'false',
};

// =============================================================================
// SECURITY CONFIGURATION
// =============================================================================

export const SECURITY_CONFIG = {
  // HTTPS enforcement
  ENFORCE_HTTPS: isProduction(),

  // CSRF protection
  CSRF_ENABLED: process.env.REACT_APP_CSRF_ENABLED !== 'false',

  // Content Security Policy
  CSP_ENABLED: isProduction(),

  // API security
  API_KEY_REQUIRED: process.env.REACT_APP_API_KEY_REQUIRED === 'true',
  API_KEY: process.env.REACT_APP_API_KEY,

  // Rate limiting
  RATE_LIMITING_ENABLED: process.env.REACT_APP_RATE_LIMITING !== 'false',

  // Session security
  SECURE_COOKIES: isProduction(),
  SESSION_TIMEOUT: parseInt(process.env.REACT_APP_SESSION_TIMEOUT) || 900000, // 15 minutes

  // Input validation
  STRICT_VALIDATION: process.env.REACT_APP_STRICT_VALIDATION !== 'false',
  XSS_PROTECTION: process.env.REACT_APP_XSS_PROTECTION !== 'false',
};

// =============================================================================
// THIRD-PARTY SERVICE CONFIGURATION
// =============================================================================

export const THIRD_PARTY_CONFIG = {
  // Google Analytics
  GOOGLE_ANALYTICS: {
    ENABLED: FEATURE_FLAGS.GOOGLE_ANALYTICS,
    TRACKING_ID: process.env.REACT_APP_GOOGLE_ANALYTICS_ID,
    ENHANCED_ECOMMERCE: true,
    ANONYMIZE_IP: true,
  },

  // Sentry Error Monitoring
  SENTRY: {
    ENABLED: FEATURE_FLAGS.SENTRY_MONITORING,
    DSN: process.env.REACT_APP_SENTRY_DSN,
    ENVIRONMENT: CURRENT_ENV,
    SAMPLE_RATE: parseFloat(process.env.REACT_APP_SENTRY_SAMPLE_RATE) || 1.0,
    TRACES_SAMPLE_RATE: parseFloat(process.env.REACT_APP_SENTRY_TRACES_SAMPLE_RATE) || 0.1,
  },

  // Push Notifications
  PUSH_NOTIFICATIONS: {
    ENABLED: process.env.REACT_APP_PUSH_NOTIFICATIONS === 'true',
    VAPID_PUBLIC_KEY: process.env.REACT_APP_VAPID_PUBLIC_KEY,
    SERVICE_WORKER_PATH: '/sw.js',
  },

  // Social Media Integration
  SOCIAL_SHARING: {
    ENABLED: process.env.REACT_APP_SOCIAL_SHARING !== 'false',
    PLATFORMS: ['facebook', 'twitter', 'whatsapp', 'telegram'],
  },

  // Maps Integration
  MAPS: {
    ENABLED: process.env.REACT_APP_MAPS_ENABLED === 'true',
    PROVIDER: process.env.REACT_APP_MAPS_PROVIDER || 'google',
    API_KEY: process.env.REACT_APP_MAPS_API_KEY,
  },
};

// =============================================================================
// APPLICATION METADATA
// =============================================================================

export const APP_METADATA = {
  NAME: 'ShopOnline Uganda',
  VERSION: process.env.REACT_APP_VERSION || '1.0.0',
  BUILD_NUMBER: process.env.REACT_APP_BUILD_NUMBER || 'dev',
  BUILD_DATE: process.env.REACT_APP_BUILD_DATE || new Date().toISOString(),

  // Contact information
  COMPANY: {
    NAME: 'ShopOnline Uganda',
    EMAIL: 'info@shoponline.ug',
    PHONE: '+256 700 000 000',
    ADDRESS: 'Kampala, Uganda',
    WEBSITE: 'https://shoponline.ug',
  },

  // Legal information
  TERMS_URL: '/terms-of-service',
  PRIVACY_URL: '/privacy-policy',
  COOKIE_POLICY_URL: '/cookie-policy',

  // Support information
  SUPPORT_EMAIL: 'support@shoponline.ug',
  SUPPORT_PHONE: '+256 700 000 001',
  SUPPORT_HOURS: '8:00 AM - 8:00 PM (Monday - Saturday)',
};

// =============================================================================
// REGIONAL CONFIGURATION
// =============================================================================

export const REGIONAL_CONFIG = {
  // Uganda-specific settings
  COUNTRY: 'Uganda',
  COUNTRY_CODE: 'UG',
  CURRENCY: 'UGX',
  TIMEZONE: 'Africa/Kampala',
  LOCALE: 'en-UG',

  // Phone number configuration
  PHONE_COUNTRY_CODE: '+256',
  PHONE_NUMBER_LENGTH: 9, // Without country code

  // Business hours
  BUSINESS_HOURS: {
    TIMEZONE: 'Africa/Kampala',
    WORKING_DAYS: [1, 2, 3, 4, 5, 6], // Monday to Saturday
    START_HOUR: 8, // 8 AM
    END_HOUR: 20, // 8 PM
  },

  // Delivery regions
  DELIVERY_REGIONS: [
    'Kampala Central',
    'Greater Kampala',
    'Wakiso District',
    'Other Central Region',
    'Major Towns',
    'Other Regions',
  ],

  // Language support
  LANGUAGES: [
    { code: 'en', name: 'English', flag: '🇺🇬' },
    { code: 'sw', name: 'Swahili', flag: '🇺🇬' },
    // Add more languages as needed
  ],
};

// =============================================================================
// UI CONFIGURATION
// =============================================================================

export const UI_CONFIG = {
  // Theme settings
  DEFAULT_THEME: 'blue',
  AVAILABLE_THEMES: ['blue', 'dark-blue', 'light-blue'],

  // Layout settings
  SIDEBAR_COLLAPSED_BY_DEFAULT: false,
  HEADER_FIXED: true,
  FOOTER_STICKY: false,

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100,

  // Animation settings
  ANIMATION_DURATION: 300, // milliseconds
  TRANSITION_EASING: 'ease-in-out',
  DISABLE_ANIMATIONS: process.env.REACT_APP_DISABLE_ANIMATIONS === 'true',

  // Mobile responsiveness
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
  DESKTOP_BREAKPOINT: 1280,

  // Image settings
  IMAGE_PLACEHOLDER: '/assets/placeholders/product-placeholder.jpg',
  AVATAR_PLACEHOLDER: '/assets/placeholders/avatar-placeholder.png',
  BANNER_PLACEHOLDER: '/assets/placeholders/banner-placeholder.jpg',

  // Loading states
  SKELETON_LOADING: process.env.REACT_APP_SKELETON_LOADING !== 'false',
  LOADING_SPINNER_DELAY: 200, // Show spinner after 200ms

  // Notifications
  TOAST_DURATION: 5000, // 5 seconds
  MAX_NOTIFICATIONS: 5,
  NOTIFICATION_POSITION: 'top-right',
};

// =============================================================================
// CACHE CONFIGURATION
// =============================================================================

export const CACHE_CONFIG = {
  ENABLED: PERFORMANCE_CONFIG.CACHE_ENABLED,

  // Cache strategies
  STRATEGIES: {
    PRODUCTS: 'stale-while-revalidate',
    CATEGORIES: 'cache-first',
    FLASH_SALES: 'network-first',
    USER_DATA: 'network-only',
  },

  // Cache durations (in milliseconds)
  DURATIONS: {
    PRODUCTS: 15 * 60 * 1000, // 15 minutes
    CATEGORIES: 30 * 60 * 1000, // 30 minutes
    FLASH_SALES: 5 * 60 * 1000, // 5 minutes
    HOMEPAGE_CONTENT: 60 * 60 * 1000, // 1 hour
    STATIC_CONTENT: 24 * 60 * 60 * 1000, // 24 hours
  },

  // Storage limits
  MAX_CACHE_SIZE: 50 * 1024 * 1024, // 50MB
  CLEANUP_THRESHOLD: 0.8, // Clean when 80% full
};

// =============================================================================
// MONITORING CONFIGURATION
// =============================================================================

export const MONITORING_CONFIG = {
  // Error tracking
  ERROR_BOUNDARY_ENABLED: true,
  AUTO_ERROR_REPORTING: isProduction(),
  ERROR_RETRY_ATTEMPTS: 3,

  // Performance monitoring
  WEB_VITALS_TRACKING: isProduction(),
  PERFORMANCE_OBSERVER_ENABLED: FEATURE_FLAGS.PERFORMANCE_MONITORING,

  // User behavior tracking
  USER_ANALYTICS_ENABLED: FEATURE_FLAGS.ANALYTICS_ENABLED,
  TRACK_PAGE_VIEWS: true,
  TRACK_CLICK_EVENTS: true,
  TRACK_FORM_INTERACTIONS: true,

  // Real-time monitoring
  WEBSOCKET_HEARTBEAT_INTERVAL: 30000, // 30 seconds
  CONNECTION_RETRY_ATTEMPTS: 5,
  CONNECTION_RETRY_DELAY: 2000, // 2 seconds
};

// =============================================================================
// DEVELOPMENT TOOLS
// =============================================================================

export const DEV_TOOLS_CONFIG = {
  // Redux DevTools
  REDUX_DEVTOOLS: isDevelopment(),

  // React DevTools
  REACT_DEVTOOLS: isDevelopment(),

  // API mocking
  MOCK_API_ENABLED: process.env.REACT_APP_MOCK_API === 'true',
  MOCK_DELAY: parseInt(process.env.REACT_APP_MOCK_DELAY) || 1000,

  // Hot reloading
  HOT_RELOAD: isDevelopment(),

  // Source maps
  GENERATE_SOURCEMAP: !isProduction(),

  // Console warnings
  REACT_STRICT_MODE: isDevelopment(),
  PROP_TYPES_CHECKING: isDevelopment(),
};

// =============================================================================
// EXTERNAL SERVICES
// =============================================================================

export const EXTERNAL_SERVICES = {
  // Email service
  EMAIL_SERVICE: {
    PROVIDER: process.env.REACT_APP_EMAIL_PROVIDER || 'sendgrid',
    FROM_EMAIL: process.env.REACT_APP_FROM_EMAIL || 'noreply@shoponline.ug',
    FROM_NAME: 'ShopOnline Uganda',
  },

  // SMS service
  SMS_SERVICE: {
    PROVIDER: process.env.REACT_APP_SMS_PROVIDER || 'twilio',
    FROM_NUMBER: process.env.REACT_APP_SMS_FROM_NUMBER,
  },

  // File storage
  FILE_STORAGE: {
    PROVIDER: process.env.REACT_APP_STORAGE_PROVIDER || 'local',
    CDN_ENABLED: process.env.REACT_APP_CDN_ENABLED === 'true',
    IMAGE_OPTIMIZATION: process.env.REACT_APP_IMAGE_OPTIMIZATION !== 'false',
  },

  // Search service
  SEARCH_SERVICE: {
    PROVIDER: process.env.REACT_APP_SEARCH_PROVIDER || 'built-in',
    ELASTICSEARCH_URL: process.env.REACT_APP_ELASTICSEARCH_URL,
  },
};

// =============================================================================
// COMPLIANCE CONFIGURATION
// =============================================================================

export const COMPLIANCE_CONFIG = {
  // GDPR compliance
  GDPR_ENABLED: process.env.REACT_APP_GDPR_ENABLED === 'true',
  COOKIE_CONSENT_REQUIRED: process.env.REACT_APP_COOKIE_CONSENT !== 'false',
  DATA_RETENTION_DAYS: parseInt(process.env.REACT_APP_DATA_RETENTION_DAYS) || 365,

  // Accessibility
  A11Y_ENABLED: process.env.REACT_APP_ACCESSIBILITY !== 'false',
  HIGH_CONTRAST_MODE: process.env.REACT_APP_HIGH_CONTRAST === 'true',
  SCREEN_READER_SUPPORT: true,

  // Age verification
  AGE_VERIFICATION_REQUIRED: process.env.REACT_APP_AGE_VERIFICATION === 'true',
  MINIMUM_AGE: parseInt(process.env.REACT_APP_MINIMUM_AGE) || 13,
};

// =============================================================================
// ENVIRONMENT-SPECIFIC OVERRIDES
// =============================================================================

const getEnvironmentOverrides = () => {
  switch (CURRENT_ENV) {
    case ENVIRONMENTS.DEVELOPMENT:
      return {
        // Development-specific overrides
        FEATURE_FLAGS: {
          ...FEATURE_FLAGS,
          DEBUG_MODE: true,
          API_LOGGING: true,
          MOCK_API_ENABLED: process.env.REACT_APP_MOCK_API === 'true',
        },
        SECURITY_CONFIG: {
          ...SECURITY_CONFIG,
          ENFORCE_HTTPS: false,
          SECURE_COOKIES: false,
        },
      };

    case ENVIRONMENTS.STAGING:
      return {
        // Staging-specific overrides
        FEATURE_FLAGS: {
          ...FEATURE_FLAGS,
          DEBUG_MODE: process.env.REACT_APP_DEBUG_MODE === 'true',
          PERFORMANCE_MONITORING: true,
        },
        MONITORING_CONFIG: {
          ...MONITORING_CONFIG,
          AUTO_ERROR_REPORTING: true,
        },
      };

    case ENVIRONMENTS.PRODUCTION:
      return {
        // Production-specific overrides
        FEATURE_FLAGS: {
          ...FEATURE_FLAGS,
          DEBUG_MODE: false,
          API_LOGGING: false,
        },
        SECURITY_CONFIG: {
          ...SECURITY_CONFIG,
          ENFORCE_HTTPS: true,
          SECURE_COOKIES: true,
          CSP_ENABLED: true,
        },
        PERFORMANCE_CONFIG: {
          ...PERFORMANCE_CONFIG,
          CACHE_ENABLED: true,
        },
      };

    case ENVIRONMENTS.TEST:
      return {
        // Test-specific overrides
        FEATURE_FLAGS: {
          ...FEATURE_FLAGS,
          MOCK_API_ENABLED: true,
          REAL_TIME_NOTIFICATIONS: false,
        },
        PERFORMANCE_CONFIG: {
          ...PERFORMANCE_CONFIG,
          CACHE_ENABLED: false,
        },
      };

    default:
      return {};
  }
};

// Apply environment-specific overrides
const environmentOverrides = getEnvironmentOverrides();

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate environment configuration
 * @returns {Object} Validation result
 */
export const validateEnvironmentConfig = () => {
  const errors = [];
  const warnings = [];

  // Check required environment variables
  if (!API_CONFIG.API_URL) {
    errors.push('API_URL is required');
  }

  if (isProduction()) {
    if (!API_CONFIG.API_URL.startsWith('https://')) {
      errors.push('HTTPS is required in production');
    }

    if (!THIRD_PARTY_CONFIG.SENTRY.DSN) {
      warnings.push('Sentry DSN not configured for production error monitoring');
    }

    if (!THIRD_PARTY_CONFIG.GOOGLE_ANALYTICS.TRACKING_ID) {
      warnings.push('Google Analytics not configured for production');
    }
  }

  // Check for development configurations in production
  if (isProduction() && FEATURE_FLAGS.DEBUG_MODE) {
    warnings.push('Debug mode is enabled in production');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    environment: CURRENT_ENV,
  };
};

/**
 * Get configuration summary for debugging
 * @returns {Object} Configuration summary
 */
export const getConfigSummary = () => {
  return {
    environment: CURRENT_ENV,
    api: {
      url: API_CONFIG.API_URL,
      timeout: PERFORMANCE_CONFIG.API_TIMEOUT,
    },
    features: {
      enabled: Object.entries(FEATURE_FLAGS)
        .filter(([key, value]) => value === true)
        .map(([key]) => key),
      disabled: Object.entries(FEATURE_FLAGS)
        .filter(([key, value]) => value === false)
        .map(([key]) => key),
    },
    security: {
      https: SECURITY_CONFIG.ENFORCE_HTTPS,
      csrf: SECURITY_CONFIG.CSRF_ENABLED,
      secureCookies: SECURITY_CONFIG.SECURE_COOKIES,
    },
    performance: {
      cacheEnabled: PERFORMANCE_CONFIG.CACHE_ENABLED,
      lazyLoading: PERFORMANCE_CONFIG.IMAGE_LAZY_LOADING,
      codeSplitting: PERFORMANCE_CONFIG.CODE_SPLITTING,
    },
  };
};

// =============================================================================
// ENVIRONMENT HELPERS
// =============================================================================

/**
 * Check if feature is enabled
 * @param {string} featureName - Feature name
 * @returns {boolean} Whether feature is enabled
 */
export const isFeatureEnabled = featureName => {
  return FEATURE_FLAGS[featureName] === true;
};

/**
 * Get API URL for specific service
 * @param {string} service - Service name ('api', 'ws', 'cdn', 'static')
 * @returns {string} Service URL
 */
export const getServiceUrl = service => {
  const urlMap = {
    api: API_CONFIG.API_URL,
    ws: API_CONFIG.WS_URL,
    cdn: API_CONFIG.CDN_URL,
    static: API_CONFIG.STATIC_URL,
  };

  return urlMap[service] || API_CONFIG.API_URL;
};

/**
 * Get environment-specific configuration value
 * @param {string} configPath - Configuration path (e.g., 'FEATURE_FLAGS.DEBUG_MODE')
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Configuration value
 */
export const getEnvConfig = (configPath, defaultValue = null) => {
  try {
    const pathParts = configPath.split('.');
    let current = {
      FEATURE_FLAGS: { ...FEATURE_FLAGS, ...environmentOverrides.FEATURE_FLAGS },
      SECURITY_CONFIG: { ...SECURITY_CONFIG, ...environmentOverrides.SECURITY_CONFIG },
      PERFORMANCE_CONFIG: { ...PERFORMANCE_CONFIG, ...environmentOverrides.PERFORMANCE_CONFIG },
      MONITORING_CONFIG: { ...MONITORING_CONFIG, ...environmentOverrides.MONITORING_CONFIG },
    };

    for (const part of pathParts) {
      current = current[part];
      if (current === undefined) break;
    }

    return current !== undefined ? current : defaultValue;
  } catch (error) {
    console.error('Error getting environment config:', error);
    return defaultValue;
  }
};

// =============================================================================
// INITIALIZATION FUNCTIONS
// =============================================================================

/**
 * Initialize environment configuration
 * @returns {Promise<Object>} Initialization result
 */
export const initializeEnvironment = async () => {
  try {
    // Validate configuration
    const validation = validateEnvironmentConfig();

    if (!validation.isValid) {
      console.error('Environment configuration errors:', validation.errors);
      throw new Error('Invalid environment configuration');
    }

    // Log warnings in development
    if (isDevelopment() && validation.warnings.length > 0) {
      console.warn('Environment configuration warnings:', validation.warnings);
    }

    // Initialize third-party services
    if (THIRD_PARTY_CONFIG.SENTRY.ENABLED) {
      // Initialize Sentry (would be done in app initialization)
      console.log('Sentry monitoring initialized');
    }

    if (THIRD_PARTY_CONFIG.GOOGLE_ANALYTICS.ENABLED) {
      // Initialize Google Analytics (would be done in app initialization)
      console.log('Google Analytics initialized');
    }

    // Log configuration summary in development
    if (isDevelopment()) {
      console.log('Environment Configuration:', getConfigSummary());
    }

    return {
      success: true,
      environment: CURRENT_ENV,
      config: getConfigSummary(),
      validation,
    };
  } catch (error) {
    console.error('Failed to initialize environment:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// =============================================================================
// EXPORTED CONFIGURATION OBJECT
// =============================================================================

export const EnvironmentConfig = {
  // Environment info
  CURRENT_ENV,
  isDevelopment,
  isStaging,
  isProduction,
  isTesting,

  // Configuration objects
  API_CONFIG,
  FEATURE_FLAGS: { ...FEATURE_FLAGS, ...environmentOverrides.FEATURE_FLAGS },
  DEBUG_CONFIG,
  PERFORMANCE_CONFIG: { ...PERFORMANCE_CONFIG, ...environmentOverrides.PERFORMANCE_CONFIG },
  SECURITY_CONFIG: { ...SECURITY_CONFIG, ...environmentOverrides.SECURITY_CONFIG },
  THIRD_PARTY_CONFIG,
  APP_METADATA,
  REGIONAL_CONFIG,
  UI_CONFIG,
  CACHE_CONFIG,
  MONITORING_CONFIG: { ...MONITORING_CONFIG, ...environmentOverrides.MONITORING_CONFIG },
  DEV_TOOLS_CONFIG,
  EXTERNAL_SERVICES,
  COMPLIANCE_CONFIG,

  // Helper functions
  validateEnvironmentConfig,
  getConfigSummary,
  isFeatureEnabled,
  getServiceUrl,
  getEnvConfig,
  initializeEnvironment,
};

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default EnvironmentConfig;
