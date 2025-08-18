import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
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

      // Fetch dashboard overview
      const overviewResponse = await fetch('/api/v1/admin/analytics/overview/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!overviewResponse.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const overviewData = await overviewResponse.json();

      // Fetch sales chart data
      const salesResponse = await fetch(
        `/api/v1/admin/analytics/sales_chart/?period=${timeRange}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const salesData = await salesResponse.json();

      // Fetch recent orders
      const ordersResponse = await fetch('/api/v1/admin/analytics/recent_orders/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });

      const ordersData = await ordersResponse.json();

      setDashboardData({
        overview: overviewData,
        sales: salesData,
        recentOrders: ordersData.orders || [],
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
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
      </div>
    </div>
  );
};

export default AdminDashboard;
