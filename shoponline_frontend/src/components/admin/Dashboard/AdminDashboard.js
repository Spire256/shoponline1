import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  RefreshCw, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  BarChart3, 
  PieChart, 
  Calendar, 
  Filter,
  Download,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  Star,
  ArrowRight,
  ExternalLink,
  Grid3X3
} from 'lucide-react';

// Direct component imports for navigation
import ProductManagementPage from '../../../pages/AdminPages/ProductManagementPage';
import OrderManagementPage from '../../../pages/AdminPages/OrderManagementPage';
import FlashSalesManagementPage from '../../../pages/AdminPages/FlashSalesManagementPage';
import HomepageManagementPage from '../../../pages/AdminPages/HomepageManagementPage';
import CategoryManagementPage from '../../../pages/AdminPages/CategoryManagementPage';
import UserManagementPage from '../../../pages/AdminPages/UserManagementPage';
import AnalyticsPage from '../../../pages/AdminPages/AnalyticsPage';

// Import contexts
import { useAuth } from '../../../contexts/AuthContext';
import { useNotifications } from '../../../contexts/NotificationContext';

// Import services - Updated to use adminAPI structure
import adminAPI from '../../../services/api/adminAPI';
//import { analyticsAPI } from '../../../services/api/analyticsAPI';
import { ordersAPI } from '../../../services/api/ordersAPI';
import  productsAPI  from '../../../services/api/productsAPI';
import { flashSalesAPI } from '../../../services/api/flashSalesAPI';

// Import utilities
import { formatCurrency, formatNumber, formatPercentage } from '../../../utils/helpers/formatters';
import { calculateGrowthRate, calculateTrendDirection } from '../../../utils/helpers/calculations';
import dateHelpers, { formatDateRange } from '../../../utils/helpers/dateHelpers';
import { 
  ADMIN_ROUTES, 
  PUBLIC_ROUTES, 
  PRODUCT_ROUTES 
} from '../../../utils/constants/routes';
import { APP_CONFIG } from '../../../utils/constants/app';
import { ORDER_STATUS, PAYMENT_STATUS } from '../../../utils/constants/orderStatus';

