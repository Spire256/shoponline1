import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import adminAPI from '../../../services/api/adminAPI';
import DashboardStats from './DashboardStats';
import RecentOrders from './RecentOrders';
import SalesChart from './SalesChart';
import QuickActions from './QuickActions';
import './Dashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7days');

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard overview from the correct backend endpoint
      const overviewData = await adminAPI.analytics.getDashboardOverview();

      // Fetch sales chart data
      const salesData = await adminAPI.analytics.getSalesChart(timeRange);

      // Fetch recent orders
      const ordersData = await adminAPI.analytics.getRecentOrders();

      // Fetch product performance
      const productData = await adminAPI.analytics.getProductPerformance();

      // Fetch flash sales performance
      const flashSalesData = await adminAPI.analytics.getFlashSalesPerformance();

      setDashboardData({
        overview: overviewData,
        sales: salesData,
        recentOrders: ordersData.orders || [],
        productPerformance: productData,
        flashSalesPerformance: flashSalesData,
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = newRange => {
    setTimeRange(newRange);
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (loading && !dashboardData) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-title">
            <h1>Dashboard</h1>
            <p>Welcome back, {user?.first_name}!</p>
          </div>
        </div>
        <div className="dashboard-loading">
          <div className="loading-spinner" />
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-title">
            <h1>Dashboard</h1>
            <p>Welcome back, {user?.first_name}!</p>
          </div>
        </div>
        <div className="dashboard-error">
          <div className="error-icon">⚠️</div>
          <h3>Failed to load dashboard</h3>
          <p>{error}</p>
          <button onClick={handleRefresh} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.first_name}! Here's what's happening with your store today.</p>
        </div>

        <div className="dashboard-controls">
          <div className="time-range-selector">
            <label>Time Range:</label>
            <select
              value={timeRange}
              onChange={e => handleTimeRangeChange(e.target.value)}
              className="form-select"
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="12months">Last 12 months</option>
            </select>
          </div>

          <button onClick={handleRefresh} className="btn btn-outline-primary" disabled={loading}>
            {loading ? (
              <span className="spinner-border spinner-border-sm me-2" />
            ) : (
              <span className="refresh-icon">🔄</span>
            )}
            Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-warning dashboard-alert">
          <div className="alert-content">
            <span className="alert-icon">⚠️</span>
            <div>
              <strong>Data Update Issue:</strong>
              <p>{error}</p>
            </div>
            <button onClick={() => setError(null)} className="alert-close">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      <div className="dashboard-content">
        {/* Statistics Overview */}
        {dashboardData?.overview && (
          <DashboardStats data={dashboardData.overview} loading={loading} />
        )}

        {/* Charts and Recent Orders Row */}
        <div className="dashboard-row">
          {/* Sales Chart */}
          <div className="dashboard-col-8">
            {dashboardData?.sales && (
              <SalesChart data={dashboardData.sales} timeRange={timeRange} loading={loading} />
            )}
          </div>

          {/* Quick Actions */}
          <div className="dashboard-col-4">
            <QuickActions />
          </div>
        </div>

        {/* Recent Orders */}
        <div className="dashboard-row">
          <div className="dashboard-col-12">
            {dashboardData?.recentOrders && (
              <RecentOrders
                orders={dashboardData.recentOrders}
                loading={loading}
                onRefresh={handleRefresh}
              />
            )}
          </div>
        </div>

        {/* Additional Insights Row */}
        <div className="dashboard-row">
          <div className="dashboard-col-6">
            <div className="dashboard-card">
              <div className="card-header">
                <h3>Performance Insights</h3>
              </div>
              <div className="card-body">
                <div className="insight-item">
                  <div className="insight-icon success">📈</div>
                  <div className="insight-content">
                    <h4>Growing Sales</h4>
                    <p>
                      Your revenue is up {dashboardData?.overview?.today?.revenue_change || 0}%
                      compared to yesterday
                    </p>
                  </div>
                </div>

                <div className="insight-item">
                  <div className="insight-icon warning">📦</div>
                  <div className="insight-content">
                    <h4>Stock Management</h4>
                    <p>
                      {dashboardData?.overview?.alerts?.low_stock_products || 0} products are
                      running low on stock
                    </p>
                  </div>
                </div>

                <div className="insight-item">
                  <div className="insight-icon info">🚚</div>
                  <div className="insight-content">
                    <h4>Pending Orders</h4>
                    <p>
                      {dashboardData?.overview?.alerts?.pending_orders || 0} orders need your
                      attention
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-col-6">
            <div className="dashboard-card">
              <div className="card-header">
                <h3>Quick Stats</h3>
              </div>
              <div className="card-body">
                <div className="quick-stats-grid">
                  <div className="quick-stat-item">
                    <div className="stat-number">
                      {dashboardData?.overview?.totals?.products || 0}
                    </div>
                    <div className="stat-label">Total Products</div>
                  </div>

                  <div className="quick-stat-item">
                    <div className="stat-number">{dashboardData?.overview?.totals?.users || 0}</div>
                    <div className="stat-label">Total Customers</div>
                  </div>

                  <div className="quick-stat-item">
                    <div className="stat-number">
                      {dashboardData?.overview?.totals?.active_flash_sales || 0}
                    </div>
                    <div className="stat-label">Active Flash Sales</div>
                  </div>

                  <div className="quick-stat-item">
                    <div className="stat-number">
                      {dashboardData?.overview?.alerts?.cod_orders || 0}
                    </div>
                    <div className="stat-label">COD Orders</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Flash Sales Performance Card */}
        {dashboardData?.flashSalesPerformance && (
          <div className="dashboard-row">
            <div className="dashboard-col-12">
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Flash Sales Performance</h3>
                  <p>Current flash sales activity and revenue</p>
                </div>
                <div className="card-body">
                  <div className="flash-sales-stats">
                    <div className="flash-stat-item">
                      <div className="flash-stat-icon">⚡</div>
                      <div className="flash-stat-content">
                        <div className="flash-stat-value">
                          {dashboardData.flashSalesPerformance.active_sales}
                        </div>
                        <div className="flash-stat-label">Active Sales</div>
                      </div>
                    </div>

                    <div className="flash-stat-item">
                      <div className="flash-stat-icon">💰</div>
                      <div className="flash-stat-content">
                        <div className="flash-stat-value">
                          {adminAPI.formatCurrency(dashboardData.flashSalesPerformance.revenue?.total_revenue || 0)}
                        </div>
                        <div className="flash-stat-label">Flash Sales Revenue</div>
                      </div>
                    </div>

                    <div className="flash-stat-item">
                      <div className="flash-stat-icon">🎯</div>
                      <div className="flash-stat-content">
                        <div className="flash-stat-value">
                          {dashboardData.flashSalesPerformance.revenue?.total_quantity || 0}
                        </div>
                        <div className="flash-stat-label">Items Sold</div>
                      </div>
                    </div>
                  </div>

                  {/* Top performing flash sales */}
                  {dashboardData.flashSalesPerformance.top_sales?.length > 0 && (
                    <div className="top-flash-sales">
                      <h4>Top Performing Flash Sales</h4>
                      <div className="flash-sales-list">
                        {dashboardData.flashSalesPerformance.top_sales.map((sale, index) => (
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

        {/* Product Performance Card */}
        {dashboardData?.productPerformance && (
          <div className="dashboard-row">
            <div className="dashboard-col-6">
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Top Selling Products</h3>
                  <p>Best performing products this month</p>
                </div>
                <div className="card-body">
                  {dashboardData.productPerformance.top_selling?.length > 0 ? (
                    <div className="top-products-list">
                      {dashboardData.productPerformance.top_selling.map((product, index) => (
                        <div key={product.product__id} className="top-product-item">
                          <div className="product-rank">#{index + 1}</div>
                          <div className="product-details">
                            <h5>{product.product__name}</h5>
                            <p>
                              {product.total_quantity} sold • 
                              {adminAPI.formatCurrency(product.total_revenue)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>No sales data available</p>
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
                </div>
                <div className="card-body">
                  {dashboardData.productPerformance.low_stock?.length > 0 ? (
                    <div className="stock-alerts">
                      {dashboardData.productPerformance.low_stock.map(product => (
                        <div key={product.id} className="stock-alert-item">
                          <div className="alert-icon warning">⚠️</div>
                          <div className="alert-details">
                            <h5>{product.name}</h5>
                            <p>Only {product.stock_quantity} left in stock</p>
                          </div>
                          <div className="alert-action">
                            <button className="btn btn-sm btn-outline">Restock</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>All products are well stocked</p>
                    </div>
                  )}

                  {dashboardData.productPerformance.out_of_stock_count > 0 && (
                    <div className="out-of-stock-alert">
                      <div className="alert-banner danger">
                        <span>🚨</span>
                        <p>
                          {dashboardData.productPerformance.out_of_stock_count} products are 
                          completely out of stock
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;