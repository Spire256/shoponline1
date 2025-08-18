import React, { useState } from 'react';
import { X, Calendar, Clock, Percent, Image, AlertCircle, Save } from 'lucide-react';
import { flashSalesAPI } from '../../services/api/flashSalesAPI';
import './FlashSaleManagement.css';

const CreateFlashSale = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_percentage: '',
    start_time: '',
    end_time: '',
    max_discount_amount: '',
    priority: 0,
    banner_image: null,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const handleInputChange = e => {
    const { name, value, type, files } = e.target;

    if (type === 'file') {
      const file = files[0];
      setFormData(prev => ({ ...prev, [name]: file }));

      // Create preview for image
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = e => setPreviewImage(e.target.result);
        reader.readAsDataURL(file);
      }
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
      const now = new Date();

      if (startDate >= endDate) {
        newErrors.end_time = 'End time must be after start time';
      }

      if (endDate <= now) {
        newErrors.end_time = 'End time must be in the future';
      }

      if (startDate < now) {
        newErrors.start_time = 'Start time should be in the future';
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
          if (key === 'banner_image' && formData[key]) {
            submitData.append(key, formData[key]);
          } else if (key !== 'banner_image') {
            submitData.append(key, formData[key]);
          }
        }
      });

      await flashSalesAPI.createFlashSale(submitData);
      onSuccess();
    } catch (err) {
      console.error('Create flash sale error:', err);
      if (err.response?.data) {
        setErrors(err.response.data);
      } else {
        setErrors({ general: 'Failed to create flash sale. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate datetime-local input value
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content flash-sale-modal">
        <div className="modal-header">
          <h2>Create New Flash Sale</h2>
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
                    placeholder="e.g., Summer Electronics Sale"
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
                    placeholder="Brief description of the flash sale..."
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
                    placeholder="0"
                  />
                  <small>Higher numbers appear first</small>
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
                        placeholder="25"
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
                        placeholder="100000"
                        className={errors.max_discount_amount ? 'error' : ''}
                      />
                    </div>
                    {errors.max_discount_amount && (
                      <div className="error-message">
                        <AlertCircle size={16} />
                        {errors.max_discount_amount}
                      </div>
                    )}
                    <small>Optional: Maximum discount amount per product</small>
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

                <div className="form-group">
                  <label htmlFor="start_time">Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    id="start_time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    min={getMinDateTime()}
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
                    className={errors.end_time ? 'error' : ''}
                  />
                  {errors.end_time && (
                    <div className="error-message">
                      <AlertCircle size={16} />
                      {errors.end_time}
                    </div>
                  )}
                </div>

                {/* Duration Display */}
                {formData.start_time && formData.end_time && (
                  <div className="duration-display">
                    <small>
                      Duration:{' '}
                      {Math.ceil(
                        (new Date(formData.end_time) - new Date(formData.start_time)) /
                          (1000 * 60 * 60)
                      )}{' '}
                      hours
                    </small>
                  </div>
                )}
              </div>

              {/* Banner Image */}
              <div className="form-section">
                <h3>
                  <Image size={20} />
                  Banner Image
                </h3>

                <div className="form-group">
                  <label htmlFor="banner_image">Upload Banner</label>
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
                        <p>Click to upload banner image</p>
                        <small>Recommended: 1200x400px, JPG/PNG</small>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? (
                <>
                  <div className="loading-spinner small" />
                  Creating...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Create Flash Sale
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateFlashSale;
