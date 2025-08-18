import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Clock, Target } from 'lucide-react';

const FlashSalesAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30days');

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      // Mock API call - replace with actual API endpoint
      const response = await fetch(
        `/api/admin/analytics/flash-sales-performance/?period=${selectedPeriod}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for demonstration - remove when connecting to real API
  const mockData = {
    active_sales: 5,
    revenue: {
      total_revenue: 15420000,
      total_quantity: 312,
    },
    top_sales: [
      {
        id: 1,
        name: 'Weekend Electronics Sale',
        discount_percentage: 25.0,
        products_count: 45,
        total_orders: 156,
        start_time: '2024-08-01T08:00:00Z',
        end_time: '2024-08-03T23:59:59Z',
        is_active: false,
      },
      {
        id: 2,
        name: 'Flash Friday Fashion',
        discount_percentage: 40.0,
        products_count: 32,
        total_orders: 89,
        start_time: '2024-08-02T12:00:00Z',
        end_time: '2024-08-02T23:59:59Z',
        is_active: false,
      },
      {
        id: 3,
        name: 'Back to School Special',
        discount_percentage: 30.0,
        products_count: 28,
        total_orders: 67,
        start_time: '2024-08-05T06:00:00Z',
        end_time: '2024-08-07T23:59:59Z',
        is_active: true,
      },
    ],
    performance_metrics: [
      { name: 'Total Sales', value: 15420000, change: 12.5, trend: 'up' },
      { name: 'Orders Count', value: 312, change: 8.3, trend: 'up' },
      { name: 'Avg Order Value', value: 49423, change: -2.1, trend: 'down' },
      { name: 'Conversion Rate', value: 3.8, change: 5.2, trend: 'up' },
    ],
    monthly_performance: [
      { month: 'Jan', revenue: 2500000, orders: 58 },
      { month: 'Feb', revenue: 3200000, orders: 72 },
      { month: 'Mar', revenue: 2800000, orders: 61 },
      { month: 'Apr', revenue: 4100000, orders: 89 },
      { month: 'May', revenue: 3900000, orders: 85 },
      { month: 'Jun', revenue: 4500000, orders: 98 },
      { month: 'Jul', revenue: 5200000, orders: 112 },
      { month: 'Aug', revenue: 3100000, orders: 67 },
    ],
    discount_distribution: [
      { name: '10-20%', value: 35, color: '#3b82f6' },
      { name: '21-30%', value: 28, color: '#1e40af' },
      { name: '31-50%', value: 22, color: '#60a5fa' },
      { name: '50%+', value: 15, color: '#2563eb' },
    ],
  };

  const data = analyticsData || mockData;

  const formatCurrency = amount => {
    return `UGX ${amount.toLocaleString()}`;
  };

  const formatPercentage = value => {
    return `${value}%`;
  };

  const MetricCard = ({ title, value, change, trend, icon: Icon, format = 'number' }) => {
    let formattedValue = value;
    if (format === 'currency') formattedValue = formatCurrency(value);
    if (format === 'percentage') formattedValue = formatPercentage(value);
    if (format === 'number') formattedValue = value.toLocaleString();

    return (
      <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{formattedValue}</p>
            {change !== undefined && (
              <div className="flex items-center mt-2">
                {trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span
                  className={`text-sm font-medium ${
                    trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {Math.abs(change)}% {trend === 'up' ? 'increase' : 'decrease'}
                </span>
              </div>
            )}
          </div>
          <div className="ml-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl" />
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Analytics</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={fetchAnalyticsData}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Flash Sales Analytics</h1>
          <p className="text-gray-600">Monitor flash sales performance and insights</p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="1year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Revenue"
          value={data.revenue.total_revenue}
          change={data.performance_metrics?.[0]?.change}
          trend={data.performance_metrics?.[0]?.trend}
          icon={DollarSign}
          format="currency"
        />
        <MetricCard
          title="Total Orders"
          value={data.revenue.total_quantity}
          change={data.performance_metrics?.[1]?.change}
          trend={data.performance_metrics?.[1]?.trend}
          icon={ShoppingCart}
          format="number"
        />
        <MetricCard
          title="Active Flash Sales"
          value={data.active_sales}
          icon={Clock}
          format="number"
        />
        <MetricCard
          title="Conversion Rate"
          value={data.performance_metrics?.[3]?.value || 3.8}
          change={data.performance_metrics?.[3]?.change}
          trend={data.performance_metrics?.[3]?.trend}
          icon={Target}
          format="percentage"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.monthly_performance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
              <XAxis
                dataKey="month"
                stroke="#64748b"
                fontSize={12}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickFormatter={value => `${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip
                formatter={(value, name) => [
                  name === 'revenue' ? formatCurrency(value) : value,
                  name === 'revenue' ? 'Revenue' : 'Orders',
                ]}
                labelStyle={{ color: '#374151' }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                name="Revenue"
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={{ fill: '#60a5fa', strokeWidth: 2, r: 3 }}
                name="Orders"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Discount Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Discount Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.discount_distribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {data.discount_distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={value => [`${value}%`, 'Percentage']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Performing Flash Sales */}
      <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Performing Flash Sales</h3>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                  Sale Name
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                  Discount
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                  Products
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Orders</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody>
              {data.top_sales.map((sale, index) => (
                <tr
                  key={sale.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="font-medium text-gray-900">{sale.name}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {sale.discount_percentage}% OFF
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-600">{sale.products_count}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">{sale.total_orders}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        sale.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {sale.is_active ? 'Active' : 'Ended'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {new Date(sale.start_time).toLocaleDateString()} -{' '}
                    {new Date(sale.end_time).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FlashSalesAnalytics;