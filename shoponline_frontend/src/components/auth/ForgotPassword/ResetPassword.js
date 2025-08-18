// src/components/auth/ForgotPassword/ResetPassword.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { resetPassword, validateResetToken } from '../../../services/api/authAPI';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    password: '',
    password_confirm: '',
  });
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    password: false,
    password_confirm: false,
  });

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setValidating(false);
      setError('No reset token provided');
    }
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await validateResetToken(token);
      if (response.success) {
        setTokenValid(true);
      } else {
        setError('Invalid or expired reset token');
      }
    } catch (err) {
      setError('Failed to validate reset token');
      console.error('Token validation error:', err);
    } finally {
      setValidating(false);
    }
  };

  const validatePassword = password => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return 'Password must contain uppercase, lowercase, and number';
    }
    return '';
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError('');
    }
  };

  const togglePasswordVisibility = field => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    // Validate passwords
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await resetPassword({
        token,
        new_password: formData.password,
        confirm_password: formData.password_confirm,
      });

      if (response.success) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/auth/login', {
            state: { message: 'Password reset successful! Please sign in with your new password.' },
          });
        }, 3000);
      } else {
        setError(response.error || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Password reset error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-card">
          <div className="validation-loading">
            <div className="spinner-large" />
            <h3>Validating Reset Token</h3>
            <p>Please wait while we verify your password reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-card">
          <div className="error-content">
            <div className="error-icon-large">
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>

            <h1 className="error-title">Invalid Reset Link</h1>
            <p className="error-description">
              {error || 'This password reset link is invalid or has expired.'}
            </p>

            <div className="error-actions">
              <Link to="/auth/forgot-password" className="request-new-btn">
                Request New Reset Link
              </Link>
              <Link to="/auth/login" className="back-to-login">
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-card">
          <div className="success-content">
            <div className="success-icon-large">
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22,4 12,14.01 9,11.01" />
              </svg>
            </div>

            <h1 className="success-title">Password Reset Successful!</h1>
            <p className="success-description">
              Your password has been successfully reset. You can now sign in with your new password.
            </p>

            <div className="success-actions">
              <Link to="/auth/login" className="continue-btn">
                Continue to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <div className="reset-password-header">
          <div className="logo-container">
            <img
              src="/assets/logo/logo-blue.svg"
              alt="ShopOnline Uganda"
              className="reset-password-logo"
            />
          </div>

          <div className="header-icon">
            <svg
              width="60"
              height="60"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 1l3 6 6 .5-5 4.5 2 6-6-3-6 3 2-6-5-4.5 6-.5 3-6z" />
            </svg>
          </div>

          <h1 className="reset-password-title">Create New Password</h1>
          <p className="reset-password-subtitle">
            Choose a strong password for your ShopOnline Uganda account.
          </p>
        </div>

        <div className="reset-password-body">
          {error && (
            <div className="error-alert">
              <div className="error-icon">⚠</div>
              <span className="error-message">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="reset-password-form">
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                New Password
              </label>
              <div className="input-wrapper">
                <input
                  type={showPasswords.password ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter your new password"
                  disabled={loading}
                  autoComplete="new-password"
                  autoFocus
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('password')}
                  disabled={loading}
                >
                  {showPasswords.password ? (
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
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password_confirm" className="form-label">
                Confirm New Password
              </label>
              <div className="input-wrapper">
                <input
                  type={showPasswords.password_confirm ? 'text' : 'password'}
                  id="password_confirm"
                  name="password_confirm"
                  value={formData.password_confirm}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Confirm your new password"
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('password_confirm')}
                  disabled={loading}
                >
                  {showPasswords.password_confirm ? (
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
              </div>
            </div>

            <div className="password-requirements">
              <h4>Password Requirements:</h4>
              <ul>
                <li className={formData.password && formData.password.length >= 8 ? 'valid' : ''}>
                  At least 8 characters long
                </li>
                <li
                  className={
                    formData.password && /(?=.*[a-z])/.test(formData.password) ? 'valid' : ''
                  }
                >
                  Contains lowercase letter
                </li>
                <li
                  className={
                    formData.password && /(?=.*[A-Z])/.test(formData.password) ? 'valid' : ''
                  }
                >
                  Contains uppercase letter
                </li>
                <li
                  className={formData.password && /(?=.*\d)/.test(formData.password) ? 'valid' : ''}
                >
                  Contains number
                </li>
                <li
                  className={
                    formData.password &&
                    formData.password_confirm &&
                    formData.password === formData.password_confirm
                      ? 'valid'
                      : ''
                  }
                >
                  Passwords match
                </li>
              </ul>
            </div>

            <button
              type="submit"
              className={`reset-button ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  <span>Resetting Password...</span>
                </>
              ) : (
                <>
                  <span>Reset Password</span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 1l3 6 6 .5-5 4.5 2 6-6-3-6 3 2-6-5-4.5 6-.5 3-6z" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="reset-password-footer">
          <div className="back-to-login-container">
            <Link to="/auth/login" className="back-to-login-link">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="15,18 9,12 15,6" />
              </svg>
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>

      <div className="reset-password-info">
        <div className="info-content">
          <h2 className="info-title">Password Security Tips</h2>
          <p className="info-description">
            Create a strong password to keep your ShopOnline Uganda account secure.
          </p>

          <div className="security-tips">
            <div className="tip-item">
              <div className="tip-icon">💡</div>
              <div className="tip-text">
                <h4>Use a mix of characters</h4>
                <p>Combine uppercase, lowercase, numbers, and symbols</p>
              </div>
            </div>

            <div className="tip-item">
              <div className="tip-icon">🔐</div>
              <div className="tip-text">
                <h4>Make it unique</h4>
                <p>Don't reuse passwords from other accounts</p>
              </div>
            </div>

            <div className="tip-item">
              <div className="tip-icon">📏</div>
              <div className="tip-text">
                <h4>Longer is stronger</h4>
                <p>Use at least 8 characters, but longer is better</p>
              </div>
            </div>

            <div className="tip-item">
              <div className="tip-icon">🤐</div>
              <div className="tip-text">
                <h4>Keep it private</h4>
                <p>Never share your password with anyone</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
