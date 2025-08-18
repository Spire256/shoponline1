/**
 * Payment methods and status constants for ShopOnline Uganda E-commerce Platform
 *
 * Contains all payment-related constants including:
 * - Payment methods available in Uganda
 * - Payment statuses and transitions
 * - Mobile money provider configurations
 * - Currency and formatting settings
 */

// =============================================================================
// PAYMENT METHODS
// =============================================================================

export const PAYMENT_METHODS = {
  MTN_MOMO: 'mtn_momo',
  AIRTEL_MONEY: 'airtel_money',
  CASH_ON_DELIVERY: 'cod',
};

export const PAYMENT_METHOD_CHOICES = [
  {
    value: PAYMENT_METHODS.MTN_MOMO,
    label: 'MTN Mobile Money',
    shortLabel: 'MTN MoMo',
    icon: 'smartphone',
    color: '#FFCC00', // MTN Yellow
    description: 'Pay instantly with your MTN Mobile Money account',
  },
  {
    value: PAYMENT_METHODS.AIRTEL_MONEY,
    label: 'Airtel Money',
    shortLabel: 'Airtel Money',
    icon: 'smartphone',
    color: '#FF0000', // Airtel Red
    description: 'Pay instantly with your Airtel Money account',
  },
  {
    value: PAYMENT_METHODS.CASH_ON_DELIVERY,
    label: 'Cash on Delivery',
    shortLabel: 'COD',
    icon: 'banknote',
    color: '#10b981', // Green
    description: 'Pay with cash when your order is delivered',
  },
];

// =============================================================================
// PAYMENT STATUSES
// =============================================================================

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

export const PAYMENT_STATUS_CHOICES = [
  { value: PAYMENT_STATUS.PENDING, label: 'Pending', color: '#f59e0b' },
  { value: PAYMENT_STATUS.PROCESSING, label: 'Processing', color: '#3b82f6' },
  { value: PAYMENT_STATUS.COMPLETED, label: 'Completed', color: '#10b981' },
  { value: PAYMENT_STATUS.FAILED, label: 'Failed', color: '#ef4444' },
  { value: PAYMENT_STATUS.CANCELLED, label: 'Cancelled', color: '#6b7280' },
  { value: PAYMENT_STATUS.REFUNDED, label: 'Refunded', color: '#8b5cf6' },
];

// =============================================================================
// PAYMENT STATUS FLOW
// =============================================================================

export const PAYMENT_STATUS_FLOW = {
  [PAYMENT_STATUS.PENDING]: [PAYMENT_STATUS.PROCESSING, PAYMENT_STATUS.CANCELLED],
  [PAYMENT_STATUS.PROCESSING]: [PAYMENT_STATUS.COMPLETED, PAYMENT_STATUS.FAILED],
  [PAYMENT_STATUS.COMPLETED]: [PAYMENT_STATUS.REFUNDED],
  [PAYMENT_STATUS.FAILED]: [PAYMENT_STATUS.PENDING], // Allow retry
  [PAYMENT_STATUS.CANCELLED]: [],
  [PAYMENT_STATUS.REFUNDED]: [],
};

// =============================================================================
// MOBILE MONEY PROVIDERS
// =============================================================================

export const MOBILE_MONEY_PROVIDERS = {
  [PAYMENT_METHODS.MTN_MOMO]: {
    name: 'MTN Mobile Money',
    shortName: 'MTN MoMo',
    code: 'MTN',
    currency: 'UGX',
    phoneNumberPrefixes: ['077', '078', '039'],
    color: '#FFCC00',
    logo: '/assets/payment-icons/mtn-logo.png',
    instructions: 'Dial *165# on your MTN line to complete payment',
    features: ['instant_payment', 'balance_check', 'transaction_history'],
    limits: {
      min: 1000, // UGX 1,000
      max: 5000000, // UGX 5,000,000
      daily: 10000000, // UGX 10,000,000
    },
    fees: {
      fixed: 0,
      percentage: 0.015, // 1.5%
      min_fee: 100,
      max_fee: 50000,
    },
  },

  [PAYMENT_METHODS.AIRTEL_MONEY]: {
    name: 'Airtel Money',
    shortName: 'Airtel Money',
    code: 'AIRTEL',
    currency: 'UGX',
    phoneNumberPrefixes: ['070', '075', '074'],
    color: '#FF0000',
    logo: '/assets/payment-icons/airtel-logo.png',
    instructions: 'Dial *185# on your Airtel line to complete payment',
    features: ['instant_payment', 'balance_check', 'transaction_history'],
    limits: {
      min: 1000, // UGX 1,000
      max: 3000000, // UGX 3,000,000
      daily: 8000000, // UGX 8,000,000
    },
    fees: {
      fixed: 0,
      percentage: 0.02, // 2%
      min_fee: 100,
      max_fee: 40000,
    },
  },
};

