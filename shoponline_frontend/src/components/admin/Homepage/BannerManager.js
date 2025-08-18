// src/components/admin/Homepage/BannerManager.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { homepageAPI } from '../../../services/api/homepageAPI';
import Button from '../../common/UI/Button/Button';
import Input from '../../common/UI/Form/Input';
import Select from '../../common/UI/Form/Select';
import TextArea from '../../common/UI/Form/TextArea';
import FileUpload from '../../common/UI/Form/FileUpload';
import Modal from '../../common/UI/Modal/Modal';
import Badge from '../../common/UI/Badge/Badge';
import LoadingOverlay from '../../common/UI/Loading/LoadingOverlay';

const BannerManager = ({ onAlert }) => {
  const { user } = useAuth();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [draggedItem, setDraggedItem] = useState(null);

  const [bannerForm, setBannerForm] = useState({
    title: '',
    description: '',
    image: null,
    banner_type: 'promo',
    link_url: '',
    link_text: '',
    is_active: true,
    start_date: '',
    end_date: '',
  });

  const bannerTypes = [
    { value: 'hero', label: 'Hero Banner' },
    { value: 'promo', label: 'Promotional Banner' },
    { value: 'category', label: 'Category Banner' },
    { value: 'flash_sale', label: 'Flash Sale Banner' },
  ];

  useEffect(() => {
    fetchBanners();
  }, [filterType]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const params = filterType !== 'all' ? { type: filterType } : {};
      const response = await homepageAPI.getBanners(params);
      setBanners(response.data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      onAlert('error', 'Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setBannerForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageChange = file => {
    setBannerForm(prev => ({
      ...prev,
      image: file,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    try {
      setLoading(true);
      const formData = new FormData();

      // Append all form fields
      Object.keys(bannerForm).forEach(key => {
        if (key === 'image' && bannerForm[key]) {
          formData.append(key, bannerForm[key]);
        } else if (key !== 'image') {
          formData.append(key, bannerForm[key]);
        }
      });

      formData.append('created_by', user.id);

      let response;
      if (editingBanner) {
        response = await homepageAPI.updateBanner(editingBanner.id, formData);
      } else {
        response = await homepageAPI.createBanner(formData);
      }

      await fetchBanners();
      setShowModal(false);
      resetForm();
      onAlert('success', `Banner ${editingBanner ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Error saving banner:', error);
      onAlert('error', `Failed to ${editingBanner ? 'update' : 'create'} banner`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = banner => {
    setEditingBanner(banner);
    setBannerForm({
      title: banner.title,
      description: banner.description,
      image: null, // Don't set existing image
      banner_type: banner.banner_type,
      link_url: banner.link_url || '',
      link_text: banner.link_text || '',
      is_active: banner.is_active,
      start_date: banner.start_date ? banner.start_date.split('T')[0] : '',
      end_date: banner.end_date ? banner.end_date.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleDelete = async bannerId => {
    if (!window.confirm('Are you sure you want to delete this banner?')) {
      return;
    }

    try {
      setLoading(true);
      await homepageAPI.deleteBanner(bannerId);
      await fetchBanners();
      onAlert('success', 'Banner deleted successfully!');
    } catch (error) {
      console.error('Error deleting banner:', error);
      onAlert('error', 'Failed to delete banner');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async banner => {
    try {
      const updatedBanner = { ...banner, is_active: !banner.is_active };
      await homepageAPI.updateBanner(banner.id, updatedBanner);
      await fetchBanners();
      onAlert(
        'success',
        `Banner ${updatedBanner.is_active ? 'activated' : 'deactivated'} successfully!`
      );
    } catch (error) {
      console.error('Error toggling banner status:', error);
      onAlert('error', 'Failed to update banner status');
    }
  };

  const resetForm = () => {
    setBannerForm({
      title: '',
      description: '',
      image: null,
      banner_type: 'promo',
      link_url: '',
      link_text: '',
      is_active: true,
      start_date: '',
      end_date: '',
    });
    setEditingBanner(null);
  };

  const handleDragStart = (e, banner) => {
    setDraggedItem(banner);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetBanner) => {
    e.preventDefault();

    if (!draggedItem || draggedItem.id === targetBanner.id) {
      return;
    }

    try {
      const newOrder = targetBanner.order;
      const oldOrder = draggedItem.order;

      // Update the order of banners
      const bannerOrders = banners.map(banner => {
        if (banner.id === draggedItem.id) {
          return { id: banner.id, order: newOrder };
        } else if (banner.id === targetBanner.id) {
          return { id: banner.id, order: oldOrder };
        }
        return { id: banner.id, order: banner.order };
      });

      await homepageAPI.reorderBanners({ banner_orders: bannerOrders });
      await fetchBanners();
      onAlert('success', 'Banner order updated successfully!');
    } catch (error) {
      console.error('Error reordering banners:', error);
      onAlert('error', 'Failed to update banner order');
    } finally {
      setDraggedItem(null);
    }
  };

  const getBannerTypeColor = type => {
    const colors = {
      hero: 'blue',
      promo: 'green',
      category: 'purple',
      flash_sale: 'red',
    };
    return colors[type] || 'gray';
  };

  const filteredBanners = banners.filter(banner => {
    if (filterType === 'all') return true;
    return banner.banner_type === filterType;
  });

  return (
    <div className="banner-manager">
      {loading && <LoadingOverlay />}

      <div className="banner-header">
        <div className="header-left">
          <h3>Banner Management</h3>
          <p>Manage homepage banners and promotional content</p>
        </div>
        <div className="header-right">
          <Select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Banners</option>
            {bannerTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            Add Banner
          </Button>
        </div>
      </div>

      <div className="banner-grid">
        {filteredBanners.map(banner => (
          <div
            key={banner.id}
            className={`banner-card ${!banner.is_active ? 'inactive' : ''}`}
            draggable
            onDragStart={e => handleDragStart(e, banner)}
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, banner)}
          >
            <div className="banner-image">
              {banner.image ? (
                <img src={banner.image} alt={banner.title} />
              ) : (
                <div className="image-placeholder">
                  <span>No Image</span>
                </div>
              )}
              <div className="banner-overlay">
                <Badge color={getBannerTypeColor(banner.banner_type)} className="banner-type-badge">
                  {banner.banner_type_display}
                </Badge>
              </div>
            </div>

            <div className="banner-content">
              <h4>{banner.title}</h4>
              <p>{banner.description}</p>

              {banner.link_url && (
                <div className="banner-link">
                  <span>🔗 {banner.link_text || 'View More'}</span>
                </div>
              )}

              <div className="banner-meta">
                <span className="banner-order">Order: {banner.order}</span>
                <span className={`banner-status ${banner.is_active ? 'active' : 'inactive'}`}>
                  {banner.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

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

            <div className="banner-actions">
              <Button variant="secondary" size="small" onClick={() => handleEdit(banner)}>
                Edit
              </Button>
              <Button
                variant={banner.is_active ? 'warning' : 'success'}
                size="small"
                onClick={() => handleToggleActive(banner)}
              >
                {banner.is_active ? 'Deactivate' : 'Activate'}
              </Button>
              <Button variant="danger" size="small" onClick={() => handleDelete(banner.id)}>
                Delete
              </Button>
            </div>
          </div>
        ))}

        {filteredBanners.length === 0 && !loading && (
          <div className="empty-state">
            <h4>No banners found</h4>
            <p>Create your first banner to get started</p>
            <Button variant="primary" onClick={() => setShowModal(true)}>
              Add Banner
            </Button>
          </div>
        )}
      </div>

      {/* Banner Form Modal */}
      <Modal
        show={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingBanner ? 'Edit Banner' : 'Add New Banner'}
        size="large"
      >
        <form onSubmit={handleSubmit} className="banner-form">
          <div className="form-row">
            <div className="form-group">
              <Input
                label="Banner Title"
                value={bannerForm.title}
                onChange={e => handleFormChange('title', e.target.value)}
                required
                placeholder="Enter banner title"
              />
            </div>
            <div className="form-group">
              <Select
                label="Banner Type"
                value={bannerForm.banner_type}
                onChange={e => handleFormChange('banner_type', e.target.value)}
                required
              >
                {bannerTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="form-group">
            <TextArea
              label="Description"
              value={bannerForm.description}
              onChange={e => handleFormChange('description', e.target.value)}
              placeholder="Enter banner description"
              rows={3}
            />
          </div>

          <div className="form-group">
            <FileUpload
              label="Banner Image"
              accept="image/*"
              onChange={handleImageChange}
              preview
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <Input
                label="Link URL"
                type="url"
                value={bannerForm.link_url}
                onChange={e => handleFormChange('link_url', e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="form-group">
              <Input
                label="Link Text"
                value={bannerForm.link_text}
                onChange={e => handleFormChange('link_text', e.target.value)}
                placeholder="Shop Now"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <Input
                label="Start Date"
                type="date"
                value={bannerForm.start_date}
                onChange={e => handleFormChange('start_date', e.target.value)}
              />
            </div>
            <div className="form-group">
              <Input
                label="End Date"
                type="date"
                value={bannerForm.end_date}
                onChange={e => handleFormChange('end_date', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={bannerForm.is_active}
                onChange={e => handleFormChange('is_active', e.target.checked)}
              />
              <span className="checkbox-text">Active (visible to users)</span>
            </label>
          </div>

          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              {editingBanner ? 'Update Banner' : 'Create Banner'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BannerManager;
