// src/services/api/flashSalesAPI.js - COMPLETE FIXED VERSION
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

  // Get single flash sale
  getFlashSale: async flashSaleId => {
    try {
      const response = await apiClient.get(`/flash-sales/sales/${flashSaleId}/`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error fetching flash sale ${flashSaleId}:`, error);
      throw handleApiError(error);
    }
  },

  // FIXED: Get active flash sales - using correct endpoint from backend
  getActiveFlashSales: async () => {
    try {
      const response = await apiClient.get('/flash-sales/sales/active_sales/');
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching active flash sales:', error);
      // Return empty array to prevent UI crashes
      return [];
    }
  },

  // FIXED: Get upcoming flash sales - using correct endpoint from backend
  getUpcomingFlashSales: async () => {
    try {
      const response = await apiClient.get('/flash-sales/sales/upcoming_sales/');
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching upcoming flash sales:', error);
      // Return empty array to prevent UI crashes
      return [];
    }
  },

  // Alternative method name to match your context usage
  getActiveSales: async () => {
    try {
      const response = await apiClient.get('/flash-sales/sales/active_sales/');
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching active sales:', error);
      // Return empty array to prevent UI crashes
      return [];
    }
  },

  // Get featured flash sales for homepage
  getFeaturedFlashSales: async (limit = 3) => {
    try {
      const response = await apiClient.get(`/flash-sales/sales/active_sales/?limit=${limit}`);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching featured flash sales:', error);
      // Return empty array to prevent UI crashes
      return [];
    }
  },

  // Create new flash sale (admin only)
  createFlashSale: async flashSaleData => {
    try {
      const formData = flashSalesAPI.buildFlashSaleFormData(flashSaleData);
      const response = await fileUploadClient.post('/flash-sales/sales/', formData);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error creating flash sale:', error);
      throw handleApiError(error);
    }
  },

  // Update flash sale (admin only)
  updateFlashSale: async (flashSaleId, flashSaleData) => {
    try {
      const formData = flashSalesAPI.buildFlashSaleFormData(flashSaleData);
      const response = await fileUploadClient.patch(`/flash-sales/sales/${flashSaleId}/`, formData);
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

  // FIXED: Get flash sale with products - using correct endpoint from backend
  getFlashSaleWithProducts: async flashSaleId => {
    try {
      const response = await apiClient.get(`/flash-sales/sales/${flashSaleId}/with_products/`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error fetching flash sale with products ${flashSaleId}:`, error);
      throw handleApiError(error);
    }
  },

  // Flash Sale Products
  getFlashSaleProducts: async (flashSaleId, params = {}) => {
    try {
      const queryString = buildQueryString(params);
      const url = queryString
        ? `/flash-sales/sales/${flashSaleId}/with_products/?${queryString}`
        : `/flash-sales/sales/${flashSaleId}/with_products/`;
      const response = await apiClient.get(url);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error fetching flash sale products ${flashSaleId}:`, error);
      throw handleApiError(error);
    }
  },

  // FIXED: Add products to flash sale - using correct endpoint from backend
  addProductToFlashSale: async (flashSaleId, productData) => {
    try {
      const response = await apiClient.post(
        `/flash-sales/sales/${flashSaleId}/add_products/`,
        { products: [productData] }
      );
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error adding product to flash sale ${flashSaleId}:`, error);
      throw handleApiError(error);
    }
  },

  // Remove product from flash sale (admin only)
  removeProductFromFlashSale: async (flashSaleId, flashSaleProductId) => {
    try {
      const response = await apiClient.delete(`/flash-sales/products/${flashSaleProductId}/`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error removing product from flash sale:`, error);
      throw handleApiError(error);
    }
  },

  // Update flash sale product (admin only)
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

  // Get flash sale product details
  getFlashSaleProduct: async flashSaleProductId => {
    try {
      const response = await apiClient.get(`/flash-sales/products/${flashSaleProductId}/`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error fetching flash sale product ${flashSaleProductId}:`, error);
      throw handleApiError(error);
    }
  },

  // FIXED: Bulk add products to flash sale - using correct endpoint
  bulkAddProductsToFlashSale: async (flashSaleId, productIds, discountData = {}) => {
    try {
      const products = productIds.map(productId => ({
        product: productId,
        ...discountData,
      }));

      const response = await apiClient.post(
        `/flash-sales/sales/${flashSaleId}/add_products/`,
        { products }
      );
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error bulk adding products to flash sale ${flashSaleId}:`, error);
      throw handleApiError(error);
    }
  },

  // Get products available for flash sale (admin only)
  getAvailableProducts: async (params = {}) => {
    try {
      const queryString = buildQueryString(params);
      const url = queryString
        ? `/products/?${queryString}`
        : '/products/';
      const response = await apiClient.get(url);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching available products:', error);
      throw handleApiError(error);
    }
  },

  // Flash sale management actions (admin only) - FIXED: Using correct endpoints
  startFlashSale: async flashSaleId => {
    try {
      const response = await apiClient.post(`/flash-sales/sales/${flashSaleId}/activate/`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error starting flash sale ${flashSaleId}:`, error);
      throw handleApiError(error);
    }
  },

  endFlashSale: async flashSaleId => {
    try {
      const response = await apiClient.post(`/flash-sales/sales/${flashSaleId}/deactivate/`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error ending flash sale ${flashSaleId}:`, error);
      throw handleApiError(error);
    }
  },

  // Flash sale analytics (admin only) - FIXED: Using correct endpoint
  getFlashSaleAnalytics: async flashSaleId => {
    try {
      const response = await apiClient.get(`/flash-sales/sales/${flashSaleId}/analytics/`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error fetching flash sale analytics ${flashSaleId}:`, error);
      throw handleApiError(error);
    }
  },

  getFlashSalesOverview: async (period = '30d') => {
    try {
      const response = await apiClient.get(`/flash-sales/analytics/overview/?period=${period}`);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching flash sales overview:', error);
      throw handleApiError(error);
    }
  },

  // Utility Functions - FIXED: Better null checking
  formatFlashSaleData: flashSale => {
    if (!flashSale) return null;
    
    return {
      id: flashSale.id,
      name: flashSale.name,
      description: flashSale.description,
      discountPercentage: parseFloat(flashSale.discount_percentage || 0),
      startTime: new Date(flashSale.start_time),
      endTime: new Date(flashSale.end_time),
      isActive: flashSale.is_active,
      isRunning: flashSale.is_running,
      isUpcoming: flashSale.is_upcoming,
      isExpired: flashSale.is_expired,
      timeRemaining: flashSale.time_remaining || 0,
      productsCount: flashSale.products_count || 0,
      maxDiscountAmount: flashSale.max_discount_amount
        ? parseFloat(flashSale.max_discount_amount)
        : null,
      bannerImage: flashSale.banner_image,
      priority: flashSale.priority || 0,
      createdBy: flashSale.created_by_name,
      createdAt: new Date(flashSale.created_at),
      updatedAt: new Date(flashSale.updated_at),
    };
  },

  formatFlashSaleProductData: flashSaleProduct => {
    if (!flashSaleProduct) return null;
    
    return {
      id: flashSaleProduct.id,
      flashSaleId: flashSaleProduct.flash_sale,
      product: flashSaleProduct.product_detail || flashSaleProduct.product,
      customDiscountPercentage: flashSaleProduct.custom_discount_percentage
        ? parseFloat(flashSaleProduct.custom_discount_percentage)
        : null,
      flashSalePrice: parseFloat(flashSaleProduct.flash_sale_price || 0),
      originalPrice: parseFloat(flashSaleProduct.original_price || 0),
      stockLimit: flashSaleProduct.stock_limit,
      soldQuantity: flashSaleProduct.sold_quantity || 0,
      isActive: flashSaleProduct.is_active,
      discountPercentage: parseFloat(flashSaleProduct.discount_percentage || 0),
      savingsAmount: parseFloat(flashSaleProduct.savings_amount || 0),
      isSoldOut: flashSaleProduct.is_sold_out,
      addedBy: flashSaleProduct.added_by_name,
      createdAt: new Date(flashSaleProduct.created_at),
      updatedAt: new Date(flashSaleProduct.updated_at),
    };
  },

  calculateTimeRemaining: endTime => {
    const now = new Date();
    const end = new Date(endTime);
    const remaining = Math.max(0, end - now);

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    return {
      total: remaining,
      days,
      hours,
      minutes,
      seconds,
    };
  },

  formatTimeRemaining: timeRemaining => {
    if (timeRemaining.total <= 0) return 'Expired';

    if (timeRemaining.days > 0) {
      return `${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m`;
    } else if (timeRemaining.hours > 0) {
      return `${timeRemaining.hours}h ${timeRemaining.minutes}m ${timeRemaining.seconds}s`;
    } else {
      return `${timeRemaining.minutes}m ${timeRemaining.seconds}s`;
    }
  },

  getFlashSaleStatus: flashSale => {
    const now = new Date();
    const start = new Date(flashSale.start_time);
    const end = new Date(flashSale.end_time);

    if (!flashSale.is_active) return 'inactive';
    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'running';
    if (now > end) return 'expired';
    return 'unknown';
  },

  getFlashSaleStatusText: status => {
    const statusMap = {
      inactive: 'Inactive',
      upcoming: 'Upcoming',
      running: 'Running',
      expired: 'Expired',
      unknown: 'Unknown',
    };
    return statusMap[status] || 'Unknown';
  },

  getFlashSaleStatusColor: status => {
    const colorMap = {
      inactive: 'gray',
      upcoming: 'blue',
      running: 'green',
      expired: 'red',
      unknown: 'gray',
    };
    return colorMap[status] || 'gray';
  },

  validateFlashSaleData: flashSaleData => {
    const errors = {};
    const now = new Date();

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

      if (start >= end) {
        errors.end_time = 'End time must be after start time';
      }

      if (end <= now) {
        errors.end_time = 'End time must be in the future';
      }
    }

    if (flashSaleData.max_discount_amount && flashSaleData.max_discount_amount <= 0) {
      errors.max_discount_amount = 'Maximum discount amount must be greater than 0';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

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

  calculateFlashSalePrice: (originalPrice, discountPercentage, maxDiscountAmount = null) => {
    const discount = (originalPrice * discountPercentage) / 100;
    const actualDiscount = maxDiscountAmount ? Math.min(discount, maxDiscountAmount) : discount;
    return Math.max(0, originalPrice - actualDiscount);
  },

  calculateSavings: (originalPrice, flashSalePrice) => {
    return Math.max(0, originalPrice - flashSalePrice);
  },

  isFlashSaleActive: flashSale => {
    if (!flashSale.is_active) return false;

    const now = new Date();
    const start = new Date(flashSale.start_time);
    const end = new Date(flashSale.end_time);

    return now >= start && now <= end;
  },

  isFlashSaleUpcoming: flashSale => {
    if (!flashSale.is_active) return false;

    const now = new Date();
    const start = new Date(flashSale.start_time);

    return now < start;
  },

  isFlashSaleExpired: flashSale => {
    const now = new Date();
    const end = new Date(flashSale.end_time);

    return now > end;
  },

  getFlashSalePriority: priority => {
    const priorities = {
      0: 'Low',
      1: 'Medium',
      2: 'High',
      3: 'Critical',
    };
    return priorities[priority] || 'Low';
  },

  sortFlashSalesByPriority: flashSales => {
    return [...flashSales].sort((a, b) => {
      // First sort by priority (higher first)
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      // Then by start time (newer first)
      return new Date(b.start_time) - new Date(a.start_time);
    });
  },

  filterActiveFlashSales: flashSales => {
    const now = new Date();
    return flashSales.filter(flashSale => {
      const start = new Date(flashSale.start_time);
      const end = new Date(flashSale.end_time);
      return flashSale.is_active && now >= start && now <= end;
    });
  },

  filterUpcomingFlashSales: flashSales => {
    const now = new Date();
    return flashSales.filter(flashSale => {
      const start = new Date(flashSale.start_time);
      return flashSale.is_active && now < start;
    });
  },

  getCategoryColor: categoryId => {
    const colors = [
      '#2563eb', // Blue
      '#dc2626', // Red
      '#059669', // Green
      '#d97706', // Orange
      '#7c3aed', // Purple
      '#db2777', // Pink
      '#0891b2', // Cyan
      '#65a30d', // Lime
      '#dc2626', // Red variant
      '#7c2d12', // Brown
    ];

    // Use flash sale ID to get consistent color
    const numericId = typeof categoryId === 'string' 
      ? parseInt(categoryId.replace(/\D/g, '') || '1', 10)
      : categoryId || 1;
    
    const index = numericId % colors.length;
    return colors[index];
  },

  generateFlashSaleSlug: name => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  },

  // Cache management for flash sales
  getCachedFlashSales: () => {
    try {
      const cached = localStorage.getItem('flash_sales_cache');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const cacheAge = Date.now() - timestamp;
        const maxAge = 2 * 60 * 1000; // 2 minutes for flash sales (shorter cache)
        
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
      localStorage.setItem('flash_sales_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Error setting flash sales cache:', error);
    }
  },

  clearFlashSalesCache: () => {
    try {
      localStorage.removeItem('flash_sales_cache');
    } catch (error) {
      console.warn('Error clearing flash sales cache:', error);
    }
  },
};

// Log configuration in debug mode
if (process.env.REACT_APP_DEBUG === 'true' && process.env.REACT_APP_SHOW_DEV_TOOLS === 'true') {
  console.log('⚡ Flash Sales API configured with environment:', {
    flashSaleInterval: process.env.REACT_APP_FLASH_SALE_COUNTDOWN_INTERVAL,
    autoRefresh: process.env.REACT_APP_FLASH_SALE_AUTO_REFRESH,
    debugMode: process.env.REACT_APP_DEBUG,
  });
}

export default flashSalesAPI;