// =============================================================================
// CASH ON DELIVERY CONFIGURATION
// =============================================================================

export const COD_CONFIG = {
  name: 'Cash on Delivery',
  shortName: 'COD',
  code: 'COD',
  currency: 'UGX',
  color: '#10b981',
  icon: 'banknote',
  description: 'Pay with cash when your order is delivered to your location',
  features: ['local_delivery', 'payment_on_delivery', 'order_verification'],
  limits: {
    min: 5000, // UGX 5,000
    max: 2000000, // UGX 2,000,000
  },
  deliveryFee: 5000, // UGX 5,000 standard delivery fee
  verificationRequired: true,
  adminNotificationRequired: true,
};

// =============================================================================
// CURRENCY CONFIGURATION
// =============================================================================

export const CURRENCY = {
  CODE: 'UGX',
  SYMBOL: 'UGX',
  NAME: 'Uganda Shillings',
  DECIMAL_PLACES: 0, // UGX doesn't use decimal places
  THOUSAND_SEPARATOR: ',',
  DECIMAL_SEPARATOR: '.',
  SYMBOL_POSITION: 'before', // UGX 1,000 vs 1,000 UGX
};

// =============================================================================
// UGANDA PHONE NUMBER CONFIGURATION
// =============================================================================

export const UGANDA_PHONE_CONFIG = {
  COUNTRY_CODE: '+256',
  PHONE_LENGTH: 9, // Without country code
  PHONE_LENGTH_WITH_CODE: 13, // With +256

  PROVIDER_PREFIXES: {
    MTN: ['077', '078', '039'],
    AIRTEL: ['070', '075', '074'],
    UTL: ['041', '071'],
    LYCAMOBILE: ['073'],
    SMART: ['074'],
    K2: ['072'],
  },

  // All valid prefixes
  ALL_PREFIXES: ['077', '078', '039', '070', '075', '074', '041', '071', '073', '072'],

  // Mobile money prefixes only
  MOBILE_MONEY_PREFIXES: ['077', '078', '039', '070', '075', '074'],
};

// =============================================================================
// PAYMENT VALIDATION RULES
// =============================================================================

export const PAYMENT_VALIDATION = {
  // Amount validation
  MIN_PAYMENT_AMOUNT: 1000, // UGX 1,000
  MAX_PAYMENT_AMOUNT: 10000000, // UGX 10,000,000

  // Phone number validation
  PHONE_REGEX: /^(\+?256|0)?[0-9]{9}$/,
  PHONE_FORMAT_MESSAGE: 'Please enter a valid Ugandan phone number (e.g., 0771234567)',

  // Payment method specific validation
  MTN_PHONE_REGEX: /^(\+?256|0)?(77|78|39)[0-9]{7}$/,
  AIRTEL_PHONE_REGEX: /^(\+?256|0)?(70|75|74)[0-9]{7}$/,

  // Transaction limits per method
  TRANSACTION_LIMITS: {
    [PAYMENT_METHODS.MTN_MOMO]: {
      min: 1000,
      max: 5000000,
      daily: 10000000,
    },
    [PAYMENT_METHODS.AIRTEL_MONEY]: {
      min: 1000,
      max: 3000000,
      daily: 8000000,
    },
    [PAYMENT_METHODS.CASH_ON_DELIVERY]: {
      min: 5000,
      max: 2000000,
      daily: null, // No daily limit for COD
    },
  },
};

// =============================================================================
// PAYMENT FLOW CONFIGURATIONS
// =============================================================================

export const PAYMENT_FLOWS = {
  [PAYMENT_METHODS.MTN_MOMO]: {
    steps: [
      'enter_phone',
      'confirm_amount',
      'initiate_payment',
      'enter_pin',
      'payment_processing',
      'payment_complete',
    ],
    estimatedTime: '1-2 minutes',
    requiresPhoneVerification: true,
    supportsRefunds: true,
  },

  [PAYMENT_METHODS.AIRTEL_MONEY]: {
    steps: [
      'enter_phone',
      'confirm_amount',
      'initiate_payment',
      'enter_pin',
      'payment_processing',
      'payment_complete',
    ],
    estimatedTime: '1-2 minutes',
    requiresPhoneVerification: true,
    supportsRefunds: true,
  },

  [PAYMENT_METHODS.CASH_ON_DELIVERY]: {
    steps: [
      'confirm_address',
      'admin_verification',
      'order_preparation',
      'delivery_scheduled',
      'payment_on_delivery',
    ],
    estimatedTime: '1-3 business days',
    requiresPhoneVerification: true,
    supportsRefunds: false,
    requiresAdminApproval: true,
  },
};

// =============================================================================
// PAYMENT ERROR CODES
// =============================================================================

export const PAYMENT_ERROR_CODES = {
  // Generic payment errors
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  INVALID_PHONE: 'INVALID_PHONE',
  TIMEOUT: 'TIMEOUT',
  CANCELLED_BY_USER: 'CANCELLED_BY_USER',

  // MTN specific errors
  MTN_INVALID_MSISDN: 'MTN_INVALID_MSISDN',
  MTN_NOT_ALLOWED: 'MTN_NOT_ALLOWED',
  MTN_SUBSCRIBER_NOT_FOUND: 'MTN_SUBSCRIBER_NOT_FOUND',
  MTN_TRANSACTION_FAILED: 'MTN_TRANSACTION_FAILED',

  // Airtel specific errors
  AIRTEL_INVALID_MSISDN: 'AIRTEL_INVALID_MSISDN',
  AIRTEL_INSUFFICIENT_BALANCE: 'AIRTEL_INSUFFICIENT_BALANCE',
  AIRTEL_TRANSACTION_FAILED: 'AIRTEL_TRANSACTION_FAILED',
  AIRTEL_SERVICE_UNAVAILABLE: 'AIRTEL_SERVICE_UNAVAILABLE',

  // COD specific errors
  COD_ADDRESS_REQUIRED: 'COD_ADDRESS_REQUIRED',
  COD_PHONE_REQUIRED: 'COD_PHONE_REQUIRED',
  COD_AMOUNT_EXCEEDED: 'COD_AMOUNT_EXCEEDED',
  COD_DELIVERY_UNAVAILABLE: 'COD_DELIVERY_UNAVAILABLE',
};

// =============================================================================
// PAYMENT HELPER FUNCTIONS
// =============================================================================

export const getPaymentMethodDetails = method => {
  const choice = PAYMENT_METHOD_CHOICES.find(choice => choice.value === method);
  return choice || null;
};

export const getPaymentStatusDetails = status => {
  const choice = PAYMENT_STATUS_CHOICES.find(choice => choice.value === status);
  return choice || { value: status, label: 'Unknown', color: '#6b7280' };
};

export const validatePhoneForPaymentMethod = (phone, method) => {
  if (!phone) return false;

  // Clean phone number
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

  if (method === PAYMENT_METHODS.MTN_MOMO) {
    return PAYMENT_VALIDATION.MTN_PHONE_REGEX.test(cleanPhone);
  } else if (method === PAYMENT_METHODS.AIRTEL_MONEY) {
    return PAYMENT_VALIDATION.AIRTEL_PHONE_REGEX.test(cleanPhone);
  } else if (method === PAYMENT_METHODS.CASH_ON_DELIVERY) {
    return PAYMENT_VALIDATION.PHONE_REGEX.test(cleanPhone);
  }

  return false;
};

