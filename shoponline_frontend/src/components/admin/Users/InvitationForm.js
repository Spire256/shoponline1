import React, { useState } from 'react';
import { Send, Mail, AlertCircle, CheckCircle } from 'lucide-react';

const InvitationForm = ({ onSubmit, loading = false, isModal = false }) => {
  const [formData, setFormData] = useState({
    email: '',
  });
  const [errors, setErrors] = useState({});
  const [validationMessage, setValidationMessage] = useState('');

  const validateEmail = email => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      return 'Email is required';
    }

    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }

    if (!email.endsWith('@shoponline.com')) {
      return 'Admin email must use @shoponline.com domain';
    }

    return null;
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }

    // Real-time email validation
    if (name === 'email') {
      const error = validateEmail(value);
      if (error) {
        setErrors(prev => ({ ...prev, email: error }));
        setValidationMessage('');
      } else {
        setErrors(prev => ({ ...prev, email: '' }));
        setValidationMessage('Valid admin email format');
      }
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    // Validate form
    const emailError = validateEmail(formData.email);

    if (emailError) {
      setErrors({ email: emailError });
      return;
    }

    // Clear any previous errors
    setErrors({});
    setValidationMessage('');

    try {
      await onSubmit(formData);

      // Reset form on success
      setFormData({ email: '' });
      setValidationMessage('');
    } catch (error) {
      setErrors({
        submit: error.message || 'Failed to send invitation',
      });
    }
  };

  const isFormValid = formData.email && !errors.email;

  return (
    <div className={`invitation-form ${isModal ? 'modal-form' : ''}`}>
      <div className="form-header">
        <div className="form-title">
          <Mail size={24} />
          <h3>Send Admin Invitation</h3>
        </div>
        <p className="form-description">
          Invite a new administrator to join the platform. They will receive an email with
          registration instructions.
        </p>
      </div>

      <div className="invitation-form-content">
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Admin Email Address
            <span className="required">*</span>
          </label>

          <div className="input-wrapper">
            <Mail size={20} className="input-icon" />
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="newadmin@shoponline.com"
              className={`form-input ${
                errors.email ? 'error' : validationMessage ? 'success' : ''
              }`}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          {/* Error Message */}
          {errors.email && (
            <div className="field-error">
              <AlertCircle size={16} />
              <span>{errors.email}</span>
            </div>
          )}

          {/* Success Message */}
          {validationMessage && !errors.email && (
            <div className="field-success">
              <CheckCircle size={16} />
              <span>{validationMessage}</span>
            </div>
          )}

          {/* Email Domain Info */}
          <div className="field-info">
            <p>Only @shoponline.com email addresses are accepted for admin invitations</p>
          </div>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="submit-error">
            <AlertCircle size={20} />
            <span>{errors.submit}</span>
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={!isFormValid || loading}>
            {loading ? (
              <>
                <div className="loading-spinner small" />
                Sending Invitation...
              </>
            ) : (
              <>
                <Send size={20} />
                Send Invitation
              </>
            )}
          </button>

          {!isModal && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setFormData({ email: '' })}
              disabled={loading}
            >
              Clear Form
            </button>
          )}
        </div>

        {/* Information Box */}
        <div className="info-box">
          <div className="info-header">
            <AlertCircle size={20} />
            <strong>Important Information</strong>
          </div>
          <ul className="info-list">
            <li>The invitation will be valid for 48 hours</li>
            <li>The recipient will receive an email with registration link</li>
            <li>Once accepted, they will have full admin privileges</li>
            <li>You can cancel or resend invitations if needed</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InvitationForm;
