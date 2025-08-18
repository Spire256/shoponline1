// src/components/auth/Register/Register.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ClientRegister from './ClientRegister';
import AdminRegister from './AdminRegister';
import './Register.css';

const Register = () => {
  const [activeTab, setActiveTab] = useState('client');

  return (
    <div className="register-container">
      <div className="register-wrapper">
        <div className="register-card">
          <div className="register-header">
            <div className="logo-container">
              <img
                src="/assets/images/logo/logo-blue.svg.jpg"
                alt="ShopOnline Uganda"
                className="register-logo"
              />
            </div>
            <h1 className="register-title">Create Account</h1>
            <p className="register-subtitle">Join ShopOnline Uganda today</p>
          </div>

          <div className="register-tabs">
            <button
              className={`tab-button ${activeTab === 'client' ? 'active' : ''}`}
              onClick={() => setActiveTab('client')}
            >
              <div className="tab-icon">👤</div>
              <span>Customer</span>
            </button>
            <button
              className={`tab-button ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <div className="tab-icon">🛡️</div>
              <span>Admin</span>
            </button>
          </div>

          <div className="register-body">
            {activeTab === 'client' ? <ClientRegister /> : <AdminRegister />}
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

        <div className="register-info">
          <div className="info-content">
            <h2 className="info-title">Start Your Shopping Journey</h2>
            <p className="info-description">
              Get access to exclusive deals, secure payments, and fast delivery across Uganda.
            </p>

            <div className="info-benefits">
              <div className="benefit-item">
                <div className="benefit-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <div className="benefit-text">
                  <h3>Secure Payments</h3>
                  <p>MTN & Airtel Mobile Money support</p>
                </div>
              </div>

              <div className="benefit-item">
                <div className="benefit-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z" />
                  </svg>
                </div>
                <div className="benefit-text">
                  <h3>Fast Delivery</h3>
                  <p>Quick delivery across Uganda</p>
                </div>
              </div>

              <div className="benefit-item">
                <div className="benefit-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <div className="benefit-text">
                  <h3>Quality Products</h3>
                  <p>Verified sellers and genuine products</p>
                </div>
              </div>

              <div className="benefit-item">
                <div className="benefit-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                  </svg>
                </div>
                <div className="benefit-text">
                  <h3>24/7 Support</h3>
                  <p>Customer service when you need it</p>
                </div>
              </div>
            </div>

            <div className="info-stats">
              <div className="stat-item">
                <div className="stat-number">10K+</div>
                <div className="stat-label">Happy Customers</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">5K+</div>
                <div className="stat-label">Products</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">50+</div>
                <div className="stat-label">Cities Covered</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
