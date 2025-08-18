import React, { useState, useEffect } from 'react';
import { isValidPhoneNumber, isValidEmail } from '../../utils/helpers/validators';

const AccountInfo = ({ profileData, onUpdate, loading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    profile_image: null,
  });
  const [errors, setErrors] = useState({});
  const [updateStatus, setUpdateStatus] = useState({ type: '', message: '' });
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (profileData) {
      setFormData({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        phone_number: profileData.phone_number || '',
        profile_image: null,
      });
      setImagePreview(profileData.profile_image);
    }
  }, [profileData]);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear specific error when user starts typing
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
      reader.onload = e => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);

      // Clear image error
      if (errors.profile_image) {
        setErrors(prev => ({
          ...prev,
          profile_image: '',
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate first name
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    } else if (formData.first_name.trim().length < 2) {
      newErrors.first_name = 'First name must be at least 2 characters';
    }

    // Validate last name
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    } else if (formData.last_name.trim().length < 2) {
      newErrors.last_name = 'Last name must be at least 2 characters';
    }

    // Validate phone number (if provided) using the correct validator
    if (formData.phone_number) {
      const phoneValidation = isValidPhoneNumber(formData.phone_number);
      if (!phoneValidation.isValid) {
        newErrors.phone_number = phoneValidation.error;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!validateForm()) {
      setUpdateStatus({
        type: 'error',
        message: 'Please fix the errors below',
      });
      return;
    }

    const updateData = new FormData();
    updateData.append('first_name', formData.first_name.trim());
    updateData.append('last_name', formData.last_name.trim());

    if (formData.phone_number) {
      updateData.append('phone_number', formData.phone_number.trim());
    }

    if (formData.profile_image) {
      updateData.append('profile_image', formData.profile_image);
    }

    const result = await onUpdate(updateData);

    setUpdateStatus({
      type: result.success ? 'success' : 'error',
      message: result.message,
    });

    if (result.success) {
      setIsEditing(false);
      // Clear status after 3 seconds
      setTimeout(() => {
        setUpdateStatus({ type: '', message: '' });
      }, 3000);
    }
  };

  const handleCancel = () => {
    // Reset form data
    if (profileData) {
      setFormData({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        phone_number: profileData.phone_number || '',
        profile_image: null,
      });
      setImagePreview(profileData.profile_image);
    }
    setErrors({});
    setUpdateStatus({ type: '', message: '' });
    setIsEditing(false);
  };

  if (!profileData) {
    return (
      <div className="account-info-loading">
        <div className="spinner" />
        <p>Loading account information...</p>
      </div>
    );
  }

  return (
    <div className="account-info">
      <div className="account-header">
        <h2>Account Information</h2>
        {!isEditing && (
          <button className="edit-button" onClick={() => setIsEditing(true)} disabled={loading}>
            <span className="edit-icon">✏️</span>
            Edit Profile
          </button>
        )}
      </div>

      {updateStatus.message && (
        <div className={`update-status ${updateStatus.type}`}>
          <p>{updateStatus.message}</p>
        </div>
      )}

      <div className="account-form">
        {/* Profile Image Section */}
        <div className="form-section">
          <h3>Profile Photo</h3>
          <div className="profile-image-section">
            <div className="current-image">
              {imagePreview ? (
                <img src={imagePreview} alt="Profile" className="profile-image" />
              ) : (
                <div className="image-placeholder">
                  <span className="placeholder-icon">👤</span>
                  <p>No photo uploaded</p>
                </div>
              )}
            </div>

            {isEditing && (
              <div className="image-upload">
                <label htmlFor="profile-image" className="upload-button">
                  <span className="upload-icon">📷</span>
                  Change Photo
                </label>
                <input
                  type="file"
                  id="profile-image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="file-input"
                />
                {errors.profile_image && <span className="error-text">{errors.profile_image}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="form-section">
          <h3>Personal Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="first_name">First Name *</label>
              {isEditing ? (
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className={errors.first_name ? 'error' : ''}
                  placeholder="Enter your first name"
                  required
                />
              ) : (
                <div className="display-value">{profileData.first_name}</div>
              )}
              {errors.first_name && <span className="error-text">{errors.first_name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="last_name">Last Name *</label>
              {isEditing ? (
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className={errors.last_name ? 'error' : ''}
                  placeholder="Enter your last name"
                  required
                />
              ) : (
                <div className="display-value">{profileData.last_name}</div>
              )}
              {errors.last_name && <span className="error-text">{errors.last_name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="display-value readonly">
                {profileData.email}
                <span className="readonly-badge">Cannot be changed</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phone_number">Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  id="phone_number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  className={errors.phone_number ? 'error' : ''}
                  placeholder="e.g., 0712345678"
                />
              ) : (
                <div className="display-value">{profileData.phone_number || 'Not provided'}</div>
              )}
              {errors.phone_number && <span className="error-text">{errors.phone_number}</span>}
            </div>

            <div className="form-group">
              <label>Account Type</label>
              <div className="display-value">
                <span className={`role-badge ${profileData.role}`}>
                  {profileData.role === 'admin' ? 'Administrator' : 'Customer'}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label>Member Since</label>
              <div className="display-value">
                {new Date(profileData.date_joined).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Email Verification Status */}
        <div className="form-section">
          <h3>Account Status</h3>
          <div className="status-items">
            <div className="status-item">
              <span className="status-label">Email Verification</span>
              <span
                className={`status-badge ${
                  profileData.is_email_verified ? 'verified' : 'unverified'
                }`}
              >
                {profileData.is_email_verified ? '✅ Verified' : '❌ Unverified'}
              </span>
            </div>
          </div>

          {!profileData.is_email_verified && (
            <div className="verification-notice">
              <p>Please verify your email address to receive order updates and notifications.</p>
              <button type="button" className="resend-verification-button">
                Resend Verification Email
              </button>
            </div>
          )}
        </div>

        {/* Form Actions */}
        {isEditing && (
          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="button" className="save-button" disabled={loading} onClick={handleSubmit}>
              {loading ? (
                <>
                  <span className="loading-spinner small" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountInfo;
