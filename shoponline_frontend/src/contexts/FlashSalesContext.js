// src/contexts/FlashSalesContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import flashSalesAPI from '../services/api/flashSalesAPI';

// Flash Sales action types
const FLASH_SALES_ACTIONS = {
  LOAD_ACTIVE_SALES: 'LOAD_ACTIVE_SALES',
  LOAD_UPCOMING_SALES: 'LOAD_UPCOMING_SALES',
  LOAD_ALL_SALES: 'LOAD_ALL_SALES',
  UPDATE_FLASH_SALE: 'UPDATE_FLASH_SALE',
  ADD_FLASH_SALE: 'ADD_FLASH_SALE',
  REMOVE_FLASH_SALE: 'REMOVE_FLASH_SALE',
  UPDATE_TIMER: 'UPDATE_TIMER',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Initial state
const initialState = {
  activeSales: [],
  upcomingSales: [],
  allSales: [],
  timers: {}, // Store countdown timers for each sale
  isLoading: {
    active: true,
    upcoming: false,
    all: false,
  },
  error: null,
};

// Flash Sales reducer
const flashSalesReducer = (state, action) => {
  switch (action.type) {
    case FLASH_SALES_ACTIONS.LOAD_ACTIVE_SALES:
      return {
        ...state,
        activeSales: action.payload,
        isLoading: { ...state.isLoading, active: false },
        error: null,
      };

    case FLASH_SALES_ACTIONS.LOAD_UPCOMING_SALES:
      return {
        ...state,
        upcomingSales: action.payload,
        isLoading: { ...state.isLoading, upcoming: false },
        error: null,
      };

    case FLASH_SALES_ACTIONS.LOAD_ALL_SALES:
      return {
        ...state,
        allSales: action.payload,
        isLoading: { ...state.isLoading, all: false },
        error: null,
      };

    case FLASH_SALES_ACTIONS.ADD_FLASH_SALE:
      return {
        ...state,
        allSales: [action.payload, ...state.allSales],
        // Add to appropriate category based on timing
        activeSales: action.payload.is_running
          ? [action.payload, ...state.activeSales]
          : state.activeSales,
        upcomingSales: action.payload.is_upcoming
          ? [action.payload, ...state.upcomingSales]
          : state.upcomingSales,
        error: null,
      };

    case FLASH_SALES_ACTIONS.UPDATE_FLASH_SALE:
      const updateSales = salesArray =>
        salesArray.map(sale =>
          sale.id === action.payload.id ? { ...sale, ...action.payload.updates } : sale
        );

      return {
        ...state,
        activeSales: updateSales(state.activeSales),
        upcomingSales: updateSales(state.upcomingSales),
        allSales: updateSales(state.allSales),
        error: null,
      };

    case FLASH_SALES_ACTIONS.REMOVE_FLASH_SALE:
      const filterSales = salesArray => salesArray.filter(sale => sale.id !== action.payload.id);

      return {
        ...state,
        activeSales: filterSales(state.activeSales),
        upcomingSales: filterSales(state.upcomingSales),
        allSales: filterSales(state.allSales),
        error: null,
      };

    case FLASH_SALES_ACTIONS.UPDATE_TIMER:
      return {
        ...state,
        timers: {
          ...state.timers,
          [action.payload.saleId]: action.payload.timeRemaining,
        },
      };

    case FLASH_SALES_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: { ...state.isLoading, [action.payload.type]: action.payload.loading },
      };

    case FLASH_SALES_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: {
          active: false,
          upcoming: false,
          all: false,
        },
      };

    case FLASH_SALES_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Create context
const FlashSalesContext = createContext();

// Flash Sales provider component
export const FlashSalesProvider = ({ children }) => {
  const [state, dispatch] = useReducer(flashSalesReducer, initialState);

  // Load active sales on mount
  useEffect(() => {
    loadActiveSales();
  }, []);

  // Set up timers for active sales
  useEffect(() => {
    const intervals = [];

    state.activeSales.forEach(sale => {
      if (sale.is_running && sale.time_remaining > 0) {
        const interval = setInterval(() => {
          updateTimer(sale.id);
        }, 1000);
        intervals.push(interval);
      }
    });

    // Cleanup intervals
    return () => {
      intervals.forEach(interval => clearInterval(interval));
    };
  }, [state.activeSales]);

  // FIXED: Load active flash sales using corrected API method
  const loadActiveSales = async () => {
    dispatch({ type: FLASH_SALES_ACTIONS.SET_LOADING, payload: { type: 'active', loading: true } });

    try {
      const response = await flashSalesAPI.getActiveSales();
      
      dispatch({
        type: FLASH_SALES_ACTIONS.LOAD_ACTIVE_SALES,
        payload: response.data || response,
      });

      // Initialize timers
      const sales = response.data || response;
      if (Array.isArray(sales)) {
        sales.forEach(sale => {
          dispatch({
            type: FLASH_SALES_ACTIONS.UPDATE_TIMER,
            payload: { saleId: sale.id, timeRemaining: sale.time_remaining },
          });
        });
      }
    } catch (error) {
      console.error('Error loading active sales:', error);
      dispatch({
        type: FLASH_SALES_ACTIONS.SET_ERROR,
        payload: error.message || 'Failed to load active sales',
      });
    }
  };

  // FIXED: Load upcoming flash sales using corrected API method
  const loadUpcomingSales = async () => {
    dispatch({
      type: FLASH_SALES_ACTIONS.SET_LOADING,
      payload: { type: 'upcoming', loading: true },
    });

    try {
      const response = await flashSalesAPI.getUpcomingFlashSales();
      
      dispatch({
        type: FLASH_SALES_ACTIONS.LOAD_UPCOMING_SALES,
        payload: response.data || response,
      });
    } catch (error) {
      console.error('Error loading upcoming sales:', error);
      dispatch({
        type: FLASH_SALES_ACTIONS.SET_ERROR,
        payload: error.message || 'Failed to load upcoming sales',
      });
    }
  };

  // Load all flash sales (admin only)
  const loadAllSales = async () => {
    dispatch({ type: FLASH_SALES_ACTIONS.SET_LOADING, payload: { type: 'all', loading: true } });

    try {
      const response = await flashSalesAPI.getFlashSales();
      
      dispatch({
        type: FLASH_SALES_ACTIONS.LOAD_ALL_SALES,
        payload: response.results || response.data || response,
      });
    } catch (error) {
      console.error('Error loading all sales:', error);
      dispatch({
        type: FLASH_SALES_ACTIONS.SET_ERROR,
        payload: error.message || 'Failed to load all sales',
      });
    }
  };

  // Get flash sale by ID
  const getFlashSaleById = async saleId => {
    try {
      const response = await flashSalesAPI.getFlashSaleWithProducts(saleId);
      return { success: true, data: response.data || response };
    } catch (error) {
      console.error('Error getting flash sale:', error);
      return { success: false, error: error.message || 'Flash sale not found' };
    }
  };

  // Create flash sale (admin only)
  const createFlashSale = async saleData => {
    try {
      const response = await flashSalesAPI.createFlashSale(saleData);
      
      const newSale = response.data || response;
      dispatch({
        type: FLASH_SALES_ACTIONS.ADD_FLASH_SALE,
        payload: newSale,
      });
      
      return { success: true, data: newSale };
    } catch (error) {
      console.error('Error creating flash sale:', error);
      return { success: false, error: error.message || 'Failed to create flash sale' };
    }
  };

  // Update flash sale (admin only)
  const updateFlashSale = async (saleId, updateData) => {
    try {
      const response = await flashSalesAPI.updateFlashSale(saleId, updateData);
      
      const updatedSale = response.data || response;
      dispatch({
        type: FLASH_SALES_ACTIONS.UPDATE_FLASH_SALE,
        payload: { id: saleId, updates: updatedSale },
      });
      
      return { success: true, data: updatedSale };
    } catch (error) {
      console.error('Error updating flash sale:', error);
      return { success: false, error: error.message || 'Failed to update flash sale' };
    }
  };

  // Delete flash sale (admin only)
  const deleteFlashSale = async saleId => {
    try {
      await flashSalesAPI.deleteFlashSale(saleId);
      
      dispatch({
        type: FLASH_SALES_ACTIONS.REMOVE_FLASH_SALE,
        payload: { id: saleId },
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting flash sale:', error);
      return { success: false, error: error.message || 'Failed to delete flash sale' };
    }
  };

  // Add products to flash sale (admin only)
  const addProductsToSale = async (saleId, products) => {
    try {
      const response = await flashSalesAPI.bulkAddProductsToFlashSale(
        saleId,
        products.map(p => p.product || p.product_id),
        products[0] // Use first product's discount data as default
      );
      
      return { success: true, data: response.data || response };
    } catch (error) {
      console.error('Error adding products to sale:', error);
      return { success: false, error: error.message || 'Failed to add products to flash sale' };
    }
  };

  // Update timer for a specific sale
  const updateTimer = saleId => {
    const sale = state.activeSales.find(s => s.id === saleId);
    if (sale) {
      const now = new Date().getTime();
      const endTime = new Date(sale.end_time).getTime();
      const timeRemaining = Math.max(0, Math.floor((endTime - now) / 1000));

      dispatch({
        type: FLASH_SALES_ACTIONS.UPDATE_TIMER,
        payload: { saleId, timeRemaining },
      });

      // If timer expired, reload active sales
      if (timeRemaining === 0) {
        setTimeout(() => loadActiveSales(), 1000);
      }
    }
  };

  // Format time remaining for display
  const formatTimeRemaining = seconds => {
    if (seconds <= 0) return 'Expired';

    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Get flash sale product pricing
  const getFlashSalePrice = (productId, originalPrice) => {
    for (const sale of state.activeSales) {
      const product = sale.flash_sale_products?.find(p => p.product.id === productId);
      if (product) {
        return {
          flashSalePrice: product.flash_sale_price,
          originalPrice: product.original_price,
          discount: product.discount_percentage,
          savings: product.savings_amount,
          isFlashSale: true,
        };
      }
    }
    return {
      flashSalePrice: originalPrice,
      originalPrice,
      discount: 0,
      savings: 0,
      isFlashSale: false,
    };
  };

  // Check if product is in any active flash sale
  const isProductInFlashSale = productId => {
    return state.activeSales.some(sale =>
      sale.flash_sale_products?.some(p => p.product.id === productId)
    );
  };

  // Get active flash sales count
  const getActiveSalesCount = () => state.activeSales.length;

  // Get upcoming flash sales count
  const getUpcomingSalesCount = () => state.upcomingSales.length;

  // Refresh all sales data
  const refreshSales = async () => {
    await Promise.all([loadActiveSales(), loadUpcomingSales()]);
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: FLASH_SALES_ACTIONS.CLEAR_ERROR });
  };

  // Context value
  const value = {
    // State
    activeSales: state.activeSales,
    upcomingSales: state.upcomingSales,
    allSales: state.allSales,
    timers: state.timers,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    loadActiveSales,
    loadUpcomingSales,
    loadAllSales,
    getFlashSaleById,
    createFlashSale,
    updateFlashSale,
    deleteFlashSale,
    addProductsToSale,
    refreshSales,
    clearError,

    // Helpers
    getFlashSalePrice,
    isProductInFlashSale,
    formatTimeRemaining,
    getActiveSalesCount,
    getUpcomingSalesCount,
  };

  return <FlashSalesContext.Provider value={value}>{children}</FlashSalesContext.Provider>;
};

// Custom hook to use flash sales context
export const useFlashSales = () => {
  const context = useContext(FlashSalesContext);
  if (!context) {
    throw new Error('useFlashSales must be used within a FlashSalesProvider');
  }
  return context;
};

export default FlashSalesContext;