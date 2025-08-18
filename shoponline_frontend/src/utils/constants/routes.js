// Route constants for the Ugandan e-commerce platform
// Defines all route paths used throughout the application

// Public Routes
export const PUBLIC_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  CLIENT_REGISTER: '/register/client',
  ADMIN_REGISTER: '/register/admin/:token',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password/:token',
  ABOUT: '/about',
  CONTACT: '/contact',
  TERMS: '/terms',
  PRIVACY: '/privacy',
};

// Product Routes
export const PRODUCT_ROUTES = {
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:id',
  CATEGORY: '/category/:slug',
  SEARCH: '/search',
  SEARCH_RESULTS: '/search/results',
};

// Flash Sales Routes
export const FLASH_SALES_ROUTES = {
  FLASH_SALES: '/flash-sales',
  FLASH_SALE_DETAIL: '/flash-sales/:id',
  ACTIVE_FLASH_SALES: '/flash-sales/active',
};

// Shopping & Checkout Routes
export const SHOPPING_ROUTES = {
  CART: '/cart',
  WISHLIST: '/wishlist',
  CHECKOUT: '/checkout',
  ORDER_CONFIRMATION: '/order-confirmation/:orderId',
  PAYMENT_SUCCESS: '/payment/success',
  PAYMENT_FAILED: '/payment/failed',
  PAYMENT_PENDING: '/payment/pending',
};

// User Account Routes
export const USER_ROUTES = {
  PROFILE: '/profile',
  EDIT_PROFILE: '/profile/edit',
  ORDERS: '/orders',
  ORDER_DETAIL: '/orders/:id',
  ORDER_TRACKING: '/orders/:id/track',
  ADDRESSES: '/profile/addresses',
  PREFERENCES: '/profile/preferences',
};

// Admin Routes
export const ADMIN_ROUTES = {
  // Main Admin Routes
  ADMIN_ROOT: '/admin',
  ADMIN_LOGIN: '/admin/login',
  ADMIN_DASHBOARD: '/admin/dashboard',

  // Product Management
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_PRODUCTS_ADD: '/admin/products/add',
  ADMIN_PRODUCTS_EDIT: '/admin/products/:id/edit',
  ADMIN_PRODUCTS_BULK: '/admin/products/bulk',

  // Category Management
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_CATEGORIES_ADD: '/admin/categories/add',
  ADMIN_CATEGORIES_EDIT: '/admin/categories/:id/edit',

  // Flash Sales Management
  ADMIN_FLASH_SALES: '/admin/flash-sales',
  ADMIN_FLASH_SALES_ADD: '/admin/flash-sales/add',
  ADMIN_FLASH_SALES_EDIT: '/admin/flash-sales/:id/edit',
  ADMIN_FLASH_SALES_PRODUCTS: '/admin/flash-sales/:id/products',

  // Order Management
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_ORDERS_DETAIL: '/admin/orders/:id',
  ADMIN_COD_ORDERS: '/admin/orders/cod',
  ADMIN_ORDERS_ANALYTICS: '/admin/orders/analytics',

  // User Management
  ADMIN_USERS: '/admin/users',
  ADMIN_USERS_DETAIL: '/admin/users/:id',
  ADMIN_INVITATIONS: '/admin/invitations',
  ADMIN_INVITATIONS_SEND: '/admin/invitations/send',
  ADMIN_INVITATIONS_MANAGE: '/admin/invitations/manage',

  // Homepage Management
  ADMIN_HOMEPAGE: '/admin/homepage',
  ADMIN_BANNERS: '/admin/homepage/banners',
  ADMIN_FEATURED_PRODUCTS: '/admin/homepage/featured',
  ADMIN_CONTENT_EDITOR: '/admin/homepage/content',

  // Analytics & Reports
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_SALES_ANALYTICS: '/admin/analytics/sales',
  ADMIN_PRODUCT_ANALYTICS: '/admin/analytics/products',
  ADMIN_USER_ANALYTICS: '/admin/analytics/users',
  ADMIN_FLASH_SALES_ANALYTICS: '/admin/analytics/flash-sales',

  // Settings & Configuration
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_PAYMENTS: '/admin/settings/payments',
  ADMIN_NOTIFICATIONS: '/admin/notifications',
  ADMIN_PROFILE: '/admin/profile',
};

// Error Routes
export const ERROR_ROUTES = {
  NOT_FOUND: '/404',
  SERVER_ERROR: '/500',
  UNAUTHORIZED: '/401',
  FORBIDDEN: '/403',
  MAINTENANCE: '/maintenance',
};

