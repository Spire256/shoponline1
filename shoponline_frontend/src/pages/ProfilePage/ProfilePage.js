import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAPI } from '../../hooks/useAPI';
import AccountInfo from './AccountInfo';
import OrderHistoryTab from './OrderHistoryTab';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { apiCall, loading, error } = useAPI();
  const [activeTab, setActiveTab] = useState('account');
  const [profileData, setProfileData] = useState(null);
  const [orderSummary, setOrderSummary] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // Fetch user profile
        const profileResponse = await apiCall('/api/accounts/profile/', 'GET');
        setProfileData(profileResponse.data);

        // Fetch order summary
        const summaryResponse = await apiCall('/api/orders/customer-summary/', 'GET');
        setOrderSummary(summaryResponse.data);
      } catch (err) {
        console.error('Failed to fetch profile data:', err);
      }
    };

    if (user) {
      fetchProfileData();
    }
  }, [user, apiCall]);

  const handleUpdateProfile = async updatedData => {
    try {
      const response = await apiCall('/api/accounts/profile/', 'PATCH', updatedData);
      setProfileData(response.data);
      updateUser(response.data);
      return { success: true, message: 'Profile updated successfully' };
    } catch (err) {
      return { success: false, message: err.message || 'Failed to update profile' };
    }
  };

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-error">
            <h2>Please log in to access your profile</h2>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'account', label: 'Account Information', icon: '👤' },
    { id: 'orders', label: 'Order History', icon: '📦' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar">
            {profileData?.profile_image ? (
              <img src={profileData.profile_image} alt="Profile" />
            ) : (
              <div className="avatar-placeholder">
                {user.first_name?.charAt(0)}
                {user.last_name?.charAt(0)}
              </div>
            )}
          </div>
          <div className="profile-info">
            <h1>{user.full_name || `${user.first_name} ${user.last_name}`}</h1>
            <p className="profile-email">{user.email}</p>
            <div className="profile-stats">
              {orderSummary && (
                <>
                  <div className="stat-item">
                    <span className="stat-value">{orderSummary.total_orders}</span>
                    <span className="stat-label">Total Orders</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">
                      UGX {orderSummary.total_spent?.toLocaleString()}
                    </span>
                    <span className="stat-label">Total Spent</span>
                  </div>
                  {orderSummary.total_savings > 0 && (
                    <div className="stat-item">
                      <span className="stat-value savings">
                        UGX {orderSummary.total_savings?.toLocaleString()}
                      </span>
                      <span className="stat-label">Total Savings</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="profile-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="profile-content">
          {loading && (
            <div className="loading-spinner">
              <div className="spinner" />
              <p>Loading profile data...</p>
            </div>
          )}

          {error && (
            <div className="error-message">
              <p>Error loading profile data: {error}</p>
            </div>
          )}

          {activeTab === 'account' && (
            <AccountInfo
              profileData={profileData}
              onUpdate={handleUpdateProfile}
              loading={loading}
            />
          )}

          {activeTab === 'orders' && <OrderHistoryTab orderSummary={orderSummary} user={user} />}

          {activeTab === 'settings' && (
            <div className="settings-tab">
              <div className="settings-section">
                <h3>Account Settings</h3>
                <div className="settings-items">
                  <div className="settings-item">
                    <div className="settings-info">
                      <h4>Email Notifications</h4>
                      <p>Receive email updates about your orders and account</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                  <div className="settings-item">
                    <div className="settings-info">
                      <h4>SMS Notifications</h4>
                      <p>Get SMS updates for order status changes</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                  <div className="settings-item">
                    <div className="settings-info">
                      <h4>Marketing Communications</h4>
                      <p>Receive promotional offers and flash sale notifications</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>Privacy & Security</h3>
                <div className="settings-actions">
                  <button className="settings-button secondary">Change Password</button>
                  <button className="settings-button secondary">Download My Data</button>
                  <button className="settings-button danger">Delete Account</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
