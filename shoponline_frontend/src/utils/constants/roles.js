/**
 * User roles and permissions constants for ShopOnline Uganda E-commerce Platform
 *
 * Defines all user roles, permissions, and access control configurations
 * to match the Django backend role system.
 */

// =============================================================================
// USER ROLES
// =============================================================================

export const USER_ROLES = {
  ADMIN: 'admin',
  CLIENT: 'client',
};

export const USER_ROLE_CHOICES = [
  { value: USER_ROLES.ADMIN, label: 'Administrator' },
  { value: USER_ROLES.CLIENT, label: 'Client Customer' },
];

// =============================================================================
// EMAIL DOMAIN VALIDATION
// =============================================================================

export const EMAIL_DOMAINS = {
  ADMIN: '@shoponline.com',
  CLIENT: '@gmail.com',
};

export const ALLOWED_EMAIL_DOMAINS = [EMAIL_DOMAINS.ADMIN, EMAIL_DOMAINS.CLIENT];

// =============================================================================
// ROLE PERMISSIONS
// =============================================================================

export const PERMISSIONS = {
  // Product management
  PRODUCT_VIEW: 'product.view',
  PRODUCT_CREATE: 'product.create',
  PRODUCT_EDIT: 'product.edit',
  PRODUCT_DELETE: 'product.delete',
  PRODUCT_MANAGE_INVENTORY: 'product.manage_inventory',
  PRODUCT_BULK_ACTIONS: 'product.bulk_actions',

  // Category management
  CATEGORY_VIEW: 'category.view',
  CATEGORY_CREATE: 'category.create',
  CATEGORY_EDIT: 'category.edit',
  CATEGORY_DELETE: 'category.delete',
  CATEGORY_MANAGE_TREE: 'category.manage_tree',

  // Order management
  ORDER_VIEW_ALL: 'order.view_all',
  ORDER_VIEW_OWN: 'order.view_own',
  ORDER_UPDATE_STATUS: 'order.update_status',
  ORDER_CANCEL: 'order.cancel',
  ORDER_REFUND: 'order.refund',
  ORDER_MANAGE_COD: 'order.manage_cod',
  ORDER_BULK_ACTIONS: 'order.bulk_actions',

  // Payment management
  PAYMENT_VIEW_ALL: 'payment.view_all',
  PAYMENT_VIEW_OWN: 'payment.view_own',
  PAYMENT_PROCESS: 'payment.process',
  PAYMENT_REFUND: 'payment.refund',
  PAYMENT_MANAGE_METHODS: 'payment.manage_methods',
  PAYMENT_MANAGE_COD: 'payment.manage_cod',
  PAYMENT_VIEW_ANALYTICS: 'payment.view_analytics',

  // Flash sales management
  FLASH_SALE_VIEW: 'flash_sale.view',
  FLASH_SALE_CREATE: 'flash_sale.create',
  FLASH_SALE_EDIT: 'flash_sale.edit',
  FLASH_SALE_DELETE: 'flash_sale.delete',
  FLASH_SALE_MANAGE_PRODUCTS: 'flash_sale.manage_products',

  // User management
  USER_VIEW_ALL: 'user.view_all',
  USER_VIEW_OWN: 'user.view_own',
  USER_EDIT_OWN: 'user.edit_own',
  USER_MANAGE: 'user.manage',
  USER_INVITE_ADMIN: 'user.invite_admin',
  USER_DELETE: 'user.delete',

  // Homepage management
  HOMEPAGE_MANAGE: 'homepage.manage',
  BANNER_MANAGE: 'banner.manage',
  CONTENT_MANAGE: 'content.manage',

  // Analytics and reporting
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_ADVANCED: 'analytics.advanced',
  REPORTS_GENERATE: 'reports.generate',
  REPORTS_EXPORT: 'reports.export',

  // System administration
  SYSTEM_ADMIN: 'system.admin',
  SYSTEM_SETTINGS: 'system.settings',
  SYSTEM_LOGS: 'system.logs',
  SYSTEM_BACKUP: 'system.backup',

  // Notification management
  NOTIFICATION_SEND: 'notification.send',
  NOTIFICATION_BROADCAST: 'notification.broadcast',
  NOTIFICATION_MANAGE: 'notification.manage',
};

