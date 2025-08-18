// src/hooks/usePermissions.js
import { useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';

/**
 * Custom hook for permission checking and role-based access control
 */
export const usePermissions = () => {
  const { user, role, isAuthenticated, isAdmin, isClient } = useAuth();

  // Permission constants based on backend logic
  const PERMISSIONS = {
    // Product permissions
    VIEW_PRODUCTS: 'view_products',
    MANAGE_PRODUCTS: 'manage_products',
    CREATE_PRODUCTS: 'create_products',
    EDIT_PRODUCTS: 'edit_products',
    DELETE_PRODUCTS: 'delete_products',

    // Category permissions
    VIEW_CATEGORIES: 'view_categories',
    MANAGE_CATEGORIES: 'manage_categories',

    // Order permissions
    VIEW_ORDERS: 'view_orders',
    VIEW_ALL_ORDERS: 'view_all_orders',
    MANAGE_ORDERS: 'manage_orders',
    CREATE_ORDERS: 'create_orders',
    CANCEL_ORDERS: 'cancel_orders',

    // Flash sale permissions
    VIEW_FLASH_SALES: 'view_flash_sales',
    MANAGE_FLASH_SALES: 'manage_flash_sales',
    CREATE_FLASH_SALES: 'create_flash_sales',

    // Payment permissions
    MAKE_PAYMENTS: 'make_payments',
    VIEW_PAYMENTS: 'view_payments',
    VIEW_ALL_PAYMENTS: 'view_all_payments',

    // Admin permissions
    ACCESS_ADMIN_DASHBOARD: 'access_admin_dashboard',
    MANAGE_USERS: 'manage_users',
    SEND_INVITATIONS: 'send_invitations',
    MANAGE_HOMEPAGE: 'manage_homepage',
    MANAGE_SITE_SETTINGS: 'manage_site_settings',
    VIEW_ANALYTICS: 'view_analytics',

    // Notification permissions
    MANAGE_NOTIFICATIONS: 'manage_notifications',
    BROADCAST_NOTIFICATIONS: 'broadcast_notifications',

    // COD permissions
    VERIFY_COD_ORDERS: 'verify_cod_orders',
    MANAGE_COD_ORDERS: 'manage_cod_orders',
  };

  // Role-based permission mapping
  const ROLE_PERMISSIONS = useMemo(
    () => ({
      admin: [
        // Admins can do everything
        ...Object.values(PERMISSIONS),
      ],
      client: [
        // Clients can view and interact with products/orders
        PERMISSIONS.VIEW_PRODUCTS,
        PERMISSIONS.VIEW_CATEGORIES,
        PERMISSIONS.VIEW_FLASH_SALES,
        PERMISSIONS.VIEW_ORDERS,
        PERMISSIONS.CREATE_ORDERS,
        PERMISSIONS.CANCEL_ORDERS,
        PERMISSIONS.MAKE_PAYMENTS,
        PERMISSIONS.VIEW_PAYMENTS,
      ],
    }),
    [PERMISSIONS]
  );

  // Check if user has specific permission
  const hasPermission = useCallback(
    permission => {
      if (!isAuthenticated || !role) {
        return false;
      }

      // Super admin check (if needed)
      if (user?.is_superuser) {
        return true;
      }

      // Role-based permission check
      const rolePermissions = ROLE_PERMISSIONS[role] || [];
      return rolePermissions.includes(permission);
    },
    [isAuthenticated, role, user, ROLE_PERMISSIONS]
  );

  // Check multiple permissions (ALL must be true)
  const hasAllPermissions = useCallback(
    permissions => {
      return permissions.every(permission => hasPermission(permission));
    },
    [hasPermission]
  );

  // Check multiple permissions (ANY can be true)
  const hasAnyPermission = useCallback(
    permissions => {
      return permissions.some(permission => hasPermission(permission));
    },
    [hasPermission]
  );

  // Check if user can access admin features
  const canAccessAdmin = useCallback(() => {
    return hasPermission(PERMISSIONS.ACCESS_ADMIN_DASHBOARD);
  }, [hasPermission, PERMISSIONS.ACCESS_ADMIN_DASHBOARD]);

  // Check if user can manage products
  const canManageProducts = useCallback(() => {
    return hasPermission(PERMISSIONS.MANAGE_PRODUCTS);
  }, [hasPermission, PERMISSIONS.MANAGE_PRODUCTS]);

  // Check if user can manage orders
  const canManageOrders = useCallback(() => {
    return hasPermission(PERMISSIONS.MANAGE_ORDERS);
  }, [hasPermission, PERMISSIONS.MANAGE_ORDERS]);

  // Check if user can view all orders (admin) or only their orders (client)
  const canViewAllOrders = useCallback(() => {
    return hasPermission(PERMISSIONS.VIEW_ALL_ORDERS);
  }, [hasPermission, PERMISSIONS.VIEW_ALL_ORDERS]);

  // Check if user can manage flash sales
  const canManageFlashSales = useCallback(() => {
    return hasPermission(PERMISSIONS.MANAGE_FLASH_SALES);
  }, [hasPermission, PERMISSIONS.MANAGE_FLASH_SALES]);

  // Check if user can verify COD orders
  const canVerifyCOD = useCallback(() => {
    return hasPermission(PERMISSIONS.VERIFY_COD_ORDERS);
  }, [hasPermission, PERMISSIONS.VERIFY_COD_ORDERS]);

  // Check if user can send admin invitations
  const canSendInvitations = useCallback(() => {
    return hasPermission(PERMISSIONS.SEND_INVITATIONS);
  }, [hasPermission, PERMISSIONS.SEND_INVITATIONS]);

  // Check if user can access analytics
  const canViewAnalytics = useCallback(() => {
    return hasPermission(PERMISSIONS.VIEW_ANALYTICS);
  }, [hasPermission, PERMISSIONS.VIEW_ANALYTICS]);

  // Check resource ownership
  const isOwner = useCallback(
    resource => {
      if (!user || !resource) return false;

      // Check various ownership patterns
      if (resource.user_id === user.id) return true;
      if (resource.created_by === user.id) return true;
      if (resource.owner === user.id) return true;
      if (resource.user === user.id) return true;

      return false;
    },
    [user]
  );

  // Check if user can access resource (owner or admin)
  const canAccessResource = useCallback(
    (resource, requiredPermission = null) => {
      if (!isAuthenticated) return false;

      // Admins can access everything
      if (isAdmin()) return true;

      // Check specific permission if provided
      if (requiredPermission && !hasPermission(requiredPermission)) {
        return false;
      }

      // Check ownership
      return isOwner(resource);
    },
    [isAuthenticated, isAdmin, hasPermission, isOwner]
  );

  // Check if user can edit resource
  const canEditResource = useCallback(
    (resource, editPermission = null) => {
      if (!isAuthenticated) return false;

      // Admins can edit everything
      if (isAdmin()) return true;

      // Check specific edit permission
      if (editPermission && !hasPermission(editPermission)) {
        return false;
      }

      // Users can edit their own resources
      return isOwner(resource);
    },
    [isAuthenticated, isAdmin, hasPermission, isOwner]
  );

  // Get user's effective permissions list
  const getUserPermissions = useCallback(() => {
    if (!isAuthenticated || !role) {
      return [];
    }

    return ROLE_PERMISSIONS[role] || [];
  }, [isAuthenticated, role, ROLE_PERMISSIONS]);

  // Permission-based component wrapper
  const PermissionWrapper = useCallback(
    ({ permission, permissions, requireAll = false, fallback = null, children }) => {
      let hasAccess = false;

      if (permission) {
        hasAccess = hasPermission(permission);
      } else if (permissions) {
        hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
      }

      return hasAccess ? children : fallback;
    },
    [hasPermission, hasAllPermissions, hasAnyPermission]
  );

  // Get permission status for UI elements
  const getPermissionStatus = useCallback(
    permission => {
      return {
        allowed: hasPermission(permission),
        denied: !hasPermission(permission),
        reason: hasPermission(permission) ? null : 'Insufficient permissions',
      };
    },
    [hasPermission]
  );

  // Check domain-specific permissions
  const domainPermissions = useMemo(
    () => ({
      // Product domain
      products: {
        canView: hasPermission(PERMISSIONS.VIEW_PRODUCTS),
        canCreate: hasPermission(PERMISSIONS.CREATE_PRODUCTS),
        canEdit: hasPermission(PERMISSIONS.EDIT_PRODUCTS),
        canDelete: hasPermission(PERMISSIONS.DELETE_PRODUCTS),
        canManage: hasPermission(PERMISSIONS.MANAGE_PRODUCTS),
      },

      // Order domain
      orders: {
        canView: hasPermission(PERMISSIONS.VIEW_ORDERS),
        canViewAll: hasPermission(PERMISSIONS.VIEW_ALL_ORDERS),
        canCreate: hasPermission(PERMISSIONS.CREATE_ORDERS),
        canManage: hasPermission(PERMISSIONS.MANAGE_ORDERS),
        canCancel: hasPermission(PERMISSIONS.CANCEL_ORDERS),
        canVerifyCOD: hasPermission(PERMISSIONS.VERIFY_COD_ORDERS),
      },

      // Flash sales domain
      flashSales: {
        canView: hasPermission(PERMISSIONS.VIEW_FLASH_SALES),
        canCreate: hasPermission(PERMISSIONS.CREATE_FLASH_SALES),
        canManage: hasPermission(PERMISSIONS.MANAGE_FLASH_SALES),
      },

      // Admin domain
      admin: {
        canAccessDashboard: hasPermission(PERMISSIONS.ACCESS_ADMIN_DASHBOARD),
        canManageUsers: hasPermission(PERMISSIONS.MANAGE_USERS),
        canSendInvitations: hasPermission(PERMISSIONS.SEND_INVITATIONS),
        canManageHomepage: hasPermission(PERMISSIONS.MANAGE_HOMEPAGE),
        canManageSettings: hasPermission(PERMISSIONS.MANAGE_SITE_SETTINGS),
        canViewAnalytics: hasPermission(PERMISSIONS.VIEW_ANALYTICS),
        canManageNotifications: hasPermission(PERMISSIONS.MANAGE_NOTIFICATIONS),
      },
    }),
    [hasPermission, PERMISSIONS]
  );

  return {
    // Permission constants
    PERMISSIONS,

    // Core permission methods
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,

    // Role checks
    isAdmin,
    isClient,
    canAccessAdmin,

    // Resource access
    isOwner,
    canAccessResource,
    canEditResource,

    // Specific domain permissions
    canManageProducts,
    canManageOrders,
    canViewAllOrders,
    canManageFlashSales,
    canVerifyCOD,
    canSendInvitations,
    canViewAnalytics,

    // Domain permission objects
    domainPermissions,

    // Utilities
    getUserPermissions,
    getPermissionStatus,
    PermissionWrapper,
  };
};

/**
 * Hook for route-level permissions
 */
export const useRoutePermissions = () => {
  const { hasPermission, isAdmin, isClient, isAuthenticated } = usePermissions();

  // Define route permissions
  const routePermissions = useMemo(
    () => ({
      // Public routes (no auth required)
      '/': true,
      '/products': true,
      '/categories': true,
      '/flash-sales': true,
      '/product/:id': true,
      '/category/:id': true,

      // Client routes (require client login)
      '/cart': isAuthenticated,
      '/checkout': isAuthenticated,
      '/profile': isAuthenticated,
      '/orders': isAuthenticated,
      '/orders/:id': isAuthenticated,

      // Admin routes (require admin login)
      '/admin': isAdmin(),
      '/admin/dashboard': isAdmin(),
      '/admin/products': hasPermission('manage_products'),
      '/admin/orders': hasPermission('manage_orders'),
      '/admin/flash-sales': hasPermission('manage_flash_sales'),
      '/admin/users': hasPermission('manage_users'),
      '/admin/invitations': hasPermission('send_invitations'),
      '/admin/analytics': hasPermission('view_analytics'),
      '/admin/homepage': hasPermission('manage_homepage'),
      '/admin/settings': hasPermission('manage_site_settings'),

      // Auth routes (available when not authenticated)
      '/login': !isAuthenticated,
      '/register': !isAuthenticated,
      '/admin/register': !isAuthenticated,
    }),
    [hasPermission, isAdmin, isClient, isAuthenticated]
  );

  // Check if user can access specific route
  const canAccessRoute = useCallback(
    route => {
      // Handle parameterized routes
      const normalizedRoute = route.replace(/\/[^/]+/g, '/:id');
      return routePermissions[normalizedRoute] ?? false;
    },
    [routePermissions]
  );

  // Get redirect path based on user role and intended route
  const getRedirectPath = useCallback(
    intendedRoute => {
      if (!isAuthenticated) {
        return '/login';
      }

      if (isAdmin() && intendedRoute.startsWith('/admin')) {
        return '/admin/dashboard';
      }

      if (isClient()) {
        return '/';
      }

      return '/';
    },
    [isAuthenticated, isAdmin, isClient]
  );

  return {
    canAccessRoute,
    getRedirectPath,
    routePermissions,
  };
};

/**
 * Hook for component-level permission rendering
 */
export const useConditionalRender = () => {
  const { hasPermission, isAdmin, isClient, isAuthenticated } = usePermissions();

  // Render component based on permissions
  const renderIfPermitted = useCallback(
    (permission, component, fallback = null) => {
      return hasPermission(permission) ? component : fallback;
    },
    [hasPermission]
  );

  // Render component for admins only
  const renderForAdmin = useCallback(
    (component, fallback = null) => {
      return isAdmin() ? component : fallback;
    },
    [isAdmin]
  );

  // Render component for clients only
  const renderForClient = useCallback(
    (component, fallback = null) => {
      return isClient() ? component : fallback;
    },
    [isClient]
  );

  // Render component for authenticated users only
  const renderForAuthenticated = useCallback(
    (component, fallback = null) => {
      return isAuthenticated ? component : fallback;
    },
    [isAuthenticated]
  );

  // Render component for unauthenticated users only
  const renderForGuest = useCallback(
    (component, fallback = null) => {
      return !isAuthenticated ? component : fallback;
    },
    [isAuthenticated]
  );

  // Conditional class names based on permissions
  const getConditionalClasses = useCallback(
    (baseClasses, permissionClasses = {}) => {
      let classes = baseClasses;

      Object.entries(permissionClasses).forEach(([permission, className]) => {
        if (hasPermission(permission)) {
          classes += ` ${className}`;
        }
      });

      return classes;
    },
    [hasPermission]
  );

  return {
    renderIfPermitted,
    renderForAdmin,
    renderForClient,
    renderForAuthenticated,
    renderForGuest,
    getConditionalClasses,
  };
};

export default usePermissions;
