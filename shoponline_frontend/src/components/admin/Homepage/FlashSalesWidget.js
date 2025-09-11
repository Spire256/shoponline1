import React, { useState, useEffect } from 'react';
import { Zap, Plus, Edit, Trash2, Eye, Clock, Star, TrendingUp, AlertCircle } from 'lucide-react';

const FlashSalesWidget = ({ onDataChange }) => {
  const [flashSales, setFlashSales] = useState([]);
  const [activeFlashSales, setActiveFlashSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFlashSale, setEditingFlashSale] = useState(null);

  useEffect(() => {
    fetchFlashSales();
  }, []);

  const fetchFlashSales = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/flash-sales/flash-sales/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFlashSales(data.results || data);
        
        // Filter active flash sales
        const now = new Date();
        const active = (data.results || data).filter(sale => {
          const startTime = new Date(sale.start_time);
          const endTime = new Date(sale.end_time);
          return sale.is_active && startTime <= now && endTime > now;
        });
        setActiveFlashSales(active);
      } else {
        throw new Error('Failed to fetch flash sales');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFlashSale = () => {
    setShowCreateModal(true);
  };

  const handleEditFlashSale = (flashSale) => {
    setEditingFlashSale(flashSale);
  };

  const handleDeleteFlashSale = async (flashSaleId) => {
    if (!window.confirm('Are you sure you want to delete this flash sale?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/flash-sales/flash-sales/${flashSaleId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        fetchFlashSales();
        if (onDataChange) onDataChange();
      } else {
        throw new Error('Failed to delete flash sale');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleStatus = async (flashSaleId, currentStatus) => {
    try {
      const endpoint = currentStatus ? 'deactivate' : 'activate';
      const response = await fetch(`/api/v1/flash-sales/flash-sales/${flashSaleId}/${endpoint}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        fetchFlashSales();
        if (onDataChange) onDataChange();
      } else {
        throw new Error('Failed to update flash sale status');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const formatTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getStatusBadge = (sale) => {
    const now = new Date();
    const startTime = new Date(sale.start_time);
    const endTime = new Date(sale.end_time);

    if (!sale.is_active) {
      return <span className="status-badge inactive">Inactive</span>;
    } else if (startTime > now) {
      return <span className="status-badge upcoming">Upcoming</span>;
    } else if (endTime < now) {
      return <span className="status-badge expired">Expired</span>;
    } else {
      return <span className="status-badge active">Active</span>;
    }
  };

  if (loading) {
    return (
      <div className="flash-sales-widget">
        <div className="widget-header">
          <h3>Flash Sales Widget</h3>
          <Zap className="h-5 w-5 text-yellow-500" />
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading flash sales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flash-sales-widget">
      <div className="widget-header">
        <div className="header-content">
          <h3>Flash Sales Widget</h3>
          <p className="header-subtitle">Manage flash sales display on homepage</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary btn-sm"
            onClick={handleCreateFlashSale}
          >
            <Plus className="h-4 w-4" />
            Create Flash Sale
          </button>
        </div>
      </div>

      {error && (
        <div className="error-alert">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Active Flash Sales Summary */}
      <div className="active-sales-summary">
        <div className="summary-card">
          <div className="summary-icon">
            <Zap className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="summary-content">
            <h4>Active Flash Sales</h4>
            <div className="summary-value">{activeFlashSales.length}</div>
            <p className="summary-subtitle">Currently running</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">
            <TrendingUp className="h-6 w-6 text-green-500" />
          </div>
          <div className="summary-content">
            <h4>Total Savings</h4>
            <div className="summary-value">
              {flashSales.reduce((total, sale) => total + (sale.total_savings || 0), 0).toLocaleString()} UGX
            </div>
            <p className="summary-subtitle">Customer savings</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">
            <Star className="h-6 w-6 text-blue-500" />
          </div>
          <div className="summary-content">
            <h4>Products on Sale</h4>
            <div className="summary-value">
              {flashSales.reduce((total, sale) => total + (sale.products_count || 0), 0)}
            </div>
            <p className="summary-subtitle">In flash sales</p>
          </div>
        </div>
      </div>

      {/* Active Flash Sales List */}
      {activeFlashSales.length > 0 && (
        <div className="active-sales-section">
          <h4 className="section-title">
            <Clock className="h-4 w-4" />
            Active Flash Sales
          </h4>
          <div className="active-sales-grid">
            {activeFlashSales.map(sale => (
              <div key={sale.id} className="active-sale-card">
                <div className="sale-header">
                  <h5>{sale.name}</h5>
                  <div className="discount-badge">
                    -{sale.discount_percentage}%
                  </div>
                </div>
                <div className="sale-info">
                  <div className="info-item">
                    <span className="info-label">Time Remaining:</span>
                    <span className="time-remaining">{formatTimeRemaining(sale.end_time)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Products:</span>
                    <span>{sale.products_count || 0} items</span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{
                    width: `${Math.min((new Date() - new Date(sale.start_time)) / (new Date(sale.end_time) - new Date(sale.start_time)) * 100, 100)}%`
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Flash Sales Table */}
      <div className="all-sales-section">
        <div className="section-header">
          <h4 className="section-title">All Flash Sales</h4>
          <button
            className="btn btn-outline btn-sm"
            onClick={fetchFlashSales}
            disabled={loading}
          >
            <Eye className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="sales-table">
          <div className="table-header">
            <div className="table-cell">Name</div>
            <div className="table-cell">Discount</div>
            <div className="table-cell">Duration</div>
            <div className="table-cell">Products</div>
            <div className="table-cell">Status</div>
            <div className="table-cell">Actions</div>
          </div>

          <div className="table-body">
            {flashSales.length === 0 ? (
              <div className="empty-state">
                <Zap className="h-12 w-12 text-gray-400" />
                <h5>No Flash Sales</h5>
                <p>Create your first flash sale to get started</p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleCreateFlashSale}
                >
                  Create Flash Sale
                </button>
              </div>
            ) : (
              flashSales.map(sale => (
                <div key={sale.id} className="table-row">
                  <div className="table-cell">
                    <div className="sale-name">
                      <h6>{sale.name}</h6>
                      {sale.description && (
                        <p className="sale-description">{sale.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="table-cell">
                    <span className="discount-text">{sale.discount_percentage}%</span>
                  </div>
                  <div className="table-cell">
                    <div className="duration-info">
                      <div className="date-range">
                        {new Date(sale.start_time).toLocaleDateString()} - {new Date(sale.end_time).toLocaleDateString()}
                      </div>
                      {sale.is_active && new Date(sale.end_time) > new Date() && (
                        <div className="time-remaining-small">
                          {formatTimeRemaining(sale.end_time)} left
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="table-cell">
                    <span className="products-count">{sale.products_count || 0} items</span>
                  </div>
                  <div className="table-cell">
                    {getStatusBadge(sale)}
                  </div>
                  <div className="table-cell">
                    <div className="action-buttons">
                      <button
                        className="action-btn edit"
                        onClick={() => handleEditFlashSale(sale)}
                        title="Edit Flash Sale"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        className="action-btn toggle"
                        onClick={() => handleToggleStatus(sale.id, sale.is_active)}
                        title={sale.is_active ? 'Deactivate' : 'Activate'}
                      >
                        <Zap className="h-4 w-4" />
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDeleteFlashSale(sale.id)}
                        title="Delete Flash Sale"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .flash-sales-widget {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .widget-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 24px;
          border-bottom: 1px solid #e5e7eb;
          background: linear-gradient(135deg, #fefbff 0%, #f3f4f6 100%);
        }

        .header-content h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 4px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .header-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
          border: none;
          cursor: pointer;
          text-decoration: none;
        }

        .btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          transform: translateY(-1px);
        }

        .btn-outline {
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .btn-outline:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 0.8125rem;
        }

        .loading-state, .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 24px;
          text-align: center;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: #fef2f2;
          color: #dc2626;
          border-bottom: 1px solid #fecaca;
        }

        .error-alert button {
          background: none;
          border: none;
          color: #dc2626;
          cursor: pointer;
          margin-left: auto;
          padding: 0;
          font-size: 18px;
        }

        .active-sales-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          padding: 24px;
          background: #f9fafb;
        }

        .summary-card {
          display: flex;
          align-items: center;
          gap: 12px;
          background: white;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .summary-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 8px;
          background: #f3f4f6;
        }

        .summary-content h4 {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin: 0 0 4px 0;
        }

        .summary-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
        }

        .summary-subtitle {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0;
        }

        .active-sales-section, .all-sales-section {
          padding: 24px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .active-sales-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .active-sale-card {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 1px solid #f59e0b;
          border-radius: 12px;
          padding: 16px;
        }

        .sale-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .sale-header h5 {
          font-size: 1rem;
          font-weight: 600;
          color: #92400e;
          margin: 0;
        }

        .discount-badge {
          background: #dc2626;
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .sale-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .info-label {
          font-size: 0.875rem;
          color: #92400e;
        }

        .time-remaining {
          font-weight: 600;
          color: #dc2626;
        }

        .progress-bar {
          width: 100%;
          height: 4px;
          background: rgba(146, 64, 14, 0.2);
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #dc2626;
          transition: width 0.3s ease;
        }

        .sales-table {
          background: white;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1.5fr 1fr 1fr 1fr;
          gap: 16px;
          padding: 16px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1.5fr 1fr 1fr 1fr;
          gap: 16px;
          padding: 16px;
          border-bottom: 1px solid #f3f4f6;
          transition: background-color 0.2s;
        }

        .table-row:hover {
          background: #f9fafb;
        }

        .table-cell {
          display: flex;
          align-items: center;
          font-size: 0.875rem;
        }

        .sale-name h6 {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 2px 0;
        }

        .sale-description {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0;
        }

        .discount-text {
          font-weight: 600;
          color: #dc2626;
        }

        .date-range {
          font-size: 0.8125rem;
          color: #374151;
        }

        .time-remaining-small {
          font-size: 0.75rem;
          color: #dc2626;
          font-weight: 500;
        }

        .products-count {
          font-weight: 500;
          color: #374151;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .status-badge.active {
          background: #d1fae5;
          color: #065f46;
        }

        .status-badge.upcoming {
          background: #dbeafe;
          color: #1e40af;
        }

        .status-badge.expired {
          background: #f3f4f6;
          color: #374151;
        }

        .status-badge.inactive {
          background: #fef2f2;
          color: #dc2626;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn.edit {
          background: #dbeafe;
          color: #2563eb;
        }

        .action-btn.edit:hover {
          background: #bfdbfe;
        }

        .action-btn.toggle {
          background: #fef3c7;
          color: #d97706;
        }

        .action-btn.toggle:hover {
          background: #fde68a;
        }

        .action-btn.delete {
          background: #fee2e2;
          color: #dc2626;
        }

        .action-btn.delete:hover {
          background: #fecaca;
        }

        .empty-state h5 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #374151;
          margin: 16px 0 8px 0;
        }

        .empty-state p {
          color: #6b7280;
          margin: 0 0 24px 0;
        }

        @media (max-width: 768px) {
          .active-sales-summary {
            grid-template-columns: 1fr;
          }

          .active-sales-grid {
            grid-template-columns: 1fr;
          }

          .table-header, .table-row {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .table-cell {
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #f3f4f6;
          }
        }
      `}</style>
    </div>
  );
};

export default FlashSalesWidget;