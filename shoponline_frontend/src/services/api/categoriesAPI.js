// src/services/api/categoriesAPI.js - FIXED VERSION
import apiClient, {
  fileUploadClient,
  handleApiResponse,
  handleApiError,
  buildQueryString,
  logApiCall,
} from './apiClient';

const categoriesAPI = {
  // FIXED: Get all categories with proper parameter handling
  getCategories: async (params = {}) => {
    try {
      logApiCall('GET', '/categories/', params);
      
      // Handle special 'root' parameter case from your backend
      if (params.parent === 'root') {
        params.parent = null; // Backend expects null for root categories
      }
      
      const queryString = buildQueryString(params);
      const url = queryString ? `/categories/?${queryString}` : '/categories/';
      const response = await apiClient.get(url);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw handleApiError(error);
    }
  },

  // FIXED: Get root categories (matching your backend filter)
  getRootCategories: async (params = {}) => {
    try {
      logApiCall('GET', '/categories/', { ...params, parent: 'root', is_active: true });
      const response = await apiClient.get('/categories/', {
        params: {
          parent: null, // Backend expects null, not 'root'
          is_active: true,
          ...params
        }
      });
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching root categories:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return { results: [], count: 0 };
    }
  },

  // Get single category by slug
  getCategory: async slug => {
    try {
      logApiCall('GET', `/categories/${slug}/`);
      const response = await apiClient.get(`/categories/${slug}/`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error fetching category ${slug}:`, error);
      throw handleApiError(error);
    }
  },

  // FIXED: Get featured categories with proper error handling
  getFeaturedCategories: async (limit = 6) => {
    try {
      logApiCall('GET', `/categories/featured/?limit=${limit}`);
      const response = await apiClient.get(`/categories/featured/?limit=${limit}`);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching featured categories:', error);
      // Return empty array to prevent UI crashes
      return { results: [], count: 0 };
    }
  },

  // FIXED: Get category tree with proper error handling
  getCategoryTree: async () => {
    try {
      logApiCall('GET', '/categories/tree/');
      const response = await apiClient.get('/categories/tree/');
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching category tree:', error);
      // Return empty array to prevent UI crashes
      return [];
    }
  },

  // Get products in a category
  getCategoryProducts: async (categorySlug, params = {}) => {
    try {
      const queryString = buildQueryString(params);
      const url = queryString
        ? `/categories/${categorySlug}/products/?${queryString}`
        : `/categories/${categorySlug}/products/`;
      logApiCall('GET', url, params);
      const response = await apiClient.get(url);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error fetching products for category ${categorySlug}:`, error);
      throw handleApiError(error);
    }
  },

  // Create new category (admin only)
  createCategory: async categoryData => {
    try {
      logApiCall('POST', '/categories/', categoryData);
      const formData = categoriesAPI.buildCategoryFormData(categoryData);
      const response = await fileUploadClient.post('/categories/', formData);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error creating category:', error);
      throw handleApiError(error);
    }
  },

  // Update category (admin only)
  updateCategory: async (categoryId, categoryData) => {
    try {
      logApiCall('PATCH', `/categories/${categoryId}/`, categoryData);
      const formData = categoriesAPI.buildCategoryFormData(categoryData);
      const response = await fileUploadClient.patch(`/categories/${categoryId}/`, formData);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error updating category ${categoryId}:`, error);
      throw handleApiError(error);
    }
  },

  // Delete category (admin only)
  deleteCategory: async categoryId => {
    try {
      logApiCall('DELETE', `/categories/${categoryId}/`);
      const response = await apiClient.delete(`/categories/${categoryId}/`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error deleting category ${categoryId}:`, error);
      throw handleApiError(error);
    }
  },

  // Search categories
  searchCategories: async (query, filters = {}) => {
    try {
      const params = { q: query, ...filters };
      const queryString = buildQueryString(params);
      logApiCall('GET', `/categories/search/?${queryString}`);
      const response = await apiClient.get(`/categories/search/?${queryString}`);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error searching categories:', error);
      throw handleApiError(error);
    }
  },

  // Toggle category featured status (admin only)
  toggleFeatured: async categoryId => {
    try {
      logApiCall('POST', `/categories/${categoryId}/toggle_featured/`);
      const response = await apiClient.post(`/categories/${categoryId}/toggle_featured/`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error toggling featured status for category ${categoryId}:`, error);
      throw handleApiError(error);
    }
  },

  // Toggle category active status (admin only)
  toggleActive: async categoryId => {
    try {
      logApiCall('POST', `/categories/${categoryId}/toggle_active/`);
      const response = await apiClient.post(`/categories/${categoryId}/toggle_active/`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error toggling active status for category ${categoryId}:`, error);
      throw handleApiError(error);
    }
  },

  // Bulk actions on categories (admin only)
  bulkAction: async (action, categoryIds, options = {}) => {
    try {
      const payload = {
        action,
        category_ids: categoryIds,
        ...options,
      };
      logApiCall('POST', '/categories/bulk_action/', payload);
      const response = await apiClient.post('/categories/bulk_action/', payload);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error performing bulk action on categories:', error);
      throw handleApiError(error);
    }
  },

  // Get category statistics (admin only)
  getCategoryStats: async () => {
    try {
      logApiCall('GET', '/categories/stats/');
      const response = await apiClient.get('/categories/stats/');
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching category statistics:', error);
      throw handleApiError(error);
    }
  },

  // Utility Functions - FIXED: Better error handling
  formatCategoryData: category => {
    if (!category) return null;
    
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      parent: category.parent,
      isActive: category.is_active,
      sortOrder: category.sort_order,
      featured: category.featured,
      productCount: category.product_count || 0,
      subcategoryCount: category.subcategory_count || 0,
      isParent: category.is_parent,
      breadcrumbTrail: category.breadcrumb_trail || [],
      allProductsCount: category.all_products_count || 0,
      metaTitle: category.meta_title,
      metaDescription: category.meta_description,
      createdAt: category.created_at ? new Date(category.created_at) : null,
      updatedAt: category.updated_at ? new Date(category.updated_at) : null,
    };
  },

  buildCategoryFormData: categoryData => {
    const formData = new FormData();
    
    // Get allowed image types from env
    const allowedTypes = (process.env.REACT_APP_ALLOWED_IMAGE_TYPES || 'image/jpeg,image/jpg,image/png,image/webp').split(',');
    const maxFileSize = parseInt(process.env.REACT_APP_MAX_FILE_SIZE) || 5242880;

    Object.entries(categoryData).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (key === 'image' && value instanceof File) {
          // Validate file type and size
          if (!allowedTypes.includes(value.type)) {
            throw new Error(`File type ${value.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`);
          }
          if (value.size > maxFileSize) {
            throw new Error(`File size exceeds maximum allowed size of ${maxFileSize / 1024 / 1024}MB`);
          }
          formData.append(key, value);
        } else if (typeof value === 'boolean') {
          formData.append(key, value.toString());
        } else {
          formData.append(key, value);
        }
      }
    });

    return formData;
  },

  validateCategoryData: categoryData => {
    const errors = {};

    if (!categoryData.name || categoryData.name.trim().length < 2) {
      errors.name = 'Category name must be at least 2 characters long';
    }

    if (categoryData.name && categoryData.name.length > 100) {
      errors.name = 'Category name must be less than 100 characters';
    }

    if (categoryData.parent === categoryData.id) {
      errors.parent = 'Category cannot be its own parent';
    }

    if (categoryData.description && categoryData.description.length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  // Cache management for categories - FIXED: Better error handling
  getCachedCategories: () => {
    try {
      const cached = localStorage.getItem('categories_cache');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const cacheAge = Date.now() - timestamp;
        const maxAge = 5 * 60 * 1000; // 5 minutes
        
        if (cacheAge < maxAge) {
          return data;
        }
      }
    } catch (error) {
      console.warn('Error reading categories cache:', error);
    }
    return null;
  },

  setCachedCategories: categories => {
    try {
      const cacheData = {
        data: categories,
        timestamp: Date.now(),
      };
      localStorage.setItem('categories_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Error setting categories cache:', error);
    }
  },

  clearCategoriesCache: () => {
    try {
      localStorage.removeItem('categories_cache');
    } catch (error) {
      console.warn('Error clearing categories cache:', error);
    }
  },
};

export default categoriesAPI;