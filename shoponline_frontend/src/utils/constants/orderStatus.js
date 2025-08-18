/**
 * Order status and management constants for ShopOnline Uganda E-commerce Platform
 *
 * Contains all order-related constants including:
 * - Order statuses and transitions
 * - COD verification states
 * - Order types and priorities
 * - Uganda-specific delivery configurations
 */

// =============================================================================
// ORDER STATUSES
// =============================================================================

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

export const ORDER_STATUS_CHOICES = [
  {
    value: ORDER_STATUS.PENDING,
    label: 'Pending',
    description: 'Order placed, awaiting confirmation',
    color: '#f59e0b',
    icon: 'clock',
    customerVisible: true,
    adminAction: 'confirm',
  },
  {
    value: ORDER_STATUS.CONFIRMED,
    label: 'Confirmed',
    description: 'Order confirmed, preparing for processing',
    color: '#3b82f6',
    icon: 'check-circle',
    customerVisible: true,
    adminAction: 'process',
  },
  {
    value: ORDER_STATUS.PROCESSING,
    label: 'Processing',
    description: 'Order is being prepared',
    color: '#8b5cf6',
    icon: 'package',
    customerVisible: true,
    adminAction: 'dispatch',
  },
  {
    value: ORDER_STATUS.OUT_FOR_DELIVERY,
    label: 'Out for Delivery',
    description: 'Order is on the way to customer',
    color: '#06b6d4',
    icon: 'truck',
    customerVisible: true,
    adminAction: 'deliver',
  },
  {
    value: ORDER_STATUS.DELIVERED,
    label: 'Delivered',
    description: 'Order successfully delivered to customer',
    color: '#10b981',
    icon: 'check-circle-2',
    customerVisible: true,
    adminAction: null,
  },
  {
    value: ORDER_STATUS.CANCELLED,
    label: 'Cancelled',
    description: 'Order was cancelled',
    color: '#ef4444',
    icon: 'x-circle',
    customerVisible: true,
    adminAction: null,
  },
  {
    value: ORDER_STATUS.REFUNDED,
    label: 'Refunded',
    description: 'Order was refunded',
    color: '#8b5cf6',
    icon: 'arrow-left-circle',
    customerVisible: true,
    adminAction: null,
  },
];

// =============================================================================
// ORDER STATUS FLOW
// =============================================================================

export const ORDER_STATUS_FLOW = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.OUT_FOR_DELIVERY]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.DELIVERED]: [ORDER_STATUS.REFUNDED],
  [ORDER_STATUS.CANCELLED]: [],
  [ORDER_STATUS.REFUNDED]: [],
};

// =============================================================================
// COD VERIFICATION STATUSES
// =============================================================================

export const COD_VERIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  DELIVERED_PAID: 'delivered_paid',
};

export const COD_VERIFICATION_CHOICES = [
  {
    value: COD_VERIFICATION_STATUS.PENDING,
    label: 'Pending Verification',
    description: 'COD order awaiting admin verification',
    color: '#f59e0b',
    icon: 'clock',
    adminAction: 'verify',
  },
  {
    value: COD_VERIFICATION_STATUS.VERIFIED,
    label: 'Verified',
    description: 'COD order verified, ready for delivery',
    color: '#10b981',
    icon: 'shield-check',
    adminAction: 'deliver',
  },
  {
    value: COD_VERIFICATION_STATUS.REJECTED,
    label: 'Rejected',
    description: 'COD order rejected',
    color: '#ef4444',
    icon: 'shield-x',
    adminAction: null,
  },
  {
    value: COD_VERIFICATION_STATUS.DELIVERED_PAID,
    label: 'Delivered & Paid',
    description: 'COD order delivered and payment received',
    color: '#10b981',
    icon: 'check-circle-2',
    adminAction: null,
  },
];

// =============================================================================
// ORDER TYPES
// =============================================================================

export const ORDER_TYPES = {
  REGULAR: 'regular',
  FLASH_SALE: 'flash_sale',
  BULK: 'bulk',
  WHOLESALE: 'wholesale',
};

export const ORDER_TYPE_CHOICES = [
  { value: ORDER_TYPES.REGULAR, label: 'Regular Order', color: '#3b82f6' },
  { value: ORDER_TYPES.FLASH_SALE, label: 'Flash Sale Order', color: '#ef4444' },
  { value: ORDER_TYPES.BULK, label: 'Bulk Order', color: '#8b5cf6' },
  { value: ORDER_TYPES.WHOLESALE, label: 'Wholesale Order', color: '#06b6d4' },
];