// =============================================================================
// ROLE-BASED PERMISSIONS MAPPING
// =============================================================================

export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    // Product permissions
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_EDIT,
    PERMISSIONS.PRODUCT_DELETE,
    PERMISSIONS.PRODUCT_MANAGE_INVENTORY,
    PERMISSIONS.PRODUCT_BULK_ACTIONS,

    // Category permissions
    PERMISSIONS.CATEGORY_VIEW,
    PERMISSIONS.CATEGORY_CREATE,
    PERMISSIONS.CATEGORY_EDIT,
    PERMISSIONS.CATEGORY_DELETE,
    PERMISSIONS.CATEGORY_MANAGE_TREE,

    // Order permissions
    PERMISSIONS.ORDER_VIEW_ALL,
    PERMISSIONS.ORDER_UPDATE_STATUS,
    PERMISSIONS.ORDER_CANCEL,
    PERMISSIONS.ORDER_REFUND,
    PERMISSIONS.ORDER_MANAGE_COD,
    PERMISSIONS.ORDER_BULK_ACTIONS,

    // Payment permissions
    PERMISSIONS.PAYMENT_VIEW_ALL,
    PERMISSIONS.PAYMENT_PROCESS,
    PERMISSIONS.PAYMENT_REFUND,
    PERMISSIONS.PAYMENT_MANAGE_METHODS,
    PERMISSIONS.PAYMENT_MANAGE_COD,
    PERMISSIONS.PAYMENT_VIEW_ANALYTICS,

    // Flash sales permissions
    PERMISSIONS.FLASH_SALE_VIEW,
    PERMISSIONS.FLASH_SALE_CREATE,
    PERMISSIONS.FLASH_SALE_EDIT,
    PERMISSIONS.FLASH_SALE_DELETE,
    PERMISSIONS.FLASH_SALE_MANAGE_PRODUCTS,

    // User management permissions
    PERMISSIONS.USER_VIEW_ALL,
    PERMISSIONS.USER_MANAGE,
    PERMISSIONS.USER_INVITE_ADMIN,
    PERMISSIONS.USER_DELETE,

    // Homepage management permissions
    PERMISSIONS.HOMEPAGE_MANAGE,
    PERMISSIONS.BANNER_MANAGE,
    PERMISSIONS.CONTENT_MANAGE,

    // Analytics permissions
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_ADVANCED,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.REPORTS_EXPORT,

    // System permissions
    PERMISSIONS.SYSTEM_ADMIN,
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.SYSTEM_LOGS,
    PERMISSIONS.SYSTEM_BACKUP,

    // Notification permissions
    PERMISSIONS.NOTIFICATION_SEND,
    PERMISSIONS.NOTIFICATION_BROADCAST,
    PERMISSIONS.NOTIFICATION_MANAGE,
  ],

  [USER_ROLES.CLIENT]: [
    // Limited product permissions
    PERMISSIONS.PRODUCT_VIEW,

    // Limited category permissions
    PERMISSIONS.CATEGORY_VIEW,

    // Own order permissions
    PERMISSIONS.ORDER_VIEW_OWN,
    PERMISSIONS.ORDER_CANCEL, // Only own orders

    // Own payment permissions
    PERMISSIONS.PAYMENT_VIEW_OWN,
    PERMISSIONS.PAYMENT_PROCESS, // Only for own orders

    // Flash sales viewing
    PERMISSIONS.FLASH_SALE_VIEW,

    // Own profile management
    PERMISSIONS.USER_VIEW_OWN,
    PERMISSIONS.USER_EDIT_OWN,

    // Basic analytics (own data only)
    PERMISSIONS.ANALYTICS_VIEW, // Limited to own data
  ],
};

