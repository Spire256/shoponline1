// src/contexts/AdminContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Admin action types
const ADMIN_ACTIONS = {
  LOAD_DASHBOARD_DATA: 'LOAD_DASHBOARD_DATA',
  UPDATE_DASHBOARD_STATS: 'UPDATE_DASHBOARD_STATS',
  LOAD_RECENT_ORDERS: 'LOAD_RECENT_ORDERS',
  ADD_NEW_ORDER: 'ADD_NEW_ORDER',
  UPDATE_ORDER_STATUS: 'UPDATE_ORDER_STATUS',
  LOAD_COD_ORDERS: 'LOAD_COD_ORDERS',
  UPDATE_COD_VERIFICATION: 'UPDATE_COD_VERIFICATION',
  LOAD_ANALYTICS: 'LOAD_ANALYTICS',
  UPDATE_SITE_SETTINGS: 'UPDATE_SITE_SETTINGS',
  MANAGE_INVITATIONS: 'MANAGE_INVITATIONS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Initial state
const initialState = {
  dashboardStats: {
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    codOrders: 0,
    flashSaleOrders: 0,
    newCustomers: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    activeFlashSales: 0,
  },
  recentOrders: [],
  codOrders: [],
  analytics: {
    salesChart: [],
    topProducts: [],
    ordersByStatus: [],
    revenueByPeriod: [],
  },
  siteSettings: null,
  invitations: [],
  isLoading: {
    dashboard: true,
    orders: false,
    analytics: false,
    settings: false,
    invitations: false,
  },
  error: null,
};

// Admin reducer
const adminReducer = (state, action) => {
  switch (action.type) {
    case ADMIN_ACTIONS.LOAD_DASHBOARD_DATA:
      return {
        ...state,
        dashboardStats: action.payload.stats,
        recentOrders: action.payload.recentOrders || state.recentOrders,
        isLoading: { ...state.isLoading, dashboard: false },
        error: null,
      };

    case ADMIN_ACTIONS.UPDATE_DASHBOARD_STATS:
      return {
        ...state,
        dashboardStats: { ...state.dashboardStats, ...action.payload },
        error: null,
      };

    case ADMIN_ACTIONS.LOAD_RECENT_ORDERS:
      return {
        ...state,
        recentOrders: action.payload,
        isLoading: { ...state.isLoading, orders: false },
        error: null,
      };

    case ADMIN_ACTIONS.ADD_NEW_ORDER:
      return {
        ...state,
        recentOrders: [action.payload, ...state.recentOrders.slice(0, 9)],
        dashboardStats: {
          ...state.dashboardStats,
          totalOrders: state.dashboardStats.totalOrders + 1,
          pendingOrders: state.dashboardStats.pendingOrders + 1,
          codOrders: action.payload.is_cash_on_delivery
            ? state.dashboardStats.codOrders + 1
            : state.dashboardStats.codOrders,
        },
        codOrders: action.payload.is_cash_on_delivery
          ? [action.payload, ...state.codOrders]
          : state.codOrders,
      };

    case ADMIN_ACTIONS.UPDATE_ORDER_STATUS:
      return {
        ...state,
        recentOrders: state.recentOrders.map(order =>
          order.id === action.payload.id ? { ...order, ...action.payload.updates } : order
        ),
        codOrders: state.codOrders.map(order =>
          order.id === action.payload.id ? { ...order, ...action.payload.updates } : order
        ),
      };

    case ADMIN_ACTIONS.LOAD_COD_ORDERS:
      return {
        ...state,
        codOrders: action.payload,
        isLoading: { ...state.isLoading, orders: false },
        error: null,
      };

    case ADMIN_ACTIONS.UPDATE_COD_VERIFICATION:
      return {
        ...state,
        codOrders: state.codOrders.map(order =>
          order.id === action.payload.orderId
            ? {
                ...order,
                cod_verification: {
                  ...order.cod_verification,
                  ...action.payload.updates,
                },
              }
            : order
        ),
      };

    case ADMIN_ACTIONS.LOAD_ANALYTICS:
      return {
        ...state,
        analytics: { ...state.analytics, ...action.payload },
        isLoading: { ...state.isLoading, analytics: false },
        error: null,
      };

    case ADMIN_ACTIONS.UPDATE_SITE_SETTINGS:
      return {
        ...state,
        siteSettings: { ...state.siteSettings, ...action.payload },
        isLoading: { ...state.isLoading, settings: false },
        error: null,
      };

    case ADMIN_ACTIONS.MANAGE_INVITATIONS:
      return {
        ...state,
        invitations: action.payload,
        isLoading: { ...state.isLoading, invitations: false },
        error: null,
      };

    case ADMIN_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: { ...state.isLoading, [action.payload.type]: action.payload.loading },
      };

    case ADMIN_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: {
          dashboard: false,
          orders: false,
          analytics: false,
          settings: false,
          invitations: false,
        },
      };

    case ADMIN_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Create context
const AdminContext = createContext();

// Admin provider component
export const AdminProvider = ({ children }) => {
  const [state, dispatch] = useReducer(adminReducer, initialState);
  const { isAdmin, accessToken } = useAuth();

  // Load initial admin data
  useEffect(() => {
    if (isAdmin() && accessToken) {
      loadDashboardData();
      loadCODOrders();
    }
  }, [isAdmin, accessToken]);

  // API headers helper
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  });

  // Load dashboard data
  const loadDashboardData = async () => {
    dispatch({ type: ADMIN_ACTIONS.SET_LOADING, payload: { type: 'dashboard', loading: true } });

    try {
      const response = await fetch('/api/admin_dashboard/analytics/overview/', {
        headers: getHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({
          type: ADMIN_ACTIONS.LOAD_DASHBOARD_DATA,
          payload: {
            stats: data,
            recentOrders: data.recent_orders || [],
          },
        });
      } else {
        throw new Error('Failed to load dashboard data');
      }
    } catch (error) {
      dispatch({
        type: ADMIN_ACTIONS.SET_ERROR,
        payload: error.message,
      });
    }
  };

  // Load recent orders
  const loadRecentOrders = async (limit = 10) => {
    dispatch({ type: ADMIN_ACTIONS.SET_LOADING, payload: { type: 'orders', loading: true } });

    try {
      const response = await fetch(`/api/admin_dashboard/analytics/recent_orders/?limit=${limit}`, {
        headers: getHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({
          type: ADMIN_ACTIONS.LOAD_RECENT_ORDERS,
          payload: data,
        });
      } else {
        throw new Error('Failed to load recent orders');
      }
    } catch (error) {
      dispatch({
        type: ADMIN_ACTIONS.SET_ERROR,
        payload: error.message,
      });
    }
  };

  // Load COD orders
  const loadCODOrders = async () => {
    dispatch({ type: ADMIN_ACTIONS.SET_LOADING, payload: { type: 'orders', loading: true } });

    try {
      const response = await fetch('/api/orders/?payment_method=cash_on_delivery&status=pending', {
        headers: getHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({
          type: ADMIN_ACTIONS.LOAD_COD_ORDERS,
          payload: data.results || data,
        });
      } else {
        throw new Error('Failed to load COD orders');
      }
    } catch (error) {
      dispatch({
        type: ADMIN_ACTIONS.SET_ERROR,
        payload: error.message,
      });
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId, statusData) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(statusData),
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({
          type: ADMIN_ACTIONS.UPDATE_ORDER_STATUS,
          payload: { id: orderId, updates: data },
        });
        return { success: true, data };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order status');
      }
    } catch (error) {
      dispatch({
        type: ADMIN_ACTIONS.SET_ERROR,
        payload: error.message,
      });
      return { success: false, error: error.message };
    }
  };

  // Verify COD order
  const verifyCODOrder = async (orderId, verificationData) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/cod-verification/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(verificationData),
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({
          type: ADMIN_ACTIONS.UPDATE_COD_VERIFICATION,
          payload: { orderId, updates: data },
        });
        return { success: true, data };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify COD order');
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Load analytics data
  const loadAnalytics = async (period = '7days') => {
    dispatch({ type: ADMIN_ACTIONS.SET_LOADING, payload: { type: 'analytics', loading: true } });

    try {
      const [salesResponse, productResponse, flashSaleResponse] = await Promise.all([
        fetch(`/api/admin_dashboard/analytics/sales_chart/?period=${period}`, {
          headers: getHeaders(),
        }),
        fetch('/api/admin_dashboard/analytics/product_performance/', {
          headers: getHeaders(),
        }),
        fetch('/api/admin_dashboard/analytics/flash_sales_performance/', {
          headers: getHeaders(),
        }),
      ]);

      const [salesData, productData, flashSaleData] = await Promise.all([
        salesResponse.json(),
        productResponse.json(),
        flashSaleResponse.json(),
      ]);

      dispatch({
        type: ADMIN_ACTIONS.LOAD_ANALYTICS,
        payload: {
          salesChart: salesData,
          topProducts: productData,
          flashSalesPerformance: flashSaleData,
        },
      });
    } catch (error) {
      dispatch({
        type: ADMIN_ACTIONS.SET_ERROR,
        payload: error.message,
      });
    }
  };

  // Load site settings
  const loadSiteSettings = async () => {
    dispatch({ type: ADMIN_ACTIONS.SET_LOADING, payload: { type: 'settings', loading: true } });

    try {
      const response = await fetch('/api/admin_dashboard/site-settings/current_settings/', {
        headers: getHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({
          type: ADMIN_ACTIONS.UPDATE_SITE_SETTINGS,
          payload: data,
        });
      } else {
        throw new Error('Failed to load site settings');
      }
    } catch (error) {
      dispatch({
        type: ADMIN_ACTIONS.SET_ERROR,
        payload: error.message,
      });
    }
  };

  // Update site settings
  const updateSiteSettings = async settingsData => {
    try {
      const response = await fetch('/api/admin_dashboard/site-settings/', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(settingsData),
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({
          type: ADMIN_ACTIONS.UPDATE_SITE_SETTINGS,
          payload: data,
        });
        return { success: true, data };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update site settings');
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Load admin invitations
  const loadInvitations = async () => {
    dispatch({ type: ADMIN_ACTIONS.SET_LOADING, payload: { type: 'invitations', loading: true } });

    try {
      const response = await fetch('/api/accounts/invitations/', {
        headers: getHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({
          type: ADMIN_ACTIONS.MANAGE_INVITATIONS,
          payload: data.results || data,
        });
      } else {
        throw new Error('Failed to load invitations');
      }
    } catch (error) {
      dispatch({
        type: ADMIN_ACTIONS.SET_ERROR,
        payload: error.message,
      });
    }
  };

  // Send admin invitation
  const sendInvitation = async email => {
    try {
      const response = await fetch('/api/accounts/invitations/', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const data = await response.json();
        // Reload invitations to get updated list
        loadInvitations();
        return { success: true, data };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invitation');
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Cancel admin invitation
  const cancelInvitation = async invitationId => {
    try {
      const response = await fetch(`/api/accounts/invitations/${invitationId}/`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (response.ok) {
        // Reload invitations to get updated list
        loadInvitations();
        return { success: true };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel invitation');
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Real-time order notification handler
  const handleNewOrder = orderData => {
    dispatch({
      type: ADMIN_ACTIONS.ADD_NEW_ORDER,
      payload: orderData,
    });

    // If it's a COD order, it needs special attention
    if (orderData.is_cash_on_delivery) {
      // Could trigger additional admin notifications here
      console.log('New COD order received:', orderData.order_number);
    }
  };

  // Get pending COD orders count
  const getPendingCODCount = () => {
    return state.codOrders.filter(
      order =>
        !order.cod_verification?.verification_status ||
        order.cod_verification.verification_status === 'pending'
    ).length;
  };

  // Get orders by status
  const getOrdersByStatus = status => {
    return state.recentOrders.filter(order => order.status === status);
  };

  // Get flash sale performance summary
  const getFlashSalesSummary = () => {
    return {
      activeCount: state.dashboardStats.activeFlashSales,
      totalRevenue: state.analytics.flashSalesPerformance?.total_revenue || 0,
      totalSavings: state.analytics.flashSalesPerformance?.total_savings || 0,
    };
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: ADMIN_ACTIONS.CLEAR_ERROR });
  };

  // Refresh dashboard data
  const refreshDashboard = async () => {
    await Promise.all([loadDashboardData(), loadRecentOrders(), loadCODOrders()]);
  };

  // Context value
  const value = {
    // State
    dashboardStats: state.dashboardStats,
    recentOrders: state.recentOrders,
    codOrders: state.codOrders,
    analytics: state.analytics,
    siteSettings: state.siteSettings,
    invitations: state.invitations,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    loadDashboardData,
    loadRecentOrders,
    loadCODOrders,
    updateOrderStatus,
    verifyCODOrder,
    loadAnalytics,
    loadSiteSettings,
    updateSiteSettings,
    loadInvitations,
    sendInvitation,
    cancelInvitation,
    handleNewOrder,
    refreshDashboard,
    clearError,

    // Helpers
    getPendingCODCount,
    getOrdersByStatus,
    getFlashSalesSummary,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

// Custom hook to use admin context
export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export default AdminContext;
