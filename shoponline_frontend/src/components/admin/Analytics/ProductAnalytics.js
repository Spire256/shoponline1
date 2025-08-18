import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Package,
  TrendingUp,
  AlertTriangle,
  Star,
  Eye,
  ShoppingCart,
  DollarSign,
} from 'lucide-react';

const ProductAnalytics = () => {
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch product performance data
  const fetchProductData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/analytics/product_performance/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch product data');

      const data = await response.json();
      setProductData(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchProductData();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Format currency
  const formatCurrency = amount => `UGX ${amount.toLocaleString()}`;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg" />
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error loading product analytics</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Product Analytics</h1>
        <p className="text-gray-600">Monitor product performance and inventory insights</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Low Stock Products</p>
              <p className="text-2xl font-bold text-orange-600">
                {productData?.low_stock?.length || 0}
              </p>
              <p className="text-xs text-gray-500">Requires attention</p>
            </div>
            <div className="p-3 bg-orange-500 rounded-full">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">
                {productData?.out_of_stock_count || 0}
              </p>
              <p className="text-xs text-gray-500">Products unavailable</p>
            </div>
            <div className="p-3 bg-red-500 rounded-full">
              <Package className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Top Products</p>
              <p className="text-2xl font-bold text-green-600">
                {productData?.top_selling?.length || 0}
              </p>
              <p className="text-xs text-gray-500">Best performers</p>
            </div>
            <div className="p-3 bg-green-500 rounded-full">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Selling Products Chart */}
      {productData?.top_selling && productData.top_selling.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Top Selling Products (Last 30 Days)
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={productData.top_selling.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="product__name"
                stroke="#6b7280"
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fontSize: 12 }}
              />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(value, name) => [
                  name === 'total_revenue' ? formatCurrency(value) : value,
                  name === 'total_revenue' ? 'Revenue' : 'Quantity Sold',
                ]}
              />
              <Legend />
              <Bar dataKey="total_quantity" fill="#3b82f6" name="Quantity Sold" />
              <Bar dataKey="total_revenue" fill="#10b981" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Products Table */}
      {productData?.top_selling && productData.top_selling.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Best Performing Products</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity Sold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productData.top_selling.slice(0, 10).map((product, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.product__name}
                          </div>
                          <div className="text-sm text-gray-500">#{index + 1} Best Seller</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(product.product__price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ShoppingCart className="h-4 w-4 text-blue-500 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {product.total_quantity}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(product.total_revenue)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm text-green-600 font-medium">Excellent</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Products */}
        {productData?.low_stock && productData.low_stock.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Low Stock Alert</h3>
              <div className="flex items-center text-orange-600">
                <AlertTriangle className="h-5 w-5 mr-1" />
                <span className="text-sm font-medium">{productData.low_stock.length} items</span>
              </div>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {productData.low_stock.slice(0, 10).map((product, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-lg bg-orange-200 flex items-center justify-center">
                        <Package className="h-5 w-5 text-orange-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{formatCurrency(product.price)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-orange-600">
                      {product.stock_quantity} left
                    </div>
                    <div className="text-xs text-gray-500">Low stock</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Product Performance Insights */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Insights</h3>
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium text-blue-900">Sales Trend</p>
                  <p className="text-sm text-blue-700">
                    Top 10 products generate{' '}
                    {productData?.top_selling
                      ? Math.round(
                        (productData.top_selling
                          .slice(0, 10)
                          .reduce((sum, p) => sum + p.total_revenue, 0) /
                            productData.top_selling.reduce((sum, p) => sum + p.total_revenue, 0)) *
                            100
                      )
                      : 0}
                    % of total revenue
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                <div>
                  <p className="font-medium text-yellow-900">Inventory Alert</p>
                  <p className="text-sm text-yellow-700">
                    {productData?.low_stock?.length || 0} products need restocking soon
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center">
                <Package className="h-5 w-5 text-red-600 mr-3" />
                <div>
                  <p className="font-medium text-red-900">Out of Stock</p>
                  <p className="text-sm text-red-700">
                    {productData?.out_of_stock_count || 0} products are currently unavailable
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <Star className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <p className="font-medium text-green-900">Top Performer</p>
                  <p className="text-sm text-green-700">
                    {productData?.top_selling?.[0]?.product__name || 'No data'} is your best seller
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductAnalytics;
