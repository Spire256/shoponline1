// src/components/admin/Users/InvitationList.js
import React, { useState, useEffect } from 'react';
import {
  Users,
  Mail,
  Clock,
  Check,
  X,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Trash2,
} from 'lucide-react';

const InvitationList = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewInvitationModal, setShowNewInvitationModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [sendingInvitation, setSendingInvitation] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch invitations from API
  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/invitations/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invitations');
      }

      const data = await response.json();
      setInvitations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  // Send new invitation
  const handleSendInvitation = async e => {
    e.preventDefault();
    if (!newEmail.endsWith('@shoponline.com')) {
      setError('Admin invitations must use @shoponline.com email addresses');
      return;
    }

    setSendingInvitation(true);
    try {
      const response = await fetch('/api/admin/invitations/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newEmail }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.email?.[0] || 'Failed to send invitation');
      }

      await fetchInvitations();
      setShowNewInvitationModal(false);
      setNewEmail('');
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSendingInvitation(false);
    }
  };

  // Cancel invitation
  const handleCancelInvitation = async invitationId => {
    try {
      const response = await fetch(`/api/admin/invitations/${invitationId}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to cancel invitation');
      }

      await fetchInvitations();
      setShowDeleteModal(false);
      setSelectedInvitation(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Filter invitations
  const filteredInvitations = invitations.filter(invitation => {
    const matchesSearch = invitation.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invitation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Get status badge
  const getStatusBadge = invitation => {
    const statusConfig = {
      pending: {
        icon: Clock,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        label: 'Pending',
      },
      accepted: {
        icon: Check,
        color: 'bg-green-100 text-green-800 border-green-200',
        label: 'Accepted',
      },
      expired: {
        icon: AlertTriangle,
        color: 'bg-red-100 text-red-800 border-red-200',
        label: 'Expired',
      },
      cancelled: {
        icon: X,
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        label: 'Cancelled',
      },
    };

    const config = statusConfig[invitation.status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  // Format date
  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="admin-invitation-list">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading invitations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-invitation-list">
      {/* Header */}
      <div className="invitation-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="header-title">
              <Users className="w-6 h-6" />
              Admin Invitations
            </h1>
            <p className="header-subtitle">Manage admin user invitations and access control</p>
          </div>
          <button onClick={() => setShowNewInvitationModal(true)} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Send Invitation
          </button>
        </div>

        {/* Filters */}
        <div className="invitation-filters">
          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search by email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-container">
            <Filter className="filter-icon" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="error-close">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Invitations Table */}
      <div className="invitation-table-container">
        <table className="invitation-table">
          <thead>
            <tr>
              <th>Email Address</th>
              <th>Status</th>
              <th>Invited By</th>
              <th>Created</th>
              <th>Expires</th>
              <th>Accepted By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvitations.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-2">No invitations found</p>
                  <p className="text-sm text-gray-500">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Send your first admin invitation to get started'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredInvitations.map(invitation => (
                <tr key={invitation.id} className="table-row">
                  <td className="email-cell">
                    <div className="flex items-center">
                      <div className="email-avatar">{invitation.email.charAt(0).toUpperCase()}</div>
                      <span className="email-text">{invitation.email}</span>
                    </div>
                  </td>

                  <td>{getStatusBadge(invitation)}</td>

                  <td className="text-gray-900">{invitation.invited_by_name || 'N/A'}</td>

                  <td className="text-gray-600 text-sm">{formatDate(invitation.created_at)}</td>

                  <td className="text-gray-600 text-sm">
                    <div className={`${invitation.is_expired ? 'text-red-600 font-medium' : ''}`}>
                      {formatDate(invitation.expires_at)}
                      {invitation.is_expired && (
                        <span className="block text-xs text-red-500">Expired</span>
                      )}
                    </div>
                  </td>

                  <td className="text-gray-600 text-sm">
                    {invitation.invited_user_name ||
                      (invitation.status === 'accepted' ? 'Unknown' : '-')}
                  </td>

                  <td>
                    <div className="action-buttons">
                      {invitation.status === 'pending' && !invitation.is_expired && (
                        <button
                          onClick={() => {
                            setSelectedInvitation(invitation);
                            setShowDeleteModal(true);
                          }}
                          className="btn-danger-outline btn-sm"
                          title="Cancel Invitation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      <button className="btn-secondary-outline btn-sm">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Invitation Modal */}
      {showNewInvitationModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Send Admin Invitation</h3>
              <button
                onClick={() => {
                  setShowNewInvitationModal(false);
                  setNewEmail('');
                  setError(null);
                }}
                className="modal-close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendInvitation} className="modal-body">
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="admin@shoponline.com"
                  className="form-input"
                  required
                />
                <p className="form-help">Must be a valid @shoponline.com email address</p>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewInvitationModal(false);
                    setNewEmail('');
                    setError(null);
                  }}
                  className="btn-secondary"
                  disabled={sendingInvitation}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={sendingInvitation}>
                  {sendingInvitation ? (
                    <>
                      <div className="spinner-sm mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedInvitation && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Cancel Invitation</h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedInvitation(null);
                }}
                className="modal-close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="modal-body">
              <div className="confirmation-content">
                <div className="confirmation-icon">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="confirmation-text">
                  <h4>Cancel this invitation?</h4>
                  <p>
                    Are you sure you want to cancel the invitation for{' '}
                    <span className="font-medium">{selectedInvitation.email}</span>? This action
                    cannot be undone.
                  </p>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedInvitation(null);
                  }}
                  className="btn-secondary"
                >
                  Keep Invitation
                </button>
                <button
                  onClick={() => handleCancelInvitation(selectedInvitation.id)}
                  className="btn-danger"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Cancel Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvitationList;
