import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import ClientRegister from './ClientRegister';
import AdminRegister from './AdminRegister';
import './Register.css';

const Register = () => {
  const [activeTab, setActiveTab] = useState('client');
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Memoize tab switching to prevent unnecessary re-renders
  const handleTabSwitch = useCallback((tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [activeTab]);

  // Memoize static content to prevent re-renders
  const benefitItems = useMemo(() => [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      ),
      title: "Mobile Money Payments",
      description: "MTN & Airtel Mobile Money support"
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z" />
        </svg>
      ),
      title: "Local Delivery",
      description: "Quick delivery across Uganda"
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ),
      title: "Quality Products",
      description: "Verified sellers and genuine products"
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
        </svg>
      ),
      title: "24/7 Support",
      description: "Customer service when you need it"
    }
  ], []);

  const statItems = useMemo(() => [
    { number: "10K+", label: "Happy Customers" },
    { number: "5K+", label: "Products" },
    { number: "50+", label: "Cities Covered" }
  ], []);

  // Show loading state while auth context is initializing
  if (isLoading) {
    return (
      <div className="register-container">
        <div className="register-wrapper">
          <div className="register-card">
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
    <div className="register-container">
      <div className="register-wrapper">
        <div className="register-card">
          <div className="register-card-content">
            <div className="register-header">
              <div className="logo-container">
                <img
                  src="/assets/images/logo/logo-blue.svg"
                  alt="ShopOnline Uganda"
                  className="register-logo"
                  onError={e => {
                    e.target.src = '/favicon.ico';
                  }}
                />
              </div>
              <h1 className="register-title">Create Account</h1>
              <p className="register-subtitle">Join ShopOnline Uganda today</p>
            </div>

            <div className="register-tabs">
              <button
                className={`tab-button ${activeTab === 'client' ? 'active' : ''}`}
                onClick={() => handleTabSwitch('client')}
                type="button"
                aria-pressed={activeTab === 'client'}
              >
                <div className="tab-icon">👤</div>
                <span>Customer</span>
              </button>
              <button
                className={`tab-button ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => handleTabSwitch('admin')}
                type="button"
                aria-pressed={activeTab === 'admin'}
              >
                <div className="tab-icon">🛡️</div>
                <span>Admin</span>
              </button>
            </div>

            <div className="register-body">
              {activeTab === 'client' ? (
                <ClientRegister key="client-register" />
              ) : (
                <AdminRegister key="admin-register" />
              )}
            </div>

            <div className="register-footer">
              <p className="login-text">
                Already have an account?{' '}
                <Link to="/auth/login" className="login-link">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="register-info">
          <div className="info-content">
            <h2 className="info-title">Your Trusted Shopping Partner</h2>
            <p className="info-description">
              Experience seamless online shopping in Uganda with secure payments, fast delivery, and exclusive deals.
            </p>

            <div className="info-benefits">
              {benefitItems.map((benefit, index) => (
                <div key={index} className="benefit-item">
                  <div className="benefit-icon">
                    {benefit.icon}
                  </div>
                  <div className="benefit-text">
                    <h3>{benefit.title}</h3>
                    <p>{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="info-stats">
              {statItems.map((stat, index) => (
                <div key={index} className="stat-item">
                  <div className="stat-number">{stat.number}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;