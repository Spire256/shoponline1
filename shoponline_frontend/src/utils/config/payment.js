/**
 * Payment Configuration for ShopOnline Uganda E-commerce Platform
 * Comprehensive payment system configuration for MTN MoMo, Airtel Money, and Cash on Delivery
 */

/**
 * Payment Method Definitions
 */
export const PAYMENT_METHODS = {
  MTN_MOMO: {
    id: 'mtn_momo',
    name: 'MTN Mobile Money',
    displayName: 'MTN MoMo',
    icon: '/assets/payment-icons/mtn-momo.svg',
    color: '#ffcb05',
    description: 'Pay securely with MTN Mobile Money',
    isEnabled: true,
    requiresPhone: true,
    supportedPrefixes: ['077', '078', '039'],
    minAmount: 1000, // UGX 1,000
    maxAmount: 10000000, // UGX 10,000,000
    processingTime: '1-5 minutes',
    fees: {
      fixed: 0,
      percentage: 0,
      description: 'No additional fees',
    },
  },

  AIRTEL_MONEY: {
    id: 'airtel_money',
    name: 'Airtel Money',
    displayName: 'Airtel Money',
    icon: '/assets/payment-icons/airtel-money.svg',
    color: '#ff0000',
    description: 'Pay securely with Airtel Money',
    isEnabled: true,
    requiresPhone: true,
    supportedPrefixes: ['070', '075', '074'],
    minAmount: 1000, // UGX 1,000
    maxAmount: 10000000, // UGX 10,000,000
    processingTime: '1-5 minutes',
    fees: {
      fixed: 0,
      percentage: 0,
      description: 'No additional fees',
    },
  },

  CASH_ON_DELIVERY: {
    id: 'cod',
    name: 'Cash on Delivery',
    displayName: 'Cash on Delivery',
    icon: '/assets/payment-icons/cash-on-delivery.svg',
    color: '#10b981',
    description: 'Pay with cash when your order is delivered',
    isEnabled: true,
    requiresPhone: true,
    requiresAddress: true,
    minAmount: 5000, // UGX 5,000 (minimum for COD)
    maxAmount: 5000000, // UGX 5,000,000
    processingTime: '1-3 business days',
    fees: {
      fixed: 2000, // UGX 2,000 delivery fee
      percentage: 0,
      description: 'UGX 2,000 delivery fee',
    },
    availableRegions: [
      'Kampala',
      'Wakiso',
      'Mukono',
      'Entebbe',
      'Jinja',
      'Masaka',
      'Mbarara',
      'Gulu',
      'Lira',
      'Mbale',
    ],
  },
};

/**
 * Payment Status Definitions
 */
export const PAYMENT_STATUS = {
  PENDING: {
    id: 'pending',
    name: 'Pending',
    description: 'Payment is being processed',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    canCancel: true,
    canRetry: false,
  },

  PROCESSING: {
    id: 'processing',
    name: 'Processing',
    description: 'Payment is currently being processed',
    color: '#3b82f6',
    bgColor: '#dbeafe',
    canCancel: false,
    canRetry: false,
  },

  COMPLETED: {
    id: 'completed',
    name: 'Completed',
    description: 'Payment has been successfully completed',
    color: '#10b981',
    bgColor: '#d1fae5',
    canCancel: false,
    canRetry: false,
  },

  FAILED: {
    id: 'failed',
    name: 'Failed',
    description: 'Payment failed to process',
    color: '#ef4444',
    bgColor: '#fee2e2',
    canCancel: false,
    canRetry: true,
  },

  CANCELLED: {
    id: 'cancelled',
    name: 'Cancelled',
    description: 'Payment was cancelled',
    color: '#64748b',
    bgColor: '#f1f5f9',
    canCancel: false,
    canRetry: true,
  },

  REFUNDED: {
    id: 'refunded',
    name: 'Refunded',
    description: 'Payment has been refunded',
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    canCancel: false,
    canRetry: false,
  },
};

/**
 * MTN Mobile Money Configuration
 */
