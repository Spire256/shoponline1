import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import LoginForm from './LoginForm';
import './Login.css';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the redirect path from location state
  const from = location.state?.from?.pathname || '/';

  const handleLogin = async credentials => {
    setLoading(true);
    setError('');

    try {
      const response = await login(credentials);

      if (response.success) {
        // Redirect based on user role
        if (response.user.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      } else {
        setError(response.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-header">
            <div className="logo-container">
              <img
                src="/assets/images/logo/logo-blue.svg.jpg"
                alt="ShopOnline Uganda"
                className="login-logo"
              />
            </div>
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">Sign in to your ShopOnline Uganda account</p>
          </div>

          <div className="login-body">
            {error && (
              <div className="error-alert">
                <div className="error-icon">⚠</div>
                <span className="error-message">{error}</span>
              </div>
            )}

            <LoginForm onSubmit={handleLogin} loading={loading} />

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
                <div className="feature-icon">🛡️</div>
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