// =============================================================================
// ORDER PRIORITIES
// =============================================================================

export const ORDER_PRIORITY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
};

export const ORDER_PRIORITY_CHOICES = [
  { value: ORDER_PRIORITY.LOW, label: 'Low Priority', color: '#6b7280' },
  { value: ORDER_PRIORITY.NORMAL, label: 'Normal Priority', color: '#3b82f6' },
  { value: ORDER_PRIORITY.HIGH, label: 'High Priority', color: '#f59e0b' },
  { value: ORDER_PRIORITY.URGENT, label: 'Urgent', color: '#ef4444' },
];

// =============================================================================
// UGANDA DELIVERY CONFIGURATION
// =============================================================================

export const UGANDA_DELIVERY_CONFIG = {
  // Major delivery regions
  DELIVERY_REGIONS: [
    {
      name: 'Kampala Central',
      code: 'KLA_CENTRAL',
      deliveryTime: '1-2 hours',
      deliveryFee: 5000,
      codAvailable: true,
      priority: 1,
    },
    {
      name: 'Greater Kampala',
      code: 'KLA_GREATER',
      deliveryTime: '2-4 hours',
      deliveryFee: 8000,
      codAvailable: true,
      priority: 2,
    },
    {
      name: 'Wakiso District',
      code: 'WAKISO',
      deliveryTime: '4-8 hours',
      deliveryFee: 10000,
      codAvailable: true,
      priority: 3,
    },
    {
      name: 'Other Central Region',
      code: 'CENTRAL',
      deliveryTime: '1-2 days',
      deliveryFee: 15000,
      codAvailable: true,
      priority: 4,
    },
    {
      name: 'Major Towns (Jinja, Mbale, Gulu, Mbarara)',
      code: 'MAJOR_TOWNS',
      deliveryTime: '1-3 days',
      deliveryFee: 20000,
      codAvailable: true,
      priority: 5,
    },
    {
      name: 'Other Regions',
      code: 'OTHER',
      deliveryTime: '2-5 days',
      deliveryFee: 25000,
      codAvailable: false,
      priority: 6,
    },
  ],

  // Delivery time slots
  DELIVERY_TIME_SLOTS: [
    { value: 'morning', label: '8:00 AM - 12:00 PM', available: true },
    { value: 'afternoon', label: '12:00 PM - 5:00 PM', available: true },
    { value: 'evening', label: '5:00 PM - 8:00 PM', available: true },
    { value: 'flexible', label: 'Flexible (Any time)', available: true },
  ],

  // Working days
  WORKING_DAYS: [1, 2, 3, 4, 5, 6], // Monday to Saturday (0 = Sunday)
  WORKING_HOURS: { start: 8, end: 20 }, // 8 AM to 8 PM
};

// =============================================================================
// ORDER FILTERING AND SORTING
// =============================================================================

export const ORDER_FILTERS = {
  STATUS: 'status',
  PAYMENT_METHOD: 'payment_method',
  PAYMENT_STATUS: 'payment_status',
  DATE_FROM: 'date_from',
  DATE_TO: 'date_to',
  CUSTOMER: 'customer',
  IS_COD: 'is_cod',
  HAS_FLASH_SALE_ITEMS: 'has_flash_sale_items',
  DELIVERY_REGION: 'delivery_region',
  PRIORITY: 'priority',
  AMOUNT_MIN: 'amount_min',
  AMOUNT_MAX: 'amount_max',
};

export const ORDER_SORT_OPTIONS = [
  { value: '-created_at', label: 'Newest First' },
  { value: 'created_at', label: 'Oldest First' },
  { value: '-total_amount', label: 'Highest Amount' },
  { value: 'total_amount', label: 'Lowest Amount' },
  { value: 'status', label: 'Status' },
  { value: 'customer_name', label: 'Customer Name' },
  { value: '-priority', label: 'Priority' },
];

// =============================================================================
// ORDER VALIDATION RULES
// =============================================================================

export const ORDER_VALIDATION = {
  // Minimum order values
  MIN_ORDER_AMOUNT: 5000, // UGX 5,000
  MIN_COD_AMOUNT: 10000, // UGX 10,000
  MAX_ORDER_AMOUNT: 10000000, // UGX 10,000,000

  // Item quantity limits
  MIN_ITEM_QUANTITY: 1,
  MAX_ITEM_QUANTITY: 100,
  MAX_ITEMS_PER_ORDER: 50,

  // Address validation
  ADDRESS_MIN_LENGTH: 10,
  ADDRESS_MAX_LENGTH: 500,
  PHONE_REQUIRED: true,
  EMAIL_REQUIRED: true,

  // Delivery validation
  DELIVERY_NOTES_MAX_LENGTH: 1000,
  CUSTOMER_NOTES_MAX_LENGTH: 500,
};

