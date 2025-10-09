// src/components/admin/Products/ProductManagement.js - Aligned with backend API
import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Copy,
  Package,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  MoreVertical,
  X,
} from 'lucide-react';
import productsAPI from '../../../services/api/productsAPI';
import categoriesAPI from '../../../services/api/categoriesAPI';
import LoadingSpinner from '../../common/UI/Loading/Spinner';
import Alert from '../../common/UI/Alert/Alert';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    stock: '',
    featured: '',
    active: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 25,
    total: 0,
    total_pages: 0,
  });
  const [stats, setStats] = useState({
    total_products: 0,
    active_products: 0,
    featured_products: 0,
    low_stock_products: 0,
    out_of_stock_products: 0,
  });
  const [bulkActionModal, setBulkActionModal] = useState(false);
  const [filterPanel, setFilterPanel] = useState(false);
  const [sortBy, setSortBy] = useState('-created_at');
  const [error, setError] = useState(null);

  // Load initial data with proper error handling
  useEffect(() => {
    loadInitialData();
  }, []);

  // Fetch products when dependencies change with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [pagination.page, pagination.page_size, searchTerm, filters, sortBy]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load stats and categories in parallel with proper error handling
      const [statsResponse, categoriesResponse] = await Promise.allSettled([
        productsAPI.getProductStats(),
        categoriesAPI.getCategoriesWithCache({ page_size: 100, is_active: true })
      ]);

      // Handle stats response
      if (statsResponse.status === 'fulfilled' && statsResponse.value) {
        setStats(statsResponse.value);
      } else {
        console.warn('Failed to load product stats:', statsResponse.reason);
        // Keep default stats structure
      }

      // Handle categories response
      if (categoriesResponse.status === 'fulfilled' && categoriesResponse.value) {
        const categoriesData = categoriesResponse.value.results || categoriesResponse.value || [];
        setCategories(categoriesData);
      } else {
        console.warn('Failed to load categories:', categoriesResponse.reason);
        setCategories([]);
      }

    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Failed to load initial data. Some features may not work correctly.');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced fetch products with better error handling
  const fetchProducts = useCallback(async () => {
    try {
      setError(null);
      
      // Don't show loading spinner for subsequent fetches
      if (products.length === 0) {
        setLoading(true);
      }

      const params = {
        page: pagination.page,
        page_size: pagination.page_size,
        ordering: sortBy,
      };

      // Add search term with proper trimming
      const trimmedSearch = searchTerm.trim();
      if (trimmedSearch) {
        params.search = trimmedSearch;
      }

      // Add filters with proper backend parameter mapping
      Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value && value !== '') {
          switch (key) {
            case 'category':
              params.category = value;
              break;
            case 'status':
              // Map frontend status to backend status values
              if (['draft', 'published', 'archived'].includes(value)) {
                params.status = value;
              }
              break;
            case 'stock':
              // Map stock filters to backend parameters
              if (value === 'in_stock') {
                params.stock_quantity__gt = 0;
                params.track_inventory = true;
              } else if (value === 'low_stock') {
                params.low_stock = true;
              } else if (value === 'out_of_stock') {
                params.stock_quantity = 0;
                params.track_inventory = true;
              }
              break;
            case 'featured':
              params.is_featured = value === 'true';
              break;
            case 'active':
              params.is_active = value === 'true';
              break;
          }
        }
      });

      const response = await productsAPI.getProducts(params);

      if (response && typeof response === 'object') {
        // Handle both paginated and direct array responses
        const productsData = response.results || response;
        const totalCount = response.count || (Array.isArray(productsData) ? productsData.length : 0);

        setProducts(Array.isArray(productsData) ? productsData : []);
        setPagination(prev => ({
          ...prev,
          total: totalCount,
          total_pages: Math.ceil(totalCount / prev.page_size),
        }));
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(`Failed to load products: ${error.message || 'Please try again.'}`);
      // Don't clear existing products on error to maintain UI state
      if (products.length === 0) {
        setProducts([]);
      }
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.page_size, searchTerm, filters, sortBy, products.length]);

  // Handle search with form submission
  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle filter change with validation
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value,
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle sort change
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle pagination with bounds checking
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  // Handle product selection
  const handleProductSelect = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  // Handle select all with current page products
  const handleSelectAll = () => {
    const currentPageProductIds = products.map(product => product.id);
    if (selectedProducts.length === currentPageProductIds.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(currentPageProductIds);
    }
  };

  // Enhanced bulk actions with better error handling
  const handleBulkAction = async (action) => {
    if (selectedProducts.length === 0) {
      setError('Please select products to perform bulk actions.');
      return;
    }

    setActionLoading(true);
    try {
      let bulkData = {
        product_ids: selectedProducts,
        action: action,
      };

      // Map frontend actions to backend actions
      const actionMapping = {
        'activate': 'activate',
        'deactivate': 'deactivate', 
        'feature': 'set_featured',
        'unfeature': 'unset_featured',
        'delete': 'delete'
      };

      if (actionMapping[action]) {
        bulkData.action = actionMapping[action];
      }

      // Confirm destructive actions
      if (action === 'delete') {
        if (!window.confirm(`Are you sure you want to delete ${selectedProducts.length} products? This action cannot be undone.`)) {
          return;
        }
      }

      const response = await productsAPI.bulkUpdateProducts(bulkData);
      
      if (response) {
        // Refresh data after successful bulk action
        await Promise.allSettled([
          fetchProducts(),
          loadInitialData()
        ]);
        
        setSelectedProducts([]);
        setBulkActionModal(false);
        
        // Show success message
        setError(null);
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      setError(`Failed to ${action} products: ${error.message || 'Please try again.'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Enhanced export with proper blob handling
  const handleExport = async () => {
    try {
      setActionLoading(true);
      setError(null);
      
      const blob = await productsAPI.exportProducts(filters);
      
      if (blob instanceof Blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Invalid export data received');
      }
    } catch (error) {
      console.error('Error exporting products:', error);
      setError(`Export failed: ${error.message || 'Please try again.'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Enhanced individual product actions
  const handleProductAction = async (action, productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) {
      setError('Product not found.');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      
      switch (action) {
        case 'duplicate':
          await productsAPI.duplicateProduct(productId);
          await fetchProducts();
          break;
        case 'delete':
          if (window.confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
            await productsAPI.deleteProduct(productId);
            await Promise.allSettled([fetchProducts(), loadInitialData()]);
          }
          break;
        case 'toggle_active':
          await productsAPI.quickEditProduct(productId, {
            is_active: !product.is_active
          });
          await fetchProducts();
          break;
        case 'toggle_featured':
          await productsAPI.quickEditProduct(productId, {
            is_featured: !product.is_featured
          });
          await fetchProducts();
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      setError(`Failed to ${action} product: ${error.message || 'Please try again.'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Utility functions with proper error handling
  const formatCurrency = (amount) => {
    try {
      const numAmount = parseFloat(amount) || 0;
      return new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: 'UGX',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(numAmount);
    } catch (error) {
      return `UGX ${amount || 0}`;
    }
  };

  const getStockStatusColor = (product) => {
    if (!product.track_inventory) return 'text-blue-600 bg-blue-50';
    const stockQuantity = parseInt(product.stock_quantity) || 0;
    const lowStockThreshold = parseInt(product.low_stock_threshold) || 10;
    
    if (stockQuantity === 0) return 'text-red-600 bg-red-50';
    if (stockQuantity <= lowStockThreshold) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getStatusColor = (product) => {
    if (!product.is_active) return 'text-gray-600 bg-gray-50';
    if (product.status === 'published') return 'text-green-600 bg-green-50';
    if (product.status === 'draft') return 'text-yellow-600 bg-yellow-50';
    if (product.status === 'archived') return 'text-gray-600 bg-gray-50';
    return 'text-blue-600 bg-blue-50';
  };

  const getStockStatusText = (product) => {
    if (!product.track_inventory) return 'Not Tracked';
    const stockQuantity = parseInt(product.stock_quantity) || 0;
    const lowStockThreshold = parseInt(product.low_stock_threshold) || 10;
    
    if (stockQuantity === 0) return 'Out of Stock';
    if (stockQuantity <= lowStockThreshold) return 'Low Stock';
    return 'In Stock';
  };

  const getStatusText = (product) => {
    if (!product.is_active) return 'Inactive';
    return (product.status || 'draft').charAt(0).toUpperCase() + (product.status || 'draft').slice(1);
  };

  // Show loading screen only on initial load
  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Product Management</h1>
            <p className="text-slate-600 mt-2">Manage your product inventory and listings</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {actionLoading ? 'Exporting...' : 'Export'}
            </button>
            <button 
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              title="Import Products (Coming Soon)"
              disabled
            >
              <Upload className="w-4 h-4" />
              Import Products
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6">
            <Alert type="error" title="Error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Products</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total_products || 0}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Products</p>
                <p className="text-2xl font-bold text-green-600">{stats.active_products || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Featured</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.featured_products || 0}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Low Stock</p>
                <p className="text-2xl font-bold text-orange-600">{stats.low_stock_products || 0}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.out_of_stock_products || 0}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 max-w-md">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search products by name, SKU, or description..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </form>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setFilterPanel(!filterPanel)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                filterPanel 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            {selectedProducts.length > 0 && (
              <button
                onClick={() => setBulkActionModal(true)}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Processing...' : `Bulk Actions (${selectedProducts.length})`}
              </button>
            )}
          </div>
        </div>

        {/* Filter Panel */}
        {filterPanel && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mt-4 pt-4 border-t border-slate-200">
            <select
              value={filters.category}
              onChange={e => handleFilterChange('category', e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={e => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <select
              value={filters.stock}
              onChange={e => handleFilterChange('stock', e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Stock</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
            <select
              value={filters.featured}
              onChange={e => handleFilterChange('featured', e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Products</option>
              <option value="true">Featured Only</option>
              <option value="false">Not Featured</option>
            </select>
            <select
              value={filters.active}
              onChange={e => handleFilterChange('active', e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
            <select
              value={sortBy}
              onChange={e => handleSortChange(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="-created_at">Newest First</option>
              <option value="created_at">Oldest First</option>
              <option value="name">Name A-Z</option>
              <option value="-name">Name Z-A</option>
              <option value="price">Price Low-High</option>
              <option value="-price">Price High-Low</option>
              <option value="-view_count">Most Viewed</option>
              <option value="-order_count">Best Selling</option>
            </select>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === products.length && products.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <LoadingSpinner />
                      <span className="ml-3 text-slate-600">Loading products...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                    {searchTerm || Object.values(filters).some(f => f) 
                      ? 'No products found matching your criteria' 
                      : 'No products found. Add your first product to get started.'}
                  </td>
                </tr>
              ) : (
                products.map(product => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleProductSelect(product.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={product.image_url || product.thumbnail_url || '/api/placeholder/60/60'}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover mr-4"
                          onError={(e) => {
                            e.target.src = '/api/placeholder/60/60';
                          }}
                        />
                        <div>
                          <div className="flex items-center">
                            <p className="font-medium text-slate-900" title={product.name}>
                              {product.name}
                            </p>
                            {product.is_featured && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Featured
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500">
                            SKU: {product.sku || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {typeof product.category === 'object' 
                        ? (product.category?.name || 'Uncategorized')
                        : (product.category || 'Uncategorized')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-slate-900">
                          {formatCurrency(product.price)}
                        </p>
                        {product.original_price && product.original_price > product.price && (
                          <p className="text-xs text-slate-500 line-through">
                            {formatCurrency(product.original_price)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatusColor(product)}`}
                      >
                        {getStockStatusText(product)}
                      </span>
                      {product.track_inventory && (
                        <p className="text-xs text-slate-500 mt-1">
                          {product.stock_quantity || 0} units
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(product)}`}
                      >
                        {getStatusText(product)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button 
                          className="text-blue-600 hover:text-blue-700 p-1" 
                          title="View Product"
                          onClick={() => window.open(`/products/${product.slug || product.id}`, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          className="text-green-600 hover:text-green-700 p-1" 
                          title="Edit Product"
                          onClick={() => window.location.href = `/admin/products/${product.id}/edit`}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleProductAction('duplicate', product.id)}
                          className="text-gray-600 hover:text-gray-700 p-1" 
                          title="Duplicate Product"
                          disabled={actionLoading}
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <div className="relative group">
                          <button 
                            className="text-slate-600 hover:text-slate-700 p-1" 
                            title="More actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {/* Dropdown menu */}
                          <div className="absolute right-0 top-8 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                            <button
                              onClick={() => handleProductAction('toggle_active', product.id)}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 first:rounded-t-lg"
                              disabled={actionLoading}
                            >
                              {product.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleProductAction('toggle_featured', product.id)}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                              disabled={actionLoading}
                            >
                              {product.is_featured ? 'Remove Featured' : 'Mark Featured'}
                            </button>
                            <div className="border-t border-slate-200"></div>
                            <button
                              onClick={() => handleProductAction('delete', product.id)}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg"
                              disabled={actionLoading}
                            >
                              Delete Product
                            </button>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleProductAction('delete', product.id)}
                          className="text-red-600 hover:text-red-700 p-1" 
                          title="Delete Product"
                          disabled={actionLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-sm text-slate-700">
              Showing {Math.min((pagination.page - 1) * pagination.page_size + 1, pagination.total)} to{' '}
              {Math.min(pagination.page * pagination.page_size, pagination.total)} of{' '}
              {pagination.total} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Previous
              </button>
              {/* Page numbers */}
              {(() => {
                const maxVisiblePages = 5;
                const startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2));
                const endPage = Math.min(pagination.total_pages, startPage + maxVisiblePages - 1);
                const adjustedStartPage = Math.max(1, endPage - maxVisiblePages + 1);
                
                return Array.from(
                  { length: endPage - adjustedStartPage + 1 }, 
                  (_, i) => adjustedStartPage + i
                ).map(pageNumber => (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`px-3 py-2 text-sm border rounded-lg ${
                      pagination.page === pageNumber
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                ));
              })()}
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.total_pages}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Action Modal */}
      {bulkActionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Bulk Actions ({selectedProducts.length} selected)
              </h3>
              <button
                onClick={() => setBulkActionModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => handleBulkAction('activate')}
                disabled={actionLoading}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
              >
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span>Activate Products</span>
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                disabled={actionLoading}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
              >
                <Package className="w-4 h-4 text-gray-600" />
                <span>Deactivate Products</span>
              </button>
              <button
                onClick={() => handleBulkAction('feature')}
                disabled={actionLoading}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
              >
                <BarChart3 className="w-4 h-4 text-yellow-600" />
                <span>Mark as Featured</span>
              </button>
              <button
                onClick={() => handleBulkAction('unfeature')}
                disabled={actionLoading}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
              >
                <BarChart3 className="w-4 h-4 text-gray-600" />
                <span>Remove from Featured</span>
              </button>
              <div className="border-t border-slate-200 my-2"></div>
              <button
                onClick={() => handleBulkAction('delete')}
                disabled={actionLoading}
                className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Products</span>
              </button>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setBulkActionModal(false)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
            {actionLoading && (
              <div className="mt-4 flex items-center justify-center">
                <LoadingSpinner size="small" />
                <span className="ml-2 text-sm text-slate-600">Processing...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;