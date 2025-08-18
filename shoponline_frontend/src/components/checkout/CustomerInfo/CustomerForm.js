// src/components/checkout/CustomerInfo/CustomerForm.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';

const CustomerForm = ({ initialData, onSubmit, loading }) => {
  const { user, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    ...initialData,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Auto-populate from user data if authenticated
  useEffect(() => {
    if (isAuthenticated && user && Object.keys(initialData).length === 0) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone_number || '',
      });
    }
  }, [user, isAuthenticated, initialData]);

  const validateField = (name, value) => {
    switch (name) {
      case 'first_name':
        if (!value.trim()) {
          return 'First name is required';
        }
        if (value.trim().length < 2) {
          return 'First name must be at least 2 characters';
        }
        return '';

      case 'last_name':
        if (!value.trim()) {
          return 'Last name is required';
        }
        if (value.trim().length < 2) {
          return 'Last name must be at least 2 characters';
        }
        return '';

      case 'email':
        if (!value.trim()) {
          return 'Email is required';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Please enter a valid email address';
        }
        if (!value.endsWith('@gmail.com')) {
          return 'Only Gmail addresses are allowed for customers';
        }
        return '';

      case 'phone':
        if (!value.trim()) {
          return 'Phone number is required';
        }
        // Uganda phone number validation
        const phoneRegex = /^(\+?256|0)[0-9]{9}$/;
        const cleanPhone = value.replace(/[\s\-()]/g, '');
        if (!phoneRegex.test(cleanPhone)) {
          return 'Please enter a valid Ugandan phone number (e.g., +256700000000 or 0700000000)';
        }
        return '';

      default:
        return '';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = e => {
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

    // Validate field on change if it was previously touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  const handleBlur = e => {
    const { name, value } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));

    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error,
    }));
  };

  const handleSubmit = e => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = {};
    Object.keys(formData).forEach(field => {
      allTouched[field] = true;
    });
    setTouched(allTouched);

    if (validateForm()) {
      // Format phone number
      const cleanPhone = formData.phone.replace(/[\s\-()]/g, '');
      const formattedPhone = cleanPhone.startsWith('+')
        ? cleanPhone
        : cleanPhone.startsWith('0') ? `+256${cleanPhone.slice(1)}`
        : cleanPhone.startsWith('256') ? `+${cleanPhone}`
        : `+256${cleanPhone}`;

      onSubmit({
        ...formData,
        phone: formattedPhone,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim().toLowerCase(),
      });
    }
  };

  const getFieldClassName = fieldName => {
    let className = 'form-input';
    if (errors[fieldName]) {
      className += ' error';
    } else if (touched[fieldName] && formData[fieldName]) {
      className += ' success';
    }
    return className;
  };

  return (
    <div className="customer-form">
      <form onSubmit={handleSubmit} noValidate>
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
              onChange={handleChange}
              onBlur={handleBlur}
              className={getFieldClassName('first_name')}
              placeholder="Enter your first name"
              disabled={loading}
              autoComplete="given-name"
            />
            {errors.first_name && (
              <div className="form-error">
                <i className="fas fa-exclamation-triangle" />
                {errors.first_name}
              </div>
            )}
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
              onChange={handleChange}
              onBlur={handleBlur}
              className={getFieldClassName('last_name')}
              placeholder="Enter your last name"
              disabled={loading}
              autoComplete="family-name"
            />
            {errors.last_name && (
              <div className="form-error">
                <i className="fas fa-exclamation-triangle" />
                {errors.last_name}
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email Address *
          </label>
          <div className="input-with-icon">
            <i className="fas fa-envelope input-icon" />
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getFieldClassName('email')}
              placeholder="your.email@gmail.com"
              disabled={loading || (isAuthenticated && user?.email)}
              autoComplete="email"
            />
          </div>
          {errors.email && (
            <div className="form-error">
              <i className="fas fa-exclamation-triangle" />
              {errors.email}
            </div>
          )}
          <div className="form-hint">
            <i className="fas fa-info-circle" />
            Only Gmail addresses are accepted for customer accounts
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="phone" className="form-label">
            Phone Number *
          </label>
          <div className="input-with-icon">
            <i className="fas fa-phone input-icon" />
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getFieldClassName('phone')}
              placeholder="+256700000000 or 0700000000"
              disabled={loading}
              autoComplete="tel"
            />
          </div>
          {errors.phone && (
            <div className="form-error">
              <i className="fas fa-exclamation-triangle" />
              {errors.phone}
            </div>
          )}
          <div className="form-hint">
            <i className="fas fa-info-circle" />
            We'll use this number to contact you about your order
          </div>
        </div>

        {isAuthenticated && user && (
          <div className="user-info-badge">
            <div className="badge-content">
              <i className="fas fa-user-check" />
              <div className="badge-text">
                <strong>Signed in as:</strong>{' '}
                {user.full_name || `${user.first_name} ${user.last_name}`}
                <br />
                <span className="user-email">{user.email}</span>
              </div>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="btn-continue"
            disabled={loading || Object.keys(errors).some(key => errors[key])}
          >
            {loading ? (
              <>
                <div className="btn-spinner" />
                Processing...
              </>
            ) : (
              <>
                Continue to Payment
                <i className="fas fa-arrow-right" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Form validation summary for accessibility */}
      {Object.keys(errors).length > 0 && (
        <div className="form-summary" role="alert" aria-live="polite">
          <h4>Please correct the following errors:</h4>
          <ul>
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CustomerForm;