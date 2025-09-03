// src/services/api/flashSalesAPI.js - FIXED VERSION FOR BACKEND INTEGRATION
import apiClient, {
  fileUploadClient,
  handleApiResponse,
  handleApiError,
  buildQueryString,
} from './apiClient';

const flashSalesAPI = {
  // Get all flash sales with filtering and pagination
  getFlashSales: async (params = {}) => {
    try {
      const queryString = buildQueryString(params);
      const url = queryString ? `/flash-sales/sales/?${queryString}` : '/flash-sales/sales/';
      const response = await apiClient.get(url);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching flash sales:', error);
      throw handleApiError(error);
    }
  },

  // Get single flash sale by ID
  getFlashSale: async flashSaleId => {
    try {
      const response = await apiClient.get(`/flash-sales/sales/${flashSaleId}/`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error fetching flash sale ${flashSaleId}:`, error);
      throw handleApiError(error);
    }
  },

  // Get active flash sales - matching backend endpoint
  getActiveSales: async () => {
    try {
      const response = await apiClient.get('/flash-sales/sales/active_sales/');
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching active flash sales:', error);
      // Return empty array to prevent crashes
      return [];
    }
  },

  // Get upcoming flash sales - matching backend endpoint  
  getUpcomingFlashSales: async () => {
    try {
      const response = await apiClient.get('/flash-sales/sales/upcoming_sales/');
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching upcoming flash sales:', error);
      return [];
    }
  },

  // Get flash sale with products - matching backend endpoint
  getFlashSaleWithProducts: async flashSaleId => {
    try {
      const response = await apiClient.get(`/flash-sales/sales/${flashSaleId}/with_products/`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error fetching flash sale with products ${flashSaleId}:`, error);
      throw handleApiError(error);
    }
  },

  // Create new flash sale (admin only)
  createFlashSale: async flashSaleData => {
    try {
      let requestData;
      
      // Check if flashSaleData is FormData or needs to be converted
      if (flashSaleData instanceof FormData) {
        requestData = flashSaleData;
      } else {
        requestData = flashSalesAPI.buildFlashSaleFormData(flashSaleData);
      }
      
      const response = await fileUploadClient.post('/flash-sales/sales/', requestData);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error creating flash sale:', error);
      throw handleApiError(error);
    }
  },

  // Update flash sale (admin only)
  updateFlashSale: async (flashSaleId, flashSaleData) => {
    try {
      let requestData;
      
      if (flashSaleData instanceof FormData) {
        requestData = flashSaleData;
      } else {
        requestData = flashSalesAPI.buildFlashSaleFormData(flashSaleData);
      }
      
      const response = await fileUploadClient.patch(`/flash-sales/sales/${flashSaleId}/`, requestData);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error updating flash sale ${flashSaleId}:`, error);
      throw handleApiError(error);
    }
  },

  // Delete flash sale (admin only)
  deleteFlashSale: async flashSaleId => {
    try {
      const response = await apiClient.delete(`/flash-sales/sales/${flashSaleId}/`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error deleting flash sale ${flashSaleId}:`, error);
      throw handleApiError(error);
    }
  },

  // Add products to flash sale - matching backend endpoint
  addProductsToFlashSale: async (flashSaleId, productsData) => {
    try {
      const response = await apiClient.post(
        `/flash-sales/sales/${flashSaleId}/add_products/`,
        productsData
      );
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error adding products to flash sale ${flashSaleId}:`, error);
      throw handleApiError(error);
    }
  },

  // Activate flash sale - matching backend endpoint
  activateFlashSale: async flashSaleId => {
    try {
      const response = await apiClient.post(`/flash-sales/sales/${flashSaleId}/activate/`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error activating flash sale ${flashSaleId}:`, error);
      throw handleApiError(error);
    }
  },

  // Deactivate flash sale - matching backend endpoint
  deactivateFlashSale: async flashSaleId => {
    try {
      const response = await apiClient.post(`/flash-sales/sales/${flashSaleId}/deactivate/`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error deactivating flash sale ${flashSaleId}:`, error);
      throw handleApiError(error);
    }
  },

  // Get flash sale analytics - matching backend endpoint
  getFlashSaleAnalytics: async flashSaleId => {
    try {
      const response = await apiClient.get(`/flash-sales/sales/${flashSaleId}/analytics/`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error fetching flash sale analytics ${flashSaleId}:`, error);
      throw handleApiError(error);
    }
  },

  // Flash Sale Products endpoints
  getFlashSaleProducts: async (params = {}) => {
    try {
      const queryString = buildQueryString(params);
      const url = queryString ? `/flash-sales/products/?${queryString}` : '/flash-sales/products/';
      const response = await apiClient.get(url);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching flash sale products:', error);
      throw handleApiError(error);
    }
  },

  getFlashSaleProduct: async flashSaleProductId => {
    try {
      const response = await apiClient.get(`/flash-sales/products/${flashSaleProductId}/`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error fetching flash sale product ${flashSaleProductId}:`, error);
      throw handleApiError(error);
    }
  },

  updateFlashSaleProduct: async (flashSaleProductId, productData) => {
    try {
      const response = await apiClient.patch(
        `/flash-sales/products/${flashSaleProductId}/`,
        productData
      );
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error updating flash sale product ${flashSaleProductId}:`, error);
      throw handleApiError(error);
    }
  },

  deleteFlashSaleProduct: async flashSaleProductId => {
    try {
      const response = await apiClient.delete(`/flash-sales/products/${flashSaleProductId}/`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error deleting flash sale product ${flashSaleProductId}:`, error);
      throw handleApiError(error);
    }
  },

  // Utility methods
  buildFlashSaleFormData: flashSaleData => {
    const formData = new FormData();

    Object.entries(flashSaleData).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (key === 'banner_image' && value instanceof File) {
          formData.append(key, value);
        } else if (typeof value === 'boolean') {
          formData.append(key, value.toString());
        } else if (value instanceof Date) {
          formData.append(key, value.toISOString());
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    return formData;
  },

  // Format flash sale data for frontend use
  formatFlashSaleData: flashSale => {
    if (!flashSale) return null;
    
    return {
      id: flashSale.id,
      name: flashSale.name,
      description: flashSale.description || '',
      discount_percentage: parseFloat(flashSale.discount_percentage || 0),
      start_time: flashSale.start_time,
      end_time: flashSale.end_time,
      is_active: flashSale.is_active,
      is_running: flashSale.is_running,
      is_upcoming: flashSale.is_upcoming,
      is_expired: flashSale.is_expired,
      time_remaining: flashSale.time_remaining || 0,
      products_count: flashSale.products_count || 0,
      max_discount_amount: flashSale.max_discount_amount
        ? parseFloat(flashSale.max_discount_amount)
        : null,
      banner_image: flashSale.banner_image,
      priority: flashSale.priority || 0,
      created_by_name: flashSale.created_by_name,
      created_at: flashSale.created_at,
      updated_at: flashSale.updated_at,
      flash_sale_products: flashSale.flash_sale_products || [],
    };
  },

  // Format flash sale product data
  formatFlashSaleProductData: flashSaleProduct => {
    if (!flashSaleProduct) return null;
    
    return {
      id: flashSaleProduct.id,
      flash_sale: flashSaleProduct.flash_sale,
      product: flashSaleProduct.product_detail || flashSaleProduct.product,
      custom_discount_percentage: flashSaleProduct.custom_discount_percentage
        ? parseFloat(flashSaleProduct.custom_discount_percentage)
        : null,
      flash_sale_price: parseFloat(flashSaleProduct.flash_sale_price || 0),
      original_price: parseFloat(flashSaleProduct.original_price || 0),
      stock_limit: flashSaleProduct.stock_limit,
      sold_quantity: flashSaleProduct.sold_quantity || 0,
      is_active: flashSaleProduct.is_active,
      discount_percentage: parseFloat(flashSaleProduct.discount_percentage || 0),
      savings_amount: parseFloat(flashSaleProduct.savings_amount || 0),
      is_sold_out: flashSaleProduct.is_sold_out,
    };
  },

  // Calculate time remaining in seconds
  calculateTimeRemaining: endTime => {
    const now = new Date();
    const end = new Date(endTime);
    const remaining = Math.max(0, end - now);
    return Math.floor(remaining / 1000);
  },

  // Format time for display
  formatTimeRemaining: seconds => {
    if (seconds <= 0) return 'Expired';

    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else {
      return `${minutes}m ${secs}s`;
    }
  },

  // Get flash sale status
  getFlashSaleStatus: flashSale => {
    if (!flashSale.is_active) return 'inactive';
    if (flashSale.is_running) return 'running';
    if (flashSale.is_upcoming) return 'upcoming';
    if (flashSale.is_expired) return 'expired';
    return 'unknown';
  },

  // Validate flash sale data before submission
  validateFlashSaleData: flashSaleData => {
    const errors = {};

    if (!flashSaleData.name || flashSaleData.name.trim().length < 3) {
      errors.name = 'Flash sale name must be at least 3 characters long';
    }

    if (
      !flashSaleData.discount_percentage ||
      flashSaleData.discount_percentage <= 0 ||
      flashSaleData.discount_percentage > 100
    ) {
      errors.discount_percentage = 'Discount percentage must be between 1 and 100';
    }

    if (!flashSaleData.start_time) {
      errors.start_time = 'Start time is required';
    }

    if (!flashSaleData.end_time) {
      errors.end_time = 'End time is required';
    }

    if (flashSaleData.start_time && flashSaleData.end_time) {
      const start = new Date(flashSaleData.start_time);
      const end = new Date(flashSaleData.end_time);
      const now = new Date();

      if (start >= end) {
        errors.end_time = 'End time must be after start time';
      }

      if (end <= now) {
        errors.end_time = 'End time must be in the future';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  // Check if product is in any active flash sale
  isProductInFlashSale: async productId => {
    try {
      const activeSales = await flashSalesAPI.getActiveSales();
      
      for (const sale of activeSales) {
        if (sale.flash_sale_products) {
          const productInSale = sale.flash_sale_products.find(
            p => p.product?.id === productId || p.product_detail?.id === productId
          );
          if (productInSale) {
            return {
              inFlashSale: true,
              flashSale: sale,
              flashSaleProduct: productInSale,
              flashSalePrice: productInSale.flash_sale_price,
              originalPrice: productInSale.original_price,
              discount: productInSale.discount_percentage,
            };
          }
        }
      }

      return { inFlashSale: false };
    } catch (error) {
      console.error('Error checking flash sale status for product:', error);
      return { inFlashSale: false };
    }
  },

  // Get flash sale price for a product
  getFlashSalePrice: async (productId, originalPrice) => {
    try {
      const flashSaleInfo = await flashSalesAPI.isProductInFlashSale(productId);
      
      if (flashSaleInfo.inFlashSale) {
        return {
          price: flashSaleInfo.flashSalePrice,
          originalPrice: flashSaleInfo.originalPrice,
          discount: flashSaleInfo.discount,
          savings: flashSaleInfo.originalPrice - flashSaleInfo.flashSalePrice,
          flashSale: flashSaleInfo.flashSale,
          isFlashSale: true,
        };
      }

      return {
        price: originalPrice,
        originalPrice,
        discount: 0,
        savings: 0,
        flashSale: null,
        isFlashSale: false,
      };
    } catch (error) {
      console.error('Error getting flash sale price:', error);
      return {
        price: originalPrice,
        originalPrice,
        discount: 0,
        savings: 0,
        flashSale: null,
        isFlashSale: false,
      };
    }
  },

  // Cache management for better performance
  getCachedFlashSales: () => {
    try {
      const cached = sessionStorage.getItem('flash_sales_cache');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const cacheAge = Date.now() - timestamp;
        const maxAge = 60 * 1000; // 1 minute cache for flash sales
        
        if (cacheAge < maxAge) {
          return data;
        }
      }
    } catch (error) {
      console.warn('Error reading flash sales cache:', error);
    }
    return null;
  },

  setCachedFlashSales: flashSales => {
    try {
      const cacheData = {
        data: flashSales,
        timestamp: Date.now(),
      };
      sessionStorage.setItem('flash_sales_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Error setting flash sales cache:', error);
    }
  },

  clearFlashSalesCache: () => {
    try {
      sessionStorage.removeItem('flash_sales_cache');
    } catch (error) {
      console.warn('Error clearing flash sales cache:', error);
    }
  },
};

export default flashSalesAPI;