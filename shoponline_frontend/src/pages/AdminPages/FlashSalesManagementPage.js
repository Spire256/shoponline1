// src/pages/AdminPages/FlashSalesManagementPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import flashSalesAPI from '../../services/api/flashSalesAPI';
import productsAPI from '../../services/api/productsAPI';
import AdminLayout from '../../components/admin/Layout/AdminLayout';
import Button from '../../components/common/UI/Button/Button';
import Modal from '../../components/common/UI/Modal/Modal';
import LoadingOverlay from '../../components/common/UI/Loading/LoadingOverlay';
import Alert from '../../components/common/UI/Alert/Alert';
import './FlashSalesManagementPage.css';

const FlashSalesManagementPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotifications();

  // State management
  const [flashSales, setFlashSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSales, setSelectedSales] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddProductsModal, setShowAddProductsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentSale, setCurrentSale] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('-created_at');

  // Form state for creating/editing flash sales
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_percentage: '',
    start_time: '',
    end_time: '',
    max_discount_amount: '',
    banner_image: null,
    priority: 0,
    is_active: true,
  });

  // Product selection state
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productPage, setProductPage] = useState(1);

  // Load flash sales
  const loadFlashSales = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        search: searchTerm,
        ordering: sortBy,
        ...(statusFilter !== 'all' && { status: statusFilter }),
      };

      const response = await flashSalesAPI.getFlashSales(params);
      setFlashSales(response.results);
      setTotalPages(Math.ceil(response.count / 20));
    } catch (err) {
      setError('Failed to load flash sales');
      showNotification('Failed to load flash sales', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, sortBy, statusFilter, showNotification]);

  // Load products for selection
  const loadProducts = useCallback(async () => {
    try {
      const params = {
        page: productPage,
        search: productSearchTerm,
        is_active: true,
        page_size: 20,
      };

      const response = await productsAPI.getProducts(params);
      if (productPage === 1) {
        setProducts(response.results);
      } else {
        setProducts(prev => [...prev, ...response.results]);
      }
    } catch (err) {
      showNotification('Failed to load products', 'error');
    }
  }, [productPage, productSearchTerm, showNotification]);

  useEffect(() => {
    loadFlashSales();
  }, [loadFlashSales]);

  useEffect(() => {
    if (showAddProductsModal) {
      loadProducts();
    }
  }, [loadProducts, showAddProductsModal]);

  // Real-time countdown updates
  useEffect(() => {
    const interval = setInterval(() => {
      setFlashSales(prevSales =>
        prevSales.map(sale => ({
          ...sale,
          time_remaining: Math.max(0, sale.time_remaining - 1),
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle form changes
  const handleFormChange = e => {
    const { name, value, type, checked, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value,
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      discount_percentage: '',
      start_time: '',
      end_time: '',
      max_discount_amount: '',
      banner_image: null,
      priority: 0,
      is_active: true,
    });
    setCurrentSale(null);
  };

  // Create flash sale
  const handleCreate = async e => {
    e.preventDefault();
    try {
      setActionLoading(true);

      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });

      await flashSalesAPI.createFlashSale(formDataToSend);
      showNotification('Flash sale created successfully!', 'success');
      setShowCreateModal(false);
      resetForm();
      loadFlashSales();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create flash sale';
      showNotification(errorMessage, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Edit flash sale
  const handleEdit = async e => {
    e.preventDefault();
    try {
      setActionLoading(true);

      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });

      await flashSalesAPI.updateFlashSale(currentSale.id, formDataToSend);
      showNotification('Flash sale updated successfully!', 'success');
      setShowEditModal(false);
      resetForm();
      loadFlashSales();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update flash sale';
      showNotification(errorMessage, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete flash sale
  const handleDelete = async () => {
    try {
      setActionLoading(true);
      await flashSalesAPI.deleteFlashSale(currentSale.id);
      showNotification('Flash sale deleted successfully!', 'success');
      setShowDeleteModal(false);
      setCurrentSale(null);
      loadFlashSales();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete flash sale';
      showNotification(errorMessage, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle flash sale active status
  const handleToggleActive = async sale => {
    try {
      setActionLoading(true);
      if (sale.is_active) {
        await flashSalesAPI.pauseFlashSale(sale.id);
        showNotification('Flash sale deactivated', 'success');
      } else {
        await flashSalesAPI.resumeFlashSale(sale.id);
        showNotification('Flash sale activated', 'success');
      }
      loadFlashSales();
    } catch (err) {
      showNotification('Failed to update flash sale status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Add products to flash sale
  const handleAddProducts = async () => {
    if (!currentSale || selectedProducts.length === 0) {
      showNotification('Please select products to add', 'warning');
      return;
    }

    try {
      setActionLoading(true);
      const productIds = selectedProducts.map(product => product.id);

      await flashSalesAPI.bulkAddProductsToFlashSale(currentSale.id, productIds, {
        is_active: true,
      });
      showNotification(`Added ${selectedProducts.length} products to flash sale`, 'success');
      setShowAddProductsModal(false);
      setSelectedProducts([]);
      setCurrentSale(null);
      loadFlashSales();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to add products';
      showNotification(errorMessage, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Open edit modal
  const openEditModal = sale => {
    setCurrentSale(sale);
    setFormData({
      name: sale.name,
      description: sale.description,
      discount_percentage: sale.discount_percentage,
      start_time: new Date(sale.start_time).toISOString().slice(0, 16),
      end_time: new Date(sale.end_time).toISOString().slice(0, 16),
      max_discount_amount: sale.max_discount_amount || '',
      banner_image: null,
      priority: sale.priority,
      is_active: sale.is_active,
    });
    setShowEditModal(true);
  };

  // Open add products modal
  const openAddProductsModal = sale => {
    setCurrentSale(sale);
    setSelectedProducts([]);
    setProductSearchTerm('');
    setProductPage(1);
    setShowAddProductsModal(true);
  };

  // Format time remaining
  const formatTimeRemaining = seconds => {
    if (seconds <= 0) return 'Expired';

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  // Get status badge class
  const getStatusBadgeClass = sale => {
    if (sale.is_expired) return 'badge-danger';
    if (sale.is_running) return 'badge-success';
    if (sale.is_upcoming) return 'badge-warning';
    if (!sale.is_active) return 'badge-secondary';
    return 'badge-primary';
  };

  // Get status text
  const getStatusText = sale => {
    if (!sale.is_active) return 'Inactive';
    if (sale.is_expired) return 'Expired';
    if (sale.is_running) return 'Running';
    if (sale.is_upcoming) return 'Upcoming';
    return 'Draft';
  };

  // Filter flash sales
  const filteredFlashSales = flashSales.filter(sale => {
    const matchesSearch =
      sale.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.description.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'active') return matchesSearch && sale.is_running;
    if (statusFilter === 'upcoming') return matchesSearch && sale.is_upcoming;
    if (statusFilter === 'expired') return matchesSearch && sale.is_expired;
    if (statusFilter === 'inactive') return matchesSearch && !sale.is_active;

    return matchesSearch;
  });

  if (loading) {
    return (
      <AdminLayout>
        <LoadingOverlay message="Loading flash sales..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flash-sales-management">
        {/* Header */}
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">Flash Sales Management</h1>
            <p className="page-subtitle">Create and manage time-limited promotional sales</p>
          </div>
          <div className="header-actions">
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              className="create-btn"
            >
              <i className="icon-plus" /> Create Flash Sale
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert type="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Filters and Search */}
        <div className="flash-sales-filters">
          <div className="search-section">
            <div className="search-input-group">
              <i className="icon-search" />
              <input
                type="text"
                placeholder="Search flash sales..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="filter-section">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="active">Running</option>
              <option value="upcoming">Upcoming</option>
              <option value="expired">Expired</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="-created_at">Newest First</option>
              <option value="created_at">Oldest First</option>
              <option value="-start_time">Start Time (Latest)</option>
              <option value="start_time">Start Time (Earliest)</option>
              <option value="-priority">Priority (High to Low)</option>
              <option value="priority">Priority (Low to High)</option>
              <option value="name">Name (A-Z)</option>
              <option value="-name">Name (Z-A)</option>
            </select>
          </div>
        </div>

        {/* Flash Sales Grid */}
        <div className="flash-sales-content">
          {filteredFlashSales.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <i className="icon-flash" />
              </div>
              <h3>No Flash Sales Found</h3>
              <p>
                {searchTerm || statusFilter !== 'all'
                  ? 'No flash sales match your current filters.'
                  : 'Create your first flash sale to start offering time-limited discounts.'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button
                  variant="primary"
                  onClick={() => setShowCreateModal(true)}
                  className="create-first-btn"
                >
                  Create Flash Sale
                </Button>
              )}
            </div>
          ) : (
            <div className="flash-sales-grid">
              {filteredFlashSales.map(sale => (
                <div key={sale.id} className="flash-sale-card">
                  {/* Card Header */}
                  <div className="card-header">
                    <div className="sale-info">
                      <h3 className="sale-name">{sale.name}</h3>
                      <span className={`status-badge ${getStatusBadgeClass(sale)}`}>
                        {getStatusText(sale)}
                      </span>
                    </div>
                    <div className="card-actions">
                      <button
                        className="action-btn"
                        onClick={() => openEditModal(sale)}
                        title="Edit"
                      >
                        <i className="icon-edit" />
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => openAddProductsModal(sale)}
                        title="Add Products"
                      >
                        <i className="icon-plus" />
                      </button>
                      <button
                        className={`action-btn ${sale.is_active ? 'active' : 'inactive'}`}
                        onClick={() => handleToggleActive(sale)}
                        title={sale.is_active ? 'Deactivate' : 'Activate'}
                      >
                        <i className={`icon-${sale.is_active ? 'pause' : 'play'}`} />
                      </button>
                      <button
                        className="action-btn danger"
                        onClick={() => {
                          setCurrentSale(sale);
                          setShowDeleteModal(true);
                        }}
                        title="Delete"
                      >
                        <i className="icon-trash" />
                      </button>
                    </div>
                  </div>

                  {/* Banner Image */}
                  {sale.banner_image && (
                    <div className="sale-banner">
                      <img src={sale.banner_image} alt={sale.name} />
                    </div>
                  )}

                  {/* Sale Details */}
                  <div className="card-body">
                    <div className="sale-details">
                      <div className="detail-row">
                        <span className="label">Discount:</span>
                        <span className="value discount">{sale.discount_percentage}% OFF</span>
                      </div>

                      <div className="detail-row">
                        <span className="label">Products:</span>
                        <span className="value">{sale.products_count} items</span>
                      </div>

                      <div className="detail-row">
                        <span className="label">Start Time:</span>
                        <span className="value">{new Date(sale.start_time).toLocaleString()}</span>
                      </div>

                      <div className="detail-row">
                        <span className="label">End Time:</span>
                        <span className="value">{new Date(sale.end_time).toLocaleString()}</span>
                      </div>

                      {sale.max_discount_amount && (
                        <div className="detail-row">
                          <span className="label">Max Discount:</span>
                          <span className="value">
                            UGX {sale.max_discount_amount.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Countdown Timer */}
                    {(sale.is_running || sale.is_upcoming) && (
                      <div className="countdown-section">
                        <div className="countdown-label">
                          {sale.is_upcoming ? 'Starts in:' : 'Ends in:'}
                        </div>
                        <div className="countdown-timer">
                          {formatTimeRemaining(sale.time_remaining)}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {sale.description && (
                      <div className="sale-description">
                        <p>{sale.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="card-footer">
                    <div className="footer-info">
                      <small>Created by {sale.created_by_name}</small>
                      <small>{new Date(sale.created_at).toLocaleDateString()}</small>
                    </div>
                    <div className="priority-indicator">Priority: {sale.priority}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>

              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* Create Flash Sale Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          title="Create New Flash Sale"
          size="large"
        >
          <form onSubmit={handleCreate} className="flash-sale-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">Flash Sale Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g., Weekend Electronics Sale"
                />
              </div>

              <div className="form-group">
                <label htmlFor="discount_percentage">Discount Percentage *</label>
                <input
                  type="number"
                  id="discount_percentage"
                  name="discount_percentage"
                  value={formData.discount_percentage}
                  onChange={handleFormChange}
                  required
                  min="1"
                  max="100"
                  step="0.01"
                  placeholder="25.00"
                />
              </div>

              <div className="form-group">
                <label htmlFor="start_time">Start Time *</label>
                <input
                  type="datetime-local"
                  id="start_time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleFormChange}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="end_time">End Time *</label>
                <input
                  type="datetime-local"
                  id="end_time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleFormChange}
                  required
                  min={formData.start_time || new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="max_discount_amount">Max Discount (UGX)</label>
                <input
                  type="number"
                  id="max_discount_amount"
                  name="max_discount_amount"
                  value={formData.max_discount_amount}
                  onChange={handleFormChange}
                  min="0"
                  step="1000"
                  placeholder="Optional maximum discount amount"
                />
              </div>

              <div className="form-group">
                <label htmlFor="priority">Priority</label>
                <input
                  type="number"
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleFormChange}
                  min="0"
                  placeholder="0"
                />
                <small>Higher numbers appear first</small>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                rows={4}
                placeholder="Describe your flash sale..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="banner_image">Banner Image</label>
              <input
                type="file"
                id="banner_image"
                name="banner_image"
                onChange={handleFormChange}
                accept="image/*"
              />
              <small>Upload a banner image for your flash sale</small>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleFormChange}
                />
                <span className="checkmark" />
                Active flash sale
              </label>
            </div>

            <div className="modal-actions">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={actionLoading}
                disabled={actionLoading}
              >
                Create Flash Sale
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Flash Sale Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            resetForm();
          }}
          title="Edit Flash Sale"
          size="large"
        >
          <form onSubmit={handleEdit} className="flash-sale-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="edit_name">Flash Sale Name *</label>
                <input
                  type="text"
                  id="edit_name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g., Weekend Electronics Sale"
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit_discount_percentage">Discount Percentage *</label>
                <input
                  type="number"
                  id="edit_discount_percentage"
                  name="discount_percentage"
                  value={formData.discount_percentage}
                  onChange={handleFormChange}
                  required
                  min="1"
                  max="100"
                  step="0.01"
                  placeholder="25.00"
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit_start_time">Start Time *</label>
                <input
                  type="datetime-local"
                  id="edit_start_time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit_end_time">End Time *</label>
                <input
                  type="datetime-local"
                  id="edit_end_time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleFormChange}
                  required
                  min={formData.start_time}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit_max_discount_amount">Max Discount (UGX)</label>
                <input
                  type="number"
                  id="edit_max_discount_amount"
                  name="max_discount_amount"
                  value={formData.max_discount_amount}
                  onChange={handleFormChange}
                  min="0"
                  step="1000"
                  placeholder="Optional maximum discount amount"
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit_priority">Priority</label>
                <input
                  type="number"
                  id="edit_priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleFormChange}
                  min="0"
                  placeholder="0"
                />
                <small>Higher numbers appear first</small>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="edit_description">Description</label>
              <textarea
                id="edit_description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                rows={4}
                placeholder="Describe your flash sale..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit_banner_image">Banner Image</label>
              <input
                type="file"
                id="edit_banner_image"
                name="banner_image"
                onChange={handleFormChange}
                accept="image/*"
              />
              <small>Upload a new banner image (leave empty to keep current)</small>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleFormChange}
                />
                <span className="checkmark" />
                Active flash sale
              </label>
            </div>

            <div className="modal-actions">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={actionLoading}
                disabled={actionLoading}
              >
                Update Flash Sale
              </Button>
            </div>
          </form>
        </Modal>

        {/* Add Products Modal */}
        <Modal
          isOpen={showAddProductsModal}
          onClose={() => {
            setShowAddProductsModal(false);
            setSelectedProducts([]);
            setCurrentSale(null);
          }}
          title={`Add Products to ${currentSale?.name}`}
          size="large"
        >
          <div className="add-products-modal">
            {/* Product Search */}
            <div className="product-search">
              <div className="search-input-group">
                <i className="icon-search" />
                <input
                  type="text"
                  placeholder="Search products to add..."
                  value={productSearchTerm}
                  onChange={e => {
                    setProductSearchTerm(e.target.value);
                    setProductPage(1);
                  }}
                  className="search-input"
                />
              </div>
            </div>

            {/* Selected Products Count */}
            {selectedProducts.length > 0 && (
              <div className="selected-count">
                <span className="count-badge">{selectedProducts.length} products selected</span>
              </div>
            )}

            {/* Products List */}
            <div className="products-list">
              {products.map(product => (
                <div
                  key={product.id}
                  className={`product-item ${
                    selectedProducts.find(p => p.id === product.id) ? 'selected' : ''
                  }`}
                  onClick={() => {
                    setSelectedProducts(prev => {
                      const isSelected = prev.find(p => p.id === product.id);
                      if (isSelected) {
                        return prev.filter(p => p.id !== product.id);
                      } else {
                        return [...prev, product];
                      }
                    });
                  }}
                >
                  <div className="product-image">
                    <img
                      src={product.thumbnail_url || product.image_url || '/placeholder-product.jpg'}
                      alt={product.name}
                    />
                  </div>
                  <div className="product-info">
                    <h4 className="product-name">{product.name}</h4>
                    <p className="product-price">UGX {product.price.toLocaleString()}</p>
                    <p className="product-category">{product.category?.name}</p>
                    <div className="product-meta">
                      <span
                        className={`stock-badge ${
                          product.is_in_stock ? 'in-stock' : 'out-of-stock'
                        }`}
                      >
                        {product.is_in_stock ? 'In Stock' : 'Out of Stock'}
                      </span>
                      {product.is_featured && <span className="featured-badge">Featured</span>}
                    </div>
                  </div>
                  <div className="selection-indicator">
                    <i
                      className={`icon-${
                        selectedProducts.find(p => p.id === product.id) ? 'check' : 'plus'
                      }`}
                    />
                  </div>
                </div>
              ))}

              {/* Load More Products */}
              {products.length > 0 && products.length % 20 === 0 && (
                <div className="load-more">
                  <Button
                    variant="outline"
                    onClick={() => setProductPage(prev => prev + 1)}
                    disabled={actionLoading}
                  >
                    Load More Products
                  </Button>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddProductsModal(false);
                  setSelectedProducts([]);
                  setCurrentSale(null);
                }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleAddProducts}
                loading={actionLoading}
                disabled={actionLoading || selectedProducts.length === 0}
              >
                Add {selectedProducts.length} Products
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setCurrentSale(null);
          }}
          title="Delete Flash Sale"
          size="small"
        >
          <div className="delete-confirmation">
            <div className="warning-icon">
              <i className="icon-warning" />
            </div>
            <h3>Are you sure?</h3>
            <p>
              This will permanently delete the flash sale "{currentSale?.name}". This action cannot
              be undone.
            </p>
            <div className="modal-actions">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setCurrentSale(null);
                }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                loading={actionLoading}
                disabled={actionLoading}
              >
                Delete Flash Sale
              </Button>
            </div>
          </div>
        </Modal>

        {/* Loading Overlay */}
        {actionLoading && <LoadingOverlay message="Processing..." />}
      </div>
    </AdminLayout>
  );
};

export default FlashSalesManagementPage;
