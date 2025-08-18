// src/components/auth/Profile/EditProfile.js
import React, { useState } from 'react';

const EditProfile = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    phone_number: user.phone_number || '',
    profile_image: null,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(user.profile_image || null);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (formData.phone_number && !/^[+]?[\d\s-()]+$/.test(formData.phone_number)) {
      newErrors.phone_number = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleImageChange = e => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          profile_image: 'Please select a valid image file',
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          profile_image: 'Image size must be less than 5MB',
        }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        profile_image: file,
      }));

      // Create preview
      const reader = new FileReader();
      reader.onload = e => setImagePreview(e.target.result);
      reader.readAsDataURL(file);

      // Clear any previous error
      if (errors.profile_image) {
        setErrors(prev => ({
          ...prev,
          profile_image: '',
        }));
      }
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await onSave(formData);
      if (!result.success) {
        setErrors({ submit: result.error || 'Failed to update profile' });
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' });
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <div className="edit-profile-form">
      <form onSubmit={handleSubmit}>
        {errors.submit && (
          <div className="error-alert">
            <div className="error-icon">⚠</div>
            <span className="error-message">{errors.submit}</span>
          </div>
        )}

        <div className="form-section">
          <h3 className="section-title">Profile Picture</h3>
          <div className="image-upload-section">
            <div className="current-image">
              {imagePreview ? (
                <img src={imagePreview} alt="Profile preview" className="image-preview" />
              ) : (
                <div className="image-placeholder">
                  {getInitials(formData.first_name, formData.last_name)}
                </div>
              )}
            </div>

            <div className="image-upload-controls">
              <label htmlFor="profile_image" className="upload-button">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
                Choose Image
              </label>
              <input
                type="file"
                id="profile_image"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden-input"
                disabled={loading}
              />
              <p className="upload-hint">JPG, PNG or GIF (max 5MB)</p>
            </div>
          </div>
          {errors.profile_image && <span className="error-text">{errors.profile_image}</span>}
        </div>

        <div className="form-section">
          <h3 className="section-title">Personal Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="first_name" className="form-label">
                First Name *
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className={`form-input ${errors.first_name ? 'input-error' : ''}`}
                placeholder="Enter your first name"
                disabled={loading}
                autoFocus
              />
              {errors.first_name && <span className="error-text">{errors.first_name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="last_name" className="form-label">
                Last Name *
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className={`form-input ${errors.last_name ? 'input-error' : ''}`}
                placeholder="Enter your last name"
                disabled={loading}
              />
              {errors.last_name && <span className="error-text">{errors.last_name}</span>}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">Contact Information</h3>
          <div className="form-group">
            <label htmlFor="phone_number" className="form-label">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleInputChange}
              className={`form-input ${errors.phone_number ? 'input-error' : ''}`}
              placeholder="Enter your phone number (optional)"
              disabled={loading}
            />
            {errors.phone_number && <span className="error-text">{errors.phone_number}</span>}
            <p className="field-hint">
              We'll use this for order updates and delivery notifications
            </p>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">Account Information</h3>
          <div className="readonly-info">
            <div className="readonly-item">
              <label className="readonly-label">Email Address</label>
              <div className="readonly-value">
                {user.email}
                <span className="readonly-note">
                  Email cannot be changed. Contact support if needed.
                </span>
              </div>
            </div>

            <div className="readonly-item">
              <label className="readonly-label">Account Type</label>
              <div className="readonly-value">
                <span className={`role-tag ${user.role}`}>
                  {user.role === 'admin' ? 'Administrator' : 'Customer'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-button" onClick={onCancel} disabled={loading}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Cancel
          </button>

          <button
            type="submit"
            className={`save-button ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17,21 17,13 7,13 7,21" />
                  <polyline points="7,3 7,8 15,8" />
                </svg>
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;