// =============================================================================
// PERMISSION CHECKING HELPERS
// =============================================================================

export const checkPermission = (userRole, permission) => {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
};

export const checkMultiplePermissions = (userRole, permissions, requireAll = true) => {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];

  if (requireAll) {
    return permissions.every(permission => rolePermissions.includes(permission));
  } else {
    return permissions.some(permission => rolePermissions.includes(permission));
  }
};

export const getUserPermissions = userRole => {
  return ROLE_PERMISSIONS[userRole] || [];
};

// =============================================================================
// ROLE VALIDATION
// =============================================================================

export const isValidRole = role => {
  return Object.values(USER_ROLES).includes(role);
};

export const isAdmin = userRole => {
  return userRole === USER_ROLES.ADMIN;
};

export const isClient = userRole => {
  return userRole === USER_ROLES.CLIENT;
};

export const validateEmailForRole = (email, role) => {
  if (role === USER_ROLES.ADMIN) {
    return email.endsWith(EMAIL_DOMAINS.ADMIN);
  } else if (role === USER_ROLES.CLIENT) {
    return email.endsWith(EMAIL_DOMAINS.CLIENT);
  }
  return false;
};

export const getRoleFromEmail = email => {
  if (email.endsWith(EMAIL_DOMAINS.ADMIN)) {
    return USER_ROLES.ADMIN;
  } else if (email.endsWith(EMAIL_DOMAINS.CLIENT)) {
    return USER_ROLES.CLIENT;
  }
  return null;
};

// =============================================================================
// ADMIN INVITATION CONSTANTS
// =============================================================================

export const INVITATION_STATUS = {
  SENT: 'sent',
  USED: 'used',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
};

export const INVITATION_TOKEN_EXPIRY_HOURS = 48;

// =============================================================================
// ROUTE PROTECTION HELPERS
// =============================================================================

export const PROTECTED_ROUTES = {
  ADMIN_ONLY: ['/admin', '/admin/*', '/dashboard', '/dashboard/*'],

  CLIENT_ONLY: ['/profile', '/orders', '/cart', '/checkout'],

  AUTHENTICATED: ['/profile', '/orders', '/notifications'],

  PUBLIC: [
    '/',
    '/products',
    '/products/*',
    '/categories',
    '/categories/*',
    '/flash-sales',
    '/login',
    '/register',
    '/forgot-password',
  ],
};

export const isRouteAllowed = (route, userRole, isAuthenticated) => {
  // Check if route is public
  if (
    PROTECTED_ROUTES.PUBLIC.some(
      publicRoute =>
        route === publicRoute ||
        (publicRoute.endsWith('/*') && route.startsWith(publicRoute.slice(0, -2)))
    )
  ) {
    return true;
  }

  // Check if user is authenticated for protected routes
  if (!isAuthenticated) {
    return false;
  }

  // Check admin-only routes
  if (
    PROTECTED_ROUTES.ADMIN_ONLY.some(
      adminRoute =>
        route === adminRoute ||
        (adminRoute.endsWith('/*') && route.startsWith(adminRoute.slice(0, -2)))
    )
  ) {
    return userRole === USER_ROLES.ADMIN;
  }

  // Check client-only routes
  if (
    PROTECTED_ROUTES.CLIENT_ONLY.some(
      clientRoute =>
        route === clientRoute ||
        (clientRoute.endsWith('/*') && route.startsWith(clientRoute.slice(0, -2)))
    )
  ) {
    return userRole === USER_ROLES.CLIENT;
  }

  // Check general authenticated routes
  if (
    PROTECTED_ROUTES.AUTHENTICATED.some(
      authRoute =>
        route === authRoute ||
        (authRoute.endsWith('/*') && route.startsWith(authRoute.slice(0, -2)))
    )
  ) {
    return true; // Any authenticated user
  }

  return false;
};

// =============================================================================
// PERMISSION GROUPS
// =============================================================================

