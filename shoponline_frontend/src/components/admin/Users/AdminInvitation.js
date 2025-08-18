import React, { useState, useEffect } from 'react';
import { Send, Clock, CheckCircle, XCircle, RefreshCw, Trash2 } from 'lucide-react';
import InvitationForm from './InvitationForm';
import InvitationList from './InvitationList';

const AdminInvitation = ({ isModal = false, onSuccess }) => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(isModal);
  const [sendingInvite, setSendingInvite] = useState(false);

  // Mock invitations data - replace with actual API calls
  useEffect(() => {
    const mockInvitations = [
      {
        id: '1',
        email: 'newadmin@shoponline.com',
        status: 'pending',
        created_at: '2024-08-07T10:00:00Z',
        expires_at: '2024-08-09T10:00:00Z',
        accepted_at: null,
        invited_by_name: 'John Doe',
        invited_user_name: null,
        is_expired: false,
        is_valid: true,
      },
      {
        id: '2',
        email: 'admin2@shoponline.com',
        status: 'accepted',
        created_at: '2024-08-05T14:30:00Z',
        expires_at: '2024-08-07T14:30:00Z',
        accepted_at: '2024-08-06T09:15:00Z',
        invited_by_name: 'John Doe',
        invited_user_name: 'Mike Johnson',
        is_expired: false,
        is_valid: false,
      },
      {
        id: '3',
        email: 'expired@shoponline.com',
        status: 'expired',
        created_at: '2024-08-01T08:00:00Z',
        expires_at: '2024-08-03T08:00:00Z',
        accepted_at: null,
        invited_by_name: 'John Doe',
        invited_user_name: null,
        is_expired: true,
        is_valid: false,
      },
    ];

    setTimeout(() => {
      setInvitations(mockInvitations);
      setLoading(false);
    }, 800);
  }, []);

  const handleSendInvitation = async invitationData => {
    setSendingInvite(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newInvitation = {
        id: Date.now().toString(),
        email: invitationData.email,
        status: 'pending',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        accepted_at: null,
        invited_by_name: 'Current Admin',
        invited_user_name: null,
        is_expired: false,
        is_valid: true,
      };

      setInvitations([newInvitation, ...invitations]);

      if (isModal && onSuccess) {
        onSuccess();
      } else {
        setShowForm(false);
      }

      // Show success message
      alert(`Invitation sent successfully to ${invitationData.email}`);
    } catch (error) {
      alert('Failed to send invitation. Please try again.');
    } finally {
      setSendingInvite(false);
    }
  };

  const handleCancelInvitation = async invitationId => {
    if (!confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setInvitations(
        invitations.map(inv => (inv.id === invitationId ? { ...inv, status: 'cancelled' } : inv))
      );

      alert('Invitation cancelled successfully');
    } catch (error) {
      alert('Failed to cancel invitation');
    }
  };

  const handleResendInvitation = async invitationId => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      setInvitations(
        invitations.map(inv =>
          inv.id === invitationId
            ? {
              ...inv,
              created_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
              status: 'pending',
              is_expired: false,
              is_valid: true,
            }
            : inv
        )
      );

      alert('Invitation resent successfully');
    } catch (error) {
      alert('Failed to resend invitation');
    }
  };

  const getStatusStats = () => {
    return {
      pending: invitations.filter(inv => inv.status === 'pending').length,
      accepted: invitations.filter(inv => inv.status === 'accepted').length,
      expired: invitations.filter(inv => inv.status === 'expired').length,
      cancelled: invitations.filter(inv => inv.status === 'cancelled').length,
    };
  };

  if (loading) {
    return (
      <div className="admin-invitation-loading">
        <div className="loading-spinner" />
        <p>Loading invitations...</p>
      </div>
    );
  }

  const stats = getStatusStats();

  return (
    <div className={`admin-invitation ${isModal ? 'modal-mode' : ''}`}>
      {!isModal && (
        <>
          <div className="invitation-header">
            <div className="header-content">
              <h2>Admin Invitations</h2>
              <p>Send and manage admin invitations for the platform</p>
            </div>

            <button
              className="btn-primary"
              onClick={() => setShowForm(!showForm)}
              disabled={sendingInvite}
            >
              <Send size={20} />
              {showForm ? 'Hide Form' : 'Send Invitation'}
            </button>
          </div>

          {/* Invitation Stats */}
          <div className="invitation-stats">
            <div className="stat-item pending">
              <Clock size={20} />
              <div className="stat-info">
                <span className="count">{stats.pending}</span>
                <span className="label">Pending</span>
              </div>
            </div>

            <div className="stat-item accepted">
              <CheckCircle size={20} />
              <div className="stat-info">
                <span className="count">{stats.accepted}</span>
                <span className="label">Accepted</span>
              </div>
            </div>

            <div className="stat-item expired">
              <XCircle size={20} />
              <div className="stat-info">
                <span className="count">{stats.expired}</span>
                <span className="label">Expired</span>
              </div>
            </div>

            <div className="stat-item cancelled">
              <Trash2 size={20} />
              <div className="stat-info">
                <span className="count">{stats.cancelled}</span>
                <span className="label">Cancelled</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Invitation Form */}
      {showForm && (
        <div className="invitation-form-section">
          <InvitationForm
            onSubmit={handleSendInvitation}
            loading={sendingInvite}
            isModal={isModal}
          />
        </div>
      )}

      {/* Invitations List */}
      <div className="invitation-list-section">
        <InvitationList
          invitations={invitations}
          onCancel={handleCancelInvitation}
          onResend={handleResendInvitation}
          isModal={isModal}
        />
      </div>
    </div>
  );
};

export default AdminInvitation;
