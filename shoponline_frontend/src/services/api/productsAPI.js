// src/services/api/productsAPI.js - Updated for backend integration
import apiClient, {
  fileUploadClient,
  handleApiResponse,
  handleApiError,
  buildQueryString,
} from './apiClient';

const productsAPI = {
  // Get all products with filtering and pagination - ALIGNED WITH BACKEND
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

  // Get single product by slug - BACKEND EXPECTS ID NOT SLUG
  getProduct: async productId => {
    try {
      const response = await apiClient.get(`/products/${productId}/`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get product by slug (separate endpoint for frontend routing)
  getProductBySlug: async slug => {
    try {
      const response = await apiClient.get(`/products/?slug=${slug}`);
      const products = handleApiResponse(response);
      if (products.results && products.results.length > 0) {
        return products.results[0];
      }
      throw new Error('Product not found');
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Create new product (admin only) - FIXED FORM DATA STRUCTURE
  createProduct: async productData => {
    try {
      const formData = new FormData();
      
      // Handle basic product data
      Object.keys(productData).forEach(key => {
        if (key === 'images_data' || key === 'attributes_data' || key === 'variants_data') {
          return; // Handle these separately
        }
        if (productData[key] !== null && productData[key] !== undefined && productData[key] !== '') {
          formData.append(key, productData[key]);
        }
      });

      // Handle images
      if (productData.images_data && Array.isArray(productData.images_data)) {
        productData.images_data.forEach(image => {
          formData.append('images_data', image);
        });
      }

      // Handle attributes as JSON string (backend expects this format)
      if (productData.attributes_data && Array.isArray(productData.attributes_data)) {
        formData.append('attributes_data', JSON.stringify(productData.attributes_data));
      }

      // Handle variants as JSON string
      if (productData.variants_data && Array.isArray(productData.variants_data)) {
        formData.append('variants_data', JSON.stringify(productData.variants_data));
      }

      const response = await fileUploadClient.post('/products/', formData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update product (admin only) - FIXED PARTIAL UPDATE
  updateProduct: async (productId, productData) => {
    try {
      const formData = new FormData();
      
      // Handle basic product data
      Object.keys(productData).forEach(key => {
        if (key === 'images_data' || key === 'attributes_data' || key === 'variants_data') {
          return;
        }
        if (productData[key] !== null && productData[key] !== undefined) {
          formData.append(key, productData[key]);
        }
      });

      // Handle new images if provided
      if (productData.images_data && Array.isArray(productData.images_data)) {
        productData.images_data.forEach(image => {
          formData.append('images_data', image);
        });
      }

      // Handle attributes update
      if (productData.attributes_data) {
        formData.append('attributes_data', JSON.stringify(productData.attributes_data));
      }

      // Handle variants update
      if (productData.variants_data) {
        formData.append('variants_data', JSON.stringify(productData.variants_data));
      }

      const response = await fileUploadClient.patch(`/products/${productId}/`, formData);
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

  // Get featured products - ALIGNED WITH BACKEND ENDPOINT
  getFeaturedProducts: async (params = {}) => {
    try {
      const queryParams = { is_featured: true, is_active: true, ...params };
      const queryString = buildQueryString(queryParams);
      const response = await apiClient.get(`/products/?${queryString}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Search products - FIXED TO MATCH BACKEND SEARCH ENDPOINT
  searchProducts: async (query, filters = {}) => {
    try {
      const params = { search: query, ...filters };
      const queryString = buildQueryString(params);
      const response = await apiClient.get(`/products/?${queryString}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get products by category - FIXED CATEGORY FILTERING
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

  // Product Images - NESTED ROUTER ENDPOINTS
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
      if (imageData.alt_text) formData.append('alt_text', imageData.alt_text);
      if (imageData.caption) formData.append('caption', imageData.caption);
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

  // Reorder product images - CUSTOM ENDPOINT
  reorderProductImages: async (productId, imageOrders) => {
    try {
      const response = await apiClient.post(`/products/${productId}/images/reorder/`, {
        image_orders: imageOrders
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Set main image
  setMainProductImage: async (productId, imageId) => {
    try {
      const response = await apiClient.post(`/products/${productId}/images/${imageId}/set_main/`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Product Attributes - NESTED ENDPOINTS
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

  // Product Variants - NESTED ENDPOINTS
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

  // Bulk Operations (admin only) - BACKEND BULK_UPDATE ACTION
  bulkUpdateProducts: async bulkData => {
    try {
      const response = await apiClient.post('/products/bulk_update/', bulkData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Product Analytics - BACKEND STATS ENDPOINT
  getProductStats: async () => {
    try {
      const response = await apiClient.get('/products/stats/');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Product Analytics with filters
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

  // Top products - BACKEND TOP ENDPOINT
  getTopProducts: async (criteria = 'views', limit = 10) => {
    try {
      const response = await apiClient.get(`/products/top/?criteria=${criteria}&limit=${limit}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Product recommendations - BACKEND RECOMMENDATIONS ENDPOINT
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

  // Export products - BACKEND EXPORT ENDPOINT
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

  // Import products - BACKEND IMPORT ENDPOINT
  importProducts: async (file, options = {}) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      Object.entries(options).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const response = await fileUploadClient.post('/products/import_products/', formData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Increment view count - SIMPLE POST TO PRODUCT
  incrementViewCount: async productId => {
    try {
      // Simple approach - increment via retrieve call or custom endpoint
      const response = await apiClient.post(`/products/${productId}/increment_view/`);
      return handleApiResponse(response);
    } catch (error) {
      // If custom endpoint doesn't exist, just fetch the product (backend handles increment in retrieve)
      try {
        await apiClient.get(`/products/${productId}/`);
        return { success: true };
      } catch (fallbackError) {
        throw handleApiError(error);
      }
    }
  },

  // Duplicate product - BACKEND DUPLICATE ACTION
  duplicateProduct: async productId => {
    try {
      const response = await apiClient.post(`/products/${productId}/duplicate/`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Compare products - BACKEND COMPARE ENDPOINT
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

  // Quick edit product - PATCH REQUEST FOR QUICK UPDATES
  quickEditProduct: async (productId, quickData) => {
    try {
      const response = await apiClient.patch(`/products/${productId}/`, quickData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Inventory management - BULK INVENTORY UPDATE
  updateInventory: async inventoryUpdates => {
    try {
      const response = await apiClient.post('/products/inventory/', {
        updates: inventoryUpdates
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get low stock products - BACKEND LOW-STOCK ENDPOINT
  getLowStockProducts: async (threshold = null) => {
    try {
      const params = threshold ? { threshold } : {};
      const queryString = buildQueryString(params);
      const url = queryString ? `/products/inventory/?${queryString}` : '/products/inventory/';
      const response = await apiClient.get(url);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Utility Functions - FIXED FOR BACKEND DATA FORMAT
  formatProductData: product => {
    if (!product) return null;
    
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
      // Additional fields from backend
      brand: product.brand,
      model: product.model,
      sku: product.sku,
      condition: product.condition,
      status: product.status,
      isActive: product.is_active,
      isFeatured: product.is_featured,
      isDigital: product.is_digital,
      requiresShipping: product.requires_shipping,
      trackInventory: product.track_inventory,
      allowBackorders: product.allow_backorders,
      weight: product.weight,
      dimensions: product.dimensions,
      color: product.color,
      size: product.size,
      material: product.material,
      viewCount: product.view_count,
      orderCount: product.order_count,
    };
  },

  // Format price for Uganda Shillings
  formatPrice: (price, currency = 'UGX') => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  },

  // Get stock status with backend alignment
  getStockStatus: product => {
    if (!product.track_inventory) return 'available';
    if (product.stock_quantity === 0) return 'out_of_stock';
    if (product.stock_quantity <= (product.low_stock_threshold || 10)) return 'low_stock';
    return 'in_stock';
  },

  // Validate product data for backend submission
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

    if (productData.track_inventory && (!productData.stock_quantity || productData.stock_quantity < 0)) {
      errors.stock_quantity = 'Stock quantity must be 0 or greater when tracking inventory';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};

export default productsAPI;