import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const SalesChart = ({ data, timeRange, loading }) => {
  const [chartType, setChartType] = useState('revenue');
  const [hoveredPoint, setHoveredPoint] = useState(null);

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

  const getChartData = () => {
    if (!data || !data.data) return [];
    return data.data;
  };

  const getMaxValue = type => {
    const chartData = getChartData();
    if (!chartData.length) return 0;

    const values = chartData.map(item => (type === 'revenue' ? item.revenue : item.orders));

    return Math.max(...values);
  };

  const calculateTrend = () => {
    const chartData = getChartData();
    if (chartData.length < 2) return { direction: 'neutral', percentage: 0 };

    const firstValue = chartType === 'revenue' ? chartData[0]?.revenue : chartData[0]?.orders;
    const lastValue =
      chartType === 'revenue'
        ? chartData[chartData.length - 1]?.revenue
        : chartData[chartData.length - 1]?.orders;

    if (firstValue === 0) return { direction: 'up', percentage: 100 };

    const change = ((lastValue - firstValue) / firstValue) * 100;

    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      percentage: Math.abs(change).toFixed(1),
    };
  };

  const renderChart = () => {
    const chartData = getChartData();
    if (!chartData.length) return null;

    const maxValue = getMaxValue(chartType);
    const chartHeight = 200;
    const chartWidth = 100;

    return (
      <div className="chart-container">
        <svg
          className="sales-chart-svg"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="10" height="20" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Chart area */}
          <g className="chart-area">
            {/* Area fill */}
            <defs>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* Generate path for area chart */}
            {chartData.length > 1 && (
              <>
                <path
                  d={`
                    M 0 ${chartHeight}
                    ${chartData
                .map((item, index) => {
                  const x = (index / (chartData.length - 1)) * chartWidth;
                  const value = chartType === 'revenue' ? item.revenue : item.orders;
                  const y = chartHeight - (value / maxValue) * chartHeight;
                  return `L ${x} ${y}`;
                })
                .join(' ')}
                    L ${chartWidth} ${chartHeight}
                    Z
                  `}
                  fill="url(#areaGradient)"
                  className="chart-area-path"
                />

                {/* Line path */}
                <path
                  d={`
                    M ${chartData
                .map((item, index) => {
                  const x = (index / (chartData.length - 1)) * chartWidth;
                  const value = chartType === 'revenue' ? item.revenue : item.orders;
                  const y = chartHeight - (value / maxValue) * chartHeight;
                  return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                })
                .join(' ')}
                  `}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2"
                  className="chart-line"
                />

                {/* Data points */}
                {chartData.map((item, index) => {
                  const x = (index / (chartData.length - 1)) * chartWidth;
                  const value = chartType === 'revenue' ? item.revenue : item.orders;
                  const y = chartHeight - (value / maxValue) * chartHeight;

                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="3"
                      fill="#2563eb"
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="chart-point"
                      onMouseEnter={() => setHoveredPoint({ index, item, x, y })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  );
                })}
              </>
            )}
          </g>
        </svg>

        {/* Tooltip */}
        {hoveredPoint && (
          <div
            className="chart-tooltip"
            style={{
              left: `${hoveredPoint.x}%`,
              top: `${(hoveredPoint.y / 200) * 100}%`,
            }}
          >
            <div className="tooltip-content">
              <div className="tooltip-date">{hoveredPoint.item.date}</div>
              <div className="tooltip-value">
                {chartType === 'revenue'
                  ? formatCurrency(hoveredPoint.item.revenue)
                  : `${formatNumber(hoveredPoint.item.orders)} orders`}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const trend = calculateTrend();
  const chartData = getChartData();
  const totalRevenue = chartData.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const totalOrders = chartData.reduce((sum, item) => sum + (item.orders || 0), 0);

  if (loading) {
    return (
      <div className="sales-chart-container">
        <div className="card">
          <div className="card-header">
            <div className="chart-header-skeleton">
              <div className="skeleton-title" />
              <div className="skeleton-controls" />
            </div>
          </div>
          <div className="card-body">
            <div className="chart-loading">
              <div className="chart-skeleton" />
              <div className="loading-spinner" />
              <p>Loading sales data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sales-chart-container">
      <div className="card">
        <div className="card-header">
          <div className="chart-header">
            <div className="chart-title">
              <h3>Sales Analytics</h3>
              <p>Track your sales performance over time</p>
            </div>

            <div className="chart-controls">
              <div className="chart-type-selector">
                <button
                  className={`chart-type-btn ${chartType === 'revenue' ? 'active' : ''}`}
                  onClick={() => setChartType('revenue')}
                >
                  💰 Revenue
                </button>
                <button
                  className={`chart-type-btn ${chartType === 'orders' ? 'active' : ''}`}
                  onClick={() => setChartType('orders')}
                >
                  📋 Orders
                </button>
              </div>

              <div className="time-range-display">
                <span className="time-range-text">
                  {timeRange === '7days' && 'Last 7 days'}
                  {timeRange === '30days' && 'Last 30 days'}
                  {timeRange === '12months' && 'Last 12 months'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card-body">
          {/* Chart Stats */}
          <div className="chart-stats">
            <div className="stat-group">
              <div className="stat-item primary">
                <div className="stat-icon">💰</div>
                <div className="stat-details">
                  <div className="stat-label">Total Revenue</div>
                  <div className="stat-value">{formatCurrency(totalRevenue)}</div>
                </div>
              </div>

              <div className="stat-item secondary">
                <div className="stat-icon">📋</div>
                <div className="stat-details">
                  <div className="stat-label">Total Orders</div>
                  <div className="stat-value">{formatNumber(totalOrders)}</div>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">📈</div>
                <div className="stat-details">
                  <div className="stat-label">Average Order Value</div>
                  <div className="stat-value">
                    {totalOrders > 0
                      ? formatCurrency(totalRevenue / totalOrders)
                      : formatCurrency(0)}
                  </div>
                </div>
              </div>
            </div>

            <div className="trend-indicator">
              <div className={`trend-icon ${trend.direction}`}>
                {trend.direction === 'up' && '📈'}
                {trend.direction === 'down' && '📉'}
                {trend.direction === 'neutral' && '➖'}
              </div>
              <div className="trend-details">
                <div className="trend-label">Trend</div>
                <div className={`trend-value ${trend.direction}`}>
                  {trend.percentage}%{' '}
                  {trend.direction === 'up'
                    ? 'increase'
                    : trend.direction === 'down'
                      ? 'decrease'
                      : 'no change'}
                </div>
              </div>
            </div>
          </div>

          {/* Chart Visualization */}
          {chartData.length === 0 ? (
            <div className="chart-empty">
              <div className="empty-icon">📊</div>
              <h4>No sales data available</h4>
              <p>Sales data will appear here once you have orders.</p>
            </div>
          ) : (
            <div className="chart-wrapper">
              {renderChart()}

              {/* X-axis labels */}
              <div className="chart-x-axis">
                {chartData.map((item, index) => {
                  // Show labels for first, last, and middle points to avoid overcrowding
                  const showLabel =
                    index === 0 ||
                    index === chartData.length - 1 ||
                    (chartData.length > 5 && index === Math.floor(chartData.length / 2));

                  if (!showLabel) return null;

                  return (
                    <div
                      key={index}
                      className="x-axis-label"
                      style={{ left: `${(index / (chartData.length - 1)) * 100}%` }}
                    >
                      {item.date}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Chart Legend */}
          <div className="chart-legend">
            <div className="legend-items">
              <div className="legend-item">
                <div className="legend-color revenue" />
                <span className="legend-text">
                  {chartType === 'revenue' ? 'Revenue' : 'Orders'}
                </span>
              </div>
            </div>

            <div className="chart-info">
              <div className="info-item">
                <span className="info-icon">📅</span>
                <span className="info-text">
                  Data from {chartData.length} {timeRange.includes('days') ? 'days' : 'periods'}
                </span>
              </div>

              <div className="info-item">
                <span className="info-icon">🔄</span>
                <span className="info-text">Last updated: just now</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesChart;
