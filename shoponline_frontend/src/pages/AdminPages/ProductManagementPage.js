import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Package,
  Star,
  Download,
  Upload,
  Copy,
} from 'lucide-react';

const ProductManagementPage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory, selectedStatus, sortBy, sortOrder]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockProducts = [
        {
          id: '1',
          name: 'Samsung Galaxy S24 Ultra',
          sku: 'SAMS24ULTRA',
          category: 'Smartphones',
          price: 4500000,
          originalPrice: 5000000,
          stockQuantity: 15,
          lowStockThreshold: 10,
          status: 'published',
          isActive: true,
          isFeatured: true,
          createdAt: '2024-11-15T10:30:00Z',
          imageUrl: '/api/placeholder/150/150',
          viewCount: 234,
          orderCount: 12,
        },
        {
          id: '2',
          name: 'iPhone 15 Pro Max',
          sku: 'IPH15PROMAX',
          category: 'Smartphones',
          price: 5200000,
          originalPrice: null,
          stockQuantity: 8,
          lowStockThreshold: 10,
          status: 'published',
          isActive: true,
          isFeatured: false,
          createdAt: '2024-11-14T14:20:00Z',
          imageUrl: '/api/placeholder/150/150',
          viewCount: 189,
          orderCount: 8,
        },
        {
          id: '3',
          name: 'MacBook Air M3',
          sku: 'MBAIRM3',
          category: 'Laptops',
          price: 6800000,
          originalPrice: 7200000,
          stockQuantity: 0,
          lowStockThreshold: 5,
          status: 'published',
          isActive: false,
          isFeatured: true,
          createdAt: '2024-11-13T09:15:00Z',
          imageUrl: '/api/placeholder/150/150',
          viewCount: 156,
          orderCount: 5,
        },
        {
          id: '4',
          name: 'Sony WH-1000XM5 Headphones',
          sku: 'SONYWH1000XM5',
          category: 'Audio',
          price: 890000,
          originalPrice: 1200000,
          stockQuantity: 25,
          lowStockThreshold: 15,
          status: 'draft',
          isActive: false,
          isFeatured: false,
          createdAt: '2024-11-12T16:45:00Z',
          imageUrl: '/api/placeholder/150/150',
          viewCount: 89,
          orderCount: 23,
        },
        {
          id: '5',
          name: 'Dell XPS 13 Plus',
          sku: 'DELLXPS13PLUS',
          category: 'Laptops',
          price: 4200000,
          originalPrice: null,
          stockQuantity: 12,
          lowStockThreshold: 10,
          status: 'published',
          isActive: true,
          isFeatured: false,
          createdAt: '2024-11-11T11:30:00Z',
          imageUrl: '/api/placeholder/150/150',
          viewCount: 145,
          orderCount: 7,
        },
      ];

      setProducts(mockProducts);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        product =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(product => {
        switch (selectedStatus) {
          case 'published':
            return product.status === 'published' && product.isActive;
          case 'draft':
            return product.status === 'draft';
          case 'inactive':
            return !product.isActive;
          case 'low_stock':
            return product.stockQuantity <= product.lowStockThreshold;
          case 'out_of_stock':
            return product.stockQuantity === 0;
          case 'featured':
            return product.isFeatured;
          default:
            return true;
        }
      });
    }

    // Sort products
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'price':
          aVal = a.price;
          bVal = b.price;
          break;
        case 'stock':
          aVal = a.stockQuantity;
          bVal = b.stockQuantity;
          break;
        case 'views':
          aVal = a.viewCount;
          bVal = b.viewCount;
          break;
        case 'sales':
          aVal = a.orderCount;
          bVal = b.orderCount;
          break;
        default:
          aVal = new Date(a.createdAt);
          bVal = new Date(b.createdAt);
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredProducts(filtered);
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStockStatusColor = product => {
    if (product.stockQuantity === 0) {
      return 'text-red-600 bg-red-50 border-red-200';
    } else if (product.stockQuantity <= product.lowStockThreshold) {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getStatusColor = (status, isActive) => {
    if (!isActive) {
      return 'text-gray-600 bg-gray-50 border-gray-200';
    }

    switch (status) {
      case 'published':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'draft':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleProductSelect = (productId, isSelected) => {
    if (isSelected) {
      setSelectedProducts([...selectedProducts, productId]);
    } else {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    }
  };

  const handleSelectAll = isSelected => {
    if (isSelected) {
      setSelectedProducts(filteredProducts.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleBulkAction = action => {
    console.log(`Performing bulk action: ${action} on products:`, selectedProducts);
    // Implement bulk actions here
    setSelectedProducts([]);
    setShowBulkActions(false);
  };

  const categories = ['all', ...new Set(products.map(p => p.category))];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
              <p className="text-gray-600">Manage your product catalog and inventory</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-blue-600 hover:text-blue-700 border border-blue-600 hover:border-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Import Products
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products, SKU, or category..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="inactive">Inactive</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="featured">Featured</option>
              </select>
            </div>

            <div className="flex items-center space-x-4">
              {/* Sort */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={e => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="price-asc">Price Low-High</option>
                <option value="price-desc">Price High-Low</option>
                <option value="stock-asc">Stock Low-High</option>
                <option value="stock-desc">Stock High-Low</option>
                <option value="views-desc">Most Viewed</option>
                <option value="sales-desc">Best Selling</option>
              </select>

              <button className="text-gray-600 hover:text-gray-700 border border-gray-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {filteredProducts.length} of {products.length} products
            </p>

            {selectedProducts.length > 0 && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">{selectedProducts.length} selected</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleBulkAction('activate')}
                    className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                  >
                    Activate
                  </button>
                  <button
                    onClick={() => handleBulkAction('deactivate')}
                    className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                  >
                    Deactivate
                  </button>
                  <button
                    onClick={() => handleBulkAction('feature')}
                    className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-200 transition-colors"
                  >
                    Feature
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedProducts.length === filteredProducts.length &&
                        filteredProducts.length > 0
                      }
                      onChange={e => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={e => handleProductSelect(product.id, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-12 w-12 bg-gray-200 rounded-lg mr-4 flex items-center justify-center overflow-hidden">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                        <div>
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">{product.name}</p>
                            {product.isFeatured && (
                              <Star className="h-4 w-4 text-yellow-400 ml-2" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-900">{product.category}</td>

                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{formatCurrency(product.price)}</p>
                        {product.originalPrice && (
                          <p className="text-xs text-gray-500 line-through">
                            {formatCurrency(product.originalPrice)}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStockStatusColor(
                          product
                        )}`}
                      >
                        {product.stockQuantity === 0
                          ? 'Out of Stock'
                          : product.stockQuantity <= product.lowStockThreshold
                          ? 'Low Stock'
                          : 'In Stock'}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{product.stockQuantity} units</p>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                          product.status,
                          product.isActive
                        )}`}
                      >
                        {!product.isActive
                          ? 'Inactive'
                          : product.status === 'published' 
                          ? 'Published' 
                          : 'Draft'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-600">
                        <p>{product.viewCount} views</p>
                        <p>{product.orderCount} sales</p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-700 p-1" title="View">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-700 p-1" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-700 p-1" title="Duplicate">
                          <Copy className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-700 p-1" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by adding your first product.'}
              </p>
              {!searchTerm && selectedCategory === 'all' && selectedStatus === 'all' && (
                <div className="mt-6">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center mx-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductManagementPage;