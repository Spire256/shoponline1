// src/services/api/adminAPI.js - Updated to match backend endpoints
import apiClient, {
  fileUploadClient,
  handleApiResponse,
  handleApiError,
  buildQueryString,
} from './apiClient';

const adminAPI = {
  // Homepage Content Management - Fixed endpoints to match backend
  homepage: {
    // Get active homepage content
    getActiveContent: async () => {
      try {
        const response = await apiClient.get('/admin/homepage-content/active_content/');
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Get all homepage content
    getContent: async () => {
      try {
        const response = await apiClient.get('/admin/homepage-content/');
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Update homepage content
    updateContent: async (contentId, contentData) => {
      try {
        const response = await apiClient.patch(`/admin/homepage-content/${contentId}/`, contentData);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Create homepage content
    createContent: async contentData => {
      try {
        const response = await apiClient.post('/admin/homepage-content/', contentData);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },
  },

  // Banner Management - Fixed to match backend structure
  banners: {
    // Get all banners
    getBanners: async (params = {}) => {
      try {
        const queryString = buildQueryString(params);
        const url = queryString ? `/admin/banners/?${queryString}` : '/admin/banners/';
        const response = await apiClient.get(url);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Get active banners for public display
    getActiveBanners: async () => {
      try {
        const response = await apiClient.get('/admin/banners/active_banners/');
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Get single banner
    getBanner: async bannerId => {
      try {
        const response = await apiClient.get(`/admin/banners/${bannerId}/`);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Create new banner
    createBanner: async bannerData => {
      try {
        const formData = adminAPI.buildFormData(bannerData);
        const response = await fileUploadClient.post('/admin/banners/', formData);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Update banner
    updateBanner: async (bannerId, bannerData) => {
      try {
        const formData = adminAPI.buildFormData(bannerData);
        const response = await fileUploadClient.patch(`/admin/banners/${bannerId}/`, formData);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Delete banner
    deleteBanner: async bannerId => {
      try {
        const response = await apiClient.delete(`/admin/banners/${bannerId}/`);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Reorder banners - Fixed to match backend endpoint
    reorderBanners: async bannerOrders => {
      try {
        const response = await apiClient.post('/admin/banners/reorder_banners/', {
          banner_orders: bannerOrders,
        });
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },
  },

  // Featured Products Management - Fixed to match backend
  featuredProducts: {
    // Get all featured products
    getFeaturedProducts: async (params = {}) => {
      try {
        const queryString = buildQueryString(params);
        const url = queryString
          ? `/admin/featured-products/?${queryString}`
          : '/admin/featured-products/';
        const response = await apiClient.get(url);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Get active featured products for public display
    getActiveFeatured: async () => {
      try {
        const response = await apiClient.get('/admin/featured-products/active_featured/');
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Add product to featured
    addFeaturedProduct: async productData => {
      try {
        const response = await apiClient.post('/admin/featured-products/', productData);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Remove from featured
    removeFeaturedProduct: async featuredProductId => {
      try {
        const response = await apiClient.delete(`/admin/featured-products/${featuredProductId}/`);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Update featured product
    updateFeaturedProduct: async (featuredProductId, updateData) => {
      try {
        const response = await apiClient.patch(
          `/admin/featured-products/${featuredProductId}/`,
          updateData
        );
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Reorder featured products - Fixed to match backend endpoint
    reorderFeaturedProducts: async productOrders => {
      try {
        const response = await apiClient.post('/admin/featured-products/reorder_featured/', {
          featured_orders: productOrders,
        });
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },
  },

  // Site Settings Management - Fixed to match backend
  siteSettings: {
    // Get current site settings
    getCurrentSettings: async () => {
      try {
        const response = await apiClient.get('/admin/site-settings/current_settings/');
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Get all site settings
    getSettings: async () => {
      try {
        const response = await apiClient.get('/admin/site-settings/');
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Update site settings
    updateSettings: async (settingsId, settingsData) => {
      try {
        const formData = adminAPI.buildFormData(settingsData);
        const response = await fileUploadClient.patch(`/admin/site-settings/${settingsId}/`, formData);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Create site settings
    createSettings: async settingsData => {
      try {
        const formData = adminAPI.buildFormData(settingsData);
        const response = await fileUploadClient.post('/admin/site-settings/', formData);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },
  },

  // Dashboard Analytics - Fixed to match backend endpoints
  analytics: {
    // Get dashboard overview
    getDashboardOverview: async () => {
      try {
        const response = await apiClient.get('/admin/analytics/overview/');
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Get sales chart data
    getSalesChart: async (period = '7days') => {
      try {
        const response = await apiClient.get(`/admin/analytics/sales_chart/?period=${period}`);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Get product performance
    getProductPerformance: async () => {
      try {
        const response = await apiClient.get('/admin/analytics/product_performance/');
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Get recent orders
    getRecentOrders: async () => {
      try {
        const response = await apiClient.get('/admin/analytics/recent_orders/');
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Get flash sales performance
    getFlashSalesPerformance: async () => {
      try {
        const response = await apiClient.get('/admin/analytics/flash_sales_performance/');
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },
  },

  // Utility Functions
  buildFormData: data => {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (typeof value === 'boolean') {
          formData.append(key, value.toString());
        } else if (value instanceof Date) {
          formData.append(key, value.toISOString());
        } else if (Array.isArray(value)) {
          value.forEach(item => formData.append(key, item));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    return formData;
  },

  // Format currency for Uganda
  formatCurrency: (amount, currency = 'UGX') => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },

  // Format number for display
  formatNumber: number => {
    return new Intl.NumberFormat('en-UG').format(number);
  },

  // Format percentage
  formatPercentage: value => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  },

  // Validate banner data
  validateBannerData: bannerData => {
    const errors = {};

    if (!bannerData.title || bannerData.title.trim().length < 3) {
      errors.title = 'Banner title must be at least 3 characters long';
    }

    if (!bannerData.banner_type) {
      errors.banner_type = 'Banner type is required';
    }

    if (!bannerData.image && !bannerData.id) {
      errors.image = 'Banner image is required';
    }

    if (bannerData.link_url && !adminAPI.isValidUrl(bannerData.link_url)) {
      errors.link_url = 'Please enter a valid URL';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  // URL validation
  isValidUrl: string => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  },

  // File download helper
  downloadFile: (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

export default adminAPI;