export const MTN_CONFIG = {
  // API Configuration
  API: {
    BASE_URL:
      process.env.NODE_ENV === 'production'
        ? 'https://momodeveloper.mtn.com'
        : 'https://sandbox.momodeveloper.mtn.com',
    VERSION: 'v1_0',
    ENVIRONMENT: process.env.NODE_ENV === 'production' ? 'mtnyuganda' : 'sandbox',
    TARGET_ENVIRONMENT: process.env.NODE_ENV === 'production' ? 'mtnyuganda' : 'sandbox',
  },

  // Request configuration
  REQUEST: {
    timeout: 300000, // 5 minutes
    retryAttempts: 3,
    retryDelay: 2000, // 2 seconds
  },

  // Validation
  VALIDATION: {
    phonePattern: /^(\+256|256|0)?(77|78|39)\d{7}$/,
    minAmount: 1000,
    maxAmount: 10000000,
    currency: 'UGX',
  },

  // Status mapping
  STATUS_MAPPING: {
    PENDING: 'pending',
    SUCCESSFUL: 'completed',
    FAILED: 'failed',
    TIMEOUT: 'failed',
    CANCELLED: 'cancelled',
  },

  // Error codes
  ERROR_CODES: {
    INSUFFICIENT_FUNDS: 'Insufficient funds in your MTN Mobile Money account',
    INVALID_PHONE: 'Invalid MTN Mobile Money phone number',
    USER_NOT_FOUND: 'MTN Mobile Money account not found',
    TRANSACTION_LIMIT: 'Transaction exceeds your daily limit',
    SYSTEM_ERROR: 'MTN Mobile Money service temporarily unavailable',
  },
};

/**
 * Airtel Money Configuration
 */
export const AIRTEL_CONFIG = {
  // API Configuration
  API: {
    BASE_URL:
      process.env.NODE_ENV === 'production'
        ? 'https://openapi.airtel.africa'
        : 'https://openapiuat.airtel.africa',
    VERSION: 'v1',
    COUNTRY: 'UG',
    CURRENCY: 'UGX',
  },

  // Request configuration
  REQUEST: {
    timeout: 300000, // 5 minutes
    retryAttempts: 3,
    retryDelay: 2000, // 2 seconds
  },

  // Validation
  VALIDATION: {
    phonePattern: /^(\+256|256|0)?(70|75|74)\d{7}$/,
    minAmount: 1000,
    maxAmount: 10000000,
    currency: 'UGX',
  },

  // Status mapping
  STATUS_MAPPING: {
    TXN_SUCCESS: 'completed',
    TXN_PENDING: 'pending',
    TXN_FAILED: 'failed',
    TXN_TIMEOUT: 'failed',
    TXN_CANCELLED: 'cancelled',
  },

  // Error codes
  ERROR_CODES: {
    INSUFFICIENT_BALANCE: 'Insufficient balance in your Airtel Money account',
    INVALID_MSISDN: 'Invalid Airtel Money phone number',
    SUBSCRIBER_NOT_FOUND: 'Airtel Money account not found',
    TRANSACTION_LIMIT_EXCEEDED: 'Transaction exceeds your daily limit',
    SERVICE_UNAVAILABLE: 'Airtel Money service temporarily unavailable',
  },
};

/**
 * Cash on Delivery Configuration
 */
export const COD_CONFIG = {
  // Service areas
  AVAILABLE_REGIONS: [
    'Kampala',
    'Wakiso',
    'Mukono',
    'Entebbe',
    'Jinja',
    'Masaka',
    'Mbarara',
    'Gulu',
    'Lira',
    'Mbale',
    'Fort Portal',
    'Kasese',
    'Soroti',
    'Arua',
    'Hoima',
  ],

  // Delivery settings
  DELIVERY: {
    fee: 2000, // UGX 2,000
    minOrderAmount: 5000, // UGX 5,000
    maxOrderAmount: 5000000, // UGX 5,000,000
    estimatedDays: {
      Kampala: 1,
      Wakiso: 1,
      Mukono: 1,
      Entebbe: 1,
      default: 2,
    },
  },

  // Business hours for delivery
  BUSINESS_HOURS: {
    start: 8, // 8 AM
    end: 18, // 6 PM
    timezone: 'Africa/Kampala',
    workingDays: [1, 2, 3, 4, 5], // Monday to Friday
  },

  // Verification requirements
  VERIFICATION: {
    requirePhoneVerification: true,
    requireAddressVerification: true,
    adminApprovalRequired: true,
    maxUnverifiedOrders: 3,
  },

  // Admin notifications
  NOTIFICATIONS: {
    instantNotification: true,
    emailNotification: true,
    smsNotification: false,
    notificationDelay: 0, // Immediate
  },
};

/**
 * Payment Form Validation
 */
