// src/services/auth/roleService.js
import { authService } from './authService';

/**
 * Role Service for handling role-based access control
 * Manages user permissions and access restrictions
 */
class RoleService {
  constructor() {
    this.roles = {
      ADMIN: 'admin',
      CLIENT: 'client',
    };

    // Define permissions for each role
    this.rolePermissions = {
      admin: [
        // Product management
        'products.create',
        'products.edit',
        'products.delete',
        'products.view',
        'products.bulk_actions',

        // Category management
        'categories.create',
        'categories.edit',
        'categories.delete',
        'categories.view',

        // Order management
        'orders.view_all',
        'orders.update_status',
        'orders.cancel',
        'orders.manage_cod',
        'orders.view_details',

        // User management
        'users.view_all',
        'users.create_admin',
        'users.send_invitations',
        'users.manage_roles',

        // Payment management
        'payments.view_all',
        'payments.update_status',
        'payments.manage_cod',
        'payments.view_analytics',
        'payments.retry_failed',

        // Flash sales management
        'flash_sales.create',
        'flash_sales.edit',
        'flash_sales.delete',
        'flash_sales.manage_products',

        // Homepage management
        'homepage.edit_content',
        'homepage.manage_banners',
        'homepage.manage_featured',

        // Analytics and reports
        'analytics.view',
        'analytics.export',
        'reports.generate',

        // System administration
        'admin.access_dashboard',
        'admin.manage_settings',
        'admin.view_logs',

        // Notifications
        'notifications.send_bulk',
        'notifications.manage_settings',

        // General permissions
        'profile.edit',
        'profile.view',
      ],

      client: [
        // Shopping permissions
        'products.view',
        'categories.view',
        'flash_sales.view',

        // Cart and wishlist
        'cart.add_items',
        'cart.remove_items',
        'cart.update_quantities',
        'wishlist.add_items',
        'wishlist.remove_items',

        // Order permissions
        'orders.create',
        'orders.view_own',
        'orders.cancel_own',

        // Payment permissions
        'payments.make_payment',
        'payments.view_own',
        'payments.cancel_own',

        // Profile permissions
        'profile.edit',
        'profile.view',

        // Notifications
        'notifications.view_own',
        'notifications.mark_read',
      ],
    };

    // Define protected routes for each role
    this.protectedRoutes = {
      admin: [
        '/admin',
        '/admin/*',
        '/dashboard',
        '/products/manage',
        '/categories/manage',
        '/orders/manage',
        '/users/manage',
        '/flash-sales/manage',
        '/homepage/manage',
        '/analytics',
        '/settings',
      ],

      client: ['/profile', '/orders', '/wishlist', '/checkout'],

      // Routes accessible to both roles
      both: ['/products', '/categories', '/flash-sales', '/search', '/'],
    };

    // Define admin-only features
    this.adminFeatures = [
      'admin-dashboard',
      'product-management',
      'category-management',
      'order-management',
      'user-management',
      'flash-sales-management',
      'homepage-management',
      'analytics',
      'payment-management',
      'system-settings',
      'bulk-operations',
      'admin-invitations',
      'cod-management',
    ];
  }

  /**
   * Get current user's role
   * @returns {string|null} User role or null
   */
  getCurrentUserRole() {
    const user = authService.getCurrentUserFromStorage();
    return user?.role || null;
  }

  /**
   * Check if current user is admin
   * @returns {boolean} True if user is admin
   */
  isAdmin() {
    const role = this.getCurrentUserRole();
    return role === this.roles.ADMIN || authService.isAdmin();
  }

  /**
   * Check if current user is client
   * @returns {boolean} True if user is client
   */
  isClient() {
    const role = this.getCurrentUserRole();
    return role === this.roles.CLIENT;
  }

