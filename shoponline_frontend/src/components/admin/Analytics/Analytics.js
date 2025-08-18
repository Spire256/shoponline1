import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Zap,
  ShoppingCart,
  AlertTriangle,
} from 'lucide-react';

const Analytics = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard overview data
  const fetchDashboardOverview = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/analytics/overview/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch dashboard data');

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err.message);
    }
  };

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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchDashboardOverview(), fetchSalesData(selectedPeriod)]);
      setLoading(false);
    };

    loadData();
  }, [selectedPeriod]);

  const handlePeriodChange = period => {
    setSelectedPeriod(period);
  };

  // Stats card component
  const StatsCard = ({ title, value, change, icon: Icon, color, prefix = '' }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {prefix}
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {change !== undefined && (
            <div
              className={`flex items-center mt-2 text-sm ${
                change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {change >= 0 ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              <span>{Math.abs(change)}% from yesterday</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  // Alert card component
  const AlertCard = ({ title, count, color, icon: Icon }) => (
    <div className={`${color} rounded-lg p-4 border-l-4`}>
      <div className="flex items-center">
        <Icon className="h-5 w-5 mr-3" />
        <div>
          <p className="font-medium text-gray-800">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{count}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-32 rounded-lg" />
          ))}
        </div>
        <div className="bg-gray-200 h-96 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error loading analytics</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Monitor your store performance and key metrics</p>
        </div>
        <div className="flex space-x-2">
          <select
            value={selectedPeriod}
            onChange={e => handlePeriodChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="12months">Last 12 Months</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Orders"
            value={dashboardData.totals.orders}
            change={dashboardData.today.orders_change}
            icon={ShoppingCart}
            color="bg-blue-500"
          />
          <StatsCard
            title="Today's Revenue"
            value={dashboardData.today.revenue}
            change={dashboardData.today.revenue_change}
            icon={DollarSign}
            color="bg-green-500"
            prefix="UGX "
          />
          <StatsCard
            title="Total Products"
            value={dashboardData.totals.products}
            icon={Package}
            color="bg-purple-500"
          />
          <StatsCard
            title="Total Users"
            value={dashboardData.totals.users}
            icon={Users}
            color="bg-indigo-500"
          />
        </div>
      )}

      {/* Sales Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Sales Overview</h2>
          <div className="text-sm text-gray-500">
            {selectedPeriod === '7days' && 'Last 7 Days'}
            {selectedPeriod === '30days' && 'Last 30 Days'}
            {selectedPeriod === '12months' && 'Last 12 Months'}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={salesData}>
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
              formatter={(value, name) => [
                name === 'revenue' ? `UGX ${value.toLocaleString()}` : value,
                name === 'revenue' ? 'Revenue' : 'Orders',
              ]}
            />
            <Legend />
            <Bar dataKey="orders" fill="#3b82f6" name="Orders" />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={3}
              name="Revenue"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Alerts Section */}
      {dashboardData?.alerts && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AlertCard
            title="Pending Orders"
            count={dashboardData.alerts.pending_orders}
            color="bg-yellow-50 border-yellow-400"
            icon={ShoppingCart}
          />
          <AlertCard
            title="COD Orders"
            count={dashboardData.alerts.cod_orders}
            color="bg-blue-50 border-blue-400"
            icon={DollarSign}
          />
          <AlertCard
            title="Low Stock Products"
            count={dashboardData.alerts.low_stock_products}
            color="bg-red-50 border-red-400"
            icon={Package}
          />
        </div>
      )}

      {/* Month Statistics */}
      {dashboardData?.month && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Orders</span>
                <span className="font-semibold text-gray-900">{dashboardData.month.orders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Revenue</span>
                <span className="font-semibold text-gray-900">
                  UGX {dashboardData.month.revenue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Orders Growth</span>
                <span
                  className={`font-semibold flex items-center ${
                    dashboardData.month.orders_change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {dashboardData.month.orders_change >= 0 ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(dashboardData.month.orders_change)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Revenue Growth</span>
                <span
                  className={`font-semibold flex items-center ${
                    dashboardData.month.revenue_change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {dashboardData.month.revenue_change >= 0 ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(dashboardData.month.revenue_change)}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Zap className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="text-gray-600">Active Flash Sales</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {dashboardData.totals.active_flash_sales}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ShoppingCart className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-gray-600">Today's Orders</span>
                </div>
                <span className="font-semibold text-gray-900">{dashboardData.today.orders}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-gray-600">Today's Revenue</span>
                </div>
                <span className="font-semibold text-gray-900">
                  UGX {dashboardData.today.revenue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
