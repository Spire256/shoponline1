import React, { useState, useEffect } from 'react';
import { Mail, Send, Users, Clock, Check, X, AlertCircle, Copy } from 'lucide-react';
import { useNotifications } from '../../../hooks/useNotifications';

const InvitationForm = ({ onInvitationSent, onClose }) => {
  const { addNotification } = useNotifications();
  const [formData, setFormData] = useState({
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/auth/invitations/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email address is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (!formData.email.endsWith('@shoponline.com')) {
      newErrors.email = 'Admin email must end with @shoponline.com';
    }
    const existingInvitation = invitations.find(
      inv => inv.email === formData.email && inv.status === 'pending'
    );
    if (existingInvitation) {
      newErrors.email = 'This email already has a pending invitation';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/v1/auth/invitations/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          message: formData.message || undefined
        }),
      });
      const data = await response.json();
      if (response.ok) {
        addNotification({
          type: 'success',
          message: `Admin invitation sent successfully to ${formData.email}`
        });
        setFormData({ email: '', message: '' });
        fetchInvitations();
        if (onInvitationSent) {
          onInvitationSent(data);
        }
      } else {
        setErrors({ submit: data.error || 'Failed to send invitation' });
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    if (!window.confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }
    try {
      const response = await fetch(`/api/v1/auth/invitations/${invitationId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        addNotification({
          type: 'success',
          message: 'Invitation cancelled successfully'
        });
        fetchInvitations();
      } else {
        const data = await response.json();
        addNotification({
          type: 'error',
          message: data.error || 'Failed to cancel invitation'
        });
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      addNotification({
        type: 'error',
        message: 'Network error. Please try again.'
      });
    }
  };

  const copyInvitationLink = (token) => {
    const invitationUrl = `${window.location.origin}/admin/register/${token}`;
    navigator.clipboard.writeText(invitationUrl);
    addNotification({
      type: 'success',
      message: 'Invitation link copied to clipboard'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'accepted':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'accepted':
        return <Check className="w-4 h-4" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4" />;
      case 'cancelled':
        return <X className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="admin-invitation-container">
      <div className="invitation-header">
        <div className="header-content">
          <div className="header-icon">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Admin Invitations</h2>
            <p className="text-gray-600 mt-1">Send invitations to new administrators</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="close-button"
            aria-label="Close invitation form"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>
      <div className="invitation-content">
        <div className="invitation-form-section">
          <div className="form-card">
            <div className="form-header">
              <Mail className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Send New Invitation</h3>
            </div>
            <form onSubmit={handleSubmit} className="invitation-form">
              {errors.submit && (
                <div className="error-alert">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span>{errors.submit}</span>
                </div>
              )}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Admin Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="admin@shoponline.com"
                  value={formData.email}
                  onChange={handleInputChange}
                />
                {errors.email && (
                  <p className="error-message">{errors.email}</p>
                )}
                <p className="form-help-text">
                  Email must end with @shoponline.com for admin access
                </p>
              </div>
              <div className="form-group">
                <label htmlFor="message" className="form-label">
                  Custom Message (Optional)
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={3}
                  className="form-textarea"
                  placeholder="Add a personal message to the invitation email..."
                  value={formData.message}
                  onChange={handleInputChange}
                />
                <p className="form-help-text">
                  This message will be included in the invitation email
                </p>
              </div>
              <div className="form-actions">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="submit-button"
                >
                  {isSubmitting ? (
                    <div className="button-loading">
                      <div className="spinner" />
                      Sending...
                    </div>
                  ) : (
                    <div className="button-content">
                      <Send className="w-5 h-5" />
                      Send Invitation
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        <div className="invitations-list-section">
          <div className="list-header">
            <h3 className="text-lg font-semibold text-gray-900">Recent Invitations</h3>
            <span className="invitation-count">
              {invitations.length} total
            </span>
          </div>
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading invitations...</p>
            </div>
          ) : invitations.length === 0 ? (
            <div className="empty-state">
              <Mail className="w-12 h-12 text-gray-400" />
              <h4>No Invitations Sent</h4>
              <p>Start by sending your first admin invitation above.</p>
            </div>
          ) : (
            <div className="invitations-list">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="invitation-item">
                  <div className="invitation-info">
                    <div className="invitation-email">
                      {invitation.email}
                    </div>
                    <div className="invitation-meta">
                      <span>Invited on {new Date(invitation.created_at).toLocaleDateString()}</span>
                      {invitation.expires_at && (
                        <span className="expiry-info">
                          Expires on {new Date(invitation.expires_at).toLocaleDateString()}
                        </span>
                      )}
                      {invitation.invited_by_name && (
                        <span>by {invitation.invited_by_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="invitation-status">
                    <span className={`status-badge ${getStatusColor(invitation.status)}`}>
                      {getStatusIcon(invitation.status)}
                      {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                    </span>
                  </div>
                  <div className="invitation-actions">
                    {invitation.status === 'pending' && (
                      <>
                        <button
                          onClick={() => copyInvitationLink(invitation.token)}
                          className="action-button secondary"
                          title="Copy invitation link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCancelInvitation(invitation.id)}
                          className="action-button danger"
                          title="Cancel invitation"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        .admin-invitation-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .invitation-header {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 24px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .header-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .header-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .close-button {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .close-button:hover {
          background-color: #f1f5f9;
          color: #475569;
        }
        .invitation-content {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .form-card {
          background: #fafafa;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
        }
        .form-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        .invitation-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .error-alert {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #dc2626;
          font-size: 14px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-label {
          font-weight: 500;
          color: #374151;
          font-size: 14px;
        }
        .form-input {
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s ease;
        }
        .form-input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        .form-input.error {
          border-color: #dc2626;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
        }
        .form-textarea {
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          resize: vertical;
          transition: all 0.2s ease;
        }
        .form-textarea:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        .form-help-text {
          font-size: 12px;
          color: #6b7280;
        }
        .error-message {
          font-size: 12px;
          color: #dc2626;
          margin: 0;
        }
        .form-actions {
          margin-top: 8px;
        }
        .submit-button {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 140px;
        }
        .submit-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
        }
        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }
        .button-loading {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .button-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .invitation-count {
          background: #f1f5f9;
          color: #475569;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px;
          color: #6b7280;
        }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px;
          text-align: center;
          color: #6b7280;
        }
        .empty-state h4 {
          margin: 16px 0 8px;
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }
        .invitations-list {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }
        .invitation-item {
          display: flex;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #f1f5f9;
          background: white;
          transition: all 0.2s ease;
        }
        .invitation-item:last-child {
          border-bottom: none;
        }
        .invitation-item:hover {
          background: #fafafa;
        }
        .invitation-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .invitation-email {
          font-weight: 500;
          color: #1f2937;
        }
        .invitation-meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #6b7280;
        }
        .expiry-info {
          color: #f59e0b;
        }
        .invitation-status {
          margin-right: 16px;
        }
        .status-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          border: 1px solid;
          text-transform: capitalize;
        }
        .invitation-actions {
          display: flex;
          gap: 8px;
        }
        .action-button {
          padding: 6px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .action-button.secondary {
          color: #6b7280;
        }
        .action-button.secondary:hover {
          background: #f9fafb;
          color: #374151;
          border-color: #9ca3af;
        }
        .action-button.danger {
          color: #dc2626;
          border-color: #fecaca;
        }
        .action-button.danger:hover {
          background: #fef2f2;
          border-color: #fca5a5;
        }
        @media (max-width: 768px) {
          .admin-invitation-container {
            margin: 16px;
            border-radius: 8px;
          }
          .invitation-header {
            padding: 16px;
          }
          .header-content {
            gap: 12px;
          }
          .header-icon {
            width: 40px;
            height: 40px;
          }
          .invitation-content {
            padding: 16px;
            gap: 24px;
          }
          .form-card {
            padding: 16px;
          }
          .invitation-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .invitation-status {
            margin-right: 0;
          }
          .invitation-actions {
            width: 100%;
            justify-content: flex-end;
          }
          .invitation-meta {
            flex-direction: column;
            gap: 4px;
          }
        }
      `}</style>
    </div>
  );
};

export default InvitationForm;