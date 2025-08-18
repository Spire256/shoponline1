// src/components/checkout/CustomerInfo/ContactForm.js
import React, { useState } from 'react';

const ContactForm = ({ initialData, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    contact_name: '',
    contact_phone: '',
    alternative_phone: '',
    contact_relationship: '',
    contact_notes: '',
    ...initialData,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const relationshipOptions = [
    { value: 'self', label: 'Myself' },
    { value: 'spouse', label: 'Spouse/Partner' },
    { value: 'parent', label: 'Parent' },
    { value: 'child', label: 'Child' },
    { value: 'sibling', label: 'Sibling' },
    { value: 'relative', label: 'Other Relative' },
    { value: 'friend', label: 'Friend' },
    { value: 'colleague', label: 'Colleague' },
    { value: 'neighbor', label: 'Neighbor' },
    { value: 'other', label: 'Other' },
  ];

  const validateField = (name, value) => {
    switch (name) {
      case 'contact_name':
        if (!value.trim()) {
          return 'Contact name is required';
        }
        if (value.trim().length < 2) {
          return 'Contact name must be at least 2 characters';
        }
        return '';

      case 'contact_phone':
        if (!value.trim()) {
          return 'Contact phone number is required';
        }
        // Uganda phone number validation
        const phoneRegex = /^(\+?256|0)[0-9]{9}$/;
        const cleanPhone = value.replace(/[\s\-()]/g, '');
        if (!phoneRegex.test(cleanPhone)) {
          return 'Please enter a valid Ugandan phone number';
        }
        return '';

      case 'alternative_phone':
        // Optional field, but validate format if provided
        if (value && value.trim()) {
          const phoneRegex = /^(\+?256|0)[0-9]{9}$/;
          const cleanPhone = value.replace(/[\s\-()]/g, '');
          if (!phoneRegex.test(cleanPhone)) {
            return 'Please enter a valid Ugandan phone number';
          }

          // Check if it's the same as primary phone
          if (cleanPhone === formData.contact_phone.replace(/[\s\-()]/g, '')) {
            return 'Alternative phone number must be different from primary phone';
          }
        }
        return '';

      case 'contact_relationship':
        if (!value) {
          return 'Please specify your relationship with the contact person';
        }
        return '';

      default:
        return '';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['contact_name', 'contact_phone', 'contact_relationship'];

    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    // Validate optional fields if they have values
    if (formData.alternative_phone) {
      const altPhoneError = validateField('alternative_phone', formData.alternative_phone);
      if (altPhoneError) {
        newErrors.alternative_phone = altPhoneError;
      }
    }

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

    // Mark all required fields as touched
    const requiredFields = ['contact_name', 'contact_phone', 'contact_relationship'];
    const allTouched = { ...touched };
    requiredFields.forEach(field => {
      allTouched[field] = true;
    });
    setTouched(allTouched);

    if (validateForm()) {
      // Format phone numbers
      const formatPhone = phone => {
        if (!phone) return '';
        const cleanPhone = phone.replace(/[\s\-()]/g, '');
        return cleanPhone.startsWith('+')
          ? cleanPhone
          : cleanPhone.startsWith('0') ? `+256${cleanPhone.slice(1)}`
          : cleanPhone.startsWith('256') ? `+${cleanPhone}`
          : `+256${cleanPhone}`;
      };

      onSubmit({
        ...formData,
        contact_name: formData.contact_name.trim(),
        contact_phone: formatPhone(formData.contact_phone),
        alternative_phone: formatPhone(formData.alternative_phone),
        contact_notes: formData.contact_notes.trim(),
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

  const getSelectClassName = fieldName => {
    let className = 'form-select';
    if (errors[fieldName]) {
      className += ' error';
    } else if (touched[fieldName] && formData[fieldName]) {
      className += ' success';
    }
    return className;
  };

  return (
    <div className="contact-form">
      <div className="form-header">
        <h4>Emergency Contact Information</h4>
        <p>Provide a contact person in case we need to reach someone regarding your delivery.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="contact_name" className="form-label">
            Contact Person Name *
          </label>
          <div className="input-with-icon">
            <i className="fas fa-user input-icon" />
            <input
              type="text"
              id="contact_name"
              name="contact_name"
              value={formData.contact_name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getFieldClassName('contact_name')}
              placeholder="Full name of contact person"
              disabled={loading}
              autoComplete="name"
            />
          </div>
          {errors.contact_name && (
            <div className="form-error">
              <i className="fas fa-exclamation-triangle" />
              {errors.contact_name}
            </div>
          )}
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="contact_phone" className="form-label">
              Primary Phone *
            </label>
            <div className="input-with-icon">
              <i className="fas fa-phone input-icon" />
              <input
                type="tel"
                id="contact_phone"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getFieldClassName('contact_phone')}
                placeholder="+256700000000"
                disabled={loading}
                autoComplete="tel"
              />
            </div>
            {errors.contact_phone && (
              <div className="form-error">
                <i className="fas fa-exclamation-triangle" />
                {errors.contact_phone}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="alternative_phone" className="form-label">
              Alternative Phone (Optional)
            </label>
            <div className="input-with-icon">
              <i className="fas fa-mobile-alt input-icon" />
              <input
                type="tel"
                id="alternative_phone"
                name="alternative_phone"
                value={formData.alternative_phone}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getFieldClassName('alternative_phone')}
                placeholder="+256700000000"
                disabled={loading}
                autoComplete="tel"
              />
            </div>
            {errors.alternative_phone && (
              <div className="form-error">
                <i className="fas fa-exclamation-triangle" />
                {errors.alternative_phone}
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="contact_relationship" className="form-label">
            Relationship to You *
          </label>
          <div className="input-with-icon">
            <i className="fas fa-heart input-icon" />
            <select
              id="contact_relationship"
              name="contact_relationship"
              value={formData.contact_relationship}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getSelectClassName('contact_relationship')}
              disabled={loading}
            >
              <option value="">Select relationship</option>
              {relationshipOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {errors.contact_relationship && (
            <div className="form-error">
              <i className="fas fa-exclamation-triangle" />
              {errors.contact_relationship}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="contact_notes" className="form-label">
            Additional Notes (Optional)
          </label>
          <textarea
            id="contact_notes"
            name="contact_notes"
            value={formData.contact_notes}
            onChange={handleChange}
            onBlur={handleBlur}
            className={getFieldClassName('contact_notes')}
            placeholder="Any additional information about the contact person or special instructions..."
            rows="3"
            maxLength="300"
            disabled={loading}
          />
          <div className="form-hint">
            <i className="fas fa-info-circle" />
            This information is only used in case we cannot reach you directly
          </div>
        </div>

        {/* Contact preview */}
        {formData.contact_name && formData.contact_phone && formData.contact_relationship && (
          <div className="contact-preview">
            <h4>Emergency Contact:</h4>
            <div className="preview-content">
              <div className="contact-details">
                <div className="contact-item">
                  <i className="fas fa-user" />
                  <span>
                    <strong>{formData.contact_name}</strong> (
                    {
                      relationshipOptions.find(opt => opt.value === formData.contact_relationship)
                        ?.label
                    }
                    )
                  </span>
                </div>
                <div className="contact-item">
                  <i className="fas fa-phone" />
                  <span>{formData.contact_phone}</span>
                </div>
                {formData.alternative_phone && (
                  <div className="contact-item">
                    <i className="fas fa-mobile-alt" />
                    <span>{formData.alternative_phone} (Alternative)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="btn-save-contact"
            disabled={loading || Object.keys(errors).some(key => errors[key])}
          >
            {loading ? (
              <>
                <div className="btn-spinner" />
                Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save" />
                Save Contact Information
              </>
            )}
          </button>
        </div>
      </form>

      {/* Privacy notice */}
      <div className="privacy-notice">
        <div className="notice-content">
          <i className="fas fa-shield-alt" />
          <div className="notice-text">
            <strong>Privacy Notice:</strong> Your contact information is kept confidential and is
            only used for delivery purposes. We will never share this information with third
            parties.
          </div>
        </div>
      </div>

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

export default ContactForm;