import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Package,
  Users,
  CreditCard,
  Clock,
  Eye,
  Download,
  Zap,
  Star,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

const AdminDashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7days');

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));

      setDashboardData({
        stats: {
          totalRevenue: 2450000,
          totalOrders: 156,
          totalProducts: 89,
          totalUsers: 234,
          revenueGrowth: 12.5,
          ordersGrowth: -3.2,
          productsGrowth: 8.1,
          usersGrowth: 15.8,
        },
        recentOrders: [
          {
            id: 'SHO20241201001',
            customer: 'John Doe',
            amount: 125000,
            status: 'pending',
            createdAt: '2024-12-01T10:30:00Z',
          },
          {
            id: 'SHO20241201002',
            customer: 'Jane Smith',
            amount: 89000,
            status: 'confirmed',
            createdAt: '2024-12-01T09:15:00Z',
          },
          {
            id: 'SHO20241201003',
            customer: 'Bob Johnson',
            amount: 234000,
            status: 'delivered',
            createdAt: '2024-12-01T08:45:00Z',
          },
          {
            id: 'SHO20241201004',
            customer: 'Alice Brown',
            amount: 67000,
            status: 'processing',
            createdAt: '2024-12-01T07:20:00Z',
          },
          {
            id: 'SHO20241201005',
            customer: 'Charlie Wilson',
            amount: 156000,
            status: 'cod_pending',
            createdAt: '2024-11-30T18:30:00Z',
          },
        ],
        topProducts: [
          { id: 1, name: 'Samsung Galaxy S24', sales: 23, revenue: 1150000 },
          { id: 2, name: 'iPhone 15 Pro', sales: 18, revenue: 1890000 },
          { id: 3, name: 'MacBook Air M3', sales: 12, revenue: 1440000 },
          { id: 4, name: 'Sony WH-1000XM5', sales: 34, revenue: 680000 },
          { id: 5, name: 'Dell XPS 13', sales: 15, revenue: 1200000 },
        ],
        salesChart: [
          { date: '2024-11-25', revenue: 234000, orders: 12 },
          { date: '2024-11-26', revenue: 189000, orders: 8 },
          { date: '2024-11-27', revenue: 345000, orders: 18 },
          { date: '2024-11-28', revenue: 278000, orders: 14 },
          { date: '2024-11-29', revenue: 456000, orders: 22 },
          { date: '2024-11-30', revenue: 389000, orders: 19 },
          { date: '2024-12-01', revenue: 567000, orders: 28 },
        ],
        flashSalesStats: {
          active: 3,
          totalSavings: 145000,
          itemsSold: 67,
        },
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = status => {
    const colors = {
      pending: 'bg-amber-100 text-amber-800 border border-amber-200',
      confirmed: 'bg-blue-100 text-blue-800 border border-blue-200',
      processing: 'bg-purple-100 text-purple-800 border border-purple-200',
      delivered: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      cod_pending: 'bg-orange-100 text-orange-800 border border-orange-200',
      cancelled: 'bg-red-100 text-red-800 border border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  const StatCard = ({ title, value, growth, icon: Icon, format = 'number', gradient = 'blue' }) => {
    const gradients = {
      blue: 'from-blue-600 to-blue-700',
      purple: 'from-purple-600 to-purple-700',
      emerald: 'from-emerald-600 to-emerald-700',
      amber: 'from-amber-600 to-amber-700',
    };

    return (
      <div className={`bg-gradient-to-br ${gradients[gradient]} rounded-2xl p-6 text-white relative overflow-hidden group hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl`}>
        {/* Background decoration */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
        <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/5 rounded-full"></div>
        
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex items-center text-sm">
              {growth >= 0 ? (
                <ArrowUpRight className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 mr-1" />
              )}
              <span className="font-semibold">{Math.abs(growth)}%</span>
            </div>
          </div>
          
          <div>
            <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
            <p className="text-3xl font-bold mb-2">
              {format === 'currency' ? formatCurrency(value) : value.toLocaleString()}
            </p>
            <p className="text-white/70 text-xs">
              {growth >= 0 ? '↗ ' : '↘ '}
              <span className={growth >= 0 ? 'text-green-200' : 'text-orange-200'}>
                vs last period
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{ animationDelay: '0.1s', animationDuration: '1.2s' }}></div>
          </div>
          <p className="mt-6 text-slate-300 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-slate-400 mt-1">
                Welcome back! Here's what's happening with your store.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedPeriod}
                onChange={e => setSelectedPeriod(e.target.value)}
                className="bg-slate-800 border border-slate-600 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
                <option value="90days">Last 90 days</option>
                <option value="1year">Last year</option>
              </select>
              <button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center shadow-lg hover:shadow-blue-500/25">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Revenue"
            value={dashboardData.stats.totalRevenue}
            growth={dashboardData.stats.revenueGrowth}
            icon={CreditCard}
            format="currency"
            gradient="blue"
          />
          <StatCard
            title="Total Orders"
            value={dashboardData.stats.totalOrders}
            growth={dashboardData.stats.ordersGrowth}
            icon={ShoppingCart}
            gradient="purple"
          />
          <StatCard
            title="Products"
            value={dashboardData.stats.totalProducts}
            growth={dashboardData.stats.productsGrowth}
            icon={Package}
            gradient="emerald"
          />
          <StatCard
            title="Users"
            value={dashboardData.stats.totalUsers}
            growth={dashboardData.stats.usersGrowth}
            icon={Users}
            gradient="amber"
          />
        </div>

        {/* Quick Actions Bar */}
        <div className="mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-yellow-400" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center group">
                <Package className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                Add Product
              </button>
              <button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center group">
                <Clock className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                Create Flash Sale
              </button>
              <button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white p-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center group">
                <Users className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                Invite Admin
              </button>
              <button className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white p-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center group">
                <BarChart3 className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                View Analytics
              </button>
            </div>
          </div>
        </div>

        {/* Charts and Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Sales Chart */}
          <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-200 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-400" />
                Sales Overview
              </h3>
              <div className="flex items-center space-x-2 text-sm text-slate-400 bg-slate-700/50 px-3 py-1.5 rounded-lg">
                <BarChart3 className="h-4 w-4" />
                <span>Revenue & Orders</span>
              </div>
            </div>
            
            {/* Chart visualization */}
            <div className="space-y-4">
              {dashboardData.salesChart.map((day, index) => {
                const maxRevenue = Math.max(...dashboardData.salesChart.map(d => d.revenue));
                const percentage = (day.revenue / maxRevenue) * 100;
                
                return (
                  <div key={index} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-slate-300">
                        {new Date(day.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-sm font-semibold text-slate-200">
                          {formatCurrency(day.revenue)}
                        </div>
                        <div className="text-sm text-slate-400 bg-slate-700/50 px-2 py-1 rounded-md">
                          {day.orders} orders
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-1000 ease-out group-hover:from-blue-400 group-hover:to-blue-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-200 flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-400" />
                Top Products
              </h3>
              <button className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center group">
                <Eye className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform" />
                View All
              </button>
            </div>
            
            <div className="space-y-4">
              {dashboardData.topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-all duration-200 group">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-lg text-sm font-bold">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                        {product.name}
                      </p>
                      <p className="text-xs text-slate-400">{product.sales} sold</p>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-emerald-400">
                    {formatCurrency(product.revenue)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Flash Sales & Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
          {/* Flash Sales Stats */}
          <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full"></div>
            <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-white/5 rounded-full"></div>
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Flash Sales</h3>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Zap className="h-5 w-5" />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/80 text-sm">Active Sales</span>
                  <span className="text-2xl font-bold">
                    {dashboardData.flashSalesStats.active}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/80 text-sm">Items Sold</span>
                  <span className="text-2xl font-bold">
                    {dashboardData.flashSalesStats.itemsSold}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/80 text-sm">Total Savings</span>
                  <span className="text-xl font-bold text-yellow-200">
                    {formatCurrency(dashboardData.flashSalesStats.totalSavings)}
                  </span>
                </div>
                <button className="w-full mt-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-medium py-2 px-4 rounded-lg text-sm transition-all duration-200">
                  Manage Flash Sales
                </button>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="lg:col-span-3 bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-200 flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2 text-green-400" />
                Recent Orders
              </h3>
              <button className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center group">
                <Eye className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform" />
                View All Orders
              </button>
            </div>
            
            <div className="space-y-3">
              {dashboardData.recentOrders.map(order => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-all duration-200 border border-slate-600/30 group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <ShoppingCart className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                        {order.id}
                      </p>
                      <p className="text-sm text-slate-400">{order.customer}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className="text-lg font-bold text-emerald-400">
                      {formatCurrency(order.amount)}
                    </span>
                    <span
                      className={`text-xs px-3 py-1.5 rounded-full font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Revenue Trend */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-200">Revenue Trend</h3>
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-green-400 mb-2">+12.5%</div>
            <p className="text-sm text-slate-400">Compared to last period</p>
            <div className="mt-4 h-2 bg-slate-700/50 rounded-full overflow-hidden">
              <div className="w-3/4 h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
            </div>
          </div>

          {/* Order Conversion */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-200">Order Rate</h3>
              <Activity className="h-5 w-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-blue-400 mb-2">78%</div>
            <p className="text-sm text-slate-400">Conversion rate</p>
            <div className="mt-4 h-2 bg-slate-700/50 rounded-full overflow-hidden">
              <div className="w-4/5 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            </div>
          </div>

          {/* Customer Satisfaction */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-200">Satisfaction</h3>
              <Star className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold text-yellow-400 mb-2">4.8</div>
            <p className="text-sm text-slate-400">Average rating</p>
            <div className="mt-4 h-2 bg-slate-700/50 rounded-full overflow-hidden">
              <div className="w-5/6 h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;