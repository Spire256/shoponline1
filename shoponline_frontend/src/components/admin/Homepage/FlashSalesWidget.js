import React, { useState, useEffect } from 'react';
import { Zap, Plus, Edit, Eye, EyeOff, Clock, Package, Percent, Calendar } from 'lucide-react';

const FlashSalesWidget = ({ onDataChange }) => {
  const [flashSales, setFlashSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_percentage: '',
    start_time: '',
    end_time: '',
    is_active: true,
    max_discount_amount: '',
    priority: 1,
  });

  useEffect(() => {
    fetchFlashSales();
  }, []);

  const fetchFlashSales = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/flash-sales/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFlashSales(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching flash sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingSale
        ? `/api/admin/flash-sales/${editingSale.id}/`
        : '/api/admin/flash-sales/';

      const method = editingSale ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          discount_percentage: parseFloat(formData.discount_percentage),
          max_discount_amount: formData.max_discount_amount
            ? parseFloat(formData.max_discount_amount)
            : null,
          priority: parseInt(formData.priority),
        }),
      });

      if (response.ok) {
        await fetchFlashSales();
        setShowCreateModal(false);
        setEditingSale(null);
        resetForm();
        onDataChange();
      }
    } catch (error) {
      console.error('Error saving flash sale:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = sale => {
    setEditingSale(sale);
    setFormData({
      name: sale.name,
      description: sale.description || '',
      discount_percentage: sale.discount_percentage.toString(),
      start_time: sale.start_time ? new Date(sale.start_time).toISOString().slice(0, 16) : '',
      end_time: sale.end_time ? new Date(sale.end_time).toISOString().slice(0, 16) : '',
      is_active: sale.is_active,
      max_discount_amount: sale.max_discount_amount?.toString() || '',
      priority: sale.priority.toString(),
    });
    setShowCreateModal(true);
  };

  const handleToggleActive = async sale => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/flash-sales/${sale.id}/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !sale.is_active }),
      });

      if (response.ok) {
        await fetchFlashSales();
        onDataChange();
      }
    } catch (error) {
      console.error('Error toggling flash sale status:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      discount_percentage: '',
      start_time: '',
      end_time: '',
      is_active: true,
      max_discount_amount: '',
      priority: 1,
    });
  };

  const getStatusInfo = sale => {
    const now = new Date();
    const startTime = new Date(sale.start_time);
    const endTime = new Date(sale.end_time);

    if (!sale.is_active) {
      return { status: 'inactive', label: 'Inactive', color: '#6b7280' };
    } else if (now < startTime) {
      return { status: 'upcoming', label: 'Upcoming', color: '#3b82f6' };
    } else if (now >= startTime && now <= endTime) {
      return { status: 'running', label: 'Running', color: '#059669' };
    } else {
      return { status: 'expired', label: 'Expired', color: '#dc2626' };
    }
  };

  const formatDateTime = dateTimeStr => {
    if (!dateTimeStr) return 'Not set';
    return new Date(dateTimeStr).toLocaleString();
  };

  const calculateTimeRemaining = endTime => {
    if (!endTime) return null;

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

  return (
    <div className="flash-sales-widget">
      <div className="flash-sales-widget__header">
        <div className="flash-sales-widget__title">
          <h2>Flash Sales Widget</h2>
          <p>Manage flash sales displayed on homepage</p>
        </div>

        <button className="btn btn--primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={20} />
          Create Flash Sale
        </button>
      </div>

      {showCreateModal && (
        <div className="flash-sale-modal">
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)} />
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingSale ? 'Edit Flash Sale' : 'Create Flash Sale'}</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                ×
              </button>
            </div>

            <div className="flash-sale-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Sale Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Weekend Flash Sale"
                  />
                </div>

                <div className="form-group">
                  <label>Discount Percentage *</label>
                  <div className="input-with-icon">
                    <input
                      type="number"
                      value={formData.discount_percentage}
                      onChange={e =>
                        setFormData({ ...formData, discount_percentage: e.target.value })
                      }
                      required
                      min="1"
                      max="90"
                      placeholder="25"
                    />
                    <Percent size={16} />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows="2"
                  placeholder="Limited time offer on selected products..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>End Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Max Discount Amount (UGX)</label>
                  <input
                    type="number"
                    value={formData.max_discount_amount}
                    onChange={e =>
                      setFormData({ ...formData, max_discount_amount: e.target.value })
                    }
                    placeholder="100000"
                    min="0"
                  />
                  <small className="form-help">
                    Maximum discount per product (leave empty for no limit)
                  </small>
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="1">High (1)</option>
                    <option value="2">Medium (2)</option>
                    <option value="3">Low (3)</option>
                  </select>
                  <small className="form-help">Higher priority sales appear first</small>
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span>Active</span>
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={loading}
                  onClick={handleSubmit}
                >
                  {editingSale ? 'Update' : 'Create'} Flash Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flash-sales-list">
        {loading && flashSales.length === 0 ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading flash sales...</p>
          </div>
        ) : (
          <>
            {flashSales.length === 0 ? (
              <div className="empty-state">
                <Zap size={48} />
                <h3>No flash sales found</h3>
                <p>Create your first flash sale to boost homepage engagement</p>
                <button className="btn btn--primary" onClick={() => setShowCreateModal(true)}>
                  Create Flash Sale
                </button>
              </div>
            ) : (
              flashSales.map(sale => {
                const statusInfo = getStatusInfo(sale);
                const timeRemaining = calculateTimeRemaining(sale.end_time);

                return (
                  <div key={sale.id} className="flash-sale-card">
                    <div className="flash-sale-card__header">
                      <div className="sale-info">
                        <h3>{sale.name}</h3>
                        <div className="sale-meta">
                          <span
                            className="sale-status"
                            style={{ backgroundColor: statusInfo.color }}
                          >
                            {statusInfo.label}
                          </span>
                          <span className="sale-discount">
                            <Percent size={14} />
                            {sale.discount_percentage}% OFF
                          </span>
                          <span className="sale-products">
                            <Package size={14} />
                            {sale.products_count} products
                          </span>
                        </div>
                      </div>

                      <div className="sale-actions">
                        <button
                          className={`status-toggle ${sale.is_active ? 'active' : 'inactive'}`}
                          onClick={() => handleToggleActive(sale)}
                        >
                          {sale.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>

                        <button
                          className="btn btn--secondary btn--sm"
                          onClick={() => handleEdit(sale)}
                        >
                          <Edit size={16} />
                          Edit
                        </button>
                      </div>
                    </div>

                    {sale.description && <p className="sale-description">{sale.description}</p>}

                    <div className="sale-timing">
                      <div className="timing-item">
                        <Calendar size={16} />
                        <span>
                          <strong>Starts:</strong> {formatDateTime(sale.start_time)}
                        </span>
                      </div>

                      <div className="timing-item">
                        <Calendar size={16} />
                        <span>
                          <strong>Ends:</strong> {formatDateTime(sale.end_time)}
                        </span>
                      </div>

                      {statusInfo.status === 'running' && timeRemaining && (
                        <div className="timing-item time-remaining">
                          <Clock size={16} />
                          <span>
                            <strong>Time remaining:</strong> {timeRemaining}
                          </span>
                        </div>
                      )}
                    </div>

                    {sale.max_discount_amount && (
                      <div className="sale-limit">
                        Max discount: UGX {new Intl.NumberFormat().format(sale.max_discount_amount)}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FlashSalesWidget;
