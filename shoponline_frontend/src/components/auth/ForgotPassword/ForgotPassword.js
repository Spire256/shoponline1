import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authAPI from '../../../services/api/authAPI';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = email => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email address is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.forgotPassword(email);

      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.error || 'Failed to send reset email. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Password reset request error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = e => {
    setEmail(e.target.value);
    if (error) {
      setError('');
    }
  };

  if (success) {
    return (
      <div className="forgot-password-container">
        <div className="forgot-password-card">
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

            <h1 className="success-title">Check Your Email</h1>
            <p className="success-description">
              We've sent a password reset link to <strong>{email}</strong>
            </p>

            <div className="success-instructions">
              <h3>Next Steps:</h3>
              <ol>
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the password reset link in the email</li>
                <li>Follow the instructions to create a new password</li>
                <li>Sign in with your new password</li>
              </ol>
            </div>

            <div className="success-actions">
              <Link to="/auth/login" className="back-to-login">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="15,18 9,12 15,6" />
                </svg>
                Back to Sign In
              </Link>

              <button
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                }}
                className="send-again-btn"
              >
                Send Another Email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="forgot-password-header">
          <div className="logo-container">
            <img
              src="/assets/logo/logo-blue.svg"
              alt="ShopOnline Uganda"
              className="forgot-password-logo"
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
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <circle cx="12" cy="16" r="1" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h1 className="forgot-password-title">Forgot Password?</h1>
          <p className="forgot-password-subtitle">
            No worries! Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <div className="forgot-password-body">
          {error && (
            <div className="error-alert">
              <div className="error-icon">⚠</div>
              <span className="error-message">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="forgot-password-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <div className="input-wrapper">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={handleEmailChange}
                  className={`form-input ${error ? 'input-error' : ''}`}
                  placeholder="Enter your email address"
                  disabled={loading}
                  autoComplete="email"
                  autoFocus
                />
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
              </div>
            </div>

            <button
              type="submit"
              className={`reset-button ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  <span>Sending Email...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Email</span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12,5 19,12 12,19" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="forgot-password-footer">
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

          <div className="help-text">
            <p>
              Don't have an account?{' '}
              <Link to="/auth/register" className="register-link">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
      12/14/2025, 3:39:36 PM
      <div className="forgot-password-info">
        <div className="info-content">
          <h2 className="info-title">Security First</h2>
          <p className="info-description">
            Your account security is our priority. We use industry-standard encryption and secure
            reset processes to protect your information.
          </p>

          <div className="security-features">
            <div className="feature-item">
              <div className="feature-icon">🔒</div>
              <div className="feature-text">
                <h4>Secure Reset Links</h4>
                <p>One-time use links that expire after 1 hour</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">🛡️</div>
              <div className="feature-text">
                <h4>Account Protection</h4>
                <p>Multi-layer security to prevent unauthorized access</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">📧</div>
              <div className="feature-text">
                <h4>Email Verification</h4>
                <p>Reset emails sent only to verified addresses</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