export const getProviderFromPhone = phone => {
  if (!phone) return null;

  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  const prefix = cleanPhone.slice(-9, -7); // Get the 2-digit prefix

  for (const [provider, prefixes] of Object.entries(UGANDA_PHONE_CONFIG.PROVIDER_PREFIXES)) {
    if (prefixes.includes(prefix)) {
      return provider.toLowerCase();
    }
  }

  return null;
};

export const formatPhoneForPayment = phone => {
  if (!phone) return '';

  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // Handle different input formats
  if (digits.startsWith('256')) {
    return `+${digits}`;
  } else if (digits.startsWith('0') && digits.length === 10) {
    return `+256${digits.slice(1)}`;
  } else if (digits.length === 9) {
    return `+256${digits}`;
  }

  return phone; // Return original if format is unclear
};

export const validatePaymentAmount = (amount, method) => {
  const numAmount = parseFloat(amount);
  const limits = PAYMENT_VALIDATION.TRANSACTION_LIMITS[method];

  if (!limits) return { valid: false, message: 'Invalid payment method' };

  if (numAmount < limits.min) {
    return {
      valid: false,
      message: `Minimum amount is UGX ${limits.min.toLocaleString()}`,
    };
  }

  if (numAmount > limits.max) {
    return {
      valid: false,
      message: `Maximum amount is UGX ${limits.max.toLocaleString()}`,
    };
  }

  return { valid: true, message: '' };
};

// =============================================================================
// TRANSACTION TYPES
// =============================================================================

export const TRANSACTION_TYPES = {
  PAYMENT: 'payment',
  REFUND: 'refund',
  PARTIAL_REFUND: 'partial_refund',
};

export const TRANSACTION_TYPE_CHOICES = [
  { value: TRANSACTION_TYPES.PAYMENT, label: 'Payment', color: '#10b981' },
  { value: TRANSACTION_TYPES.REFUND, label: 'Refund', color: '#f59e0b' },
  { value: TRANSACTION_TYPES.PARTIAL_REFUND, label: 'Partial Refund', color: '#8b5cf6' },
];

// =============================================================================
// PAYMENT PROCESSING TIMEOUTS
// =============================================================================

export const PAYMENT_TIMEOUTS = {
  [PAYMENT_METHODS.MTN_MOMO]: 120000, // 2 minutes
  [PAYMENT_METHODS.AIRTEL_MONEY]: 120000, // 2 minutes
  [PAYMENT_METHODS.CASH_ON_DELIVERY]: null, // No timeout for COD
};

// =============================================================================
// PAYMENT NOTIFICATIONS
// =============================================================================

export const PAYMENT_NOTIFICATIONS = {
  PAYMENT_INITIATED: {
    title: 'Payment Initiated',
    message: 'Your payment request has been sent. Please complete on your phone.',
    type: 'info',
  },
  PAYMENT_PROCESSING: {
    title: 'Processing Payment',
    message: 'Your payment is being processed. Please wait...',
    type: 'info',
  },
  PAYMENT_SUCCESSFUL: {
    title: 'Payment Successful',
    message: 'Your payment has been completed successfully!',
    type: 'success',
  },
  PAYMENT_FAILED: {
    title: 'Payment Failed',
    message: 'Your payment could not be processed. Please try again.',
    type: 'error',
  },
  PAYMENT_CANCELLED: {
    title: 'Payment Cancelled',
    message: 'Your payment was cancelled.',
    type: 'warning',
  },
  COD_CONFIRMED: {
    title: 'Order Confirmed',
    message: 'Your cash on delivery order has been confirmed. We will contact you soon.',
    type: 'success',
  },
};

// =============================================================================
// PAYMENT SECURITY
// =============================================================================

export const PAYMENT_SECURITY = {
  // PCI DSS compliance settings
  MASK_CARD_NUMBER: true,
  MASK_PHONE_NUMBER: true,
  LOG_SENSITIVE_DATA: false,

  // Session timeouts
  PAYMENT_SESSION_TIMEOUT: 900000, // 15 minutes
  PAYMENT_RETRY_LIMIT: 3,
  PAYMENT_RETRY_DELAY: 30000, // 30 seconds

  // Encryption settings
  ENCRYPT_PAYMENT_DATA: true,
  TOKEN_EXPIRY_MINUTES: 15,
};

