import React from 'react';
import { Eye, Edit, Trash2, Clock, Zap, TrendingUp, Calendar } from 'lucide-react';

const FlashSaleTable = ({ 
  flashSales, 
  onEdit, 
  onDelete, 
  onToggleStatus, 
  getStatusBadge, 
  loading 
}) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-UG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getPriorityBadge = (priority) => {
    if (priority >= 80) {
      return <span className="priority-badge high">High</span>;
    } else if (priority >= 50) {
      return <span className="priority-badge medium">Medium</span>;
    } else {
      return <span className="priority-badge low">Low</span>;
    }
  };

  if (loading) {
    return (
      <div className="flash-sale-table-container">
        <div className="table-loading">
          <div className="loading-spinner" />
          <p>Loading flash sales...</p>
        </div>
        <style jsx>{`
          .flash-sale-table-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }

          .table-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 4rem 2rem;
            color: #64748b;
          }

          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #e2e8f0;
            border-top: 4px solid #2563eb;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 1rem;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="flash-sale-table-container">
      <div className="table-header">
        <h3>Flash Sales Management</h3>
        <div className="table-stats">
          <div className="stat-item">
            <Zap className="stat-icon" />
            <span>{flashSales.length} Total Sales</span>
          </div>
          <div className="stat-item">
            <Clock className="stat-icon" />
            <span>{flashSales.filter(sale => sale.is_running).length} Active</span>
          </div>
        </div>
      </div>

      {flashSales.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Zap size={48} />
          </div>
          <h3>No Flash Sales Found</h3>
          <p>Start creating flash sales to boost your sales and engage customers.</p>
          <button className="btn btn-primary">Create Flash Sale</button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="flash-sale-table">
            <thead>
              <tr>
                <th>Sale Details</th>
                <th>Discount</th>
                <th>Products</th>
                <th>Schedule</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Performance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {flashSales.map((sale) => (
                <tr key={sale.id} className="table-row">
                  <td>
                    <div className="sale-info">
                      <div className="sale-name">{sale.name}</div>
                      <div className="sale-description">
                        {sale.description || 'No description provided'}
                      </div>
                      <div className="sale-meta">
                        <span className="sale-id">ID: {sale.id.slice(-8)}</span>
                        <span className="created-date">
                          Created: {formatDate(sale.created_at)}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="discount-info">
                      <div className="discount-percentage">{sale.discount_percentage}%</div>
                      {sale.max_discount_amount && (
                        <div className="max-discount">
                          Max: {formatCurrency(sale.max_discount_amount)}
                        </div>
                      )}
                    </div>
                  </td>

                  <td>
                    <div className="products-info">
                      <div className="product-count">
                        <span className="count">{sale.products_count || 0}</span>
                        <span className="label">Products</span>
                      </div>
                      {sale.flash_sale_products && sale.flash_sale_products.length > 0 && (
                        <div className="product-preview">
                          {sale.flash_sale_products.slice(0, 2).map((product, index) => (
                            <div key={index} className="product-item">
                              {product.product_name}
                            </div>
                          ))}
                          {sale.flash_sale_products.length > 2 && (
                            <div className="product-more">
                              +{sale.flash_sale_products.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  <td>
                    <div className="schedule-info">
                      <div className="time-slot">
                        <Calendar size={14} />
                        <div className="time-details">
                          <div className="start-time">
                            Starts: {formatDate(sale.start_time)}
                          </div>
                          <div className="end-time">
                            Ends: {formatDate(sale.end_time)}
                          </div>
                        </div>
                      </div>
                      {sale.is_running && (
                        <div className="time-remaining">
                          <Clock size={12} />
                          <span>{getTimeRemaining(sale.end_time)}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td>
                    <div className="status-column">
                      {getStatusBadge(sale)}
                      <button
                        onClick={() => onToggleStatus(sale.id, sale.is_active)}
                        className={`toggle-btn ${sale.is_active ? 'active' : 'inactive'}`}
                        title={sale.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {sale.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </td>

                  <td>
                    <div className="priority-column">
                      {getPriorityBadge(sale.priority || 0)}
                      <div className="priority-value">{sale.priority || 0}</div>
                    </div>
                  </td>

                  <td>
                    <div className="performance-info">
                      <div className="performance-stat">
                        <TrendingUp size={14} />
                        <span>Sales: {sale.total_sales || 0}</span>
                      </div>
                      <div className="performance-stat">
                        <span>Revenue: {formatCurrency(sale.total_revenue || 0)}</span>
                      </div>
                      <div className="performance-stat">
                        <span>Views: {sale.view_count || 0}</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => console.log('View sale:', sale.id)}
                        className="action-btn view"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => onEdit(sale)}
                        className="action-btn edit"
                        title="Edit Sale"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(sale.id)}
                        className="action-btn delete"
                        title="Delete Sale"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .flash-sale-table-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .table-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .table-header h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .table-stats {
          display: flex;
          gap: 1rem;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: white;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          color: #64748b;
        }

        .stat-icon {
          width: 16px;
          height: 16px;
          color: #2563eb;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
          color: #64748b;
        }

        .empty-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          color: #2563eb;
        }

        .empty-state h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 0.5rem 0;
        }

        .empty-state p {
          margin: 0 0 2rem 0;
          max-width: 400px;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .flash-sale-table {
          width: 100%;
          border-collapse: collapse;
        }

        .flash-sale-table th {
          background: #f8fafc;
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          color: #475569;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.025em;
          border-bottom: 1px solid #e2e8f0;
        }

        .flash-sale-table td {
          padding: 1rem;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: top;
        }

        .table-row:hover {
          background-color: #f8fafc;
        }

        .sale-info {
          min-width: 200px;
        }

        .sale-name {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.25rem;
          font-size: 0.875rem;
        }

        .sale-description {
          color: #64748b;
          font-size: 0.8125rem;
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }

        .sale-meta {
          display: flex;
          gap: 0.75rem;
          font-size: 0.75rem;
          color: #94a3b8;
        }

        .discount-info {
          text-align: center;
          min-width: 100px;
        }

        .discount-percentage {
          font-size: 1.5rem;
          font-weight: 700;
          color: #2563eb;
          margin-bottom: 0.25rem;
        }

        .max-discount {
          font-size: 0.75rem;
          color: #64748b;
          padding: 0.125rem 0.5rem;
          background: #f1f5f9;
          border-radius: 4px;
          display: inline-block;
        }

        .products-info {
          min-width: 150px;
        }

        .product-count {
          text-align: center;
          margin-bottom: 0.5rem;
        }

        .count {
          display: block;
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
        }

        .label {
          font-size: 0.75rem;
          color: #64748b;
        }

        .product-preview {
          font-size: 0.75rem;
          color: #64748b;
        }

        .product-item {
          margin-bottom: 0.125rem;
        }

        .product-more {
          color: #2563eb;
          font-weight: 500;
        }

        .schedule-info {
          min-width: 180px;
        }

        .time-slot {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .time-details {
          flex: 1;
        }

        .start-time,
        .end-time {
          font-size: 0.75rem;
          color: #64748b;
          margin-bottom: 0.125rem;
        }

        .time-remaining {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: #f59e0b;
          font-weight: 500;
          padding: 0.25rem 0.5rem;
          background: #fef3c7;
          border-radius: 4px;
          display: inline-flex;
        }

        .status-column {
          min-width: 120px;
        }

        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .status-active {
          background: #d1fae5;
          color: #065f46;
        }

        .status-upcoming {
          background: #dbeafe;
          color: #1e40af;
        }

        .status-expired {
          background: #fee2e2;
          color: #991b1b;
        }

        .status-inactive {
          background: #f3f4f6;
          color: #4b5563;
        }

        .toggle-btn {
          padding: 0.25rem 0.5rem;
          border: none;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .toggle-btn.active {
          background: #10b981;
          color: white;
        }

        .toggle-btn.inactive {
          background: #ef4444;
          color: white;
        }

        .toggle-btn:hover {
          opacity: 0.8;
        }

        .priority-column {
          text-align: center;
          min-width: 100px;
        }

        .priority-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .priority-badge.high {
          background: #fee2e2;
          color: #991b1b;
        }

        .priority-badge.medium {
          background: #fef3c7;
          color: #92400e;
        }

        .priority-badge.low {
          background: #d1fae5;
          color: #065f46;
        }

        .priority-value {
          font-size: 0.75rem;
          color: #64748b;
        }

        .performance-info {
          min-width: 120px;
        }

        .performance-stat {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: #64748b;
          margin-bottom: 0.25rem;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          padding: 0.5rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-btn.view {
          background: #dbeafe;
          color: #1e40af;
        }

        .action-btn.view:hover {
          background: #bfdbfe;
        }

        .action-btn.edit {
          background: #d1fae5;
          color: #065f46;
        }

        .action-btn.edit:hover {
          background: #a7f3d0;
        }

        .action-btn.delete {
          background: #fee2e2;
          color: #991b1b;
        }

        .action-btn.delete:hover {
          background: #fecaca;
        }

        @media (max-width: 768px) {
          .table-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .table-stats {
            flex-direction: column;
            gap: 0.5rem;
            width: 100%;
          }

          .stat-item {
            justify-content: center;
          }

          .flash-sale-table {
            min-width: 800px;
          }
        }
      `}</style>
    </div>
  );
};

export default FlashSaleTable;