export const PAYMENT_VALIDATION = {
  // Phone number validation
  validatePhoneNumber: {
    mtn: phone => {
      const cleaned = phone.replace(/\D/g, '');
      return MTN_CONFIG.VALIDATION.phonePattern.test(cleaned);
    },

    airtel: phone => {
      const cleaned = phone.replace(/\D/g, '');
      return AIRTEL_CONFIG.VALIDATION.phonePattern.test(cleaned);
    },

    general: phone => {
      const cleaned = phone.replace(/\D/g, '');
      return /^(\+256|256|0)?[7][0-9]\d{7}$/.test(cleaned);
    },
  },

  // Amount validation
  validateAmount: {
    mtn: amount => {
      const numAmount = parseFloat(amount);
      return (
        numAmount >= MTN_CONFIG.VALIDATION.minAmount && 
        numAmount <= MTN_CONFIG.VALIDATION.maxAmount
      );
    },

    airtel: amount => {
      const numAmount = parseFloat(amount);
      return (
        numAmount >= AIRTEL_CONFIG.VALIDATION.minAmount &&
        numAmount <= AIRTEL_CONFIG.VALIDATION.maxAmount
      );
    },

    cod: amount => {
      const numAmount = parseFloat(amount);
      return (
        numAmount >= COD_CONFIG.DELIVERY.minOrderAmount &&
        numAmount <= COD_CONFIG.DELIVERY.maxOrderAmount
      );
    },
  },

  // Address validation for COD
  validateCODAddress: address => {
    return {
      isValid: address.district && COD_CONFIG.AVAILABLE_REGIONS.includes(address.district),
      message:
        address.district && !COD_CONFIG.AVAILABLE_REGIONS.includes(address.district)
          ? `Cash on Delivery is not available in ${address.district}`
          : null,
    };
  },
};

/**
 * Payment Processing Utilities
 */
export const paymentUtils = {
  /**
   * Format phone number for payment APIs
   * @param {string} phone - Phone number
   * @param {string} provider - Payment provider
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(phone, provider = 'general') {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');

    // Handle different formats
    if (cleaned.startsWith('256')) {
      cleaned = cleaned.slice(3); // Remove country code
    } else if (cleaned.startsWith('0')) {
      cleaned = cleaned.slice(1); // Remove leading zero
    }

    // Add country code for API
    return `256${cleaned}`;
  },

  /**
   * Detect payment provider from phone number
   * @param {string} phone - Phone number
   * @returns {string|null} Detected provider
   */
  detectProvider(phone) {
    const cleaned = phone.replace(/\D/g, '');
    const prefix = cleaned.slice(-9, -7); // Get the prefix part

    if (MTN_CONFIG.VALIDATION.phonePattern.test(cleaned)) {
      return 'mtn_momo';
    } else if (AIRTEL_CONFIG.VALIDATION.phonePattern.test(cleaned)) {
      return 'airtel_money';
    }

    return null;
  },

  /**
   * Calculate payment fees
   * @param {number} amount - Payment amount
   * @param {string} method - Payment method
   * @returns {Object} Fee calculation
   */
  calculateFees(amount, method) {
    const paymentMethod = PAYMENT_METHODS[method.toUpperCase()];
    if (!paymentMethod) return { total: 0, breakdown: {} };

    const fees = paymentMethod.fees;
    const fixedFee = fees.fixed || 0;
    const percentageFee = (amount * (fees.percentage || 0)) / 100;
    const totalFees = fixedFee + percentageFee;

    return {
      total: totalFees,
      breakdown: {
        fixed: fixedFee,
        percentage: percentageFee,
        amount: amount,
        totalWithFees: amount + totalFees,
      },
      description: fees.description,
    };
  },

  /**
   * Check if payment method is available for amount
   * @param {string} method - Payment method
   * @param {number} amount - Payment amount
   * @returns {Object} Availability check result
   */
  isMethodAvailable(method, amount) {
    const paymentMethod = PAYMENT_METHODS[method.toUpperCase()];

    if (!paymentMethod) {
      return { available: false, reason: 'Payment method not found' };
    }

    if (!paymentMethod.isEnabled) {
      return { available: false, reason: 'Payment method is temporarily disabled' };
    }

    if (amount < paymentMethod.minAmount) {
      return {
        available: false,
        reason: `Minimum amount is UGX ${paymentMethod.minAmount.toLocaleString()}`
      };
    }

    if (amount > paymentMethod.maxAmount) {
      return {
        available: false,
        reason: `Maximum amount is UGX ${paymentMethod.maxAmount.toLocaleString()}`
      };
    }

    return { available: true };
  },

  /**
   * Check if COD is available for delivery address
   * @param {Object} address - Delivery address
   * @returns {Object} COD availability
   */
  isCODAvailable(address) {
    if (!address.district) {
      return { available: false, reason: 'District is required' };
    }

    if (!COD_CONFIG.AVAILABLE_REGIONS.includes(address.district)) {
      return {
        available: false,
        reason: `Cash on Delivery is not available in ${address.district}`
      };
    }

    return { available: true };
  },

  /**
   * Generate payment reference number
   * @param {string} method - Payment method
   * @returns {string} Reference number
   */
  generateReference(method) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const methodPrefix = {
      mtn_momo: 'MTN',
      airtel_money: 'ART',
      cod: 'COD',
    };

    return `${methodPrefix[method] || 'PAY'}${timestamp.slice(-6)}${random}`;
  },

  /**
   * Format currency amount for display
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code
   * @returns {string} Formatted amount
   */
  formatAmount(amount, currency = 'UGX') {
    return `${currency} ${Math.round(amount).toLocaleString()}`;
  },

  /**
   * Parse amount from string
   * @param {string} amountString - Amount as string
   * @returns {number} Parsed amount
   */
  parseAmount(amountString) {
    return parseFloat(amountString.replace(/[^\d.]/g, '')) || 0;
  },
};

