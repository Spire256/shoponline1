// src/services/api/adminAPI.js
import apiClient, {
  fileUploadClient,
  handleApiResponse,
  handleApiError,
  buildQueryString,
} from './apiClient';

const adminAPI = {
  // Homepage Content Management
  homepage: {
    // Get homepage content
    getContent: async () => {
      try {
        const response = await apiClient.get('/admin/homepage-content/');
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Update homepage content
    updateContent: async contentData => {
      try {
        const response = await apiClient.patch('/admin/homepage-content/1/', contentData);
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

  // Banner Management
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

    // Reorder banners
    reorderBanners: async bannerOrders => {
      try {
        const response = await apiClient.post('/admin/banners/reorder/', {
          banner_orders: bannerOrders,
        });
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },
  },

  // Featured Products Management
  featuredProducts: {
    // Get featured products
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

    // Reorder featured products
    reorderFeaturedProducts: async productOrders => {
      try {
        const response = await apiClient.post('/admin/featured-products/reorder/', {
          product_orders: productOrders,
        });
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },
  },

  // Site Settings Management
  siteSettings: {
    // Get site settings
    getSettings: async () => {
      try {
        const response = await apiClient.get('/admin/site-settings/');
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Update site settings
    updateSettings: async settingsData => {
      try {
        const formData = adminAPI.buildFormData(settingsData);
        const response = await fileUploadClient.patch('/admin/site-settings/1/', formData);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },
  },

  // Dashboard Analytics
  analytics: {
    // Get dashboard overview
    getDashboardOverview: async (period = '30d') => {
      try {
        const response = await apiClient.get(`/admin/analytics/overview/?period=${period}`);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Get sales analytics
    getSalesAnalytics: async (params = {}) => {
      try {
        const queryString = buildQueryString(params);
        const url = queryString
          ? `/admin/analytics/sales/?${queryString}`
          : '/admin/analytics/sales/';
        const response = await apiClient.get(url);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Get product analytics
    getProductAnalytics: async (params = {}) => {
      try {
        const queryString = buildQueryString(params);
        const url = queryString
          ? `/admin/analytics/products/?${queryString}`
          : '/admin/analytics/products/';
        const response = await apiClient.get(url);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Get user analytics
    getUserAnalytics: async (params = {}) => {
      try {
        const queryString = buildQueryString(params);
        const url = queryString
          ? `/admin/analytics/users/?${queryString}`
          : '/admin/analytics/users/';
        const response = await apiClient.get(url);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Get order analytics
    getOrderAnalytics: async (params = {}) => {
      try {
        const queryString = buildQueryString(params);
        const url = queryString
          ? `/admin/analytics/orders/?${queryString}`
          : '/admin/analytics/orders/';
        const response = await apiClient.get(url);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Get flash sales analytics
    getFlashSalesAnalytics: async (params = {}) => {
      try {
        const queryString = buildQueryString(params);
        const url = queryString
          ? `/admin/analytics/flash-sales/?${queryString}`
          : '/admin/analytics/flash-sales/';
        const response = await apiClient.get(url);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Get revenue trends
    getRevenueTrends: async (period = '30d', granularity = 'daily') => {
      try {
        const response = await apiClient.get(
          `/admin/analytics/revenue-trends/?period=${period}&granularity=${granularity}`
        );
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Get top performing items
    getTopPerformers: async (type = 'products', period = '30d', limit = 10) => {
      try {
        const response = await apiClient.get(
          `/admin/analytics/top-performers/?type=${type}&period=${period}&limit=${limit}`
        );
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },
  },

  // User Management
  users: {
    // Get all users
    getUsers: async (params = {}) => {
      try {
        const queryString = buildQueryString(params);
        const url = queryString ? `/admin/users/?${queryString}` : '/admin/users/';
        const response = await apiClient.get(url);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Get single user
    getUser: async userId => {
      try {
        const response = await apiClient.get(`/admin/users/${userId}/`);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Update user
    updateUser: async (userId, userData) => {
      try {
        const response = await apiClient.patch(`/admin/users/${userId}/`, userData);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Delete user
    deleteUser: async userId => {
      try {
        const response = await apiClient.delete(`/admin/users/${userId}/`);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Bulk actions on users
    bulkAction: async (action, userIds, options = {}) => {
      try {
        const response = await apiClient.post('/admin/users/bulk-action/', {
          action,
          user_ids: userIds,
          ...options,
        });
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Get user statistics
    getUserStats: async () => {
      try {
        const response = await apiClient.get('/admin/users/stats/');
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },
  },

  // System Management
  system: {
    // Get system status
    getSystemStatus: async () => {
      try {
        const response = await apiClient.get('/admin/system/status/');
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Get system logs
    getSystemLogs: async (params = {}) => {
      try {
        const queryString = buildQueryString(params);
        const url = queryString ? `/admin/system/logs/?${queryString}` : '/admin/system/logs/';
        const response = await apiClient.get(url);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Clear cache
    clearCache: async (cacheType = 'all') => {
      try {
        const response = await apiClient.post('/admin/system/clear-cache/', {
          cache_type: cacheType,
        });
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Database backup
    createBackup: async () => {
      try {
        const response = await apiClient.post('/admin/system/backup/');
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Get backup list
    getBackups: async () => {
      try {
        const response = await apiClient.get('/admin/system/backups/');
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Download backup
    downloadBackup: async backupId => {
      try {
        const response = await apiClient.get(`/admin/system/backups/${backupId}/download/`, {
          responseType: 'blob',
        });
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // System maintenance mode
    toggleMaintenanceMode: async (enabled, message = '') => {
      try {
        const response = await apiClient.post('/admin/system/maintenance/', {
          enabled,
          message,
        });
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },
  },

  // Reports and Export
  reports: {
    // Generate sales report
    generateSalesReport: async (params = {}) => {
      try {
        const queryString = buildQueryString(params);
        const url = queryString ? `/admin/reports/sales/?${queryString}` : '/admin/reports/sales/';
        const response = await apiClient.get(url, { responseType: 'blob' });
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Generate products report
    generateProductsReport: async (params = {}) => {
      try {
        const queryString = buildQueryString(params);
        const url = queryString
          ? `/admin/reports/products/?${queryString}`
          : '/admin/reports/products/';
        const response = await apiClient.get(url, { responseType: 'blob' });
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Generate users report
    generateUsersReport: async (params = {}) => {
      try {
        const queryString = buildQueryString(params);
        const url = queryString ? `/admin/reports/users/?${queryString}` : '/admin/reports/users/';
        const response = await apiClient.get(url, { responseType: 'blob' });
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Generate custom report
    generateCustomReport: async reportConfig => {
      try {
        const response = await apiClient.post('/admin/reports/custom/', reportConfig, {
          responseType: 'blob',
        });
        return response.data;
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

  formatAnalyticsData: analytics => {
    return {
      totalSales: analytics.total_sales ? parseFloat(analytics.total_sales) : 0,
      totalOrders: analytics.total_orders || 0,
      totalUsers: analytics.total_users || 0,
      totalProducts: analytics.total_products || 0,
      conversionRate: analytics.conversion_rate ? parseFloat(analytics.conversion_rate) : 0,
      averageOrderValue: analytics.average_order_value
        ? parseFloat(analytics.average_order_value)
        : 0,
      revenueGrowth: analytics.revenue_growth ? parseFloat(analytics.revenue_growth) : 0,
      userGrowth: analytics.user_growth ? parseFloat(analytics.user_growth) : 0,
      topProducts: analytics.top_products || [],
      topCategories: analytics.top_categories || [],
      salesByPeriod: analytics.sales_by_period || [],
      ordersByStatus: analytics.orders_by_status || [],
      paymentMethods: analytics.payment_methods || [],
    };
  },

  formatDashboardStats: stats => {
    return {
      today: {
        sales: stats.today?.sales ? parseFloat(stats.today.sales) : 0,
        orders: stats.today?.orders || 0,
        visitors: stats.today?.visitors || 0,
        conversion: stats.today?.conversion ? parseFloat(stats.today.conversion) : 0,
      },
      thisWeek: {
        sales: stats.this_week?.sales ? parseFloat(stats.this_week.sales) : 0,
        orders: stats.this_week?.orders || 0,
        visitors: stats.this_week?.visitors || 0,
        conversion: stats.this_week?.conversion ? parseFloat(stats.this_week.conversion) : 0,
      },
      thisMonth: {
        sales: stats.this_month?.sales ? parseFloat(stats.this_month.sales) : 0,
        orders: stats.this_month?.orders || 0,
        visitors: stats.this_month?.visitors || 0,
        conversion: stats.this_month?.conversion ? parseFloat(stats.this_month.conversion) : 0,
      },
      growth: {
        salesGrowth: stats.growth?.sales_growth ? parseFloat(stats.growth.sales_growth) : 0,
        ordersGrowth: stats.growth?.orders_growth ? parseFloat(stats.growth.orders_growth) : 0,
        usersGrowth: stats.growth?.users_growth ? parseFloat(stats.growth.users_growth) : 0,
      },
      alerts: stats.alerts || [],
    };
  },

  calculateGrowthPercentage: (current, previous) => {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  },

  formatCurrency: (amount, currency = 'UGX') => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },

  formatNumber: number => {
    return new Intl.NumberFormat('en-UG').format(number);
  },

  formatPercentage: value => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  },

  getGrowthColor: growth => {
    if (growth > 0) return 'green';
    if (growth < 0) return 'red';
    return 'gray';
  },

  getGrowthIcon: growth => {
    if (growth > 0) return '📈';
    if (growth < 0) return '📉';
    return '➖';
  },

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

  isValidUrl: string => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  },

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

  exportToCSV: (data, filename) => {
    const csvContent = adminAPI.convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    adminAPI.downloadFile(blob, filename);
  },

  convertToCSV: data => {
    if (!data.length) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add header row
    csvRows.push(headers.join(','));

    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return `"${value}"`;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  },
};

export default adminAPI;