// =============================================================================
// ADMIN PAYMENT CONFIGURATIONS
// =============================================================================

export const ADMIN_PAYMENT_CONFIG = {
  // COD management
  COD_AUTO_ASSIGN: false,
  COD_REQUIRE_VERIFICATION: true,
  COD_MAX_DELIVERY_ATTEMPTS: 3,
  COD_DELIVERY_TIMEOUT_HOURS: 72,

  // Payment monitoring
  FAILED_PAYMENT_ALERTS: true,
  HIGH_VALUE_PAYMENT_THRESHOLD: 1000000, // UGX 1,000,000
  SUSPICIOUS_PAYMENT_PATTERNS: true,

  // Bulk operations
  BULK_COD_ASSIGNMENT: true,
  BULK_STATUS_UPDATE: true,
  BULK_REFUND_PROCESSING: true,

  // Analytics
  PAYMENT_ANALYTICS_RETENTION_DAYS: 365,
  REAL_TIME_PAYMENT_MONITORING: true,
};

// =============================================================================
// PAYMENT UI CONFIGURATIONS
// =============================================================================

export const PAYMENT_UI_CONFIG = {
  // Payment method selection
  SHOW_PAYMENT_ICONS: true,
  SHOW_PAYMENT_FEES: true,
  SHOW_PROCESSING_TIME: true,
  HIGHLIGHT_RECOMMENDED_METHOD: true,

  // Mobile money UI
  SHOW_PHONE_VALIDATION: true,
  AUTO_DETECT_PROVIDER: true,
  SHOW_PROVIDER_INSTRUCTIONS: true,

  // COD UI
  SHOW_DELIVERY_FEE: true,
  REQUIRE_DELIVERY_NOTES: false,
  SHOW_COD_TERMS: true,

  // Progress indicators
  SHOW_PAYMENT_PROGRESS: true,
  SHOW_COUNTDOWN_TIMER: true,
  AUTO_REFRESH_STATUS: true,
  REFRESH_INTERVAL: 5000, // 5 seconds
};

// =============================================================================
// PAYMENT ANALYTICS CONFIGURATION
// =============================================================================

export const PAYMENT_ANALYTICS_CONFIG = {
  // Metrics to track
  METRICS: [
    'total_transactions',
    'successful_payments',
    'failed_payments',
    'average_transaction_value',
    'payment_method_distribution',
    'cod_conversion_rate',
    'refund_rate',
    'processing_time',
  ],

  // Time periods for analytics
  TIME_PERIODS: [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' },
  ],

  // Chart configurations
  CHART_COLORS: {
    mtn_momo: '#FFCC00',
    airtel_money: '#FF0000',
    cod: '#10b981',
    successful: '#10b981',
    failed: '#ef4444',
    pending: '#f59e0b',
  },
};

// =============================================================================
// EXPORTED HELPERS
// =============================================================================

export const PaymentHelpers = {
  getPaymentMethodDetails,
  getPaymentStatusDetails,
  validatePhoneForPaymentMethod,
  getProviderFromPhone,
  formatPhoneForPayment,
  validatePaymentAmount,
};

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default {
  PAYMENT_METHODS,
  PAYMENT_METHOD_CHOICES,
  PAYMENT_STATUS,
  PAYMENT_STATUS_CHOICES,
  PAYMENT_STATUS_FLOW,
  MOBILE_MONEY_PROVIDERS,
  COD_CONFIG,
  CURRENCY,
  UGANDA_PHONE_CONFIG,
  PAYMENT_VALIDATION,
  PAYMENT_FLOWS,
  PAYMENT_TIMEOUTS,
  PAYMENT_NOTIFICATIONS,
  PAYMENT_SECURITY,
  ADMIN_PAYMENT_CONFIG,
  PAYMENT_UI_CONFIG,
  PAYMENT_ANALYTICS_CONFIG,
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_CHOICES,
  PAYMENT_ERROR_CODES,
  PaymentHelpers,
};