/**
 * Payment Form Configuration
 */
export const PAYMENT_FORMS = {
  // MTN Mobile Money form fields
  MTN_MOMO: {
    fields: [
      {
        name: 'phone_number',
        type: 'tel',
        label: 'MTN Mobile Money Number',
        placeholder: '077XXXXXXX',
        required: true,
        validation: 'mtn_phone',
      },
      {
        name: 'customer_name',
        type: 'text',
        label: 'Account Holder Name',
        placeholder: 'John Doe',
        required: false,
      },
    ],
    submitText: 'Pay with MTN MoMo',
    loadingText: 'Processing MTN Payment...',
  },

  // Airtel Money form fields
  AIRTEL_MONEY: {
    fields: [
      {
        name: 'phone_number',
        type: 'tel',
        label: 'Airtel Money Number',
        placeholder: '070XXXXXXX',
        required: true,
        validation: 'airtel_phone',
      },
      {
        name: 'customer_name',
        type: 'text',
        label: 'Account Holder Name',
        placeholder: 'Jane Doe',
        required: false,
      },
    ],
    submitText: 'Pay with Airtel Money',
    loadingText: 'Processing Airtel Payment...',
  },

  // Cash on Delivery form fields
  COD: {
    fields: [
      {
        name: 'delivery_phone',
        type: 'tel',
        label: 'Delivery Contact Number',
        placeholder: '077XXXXXXX',
        required: true,
        validation: 'uganda_phone',
      },
      {
        name: 'delivery_address',
        type: 'textarea',
        label: 'Detailed Delivery Address',
        placeholder: 'Please provide detailed address including landmarks',
        required: true,
        rows: 3,
      },
      {
        name: 'delivery_notes',
        type: 'textarea',
        label: 'Special Delivery Instructions (Optional)',
        placeholder: 'Any special instructions for delivery',
        required: false,
        rows: 2,
      },
    ],
    submitText: 'Place COD Order',
    loadingText: 'Creating COD Order...',
  },
};

/**
 * Payment Error Handling
 */