// API-related route helpers
export const API_ROUTE_HELPERS = {
  // Build dynamic routes
  buildProductRoute: id => PRODUCT_ROUTES.PRODUCT_DETAIL.replace(':id', id),
  buildCategoryRoute: slug => PRODUCT_ROUTES.CATEGORY.replace(':slug', slug),
  buildOrderRoute: id => USER_ROUTES.ORDER_DETAIL.replace(':id', id),
  buildOrderTrackingRoute: id => USER_ROUTES.ORDER_TRACKING.replace(':id', id),
  buildOrderConfirmationRoute: orderId =>
    SHOPPING_ROUTES.ORDER_CONFIRMATION.replace(':orderId', orderId),

  // Admin route builders
  buildAdminProductEditRoute: id => ADMIN_ROUTES.ADMIN_PRODUCTS_EDIT.replace(':id', id),
  buildAdminCategoryEditRoute: id => ADMIN_ROUTES.ADMIN_CATEGORIES_EDIT.replace(':id', id),
  buildAdminFlashSaleEditRoute: id => ADMIN_ROUTES.ADMIN_FLASH_SALES_EDIT.replace(':id', id),
  buildAdminFlashSaleProductsRoute: id =>
    ADMIN_ROUTES.ADMIN_FLASH_SALES_PRODUCTS.replace(':id', id),
  buildAdminOrderDetailRoute: id => ADMIN_ROUTES.ADMIN_ORDERS_DETAIL.replace(':id', id),
  buildAdminUserDetailRoute: id => ADMIN_ROUTES.ADMIN_USERS_DETAIL.replace(':id', id),
  buildAdminRegisterRoute: token => PUBLIC_ROUTES.ADMIN_REGISTER.replace(':token', token),
  buildResetPasswordRoute: token => PUBLIC_ROUTES.RESET_PASSWORD.replace(':token', token),
};

// Navigation helpers
export const NAVIGATION_HELPERS = {
  // Check if route requires authentication
  isAuthRequired: route => {
    const authRoutes = [
      ...Object.values(USER_ROUTES),
      ...Object.values(SHOPPING_ROUTES).filter(
        r =>
          ![
            SHOPPING_ROUTES.CART,
            SHOPPING_ROUTES.PAYMENT_SUCCESS,
            SHOPPING_ROUTES.PAYMENT_FAILED,
            SHOPPING_ROUTES.PAYMENT_PENDING,
          ].includes(r)
      ),
    ];
    return authRoutes.some(authRoute =>
      route.match(new RegExp(authRoute.replace(/:[^/]+/g, '[^/]+')))
    );
  },

  // Check if route requires admin authentication
  isAdminRequired: route => {
    return route.startsWith('/admin') && route !== ADMIN_ROUTES.ADMIN_LOGIN;
  },

  // Check if route is public
  isPublicRoute: route => {
    const publicRoutes = [
      ...Object.values(PUBLIC_ROUTES),
      ...Object.values(PRODUCT_ROUTES),
      ...Object.values(FLASH_SALES_ROUTES),
      SHOPPING_ROUTES.CART,
      ...Object.values(ERROR_ROUTES),
    ];
    return publicRoutes.some(publicRoute =>
      route.match(new RegExp(publicRoute.replace(/:[^/]+/g, '[^/]+')))
    );
  },

  // Get breadcrumb path
  getBreadcrumbPath: route => {
    const breadcrumbs = [];
    const segments = route.split('/').filter(Boolean);

    segments.forEach((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      breadcrumbs.push({
        path,
        label: segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' '),
      });
    });

    return breadcrumbs;
  },
};

// Route metadata for SEO and page titles
export const ROUTE_METADATA = {
  [PUBLIC_ROUTES.HOME]: {
    title: "Shop Online - Uganda's Premier E-commerce Platform",
    description:
      'Shop the best products in Uganda with secure Mobile Money payments and fast delivery.',
    keywords: 'uganda shopping, mobile money, online store, flash sales',
  },
  [PRODUCT_ROUTES.PRODUCTS]: {
    title: 'All Products - Shop Online',
    description: 'Browse our complete collection of quality products with competitive prices.',
    keywords: 'products, shopping, uganda, online store',
  },
  [FLASH_SALES_ROUTES.FLASH_SALES]: {
    title: 'Flash Sales - Limited Time Offers - Shop Online',
    description: "Don't miss out on our limited-time flash sales with amazing discounts.",
    keywords: 'flash sales, discounts, limited time offers, deals',
  },
  [SHOPPING_ROUTES.CART]: {
    title: 'Shopping Cart - Shop Online',
    description: 'Review your selected items before checkout.',
    keywords: 'cart, checkout, shopping',
  },
  [SHOPPING_ROUTES.CHECKOUT]: {
    title: 'Checkout - Shop Online',
    description: 'Complete your purchase securely with Mobile Money or Cash on Delivery.',
    keywords: 'checkout, payment, mobile money, cash on delivery',
  },
  [ADMIN_ROUTES.ADMIN_DASHBOARD]: {
    title: 'Admin Dashboard - Shop Online',
    description: 'Manage your e-commerce platform',
    keywords: 'admin, dashboard, management',
  },
};

// Default export with all route constants
export default {
  PUBLIC_ROUTES,
  PRODUCT_ROUTES,
  FLASH_SALES_ROUTES,
  SHOPPING_ROUTES,
  USER_ROUTES,
  ADMIN_ROUTES,
  ERROR_ROUTES,
  API_ROUTE_HELPERS,
  NAVIGATION_HELPERS,
  ROUTE_METADATA,
};
