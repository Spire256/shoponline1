import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Move, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useNotifications } from '../../../hooks/useNotifications';
import homepageAPI from '../../../services/api/homepageAPI';

const BannerManager = ({ onDataChange, onAlert }) => {
  const { user } = useAuth();
  const { showNotification } = useNotifications();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create' or 'edit'
  const [filterType, setFilterType] = useState('all');
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    banner_type: 'promo',
    link_url: '',
    link_text: '',
    order: 0,
    is_active: true,
    start_date: '',
    end_date: '',
    image: null
  });

  const bannerTypes = [
    { value: 'hero', label: 'Hero Banner' },
    { value: 'promo', label: 'Promotional Banner' },
    { value: 'category', label: 'Category Banner' },
    { value: 'flash_sale', label: 'Flash Sale Banner' }
  ];

  useEffect(() => {
    fetchBanners();
  }, [filterType]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const params = filterType !== 'all' ? { type: filterType } : {};
      const response = await homepageAPI.getBanners(params);
      setBanners(response.data || response.results || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      showNotification('Failed to load banners', 'error');
      onAlert && onAlert('error', 'Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBanner = () => {
    setModalType('create');
    setFormData({
      title: '',
      description: '',
      banner_type: 'promo',
      link_url: '',
      link_text: '',
      order: 0,
      is_active: true,
      start_date: '',
      end_date: '',
      image: null
    });
    setSelectedBanner(null);
    setShowModal(true);
  };

  const handleEditBanner = (banner) => {
    setModalType('edit');
    setFormData({
      title: banner.title,
      description: banner.description,
      banner_type: banner.banner_type,
      link_url: banner.link_url || '',
      link_text: banner.link_text || '',
      order: banner.order,
      is_active: banner.is_active,
      start_date: banner.start_date ? banner.start_date.split('T')[0] : '',
      end_date: banner.end_date ? banner.end_date.split('T')[0] : '',
      image: null
    });
    setSelectedBanner(banner);
    setShowModal(true);
  };

  const handleDeleteBanner = async (bannerId) => {
    if (window.confirm('Are you sure you want to delete this banner?')) {
      try {
        setLoading(true);
        await homepageAPI.deleteBanner(bannerId);
        showNotification('Banner deleted successfully', 'success');
        onAlert && onAlert('success', 'Banner deleted successfully!');
        fetchBanners();
        onDataChange && onDataChange();
      } catch (error) {
        console.error('Error deleting banner:', error);
        showNotification('Failed to delete banner', 'error');
        onAlert && onAlert('error', 'Failed to delete banner');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleStatus = async (bannerId, currentStatus) => {
    try {
      const banner = banners.find(b => b.id === bannerId);
      const updatedBanner = { ...banner, is_active: !currentStatus };
      await homepageAPI.updateBanner(bannerId, updatedBanner);
      showNotification(`Banner ${updatedBanner.is_active ? 'activated' : 'deactivated'} successfully`, 'success');
      onAlert && onAlert('success', `Banner ${updatedBanner.is_active ? 'activated' : 'deactivated'} successfully!`);
      fetchBanners();
      onDataChange && onDataChange();
    } catch (error) {
      console.error('Error updating banner status:', error);
      showNotification('Failed to update banner status', 'error');
      onAlert && onAlert('error', 'Failed to update banner status');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'image' && formData[key]) {
          submitData.append(key, formData[key]);
        } else if (key !== 'image') {
          submitData.append(key, formData[key]);
        }
      });
      submitData.append('created_by', user.id);

      if (formData.start_date) {
        submitData.set('start_date', new Date(formData.start_date).toISOString());
      }
      if (formData.end_date) {
        submitData.set('end_date', new Date(formData.end_date).toISOString());
      }

      if (modalType === 'create') {
        await homepageAPI.createBanner(submitData);
        showNotification('Banner created successfully', 'success');
        onAlert && onAlert('success', 'Banner created successfully!');
      } else {
        await homepageAPI.updateBanner(selectedBanner.id, submitData);
        showNotification('Banner updated successfully', 'success');
        onAlert && onAlert('success', 'Banner updated successfully!');
      }
      setShowModal(false);
      fetchBanners();
      onDataChange && onDataChange();
    } catch (error) {
      console.error('Error saving banner:', error);
      showNotification('Failed to save banner', 'error');
      onAlert && onAlert('error', `Failed to ${modalType === 'create' ? 'create' : 'update'} banner`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked :
              type === 'file' ? files[0] :
              value
    }));
  };

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverItem(index);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === dropIndex) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }
    try {
      const newBanners = [...banners];
      const draggedBanner = newBanners[draggedItem];
      newBanners.splice(draggedItem, 1);
      newBanners.splice(dropIndex, 0, draggedBanner);
      const bannerOrders = newBanners.map((banner, index) => ({
        id: banner.id,
        order: index
      }));
      await homepageAPI.reorderBanners({ banner_orders: bannerOrders });
      setBanners(newBanners);
      showNotification('Banner order updated', 'success');
      onAlert && onAlert('success', 'Banner order updated successfully!');
      onDataChange && onDataChange();
    } catch (error) {
      console.error('Error reordering banners:', error);
      showNotification('Failed to update banner order', 'error');
      onAlert && onAlert('error', 'Failed to update banner order');
    }
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const filteredBanners = banners.filter(banner => {
    if (filterType === 'all') return true;
    return banner.banner_type === filterType;
  });

  if (loading) {
    return (
      <div className="banner-manager-loading">
        <div className="loading-spinner" />
        <p>Loading banners...</p>
      </div>
    );
  }

  return (
    <div className="banner-manager">
      <div className="banner-manager__header">
        <div>
          <h3>Banner Management</h3>
          <p>Manage homepage banners and promotional content</p>
        </div>
        <div className="header-right">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Banners</option>
            {bannerTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleCreateBanner}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Banner
          </button>
        </div>
      </div>
      <div className="banner-grid">
        {filteredBanners.map((banner, index) => (
          <div
            key={banner.id}
            className={`banner-card ${dragOverItem === index ? 'drag-over' : ''} ${!banner.is_active ? 'inactive' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
          >
            <div className="banner-card__image">
              {banner.image ? (
                <img src={banner.image} alt={banner.title} />
              ) : (
                <div className="banner-placeholder">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                  <span>No Image</span>
                </div>
              )}
              <div className="banner-overlay">
                <button
                  onClick={() => handleEditBanner(banner)}
                  className="overlay-btn"
                  title="Edit Banner"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleToggleStatus(banner.id, banner.is_active)}
                  className="overlay-btn"
                  title={banner.is_active ? 'Hide Banner' : 'Show Banner'}
                >
                  {banner.is_active ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleDeleteBanner(banner.id)}
                  className="overlay-btn delete"
                  title="Delete Banner"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="banner-card__content">
              <div className="banner-card__header">
                <h4>{banner.title}</h4>
                <div className="banner-badges">
                  <span className={`badge badge-${banner.banner_type}`}>
                    {bannerTypes.find(t => t.value === banner.banner_type)?.label}
                  </span>
                  <span className={`badge ${banner.is_active ? 'badge-success' : 'badge-gray'}`}>
                    {banner.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              {banner.description && (
                <p className="banner-description">{banner.description}</p>
              )}
              <div className="banner-meta">
                <div className="meta-item">
                  <Move className="w-4 h-4 text-gray-400" />
                  <span>Order: {banner.order}</span>
                </div>
                {banner.link_url && (
                  <div className="meta-item">
                    <span className="link-indicator">🔗</span>
                    <span>{banner.link_text || 'Has Link'}</span>
                  </div>
                )}
                {(banner.start_date || banner.end_date) && (
                  <div className="banner-dates">
                    {banner.start_date && (
                      <small>Start: {new Date(banner.start_date).toLocaleDateString()}</small>
                    )}
                    {banner.end_date && (
                      <small>End: {new Date(banner.end_date).toLocaleDateString()}</small>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {filteredBanners.length === 0 && (
          <div className="empty-state">
            <ImageIcon className="w-12 h-12 text-gray-400 mb-4" />
            <h4>No Banners Yet</h4>
            <p>Create your first banner to get started</p>
            <button onClick={handleCreateBanner} className="btn btn-primary mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Create Banner
            </button>
          </div>
        )}
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalType === 'create' ? 'Create New Banner' : 'Edit Banner'}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter banner title"
                  />
                </div>
                <div className="form-group">
                  <label>Banner Type *</label>
                  <select
                    name="banner_type"
                    value={formData.banner_type}
                    onChange={handleInputChange}
                    required
                  >
                    {bannerTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Enter banner description"
                  />
                </div>
                <div className="form-group">
                  <label>Link URL</label>
                  <input
                    type="url"
                    name="link_url"
                    value={formData.link_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="form-group">
                  <label>Link Text</label>
                  <input
                    type="text"
                    name="link_text"
                    value={formData.link_text}
                    onChange={handleInputChange}
                    placeholder="Learn More"
                  />
                </div>
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Display Order</label>
                  <input
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <div className="checkbox-group">
                    <input
                      type="checkbox"
                      name="is_active"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="is_active">Active</label>
                  </div>
                </div>
                <div className="form-group full-width">
                  <label>Banner Image</label>
                  <input
                    type="file"
                    name="image"
                    onChange={handleInputChange}
                    accept="image/*"
                  />
                  <small className="form-help">
                    Recommended size: 1200x400px for hero banners, 800x300px for other banners
                  </small>
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {modalType === 'create' ? 'Create Banner' : 'Update Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style jsx>{`
        .banner-manager {
          padding: 1.5rem;
        }
        .banner-manager__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }
        .banner-manager__header h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
          color: #1e293b;
        }
        .banner-manager__header p {
          color: #64748b;
          margin: 0;
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .filter-select {
          padding: 0.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 0.875rem;
          color: #1e293b;
        }
        .banner-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        .banner-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          transition: all 0.3s ease;
          cursor: move;
        }
        .banner-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.15);
        }
        .banner-card.drag-over {
          border: 2px dashed #2563eb;
          background: #eff6ff;
        }
        .banner-card.inactive {
          opacity: 0.7;
        }
        .banner-card__image {
          position: relative;
          width: 100%;
          height: 150px;
          overflow: hidden;
        }
        .banner-card__image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .banner-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          border: 2px dashed #e2e8f0;
          color: #64748b;
        }
        .banner-overlay {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .banner-card:hover .banner-overlay {
          opacity: 1;
        }
        .overlay-btn {
          background: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 6px;
          padding: 6px;
          cursor: pointer;
          color: #64748b;
          transition: all 0.2s ease;
        }
        .overlay-btn:hover {
          background: white;
          color: #2563eb;
        }
        .overlay-btn.delete:hover {
          color: #ef4444;
        }
        .banner-card__content {
          padding: 1rem;
        }
        .banner-card__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }
        .banner-card__header h4 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0;
          color: #1e293b;
          flex: 1;
          margin-right: 0.5rem;
        }
        .banner-badges {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex-shrink: 0;
        }
        .badge {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          text-align: center;
        }
        .badge-hero {
          background: #dbeafe;
          color: #1e40af;
        }
        .badge-promo {
          background: #dcfce7;
          color: #166534;
        }
        .badge-category {
          background: #fef3c7;
          color: #92400e;
        }
        .badge-flash_sale {
          background: #fee2e2;
          color: #991b1b;
        }
        .badge-success {
          background: #dcfce7;
          color: #166534;
        }
        .badge-gray {
          background: #f1f5f9;
          color: #64748b;
        }
        .banner-description {
          color: #64748b;
          font-size: 0.875rem;
          line-height: 1.4;
          margin: 0 0 0.75rem 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .banner-meta {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          color: #64748b;
          font-size: 0.75rem;
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .link-indicator {
          font-size: 0.875rem;
        }
        .banner-dates {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 3rem 1rem;
          color: #64748b;
        }
        .empty-state h4 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
          color: #1e293b;
        }
        .empty-state p {
          margin: 0 0 1rem 0;
        }
        .banner-manager-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          color: #64748b;
        }
        .loading-spinner {
          width: 2rem;
          height: 2rem;
          border: 3px solid #e2e8f0;
          border-top: 3px solid #2563eb;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .btn {
          display: inline-flex;
          align-items: center;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-primary {
          background: #2563eb;
          color: white;
        }
        .btn-primary:hover {
          background: #1d4ed8;
        }
        .btn-secondary {
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }
        .btn-secondary:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 1.5rem 1rem 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }
        .modal-header h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0;
          color: #1e293b;
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #64748b;
          padding: 0;
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-body {
          padding: 1.5rem;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
        }
        .form-group.full-width {
          grid-column: 1 / -1;
        }
        .form-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #1e293b;
          margin-bottom: 0.25rem;
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 0.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 0.875rem;
          color: #1e293b;
          transition: border-color 0.2s ease;
        }
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #2563eb;
        }
        .form-group textarea {
          resize: vertical;
        }
        .form-group input[type="file"] {
          padding: 0.25rem;
        }
        .form-help {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 0.25rem;
        }
        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .checkbox-group label {
          font-size: 0.875rem;
          color: #1e293b;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }
      `}</style>
    </div>
  );
};

export default BannerManager;