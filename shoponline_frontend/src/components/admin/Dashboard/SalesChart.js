import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, TrendingUp, TrendingDown, RefreshCw, Calendar, DollarSign } from 'lucide-react';
import './Dashboard.css';

const SalesChart = ({ data: propData, timeRange = '7days', loading: propLoading }) => {
  const [chartData, setChartData] = useState(propData || { data: [] });
  const [loading, setLoading] = useState(propLoading || false);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('revenue');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  useEffect(() => {
    if (!propData) {
      fetchSalesData();
    } else {
      setChartData(propData);
    }
  }, [propData, timeRange]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/v1/admin/analytics/sales_chart/?period=${timeRange}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sales chart data');
      }

      const data = await response.json();
      setChartData(data);
    } catch (err) {
      console.error('Error fetching sales chart data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString, format = 'short') => {
    try {
      const date = new Date(dateString);
      if (format === 'short') {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      } else if (format === 'long') {
        return date.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  const getTimeRangeDisplay = () => {
    const displays = {
      '7days': 'Last 7 Days',
      '30days': 'Last 30 Days',
      '90days': 'Last 90 Days',
      '12months': 'Last 12 Months',
    };
    return displays[timeRange] || 'Custom Range';
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const data = chartData?.data || [];
    if (data.length === 0) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        trend: { direction: 'neutral', percentage: 0 },
        period: getTimeRangeDisplay(),
      };
    }

    const totalRevenue = data.reduce((sum, item) => sum + (item.revenue || 0), 0);
    const totalOrders = data.reduce((sum, item) => sum + (item.orders || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate trend (compare first half with second half)
    const mid = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, mid);
    const secondHalf = data.slice(mid);

    const firstHalfAvg = firstHalf.reduce((sum, item) => sum + (item.revenue || 0), 0) / (firstHalf.length || 1);
    const secondHalfAvg = secondHalf.reduce((sum, item) => sum + (item.revenue || 0), 0) / (secondHalf.length || 1);

    let trend = { direction: 'neutral', percentage: 0 };
    if (firstHalfAvg > 0) {
      const change = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
      trend = {
        direction: change > 5 ? 'up' : change < -5 ? 'down' : 'neutral',
        percentage: Math.abs(change),
      };
    }

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      trend,
      period: getTimeRangeDisplay(),
    };
  }, [chartData, timeRange]);

  // Generate SVG path for chart
  const generateChartPath = (data, type = 'revenue') => {
    if (!data || data.length === 0) return '';

    const values = data.map(item => item[type] || 0);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue || 1;

    const width = 100; // Percentage
    const height = 100; // Percentage
    const stepX = width / (data.length - 1 || 1);

    let path = '';

    data.forEach((item, index) => {
      const x = index * stepX;
      const y = height - (((item[type] || 0) - minValue) / range) * height;

      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });

    return path;
  };

  const generateAreaPath = (data, type = 'revenue') => {
    const linePath = generateChartPath(data, type);
    if (!linePath) return '';

    const firstPoint = linePath.split(' ').slice(1, 3).join(' ');
    const lastX = data.length > 0 ? ((data.length - 1) * (100 / (data.length - 1 || 1))) : 0;
    
    return `${linePath} L ${lastX} 100 L 0 100 Z`;
  };

  const handleRefresh = () => {
    fetchSalesData();
  };

  if (loading && (!chartData || !chartData.data)) {
    return (
      <div className="sales-chart-container">
        <div className="chart-header">
          <div className="chart-title">
            <h3>Sales Overview</h3>
            <p>Revenue and order trends</p>
          </div>
        </div>
        <div className="chart-loading">
          <div className="loading-spinner" />
          <p>Loading sales data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sales-chart-container">
        <div className="chart-header">
          <div className="chart-title">
            <h3>Sales Overview</h3>
            <p>Revenue and order trends</p>
          </div>
        </div>
        <div className="chart-error">
          <div className="error-icon">⚠️</div>
          <h4>Failed to Load Chart</h4>
          <p>{error}</p>
          <button onClick={handleRefresh} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const data = chartData?.data || [];

  return (
    <div className="sales-chart-container">
      <div className="chart-header">
        <div className="chart-title">
          <h3>Sales Overview</h3>
          <p>Revenue and order trends for {stats.period}</p>
        </div>

        <div className="chart-controls">
          <div className="chart-type-selector">
            <button
              className={`chart-type-btn ${chartType === 'revenue' ? 'active' : ''}`}
              onClick={() => setChartType('revenue')}
            >
              Revenue
            </button>
            <button
              className={`chart-type-btn ${chartType === 'orders' ? 'active' : ''}`}
              onClick={() => setChartType('orders')}
            >
              Orders
            </button>
          </div>

          <div className="time-range-display">
            <Calendar className="w-4 h-4" />
            {stats.period}
          </div>

          <button
            onClick={handleRefresh}
            className="btn btn-sm btn-outline-secondary"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="chart-stats">
        <div className="stat-group">
          <div className="stat-item primary">
            <div className="stat-icon">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="stat-details">
              <div className="stat-label">Total Revenue</div>
              <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
            </div>
          </div>

          <div className="stat-item secondary">
            <div className="stat-icon">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="stat-details">
              <div className="stat-label">Total Orders</div>
              <div className="stat-value">{stats.totalOrders.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="trend-indicator">
          <div className={`trend-icon ${stats.trend.direction}`}>
            {stats.trend.direction === 'up' && <TrendingUp className="w-5 h-5" />}
            {stats.trend.direction === 'down' && <TrendingDown className="w-5 h-5" />}
            {stats.trend.direction === 'neutral' && <BarChart3 className="w-5 h-5" />}
          </div>
          <div className="trend-details">
            <div className="trend-label">Trend</div>
            <div className={`trend-value ${stats.trend.direction}`}>
              {stats.trend.percentage > 0 ? (
                `${stats.trend.direction === 'up' ? '+' : '-'}${stats.trend.percentage.toFixed(1)}%`
              ) : (
                'No change'
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="chart-wrapper">
        {data.length === 0 ? (
          <div className="chart-empty">
            <div className="empty-icon">📊</div>
            <h4>No Sales Data</h4>
            <p>No sales data available for the selected period.</p>
          </div>
        ) : (
          <div className="chart-container">
            <svg className="sales-chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Chart area fill */}
              <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              
              <path
                d={generateAreaPath(data, chartType)}
                fill="url(#chartGradient)"
                className="chart-area-path"
              />

              {/* Chart line */}
              <path
                d={generateChartPath(data, chartType)}
                fill="none"
                stroke="#2563eb"
                strokeWidth="0.5"
                className="chart-line"
              />

              {/* Data points */}
              {data.map((item, index) => {
                const x = (index * (100 / (data.length - 1 || 1)));
                const maxValue = Math.max(...data.map(d => d[chartType] || 0));
                const minValue = Math.min(...data.map(d => d[chartType] || 0));
                const range = maxValue - minValue || 1;
                const y = 100 - (((item[chartType] || 0) - minValue) / range) * 100;

                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="1"
                    fill="#2563eb"
                    className="chart-point"
                    onMouseEnter={() => setHoveredPoint({ ...item, index })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                );
              })}
            </svg>

            {/* Tooltip */}
            {hoveredPoint && (
              <div className="chart-tooltip" style={{ 
                left: `${(hoveredPoint.index * (100 / (data.length - 1 || 1)))}%`,
                transform: 'translateX(-50%)'
              }}>
                <div className="tooltip-content">
                  <div className="tooltip-date">
                    {formatDate(hoveredPoint.date)}
                  </div>
                  <div className="tooltip-value">
                    {chartType === 'revenue' 
                      ? formatCurrency(hoveredPoint.revenue)
                      : `${hoveredPoint.orders} orders`
                    }
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="chart-legend">
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color revenue"></div>
            <div className="legend-text">Revenue</div>
          </div>
        </div>

        <div className="chart-info">
          <div className="info-item">
            <BarChart3 className="info-icon w-4 h-4" />
            <span>Average: {formatCurrency(stats.averageOrderValue)}</span>
          </div>
          <div className="info-item">
            <Calendar className="info-icon w-4 h-4" />
            <span>{data.length} data points</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesChart;