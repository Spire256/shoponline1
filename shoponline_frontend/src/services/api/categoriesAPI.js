// src/services/api/categoriesAPI.js - Updated to align with Django backend
import apiClient, {
  fileUploadClient,
  handleApiResponse,
  handleApiError,
  buildQueryString,
  logApiCall,
} from './apiClient';

const categoriesAPI = {
  // Get all categories with proper parameter handling
  getCategories: async (params = {}) => {
    try {
      logApiCall('GET', '/categories/', params);
      
      // Clean up parameters to match backend expectations
      const cleanParams = { ...params };
      
      // Handle 'root' parent parameter - backend expects null for root categories
      if (cleanParams.parent === 'root') {
        delete cleanParams.parent; // Remove parent param to get root categories
      }
      
      // Convert boolean strings to actual booleans
      if (cleanParams.featured === 'true') cleanParams.featured = true;
      if (cleanParams.featured === 'false') cleanParams.featured = false;
      if (cleanParams.is_active === 'true') cleanParams.is_active = true;
      if (cleanParams.is_active === 'false') cleanParams.is_active = false;
      
      const queryString = buildQueryString(cleanParams);
      const url = queryString ? `/categories/?${queryString}` : '/categories/';
      const response = await apiClient.get(url);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw handleApiError(error);
    }
  },

  // Get root categories (no parent)
  getRootCategories: async (params = {}) => {
    try {
      const cleanParams = {
        ...params,
        // Don't include parent param to get root categories
        is_active: true,
      };
      
      logApiCall('GET', '/categories/ (root)', cleanParams);
      const response = await apiClient.get('/categories/', { params: cleanParams });
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching root categories:', error);
      // Return empty results structure instead of throwing to prevent UI crashes
      return { results: [], count: 0, next: null, previous: null };
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

  // Get featured categories
  getFeaturedCategories: async (limit = 6) => {
    try {
      logApiCall('GET', '/categories/featured/', { limit });
      const response = await apiClient.get('/categories/featured/', { params: { limit } });
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching featured categories:', error);
      // Return empty array to prevent UI crashes
      return [];
    }
  },

  // Get category tree structure
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
      logApiCall('GET', url);
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
      
      // Build FormData properly for file uploads
      const formData = categoriesAPI.buildCategoryFormData(categoryData);
      
      const response = await fileUploadClient.post('/categories/', formData);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error creating category:', error);
      throw handleApiError(error);
    }
  },

  // Update category (admin only) - using PATCH for partial updates
  updateCategory: async (categorySlug, categoryData) => {
    try {
      logApiCall('PATCH', `/categories/${categorySlug}/`, categoryData);
      
      // Build FormData properly for file uploads
      const formData = categoriesAPI.buildCategoryFormData(categoryData);
      
      const response = await fileUploadClient.patch(`/categories/${categorySlug}/`, formData);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error updating category ${categorySlug}:`, error);
      throw handleApiError(error);
    }
  },

  // Delete category (admin only)
  deleteCategory: async categorySlug => {
    try {
      logApiCall('DELETE', `/categories/${categorySlug}/`);
      const response = await apiClient.delete(`/categories/${categorySlug}/`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error deleting category ${categorySlug}:`, error);
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
  toggleFeatured: async categorySlug => {
    try {
      logApiCall('POST', `/categories/${categorySlug}/toggle_featured/`);
      const response = await apiClient.post(`/categories/${categorySlug}/toggle_featured/`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error toggling featured status for category ${categorySlug}:`, error);
      throw handleApiError(error);
    }
  },

  // Toggle category active status (admin only)
  toggleActive: async categorySlug => {
    try {
      logApiCall('POST', `/categories/${categorySlug}/toggle_active/`);
      const response = await apiClient.post(`/categories/${categorySlug}/toggle_active/`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error toggling active status for category ${categorySlug}:`, error);
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
      // Return default stats structure
      return {
        overview: {
          total_categories: 0,
          active_categories: 0,
          featured_categories: 0,
          root_categories: 0,
          inactive_categories: 0,
        },
        structure: {
          max_depth: 0,
          categories_with_products: 0,
          empty_categories: 0,
        },
        top_categories: [],
        recent_activity: {
          new_categories_this_month: 0,
        },
      };
    }
  },

  // Utility Functions
  formatCategoryData: category => {
    if (!category) return null;

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      image_url: category.image_url,
      parent: category.parent,
      parent_details: category.parent_details,
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
      // Add missing backend fields
      subcategories: category.subcategories || [],
      featuredProducts: category.featured_products || [],
    };
  },

  buildCategoryFormData: categoryData => {
    const formData = new FormData();

    // Validate file if present
    if (categoryData.image instanceof File) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const maxFileSize = 5242880; // 5MB

      if (!allowedTypes.includes(categoryData.image.type)) {
        throw new Error(
          `File type ${categoryData.image.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`
        );
      }
      if (categoryData.image.size > maxFileSize) {
        throw new Error(`File size exceeds maximum allowed size of ${maxFileSize / 1024 / 1024}MB`);
      }
    }

    // Build form data with proper type handling
    Object.entries(categoryData).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (key === 'image' && value instanceof File) {
          formData.append(key, value);
        } else if (typeof value === 'boolean') {
          formData.append(key, value.toString());
        } else if (typeof value === 'number') {
          formData.append(key, value.toString());
        } else if (typeof value === 'string') {
          formData.append(key, value);
        }
      }
    });

    return formData;
  },

  validateCategoryData: categoryData => {
    const errors = {};

    // Required fields validation
    if (!categoryData.name || categoryData.name.trim().length < 2) {
      errors.name = 'Category name must be at least 2 characters long';
    }

    if (categoryData.name && categoryData.name.length > 100) {
      errors.name = 'Category name must be less than 100 characters';
    }

    // Prevent circular reference
    if (categoryData.parent === categoryData.id) {
      errors.parent = 'Category cannot be its own parent';
    }

    // Description length check
    if (categoryData.description && categoryData.description.length > 1000) {
      errors.description = 'Description must be less than 1000 characters';
    }

    // Sort order validation
    if (categoryData.sort_order !== undefined && categoryData.sort_order < 0) {
      errors.sort_order = 'Sort order must be a positive number';
    }

    // Meta fields validation
    if (categoryData.meta_title && categoryData.meta_title.length > 200) {
      errors.meta_title = 'Meta title must be less than 200 characters';
    }

    if (categoryData.meta_description && categoryData.meta_description.length > 300) {
      errors.meta_description = 'Meta description must be less than 300 characters';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  // Cache management
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

  // Enhanced category fetching with caching
  getCategoriesWithCache: async (params = {}, useCache = true) => {
    // Try cache first for non-admin requests
    if (useCache && !params.page) {
      const cached = categoriesAPI.getCachedCategories();
      if (cached) {
        return cached;
      }
    }

    try {
      const response = await categoriesAPI.getCategories(params);
      
      // Cache successful responses
      if (useCache && !params.page) {
        categoriesAPI.setCachedCategories(response);
      }
      
      return response;
    } catch (error) {
      // Try to return cached data on error
      if (useCache) {
        const cached = categoriesAPI.getCachedCategories();
        if (cached) {
          console.warn('Using cached categories due to API error:', error);
          return cached;
        }
      }
      throw error;
    }
  },
};

export default categoriesAPI;