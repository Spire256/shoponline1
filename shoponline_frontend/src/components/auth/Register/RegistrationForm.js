// src/components/auth/Register/RegistrationForm.js
import React, { useState } from 'react';

const RegistrationForm = ({
  fields,
  onSubmit,
  loading,
  submitButtonText = 'Create Account',
  formType = 'client',
}) => {
  const [formData, setFormData] = useState(() => {
    const initialData = {};
    fields.forEach(field => {
      initialData[field.name] = '';
    });
    return initialData;
  });

  const [showPasswords, setShowPasswords] = useState({});
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    const field = fields.find(f => f.name === name);
    if (!field) return '';

    if (field.required && !value.trim()) {
      return `${field.label} is required`;
    }

    if (field.validation) {
      if (field.validation.pattern && !field.validation.pattern.test(value)) {
        return field.validation.message || `Invalid ${field.label.toLowerCase()}`;
      }
    }

    // Email validation
    if (field.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
    }

    // Password validation
    if (field.name === 'password') {
      if (value.length < 8) {
        return 'Password must be at least 8 characters long';
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        return 'Password must contain uppercase, lowercase, and number';
      }
    }

    // Password confirmation
    if (field.name === 'password_confirm') {
      if (value !== formData.password) {
        return 'Passwords do not match';
      }
    }

    return '';
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    fields.forEach(field => {
      const error = validateField(field.name, formData[field.name]);
      if (error) {
        newErrors[field.name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Real-time validation for touched fields
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  const handleInputBlur = e => {
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
    fields.forEach(field => {
      allTouched[field.name] = true;
    });
    setTouched(allTouched);

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const togglePasswordVisibility = fieldName => {
    setShowPasswords(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="registration-form">
      {fields.map(field => (
        <div key={field.name} className="form-group">
          <label htmlFor={field.name} className="form-label">
            {field.label}
            {field.required && <span className="required-asterisk">*</span>}
          </label>

          <div className="input-wrapper">
            <input
              type={field.type === 'password' && showPasswords[field.name] ? 'text' : field.type}
              id={field.name}
              name={field.name}
              value={formData[field.name]}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              className={`form-input ${errors[field.name] ? 'input-error' : ''}`}
              placeholder={field.placeholder}
              disabled={loading}
              autoComplete={field.autoComplete}
              autoFocus={field.name === 'first_name'}
            />

            {field.type === 'password' && (
              <button
                type="button"
                className="password-toggle"
                onClick={() => togglePasswordVisibility(field.name)}
                disabled={loading}
                aria-label={showPasswords[field.name] ? 'Hide password' : 'Show password'}
              >
                {showPasswords[field.name] ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            )}

            {field.type === 'email' && (
              <div className="input-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
            )}

            {field.type === 'text' && (
              <div className="input-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            )}
          </div>

          {errors[field.name] && <span className="error-text">{errors[field.name]}</span>}
        </div>
      ))}

      <div className="password-requirements">
        <h4>Password Requirements:</h4>
        <ul>
          <li className={formData.password && formData.password.length >= 8 ? 'valid' : ''}>
            At least 8 characters long
          </li>
          <li className={formData.password && /(?=.*[a-z])/.test(formData.password) ? 'valid' : ''}>
            Contains lowercase letter
          </li>
          <li className={formData.password && /(?=.*[A-Z])/.test(formData.password) ? 'valid' : ''}>
            Contains uppercase letter
          </li>
          <li className={formData.password && /(?=.*\d)/.test(formData.password) ? 'valid' : ''}>
            Contains number
          </li>
        </ul>
      </div>

      <button
        type="submit"
        className={`register-button ${loading ? 'loading' : ''} ${formType}`}
        disabled={loading}
      >
        {loading ? (
          <>
            <div className="spinner" />
            <span>Creating Account...</span>
          </>
        ) : (
          <>
            <span>{submitButtonText}</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7 7-7z" />
            </svg>
          </>
        )}
      </button>
    </form>
  );
};

export default RegistrationForm;