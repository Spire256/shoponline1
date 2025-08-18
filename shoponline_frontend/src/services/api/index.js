// src/services/api/index.js
// Central export point for all API modules

// Export API clients and utilities
// You can also create a combined API object if preferred
import authAPI from './authAPI';
import categoriesAPI from './categoriesAPI';
import productsAPI from './productsAPI';

export {
  default as apiClient,
  fileUploadClient,
  handleApiResponse,
  handleApiError,
  buildQueryString,
  formatCurrency,
  formatDate,
} from './apiClient';

// Export individual API modules
export { default as authAPI } from './authAPI';
export { default as categoriesAPI } from './categoriesAPI';
export { default as productsAPI } from './productsAPI';

export const API = {
  auth: authAPI,
  categories: categoriesAPI,
  products: productsAPI,
};

export default API;