// Import styles
import './Dashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // State management
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7days');
  const [refreshing, setRefreshing] = useState(false);

  // Page component references for navigation
  const pageComponents = {
    products: ProductManagementPage,
    orders: OrderManagementPage,
    flashSales: FlashSalesManagementPage,
    homepage: HomepageManagementPage,
    categories: CategoryManagementPage,
    users: UserManagementPage,
    analytics: AnalyticsPage
  };

  // Helper function to get time range label
  const getTimeRangeLabel = (range) => {
    const timeRangeLabels = {
      'today': 'day',
      '7days': 'week', 
      '30days': 'month',
      '90days': 'quarter',
      '12months': 'year'
    };
    return timeRangeLabels[range] || 'period';
  };

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all dashboard data in parallel using updated adminAPI structure
      const [
        overviewResponse,
        salesResponse,
        ordersResponse,
        productResponse,
        flashSalesResponse,
        recentOrdersResponse,
        alertsResponse
      ] = await Promise.all([
        adminAPI.analytics.getDashboardOverview(timeRange),
        adminAPI.analytics.getSalesChart(timeRange),
        adminAPI.analytics.getProductPerformance(timeRange),
        productsAPI.getProductPerformance && productsAPI.getProductPerformance(timeRange),
        adminAPI.analytics.getFlashSalesPerformance(timeRange),
        adminAPI.analytics.getRecentOrders(),
        getSystemAlerts()
      ]);

      setDashboardData({
        overview: overviewResponse?.data || overviewResponse || {},
        sales: salesResponse?.data || salesResponse || {},
        recentOrders: recentOrdersResponse?.data?.orders || recentOrdersResponse?.orders || [],
        productPerformance: productResponse?.data || productResponse || {},
        flashSalesPerformance: flashSalesResponse?.data || flashSalesResponse || {},
        analytics: overviewResponse?.data || overviewResponse || {},
        alerts: alertsResponse || {}
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load dashboard data';
      setError(errorMessage);
      
      addNotification({
        type: 'error',
        message: errorMessage,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate system alerts from available data
  const getSystemAlerts = async () => {
    try {
      // Since there's no specific system alerts endpoint in adminAPI,
      // we'll generate alerts based on the data we have
      const alerts = {};
      
      // Check for low stock products from product performance
      if (dashboardData?.productPerformance?.low_stock?.length > 0) {
        alerts.low_stock_products = dashboardData.productPerformance.low_stock.length;
      }
      
      // Check for pending orders from recent orders
      if (dashboardData?.recentOrders?.length > 0) {
        const pendingOrders = dashboardData.recentOrders.filter(
          order => order.status === 'pending' || order.status === 'processing'
        );
        alerts.pending_orders = pendingOrders.length;
      }
      
      // Check for COD orders
      if (dashboardData?.recentOrders?.length > 0) {
        const codOrders = dashboardData.recentOrders.filter(
          order => order.payment_method === 'cod' && order.status !== 'delivered'
        );
        alerts.cod_orders = codOrders.length;
      }
      
      return alerts;
    } catch (error) {
      console.warn('Failed to generate system alerts:', error);
      return {};
    }
  };

  const handleTimeRangeChange = (newRange) => {
    setTimeRange(newRange);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    
    addNotification({
      type: 'success',
      message: 'Dashboard data refreshed successfully'
    });
  };

  // Navigation functions with preloading
  const preloadPage = (componentName) => {
    try {
      const component = pageComponents[componentName];
      if (component && typeof component.preload === 'function') {
        component.preload();
      }
    } catch (error) {
      console.warn('Page preload failed:', error);
    }
  };

  const navigateToPage = (path, componentName = null) => {
    if (componentName) {
      preloadPage(componentName);
    }
    navigate(path);
  };

  // Quick action handlers
  const handleQuickAction = (action, data = null) => {
    switch (action) {
      case 'addProduct':
        navigateToPage(`${ADMIN_ROUTES.ADMIN_PRODUCTS}/add`, 'products');
        break;
      case 'viewProducts':
        navigateToPage(ADMIN_ROUTES.ADMIN_PRODUCTS, 'products');
        break;
      case 'manageOrders':
        navigateToPage(ADMIN_ROUTES.ADMIN_ORDERS, 'orders');
        break;
      case 'viewOrder':
        if (data?.id) {
          navigateToPage(`${ADMIN_ROUTES.ADMIN_ORDERS}/${data.id}`, 'orders');
        }
        break;
      case 'createFlashSale':
        navigateToPage(`${ADMIN_ROUTES.ADMIN_FLASH_SALES}/create`, 'flashSales');
        break;
      case 'manageFlashSales':
        navigateToPage(ADMIN_ROUTES.ADMIN_FLASH_SALES, 'flashSales');
        break;
      case 'editHomepage':
        navigateToPage(ADMIN_ROUTES.ADMIN_HOMEPAGE, 'homepage');
        break;
      case 'manageCategories':
        navigateToPage(ADMIN_ROUTES.ADMIN_CATEGORIES, 'categories');
        break;
      case 'manageUsers':
        navigateToPage(ADMIN_ROUTES.ADMIN_USERS, 'users');
        break;
      case 'viewAnalytics':
        navigateToPage(ADMIN_ROUTES.ADMIN_ANALYTICS, 'analytics');
        break;
      case 'viewStore':
        window.open(PUBLIC_ROUTES.HOME, '_blank');
        break;
      case 'exportData':
        handleExportData();
        break;
      default:
        console.warn('Unknown quick action:', action);
    }
  };

  const handleExportData = async () => {
    try {
      // Create export data from current dashboard data with formatted timestamp
      const exportData = {
        timestamp: dateHelpers.formatDateTime(new Date(), {
          dateFormat: 'YYYY-MM-DD',
          timeFormat: '24h',
          separator: ' ',
          showTime: true
        }),
        timeRange,
        generatedAt: dateHelpers.formatDate(new Date(), 'dddd, MMMM DD, YYYY'),
        overview: dashboardData?.overview || {},
        sales: dashboardData?.sales || {},
        recentOrders: dashboardData?.recentOrders || [],
        productPerformance: dashboardData?.productPerformance || {},
        flashSalesPerformance: dashboardData?.flashSalesPerformance || {},
        alerts: dashboardData?.alerts || {}
      };
      
      // Create and download file using adminAPI helper
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const filename = `dashboard-data-${timeRange}-${dateHelpers.formatDate(new Date(), 'YYYY-MM-DD')}.json`;
      adminAPI.downloadFile(blob, filename);
      
      addNotification({
        type: 'success',
        message: 'Dashboard data exported successfully'
      });
    } catch (error) {
      console.error('Export failed:', error);
      addNotification({
        type: 'error',
        message: 'Failed to export dashboard data'
      });
    }
  };

  // Loading state
  if (loading && !dashboardData) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-title">
            <h1>Dashboard</h1>
            <p>Welcome back, {user?.first_name || 'Admin'}!</p>
          </div>
        </div>
        <div className="dashboard-loading">
          <div className="loading-spinner" />
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !dashboardData) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-title">
            <h1>Dashboard</h1>
            <p>Welcome back, {user?.first_name || 'Admin'}!</p>
          </div>
        </div>
        <div className="dashboard-error">
          <div className="error-icon">
            <AlertTriangle className="icon" />
          </div>
          <h3>Failed to load dashboard</h3>
          <p>{error}</p>
          <button onClick={handleRefresh} className="btn btn-primary">
            <RefreshCw className="icon" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { overview = {}, sales = {}, recentOrders = [], productPerformance = {}, flashSalesPerformance = {}, analytics = {}, alerts = {} } = dashboardData || {};

  return (
    <div className="dashboard-container">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.first_name || 'Admin'}! Here's what's happening with your store today.</p>
        </div>

        <div className="dashboard-controls">
          <div className="time-range-selector">
            <label>Time Range:</label>
            <select
              value={timeRange}
              onChange={(e) => handleTimeRangeChange(e.target.value)}
              className="form-select"
              disabled={loading}
            >
              <option value="today">Today</option>
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 3 months</option>
              <option value="12months">Last 12 months</option>
            </select>
          </div>

          <div className="dashboard-actions">
            <button 
              onClick={() => handleQuickAction('exportData')} 
              className="btn btn-outline-primary"
              disabled={loading || refreshing}
            >
              <Download className="icon" />
              Export
            </button>
            <button 
              onClick={handleRefresh} 
              className="btn btn-outline-primary" 
              disabled={loading || refreshing}
            >
              <RefreshCw className={`icon ${refreshing ? 'spinning' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-warning dashboard-alert">
          <div className="alert-content">
            <AlertTriangle className="alert-icon" />
            <div>
              <strong>Data Update Issue:</strong>
              <p>{error}</p>
            </div>
            <button onClick={() => setError(null)} className="alert-close">
              <XCircle className="icon" />
            </button>
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      <div className="dashboard-content">
        {/* Statistics Overview */}
        <div className="dashboard-row">
          <div className="dashboard-col-12">
            <div className="stats-grid">
              <div className="stat-card revenue">
                <div className="stat-header">
                  <h3>Total Revenue</h3>
                  <DollarSign className="stat-icon" />
                </div>
                <div className="stat-value">
                  {adminAPI.formatCurrency(overview?.revenue?.total || 0, 'UGX')}
                </div>
                <div className="stat-change">
                  {overview?.revenue?.change >= 0 ? (
                    <TrendingUp className="icon positive" />
                  ) : (
                    <TrendingDown className="icon negative" />
                  )}
                  <span className={overview?.revenue?.change >= 0 ? 'positive' : 'negative'}>
                    {adminAPI.formatPercentage(Math.abs(overview?.revenue?.change || 0))} vs previous period
                  </span>
                </div>
              </div>

              <div className="stat-card orders">
                <div className="stat-header">
                  <h3>Total Orders</h3>
                  <ShoppingCart className="stat-icon" />
                </div>
                <div className="stat-value">
                  {adminAPI.formatNumber(overview?.orders?.total || 0)}
                </div>
                <div className="stat-change">
                  {overview?.orders?.change >= 0 ? (
                    <TrendingUp className="icon positive" />
                  ) : (
                    <TrendingDown className="icon negative" />
                  )}
                  <span className={overview?.orders?.change >= 0 ? 'positive' : 'negative'}>
                    {adminAPI.formatPercentage(Math.abs(overview?.orders?.change || 0))} vs previous period
                  </span>
                </div>
              </div>

              <div className="stat-card customers">
                <div className="stat-header">
                  <h3>Total Customers</h3>
                  <Users className="stat-icon" />
                </div>
                <div className="stat-value">
                  {adminAPI.formatNumber(overview?.customers?.total || 0)}
                </div>
                <div className="stat-change">
                  {overview?.customers?.change >= 0 ? (
                    <TrendingUp className="icon positive" />
                  ) : (
                    <TrendingDown className="icon negative" />
                  )}
                  <span className={overview?.customers?.change >= 0 ? 'positive' : 'negative'}>
                    {adminAPI.formatPercentage(Math.abs(overview?.customers?.change || 0))} new customers
                  </span>
                </div>
              </div>

              <div className="stat-card products">
                <div className="stat-header">
                  <h3>Total Products</h3>
                  <Package className="stat-icon" />
                </div>
                <div className="stat-value">
                  {adminAPI.formatNumber(overview?.products?.total || 0)}
                </div>
                <div className="stat-actions">
                  <button 
                    onClick={() => handleQuickAction('addProduct')} 
                    className="quick-action-btn"
                  >
                    <Plus className="icon" />
                    Add Product
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-row">
          <div className="dashboard-col-12">
            <div className="dashboard-card quick-actions-card">
              <div className="card-header">
                <h3>Quick Actions</h3>
                <p>Frequently used management tasks</p>
              </div>
              <div className="card-body">
                <div className="quick-actions-grid">
                  <button 
                    onClick={() => handleQuickAction('addProduct')} 
                    className="quick-action-item"
                  >
                    <div className="action-icon">
                      <Plus className="icon" />
                    </div>
                    <div className="action-content">
                      <h4>Add Product</h4>
                      <p>Add new products to your inventory</p>
                    </div>
                    <ArrowRight className="action-arrow" />
                  </button>

                  <button 
                    onClick={() => handleQuickAction('manageOrders')} 
                    className="quick-action-item"
                  >
                    <div className="action-icon">
                      <ShoppingCart className="icon" />
                    </div>
                    <div className="action-content">
                      <h4>Manage Orders</h4>
                      <p>Process and track customer orders</p>
                    </div>
                    <ArrowRight className="action-arrow" />
                  </button>

                  <button 
                    onClick={() => handleQuickAction('createFlashSale')} 
                    className="quick-action-item"
                  >
                    <div className="action-icon">
                      <Zap className="icon" />
                    </div>
                    <div className="action-content">
                      <h4>Create Flash Sale</h4>
                      <p>Set up time-limited discounts</p>
                    </div>
                    <ArrowRight className="action-arrow" />
                  </button>

                  <button 
                    onClick={() => handleQuickAction('editHomepage')} 
                    className="quick-action-item"
                  >
                    <div className="action-icon">
                      <Edit className="icon" />
                    </div>
                    <div className="action-content">
                      <h4>Edit Homepage</h4>
                      <p>Update banners and featured content</p>
                    </div>
                    <ArrowRight className="action-arrow" />
                  </button>

                  <button 
                    onClick={() => handleQuickAction('viewAnalytics')} 
                    className="quick-action-item"
                  >
                    <div className="action-icon">
                      <BarChart3 className="icon" />
                    </div>
                    <div className="action-content">
                      <h4>View Analytics</h4>
                      <p>Detailed sales and performance reports</p>
                    </div>
                    <ArrowRight className="action-arrow" />
                  </button>

                  <button 
                    onClick={() => handleQuickAction('viewStore')} 
                    className="quick-action-item"
                  >
                    <div className="action-icon">
                      <ExternalLink className="icon" />
                    </div>
                    <div className="action-content">
                      <h4>View Store</h4>
                      <p>See your store from customer perspective</p>
                    </div>
                    <ArrowRight className="action-arrow" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="dashboard-row">
          <div className="dashboard-col-8">
            <div className="dashboard-card">
              <div className="card-header">
                <h3>Recent Orders</h3>
                <div className="card-actions">
                  <button 
                    onClick={() => handleQuickAction('manageOrders')} 
                    className="btn btn-outline-primary btn-sm"
                  >
                    View All Orders
                  </button>
                </div>
              </div>
              <div className="card-body">
                {recentOrders.length > 0 ? (
                  <div className="orders-table">
                    <div className="table-header">
                      <div className="table-row header-row">
                        <div className="table-cell">Order ID</div>
                        <div className="table-cell">Customer</div>
                        <div className="table-cell">Amount</div>
                        <div className="table-cell">Status</div>
                        <div className="table-cell">Date</div>
                        <div className="table-cell">Actions</div>
                      </div>
                    </div>
                    <div className="table-body">
                      {recentOrders.slice(0, 5).map(order => (
                        <div key={order.id} className="table-row">
                          <div className="table-cell">
                            <span className="order-id">#{order.order_number || order.id}</span>
                          </div>
                          <div className="table-cell">
                            <div className="customer-info">
                              <span className="customer-name">
                                {order.customer_name || `${order.first_name} ${order.last_name}`}
                              </span>
                              <span className="customer-email">{order.email}</span>
                            </div>
                          </div>
                          <div className="table-cell">
                            <span className="order-amount">
                              {adminAPI.formatCurrency(order.total_amount, 'UGX')}
                            </span>
                          </div>
                          <div className="table-cell">
                            <span className={`status-badge ${order.status?.toLowerCase()}`}>
                              {order.status || 'Pending'}
                            </span>
                          </div>
                          <div className="table-cell">
                            <span className="order-date">
                              {new Date(order.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="table-cell">
                            <button 
                              onClick={() => handleQuickAction('viewOrder', { id: order.id })}
                              className="btn btn-sm btn-outline-primary"
                            >
                              <Eye className="icon" />
                              View
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    <ShoppingCart className="empty-icon" />
                    <h4>No recent orders</h4>
                    <p>Orders will appear here once customers start placing them.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="dashboard-col-4">
            <div className="dashboard-card">
              <div className="card-header">
                <h3>System Alerts</h3>
              </div>
              <div className="card-body">
                <div className="alerts-list">
                  {alerts?.low_stock_products > 0 && (
                    <div className="alert-item warning">
                      <AlertTriangle className="alert-icon" />
                      <div className="alert-content">
                        <h5>Low Stock Alert</h5>
                        <p>{alerts.low_stock_products} products are running low</p>
                        <button 
                          onClick={() => handleQuickAction('viewProducts')}
                          className="alert-action"
                        >
                          Check Products
                        </button>
                      </div>
                    </div>
                  )}

                  {alerts?.pending_orders > 0 && (
                    <div className="alert-item info">
                      <Clock className="alert-icon" />
                      <div className="alert-content">
                        <h5>Pending Orders</h5>
                        <p>{alerts.pending_orders} orders need attention</p>
                        <button 
                          onClick={() => handleQuickAction('manageOrders')}
                          className="alert-action"
                        >
                          View Orders
                        </button>
                      </div>
                    </div>
                  )}

                  {alerts?.cod_orders > 0 && (
                    <div className="alert-item success">
                      <Package className="alert-icon" />
                      <div className="alert-content">
                        <h5>COD Orders</h5>
                        <p>{alerts.cod_orders} cash on delivery orders</p>
                        <button 
                          onClick={() => handleQuickAction('manageOrders')}
                          className="alert-action"
                        >
                          Process Orders
                        </button>
                      </div>
                    </div>
                  )}

                  {(!alerts || Object.keys(alerts).length === 0) && (
                    <div className="empty-state">
                      <CheckCircle className="empty-icon success" />
                      <h4>All good!</h4>
                      <p>No system alerts at this time.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Flash Sales & Product Performance */}
        {flashSalesPerformance && Object.keys(flashSalesPerformance).length > 0 && (
          <div className="dashboard-row">
            <div className="dashboard-col-12">
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Flash Sales Performance</h3>
                  <p>Current flash sales activity and revenue</p>
                  <div className="card-actions">
                    <button 
                      onClick={() => handleQuickAction('manageFlashSales')} 
                      className="btn btn-outline-primary btn-sm"
                    >
                      <Zap className="icon" />
                      Manage Flash Sales
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="flash-sales-stats">
                    <div className="flash-stat-item">
                      <div className="flash-stat-icon">
                        <Zap className="icon" />
                      </div>
                      <div className="flash-stat-content">
                        <div className="flash-stat-value">
                          {flashSalesPerformance.active_sales || 0}
                        </div>
                        <div className="flash-stat-label">Active Sales</div>
                      </div>
                    </div>

                    <div className="flash-stat-item">
                      <div className="flash-stat-icon">
                        <DollarSign className="icon" />
                      </div>
                      <div className="flash-stat-content">
                        <div className="flash-stat-value">
                          {adminAPI.formatCurrency(flashSalesPerformance.revenue?.total_revenue || 0, 'UGX')}
                        </div>
                        <div className="flash-stat-label">Flash Sales Revenue</div>
                      </div>
                    </div>

                    <div className="flash-stat-item">
                      <div className="flash-stat-icon">
                        <Package className="icon" />
                      </div>
                      <div className="flash-stat-content">
                        <div className="flash-stat-value">
                          {flashSalesPerformance.revenue?.total_quantity || 0}
                        </div>
                        <div className="flash-stat-label">Items Sold</div>
                      </div>
                    </div>
                  </div>

                  {flashSalesPerformance.top_sales?.length > 0 && (
                    <div className="top-flash-sales">
                      <h4>Top Performing Flash Sales</h4>
                      <div className="flash-sales-list">
                        {flashSalesPerformance.top_sales.slice(0, 3).map((sale, index) => (
                          <div key={sale.id} className="flash-sale-item">
                            <div className="flash-sale-rank">#{index + 1}</div>
                            <div className="flash-sale-details">
                              <h5>{sale.name}</h5>
                              <p>{sale.discount_percentage}% discount • {sale.products_count} products</p>
                            </div>
                            <div className="flash-sale-stats">
                              <span className="flash-sale-orders">{sale.total_orders} orders</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Performance */}
        {productPerformance && Object.keys(productPerformance).length > 0 && (
          <div className="dashboard-row">
            <div className="dashboard-col-6">
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Top Selling Products</h3>
                  <p>Best performing products this {getTimeRangeLabel(timeRange)}</p>
                  <div className="card-actions">
                    <button 
                      onClick={() => handleQuickAction('viewProducts')} 
                      className="btn btn-outline-primary btn-sm"
                    >
                      View All Products
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  {productPerformance.top_selling?.length > 0 ? (
                    <div className="top-products-list">
                      {productPerformance.top_selling.slice(0, 5).map((product, index) => (
                        <div key={product.product__id} className="top-product-item">
                          <div className="product-rank">#{index + 1}</div>
                          <div className="product-details">
                            <h5>{product.product__name}</h5>
                            <div className="product-stats">
                              <span>{product.total_quantity} sold</span>
                              <span>{adminAPI.formatCurrency(product.total_revenue, 'UGX')}</span>
                            </div>
                          </div>
                          <div className="product-actions">
                            <button className="btn btn-sm btn-outline">
                              <Eye className="icon" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <Package className="empty-icon" />
                      <h4>No sales data</h4>
                      <p>Sales data will appear here once orders are placed.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="dashboard-col-6">
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Stock Alerts</h3>
                  <p>Products requiring attention</p>
                  <div className="card-actions">
                    <button 
                      onClick={() => handleQuickAction('viewProducts')} 
                      className="btn btn-outline-primary btn-sm"
                    >
                      Manage Inventory
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  {productPerformance.low_stock?.length > 0 ? (
                    <div className="stock-alerts">
                      {productPerformance.low_stock.slice(0, 5).map(product => (
                        <div key={product.id} className="stock-alert-item">
                          <div className="alert-icon warning">
                            <AlertTriangle className="icon" />
                          </div>
                          <div className="alert-details">
                            <h5>{product.name}</h5>
                            <p>Only {product.stock_quantity} left in stock</p>
                          </div>
                          <div className="alert-action">
                            <button 
                              onClick={() => navigateToPage(`${ADMIN_ROUTES.ADMIN_PRODUCTS}/${product.id}/edit`, 'products')}
                              className="btn btn-sm btn-outline"
                            >
                              <Edit className="icon" />
                              Restock
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <CheckCircle className="empty-icon success" />
                      <h4>All products well stocked</h4>
                      <p>No low stock alerts at this time.</p>
                    </div>
                  )}

                  {productPerformance.out_of_stock_count > 0 && (
                    <div className="out-of-stock-alert">
                      <div className="alert-banner danger">
                        <AlertTriangle className="icon" />
                        <div className="alert-content">
                          <strong>Out of Stock Alert</strong>
                          <p>
                            {productPerformance.out_of_stock_count} products are 
                            completely out of stock
                          </p>
                        </div>
                        <button 
                          onClick={() => handleQuickAction('viewProducts')}
                          className="btn btn-sm btn-primary"
                        >
                          Fix Now
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Summary */}
        <div className="dashboard-row">
          <div className="dashboard-col-6">
            <div className="dashboard-card">
              <div className="card-header">
                <h3>Performance Insights</h3>
                <p>Key metrics and trends</p>
              </div>
              <div className="card-body">
                <div className="insights-list">
                  <div className="insight-item">
                    <div className="insight-icon success">
                      <TrendingUp className="icon" />
                    </div>
                    <div className="insight-content">
                      <h4>Revenue Growth</h4>
                      <p>
                        Your revenue is {overview?.revenue?.change >= 0 ? 'up' : 'down'} {' '}
                        {adminAPI.formatPercentage(Math.abs(overview?.revenue?.change || 0))} compared to previous period
                      </p>
                    </div>
                  </div>

                  <div className="insight-item">
                    <div className="insight-icon info">
                      <Users className="icon" />
                    </div>
                    <div className="insight-content">
                      <h4>Customer Activity</h4>
                      <p>
                        {adminAPI.formatNumber(overview?.customers?.new || 0)} new customers acquired this {getTimeRangeLabel(timeRange)}
                      </p>
                    </div>
                  </div>

                  <div className="insight-item">
                    <div className="insight-icon warning">
                      <Package className="icon" />
                    </div>
                    <div className="insight-content">
                      <h4>Inventory Status</h4>
                      <p>
                        {productPerformance?.low_stock_count || 0} products need restocking attention
                      </p>
                    </div>
                  </div>

                  <div className="insight-item">
                    <div className="insight-icon flash">
                      <Zap className="icon" />
                    </div>
                    <div className="insight-content">
                      <h4>Flash Sales Impact</h4>
                      <p>
                        {flashSalesPerformance?.active_sales || 0} active flash sales generating {' '}
                        {adminAPI.formatCurrency(flashSalesPerformance?.revenue?.total_revenue || 0, 'UGX')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-col-6">
            <div className="dashboard-card">
              <div className="card-header">
                <h3>Quick Statistics</h3>
                <p>Overview of your store</p>
              </div>
              <div className="card-body">
                <div className="quick-stats-grid">
                  <div className="quick-stat-item">
                    <div className="stat-icon">
                      <Package className="icon" />
                    </div>
                    <div className="stat-info">
                      <div className="stat-number">
                        {adminAPI.formatNumber(overview?.totals?.products || 0)}
                      </div>
                      <div className="stat-label">Total Products</div>
                    </div>
                  </div>

                  <div className="quick-stat-item">
                    <div className="stat-icon">
                      <Users className="icon" />
                    </div>
                    <div className="stat-info">
                      <div className="stat-number">
                        {adminAPI.formatNumber(overview?.totals?.users || 0)}
                      </div>
                      <div className="stat-label">Total Customers</div>
                    </div>
                  </div>

                  <div className="quick-stat-item">
                    <div className="stat-icon">
                      <Zap className="icon" />
                    </div>
                    <div className="stat-info">
                      <div className="stat-number">
                        {adminAPI.formatNumber(overview?.totals?.active_flash_sales || 0)}
                      </div>
                      <div className="stat-label">Active Flash Sales</div>
                    </div>
                  </div>

                  <div className="quick-stat-item">
                    <div className="stat-icon">
                      <ShoppingCart className="icon" />
                    </div>
                    <div className="stat-info">
                      <div className="stat-number">
                        {adminAPI.formatNumber(alerts?.cod_orders || 0)}
                      </div>
                      <div className="stat-label">COD Orders</div>
                    </div>
                  </div>

                  <div className="quick-stat-item">
                    <div className="stat-icon">
                      <Star className="icon" />
                    </div>
                    <div className="stat-info">
                      <div className="stat-number">
                        {((overview?.reviews?.average_rating || 0) * 1).toFixed(1)}
                      </div>
                      <div className="stat-label">Avg Rating</div>
                    </div>
                  </div>

                  <div className="quick-stat-item">
                    <div className="stat-icon">
                      <Clock className="icon" />
                    </div>
                    <div className="stat-info">
                      <div className="stat-number">
                        {adminAPI.formatNumber(alerts?.pending_orders || 0)}
                      </div>
                      <div className="stat-label">Pending Orders</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Management Quick Links */}
        <div className="dashboard-row">
          <div className="dashboard-col-12">
            <div className="dashboard-card">
              <div className="card-header">
                <h3>Management Center</h3>
                <p>Access all administrative functions</p>
              </div>
              <div className="card-body">
                <div className="management-grid">
                  <div className="management-section">
                    <h4>Product Management</h4>
                    <div className="management-links">
                      <button 
                        onClick={() => handleQuickAction('viewProducts')} 
                        className="management-link"
                      >
                        <Package className="icon" />
                        <span>All Products</span>
                        <span className="count">{adminAPI.formatNumber(overview?.totals?.products || 0)}</span>
                      </button>
                      <button 
                        onClick={() => handleQuickAction('addProduct')} 
                        className="management-link"
                      >
                        <Plus className="icon" />
                        <span>Add Product</span>
                      </button>
                      <button 
                        onClick={() => handleQuickAction('manageCategories')} 
                        className="management-link"
                      >
                        <Grid3X3 className="icon" />
                        <span>Categories</span>
                        <span className="count">{adminAPI.formatNumber(overview?.totals?.categories || 0)}</span>
                      </button>
                    </div>
                  </div>

                  <div className="management-section">
                    <h4>Order Management</h4>
                    <div className="management-links">
                      <button 
                        onClick={() => handleQuickAction('manageOrders')} 
                        className="management-link"
                      >
                        <ShoppingCart className="icon" />
                        <span>All Orders</span>
                        <span className="count">{adminAPI.formatNumber(overview?.totals?.orders || 0)}</span>
                      </button>
                      <button 
                        onClick={() => navigateToPage(`${ADMIN_ROUTES.ADMIN_ORDERS}?status=pending`, 'orders')} 
                        className="management-link"
                      >
                        <Clock className="icon" />
                        <span>Pending Orders</span>
                        <span className="count warning">{adminAPI.formatNumber(alerts?.pending_orders || 0)}</span>
                      </button>
                      <button 
                        onClick={() => navigateToPage(`${ADMIN_ROUTES.ADMIN_ORDERS}?payment_method=cod`, 'orders')} 
                        className="management-link"
                      >
                        <Package className="icon" />
                        <span>COD Orders</span>
                        <span className="count info">{adminAPI.formatNumber(alerts?.cod_orders || 0)}</span>
                      </button>
                    </div>
                  </div>

                  <div className="management-section">
                    <h4>Marketing & Sales</h4>
                    <div className="management-links">
                      <button 
                        onClick={() => handleQuickAction('manageFlashSales')} 
                        className="management-link"
                      >
                        <Zap className="icon" />
                        <span>Flash Sales</span>
                        <span className="count success">{adminAPI.formatNumber(overview?.totals?.active_flash_sales || 0)}</span>
                      </button>
                      <button 
                        onClick={() => handleQuickAction('createFlashSale')} 
                        className="management-link"
                      >
                        <Plus className="icon" />
                        <span>New Flash Sale</span>
                      </button>
                      <button 
                        onClick={() => handleQuickAction('editHomepage')} 
                        className="management-link"
                      >
                        <Edit className="icon" />
                        <span>Homepage Content</span>
                      </button>
                    </div>
                  </div>

                  <div className="management-section">
                    <h4>Analytics & Users</h4>
                    <div className="management-links">
                      <button 
                        onClick={() => handleQuickAction('viewAnalytics')} 
                        className="management-link"
                      >
                        <BarChart3 className="icon" />
                        <span>Analytics</span>
                      </button>
                      <button 
                        onClick={() => handleQuickAction('manageUsers')} 
                        className="management-link"
                      >
                        <Users className="icon" />
                        <span>Users</span>
                        <span className="count">{adminAPI.formatNumber(overview?.totals?.users || 0)}</span>
                      </button>
                      <button 
                        onClick={() => handleQuickAction('exportData')} 
                        className="management-link"
                      >
                        <Download className="icon" />
                        <span>Export Data</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;