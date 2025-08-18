import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Filter,
  RefreshCw,
} from 'lucide-react';

const SalesAnalytics = () => {
  const [salesData, setSalesData] = useState([]);
  const [paymentData, setPaymentData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [selectedChart, setSelectedChart] = useState('revenue');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch sales chart data
  const fetchSalesData = async period => {
    try {
      const response = await fetch(`/api/admin/dashboard/analytics/sales_chart/?period=${period}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch sales data');

      const data = await response.json();
      setSalesData(data.data);
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch payment method analytics
  const fetchPaymentData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/analytics/payment_method_analytics/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch payment data');

      const data = await response.json();
      setPaymentData(data.payment_methods);
    } catch (err) {
      setError(err.message);
    }
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchSalesData(selectedPeriod), fetchPaymentData()]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedPeriod]);

  // Refresh data
  const refreshData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchSalesData(selectedPeriod), fetchPaymentData()]);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    return salesData.reduce(
      (acc, item) => {
        acc.totalRevenue += item.revenue;
        acc.totalOrders += item.orders;
        return acc;
      },
      { totalRevenue: 0, totalOrders: 0 }
    );
  };

  // Calculate average order value
  const calculateAOV = () => {
    const totals = calculateTotals();
    return totals.totalOrders > 0 ? totals.totalRevenue / totals.totalOrders : 0;
  };

  // Payment method colors
  const paymentColors = {
    mtn_momo: '#FFD700',
    airtel_money: '#FF4444',
    cash_on_delivery: '#4CAF50',
  };

  const getPaymentMethodName = method => {
    const names = {
      mtn_momo: 'MTN Mobile Money',
      airtel_money: 'Airtel Money',
      cash_on_delivery: 'Cash on Delivery',
    };
    return names[method] || method;
  };

  // Export data function
  const exportData = () => {
    const csvContent = [
      ['Date', 'Orders', 'Revenue'],
      ...salesData.map(item => [item.date, item.orders, item.revenue]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-analytics-${selectedPeriod}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="h-10 bg-gray-200 rounded w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg" />
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-lg" />
      </div>
    );
  }

  const totals = calculateTotals();
  const aov = calculateAOV();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Analytics</h1>
          <p className="text-gray-600">Detailed sales performance and trends</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="12months">Last 12 Months</option>
          </select>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportData}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                UGX {totals.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-500 rounded-full">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {totals.totalOrders.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-500 rounded-full">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Average Order Value</p>
              <p className="text-2xl font-bold text-gray-900">UGX {aov.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-purple-500 rounded-full">
              <Calendar className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Chart Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Sales Trends</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedChart('revenue')}
              className={`px-4 py-2 rounded-lg font-medium ${
                selectedChart === 'revenue'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setSelectedChart('orders')}
              className={`px-4 py-2 rounded-lg font-medium ${
                selectedChart === 'orders'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setSelectedChart('combined')}
              className={`px-4 py-2 rounded-lg font-medium ${
                selectedChart === 'combined'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Combined
            </button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          {selectedChart === 'revenue' && (
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" tickFormatter={value => `UGX ${value.toLocaleString()}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                formatter={value => [`UGX ${value.toLocaleString()}`, 'Revenue']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          )}

          {selectedChart === 'orders' && (
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                formatter={value => [value, 'Orders']}
              />
              <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}

          {selectedChart === 'combined' && (
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis yAxisId="left" stroke="#6b7280" />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#6b7280"
                tickFormatter={value => `UGX ${value.toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(value, name) => [
                  name === 'revenue' ? `UGX ${value.toLocaleString()}` : value,
                  name === 'revenue' ? 'Revenue' : 'Orders',
                ]}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="orders" fill="#3b82f6" name="Orders" />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={3}
                name="Revenue"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Payment Methods Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment Methods</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentData}
                dataKey="count"
                nameKey="method"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ method, percent }) =>
                  `${getPaymentMethodName(method)} ${(percent * 100).toFixed(0)}%`
                }
              >
                {paymentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={paymentColors[entry.method] || '#8884d8'} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, getPaymentMethodName(name)]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment Method Revenue</h3>
          <div className="space-y-4">
            {paymentData.map((method, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: paymentColors[method.method] || '#8884d8' }}
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      {getPaymentMethodName(method.method)}
                    </p>
                    <p className="text-sm text-gray-600">{method.count} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    UGX {method.revenue.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    {((method.revenue / totals.totalRevenue) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Daily Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AOV
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salesData.map((day, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {new Date(day.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {day.orders}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    UGX {day.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    UGX {day.orders > 0 ? (day.revenue / day.orders).toLocaleString() : '0'}
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

export default SalesAnalytics;