export const PAYMENT_ERRORS = {
  // Network errors
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    message: 'Network connection failed. Please check your internet connection.',
    retry: true,
  },

  // Timeout errors
  TIMEOUT_ERROR: {
    code: 'TIMEOUT_ERROR',
    message: 'Payment request timed out. Please try again.',
    retry: true,
  },

  // Validation errors
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    message: 'Please check your payment details and try again.',
    retry: false,
  },

  // Provider-specific errors
  MTN_ERRORS: {
    INSUFFICIENT_FUNDS: {
      code: 'MTN_INSUFFICIENT_FUNDS',
      message: 'Insufficient funds in your MTN Mobile Money account.',
      action: 'Please top up your account and try again.',
    },
    INVALID_PIN: {
      code: 'MTN_INVALID_PIN',
      message: 'Invalid MTN Mobile Money PIN.',
      action: 'Please check your PIN and try again.',
    },
    ACCOUNT_BLOCKED: {
      code: 'MTN_ACCOUNT_BLOCKED',
      message: 'Your MTN Mobile Money account is temporarily blocked.',
      action: 'Please contact MTN customer service.',
    },
  },

  AIRTEL_ERRORS: {
    INSUFFICIENT_BALANCE: {
      code: 'AIRTEL_INSUFFICIENT_BALANCE',
      message: 'Insufficient balance in your Airtel Money account.',
      action: 'Please top up your account and try again.',
    },
    INVALID_PIN: {
      code: 'AIRTEL_INVALID_PIN',
      message: 'Invalid Airtel Money PIN.',
      action: 'Please check your PIN and try again.',
    },
    SERVICE_DOWN: {
      code: 'AIRTEL_SERVICE_DOWN',
      message: 'Airtel Money service is temporarily unavailable.',
      action: 'Please try again later or use a different payment method.',
    },
  },

  COD_ERRORS: {
    REGION_NOT_SUPPORTED: {
      code: 'COD_REGION_NOT_SUPPORTED',
      message: 'Cash on Delivery is not available in your region.',
      action: 'Please use Mobile Money payment instead.',
    },
    MIN_ORDER_NOT_MET: {
      code: 'COD_MIN_ORDER_NOT_MET',
      message: `Minimum order amount for COD is UGX ${COD_CONFIG.DELIVERY.minOrderAmount.toLocaleString()}.`,
      action: 'Please add more items or use Mobile Money payment.',
    },
  },
};

/**
 * Payment UI Configuration
 */
export const PAYMENT_UI = {
  // Loading states
  LOADING_MESSAGES: {
    mtn_momo: 'Processing MTN Mobile Money payment...',
    airtel_money: 'Processing Airtel Money payment...',
    cod: 'Creating Cash on Delivery order...',
    default: 'Processing payment...',
  },

  // Success messages
  SUCCESS_MESSAGES: {
    mtn_momo: 'MTN Mobile Money payment successful!',
    airtel_money: 'Airtel Money payment successful!',
    cod: 'Cash on Delivery order created successfully!',
    default: 'Payment completed successfully!',
  },

  // Step indicators for checkout
  CHECKOUT_STEPS: [
    { id: 1, name: 'Cart Review', icon: 'shopping-cart' },
    { id: 2, name: 'Delivery Info', icon: 'truck' },
    { id: 3, name: 'Payment Method', icon: 'credit-card' },
    { id: 4, name: 'Confirmation', icon: 'check-circle' },
  ],

  // Payment method icons and styling
  METHOD_STYLING: {
    mtn_momo: {
      primaryColor: '#ffcb05',
      secondaryColor: '#000000',
      gradient: 'linear-gradient(135deg, #ffcb05 0%, #ff9500 100%)',
      iconClass: 'mtn-icon',
    },
    airtel_money: {
      primaryColor: '#ff0000',
      secondaryColor: '#ffffff',
      gradient: 'linear-gradient(135deg, #ff0000 0%, #cc0000 100%)',
      iconClass: 'airtel-icon',
    },
    cod: {
      primaryColor: '#10b981',
      secondaryColor: '#ffffff',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      iconClass: 'cod-icon',
    },
  },
};

/**
 * Payment Security Configuration
 */
export const PAYMENT_SECURITY = {
  // Encryption settings
  ENCRYPTION: {
    algorithm: 'AES-256-CBC',
    keyLength: 256,
  },

  // Request signing
  SIGNATURE: {
    algorithm: 'HMAC-SHA256',
    headerName: 'X-Signature',
  },

  // Rate limiting
  RATE_LIMITS: {
    PAYMENT_ATTEMPTS: {
      max: 5,
      window: 300000, // 5 minutes
      message: 'Too many payment attempts. Please wait before trying again.',
    },

    PHONE_VERIFICATION: {
      max: 3,
      window: 300000, // 5 minutes
      message: 'Too many verification attempts. Please wait before trying again.',
    },
  },

  // Fraud detection
  FRAUD_CHECKS: {
    enableDeviceFingerprinting: true,
    enableIPGeolocation: true,
    enableVelocityChecks: true,
    maxDailyAmount: 20000000, // UGX 20,000,000
    maxTransactionsPerHour: 10,
  },
};