// =============================================================================
// ORDER PROCESSING TIMEOUTS
// =============================================================================

export const ORDER_TIMEOUTS = {
  // How long orders stay in each status before automatic action
  PENDING_TIMEOUT_HOURS: 24, // Auto-cancel after 24 hours if not confirmed
  CONFIRMED_TIMEOUT_HOURS: 48, // Must start processing within 48 hours
  PROCESSING_TIMEOUT_HOURS: 72, // Must dispatch within 72 hours
  DELIVERY_TIMEOUT_HOURS: 120, // Must deliver within 5 days

  // COD specific timeouts
  COD_VERIFICATION_TIMEOUT_HOURS: 12, // Admin must verify COD within 12 hours
  COD_DELIVERY_TIMEOUT_HOURS: 72, // COD delivery must complete within 3 days
};

// =============================================================================
// ORDER NOTIFICATIONS
// =============================================================================

export const ORDER_NOTIFICATIONS = {
  ORDER_PLACED: {
    title: 'Order Placed Successfully',
    message: 'Your order has been placed and is awaiting confirmation.',
    type: 'success',
    channels: ['email', 'sms'],
  },
  ORDER_CONFIRMED: {
    title: 'Order Confirmed',
    message: 'Your order has been confirmed and is being prepared.',
    type: 'info',
    channels: ['email', 'push'],
  },
  ORDER_PROCESSING: {
    title: 'Order Processing',
    message: 'Your order is being prepared for delivery.',
    type: 'info',
    channels: ['push'],
  },
  ORDER_DISPATCHED: {
    title: 'Order Dispatched',
    message: 'Your order is on the way! Expected delivery: ',
    type: 'info',
    channels: ['email', 'sms', 'push'],
  },
  ORDER_DELIVERED: {
    title: 'Order Delivered',
    message: 'Your order has been successfully delivered.',
    type: 'success',
    channels: ['email', 'push'],
  },
  ORDER_CANCELLED: {
    title: 'Order Cancelled',
    message: 'Your order has been cancelled.',
    type: 'warning',
    channels: ['email', 'push'],
  },
  COD_VERIFICATION_NEEDED: {
    title: 'COD Order Verification',
    message: 'New cash on delivery order requires verification.',
    type: 'info',
    channels: ['admin_push', 'admin_email'],
    adminOnly: true,
  },
};

// =============================================================================
// BULK ORDER ACTIONS
// =============================================================================

export const BULK_ORDER_ACTIONS = {
  UPDATE_STATUS: 'update_status',
  ASSIGN_COURIER: 'assign_courier',
  MARK_PRIORITY: 'mark_priority',
  SEND_NOTIFICATION: 'send_notification',
  EXPORT_ORDERS: 'export_orders',
  CANCEL_ORDERS: 'cancel_orders',
  CONFIRM_COD: 'confirm_cod',
};

export const BULK_ACTION_CHOICES = [
  {
    value: BULK_ORDER_ACTIONS.UPDATE_STATUS,
    label: 'Update Status',
    description: 'Change status for selected orders',
    requiresInput: true,
    inputType: 'select',
    options: ORDER_STATUS_CHOICES,
  },
  {
    value: BULK_ORDER_ACTIONS.ASSIGN_COURIER,
    label: 'Assign Courier',
    description: 'Assign delivery person to orders',
    requiresInput: true,
    inputType: 'select',
  },
  {
    value: BULK_ORDER_ACTIONS.MARK_PRIORITY,
    label: 'Set Priority',
    description: 'Change priority level for orders',
    requiresInput: true,
    inputType: 'select',
    options: ORDER_PRIORITY_CHOICES,
  },
  {
    value: BULK_ORDER_ACTIONS.SEND_NOTIFICATION,
    label: 'Send Notification',
    description: 'Send custom notification to customers',
    requiresInput: true,
    inputType: 'textarea',
  },
  {
    value: BULK_ORDER_ACTIONS.EXPORT_ORDERS,
    label: 'Export Orders',
    description: 'Export selected orders to Excel/CSV',
    requiresInput: false,
  },
  {
    value: BULK_ORDER_ACTIONS.CANCEL_ORDERS,
    label: 'Cancel Orders',
    description: 'Cancel selected orders',
    requiresInput: true,
    inputType: 'textarea',
    placeholder: 'Cancellation reason...',
  },
  {
    value: BULK_ORDER_ACTIONS.CONFIRM_COD,
    label: 'Confirm COD Orders',
    description: 'Bulk confirm cash on delivery orders',
    requiresInput: false,
    codOnly: true,
  },
];

