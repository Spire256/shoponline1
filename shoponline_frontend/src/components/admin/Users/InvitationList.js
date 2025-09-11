// src/components/admin/Users/InvitationList.js

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar,
  User,
  Send,
  Trash2,
  RefreshCw,
  AlertCircle,
  Copy
} from 'lucide-react';


const InvitationList = ({ onRefresh }) => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resendingId, setResendingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/v1/auth/invitations/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInvitations(data.results || data);
      } else {
        throw new Error('Failed to fetch invitations');
      }
    } catch (err) {
      console.error('Error fetching invitations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvitation = async (invitationId, email) => {
    try {
      setResendingId(invitationId);
      
      // Cancel old invitation first
      await fetch(`/api/v1/auth/invitations/${invitationId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });

      // Send new invitation
      const response = await fetch('/api/v1/auth/invitations/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        await fetchInvitations(); // Refresh list
        if (onRefresh) onRefresh();
      } else {
        throw new Error('Failed to resend invitation');
      }
    } catch (err) {
      console.error('Error resending invitation:', err);
      setError(err.message);
    } finally {
      setResendingId(null);
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    if (!window.confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    try {
      setDeletingId(invitationId);
      
      const response = await fetch(`/api/v1/auth/invitations/${invitationId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await fetchInvitations(); // Refresh list
        if (onRefresh) onRefresh();
      } else {
        throw new Error('Failed to cancel invitation');
      }
    } catch (err) {
      console.error('Error canceling invitation:', err);
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const copyInvitationLink = (token) => {
    const link = `${window.location.origin}/admin/register/${token}`;
    navigator.clipboard.writeText(link).then(() => {
      // Could add a toast notification here
      console.log('Invitation link copied to clipboard');
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'expired':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'accepted':
        return 'status-accepted';
      case 'expired':
        return 'status-expired';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt) => {
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="invitation-list-loading">
        <div className="loading-spinner" />
        <p>Loading invitations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="invitation-list-error">
        <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={fetchInvitations}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="invitation-list">
      <div className="invitation-list-header">
        <div className="header-content">
          <h3>Admin Invitations</h3>
          <p>Manage pending and sent admin invitations</p>
        </div>
        <button 
          onClick={fetchInvitations}
          className="btn-secondary"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {invitations.length === 0 ? (
        <div className="invitation-empty-state">
          <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3>No Invitations</h3>
          <p>No admin invitations have been sent yet.</p>
        </div>
      ) : (
        <div className="invitation-list-container">
          <div className="invitation-list-table">
            <div className="table-header">
              <div className="header-cell">Recipient</div>
              <div className="header-cell">Status</div>
              <div className="header-cell">Invited By</div>
              <div className="header-cell">Sent Date</div>
              <div className="header-cell">Expires</div>
              <div className="header-cell">Actions</div>
            </div>

            <div className="table-body">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="table-row">
                  <div className="table-cell">
                    <div className="invitation-recipient">
                      <div className="recipient-avatar">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="recipient-info">
                        <div className="recipient-email">{invitation.email}</div>
                        {invitation.invited_user && (
                          <div className="recipient-name">
                            {invitation.invited_user.first_name} {invitation.invited_user.last_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="table-cell">
                    <div className={`invitation-status ${getStatusClass(invitation.status)}`}>
                      {getStatusIcon(invitation.status)}
                      <span className="status-text">
                        {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="table-cell">
                    <div className="inviter-info">
                      <div className="inviter-name">
                        {invitation.invited_by?.first_name} {invitation.invited_by?.last_name}
                      </div>
                      <div className="inviter-email">
                        {invitation.invited_by?.email}
                      </div>
                    </div>
                  </div>

                  <div className="table-cell">
                    <div className="date-info">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{formatDate(invitation.created_at)}</span>
                    </div>
                  </div>

                  <div className="table-cell">
                    <div className={`expires-info ${isExpired(invitation.expires_at) ? 'expired' : ''}`}>
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(invitation.expires_at)}</span>
                      {isExpired(invitation.expires_at) && (
                        <span className="expired-badge">Expired</span>
                      )}
                    </div>
                  </div>

                  <div className="table-cell">
                    <div className="invitation-actions">
                      {invitation.status === 'pending' && !isExpired(invitation.expires_at) && (
                        <>
                          <button
                            onClick={() => copyInvitationLink(invitation.token)}
                            className="action-btn copy"
                            title="Copy invitation link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {(invitation.status === 'pending' || invitation.status === 'expired') && (
                        <button
                          onClick={() => handleResendInvitation(invitation.id, invitation.email)}
                          className="action-btn resend"
                          disabled={resendingId === invitation.id}
                          title="Resend invitation"
                        >
                          <Send className={`w-4 h-4 ${resendingId === invitation.id ? 'animate-pulse' : ''}`} />
                        </button>
                      )}

                      {invitation.status !== 'accepted' && (
                        <button
                          onClick={() => handleCancelInvitation(invitation.id)}
                          className="action-btn delete"
                          disabled={deletingId === invitation.id}
                          title="Cancel invitation"
                        >
                          <Trash2 className={`w-4 h-4 ${deletingId === invitation.id ? 'animate-pulse' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="invitation-summary">
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-value">{invitations.filter(i => i.status === 'pending').length}</span>
                <span className="stat-label">Pending</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{invitations.filter(i => i.status === 'accepted').length}</span>
                <span className="stat-label">Accepted</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{invitations.filter(i => i.status === 'expired').length}</span>
                <span className="stat-label">Expired</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{invitations.length}</span>
                <span className="stat-label">Total</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// CSS styles
const styles = `
/* InvitationList.css */

.invitation-list {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.08);
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.invitation-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #f1f5f9;
  background: linear-gradient(135deg, #fafafa 0%, #f8fafc 100%);
}

.header-content h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

.header-content p {
  color: #64748b;
  font-size: 0.875rem;
  margin: 0;
}

.btn-secondary {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  color: #2563eb;
  border: 2px solid #2563eb;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: #2563eb;
  color: white;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.invitation-list-loading,
.invitation-list-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.invitation-empty-state {
  text-align: center;
  padding: 60px 20px;
}

.invitation-empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.invitation-empty-state p {
  color: #64748b;
  margin: 0;
}

.invitation-list-container {
  background: white;
}

.invitation-list-table {
  overflow-x: auto;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 1.2fr 1.2fr 1fr;
  gap: 16px;
  padding: 16px 24px;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
  font-weight: 600;
  font-size: 0.75rem;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.header-cell {
  display: flex;
  align-items: center;
}

.table-body {
  background: white;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 1.2fr 1.2fr 1fr;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
  align-items: center;
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background: #fafafa;
}

.table-cell {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
}

.invitation-recipient {
  display: flex;
  align-items: center;
  gap: 12px;
}

.recipient-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #2563eb;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.recipient-info {
  flex: 1;
}

.recipient-email {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 2px;
}

.recipient-name {
  font-size: 0.75rem;
  color: #64748b;
}

.invitation-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-accepted {
  background: #d1fae5;
  color: #065f46;
}

.status-expired {
  background: #fee2e2;
  color: #991b1b;
}

.status-cancelled {
  background: #f3f4f6;
  color: #374151;
}

.inviter-info {
  display: flex;
  flex-direction: column;
}

.inviter-name {
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 2px;
}

.inviter-email {
  font-size: 0.75rem;
  color: #64748b;
}

.date-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 0.875rem;
}

.expires-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 0.875rem;
}

.expires-info.expired {
  color: #dc2626;
}

.expired-badge {
  background: #fee2e2;
  color: #dc2626;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.625rem;
  font-weight: 600;
  margin-left: 8px;
}

.invitation-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn.copy {
  background: #e0f2fe;
  color: #0891b2;
}

.action-btn.copy:hover {
  background: #0891b2;
  color: white;
}

.action-btn.resend {
  background: #dbeafe;
  color: #2563eb;
}

.action-btn.resend:hover {
  background: #2563eb;
  color: white;
}

.action-btn.delete {
  background: #fee2e2;
  color: #dc2626;
}

.action-btn.delete:hover {
  background: #dc2626;
  color: white;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.invitation-summary {
  padding: 20px 24px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
}

.summary-stats {
  display: flex;
  gap: 32px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2563eb;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .table-header,
  .table-row {
    display: none;
  }
  
  .table-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }
  
  .table-row {
    display: flex;
    flex-direction: column;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px;
    gap: 12px;
  }
  
  .table-cell {
    justify-content: space-between;
  }
  
  .table-cell::before {
    content: attr(data-label);
    font-weight: 600;
    color: #475569;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .summary-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}
`;

export default InvitationList;