/**
 * Payment Analytics Configuration
 */
export const PAYMENT_ANALYTICS = {
  // Metrics to track
  METRICS: [
    'total_transactions',
    'successful_transactions',
    'failed_transactions',
    'average_transaction_amount',
    'payment_method_distribution',
    'processing_time',
    'failure_rate',
    'revenue',
  ],

  // Chart configurations
  CHARTS: {
    PAYMENT_METHODS: {
      type: 'pie',
      colors: ['#ffcb05', '#ff0000', '#10b981'], // MTN, Airtel, COD colors
      title: 'Payment Methods Distribution',
    },

    DAILY_REVENUE: {
      type: 'line',
      color: '#2563eb',
      title: 'Daily Revenue Trend',
    },

    SUCCESS_RATE: {
      type: 'bar',
      colors: ['#10b981', '#ef4444'], // Success, Failure
      title: 'Payment Success Rate',
    },
  },
};

/**
 * Webhook Configuration
 */
export const WEBHOOK_CONFIG = {
  // Webhook endpoints
  ENDPOINTS: {
    MTN: '/api/v1/payments/webhooks/mtn/',
    AIRTEL: '/api/v1/payments/webhooks/airtel/',
  },

  // Webhook validation
  VALIDATION: {
    requireSignature: true,
    signatureHeader: 'X-Webhook-Signature',
    timestampTolerance: 300000, // 5 minutes
    requiredHeaders: ['X-Webhook-Signature', 'X-Timestamp'],
  },

  // Retry configuration for failed webhooks
  RETRY: {
    maxAttempts: 5,
    backoffMultiplier: 2,
    initialDelay: 1000, // 1 second
  },
};

/**
 * Payment Method Selector Configuration
 */
export const PAYMENT_METHOD_SELECTOR = {
  // Default order of payment methods
  DEFAULT_ORDER: ['mtn_momo', 'airtel_money', 'cod'],

  // Conditional display rules
  DISPLAY_RULES: {
    // Show MTN MoMo only for MTN numbers
    mtn_momo: context => {
      if (context.phone) {
        return paymentUtils.detectProvider(context.phone) === 'mtn_momo';
      }
      return true;
    },

    // Show Airtel Money only for Airtel numbers
    airtel_money: context => {
      if (context.phone) {
        return paymentUtils.detectProvider(context.phone) === 'airtel_money';
      }
      return true;
    },

    // Show COD based on delivery address
    cod: context => {
      if (context.address && context.address.district) {
        return COD_CONFIG.AVAILABLE_REGIONS.includes(context.address.district);
      }
      return true;
    },
  },

  // Smart recommendations
  RECOMMENDATIONS: {
    // Recommend based on previous successful payments
    considerHistory: true,

    // Recommend based on phone number
    detectFromPhone: true,

    // Recommend based on order amount
    considerAmount: true,
  },
};

/**
 * Payment Flow Configuration
 */
export const PAYMENT_FLOWS = {
  // Mobile Money flow steps
  MOBILE_MONEY: [
    { step: 1, name: 'Enter Phone Number', component: 'PhoneInput' },
    { step: 2, name: 'Confirm Details', component: 'PaymentConfirmation' },
    { step: 3, name: 'Authorize Payment', component: 'PaymentAuthorization' },
    { step: 4, name: 'Payment Processing', component: 'PaymentProcessing' },
    { step: 5, name: 'Payment Complete', component: 'PaymentSuccess' },
  ],

  // Cash on Delivery flow steps
  COD: [
    { step: 1, name: 'Delivery Details', component: 'DeliveryForm' },
    { step: 2, name: 'Confirm Order', component: 'OrderConfirmation' },
    { step: 3, name: 'Order Placed', component: 'CODSuccess' },
  ],
};

/**
 * Payment Status Messages
 */
export const STATUS_MESSAGES = {
  pending: {
    message: 'Your payment is being processed',
    action: 'Please wait while we confirm your payment',
    icon: 'clock',
    color: '#f59e0b',
  },

  processing: {
    message: 'Payment is being processed',
    action: 'This may take a few minutes',
    icon: 'refresh',
    color: '#3b82f6',
  },

  completed: {
    message: 'Payment completed successfully',
    action: 'Your order is being prepared',
    icon: 'check-circle',
    color: '#10b981',
  },

  failed: {
    message: 'Payment failed',
    action: 'Please try again or use a different payment method',
    icon: 'x-circle',
    color: '#ef4444',
  },

  cancelled: {
    message: 'Payment was cancelled',
    action: 'You can try again or choose a different payment method',
    icon: 'x-circle',
    color: '#64748b',
  },
};

