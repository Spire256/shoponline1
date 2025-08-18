import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Filter, UserCheck, UserX, Mail } from 'lucide-react';
import UserTable from './UserTable';
import AdminInvitation from './AdminInvitation';
import UserDetails from './UserDetails';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockUsers = [
      {
        id: '1',
        email: 'admin@shoponline.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'admin',
        is_email_verified: true,
        date_joined: '2024-01-15T10:30:00Z',
        last_login: '2024-08-08T08:15:00Z',
        is_active: true,
      },
      {
        id: '2',
        email: 'jane.client@gmail.com',
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'client',
        is_email_verified: true,
        date_joined: '2024-02-20T14:45:00Z',
        last_login: '2024-08-07T16:20:00Z',
        is_active: true,
      },
      {
        id: '3',
        email: 'mike.admin@shoponline.com',
        first_name: 'Mike',
        last_name: 'Johnson',
        role: 'admin',
        is_email_verified: false,
        date_joined: '2024-07-30T09:00:00Z',
        last_login: null,
        is_active: false,
      },
    ];

    setTimeout(() => {
      setUsers(mockUsers);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'all' || user.role === filterRole;

    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    clients: users.filter(u => u.role === 'client').length,
    verified: users.filter(u => u.is_email_verified).length,
    active: users.filter(u => u.is_active).length,
  };

  const handleUserSelect = user => {
    setSelectedUser(user);
  };

  const handleUserUpdate = updatedUser => {
    setUsers(users.map(user => (user.id === updatedUser.id ? updatedUser : user)));
  };

  const tabs = [
    { id: 'users', label: 'All Users', icon: Users },
    { id: 'invitations', label: 'Invitations', icon: Mail },
  ];

  if (loading) {
    return (
      <div className="user-management-loading">
        <div className="loading-spinner" />
        <p>Loading users...</p>
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
          <button className="btn-primary" onClick={() => setShowInviteModal(true)}>
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
            <Mail size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.verified}</h3>
            <p>Verified</p>
          </div>
        </div>
      </div>

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
                <select value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                  <option value="all">All Roles</option>
                  <option value="admin">Administrators</option>
                  <option value="client">Clients</option>
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
              />
            </div>

            {selectedUser && (
              <div className="user-details-section">
                <UserDetails
                  user={selectedUser}
                  onUpdate={handleUserUpdate}
                  onClose={() => setSelectedUser(null)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'invitations' && (
        <div className="invitations-content">
          <AdminInvitation />
        </div>
      )}

      {/* Invite Admin Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Quick Admin Invitation</h3>
              <button className="modal-close" onClick={() => setShowInviteModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <AdminInvitation
                isModal={true}
                onSuccess={() => {
                  setShowInviteModal(false);
                  setActiveTab('invitations');
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
