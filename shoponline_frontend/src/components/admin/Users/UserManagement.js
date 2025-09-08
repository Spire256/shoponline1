import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Search, Filter, UserCheck, UserX, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import UserTable from './UserTable';
import AdminInvitation from './AdminInvitation';
import UserDetails from './UserDetails';
import { useAuth } from '../../../hooks/useAuth';
import { useNotifications } from '../../../hooks/useNotifications';
import adminAPI from '../../../services/api/adminAPI';
import invitationAPI from '../../../services/api/invitationAPI';
import apiClient, { handleApiResponse, handleApiError, buildQueryString } from '../../../services/api/apiClient';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { user: currentUser } = useAuth();
  const { showNotification } = useNotifications();

  // User management API functions (since they're not in adminAPI)
  const userAPI = {
    // Get users
    getUsers: async (params = {}) => {
      try {
        const queryString = buildQueryString(params);
        const url = queryString ? `/admin/users/?${queryString}` : '/admin/users/';
        const response = await apiClient.get(url);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Update user
    updateUser: async (userId, userData) => {
      try {
        const response = await apiClient.patch(`/admin/users/${userId}/`, userData);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // Update user status
    updateUserStatus: async (userId, statusData) => {
      try {
        const response = await apiClient.patch(`/admin/users/${userId}/`, statusData);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    }
  };

  // Extended invitation API functions
  const extendedInvitationAPI = {
    ...invitationAPI,
    
    // Resend invitation function (missing from invitationAPI)
    resendInvitation: async (invitationId) => {
      try {
        const response = await apiClient.post(`/auth/invitations/${invitationId}/resend/`);
        return handleApiResponse(response);
      } catch (error) {
        throw handleApiError(error);
      }
    }
  };

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    try {
      setError(null);
      const response = await userAPI.getUsers({
        search: searchTerm,
        role: filterRole !== 'all' ? filterRole : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
      });
      setUsers(response.data.results || response.data);
    } catch (err) {
      setError('Failed to fetch users');
      showNotification('Failed to load users', 'error');
      console.error('Error fetching users:', err);
    }
  }, [searchTerm, filterRole, filterStatus, showNotification]);

  // Fetch invitations from API
  const fetchInvitations = useCallback(async () => {
    try {
      const response = await extendedInvitationAPI.getInvitations();
      setInvitations(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching invitations:', err);
      showNotification('Failed to load invitations', 'error');
    }
  }, [showNotification]);

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchUsers(),
          fetchInvitations()
        ]);
      } catch (err) {
        setError('Failed to load user management data');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [fetchUsers, fetchInvitations]);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchUsers(),
        fetchInvitations()
      ]);
      showNotification('Data refreshed successfully', 'success');
    } catch (err) {
      showNotification('Failed to refresh data', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && user.is_active) ||
      (filterStatus === 'inactive' && !user.is_active) ||
      (filterStatus === 'verified' && user.is_email_verified) ||
      (filterStatus === 'unverified' && !user.is_email_verified);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    clients: users.filter(u => u.role === 'client').length,
    verified: users.filter(u => u.is_email_verified).length,
    active: users.filter(u => u.is_active).length,
    pendingInvitations: invitations.filter(i => i.status === 'pending').length,
  };

  // Handle user selection
  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };

  // Handle user updates
  const handleUserUpdate = async (updatedUser) => {
    try {
      const response = await userAPI.updateUser(updatedUser.id, updatedUser);
      const newUser = response.data;
      
      setUsers(users.map(user => 
        user.id === newUser.id ? newUser : user
      ));
      
      setSelectedUser(newUser);
      showNotification('User updated successfully', 'success');
    } catch (err) {
      showNotification('Failed to update user', 'error');
      console.error('Error updating user:', err);
    }
  };

  // Handle user activation/deactivation
  const handleUserStatusChange = async (userId, isActive) => {
    try {
      const response = await userAPI.updateUserStatus(userId, { is_active: isActive });
      const updatedUser = response.data;
      
      setUsers(users.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      ));
      
      if (selectedUser?.id === updatedUser.id) {
        setSelectedUser(updatedUser);
      }
      
      showNotification(
        `User ${isActive ? 'activated' : 'deactivated'} successfully`, 
        'success'
      );
    } catch (err) {
      showNotification('Failed to update user status', 'error');
      console.error('Error updating user status:', err);
    }
  };

  // Handle invitation success
  const handleInvitationSuccess = async (newInvitation) => {
    await fetchInvitations();
    showNotification('Admin invitation sent successfully', 'success');
    setShowInviteModal(false);
    setActiveTab('invitations');
  };

  // Handle invitation resend
  const handleResendInvitation = async (invitationId) => {
    try {
      await extendedInvitationAPI.resendInvitation(invitationId);
      showNotification('Invitation resent successfully', 'success');
      await fetchInvitations();
    } catch (err) {
      showNotification('Failed to resend invitation', 'error');
      console.error('Error resending invitation:', err);
    }
  };

  // Handle invitation cancel
  const handleCancelInvitation = async (invitationId) => {
    if (!window.confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    try {
      await extendedInvitationAPI.cancelInvitation(invitationId);
      showNotification('Invitation cancelled successfully', 'success');
      await fetchInvitations();
    } catch (err) {
      showNotification('Failed to cancel invitation', 'error');
      console.error('Error cancelling invitation:', err);
    }
  };

  const tabs = [
    { id: 'users', label: 'All Users', icon: Users, count: stats.total },
    { id: 'invitations', label: 'Invitations', icon: Mail, count: stats.pendingInvitations },
  ];

  if (loading) {
    return (
      <div className="user-management-loading">
        <div className="loading-spinner" />
        <p>Loading user management...</p>
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="user-management-error">
        <div className="error-content">
          <AlertCircle size={48} className="error-icon" />
          <h2>Failed to Load Users</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={handleRefresh}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <div className="header-content">
          <h1>User Management</h1>
          <p>Manage users, send admin invitations, and monitor user activity</p>
        </div>

        <div className="header-actions">
          <button 
            className="btn-secondary" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button 
            className="btn-primary" 
            onClick={() => setShowInviteModal(true)}
          >
            <Plus size={20} />
            Invite Admin
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <div className="stat-card admins">
          <div className="stat-icon">
            <UserCheck size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.admins}</h3>
            <p>Administrators</p>
          </div>
        </div>

        <div className="stat-card clients">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.clients}</h3>
            <p>Clients</p>
          </div>
        </div>

        <div className="stat-card verified">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.verified}</h3>
            <p>Verified</p>
          </div>
        </div>

        <div className="stat-card active">
          <div className="stat-icon">
            <UserCheck size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.active}</h3>
            <p>Active Users</p>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">
            <Mail size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.pendingInvitations}</h3>
            <p>Pending Invitations</p>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={handleRefresh} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="management-tabs">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={20} />
              {tab.label}
              {tab.count > 0 && (
                <span className="tab-count">{tab.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content based on active tab */}
      {activeTab === 'users' && (
        <div className="users-content">
          {/* Search and Filters */}
          <div className="search-filters">
            <div className="search-bar">
              <Search size={20} className="search-icon" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filters">
              <div className="filter-group">
                <Filter size={16} />
                <select 
                  value={filterRole} 
                  onChange={e => setFilterRole(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Administrators</option>
                  <option value="client">Clients</option>
                </select>
              </div>

              <div className="filter-group">
                <select 
                  value={filterStatus} 
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>
            </div>
          </div>

          <div className="users-layout">
            <div className="users-table-section">
              <UserTable
                users={filteredUsers}
                onUserSelect={handleUserSelect}
                selectedUser={selectedUser}
                onStatusChange={handleUserStatusChange}
                currentUser={currentUser}
                loading={refreshing}
              />
              
              {filteredUsers.length === 0 && !refreshing && (
                <div className="empty-state">
                  <Users size={48} className="empty-icon" />
                  <h3>No users found</h3>
                  <p>
                    {searchTerm || filterRole !== 'all' || filterStatus !== 'all'
                      ? 'No users match your current filters'
                      : 'No users available'
                    }
                  </p>
                </div>
              )}
            </div>

            {selectedUser && (
              <div className="user-details-section">
                <UserDetails
                  user={selectedUser}
                  onUpdate={handleUserUpdate}
                  onClose={() => setSelectedUser(null)}
                  currentUser={currentUser}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'invitations' && (
        <div className="invitations-content">
          <AdminInvitation 
            invitations={invitations}
            onInvitationSuccess={handleInvitationSuccess}
            onResendInvitation={handleResendInvitation}
            onCancelInvitation={handleCancelInvitation}
            refreshInvitations={fetchInvitations}
          />
        </div>
      )}

      {/* Invite Admin Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Send Admin Invitation</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowInviteModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <AdminInvitation
                isModal={true}
                onSuccess={handleInvitationSuccess}
                onCancel={() => setShowInviteModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;