export const PERMISSION_GROUPS = {
  SUPER_ADMIN: [
    ...ROLE_PERMISSIONS[USER_ROLES.ADMIN],
    PERMISSIONS.SYSTEM_ADMIN,
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.SYSTEM_LOGS,
    PERMISSIONS.SYSTEM_BACKUP,
  ],

  CONTENT_MANAGER: [
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_EDIT,
    PERMISSIONS.CATEGORY_VIEW,
    PERMISSIONS.CATEGORY_CREATE,
    PERMISSIONS.CATEGORY_EDIT,
    PERMISSIONS.HOMEPAGE_MANAGE,
    PERMISSIONS.BANNER_MANAGE,
    PERMISSIONS.CONTENT_MANAGE,
  ],

  ORDER_MANAGER: [
    PERMISSIONS.ORDER_VIEW_ALL,
    PERMISSIONS.ORDER_UPDATE_STATUS,
    PERMISSIONS.ORDER_MANAGE_COD,
    PERMISSIONS.PAYMENT_VIEW_ALL,
    PERMISSIONS.PAYMENT_MANAGE_COD,
    PERMISSIONS.NOTIFICATION_SEND,
  ],

  SALES_MANAGER: [
    PERMISSIONS.FLASH_SALE_VIEW,
    PERMISSIONS.FLASH_SALE_CREATE,
    PERMISSIONS.FLASH_SALE_EDIT,
    PERMISSIONS.FLASH_SALE_MANAGE_PRODUCTS,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,
  ],
};

// =============================================================================
// ROLE DISPLAY HELPERS
// =============================================================================

export const getRoleDisplayName = role => {
  const roleChoice = USER_ROLE_CHOICES.find(choice => choice.value === role);
  return roleChoice ? roleChoice.label : 'Unknown Role';
};

export const getRoleBadgeColor = role => {
  switch (role) {
    case USER_ROLES.ADMIN:
      return 'blue'; // Matches the blue theme
    case USER_ROLES.CLIENT:
      return 'green';
    default:
      return 'gray';
  }
};

export const getRoleIcon = role => {
  switch (role) {
    case USER_ROLES.ADMIN:
      return 'shield-check';
    case USER_ROLES.CLIENT:
      return 'user';
    default:
      return 'help-circle';
  }
};

// =============================================================================
// NAVIGATION PERMISSIONS
// =============================================================================

export const NAVIGATION_PERMISSIONS = {
  // Admin navigation items
  ADMIN_DASHBOARD: [PERMISSIONS.ANALYTICS_VIEW],
  PRODUCT_MANAGEMENT: [PERMISSIONS.PRODUCT_VIEW],
  CATEGORY_MANAGEMENT: [PERMISSIONS.CATEGORY_VIEW],
  ORDER_MANAGEMENT: [PERMISSIONS.ORDER_VIEW_ALL],
  PAYMENT_MANAGEMENT: [PERMISSIONS.PAYMENT_VIEW_ALL],
  FLASH_SALES_MANAGEMENT: [PERMISSIONS.FLASH_SALE_VIEW],
  USER_MANAGEMENT: [PERMISSIONS.USER_VIEW_ALL],
  HOMEPAGE_MANAGEMENT: [PERMISSIONS.HOMEPAGE_MANAGE],
  ANALYTICS: [PERMISSIONS.ANALYTICS_VIEW],
  NOTIFICATIONS: [PERMISSIONS.NOTIFICATION_MANAGE],
  SYSTEM_SETTINGS: [PERMISSIONS.SYSTEM_SETTINGS],

  // Client navigation items
  SHOPPING: [], // Public access
  PROFILE: [PERMISSIONS.USER_VIEW_OWN],
  ORDER_HISTORY: [PERMISSIONS.ORDER_VIEW_OWN],
  NOTIFICATIONS_CLIENT: [], // All authenticated users
};

// =============================================================================
// FEATURE FLAGS BASED ON ROLES
// =============================================================================

