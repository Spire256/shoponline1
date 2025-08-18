import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Percent, Image, AlertCircle, Save, Plus } from 'lucide-react';
import ProductSelector from './ProductSelector';
import { flashSalesAPI } from '../../services/api/flashSalesAPI';
import './FlashSaleManagement.css';

const EditFlashSale = ({ flashSale, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_percentage: '',
    start_time: '',
    end_time: '',
    max_discount_amount: '',
    priority: 0,
    banner_image: null,
    is_active: true,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [flashSaleProducts, setFlashSaleProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    if (flashSale) {
      // Format datetime for input fields
      const formatDateTime = dateString => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16);
      };

      setFormData({
        name: flashSale.name || '',
        description: flashSale.description || '',
        discount_percentage: flashSale.discount_percentage || '',
        start_time: formatDateTime(flashSale.start_time),
        end_time: formatDateTime(flashSale.end_time),
        max_discount_amount: flashSale.max_discount_amount || '',
        priority: flashSale.priority || 0,
        banner_image: null, // New image upload
        is_active: flashSale.is_active,
      });

      // Set preview image if exists
      if (flashSale.banner_image) {
        setPreviewImage(flashSale.banner_image);
      }

      // Load flash sale products
      loadFlashSaleProducts();
    }
  }, [flashSale]);

  const loadFlashSaleProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await flashSalesAPI.getFlashSaleWithProducts(flashSale.id);
      setFlashSaleProducts(response.flash_sale_products || []);
    } catch (err) {
      console.error('Error loading flash sale products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleInputChange = e => {
    const { name, value, type, files, checked } = e.target;

    if (type === 'file') {
      const file = files[0];
      setFormData(prev => ({ ...prev, [name]: file }));

      // Create preview for image
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = e => setPreviewImage(e.target.result);
        reader.readAsDataURL(file);
      }
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.name.trim()) {
      newErrors.name = 'Flash sale name is required';
    }

    if (!formData.discount_percentage) {
      newErrors.discount_percentage = 'Discount percentage is required';
    } else {
      const discount = parseFloat(formData.discount_percentage);
      if (discount <= 0 || discount > 100) {
        newErrors.discount_percentage = 'Discount must be between 0 and 100';
      }
    }

    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required';
    }

    if (!formData.end_time) {
      newErrors.end_time = 'End time is required';
    }

    // Date validation
    if (formData.start_time && formData.end_time) {
      const startDate = new Date(formData.start_time);
      const endDate = new Date(formData.end_time);

      if (startDate >= endDate) {
        newErrors.end_time = 'End time must be after start time';
      }
    }

    // Max discount validation
    if (formData.max_discount_amount && parseFloat(formData.max_discount_amount) <= 0) {
      newErrors.max_discount_amount = 'Maximum discount amount must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Prepare form data for API
      const submitData = new FormData();

      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          if (key === 'banner_image' && formData[key] instanceof File) {
            submitData.append(key, formData[key]);
          } else if (key !== 'banner_image') {
            submitData.append(key, formData[key]);
          }
        }
      });

      await flashSalesAPI.updateFlashSale(flashSale.id, submitData);
      onSuccess();
    } catch (err) {
      console.error('Update flash sale error:', err);
      if (err.response?.data) {
        setErrors(err.response.data);
      } else {
        setErrors({ general: 'Failed to update flash sale. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProduct = async productId => {
    if (window.confirm('Remove this product from flash sale?')) {
      try {
        await flashSalesAPI.removeProductFromFlashSale(productId);
        loadFlashSaleProducts();
      } catch (err) {
        console.error('Error removing product:', err);
      }
    }
  };

  const handleProductsAdded = () => {
    setShowProductSelector(false);
    loadFlashSaleProducts();
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
    }).format(amount);
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const canEditTiming = () => {
    // Allow editing if flash sale hasn't started yet
    return new Date(flashSale.start_time) > new Date();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content flash-sale-modal large">
        <div className="modal-header">
          <h2>Edit Flash Sale</h2>
          <button className="modal-close" onClick={onCancel}>
            <X size={24} />
          </button>
        </div>

        <div className="flash-sale-form">
          <div className="form-grid">
            {/* Left Column */}
            <div className="form-column">
              {/* Basic Information */}
              <div className="form-section">
                <h3>Basic Information</h3>

                <div className="form-group">
                  <label htmlFor="name">Flash Sale Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={errors.name ? 'error' : ''}
                  />
                  {errors.name && (
                    <div className="error-message">
                      <AlertCircle size={16} />
                      {errors.name}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="priority">Priority</label>
                  <input
                    type="number"
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                    />
                    Active
                  </label>
                </div>
              </div>

              {/* Discount Settings */}
              <div className="form-section">
                <h3>
                  <Percent size={20} />
                  Discount Settings
                </h3>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="discount_percentage">Discount Percentage *</label>
                    <div className="input-with-suffix">
                      <input
                        type="number"
                        id="discount_percentage"
                        name="discount_percentage"
                        value={formData.discount_percentage}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                        step="0.01"
                        className={errors.discount_percentage ? 'error' : ''}
                      />
                      <span className="input-suffix">%</span>
                    </div>
                    {errors.discount_percentage && (
                      <div className="error-message">
                        <AlertCircle size={16} />
                        {errors.discount_percentage}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="max_discount_amount">Max Discount Amount</label>
                    <div className="input-with-prefix">
                      <span className="input-prefix">UGX</span>
                      <input
                        type="number"
                        id="max_discount_amount"
                        name="max_discount_amount"
                        value={formData.max_discount_amount}
                        onChange={handleInputChange}
                        min="0"
                        className={errors.max_discount_amount ? 'error' : ''}
                      />
                    </div>
                    {errors.max_discount_amount && (
                      <div className="error-message">
                        <AlertCircle size={16} />
                        {errors.max_discount_amount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="form-column">
              {/* Timing Settings */}
              <div className="form-section">
                <h3>
                  <Clock size={20} />
                  Timing Settings
                </h3>

                {!canEditTiming() && (
                  <div className="info-alert">
                    <AlertCircle size={16} />
                    <span>Timing cannot be changed for active or past flash sales</span>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="start_time">Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    id="start_time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    min={canEditTiming() ? getMinDateTime() : undefined}
                    disabled={!canEditTiming()}
                    className={errors.start_time ? 'error' : ''}
                  />
                  {errors.start_time && (
                    <div className="error-message">
                      <AlertCircle size={16} />
                      {errors.start_time}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="end_time">End Date & Time *</label>
                  <input
                    type="datetime-local"
                    id="end_time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    min={formData.start_time || getMinDateTime()}
                    disabled={!canEditTiming()}
                    className={errors.end_time ? 'error' : ''}
                  />
                  {errors.end_time && (
                    <div className="error-message">
                      <AlertCircle size={16} />
                      {errors.end_time}
                    </div>
                  )}
                </div>
              </div>

              {/* Banner Image */}
              <div className="form-section">
                <h3>
                  <Image size={20} />
                  Banner Image
                </h3>

                <div className="form-group">
                  <div className="file-upload-area">
                    <input
                      type="file"
                      id="banner_image"
                      name="banner_image"
                      accept="image/*"
                      onChange={handleInputChange}
                    />

                    {previewImage ? (
                      <div className="image-preview">
                        <img src={previewImage} alt="Banner preview" />
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewImage(null);
                            setFormData(prev => ({ ...prev, banner_image: null }));
                          }}
                          className="remove-image"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="upload-placeholder">
                        <Image size={48} />
                        <p>Click to upload new banner image</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Products Section */}
          <div className="form-section products-section">
            <div className="section-header">
              <h3>Flash Sale Products ({flashSaleProducts.length})</h3>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowProductSelector(true)}
              >
                <Plus size={16} />
                Add Products
              </button>
            </div>

            {loadingProducts ? (
              <div className="loading-container">
                <div className="loading-spinner" />
                <p>Loading products...</p>
              </div>
            ) : flashSaleProducts.length > 0 ? (
              <div className="products-grid">
                {flashSaleProducts.map(item => (
                  <div key={item.id} className="product-card">
                    <div className="product-image">
                      <img
                        src={item.product_detail?.images?.[0] || '/placeholder-product.jpg'}
                        alt={item.product_detail?.name}
                      />
                    </div>
                    <div className="product-info">
                      <h4>{item.product_detail?.name}</h4>
                      <div className="price-info">
                        <span className="original-price">
                          {formatCurrency(item.original_price)}
                        </span>
                        <span className="flash-price">{formatCurrency(item.flash_sale_price)}</span>
                        <span className="discount-badge">-{item.discount_percentage}%</span>
                      </div>
                      <div className="product-stats">
                        <span>Sold: {item.sold_quantity}</span>
                        {item.stock_limit && <span>Limit: {item.stock_limit}</span>}
                      </div>
                    </div>
                    <button
                      className="remove-product-btn"
                      onClick={() => handleRemoveProduct(item.id)}
                      title="Remove from flash sale"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-products">
                <p>No products added to this flash sale yet.</p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowProductSelector(true)}
                >
                  Add First Product
                </button>
              </div>
            )}
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="error-alert">
              <AlertCircle size={20} />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? (
                <>
                  <div className="loading-spinner small" />
                  Updating...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Update Flash Sale
                </>
              )}
            </button>
          </div>
        </div>

        {/* Product Selector Modal */}
        {showProductSelector && (
          <ProductSelector
            flashSaleId={flashSale.id}
            existingProducts={flashSaleProducts}
            onProductsAdded={handleProductsAdded}
            onCancel={() => setShowProductSelector(false)}
          />
        )}
      </div>
    </div>
  );
};

export default EditFlashSale;