// =============================================================================
// ORDER ANALYTICS METRICS
// =============================================================================

export const ORDER_METRICS = {
  TOTAL_ORDERS: 'total_orders',
  PENDING_ORDERS: 'pending_orders',
  CONFIRMED_ORDERS: 'confirmed_orders',
  DELIVERED_ORDERS: 'delivered_orders',
  CANCELLED_ORDERS: 'cancelled_orders',
  COD_ORDERS: 'cod_orders',
  FLASH_SALE_ORDERS: 'flash_sale_orders',
  AVERAGE_ORDER_VALUE: 'average_order_value',
  TOTAL_REVENUE: 'total_revenue',
  DELIVERY_SUCCESS_RATE: 'delivery_success_rate',
  COD_CONVERSION_RATE: 'cod_conversion_rate',
  ORDER_FULFILLMENT_TIME: 'order_fulfillment_time',
};

// =============================================================================
// ORDER SEARCH AND FILTERING
// =============================================================================

export const ORDER_SEARCH_FIELDS = [
  'order_number',
  'customer_email',
  'customer_phone',
  'customer_name',
  'delivery_address',
  'admin_notes',
];

export const ADVANCED_ORDER_FILTERS = {
  // Date filters
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  THIS_WEEK: 'this_week',
  LAST_WEEK: 'last_week',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  THIS_QUARTER: 'this_quarter',
  THIS_YEAR: 'this_year',
  CUSTOM_RANGE: 'custom_range',

  // Amount filters
  UNDER_50K: 'under_50k',
  FROM_50K_TO_100K: '50k_to_100k',
  FROM_100K_TO_500K: '100k_to_500k',
  FROM_500K_TO_1M: '500k_to_1m',
  OVER_1M: 'over_1m',

  // Customer type filters
  NEW_CUSTOMERS: 'new_customers',
  RETURNING_CUSTOMERS: 'returning_customers',
  VIP_CUSTOMERS: 'vip_customers',
};

// =============================================================================
// ORDER TIMELINE EVENTS
// =============================================================================

export const ORDER_TIMELINE_EVENTS = {
  ORDER_CREATED: 'order_created',
  PAYMENT_INITIATED: 'payment_initiated',
  PAYMENT_COMPLETED: 'payment_completed',
  ORDER_CONFIRMED: 'order_confirmed',
  PROCESSING_STARTED: 'processing_started',
  ORDER_DISPATCHED: 'order_dispatched',
  DELIVERY_ATTEMPTED: 'delivery_attempted',
  ORDER_DELIVERED: 'order_delivered',
  ORDER_CANCELLED: 'order_cancelled',
  REFUND_INITIATED: 'refund_initiated',
  REFUND_COMPLETED: 'refund_completed',
  NOTE_ADDED: 'note_added',
  STATUS_CHANGED: 'status_changed',
};

// =============================================================================
// COD MANAGEMENT CONFIGURATION
// =============================================================================

export const COD_MANAGEMENT_CONFIG = {
  // Verification requirements
  REQUIRE_PHONE_VERIFICATION: true,
  REQUIRE_ADDRESS_VERIFICATION: true,
  REQUIRE_ADMIN_APPROVAL: true,

  // Delivery attempts
  MAX_DELIVERY_ATTEMPTS: 3,
  DELIVERY_ATTEMPT_INTERVAL_HOURS: 24,

  // COD limits
  MIN_COD_AMOUNT: 10000, // UGX 10,000
  MAX_COD_AMOUNT: 2000000, // UGX 2,000,000

  // Admin assignment
  AUTO_ASSIGN_COD: false,
  PREFERRED_COD_HANDLERS: [], // Admin user IDs

  // COD analytics
  TRACK_DELIVERY_SUCCESS_RATE: true,
  TRACK_PAYMENT_COLLECTION_RATE: true,
  TRACK_CUSTOMER_SATISFACTION: true,
};

// =============================================================================
// ORDER VALIDATION HELPERS
// =============================================================================

