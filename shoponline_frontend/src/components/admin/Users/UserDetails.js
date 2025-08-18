import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Users,
  Activity,
  CheckCircle,
  XCircle,
  Edit,
  Save,
  Ban,
  UserCheck,
  Eye,
  EyeOff,
} from 'lucide-react';

const UserDetails = ({ user, onUpdate, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    phone_number: user.phone_number || '',
    is_active: user.is_active,
  });
  const [saving, setSaving] = useState(false);

  const handleInputChange = e => {
    const { name, value, type, checked } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const updatedUser = { ...user, ...editData };
      onUpdate(updatedUser);
      setIsEditing(false);

      alert('User updated successfully!');
    } catch (error) {
      alert('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      first_name: user.first_name,
      last_name: user.last_name,
      phone_number: user.phone_number || '',
      is_active: user.is_active,
    });
    setIsEditing(false);
  };

  const formatDate = dateString => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleIcon = role => {
    return role === 'admin' ? (
      <Shield size={20} className="role-icon admin" />
    ) : (
      <Users size={20} className="role-icon client" />
    );
  };

  const getAccountAge = joinDate => {
    const now = new Date();
    const joined = new Date(joinDate);
    const diffInDays = Math.floor((now - joined) / (1000 * 60 * 60 * 24));

    if (diffInDays < 30) return `${diffInDays} days`;

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''}`;

    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} year${diffInYears > 1 ? 's' : ''}`;
  };

  return (
    <div className="user-details-panel">
      <div className="panel-header">
        <div className="header-content">
          <h3>User Details</h3>
          <p>View and manage user information</p>
        </div>

        <div className="header-actions">
          {!isEditing ? (
            <button
              className="btn-secondary"
              onClick={() => setIsEditing(true)}
            >
              <Edit size={16} />
              Edit
            </button>
          ) : (
            <div className="edit-actions">
              <button
                className="btn-secondary"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="loading-spinner small" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save
                  </>
                )}
              </button>
            </div>
          )}

          <button
            className="close-button"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="panel-content">
        {/* User Avatar and Basic Info */}
        <div className="user-profile-section">
          <div className="profile-avatar">
            {user.profile_image ? (
              <img src={user.profile_image} alt={`${user.first_name} ${user.last_name}`} />
            ) : (
              <div className="avatar-placeholder large">
                {user.first_name[0]}
                {user.last_name[0]}
              </div>
            )}
          </div>

          <div className="profile-info">
            {!isEditing ? (
              <>
                <h2>
                  {user.first_name} {user.last_name}
                </h2>
                <p className="user-email">{user.email}</p>
              </>
            ) : (
              <div className="edit-fields">
                <div className="name-fields">
                  <input
                    type="text"
                    name="first_name"
                    value={editData.first_name}
                    onChange={handleInputChange}
                    placeholder="First Name"
                    className="form-input"
                  />
                  <input
                    type="text"
                    name="last_name"
                    value={editData.last_name}
                    onChange={handleInputChange}
                    placeholder="Last Name"
                    className="form-input"
                  />
                </div>
                <p className="user-email">{user.email}</p>
              </div>
            )}

            <div className="role-badge-large">
              {getRoleIcon(user.role)}
              <span>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
            </div>
          </div>
        </div>

        {/* Account Status */}
        <div className="details-section">
          <h4>Account Status</h4>
          <div className="status-grid">
            <div className="status-item">
              <div className="status-indicator">
                {user.is_active ? (
                  <CheckCircle size={20} className="active" />
                ) : (
                  <XCircle size={20} className="inactive" />
                )}
              </div>
              <div className="status-info">
                <span className="status-label">Account Status</span>
                {!isEditing ? (
                  <span className={`status-value ${user.is_active ? 'active' : 'inactive'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                ) : (
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={editData.is_active}
                      onChange={handleInputChange}
                    />
                    <span>Active Account</span>
                  </label>
                )}
              </div>
            </div>

            <div className="status-item">
              <div className="status-indicator">
                {user.is_email_verified ? (
                  <CheckCircle size={20} className="verified" />
                ) : (
                  <XCircle size={20} className="unverified" />
                )}
              </div>
              <div className="status-info">
                <span className="status-label">Email Verification</span>
                <span
                  className={`status-value ${user.is_email_verified ? 'verified' : 'unverified'}`}
                >
                  {user.is_email_verified ? 'Verified' : 'Not Verified'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="details-section">
          <h4>Contact Information</h4>
          <div className="contact-info">
            <div className="contact-item">
              <Mail size={18} />
              <div className="contact-details">
                <span className="label">Email Address</span>
                <span className="value">{user.email}</span>
              </div>
            </div>

            <div className="contact-item">
              <Phone size={18} />
              <div className="contact-details">
                <span className="label">Phone Number</span>
                {!isEditing ? (
                  <span className="value">{user.phone_number || 'Not provided'}</span>
                ) : (
                  <input
                    type="tel"
                    name="phone_number"
                    value={editData.phone_number}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                    className="form-input inline"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Account Activity */}
        <div className="details-section">
          <h4>Account Activity</h4>
          <div className="activity-info">
            <div className="activity-item">
              <Calendar size={18} />
              <div className="activity-details">
                <span className="label">Member Since</span>
                <span className="value">{formatDate(user.date_joined)}</span>
                <span className="sub-value">({getAccountAge(user.date_joined)} ago)</span>
              </div>
            </div>

            <div className="activity-item">
              <Activity size={18} />
              <div className="activity-details">
                <span className="label">Last Login</span>
                <span className="value">{formatDate(user.last_login)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {!isEditing && (
          <div className="details-section">
            <h4>Quick Actions</h4>
            <div className="quick-actions">
              <button className="action-button">
                <Mail size={16} />
                Send Email
              </button>

              {!user.is_email_verified && (
                <button className="action-button">
                  <CheckCircle size={16} />
                  Verify Email
                </button>
              )}

              <button className={`action-button ${user.is_active ? 'danger' : 'success'}`}>
                {user.is_active ? (
                  <>
                    <Ban size={16} />
                    Deactivate Account
                  </>
                ) : (
                  <>
                    <UserCheck size={16} />
                    Activate Account
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetails;