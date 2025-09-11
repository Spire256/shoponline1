import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, Mail, Lock, AlertCircle, CheckCircle, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './AdminRegisterPage.css';

const AdminRegisterPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { registerAdmin } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    passwordConfirm: '',
    invitationToken: token || '',
  });
  
  const [validation, setValidation] = useState({
    isValid: false,
    email: '',
    invitedBy: '',
    loading: true,
    error: null,
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [],
  });

  // Validate invitation token on component mount
  useEffect(() => {
    if (token) {
      validateInvitationToken();
    } else {
      setValidation({
        isValid: false,
        email: '',
        invitedBy: '',
        loading: false,
        error: 'Invalid invitation link',
      });
    }
  }, [token]);

  const validateInvitationToken = async () => {
    try {
      setValidation(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch(`/api/v1/auth/invitations/validate/${token}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setValidation({
          isValid: true,
          email: data.email,
          invitedBy: data.invited_by,
          loading: false,
          error: null,
        });
      } else {
        setValidation({
          isValid: false,
          email: '',
          invitedBy: '',
          loading: false,
          error: data.error || 'Invalid or expired invitation',
        });
      }
    } catch (error) {
      setValidation({
        isValid: false,
        email: '',
        invitedBy: '',
        loading: false,
        error: 'Failed to validate invitation. Please check your connection.',
      });
    }
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear specific field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }

    // Clear submit error
    if (submitError) {
      setSubmitError('');
    }

    // Check password strength if password field
    if (name === 'password') {
      checkPasswordStrength(value);
    }

    // Validate password confirmation
    if (name === 'passwordConfirm' && formData.password) {
      if (value && value !== formData.password) {
        setFormErrors(prev => ({
          ...prev,
          passwordConfirm: 'Passwords do not match',
        }));
      } else {
        setFormErrors(prev => ({
          ...prev,
          passwordConfirm: '',
        }));
      }
    }
  };

  const checkPasswordStrength = password => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    };

    const score = Object.values(checks).filter(Boolean).length;
    const feedback = [];

    if (!checks.length) feedback.push('At least 8 characters');
    if (!checks.uppercase) feedback.push('One uppercase letter');
    if (!checks.lowercase) feedback.push('One lowercase letter');
    if (!checks.number) feedback.push('One number');
    if (!checks.special) feedback.push('One special character');

    setPasswordStrength({ score, feedback });
  };

  const validateForm = () => {
    const errors = {};

    // First name validation
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (passwordStrength.score < 4) {
      errors.password = 'Password does not meet security requirements';
    }

    // Password confirmation validation
    if (!formData.passwordConfirm) {
      errors.passwordConfirm = 'Password confirmation is required';
    } else if (formData.password !== formData.passwordConfirm) {
      errors.passwordConfirm = 'Passwords do not match';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setSubmitError('');

    try {
      const result = await registerAdmin({
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        password: formData.password,
        password_confirm: formData.passwordConfirm,
        invitation_token: formData.invitationToken,
      });

      if (result.success) {
        // Registration successful, redirect to admin dashboard
        navigate('/admin/dashboard', { replace: true });
      } else {
        // Handle registration errors
        if (result.error && typeof result.error === 'object') {
          // Handle field-specific errors
          setFormErrors(result.error);
        } else {
          setSubmitError(result.error || 'Registration failed. Please try again.');
        }
      }
    } catch (error) {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 2) return '#ef4444';
    if (passwordStrength.score <= 3) return '#f59e0b';
    return '#10b981';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength.score <= 2) return 'Weak';
    if (passwordStrength.score <= 3) return 'Medium';
    return 'Strong';
  };

  // Loading state
  if (validation.loading) {
    return (
      <div className="admin-register-page">
        <div className="register-container">
          <div className="register-card">
            <div className="register-header">
              <div className="register-icon">
                <Shield className="icon" />
              </div>
              <h1>Validating Invitation</h1>
              <p>Please wait while we validate your invitation...</p>
            </div>
            <div className="loading-spinner">
              <div className="spinner" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Invalid invitation
  if (!validation.isValid) {
    return (
      <div className="admin-register-page">
        <div className="register-container">
          <div className="register-card">
            <div className="register-header error">
              <div className="register-icon error">
                <AlertCircle className="icon" />
              </div>
              <h1>Invalid Invitation</h1>
              <p>{validation.error}</p>
            </div>
            <div className="register-actions">
              <button
                type="button"
                onClick={() => navigate('/admin/login')}
                className="btn btn-secondary"
              >
                Go to Admin Login
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="btn btn-outline"
              >
                Back to Store
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-register-page">
      <div className="register-container">
        <div className="register-card">
          {/* Header */}
          <div className="register-header">
            <div className="register-icon">
              <Shield className="icon" />
            </div>
            <h1>Create Admin Account</h1>
            <p>Complete your admin registration for ShopOnline Uganda</p>
          </div>

          {/* Invitation Info */}
          <div className="invitation-info">
            <div className="invitation-card">
              <div className="invitation-details">
                <div className="invitation-item">
                  <Mail className="invitation-icon" />
                  <div>
                    <span className="invitation-label">Email:</span>
                    <span className="invitation-value">{validation.email}</span>
                  </div>
                </div>
                <div className="invitation-item">
                  <User className="invitation-icon" />
                  <div>
                    <span className="invitation-label">Invited by:</span>
                    <span className="invitation-value">{validation.invitedBy}</span>
                  </div>
                </div>
              </div>
              <div className="invitation-status">
                <CheckCircle className="status-icon valid" />
                <span>Valid Invitation</span>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="register-form">
            {submitError && (
              <div className="form-alert error">
                <AlertCircle className="alert-icon" />
                <div>
                  <p className="alert-message">{submitError}</p>
                </div>
              </div>
            )}

            <div className="form-row">
              {/* First Name */}
              <div className="form-group">
                <label htmlFor="firstName" className="form-label">
                  First Name *
                </label>
                <div className="input-wrapper">
                  <User className="input-icon" />
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    className={`form-input ${formErrors.firstName ? 'error' : ''}`}
                    placeholder="Enter your first name"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>
                {formErrors.firstName && (
                  <p className="form-error">{formErrors.firstName}</p>
                )}
              </div>

              {/* Last Name */}
              <div className="form-group">
                <label htmlFor="lastName" className="form-label">
                  Last Name *
                </label>
                <div className="input-wrapper">
                  <User className="input-icon" />
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    className={`form-input ${formErrors.lastName ? 'error' : ''}`}
                    placeholder="Enter your last name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>
                {formErrors.lastName && (
                  <p className="form-error">{formErrors.lastName}</p>
                )}
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password *
              </label>
              <div className="input-wrapper">
                <Lock className="input-icon" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className={`form-input ${formErrors.password ? 'error' : ''}`}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="toggle-icon" /> : <Eye className="toggle-icon" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div
                      className="strength-fill"
                      style={{
                        width: `${(passwordStrength.score / 5) * 100}%`,
                        backgroundColor: getPasswordStrengthColor(),
                      }}
                    />
                  </div>
                  <div className="strength-info">
                    <span 
                      className="strength-text"
                      style={{ color: getPasswordStrengthColor() }}
                    >
                      {getPasswordStrengthText()}
                    </span>
                    {passwordStrength.feedback.length > 0 && (
                      <div className="strength-feedback">
                        <span>Required: {passwordStrength.feedback.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {formErrors.password && (
                <p className="form-error">{formErrors.password}</p>
              )}
            </div>

            {/* Password Confirmation */}
            <div className="form-group">
              <label htmlFor="passwordConfirm" className="form-label">
                Confirm Password *
              </label>
              <div className="input-wrapper">
                <Lock className="input-icon" />
                <input
                  id="passwordConfirm"
                  name="passwordConfirm"
                  type={showPasswordConfirm ? 'text' : 'password'}
                  required
                  className={`form-input ${formErrors.passwordConfirm ? 'error' : ''}`}
                  placeholder="Confirm your password"
                  value={formData.passwordConfirm}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  disabled={isLoading}
                >
                  {showPasswordConfirm ? (
                    <EyeOff className="toggle-icon" />
                  ) : (
                    <Eye className="toggle-icon" />
                  )}
                </button>
              </div>
              {formErrors.passwordConfirm && (
                <p className="form-error">{formErrors.passwordConfirm}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary btn-large"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="button-loading">
                  <div className="spinner" />
                  Creating Account...
                </div>
              ) : (
                'Create Admin Account'
              )}
            </button>

            {/* Additional Links */}
            <div className="form-links">
              <button
                type="button"
                onClick={() => navigate('/admin/login')}
                className="link-button"
                disabled={isLoading}
              >
                Already have an admin account? Sign in
              </button>
            </div>
          </form>

          {/* Security Notice */}
          <div className="security-notice">
            <Shield className="notice-icon" />
            <div>
              <h3>Security Notice</h3>
              <p>
                Your admin account will have full access to the ShopOnline platform. 
                Please use a strong, unique password and keep your credentials secure.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRegisterPage;