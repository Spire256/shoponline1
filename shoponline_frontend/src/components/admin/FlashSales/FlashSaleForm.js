import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Percent, Image, AlertCircle, Info } from 'lucide-react';
import './FlashSaleManagement.css';

const FlashSaleForm = ({
  initialData = {},
  onSubmit,
  onCancel,
  loading = false,
  errors = {},
  mode = 'create', // 'create' or 'edit'
}) => {
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
    ...initialData,
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    setFormErrors(errors);
  }, [errors]);

  useEffect(() => {
    if (initialData.banner_image && typeof initialData.banner_image === 'string') {
      setPreviewImage(initialData.banner_image);
    }
  }, [initialData]);

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
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
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
      const now = new Date();

      if (startDate >= endDate) {
        newErrors.end_time = 'End time must be after start time';
      }

      if (mode === 'create' && endDate <= now) {
        newErrors.end_time = 'End time must be in the future';
      }

      if (mode === 'create' && startDate < now) {
        newErrors.start_time = 'Start time should be in the future';
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

    // Description length validation
    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = e => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const canEditTiming = () => {
    if (mode === 'create') return true;
    // Allow editing if flash sale hasn't started yet
    return initialData.start_time && new Date(initialData.start_time) > new Date();
  };

  const calculateDuration = () => {
    if (formData.start_time && formData.end_time) {
      const start = new Date(formData.start_time);
      const end = new Date(formData.end_time);
      const hours = Math.ceil((end - start) / (1000 * 60 * 60));
      return hours;
    }
    return 0;
  };

  return (
    <div className="flash-sale-form-container">
      <div className="form-grid">
        {/* Left Column */}
        <div className="form-column">
          {/* Basic Information */}
          <div className="form-section">
            <h3>Basic Information</h3>

            <div className="form-group">
              <label htmlFor="name" className="required">
                Flash Sale Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Summer Electronics Sale"
                className={formErrors.name ? 'error' : ''}
                maxLength={200}
              />
              {formErrors.name && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  {formErrors.name}
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
                className={formErrors.description ? 'error' : ''}
                maxLength={1000}
              />
              {formErrors.description && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  {formErrors.description}
                </div>
              )}
              <div className="character-count">{formData.description.length}/1000</div>
            </div>

            <div className="form-group">
              <label htmlFor="priority">Display Priority</label>
              <input
                type="number"
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                min="0"
                max="999"
                placeholder="0"
                className={formErrors.priority ? 'error' : ''}
              />
              {formErrors.priority && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  {formErrors.priority}
                </div>
              )}
              <small className="help-text">Higher numbers appear first (0-999)</small>
            </div>

            {mode === 'edit' && (
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
            )}
          </div>

          {/* Discount Settings */}
          <div className="form-section">
            <div className="section-header">
              <Percent size={20} />
              <h3>Discount Settings</h3>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="discount_percentage" className="required">
                  Discount Percentage
                </label>
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
                    className={formErrors.discount_percentage ? 'error' : ''}
                  />
                  <span className="input-suffix">%</span>
                </div>
                {formErrors.discount_percentage && (
                  <div className="error-message">
                    <AlertCircle size={16} />
                    {formErrors.discount_percentage}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="max_discount_amount">Maximum Discount Amount</label>
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
                    className={formErrors.max_discount_amount ? 'error' : ''}
                  />
                </div>
                {formErrors.max_discount_amount && (
                  <div className="error-message">
                    <AlertCircle size={16} />
                    {formErrors.max_discount_amount}
                  </div>
                )}
                <small className="help-text">Optional: Cap the maximum discount per product</small>
              </div>
            </div>

            {/* Discount Preview */}
            {formData.discount_percentage && (
              <div className="discount-preview">
                <div className="preview-header">
                  <Info size={16} />
                  <span>Discount Preview</span>
                </div>
                <div className="preview-examples">
                  <div className="example">
                    <span className="original">UGX 100,000</span>
                    <span className="arrow">→</span>
                    <span className="discounted">
                      UGX {(100000 * (1 - formData.discount_percentage / 100)).toLocaleString()}
                    </span>
                    <span className="savings">
                      Save UGX {((100000 * formData.discount_percentage) / 100).toLocaleString()}
                    </span>
                  </div>
                  <div className="example">
                    <span className="original">UGX 50,000</span>
                    <span className="arrow">→</span>
                    <span className="discounted">
                      UGX {(50000 * (1 - formData.discount_percentage / 100)).toLocaleString()}
                    </span>
                    <span className="savings">
                      Save UGX {((50000 * formData.discount_percentage) / 100).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="form-column">
          {/* Timing Settings */}
          <div className="form-section">
            <div className="section-header">
              <Clock size={20} />
              <h3>Timing Settings</h3>
            </div>

            {!canEditTiming() && (
              <div className="info-alert">
                <AlertCircle size={16} />
                <span>Timing cannot be changed for active or past flash sales</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="start_time" className="required">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                id="start_time"
                name="start_time"
                value={formData.start_time}
                onChange={handleInputChange}
                min={canEditTiming() ? getMinDateTime() : undefined}
                disabled={!canEditTiming()}
                className={formErrors.start_time ? 'error' : ''}
              />
              {formErrors.start_time && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  {formErrors.start_time}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="end_time" className="required">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                id="end_time"
                name="end_time"
                value={formData.end_time}
                onChange={handleInputChange}
                min={formData.start_time || getMinDateTime()}
                disabled={!canEditTiming()}
                className={formErrors.end_time ? 'error' : ''}
              />
              {formErrors.end_time && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  {formErrors.end_time}
                </div>
              )}
            </div>

            {/* Duration Display */}
            {formData.start_time && formData.end_time && (
              <div className="duration-display">
                <div className="duration-info">
                  <Clock size={16} />
                  <span>Duration: {calculateDuration()} hours</span>
                </div>
                {calculateDuration() > 0 && calculateDuration() < 1 && (
                  <div className="duration-warning">
                    <AlertCircle size={14} />
                    <span>Minimum duration is 1 hour</span>
                  </div>
                )}
                {calculateDuration() > 30 * 24 && (
                  <div className="duration-warning">
                    <AlertCircle size={14} />
                    <span>Maximum duration is 30 days</span>
                  </div>
                )}
              </div>
            )}

            {/* Timing Tips */}
            <div className="timing-tips">
              <h4>⏰ Timing Tips</h4>
              <ul>
                <li>Peak hours: 10 AM - 2 PM and 6 PM - 10 PM</li>
                <li>Weekend sales typically perform better</li>
                <li>Consider your target audience's timezone</li>
                <li>24-72 hour sales create urgency without fatigue</li>
              </ul>
            </div>
          </div>

          {/* Banner Image */}
          <div className="form-section">
            <div className="section-header">
              <Image size={20} />
              <h3>Banner Image</h3>
            </div>

            <div className="form-group">
              <label htmlFor="banner_image">Upload Banner</label>
              <div className="file-upload-area">
                <input
                  type="file"
                  id="banner_image"
                  name="banner_image"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleInputChange}
                  className="file-input"
                />

                {previewImage ? (
                  <div className="image-preview">
                    <img src={previewImage} alt="Banner preview" />
                    <div className="image-overlay">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewImage(null);
                          setFormData(prev => ({ ...prev, banner_image: null }));
                        }}
                        className="remove-image"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <Image size={48} />
                    <p>Click to upload banner image</p>
                    <div className="upload-specs">
                      <small>Recommended: 1200×400px</small>
                      <small>Formats: JPG, PNG, WebP</small>
                      <small>Max size: 2MB</small>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Banner Guidelines */}
            <div className="banner-guidelines">
              <h4>📸 Banner Guidelines</h4>
              <ul>
                <li>Use high-contrast text for readability</li>
                <li>Include your discount percentage prominently</li>
                <li>Keep important content in the center</li>
                <li>Test on mobile devices</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <div className="loading-spinner small" />
              {mode === 'create' ? 'Creating...' : 'Updating...'}
            </>
          ) : (
            <>{mode === 'create' ? 'Create Flash Sale' : 'Update Flash Sale'}</>
          )}
        </button>
      </div>
    </div>
  );
};

export default FlashSaleForm;
