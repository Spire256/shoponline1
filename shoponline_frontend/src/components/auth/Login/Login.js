import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import LoginForm from './LoginForm';
import './Login.css';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated, isLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the redirect path from location state
  const from = location.state?.from?.pathname || '/';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // Enhanced redirect logic with admin check
      const redirectPath = isAdmin() ? '/admin/dashboard' : from;
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, from, isAdmin]);

  const handleLogin = useCallback(async (credentials) => {
    // Prevent multiple simultaneous login attempts
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const response = await login(credentials);

      if (response.success) {
        // Clear any existing errors
        setError('');
        
        // Enhanced debug logging
        console.log('Login successful:', {
          user: response.user,
          role: response.user?.role,
          is_staff: response.user?.is_staff,
          email: response.user?.email
        });
        
        // Determine redirect path based on user role with multiple fallback checks
        const user = response.user;
        const isAdminUser = user?.role === 'admin' || 
                           user?.is_staff === true || 
                           (user?.email && user.email.endsWith('@shoponline.com'));
        
        const redirectPath = isAdminUser ? '/admin/dashboard' : from;
        
        console.log('Redirecting to:', redirectPath);
        navigate(redirectPath, { replace: true });
      } else {
        // Handle specific error messages from backend
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : response.error?.detail || 
            response.error?.non_field_errors?.[0] || 
            response.error?.email?.[0] ||
            response.error?.password?.[0] ||
            'Login failed. Please check your credentials.';
        
        setError(errorMessage);
        console.error('Login failed:', response.error);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [loading, login, navigate, from]);

  // Clear error when user starts typing
  const clearError = useCallback(() => {
    if (error) setError('');
  }, [error]);

  // Show loading state while auth context is initializing
  if (isLoading) {
    return (
      <div className="login-container">
        <div className="login-wrapper">
          <div className="login-card">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-header">
            <div className="logo-container">
              <img
                src="/assets/images/logo/logo-blue.svg"
                alt="ShopOnline Uganda"
                className="login-logo"
                onError={e => {
                  e.target.src = '/favicon.ico';
                }}
              />
            </div>
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">Sign in to your ShopOnline Uganda account</p>
          </div>

          <div className="login-body">
            {error && (
              <div className="error-alert" role="alert">
                <div className="error-icon">⚠</div>
                <span className="error-message">{error}</span>
                <button 
                  className="error-close"
                  onClick={() => setError('')}
                  aria-label="Close error"
                >
                  ×
                </button>
              </div>
            )}

            <LoginForm 
              onSubmit={handleLogin} 
              loading={loading}
              onInputChange={clearError}
            />

            <div className="login-divider">
              <span className="divider-text">or</span>
            </div>

            <div className="login-links">
              <Link to="/auth/forgot-password" className="forgot-password-link">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div className="login-footer">
            <p className="signup-text">
              Don't have an account?{' '}
              <Link to="/auth/register" className="signup-link">
                Sign up here
              </Link>
            </p>
            <p className="admin-text">
              Are you an admin?{' '}
              <Link to="/auth/admin/register" className="admin-link">
                Admin Registration
              </Link>
            </p>
          </div>
        </div>

        <div className="login-info">
          <div className="info-content">
            <h2 className="info-title">Your Trusted Shopping Partner</h2>
            <p className="info-description">
              Experience seamless online shopping in Uganda with secure payments, fast delivery, and
              exclusive deals.
            </p>
            <div className="info-features">
              <div className="feature-item">
                <div className="feature-icon">📱</div>
                <span>Mobile Money Payments</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🚚</div>
                <span>Local Delivery</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">⚡</div>
                <span>Flash Sales</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🛡</div>
                <span>Secure Shopping</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;