export const FEATURE_FLAGS = {
  // Admin features
  BULK_PRODUCT_ACTIONS: [USER_ROLES.ADMIN],
  ADVANCED_ANALYTICS: [USER_ROLES.ADMIN],
  SYSTEM_LOGS: [USER_ROLES.ADMIN],
  ADMIN_INVITATIONS: [USER_ROLES.ADMIN],
  COD_MANAGEMENT: [USER_ROLES.ADMIN],
  PAYMENT_WEBHOOKS: [USER_ROLES.ADMIN],
  FLASH_SALE_CREATION: [USER_ROLES.ADMIN],
  HOMEPAGE_EDITING: [USER_ROLES.ADMIN],

  // Client features
  SHOPPING_CART: [USER_ROLES.CLIENT],
  ORDER_PLACEMENT: [USER_ROLES.CLIENT],
  PAYMENT_PROCESSING: [USER_ROLES.CLIENT],
  PROFILE_MANAGEMENT: [USER_ROLES.CLIENT],
  ORDER_TRACKING: [USER_ROLES.CLIENT],

  // Shared features
  PRODUCT_BROWSING: [USER_ROLES.ADMIN, USER_ROLES.CLIENT],
  FLASH_SALE_VIEWING: [USER_ROLES.ADMIN, USER_ROLES.CLIENT],
  NOTIFICATIONS: [USER_ROLES.ADMIN, USER_ROLES.CLIENT],
};

export const isFeatureEnabled = (feature, userRole) => {
  const enabledRoles = FEATURE_FLAGS[feature] || [];
  return enabledRoles.includes(userRole);
};

// =============================================================================
// ROLE TRANSITIONS AND UPGRADES
// =============================================================================

export const ROLE_TRANSITIONS = {
  [USER_ROLES.CLIENT]: [], // Clients cannot self-upgrade
  [USER_ROLES.ADMIN]: [], // Admins cannot downgrade themselves
};

export const canTransitionToRole = (currentRole, targetRole) => {
  const allowedTransitions = ROLE_TRANSITIONS[currentRole] || [];
  return allowedTransitions.includes(targetRole);
};

// =============================================================================
// DEFAULT PERMISSIONS FOR NEW USERS
// =============================================================================

export const DEFAULT_USER_PERMISSIONS = {
  [USER_ROLES.ADMIN]: ROLE_PERMISSIONS[USER_ROLES.ADMIN],
  [USER_ROLES.CLIENT]: ROLE_PERMISSIONS[USER_ROLES.CLIENT],
};

// =============================================================================
// ROLE-BASED UI CONFIGURATIONS
// =============================================================================

export const UI_CONFIGURATIONS = {
  [USER_ROLES.ADMIN]: {
    theme: 'admin-blue',
    sidebar: 'expanded',
    dashboard: 'advanced',
    notifications: 'all',
    defaultRoute: '/admin/dashboard',
  },

  [USER_ROLES.CLIENT]: {
    theme: 'client-blue',
    sidebar: 'minimal',
    dashboard: 'basic',
    notifications: 'orders-only',
    defaultRoute: '/',
  },
};

export const getUIConfig = userRole => {
  return UI_CONFIGURATIONS[userRole] || UI_CONFIGURATIONS[USER_ROLES.CLIENT];
};

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  USER_ROLES,
  USER_ROLE_CHOICES,
  EMAIL_DOMAINS,
  ALLOWED_EMAIL_DOMAINS,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  PERMISSION_GROUPS,
  NAVIGATION_PERMISSIONS,
  FEATURE_FLAGS,
  ROLE_TRANSITIONS,
  DEFAULT_USER_PERMISSIONS,
  UI_CONFIGURATIONS,

  // Helper functions
  checkPermission,
  checkMultiplePermissions,
  getUserPermissions,
  isValidRole,
  isAdmin,
  isClient,
  validateEmailForRole,
  getRoleFromEmail,
  getRoleDisplayName,
  getRoleBadgeColor,
  getRoleIcon,
  isRouteAllowed,
  isFeatureEnabled,
  canTransitionToRole,
  getUIConfig,
};