export const OrderValidation = {
  isValidStatusTransition: (currentStatus, newStatus) => {
    const allowedTransitions = ORDER_STATUS_FLOW[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  },

  canCancelOrder: orderStatus => {
    return [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED, ORDER_STATUS.PROCESSING].includes(
      orderStatus
    );
  },

  canRefundOrder: (orderStatus, paymentStatus) => {
    return orderStatus === ORDER_STATUS.DELIVERED && paymentStatus === 'completed';
  },

  isOrderEditable: orderStatus => {
    return [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED].includes(orderStatus);
  },

  requiresAdminAction: orderStatus => {
    const statusChoice = ORDER_STATUS_CHOICES.find(choice => choice.value === orderStatus);
    return statusChoice && statusChoice.adminAction;
  },

  getNextAction: orderStatus => {
    const statusChoice = ORDER_STATUS_CHOICES.find(choice => choice.value === orderStatus);
    return statusChoice ? statusChoice.adminAction : null;
  },
};

// =============================================================================
// ORDER DISPLAY HELPERS
// =============================================================================

export const OrderDisplay = {
  getStatusDetails: status => {
    return (
      ORDER_STATUS_CHOICES.find(choice => choice.value === status) || {
        value: status,
        label: 'Unknown',
        color: '#6b7280',
        icon: 'help-circle',
      }
    );
  },

  getCODVerificationDetails: status => {
    return (
      COD_VERIFICATION_CHOICES.find(choice => choice.value === status) || {
        value: status,
        label: 'Unknown',
        color: '#6b7280',
        icon: 'help-circle',
      }
    );
  },

  getOrderTypeDetails: type => {
    return (
      ORDER_TYPE_CHOICES.find(choice => choice.value === type) || {
        value: type,
        label: 'Regular Order',
        color: '#3b82f6',
      }
    );
  },

  getPriorityDetails: priority => {
    return (
      ORDER_PRIORITY_CHOICES.find(choice => choice.value === priority) || {
        value: priority,
        label: 'Normal Priority',
        color: '#3b82f6',
      }
    );
  },

  formatOrderNumber: orderNumber => {
    return orderNumber ? orderNumber.toUpperCase() : '';
  },

  getEstimatedDeliveryTime: (region, orderDate) => {
    const regionConfig = UGANDA_DELIVERY_CONFIG.DELIVERY_REGIONS.find(r => r.code === region);
    if (!regionConfig) return 'Contact for delivery time';

    const orderDateTime = new Date(orderDate);
    const deliveryTime = regionConfig.deliveryTime;

    // Parse delivery time and calculate estimated delivery
    if (deliveryTime.includes('hour')) {
      const hours = parseInt(deliveryTime.match(/\d+/)[0]);
      const estimatedDelivery = new Date(orderDateTime.getTime() + hours * 60 * 60 * 1000);
      return estimatedDelivery;
    } else if (deliveryTime.includes('day')) {
      const days = parseInt(deliveryTime.match(/\d+/)[0]);
      const estimatedDelivery = new Date(orderDateTime.getTime() + days * 24 * 60 * 60 * 1000);
      return estimatedDelivery;
    }

    return null;
  },
};

// =============================================================================
// ORDER EXPORT CONFIGURATIONS
// =============================================================================

export const ORDER_EXPORT_CONFIG = {
  FORMATS: ['xlsx', 'csv', 'pdf'],

  FIELDS: [
    'order_number',
    'customer_name',
    'customer_email',
    'customer_phone',
    'status',
    'payment_method',
    'payment_status',
    'total_amount',
    'delivery_address',
    'created_at',
    'delivered_at',
  ],

  CUSTOM_FIELDS: [
    'is_cod',
    'has_flash_sale_items',
    'flash_sale_savings',
    'admin_notes',
    'delivery_region',
    'priority_level',
  ],
};

// =============================================================================
// EXPORTED OBJECT
// =============================================================================

export default {
  ORDER_STATUS,
  ORDER_STATUS_CHOICES,
  ORDER_STATUS_FLOW,
  COD_VERIFICATION_STATUS,
  COD_VERIFICATION_CHOICES,
  ORDER_TYPES,
  ORDER_TYPE_CHOICES,
  ORDER_PRIORITY,
  ORDER_PRIORITY_CHOICES,
  UGANDA_DELIVERY_CONFIG,
  ORDER_FILTERS,
  ORDER_SORT_OPTIONS,
  ORDER_VALIDATION,
  ORDER_TIMEOUTS,
  ORDER_NOTIFICATIONS,
  BULK_ORDER_ACTIONS,
  BULK_ACTION_CHOICES,
  ORDER_METRICS,
  ORDER_SEARCH_FIELDS,
  ADVANCED_ORDER_FILTERS,
  ORDER_TIMELINE_EVENTS,
  COD_MANAGEMENT_CONFIG,
  ORDER_EXPORT_CONFIG,
  OrderValidation,
  OrderDisplay,
};
