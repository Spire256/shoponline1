// src/services/api/productsAPI.js
import apiClient, {
  fileUploadClient,
  handleApiResponse,
  handleApiError,
  buildQueryString,
} from './apiClient';

const productsAPI = {
  // Get all products with filtering and pagination
  getProducts: async (params = {}) => {
    try {
      const queryString = buildQueryString(params);
      const url = queryString ? `/products/?${queryString}` : '/products/';
      const response = await apiClient.get(url);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get single product by slug
  getProduct: async slug => {
    try {
      const response = await apiClient.get(`/products/${slug}/`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get product by ID (admin use)
  getProductById: async productId => {
    try {
      const response = await apiClient.get(`/products/${productId}/`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Create new product (admin only)
  createProduct: async productData => {
    try {
      const response = await fileUploadClient.post('/products/', productData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update product (admin only)
  updateProduct: async (productId, productData) => {
    try {
      const response = await fileUploadClient.patch(`/products/${productId}/`, productData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Delete product (admin only)
  deleteProduct: async productId => {
    try {
      const response = await apiClient.delete(`/products/${productId}/`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get featured products
  getFeaturedProducts: async (limit = 8) => {
    try {
      const response = await apiClient.get(`/products/featured/?limit=${limit}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Search products
  searchProducts: async (query, filters = {}) => {
    try {
      const params = { search: query, ...filters };
      const queryString = buildQueryString(params);
      const response = await apiClient.get(`/products/search/?${queryString}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get products by category
  getProductsByCategory: async (categoryId, params = {}) => {
    try {
      const allParams = { category: categoryId, ...params };
      const queryString = buildQueryString(allParams);
      const response = await apiClient.get(`/products/?${queryString}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get related products
  getRelatedProducts: async (productId, limit = 4) => {
    try {
      const response = await apiClient.get(`/products/${productId}/related/?limit=${limit}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get product recommendations
  getRecommendedProducts: async (params = {}) => {
    try {
      const queryString = buildQueryString(params);
      const url = queryString
        ? `/products/recommendations/?${queryString}`
        : '/products/recommendations/';
      const response = await apiClient.get(url);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get top products
  getTopProducts: async (type = 'popular', limit = 10) => {
    try {
      const response = await apiClient.get(`/products/top/?type=${type}&limit=${limit}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Product Images
  getProductImages: async productId => {
    try {
      const response = await apiClient.get(`/products/${productId}/images/`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  uploadProductImage: async (productId, imageData) => {
    try {
      const formData = new FormData();
      formData.append('image', imageData.image);
      formData.append('alt_text', imageData.alt_text || '');
      formData.append('caption', imageData.caption || '');
      formData.append('position', imageData.position || 0);
      formData.append('is_main', imageData.is_main || false);

      const response = await fileUploadClient.post(`/products/${productId}/images/`, formData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  updateProductImage: async (productId, imageId, imageData) => {
    try {
      const response = await apiClient.patch(
        `/products/${productId}/images/${imageId}/`,
        imageData
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  deleteProductImage: async (productId, imageId) => {
    try {
      const response = await apiClient.delete(`/products/${productId}/images/${imageId}/`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Product Attributes
  getProductAttributes: async productId => {
    try {
      const response = await apiClient.get(`/products/${productId}/attributes/`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  createProductAttribute: async (productId, attributeData) => {
    try {
      const response = await apiClient.post(`/products/${productId}/attributes/`, attributeData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  updateProductAttribute: async (productId, attributeId, attributeData) => {
    try {
      const response = await apiClient.patch(
        `/products/${productId}/attributes/${attributeId}/`,
        attributeData
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  deleteProductAttribute: async (productId, attributeId) => {
    try {
      const response = await apiClient.delete(`/products/${productId}/attributes/${attributeId}/`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Product Variants
  getProductVariants: async productId => {
    try {
      const response = await apiClient.get(`/products/${productId}/variants/`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  createProductVariant: async (productId, variantData) => {
    try {
      const response = await apiClient.post(`/products/${productId}/variants/`, variantData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  updateProductVariant: async (productId, variantId, variantData) => {
    try {
      const response = await apiClient.patch(
        `/products/${productId}/variants/${variantId}/`,
        variantData
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  deleteProductVariant: async (productId, variantId) => {
    try {
      const response = await apiClient.delete(`/products/${productId}/variants/${variantId}/`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Inventory Management
  updateStock: async (productId, stockData) => {
    try {
      const response = await apiClient.post(`/products/${productId}/update-stock/`, stockData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getInventoryStatus: async productId => {
    try {
      const response = await apiClient.get(`/products/${productId}/inventory/`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getLowStockProducts: async (threshold = 10) => {
    try {
      const response = await apiClient.get(`/products/low-stock/?threshold=${threshold}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Bulk Operations (admin only)
  bulkUpdateProducts: async bulkData => {
    try {
      const response = await apiClient.post('/products/bulk-update/', bulkData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  bulkDeleteProducts: async productIds => {
    try {
      const response = await apiClient.post('/products/bulk-delete/', {
        product_ids: productIds,
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Product Analytics
  getProductAnalytics: async (params = {}) => {
    try {
      const queryString = buildQueryString(params);
      const url = queryString ? `/products/analytics/?${queryString}` : '/products/analytics/';
      const response = await apiClient.get(url);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getProductPerformance: async (productId, period = '30d') => {
    try {
      const response = await apiClient.get(`/products/${productId}/performance/?period=${period}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Product Price History
  getPriceHistory: async productId => {
    try {
      const response = await apiClient.get(`/products/${productId}/price-history/`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  updatePrice: async (productId, priceData) => {
    try {
      const response = await apiClient.post(`/products/${productId}/update-price/`, priceData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Product Comparison
  compareProducts: async productIds => {
    try {
      const response = await apiClient.post('/products/compare/', {
        product_ids: productIds,
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Product Duplication
  duplicateProduct: async productId => {
    try {
      const response = await apiClient.post(`/products/${productId}/duplicate/`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Product Reviews Summary
  getReviewsSummary: async productId => {
    try {
      const response = await apiClient.get(`/products/${productId}/reviews/summary/`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Product Export/Import (admin only)
  exportProducts: async (filters = {}) => {
    try {
      const queryString = buildQueryString(filters);
      const url = queryString ? `/products/export/?${queryString}` : '/products/export/';
      const response = await apiClient.get(url, { responseType: 'blob' });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  importProducts: async (file, options = {}) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      Object.entries(options).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const response = await fileUploadClient.post('/products/import/', formData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Product Statistics
  getProductStats: async () => {
    try {
      const response = await apiClient.get('/products/stats/');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Product View Tracking
  incrementViewCount: async productId => {
    try {
      const response = await apiClient.post(`/products/${productId}/view/`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Product Availability Check
  checkAvailability: async (productId, quantity = 1) => {
    try {
      const response = await apiClient.post(`/products/${productId}/check-availability/`, {
        quantity,
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Product Filters and Options
  getProductFilters: async (categoryId = null) => {
    try {
      const params = categoryId ? { category: categoryId } : {};
      const queryString = buildQueryString(params);
      const url = queryString ? `/products/filters/?${queryString}` : '/products/filters/';
      const response = await apiClient.get(url);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Utility Functions
  formatProductData: product => {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.short_description,
      price: parseFloat(product.price),
      originalPrice: product.original_price ? parseFloat(product.original_price) : null,
      category: product.category,
      isInStock: product.is_in_stock,
      stockQuantity: product.stock_quantity,
      isOnSale: product.is_on_sale,
      discountPercentage: product.discount_percentage,
      rating: product.rating_average ? parseFloat(product.rating_average) : 0,
      reviewCount: product.review_count,
      imageUrl: product.image_url,
      thumbnailUrl: product.thumbnail_url,
      images: product.images || [],
      attributes: product.attributes || [],
      variants: product.variants || [],
      tags: product.tags ? product.tags.split(',').map(tag => tag.trim()) : [],
      createdAt: new Date(product.created_at),
      updatedAt: new Date(product.updated_at),
    };
  },

  formatPrice: (price, currency = 'UGX') => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  },

  calculateSavings: (originalPrice, currentPrice) => {
    if (!originalPrice || originalPrice <= currentPrice) return 0;
    return originalPrice - currentPrice;
  },

  calculateDiscountPercentage: (originalPrice, currentPrice) => {
    if (!originalPrice || originalPrice <= currentPrice) return 0;
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  },

  getStockStatus: product => {
    if (!product.track_inventory) return 'available';
    if (product.stock_quantity === 0) return 'out_of_stock';
    if (product.stock_quantity <= product.low_stock_threshold) return 'low_stock';
    return 'in_stock';
  },

  getStockStatusText: status => {
    const statusMap = {
      available: 'Available',
      in_stock: 'In Stock',
      low_stock: 'Low Stock',
      out_of_stock: 'Out of Stock',
    };
    return statusMap[status] || 'Unknown';
  },

  getStockStatusColor: status => {
    const colorMap = {
      available: 'green',
      in_stock: 'green',
      low_stock: 'orange',
      out_of_stock: 'red',
    };
    return colorMap[status] || 'gray';
  },

  validateProductData: productData => {
    const errors = {};

    if (!productData.name || productData.name.trim().length < 3) {
      errors.name = 'Product name must be at least 3 characters long';
    }

    if (!productData.description || productData.description.trim().length < 10) {
      errors.description = 'Product description must be at least 10 characters long';
    }

    if (!productData.price || productData.price <= 0) {
      errors.price = 'Price must be greater than 0';
    }

    if (productData.original_price && productData.original_price < productData.price) {
      errors.original_price = 'Original price cannot be less than current price';
    }

    if (!productData.category) {
      errors.category = 'Category is required';
    }

    if (productData.track_inventory && productData.stock_quantity < 0) {
      errors.stock_quantity = 'Stock quantity cannot be negative';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  buildProductFormData: (productData, images = []) => {
    const formData = new FormData();

    // Add basic product data
    Object.entries(productData).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(item => formData.append(key, item));
        } else {
          formData.append(key, value);
        }
      }
    });

    // Add images
    images.forEach((image, index) => {
      if (image instanceof File) {
        formData.append('images_data', image);
      }
    });

    return formData;
  },
};

export default productsAPI;
