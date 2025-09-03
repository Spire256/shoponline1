import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  Package, 
  Users, 
  CreditCard,
  AlertTriangle,
  Clock,
  Zap,
  Activity
} from 'lucide-react';

const DashboardStats = ({ timeRange = '7days', onRefresh }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get access token from localStorage with multiple fallbacks
      const token = localStorage.getItem('accessToken') || 
                   localStorage.getItem('access_token') || 
                   localStorage.getItem('token');

      if (!token) {
        throw new Error('No access token found');
      }

      // Fetch dashboard overview from backend
      const response = await fetch('/api/v1/admin/analytics/overview/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        }
        throw new Error(`Failed to fetch dashboard data: ${response.status}`);
      }

      const data = await response.json();
      setDashboardData(data);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'UGX 0';
    
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (number) => {
    if (!number && number !== 0) return '0';
    return new Intl.NumberFormat('en-UG').format(number);
  };

  const getChangeIcon = (change) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  const getChangeClass = (change) => {
    if (change > 0) return 'text-green-600 bg-green-50 border-green-200';
    if (change < 0) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const StatCard = ({ title, value, change, icon: Icon, format = 'number', color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600 border-blue-100',
      green: 'bg-green-50 text-green-600 border-green-100',
      purple: 'bg-purple-50 text-purple-600 border-purple-100',
      orange: 'bg-orange-50 text-orange-600 border-orange-100',
    };

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getChangeClass(change)}`}>
            {getChangeIcon(change)}
            <span>{Math.abs(change || 0).toFixed(1)}%</span>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
          <p className="text-2xl font-bold text-gray-900">
            {format === 'currency' ? formatCurrency(value) : formatNumber(value)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {change >= 0 ? 'Increased' : 'Decreased'} from yesterday
          </p>
        </div>
      </div>
    );
  };

  const AlertCard = ({ title, count, icon: Icon, color = 'warning', urgent = false, onClick }) => {
    const colorClasses = {
      warning: 'border-yellow-200 bg-yellow-50',
      danger: 'border-red-200 bg-red-50',
      info: 'border-blue-200 bg-blue-50',
      success: 'border-green-200 bg-green-50',
    };

    const iconClasses = {
      warning: 'text-yellow-600',
      danger: 'text-red-600',
      info: 'text-blue-600',
      success: 'text-green-600',
    };

    return (
      <div 
        className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${colorClasses[color]} ${urgent ? 'ring-2 ring-red-400 ring-opacity-50' : ''}`}
        onClick={onClick}
      >
        {urgent && (
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className={`w-6 h-6 ${iconClasses[color]}`} />
            <div>
              <h4 className="font-medium text-gray-900">{title}</h4>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(count)}</p>
            </div>
          </div>
          
          {urgent && (
            <div className="text-xs font-medium text-red-600 bg-white px-2 py-1 rounded-md">
              URGENT
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-stats-section">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                <div className="w-16 h-6 bg-gray-200 rounded-md" />
              </div>
              <div className="space-y-2">
                <div className="w-24 h-4 bg-gray-200 rounded" />
                <div className="w-32 h-8 bg-gray-200 rounded" />
                <div className="w-20 h-3 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-stats-section">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Dashboard Data</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="dashboard-stats-section">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Data Available</h3>
          <p className="text-gray-500">Dashboard data is not available at the moment.</p>
        </div>
      </div>
    );
  }

  // Extract data with safe fallbacks
  const { totals = {}, today = {}, month = {}, alerts = {} } = dashboardData;

  const mainStats = [
    {
      title: "Today's Orders",
      value: today.orders || 0,
      change: today.orders_change || 0,
      icon: ShoppingCart,
      color: 'blue',
    },
    {
      title: "Today's Revenue",
      value: today.revenue || 0,
      change: today.revenue_change || 0,
      icon: CreditCard,
      format: 'currency',
      color: 'green',
    },
    {
      title: 'Monthly Orders',
      value: month.orders || 0,
      change: month.orders_change || 0,
      icon: Package,
      color: 'purple',
    },
    {
      title: 'Total Products',
      value: totals.products || 0,
      change: 0, // Products don't change daily like orders
      icon: Package,
      color: 'orange',
    },
  ];

  const alertItems = [
    {
      title: 'Pending Orders',
      count: alerts.pending_orders || 0,
      icon: Clock,
      color: 'warning',
      urgent: (alerts.pending_orders || 0) > 10,
      onClick: () => console.log('Navigate to pending orders'),
    },
    {
      title: 'COD Orders',
      count: alerts.cod_orders || 0,
      icon: CreditCard,
      color: 'info',
      urgent: (alerts.cod_orders || 0) > 5,
      onClick: () => console.log('Navigate to COD orders'),
    },
    {
      title: 'Low Stock',
      count: alerts.low_stock_products || 0,
      icon: AlertTriangle,
      color: 'danger',
      urgent: (alerts.low_stock_products || 0) > 0,
      onClick: () => console.log('Navigate to low stock products'),
    },
  ];

  const totalStats = [
    { label: 'Total Orders', value: totals.orders || 0 },
    { label: 'Total Customers', value: totals.users || 0 },
    { label: 'Active Flash Sales', value: totals.active_flash_sales || 0 },
    { label: 'Total Products', value: totals.products || 0 },
  ];

  return (
    <div className="dashboard-stats-section space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-600 mt-1">Monitor your store's performance and key metrics</p>
        </div>
        <button
          onClick={onRefresh || fetchDashboardData}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <Activity className="w-4 h-4" />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Main Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
            format={stat.format}
            color={stat.color}
          />
        ))}
      </div>

      {/* Alerts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Action Required
          </h3>
          <span className="text-sm text-gray-500">Items that need your attention</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {alertItems.map((alert) => (
            <AlertCard
              key={alert.title}
              title={alert.title}
              count={alert.count}
              icon={alert.icon}
              color={alert.color}
              urgent={alert.urgent}
              onClick={alert.onClick}
            />
          ))}
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-500" />
            Store Overview
          </h3>
          <Zap className="w-5 h-5 text-yellow-500" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {totalStats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatNumber(stat.value)}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Performance Insights
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Revenue Growth</h4>
                <p className="text-sm text-gray-600">
                  Your revenue is up {Math.abs(today.revenue_change || 0).toFixed(1)}% compared to yesterday
                </p>
              </div>
            </div>
            <div className="text-lg font-bold text-green-600">
              {today.revenue_change >= 0 ? '+' : '-'}{Math.abs(today.revenue_change || 0).toFixed(1)}%
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Stock Management</h4>
                <p className="text-sm text-gray-600">
                  {alerts.low_stock_products || 0} products are running low on stock
                </p>
              </div>
            </div>
            <div className="text-lg font-bold text-yellow-600">
              {alerts.low_stock_products || 0}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Pending Orders</h4>
                <p className="text-sm text-gray-600">
                  {alerts.pending_orders || 0} orders need your attention
                </p>
              </div>
            </div>
            <div className="text-lg font-bold text-blue-600">
              {alerts.pending_orders || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Performance */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-green-500" />
          Monthly Performance
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revenue Progress */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Monthly Revenue</span>
              <span className="text-sm font-bold text-gray-900">
                {formatCurrency(month.revenue || 0)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-1000"
                style={{ 
                  width: `${Math.min((month.revenue || 0) / 10000000 * 100, 100)}%` 
                }}
              />
            </div>
            <div className="text-xs text-gray-500">
              Target: {formatCurrency(10000000)} monthly
            </div>
          </div>

          {/* Orders Progress */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Monthly Orders</span>
              <span className="text-sm font-bold text-gray-900">
                {formatNumber(month.orders || 0)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-1000"
                style={{ 
                  width: `${Math.min((month.orders || 0) / 500 * 100, 100)}%` 
                }}
              />
            </div>
            <div className="text-xs text-gray-500">
              Target: 500 orders monthly
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Footer */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Quick Actions</h3>
          <Users className="w-6 h-6 text-blue-200" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center transition-all">
            <Package className="w-6 h-6 mx-auto mb-2" />
            <div className="text-sm font-medium">Add Product</div>
          </button>
          
          <button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center transition-all">
            <Zap className="w-6 h-6 mx-auto mb-2" />
            <div className="text-sm font-medium">Flash Sale</div>
          </button>
          
          <button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center transition-all">
            <ShoppingCart className="w-6 h-6 mx-auto mb-2" />
            <div className="text-sm font-medium">View Orders</div>
          </button>
          
          <button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center transition-all">
            <Users className="w-6 h-6 mx-auto mb-2" />
            <div className="text-sm font-medium">Invite Admin</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;