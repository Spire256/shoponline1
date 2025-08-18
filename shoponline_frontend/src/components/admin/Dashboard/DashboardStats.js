import React from 'react';
import './Dashboard.css';

const DashboardStats = ({ data, loading }) => {
  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = number => {
    return new Intl.NumberFormat('en-UG').format(number);
  };

  const getChangeIcon = change => {
    if (change > 0) return '📈';
    if (change < 0) return '📉';
    return '➖';
  };

  const getChangeClass = change => {
    if (change > 0) return 'positive';
    if (change < 0) return 'negative';
    return 'neutral';
  };

  if (loading) {
    return (
      <div className="stats-grid">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="stat-card loading">
            <div className="stat-card-content">
              <div className="stat-icon skeleton" />
              <div className="stat-details">
                <div className="stat-value skeleton" />
                <div className="stat-label skeleton" />
                <div className="stat-change skeleton" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="stats-grid">
        <div className="stat-card error">
          <p>Failed to load statistics</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      id: 'orders',
      title: "Today's Orders",
      value: data.today?.orders || 0,
      change: data.today?.orders_change || 0,
      icon: '📋',
      color: 'blue',
      description: 'Orders placed today',
    },
    {
      id: 'revenue',
      title: "Today's Revenue",
      value: formatCurrency(data.today?.revenue || 0),
      change: data.today?.revenue_change || 0,
      icon: '💰',
      color: 'green',
      description: 'Revenue earned today',
    },
    {
      id: 'monthly_orders',
      title: 'Monthly Orders',
      value: data.month?.orders || 0,
      change: data.month?.orders_change || 0,
      icon: '📊',
      color: 'purple',
      description: 'Orders this month',
    },
    {
      id: 'monthly_revenue',
      title: 'Monthly Revenue',
      value: formatCurrency(data.month?.revenue || 0),
      change: data.month?.revenue_change || 0,
      icon: '💎',
      color: 'orange',
      description: 'Revenue this month',
    },
  ];

  const alerts = [
    {
      id: 'pending',
      title: 'Pending Orders',
      count: data.alerts?.pending_orders || 0,
      icon: '⏳',
      color: 'warning',
      urgent: (data.alerts?.pending_orders || 0) > 10,
    },
    {
      id: 'cod',
      title: 'COD Orders',
      count: data.alerts?.cod_orders || 0,
      icon: '💵',
      color: 'info',
      urgent: (data.alerts?.cod_orders || 0) > 5,
    },
    {
      id: 'stock',
      title: 'Low Stock',
      count: data.alerts?.low_stock_products || 0,
      icon: '📦',
      color: 'danger',
      urgent: (data.alerts?.low_stock_products || 0) > 0,
    },
  ];

  return (
    <div className="dashboard-stats-section">
      {/* Main Statistics */}
      <div className="stats-grid">
        {stats.map(stat => (
          <div key={stat.id} className={`stat-card ${stat.color}`}>
            <div className="stat-card-content">
              <div className="stat-icon">
                <span className="icon-emoji">{stat.icon}</span>
              </div>

              <div className="stat-details">
                <div className="stat-value">
                  {typeof stat.value === 'string' ? stat.value : formatNumber(stat.value)}
                </div>

                <div className="stat-label">{stat.title}</div>

                <div className={`stat-change ${getChangeClass(stat.change)}`}>
                  <span className="change-icon">{getChangeIcon(stat.change)}</span>
                  <span className="change-value">{Math.abs(stat.change).toFixed(1)}%</span>
                  <span className="change-period">vs yesterday</span>
                </div>
              </div>

              <div className="stat-trend">
                <div className={`trend-line ${getChangeClass(stat.change)}`}>
                  <div
                    className="trend-fill"
                    style={{ width: `${Math.min(Math.abs(stat.change) * 2, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts Section */}
      <div className="alerts-section">
        <div className="section-header">
          <h3>Action Required</h3>
          <p>Items that need your immediate attention</p>
        </div>

        <div className="alerts-grid">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`alert-card ${alert.color} ${alert.urgent ? 'urgent' : ''}`}
            >
              <div className="alert-content">
                <div className="alert-icon">
                  <span className="icon-emoji">{alert.icon}</span>
                  {alert.urgent && <div className="urgent-indicator" />}
                </div>

                <div className="alert-details">
                  <div className="alert-count">{formatNumber(alert.count)}</div>
                  <div className="alert-title">{alert.title}</div>
                </div>

                <div className="alert-action">
                  <button className="btn btn-sm btn-outline">View</button>
                </div>
              </div>

              {alert.urgent && (
                <div className="alert-urgency">
                  <span className="urgency-pulse" />
                  <span className="urgency-text">Needs Attention</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-header">
            <h4>Store Overview</h4>
            <span className="summary-icon">🏪</span>
          </div>
          <div className="summary-content">
            <div className="summary-row">
              <span className="summary-label">Total Products:</span>
              <span className="summary-value">{formatNumber(data.totals?.products || 0)}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Total Customers:</span>
              <span className="summary-value">{formatNumber(data.totals?.users || 0)}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Active Flash Sales:</span>
              <span className="summary-value">
                {formatNumber(data.totals?.active_flash_sales || 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-header">
            <h4>Performance Today</h4>
            <span className="summary-icon">⚡</span>
          </div>
          <div className="summary-content">
            <div className="performance-meter">
              <div className="meter-label">Order Processing</div>
              <div className="meter-bar">
                <div
                  className="meter-fill good"
                  style={{
                    width: `${Math.min(((data.today?.orders || 0) / 10) * 100, 100)}%`,
                  }}
                />
              </div>
              <div className="meter-value">{data.today?.orders || 0}/10 target</div>
            </div>

            <div className="performance-meter">
              <div className="meter-label">Revenue Target</div>
              <div className="meter-bar">
                <div
                  className="meter-fill excellent"
                  style={{
                    width: `${Math.min(((data.today?.revenue || 0) / 1000000) * 100, 100)}%`,
                  }}
                />
              </div>
              <div className="meter-value">
                {formatCurrency(data.today?.revenue || 0)}/1M target
              </div>
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-header">
            <h4>Quick Actions</h4>
            <span className="summary-icon">⚙️</span>
          </div>
          <div className="summary-content">
            <div className="quick-action-buttons">
              <button className="btn btn-primary btn-sm">Add Product</button>
              <button className="btn btn-success btn-sm">Create Flash Sale</button>
              <button className="btn btn-info btn-sm">View Orders</button>
              <button className="btn btn-warning btn-sm">Check Stock</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
