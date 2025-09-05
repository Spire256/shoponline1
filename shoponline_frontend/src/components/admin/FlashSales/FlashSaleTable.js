import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Eye, Play, Pause, Package, Users, TrendingUp } from 'lucide-react';
import './FlashSaleManagement.css';

const FlashSaleTable = ({ 
  flashSales, 
  onEdit, 
  onDelete, 
  onToggleStatus, 
  getStatusBadge, 
  formatTimeRemaining, 
  loading 
}) => {
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [timers, setTimers] = useState({});

  // Update timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const updatedTimers = {};
      
      flashSales.forEach(sale => {
        const endTime = new Date(sale.end_time);
        const startTime = new Date(sale.start_time);
        
        let timeRemaining = 0;
        let status = 'expired';
        
        if (startTime > now) {
          timeRemaining = Math.floor((startTime - now) / 1000);
          status = 'upcoming';
        } else if (endTime > now) {
          timeRemaining = Math.floor((endTime - now) / 1000);
          status = 'active';
        }
        
        updatedTimers[sale.id] = {
          timeRemaining,
          status,
          formattedTime: formatTime(timeRemaining, status === 'upcoming' ? 'starts' : 'ends')
        };
      });
      
      setTimers(updatedTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [flashSales]);

  const formatTime = (seconds, prefix = 'ends') => {
    if (seconds <= 0) {
      return prefix === 'starts' ? 'Starting now' : 'Expired';
    }

    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    let timeStr = '';
    if (days > 0) {
      timeStr = `${days}d ${hours}h`;
    } else if (hours > 0) {
      timeStr = `${hours}h ${minutes}m`;
    } else {
      timeStr = `${minutes}m`;
    }

    return `${prefix === 'starts' ? 'Starts in' : 'Ends in'} ${timeStr}`;
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedFlashSales = [...flashSales].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Handle date fields
    if (sortField === 'start_time' || sortField === 'end_time' || sortField === 'created_at') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }

    // Handle numeric fields
    if (sortField === 'discount_percentage' || sortField === 'priority') {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    }

    // Handle string fields
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const getSortIcon = (field) => {
    if (sortField !== field) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return `UGX ${parseFloat(amount).toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-UG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="table-loading">
        <div className="loading-spinner" />
        <p>Loading flash sales...</p>
      </div>
    );
  }

  if (flashSales.length === 0) {
    return (
      <div className="table-empty">
        <Package size={48} />
        <h3>No Flash Sales Found</h3>
        <p>Create your first flash sale to get started</p>
      </div>
    );
  }

  return (
    <div className="flash-sale-table-container">
      <div className="table-wrapper">
        <table className="flash-sale-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} className="sortable">
                Name {getSortIcon('name')}
              </th>
              <th onClick={() => handleSort('discount_percentage')} className="sortable">
                Discount {getSortIcon('discount_percentage')}
              </th>
              <th>Status</th>
              <th onClick={() => handleSort('start_time')} className="sortable">
                Start Time {getSortIcon('start_time')}
              </th>
              <th onClick={() => handleSort('end_time')} className="sortable">
                End Time {getSortIcon('end_time')}
              </th>
              <th>Timer</th>
              <th onClick={() => handleSort('priority')} className="sortable">
                Priority {getSortIcon('priority')}
              </th>
              <th>Products</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedFlashSales.map((sale) => (
              <tr key={sale.id} className="table-row">
                <td className="sale-name-cell">
                  <div className="sale-name-content">
                    <h4>{sale.name}</h4>
                    {sale.description && (
                      <p className="sale-description">{sale.description}</p>
                    )}
                    {sale.banner_image && (
                      <div className="banner-indicator">
                        <Eye size={12} />
                        <span>Has banner</span>
                      </div>
                    )}
                  </div>
                </td>
                
                <td className="discount-cell">
                  <div className="discount-info">
                    <span className="discount-percentage">
                      {sale.discount_percentage}%
                    </span>
                    {sale.max_discount_amount && (
                      <span className="max-discount">
                        Max: {formatCurrency(sale.max_discount_amount)}
                      </span>
                    )}
                  </div>
                </td>
                
                <td className="status-cell">
                  {getStatusBadge(sale)}
                </td>
                
                <td className="date-cell">
                  {formatDate(sale.start_time)}
                </td>
                
                <td className="date-cell">
                  {formatDate(sale.end_time)}
                </td>
                
                <td className="timer-cell">
                  <div className={`timer-display ${timers[sale.id]?.status || ''}`}>
                    {timers[sale.id]?.formattedTime || formatTimeRemaining?.(sale) || 'N/A'}
                  </div>
                </td>
                
                <td className="priority-cell">
                  <span className={`priority-badge priority-${sale.priority > 5 ? 'high' : sale.priority > 0 ? 'medium' : 'low'}`}>
                    {sale.priority}
                  </span>
                </td>
                
                <td className="products-cell">
                  <div className="products-info">
                    <Package size={14} />
                    <span>{sale.products_count || 0}</span>
                  </div>
                </td>
                
                <td className="actions-cell">
                  <div className="action-buttons">
                    <button
                      className="action-btn edit"
                      onClick={() => onEdit(sale)}
                      title="Edit Flash Sale"
                    >
                      <Edit size={16} />
                    </button>
                    
                    <button
                      className={`action-btn toggle ${sale.is_active ? 'active' : 'inactive'}`}
                      onClick={() => onToggleStatus(sale.id, sale.is_active)}
                      title={sale.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {sale.is_active ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    
                    <button
                      className="action-btn delete"
                      onClick={() => onDelete(sale.id)}
                      title="Delete Flash Sale"
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

      {/* Table Summary */}
      <div className="table-summary">
        <div className="summary-item">
          <TrendingUp size={16} />
          <span>Total: {flashSales.length}</span>
        </div>
        <div className="summary-item">
          <Users size={16} />
          <span>
            Active: {flashSales.filter(sale => {
              const now = new Date();
              const start = new Date(sale.start_time);
              const end = new Date(sale.end_time);
              return sale.is_active && start <= now && end > now;
            }).length}
          </span>
        </div>
        <div className="summary-item">
          <Package size={16} />
          <span>
            Products: {flashSales.reduce((total, sale) => total + (sale.products_count || 0), 0)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FlashSaleTable;