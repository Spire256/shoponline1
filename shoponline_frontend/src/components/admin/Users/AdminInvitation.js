import React, { useState, useEffect } from 'react';
import { Mail, Send, Trash2, Clock, CheckCircle, XCircle, AlertCircle, Copy, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import invitationAPI from '../../../services/api/invitationAPI';

const AdminInvitation = ({ isModal = false, onSuccess = () => {} }) => {
  const { user, getAuthHeader } = useAuth();

  const [invitationData, setInvitationData] = useState({
    email: ''
  });
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingInvitations, setFetchingInvitations] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    setFetchingInvitations(true);
    try {
      const data = await invitationAPI.getInvitations();
      // Format invitations using the API utility function
      const formattedInvitations = (data.results || data).map(invitation => 
        invitationAPI.formatInvitationData(invitation)
      );
      setInvitations(formattedInvitations);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      showNotification('Failed to load invitations', 'error');
    } finally {
      setFetchingInvitations(false);
    }
  };

  const showNotification = (message, type) => {
    // Simple notification implementation
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.3s ease;
      ${type === 'success' ? 'background: #10b981;' : 'background: #ef4444;'}
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.style.opacity = '1', 10);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInvitationData(prev => ({ ...prev, [name]: value }));
   
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!invitationData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!invitationAPI.validateEmail(invitationData.email)) {
      newErrors.email = 'Admin email must end with @shoponline.com';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invitationData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Check if email already has pending invitation using formatted data
    const existingInvitation = invitations.find(
      inv => inv.email === invitationData.email && inv.status === 'pending' && !inv.isExpired
    );
    if (existingInvitation) {
      newErrors.email = 'A pending invitation already exists for this email';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
   
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await invitationAPI.createInvitation({
        email: invitationData.email.trim()
      });
      
      showNotification('Admin invitation sent successfully', 'success');
      setInvitationData({ email: '' });
      await fetchInvitations();
       
      if (isModal) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      const errorMessage = error.message || 'Failed to send invitation';
      
      // Handle specific backend validation errors
      if (error.errors && error.errors.email) {
        setErrors({ email: Array.isArray(error.errors.email) ? error.errors.email[0] : error.errors.email });
      } else {
        showNotification(errorMessage, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    if (!window.confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }
    
    try {
      // Use cancelInvitation instead of deleteInvitation to match API
      await invitationAPI.cancelInvitation(invitationId);
      showNotification('Invitation cancelled successfully', 'success');
      await fetchInvitations();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      showNotification('Failed to cancel invitation', 'error');
    }
  };

  const copyInvitationLink = (token) => {
    const invitationUrl = `${window.location.origin}/auth/register/admin?token=${token}`;
    navigator.clipboard.writeText(invitationUrl).then(() => {
      showNotification('Invitation link copied to clipboard', 'success');
    }).catch(() => {
      showNotification('Failed to copy invitation link', 'error');
    });
  };

  const formatDate = (dateObj) => {
    // Handle both Date objects and date strings
    const date = dateObj instanceof Date ? dateObj : new Date(dateObj);
    return date.toLocaleDateString('en-UG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (invitation) => {
    if (invitation.status === 'accepted') {
      return (
        <span className="status-badge success">
          <CheckCircle className="w-3 h-3" />
          Accepted
        </span>
      );
    } else if (invitation.status === 'cancelled') {
      return (
        <span className="status-badge cancelled">
          <XCircle className="w-3 h-3" />
          Cancelled
        </span>
      );
    } else if (invitation.isExpired) {
      return (
        <span className="status-badge expired">
          <AlertCircle className="w-3 h-3" />
          Expired
        </span>
      );
    } else {
      return (
        <span className="status-badge pending">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    }
  };

  const getTimeRemaining = (expiresAt) => {
    // Handle both Date objects and date strings
    const now = new Date();
    const expiry = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
    const timeLeft = expiry - now;
   
    if (timeLeft <= 0) return 'Expired';
   
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
   
    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    } else {
      return `${minutes}m left`;
    }
  };

  return (
    <div className="admin-invitation-container">
      {!isModal && (
        <div className="invitation-header">
          <div className="header-content">
            <h2>Admin Invitations</h2>
            <p>Send invitations to new admin users</p>
          </div>
        </div>
      )}
      
      {/* Send Invitation Form */}
      <div className="invitation-form-card">
        <div className="card-header">
          <h3>
            <Mail className="w-5 h-5 text-blue-600" />
            Send Admin Invitation
          </h3>
        </div>
        <div className="invitation-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Admin Email Address
            </label>
            <div className="form-input-wrapper">
              <Mail className="input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                value={invitationData.email}
                onChange={handleInputChange}
                placeholder="admin@shoponline.com"
                className={`form-input ${errors.email ? 'error' : ''}`}
                disabled={loading}
              />
            </div>
            {errors.email && (
              <div className="error-message">
                <AlertCircle className="w-4 h-4" />
                {errors.email}
              </div>
            )}
            <div className="form-help">
              Only email addresses ending with @shoponline.com are allowed
            </div>
          </div>
          <div className="form-actions">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? (
                <div className="spinner" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {loading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Invitations List */}
      <div className="invitations-list-card">
        <div className="card-header">
          <h3>Sent Invitations</h3>
          <button
            onClick={fetchInvitations}
            disabled={fetchingInvitations}
            className="btn btn-outline-primary btn-sm"
          >
            {fetchingInvitations ? (
              <div className="spinner-sm" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </button>
        </div>
        
        {fetchingInvitations ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading invitations...</p>
          </div>
        ) : invitations.length === 0 ? (
          <div className="empty-state">
            <Mail className="w-12 h-12 text-gray-300" />
            <h3>No invitations sent yet</h3>
            <p>Send your first admin invitation using the form above</p>
          </div>
        ) : (
          <div className="invitations-table">
            <div className="table-header">
              <div>Email</div>
              <div>Status</div>
              <div>Invited By</div>
              <div>Sent Date</div>
              <div>Expires</div>
              <div>Actions</div>
            </div>
            <div className="table-body">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="table-row">
                  <div className="invitation-email">
                    <div className="email-address">{invitation.email}</div>
                  </div>
                  <div className="invitation-status">
                    {getStatusBadge(invitation)}
                  </div>
                  <div className="invited-by">
                    <div className="inviter-name">
                      {invitation.invitedBy || 'Unknown'}
                    </div>
                  </div>
                  <div className="sent-date">
                    {formatDate(invitation.createdAt)}
                  </div>
                  <div className="expires-info">
                    <div className="expires-date">
                      {formatDate(invitation.expiresAt)}
                    </div>
                    {invitation.status === 'pending' && !invitation.isExpired && (
                      <div className="time-remaining">
                        {getTimeRemaining(invitation.expiresAt)}
                      </div>
                    )}
                  </div>
                  <div className="invitation-actions">
                    {invitation.status === 'pending' && invitation.isValid && (
                      <button
                        onClick={() => copyInvitationLink(invitation.token)}
                        className="action-btn copy"
                        title="Copy invitation link"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                    {invitation.status === 'pending' && (
                      <button
                        onClick={() => handleCancelInvitation(invitation.id)}
                        className="action-btn danger"
                        title="Cancel invitation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .admin-invitation-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
          background: #f8fafc;
          min-height: 100vh;
        }

        .invitation-header {
          margin-bottom: 32px;
        }

        .header-content h2 {
          font-size: 2rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 8px;
        }

        .header-content p {
          color: #64748b;
          font-size: 1.125rem;
        }

        .invitation-form-card,
        .invitations-list-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          margin-bottom: 24px;
        }

        .card-header {
          padding: 24px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .card-header h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
        }

        .invitation-form {
          padding: 24px;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
        }

        .form-input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          color: #9ca3af;
        }

        .form-input {
          width: 100%;
          padding: 12px 12px 12px 40px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.2s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .form-input.error {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        .form-input:disabled {
          background-color: #f9fafb;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #ef4444;
          font-size: 0.875rem;
          margin-top: 8px;
        }

        .form-help {
          font-size: 0.875rem;
          color: #6b7280;
          margin-top: 8px;
        }

        .form-actions {
          display: flex;
          gap: 12px;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          text-decoration: none;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          color: white;
          box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);
        }

        .btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px -6px rgba(37, 99, 235, 0.4);
        }

        .btn-outline-primary {
          background: white;
          color: #2563eb;
          border: 2px solid #2563eb;
        }

        .btn-outline-primary:hover:not(:disabled) {
          background: #2563eb;
          color: white;
        }

        .btn-sm {
          padding: 8px 16px;
          font-size: 0.8125rem;
        }

        .loading-state,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: #64748b;
        }

        .empty-state h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e293b;
          margin: 16px 0 8px 0;
        }

        .empty-state p {
          color: #64748b;
          margin: 0;
        }

        .invitations-table {
          overflow-x: auto;
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 1fr 2fr 1.5fr 1.5fr 1fr;
          gap: 16px;
          padding: 16px 24px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .table-body {
          max-height: 500px;
          overflow-y: auto;
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 2fr 1.5fr 1.5fr 1fr;
          gap: 16px;
          padding: 16px 24px;
          border-bottom: 1px solid #f1f5f9;
          align-items: center;
          transition: background-color 0.2s ease;
        }

        .table-row:hover {
          background: #f8fafc;
        }

        .invitation-email .email-address {
          font-weight: 500;
          color: #1e293b;
        }

        .invited-by .inviter-name {
          font-weight: 500;
          color: #1e293b;
          font-size: 0.875rem;
        }

        .sent-date,
        .expires-info {
          font-size: 0.875rem;
          color: #64748b;
        }

        .expires-date {
          color: #1e293b;
          font-weight: 500;
        }

        .time-remaining {
          color: #f59e0b;
          font-size: 0.75rem;
          margin-top: 2px;
          font-weight: 500;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: capitalize;
        }

        .status-badge.success {
          background: #dcfce7;
          color: #166534;
        }

        .status-badge.pending {
          background: #fef3c7;
          color: #92400e;
        }

        .status-badge.cancelled {
          background: #fee2e2;
          color: #991b1b;
        }

        .status-badge.expired {
          background: #f3f4f6;
          color: #4b5563;
        }

        .invitation-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          padding: 6px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-btn.copy {
          background: #e0f2fe;
          color: #0891b2;
        }

        .action-btn.copy:hover {
          background: #0891b2;
          color: white;
        }

        .action-btn.danger {
          background: #fee2e2;
          color: #dc2626;
        }

        .action-btn.danger:hover {
          background: #dc2626;
          color: white;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #ffffff;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .spinner-sm {
          width: 12px;
          height: 12px;
          border: 2px solid #2563eb;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .notification {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 24px;
          border-radius: 8px;
          color: white;
          font-weight: 500;
          z-index: 1000;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .notification.success {
          background: #10b981;
        }

        .notification.error {
          background: #ef4444;
        }
      `}</style>
    </div>
  );
};

export default AdminInvitation;