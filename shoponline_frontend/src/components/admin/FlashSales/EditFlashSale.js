import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Percent, Image, AlertCircle, Save } from 'lucide-react';
import flashSalesAPI from '../../../services/api/flashSalesAPI';
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

  // Initialize form with flash sale data
  useEffect(() => {
    if (flashSale) {
      setFormData({
        name: flashSale.name || '',
        description: flashSale.description || '',
        discount_percentage: flashSale.discount_percentage || '',
        start_time: flashSale.start_time ? formatDateTimeLocal(flashSale.start_time) : '',
        end_time: flashSale.end_time ? formatDateTimeLocal(flashSale.end_time) : '',
        max_discount_amount: flashSale.max_discount_amount || '',
        priority: flashSale.priority || 0,
        banner_image: null, // File input starts empty
        is_active: flashSale.is_active !== undefined ? flashSale.is_active : true,
      });

      // Set preview image if banner exists
      if (flashSale.banner_image) {
        setPreviewImage(flashSale.banner_image);
      }
    }
  }, [flashSale]);

  const formatDateTimeLocal = (dateString) => {
    const date = new Date(dateString);
    // Format for datetime-local input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
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
    } else if (formData.name.length > 200) {
      newErrors.name = 'Name must be less than 200 characters';
    }

    if (!formData.discount_percentage) {
      newErrors.discount_percentage = 'Discount percentage is required';
    } else {
      const discount = parseFloat(formData.discount_percentage);
      if (isNaN(discount) || discount <= 0 || discount > 100) {
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

      // Check minimum duration (1 hour)
      const durationHours = (endDate - startDate) / (1000 * 60 * 60);
      if (durationHours < 1) {
        newErrors.end_time = 'Flash sale must run for at least 1 hour';
      }

      // Check maximum duration (30 days)
      if (durationHours > 30 * 24) {
        newErrors.end_time = 'Flash sale cannot run for more than 30 days';
      }
    }

    // Max discount validation
    if (formData.max_discount_amount) {
      const maxDiscount = parseFloat(formData.max_discount_amount);
      if (isNaN(maxDiscount) || maxDiscount <= 0) {
        newErrors.max_discount_amount = 'Maximum discount amount must be positive';
      }
    }

    // Priority validation
    if (formData.priority < 0 || formData.priority > 999) {
      newErrors.priority = 'Priority must be between 0 and 999';
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
        if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
          if (key === 'banner_image' && formData[key] instanceof File) {
            submitData.append(key, formData[key]);
          } else if (key !== 'banner_image') {
            submitData.append(key, formData[key].toString());
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

  // Calculate duration for display
  const calculateDuration = () => {
    if (formData.start_time && formData.end_time) {
      const start = new Date(formData.start_time);
      const end = new Date(formData.end_time);
      const hours = Math.ceil((end - start) / (1000 * 60 * 60));
      return hours;
    }
    return 0;
  };

  const canEditTiming = () => {
    // Allow editing if flash sale hasn't started yet or is not running
    const now = new Date();
    const startTime = new Date(flashSale.start_time);
    return startTime > now;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content flash-sale-modal">
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
                    placeholder="e.g., Summer Electronics Sale"
                    className={errors.name ? 'error' : ''}
                    maxLength={200}
                  />
                  {errors.name && (
                    <div className="error-message">
                      <AlertCircle size={16} />
                      {errors.name}
                    </div>
                  )}
                  <div className="character-count">{formData.name.length}/200</div>
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
                    maxLength={1000}
                  />
                  <div className="character-count">{formData.description.length}/1000</div>
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
                    max="999"
                    placeholder="0"
                    className={errors.priority ? 'error' : ''}
                  />
                  {errors.priority && (
                    <div className="error-message">
                      <AlertCircle size={16} />
                      {errors.priority}
                    </div>
                  )}
                  <small>Higher numbers appear first (0-999)</small>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                    />
                    <span className="checkmark" />
                    Active Flash Sale
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
                        min="0.01"
                        max="100"
                        step="0.01"
                        placeholder="25.00"
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
                        step="1000"
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

                {!canEditTiming() && (
                  <div className="info-alert">
                    <AlertCircle size={16} />
                    <span>Timing cannot be changed for active flash sales</span>
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
                    min={formData.start_time}
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

                {/* Duration Display */}
                {formData.start_time && formData.end_time && (
                  <div className="duration-display">
                    <small>Duration: {calculateDuration()} hours</small>
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
                  <label htmlFor="banner_image">Upload New Banner</label>
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
                            setPreviewImage(flashSale.banner_image || null);
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
                        <small>Recommended: 1200x400px, JPG/PNG</small>
                      </div>
                    )}
                  </div>
                  <small>Leave empty to keep current banner</small>
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
      </div>
    </div>
  );
};

export default EditFlashSale;