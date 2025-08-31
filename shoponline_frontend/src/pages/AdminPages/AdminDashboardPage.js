import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Plus,
  Settings,
  Home,
} from 'lucide-react';

// Import admin page components
import ProductManagement from '../../components/admin/Products/ProductManagement';
import AddProduct from '../../components/admin/Products/AddProduct';
import CategoryManagement from '../../components/admin/Categories/CategoryManagement';
import FlashSaleManagement from '../../components/admin/FlashSales/FlashSaleManagement';
import CreateFlashSale from '../../components/admin/FlashSales/CreateFlashSale';
import OrderManagement from '../../components/admin/Orders/OrderManagement';
import UserManagement from '../../components/admin/Users/UserManagement';
import AdminInvitation from '../../components/admin/Users/AdminInvitation';
import HomepageEditor from '../../components/admin/Homepage/HomepageEditor';
import Analytics from '../../components/admin/Analytics/Analytics';
import NotificationCenter from '../../components/admin/Notifications/NotificationCenter';

// Import contexts
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

// Import services - using default import
import adminAPI from '../../services/api/adminAPI';

// Import utilities
import { ADMIN_ROUTES } from '../../utils/constants/routes';

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [activeView, setActiveView] = useState('dashboard');

  // Available admin views with their corresponding components
  const adminViews = {
    dashboard: { component: null, title: 'Dashboard Overview' },
    products: { component: ProductManagement, title: 'Product Management' },
    addProduct: { component: AddProduct, title: 'Add New Product' },
    categories: { component: CategoryManagement, title: 'Category Management' },
    flashSales: { component: FlashSaleManagement, title: 'Flash Sales Management' },
    createFlashSale: { component: CreateFlashSale, title: 'Create Flash Sale' },
    orders: { component: OrderManagement, title: 'Order Management' },
    users: { component: UserManagement, title: 'User Management' },
    adminInvitation: { component: AdminInvitation, title: 'Admin Invitations' },
    homepage: { component: HomepageEditor, title: 'Homepage Management' },
    analytics: { component: Analytics, title: 'Analytics & Reports' },
    notifications: { component: NotificationCenter, title: 'Notification Center' }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Map selectedPeriod to API period format
      const periodMap = {
        '7days': '7d',
        '30days': '30d',
        '90days': '90d',
        '1year': '365d'
      };
      
      const apiPeriod = periodMap[selectedPeriod] || '7d';
      
      // Get dashboard data from API
      const [overviewData, analyticsData, salesData] = await Promise.all([
        adminAPI.analytics.getDashboardOverview(apiPeriod),
        adminAPI.analytics.getSalesAnalytics({ period: apiPeriod }),
        adminAPI.analytics.getRevenueTrends(apiPeriod, 'daily')
      ]);

      // Format the data for dashboard display
      const formattedData = {
        stats: {
          totalRevenue: overviewData.total_revenue || 0,
          totalOrders: overviewData.total_orders || 0,
          totalProducts: overviewData.total_products || 0,
          totalUsers: overviewData.total_users || 0,
          revenueGrowth: overviewData.revenue_growth || 0,
          ordersGrowth: overviewData.orders_growth || 0,
          productsGrowth: overviewData.products_growth || 0,
          usersGrowth: overviewData.users_growth || 0,
        },
        recentOrders: overviewData.recent_orders || [],
        topProducts: overviewData.top_products || [],
        salesChart: salesData.trends || [],
        flashSalesStats: {
          active: overviewData.active_flash_sales || 0,
          totalSavings: overviewData.flash_sales_savings || 0,
          itemsSold: overviewData.flash_sales_items_sold || 0,
        },
      };

      setDashboardData(formattedData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      addNotification({
        type: 'error',
        message: 'Failed to load dashboard data. Please try again later.'
      });
      
      // Set empty data structure to prevent UI crashes
      setDashboardData({
        stats: {
          totalRevenue: 0,
          totalOrders: 0,
          totalProducts: 0,
          totalUsers: 0,
          revenueGrowth: 0,
          ordersGrowth: 0,
          productsGrowth: 0,
          usersGrowth: 0,
        },
        recentOrders: [],
        topProducts: [],
        salesChart: [],
        flashSalesStats: {
          active: 0,
          totalSavings: 0,
          itemsSold: 0,
        },
      });
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

  const handleViewChange = (view) => {
    setActiveView(view);
    if (view !== 'dashboard') {
      addNotification({
        type: 'info',
        message: `Switched to ${adminViews[view]?.title || view}`
      });
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'addProduct':
        handleViewChange('addProduct');
        break;
      case 'createFlashSale':
        handleViewChange('createFlashSale');
        break;
      case 'inviteAdmin':
        handleViewChange('adminInvitation');
        break;
      case 'viewAnalytics':
        handleViewChange('analytics');
        break;
      case 'viewStore':
        window.open('/', '_blank');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleExportReport = async () => {
    try {
      addNotification({
        type: 'info',
        message: 'Generating report...'
      });

      const reportBlob = await adminAPI.reports.generateSalesReport({
        period: selectedPeriod,
        format: 'pdf'
      });

      const filename = `sales-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.pdf`;
      adminAPI.downloadFile(reportBlob, filename);

      addNotification({
        type: 'success',
        message: 'Report downloaded successfully'
      });
    } catch (error) {
      console.error('Failed to export report:', error);
      addNotification({
        type: 'error',
        message: 'Failed to export report. Please try again.'
      });
    }
  };

  const StatCard = ({ title, value, growth, icon: Icon, format = 'number', gradient = 'blue' }) => {
    const gradients = {
      blue: 'from-blue-600 to-blue-700',
      purple: 'from-purple-600 to-purple-700',
      emerald: 'from-emerald-600 to-emerald-700',
      amber: 'from-amber-600 to-amber-700',
    };

    return (
      <div className={`bg-gradient-to-br ${gradients[gradient]} rounded-2xl p-6 text-white relative overflow-hidden group hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer`}>
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
              <span className="font-semibold">{Math.abs(growth).toFixed(1)}%</span>
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

  const renderActiveView = () => {
    if (activeView === 'dashboard') {
      return null;
    }

    const ViewComponent = adminViews[activeView]?.component;
    if (!ViewComponent) {
      return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-slate-200 mb-2">View Not Available</h3>
            <p className="text-slate-400">The requested admin view is not available.</p>
            <button 
              onClick={() => handleViewChange('dashboard')}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return <ViewComponent onNavigate={handleViewChange} />;
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
            <div className="flex items-center space-x-4">
              {activeView !== 'dashboard' && (
                <button
                  onClick={() => handleViewChange('dashboard')}
                  className="flex items-center space-x-2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <Home className="h-5 w-5" />
                  <span>Dashboard</span>
                </button>
              )}
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                  {adminViews[activeView]?.title || 'Dashboard'}
                </h1>
                <p className="text-slate-400 mt-1">
                  {user?.first_name ? `Welcome back, ${user.first_name}!` : 'Welcome back!'} Here's what's happening with your store.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {activeView === 'dashboard' && (
                <>
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
                  <button 
                    onClick={handleExportReport}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center shadow-lg hover:shadow-blue-500/25"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </button>
                </>
              )}
              <button 
                onClick={() => window.open('/', '_blank')}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Store
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Navigation */}
        <div className="mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <button 
                onClick={() => handleViewChange('dashboard')}
                className={`p-4 rounded-xl text-sm font-medium transition-all duration-200 flex flex-col items-center space-y-2 ${
                  activeView === 'dashboard' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <BarChart3 className="h-5 w-5" />
                <span>Dashboard</span>
              </button>
              <button 
                onClick={() => handleViewChange('products')}
                className={`p-4 rounded-xl text-sm font-medium transition-all duration-200 flex flex-col items-center space-y-2 ${
                  activeView === 'products' || activeView === 'addProduct'
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Package className="h-5 w-5" />
                <span>Products</span>
              </button>
              <button 
                onClick={() => handleViewChange('categories')}
                className={`p-4 rounded-xl text-sm font-medium transition-all duration-200 flex flex-col items-center space-y-2 ${
                  activeView === 'categories'
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Settings className="h-5 w-5" />
                <span>Categories</span>
              </button>
              <button 
                onClick={() => handleViewChange('flashSales')}
                className={`p-4 rounded-xl text-sm font-medium transition-all duration-200 flex flex-col items-center space-y-2 ${
                  activeView === 'flashSales' || activeView === 'createFlashSale'
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Zap className="h-5 w-5" />
                <span>Flash Sales</span>
              </button>
              <button 
                onClick={() => handleViewChange('orders')}
                className={`p-4 rounded-xl text-sm font-medium transition-all duration-200 flex flex-col items-center space-y-2 ${
                  activeView === 'orders'
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <ShoppingCart className="h-5 w-5" />
                <span>Orders</span>
              </button>
              <button 
                onClick={() => handleViewChange('users')}
                className={`p-4 rounded-xl text-sm font-medium transition-all duration-200 flex flex-col items-center space-y-2 ${
                  activeView === 'users' || activeView === 'adminInvitation'
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Users className="h-5 w-5" />
                <span>Users</span>
              </button>
              <button 
                onClick={() => handleViewChange('homepage')}
                className={`p-4 rounded-xl text-sm font-medium transition-all duration-200 flex flex-col items-center space-y-2 ${
                  activeView === 'homepage'
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Home className="h-5 w-5" />
                <span>Homepage</span>
              </button>
              <button 
                onClick={() => handleViewChange('analytics')}
                className={`p-4 rounded-xl text-sm font-medium transition-all duration-200 flex flex-col items-center space-y-2 ${
                  activeView === 'analytics'
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Activity className="h-5 w-5" />
                <span>Analytics</span>
              </button>
            </div>
          </div>
        </div>

        {/* Render active view or dashboard content */}
        {renderActiveView()}

        {/* Dashboard content - only show when activeView is 'dashboard' */}
        {activeView === 'dashboard' && dashboardData && (
          <>
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
                  <button 
                    onClick={() => handleQuickAction('addProduct')}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center group"
                  >
                    <Package className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                    Add Product
                  </button>
                  <button 
                    onClick={() => handleQuickAction('createFlashSale')}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center group"
                  >
                    <Clock className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                    Create Flash Sale
                  </button>
                  <button 
                    onClick={() => handleQuickAction('inviteAdmin')}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white p-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center group"
                  >
                    <Users className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                    Invite Admin
                  </button>
                  <button 
                    onClick={() => handleQuickAction('viewAnalytics')}
                    className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white p-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center group"
                  >
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
                
                {dashboardData.salesChart.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.salesChart.map((day, index) => {
                      const maxRevenue = Math.max(...dashboardData.salesChart.map(d => d.revenue || 0));
                      const percentage = maxRevenue > 0 ? ((day.revenue || 0) / maxRevenue) * 100 : 0;
                      
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
                                {formatCurrency(day.revenue || 0)}
                              </div>
                              <div className="text-sm text-slate-400 bg-slate-700/50 px-2 py-1 rounded-md">
                                {day.orders || 0} orders
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
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-400">No sales data available for this period</p>
                  </div>
                )}
              </div>

              {/* Top Products */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-slate-200 flex items-center">
                    <Star className="h-5 w-5 mr-2 text-yellow-400" />
                    Top Products
                  </h3>
                  <button 
                    onClick={() => handleViewChange('products')}
                    className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center group"
                  >
                    <Eye className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform" />
                    View All
                  </button>
                </div>
                
                {dashboardData.topProducts.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.topProducts.map((product, index) => (
                      <div key={product.id || index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-all duration-200 group">
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
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-400">No product data available</p>
                  </div>
                )}
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
                    <button 
                      onClick={() => handleViewChange('flashSales')}
                      className="w-full mt-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-medium py-2 px-4 rounded-lg text-sm transition-all duration-200"
                    >
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
                  <button 
                    onClick={() => handleViewChange('orders')}
                    className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center group"
                  >
                    <Eye className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform" />
                    View All Orders
                  </button>
                </div>
                
                {dashboardData.recentOrders.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.recentOrders.map(order => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-all duration-200 border border-slate-600/30 group cursor-pointer"
                        onClick={() => handleViewChange('orders')}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                            <ShoppingCart className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                              {order.id || order.order_number}
                            </p>
                            <p className="text-sm text-slate-400">{order.customer || order.customer_name}</p>
                            <p className="text-xs text-slate-500">
                              {new Date(order.createdAt || order.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <span className="text-lg font-bold text-emerald-400">
                            {formatCurrency(order.amount || order.total_amount)}
                          </span>
                          <span
                            className={`text-xs px-3 py-1.5 rounded-full font-medium ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {(order.status || '').replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-400">No recent orders available</p>
                  </div>
                )}
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
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {dashboardData.stats.revenueGrowth >= 0 ? '+' : ''}{dashboardData.stats.revenueGrowth.toFixed(1)}%
                </div>
                <p className="text-sm text-slate-400">Compared to last period</p>
                <div className="mt-4 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(Math.abs(dashboardData.stats.revenueGrowth), 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Order Conversion */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-200">Order Growth</h3>
                  <Activity className="h-5 w-5 text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  {dashboardData.stats.ordersGrowth >= 0 ? '+' : ''}{dashboardData.stats.ordersGrowth.toFixed(1)}%
                </div>
                <p className="text-sm text-slate-400">Order growth rate</p>
                <div className="mt-4 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(Math.abs(dashboardData.stats.ordersGrowth), 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* User Growth */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-200">User Growth</h3>
                  <Star className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="text-3xl font-bold text-yellow-400 mb-2">
                  {dashboardData.stats.usersGrowth >= 0 ? '+' : ''}{dashboardData.stats.usersGrowth.toFixed(1)}%
                </div>
                <p className="text-sm text-slate-400">New user growth</p>
                <div className="mt-4 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(Math.abs(dashboardData.stats.usersGrowth), 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;