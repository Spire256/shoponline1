// src/components/auth/Profile/Profile.js
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../../contexts/AuthContext';
import EditProfile from './EditProfile';
import './Profile.css';

const Profile = () => {
  const { user, updateProfile, loading } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const handleUpdateProfile = async updatedData => {
    const result = await updateProfile(updatedData);
    if (result.success) {
      setIsEditing(false);
    }
    return result;
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-UG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">
          <div className="spinner-large" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-error">
          <h2>Profile not found</h2>
          <p>Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-wrapper">
        <div className="profile-sidebar">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {user.profile_image ? (
                <img src={user.profile_image} alt={user.full_name} className="avatar-image" />
              ) : (
                <div className="avatar-placeholder">
                  {getInitials(user.first_name, user.last_name)}
                </div>
              )}
              <div className="avatar-status">
                <div
                  className={`status-indicator ${
                    user.is_email_verified ? 'verified' : 'unverified'
                  }`}
                >
                  {user.is_email_verified ? '✓' : '!'}
                </div>
              </div>
            </div>

            <div className="profile-basic-info">
              <h2 className="profile-name">{user.full_name}</h2>
              <p className="profile-email">{user.email}</p>
              <div className="profile-role">
                <span className={`role-badge ${user.role}`}>
                  {user.role === 'admin' ? '🛡️ Admin' : '👤 Customer'}
                </span>
              </div>
            </div>
          </div>

          <nav className="profile-nav">
            <button
              className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
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
              Profile Information
            </button>

            <button
              className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <circle cx="12" cy="16" r="1" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Security Settings
            </button>

            <button
              className={`nav-item ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              Account Activity
            </button>
          </nav>
        </div>

        <div className="profile-content">
          {activeTab === 'profile' && (
            <div className="profile-tab-content">
              <div className="content-header">
                <div className="header-text">
                  <h1>Profile Information</h1>
                  <p>Manage your personal information and preferences</p>
                </div>
                {!isEditing && (
                  <button className="edit-button" onClick={() => setIsEditing(true)}>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit Profile
                  </button>
                )}
              </div>

              {isEditing ? (
                <EditProfile
                  user={user}
                  onSave={handleUpdateProfile}
                  onCancel={() => setIsEditing(false)}
                />
              ) : (
                <div className="profile-details">
                  <div className="details-grid">
                    <div className="detail-item">
                      <label className="detail-label">First Name</label>
                      <div className="detail-value">{user.first_name}</div>
                    </div>

                    <div className="detail-item">
                      <label className="detail-label">Last Name</label>
                      <div className="detail-value">{user.last_name}</div>
                    </div>

                    <div className="detail-item">
                      <label className="detail-label">Email Address</label>
                      <div className="detail-value">
                        {user.email}
                        {user.is_email_verified ? (
                          <span className="verification-badge verified">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M9 12l2 2 4-4" />
                              <circle cx="12" cy="12" r="10" />
                            </svg>
                            Verified
                          </span>
                        ) : (
                          <span className="verification-badge unverified">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <line x1="15" y1="9" x2="9" y2="15" />
                              <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                            Not Verified
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="detail-item">
                      <label className="detail-label">Phone Number</label>
                      <div className="detail-value">{user.phone_number || 'Not provided'}</div>
                    </div>

                    <div className="detail-item">
                      <label className="detail-label">Account Type</label>
                      <div className="detail-value">
                        <span className={`role-tag ${user.role}`}>
                          {user.role === 'admin' ? 'Administrator' : 'Customer'}
                        </span>
                      </div>
                    </div>

                    <div className="detail-item">
                      <label className="detail-label">Member Since</label>
                      <div className="detail-value">{formatDate(user.date_joined)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="profile-tab-content">
              <div className="content-header">
                <div className="header-text">
                  <h1>Security Settings</h1>
                  <p>Manage your account security and password</p>
                </div>
              </div>

              <div className="security-settings">
                <div className="security-item">
                  <div className="security-icon">
                    <svg
                      width="24"
                      height="24"
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
                  <div className="security-content">
                    <h3>Password</h3>
                    <p>Last changed: Never or recently</p>
                    <button className="security-action-btn">Change Password</button>
                  </div>
                </div>

                <div className="security-item">
                  <div className="security-icon">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <div className="security-content">
                    <h3>Email Verification</h3>
                    <p>
                      {user.is_email_verified
                        ? 'Your email address is verified'
                        : 'Please verify your email address'}
                    </p>
                    {!user.is_email_verified && (
                      <button className="security-action-btn">Resend Verification Email</button>
                    )}
                  </div>
                </div>

                <div className="security-item">
                  <div className="security-icon">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 12l2 2 4-4" />
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  </div>
                  <div className="security-content">
                    <h3>Login Activity</h3>
                    <p>Last login: {user.last_login ? formatDate(user.last_login) : 'Never'}</p>
                    <button className="security-action-btn">View Activity Log</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="profile-tab-content">
              <div className="content-header">
                <div className="header-text">
                  <h1>Account Activity</h1>
                  <p>Review your recent account activity and sessions</p>
                </div>
              </div>

              <div className="activity-section">
                <div className="activity-stats">
                  <div className="stat-card">
                    <div className="stat-icon">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <div className="stat-content">
                      <h3>Account Age</h3>
                      <p>
                        {Math.ceil(
                          (new Date() - new Date(user.date_joined)) / (1000 * 60 * 60 * 24)
                        )}{' '}
                        days
                      </p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M9 12l2 2 4-4" />
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    </div>
                    <div className="stat-content">
                      <h3>Account Status</h3>
                      <p className="status-active">Active</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">
                      <svg
                        width="24"
                        height="24"
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
                    <div className="stat-content">
                      <h3>Security Level</h3>
                      <p className="security-good">Good</p>
                    </div>
                  </div>
                </div>

                <div className="recent-activity">
                  <h3>Recent Activity</h3>
                  <div className="activity-list">
                    <div className="activity-item">
                      <div className="activity-icon login">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                          <polyline points="10,17 15,12 10,7" />
                          <line x1="15" y1="12" x2="3" y2="12" />
                        </svg>
                      </div>
                      <div className="activity-details">
                        <h4>Account Login</h4>
                        <p>
                          Last login:{' '}
                          {user.last_login ? formatDate(user.last_login) : 'Current session'}
                        </p>
                      </div>
                      <div className="activity-time">Today</div>
                    </div>

                    <div className="activity-item">
                      <div className="activity-icon profile">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                      <div className="activity-details">
                        <h4>Account Created</h4>
                        <p>Welcome to ShopOnline Uganda!</p>
                      </div>
                      <div className="activity-time">{formatDate(user.date_joined)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