/**
 * Admin Payment Management Configuration
 */
export const ADMIN_PAYMENT_CONFIG = {
  // Dashboard widgets
  WIDGETS: [
    { id: 'total_revenue', title: 'Total Revenue', type: 'metric' },
    { id: 'pending_payments', title: 'Pending Payments', type: 'metric' },
    { id: 'cod_orders', title: 'COD Orders', type: 'metric' },
    { id: 'success_rate', title: 'Success Rate', type: 'percentage' },
    { id: 'payment_methods', title: 'Payment Methods', type: 'chart' },
    { id: 'daily_revenue', title: 'Daily Revenue', type: 'chart' },
  ],

  // Bulk actions
  BULK_ACTIONS: [
    { id: 'approve_cod', label: 'Approve COD Orders', requires: 'cod_orders' },
    { id: 'assign_delivery', label: 'Assign Delivery Agent', requires: 'cod_orders' },
    { id: 'mark_delivered', label: 'Mark as Delivered', requires: 'cod_orders' },
    { id: 'retry_failed', label: 'Retry Failed Payments', requires: 'failed_payments' },
  ],

  // Notification settings
  NOTIFICATIONS: {
    COD_ORDER_CREATED: {
      enabled: true,
      channels: ['websocket', 'email'],
      template: 'cod_order_notification',
    },

    PAYMENT_FAILED: {
      enabled: true,
      channels: ['websocket'],
      template: 'payment_failed_notification',
    },

    HIGH_VALUE_TRANSACTION: {
      enabled: true,
      threshold: 1000000, // UGX 1,000,000
      channels: ['websocket', 'email'],
      template: 'high_value_transaction',
    },
  },
};

/**
 * Mobile Optimization Configuration
 */
export const MOBILE_PAYMENT_CONFIG = {
  // Touch-optimized UI
  TOUCH_TARGETS: {
    minSize: 44, // 44px minimum touch target
    padding: 12,
  },

  // Mobile-specific flows
  MOBILE_FLOWS: {
    // Quick payment for mobile
    QUICK_PAY: {
      enabled: true,
      steps: 2, // Reduced steps for mobile
      autoDetectProvider: true,
    },

    // One-tap payments
    ONE_TAP: {
      enabled: false, // Future feature
      requiresSetup: true,
    },
  },

  // Mobile input optimization
  INPUT_CONFIG: {
    phone: {
      inputMode: 'tel',
      autoComplete: 'tel',
      maxLength: 15,
    },
    amount: {
      inputMode: 'numeric',
      autoComplete: 'transaction-amount',
    },
  },
};

/**
 * Testing Configuration
 */
export const TEST_CONFIG = {
  // Test credentials
  TEST_PHONES: {
    MTN: '256777123456',
    AIRTEL: '256701123456',
  },

  // Test amounts
  TEST_AMOUNTS: {
    SUCCESS: 1000,
    INSUFFICIENT_FUNDS: 999999999,
    INVALID_PHONE: 2000,
    TIMEOUT: 3000,
  },

  // Mock responses
  MOCK_ENABLED: process.env.NODE_ENV === 'development' && process.env.USE_MOCK_PAYMENTS === 'true',
};

/**
 * Export main payment configuration
 */
export const PAYMENT = {
  METHODS: PAYMENT_METHODS,
  STATUS: PAYMENT_STATUS,
  MTN: MTN_CONFIG,
  AIRTEL: AIRTEL_CONFIG,
  COD: COD_CONFIG,
  VALIDATION: PAYMENT_VALIDATION,
  FORMS: PAYMENT_FORMS,
  ERRORS: PAYMENT_ERRORS,
  UI: PAYMENT_UI,
  SECURITY: PAYMENT_SECURITY,
  ANALYTICS: PAYMENT_ANALYTICS,
  WEBHOOKS: WEBHOOK_CONFIG,
  FLOWS: PAYMENT_FLOWS,
  ADMIN: ADMIN_PAYMENT_CONFIG,
  MOBILE: MOBILE_PAYMENT_CONFIG,
  TEST: TEST_CONFIG,
  utils: paymentUtils,
};

export default PAYMENT;