  /**
   * Check if user has specific permission
   * @param {string} permission - Permission to check
   * @returns {boolean} True if user has permission
   */
  hasPermission(permission) {
    const role = this.getCurrentUserRole();
    if (!role) return false;

    const permissions = this.rolePermissions[role] || [];
    return permissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   * @param {Array<string>} permissions - Array of permissions to check
   * @returns {boolean} True if user has at least one permission
   */
  hasAnyPermission(permissions) {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Check if user has all specified permissions
   * @param {Array<string>} permissions - Array of permissions to check
   * @returns {boolean} True if user has all permissions
   */
  hasAllPermissions(permissions) {
    return permissions.every(permission => this.hasPermission(permission));
  }

  /**
   * Get all permissions for current user
   * @returns {Array<string>} Array of user permissions
   */
  getUserPermissions() {
    const role = this.getCurrentUserRole();
    return this.rolePermissions[role] || [];
  }

  /**
   * Check if route is accessible to current user
   * @param {string} path - Route path to check
   * @returns {boolean} True if route is accessible
   */
  canAccessRoute(path) {
    const role = this.getCurrentUserRole();
    if (!role) return false;

    // Check if route is in both accessible routes
    if (this.isRouteInList(path, this.protectedRoutes.both)) {
      return true;
    }

    // Check role-specific routes
    const roleRoutes = this.protectedRoutes[role] || [];
    return this.isRouteInList(path, roleRoutes);
  }

  /**
   * Check if path matches any route in the list (supports wildcards)
   * @param {string} path - Path to check
   * @param {Array<string>} routes - Array of route patterns
   * @returns {boolean} True if path matches any route
   */
  isRouteInList(path, routes) {
    return routes.some(route => {
      if (route.endsWith('/*')) {
        const basePath = route.slice(0, -2);
        return path.startsWith(basePath);
      }
      return path === route || path.startsWith(`${route}/`);
    });
  }

  /**
   * Check if user can access admin features
   * @returns {boolean} True if user can access admin features
   */
  canAccessAdminPanel() {
    return this.isAdmin() && this.hasPermission('admin.access_dashboard');
  }

  /**
   * Check if user can access specific admin feature
   * @param {string} feature - Feature name to check
   * @returns {boolean} True if user can access feature
   */
  canAccessAdminFeature(feature) {
    return this.isAdmin() && this.adminFeatures.includes(feature);
  }

  /**
   * Get available features for current user
   * @returns {Array<string>} Array of available features
   */
  getAvailableFeatures() {
    if (this.isAdmin()) {
      return [...this.adminFeatures];
    }

    return [
      'product-browsing',
      'shopping-cart',
      'wishlist',
      'order-placement',
      'payment-processing',
      'profile-management',
    ];
  }

  /**
   * Check if user can perform action on resource
   * @param {string} action - Action to perform (create, edit, delete, view)
   * @param {string} resource - Resource type
   * @param {Object} resourceData - Resource data (optional)
   * @returns {boolean} True if action is allowed
   */
  canPerformAction(action, resource, resourceData = null) {
    const permission = `${resource}.${action}`;

    // Check basic permission
    if (!this.hasPermission(permission)) {
      return false;
    }

    // Additional checks for specific resources
    if (resource === 'orders' && resourceData) {
      // Clients can only manage their own orders
      if (this.isClient() && action !== 'create') {
        const user = authService.getCurrentUserFromStorage();
        return resourceData.user_id === user?.id;
      }
    }

    if (resource === 'payments' && resourceData) {
      // Clients can only manage their own payments
      if (this.isClient()) {
        const user = authService.getCurrentUserFromStorage();
        return resourceData.user_id === user?.id;
      }
    }

    return true;
  }

  /**
   * Get navigation menu items based on user role
   * @returns {Array<Object>} Array of menu items
   */
  getNavigationMenu() {
    const baseMenu = [
      { path: '/', label: 'Home', icon: 'home' },
      { path: '/products', label: 'Products', icon: 'grid' },
      { path: '/categories', label: 'Categories', icon: 'folder' },
      { path: '/flash-sales', label: 'Flash Sales', icon: 'zap' },
    ];

    if (this.isClient()) {
      return [
        ...baseMenu,
        { path: '/cart', label: 'Cart', icon: 'shopping-cart' },
        { path: '/wishlist', label: 'Wishlist', icon: 'heart' },
        { path: '/orders', label: 'My Orders', icon: 'package' },
        { path: '/profile', label: 'Profile', icon: 'user' },
      ];
    }

    if (this.isAdmin()) {
      return [
        ...baseMenu,
        { path: '/admin', label: 'Dashboard', icon: 'bar-chart' },
        { path: '/admin/products', label: 'Manage Products', icon: 'grid' },
        { path: '/admin/categories', label: 'Manage Categories', icon: 'folder' },
        { path: '/admin/orders', label: 'Manage Orders', icon: 'package' },
        { path: '/admin/users', label: 'Manage Users', icon: 'users' },
        { path: '/admin/flash-sales', label: 'Manage Flash Sales', icon: 'zap' },
        { path: '/admin/homepage', label: 'Manage Homepage', icon: 'home' },
        { path: '/admin/analytics', label: 'Analytics', icon: 'trending-up' },
        { path: '/profile', label: 'Profile', icon: 'user' },
      ];
    }

    return baseMenu;
  }

  /**
   * Check if current user can view specific order
   * @param {Object} order - Order object
   * @returns {boolean} True if user can view order
   */
  canViewOrder(order) {
    if (this.isAdmin()) return true;

    if (this.isClient()) {
      const user = authService.getCurrentUserFromStorage();
      return order.user_id === user?.id;
    }

    return false;
  }

  /**
   * Check if current user can manage specific payment
   * @param {Object} payment - Payment object
   * @returns {boolean} True if user can manage payment
   */
  canManagePayment(payment) {
    if (this.isAdmin()) return true;

    if (this.isClient()) {
      const user = authService.getCurrentUserFromStorage();
      return payment.user_id === user?.id;
    }

    return false;
  }

  /**
   * Get role display name
   * @param {string} role - Role code
   * @returns {string} Human readable role name
   */
  getRoleDisplayName(role) {
    const roleNames = {
      admin: 'Administrator',
      client: 'Client',
    };

    return roleNames[role] || role;
  }

  /**
   * Check if user should see price management features
   * @returns {boolean} True if user should see price features
   */
  canManagePrices() {
    return this.isAdmin() && this.hasPermission('products.edit');
  }

  /**
   * Check if user can access bulk operations
   * @returns {boolean} True if user can access bulk operations
   */
  canUseBulkOperations() {
    return this.isAdmin() && this.hasPermission('products.bulk_actions');
  }

  /**
   * Check if user can send admin invitations
   * @returns {boolean} True if user can send invitations
   */
  canSendInvitations() {
    return this.isAdmin() && this.hasPermission('users.send_invitations');
  }

  /**
   * Check if user can access analytics
   * @returns {boolean} True if user can access analytics
   */
  canViewAnalytics() {
    return this.isAdmin() && this.hasPermission('analytics.view');
  }

  /**
   * Check if user can manage COD payments
   * @returns {boolean} True if user can manage COD payments
   */
  canManageCOD() {
    return this.isAdmin() && this.hasPermission('payments.manage_cod');
  }

  /**
   * Validate role assignment
   * @param {string} email - User email
   * @param {string} role - Role to assign
   * @returns {Object} Validation result
   */
  validateRoleAssignment(email, role) {
    const validation = {
      valid: false,
      error: null,
    };

    if (!email || !role) {
      validation.error = 'Email and role are required';
      return validation;
    }

    // Admin role validation
    if (role === this.roles.ADMIN) {
      if (!email.endsWith('@shoponline.com')) {
        validation.error = 'Admin role requires @shoponline.com email domain';
        return validation;
      }
    }

    // Client role validation
    if (role === this.roles.CLIENT) {
      if (!email.endsWith('@gmail.com')) {
        validation.error = 'Client role requires @gmail.com email domain';
        return validation;
      }
    }

    validation.valid = true;
    return validation;
  }

  /**
   * Get permission groups for role management
   * @returns {Object} Permission groups
   */
  getPermissionGroups() {
    return {
      'Product Management': [
        'products.create',
        'products.edit',
        'products.delete',
        'products.view',
        'products.bulk_actions',
      ],
      'Category Management': [
        'categories.create',
        'categories.edit',
        'categories.delete',
        'categories.view',
      ],
      'Order Management': [
        'orders.view_all',
        'orders.update_status',
        'orders.cancel',
        'orders.manage_cod',
      ],
      'User Management': [
        'users.view_all',
        'users.create_admin',
        'users.send_invitations',
        'users.manage_roles',
      ],
      'Payment Management': [
        'payments.view_all',
        'payments.update_status',
        'payments.manage_cod',
        'payments.retry_failed',
      ],
      'System Administration': [
        'admin.access_dashboard',
        'admin.manage_settings',
        'analytics.view',
        'reports.generate',
      ],
    };
  }
}

// Create and export singleton instance
const roleService = new RoleService();
export { roleService };
