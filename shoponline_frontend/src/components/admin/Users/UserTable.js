import React, { useState } from 'react';
import {
  Users,
  Shield,
  CheckCircle,
  XCircle,
  Mail,
  Calendar,
  Activity,
  MoreVertical,
  Eye,
  Edit,
  Ban,
  UserCheck,
} from 'lucide-react';

const UserTable = ({ users, onUserSelect, selectedUser }) => {
  const [activeDropdown, setActiveDropdown] = useState(null);

  const getRoleIcon = role => {
    return role === 'admin' ? (
      <Shield size={16} className="role-icon admin" />
    ) : (
      <Users size={16} className="role-icon client" />
    );
  };

  const getRoleBadge = role => {
    return (
      <span className={`role-badge ${role}`}>
        {getRoleIcon(role)}
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const getStatusIndicator = user => {
    if (!user.is_active) {
      return <span className="status-indicator inactive">Inactive</span>;
    }

    if (!user.is_email_verified) {
      return <span className="status-indicator unverified">Unverified</span>;
    }

    return <span className="status-indicator active">Active</span>;
  };

  const getLastActivity = lastLogin => {
    if (!lastLogin) return 'Never';

    const now = new Date();
    const loginDate = new Date(lastLogin);
    const diffInHours = Math.floor((now - loginDate) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;

    return loginDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatJoinDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleDropdownToggle = userId => {
    setActiveDropdown(activeDropdown === userId ? null : userId);
  };

  const handleUserAction = (action, user) => {
    setActiveDropdown(null);

    switch (action) {
      case 'view':
        onUserSelect(user);
        break;
      case 'edit':
        // Handle edit action
        console.log('Edit user:', user);
        break;
      case 'toggle-status':
        // Handle status toggle
        console.log('Toggle status for:', user);
        break;
      case 'verify-email':
        // Handle email verification
        console.log('Verify email for:', user);
        break;
    }
  };

  if (users.length === 0) {
    return (
      <div className="user-table-empty">
        <Users size={48} />
        <h3>No Users Found</h3>
        <p>Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="user-table-container">
      <div className="table-header">
        <h3>Users ({users.length})</h3>
        <p>Click on a user to view detailed information</p>
      </div>

      <div className="user-table">
        <div className="table-header-row">
          <div className="table-cell header">User</div>
          <div className="table-cell header">Role</div>
          <div className="table-cell header">Status</div>
          <div className="table-cell header">Joined</div>
          <div className="table-cell header">Last Active</div>
          <div className="table-cell header">Actions</div>
        </div>

        {users.map(user => (
          <div
            key={user.id}
            className={`table-row ${selectedUser?.id === user.id ? 'selected' : ''}`}
            onClick={() => onUserSelect(user)}
          >
            <div className="table-cell user-info">
              <div className="user-avatar">
                {user.profile_image ? (
                  <img src={user.profile_image} alt={user.first_name} />
                ) : (
                  <div className="avatar-placeholder">
                    {user.first_name[0]}
                    {user.last_name[0]}
                  </div>
                )}
              </div>
              <div className="user-details">
                <div className="user-name">
                  {user.first_name} {user.last_name}
                </div>
                <div className="user-email">
                  <Mail size={14} />
                  {user.email}
                </div>
              </div>
            </div>

            <div className="table-cell">{getRoleBadge(user.role)}</div>

            <div className="table-cell">
              <div className="status-column">
                {getStatusIndicator(user)}
                <div className="verification-indicators">
                  {user.is_email_verified ? (
                    <CheckCircle size={14} className="verified" title="Email verified" />
                  ) : (
                    <XCircle size={14} className="unverified" title="Email not verified" />
                  )}
                </div>
              </div>
            </div>

            <div className="table-cell">
              <div className="date-info">
                <Calendar size={14} />
                {formatJoinDate(user.date_joined)}
              </div>
            </div>

            <div className="table-cell">
              <div className="activity-info">
                <Activity size={14} />
                {getLastActivity(user.last_login)}
              </div>
            </div>

            <div className="table-cell actions-cell" onClick={e => e.stopPropagation()}>
              <div className="dropdown-container">
                <button className="dropdown-trigger" onClick={() => handleDropdownToggle(user.id)}>
                  <MoreVertical size={16} />
                </button>

                {activeDropdown === user.id && (
                  <div className="dropdown-menu">
                    <button
                      className="dropdown-item"
                      onClick={() => handleUserAction('view', user)}
                    >
                      <Eye size={16} />
                      View Details
                    </button>

                    <button
                      className="dropdown-item"
                      onClick={() => handleUserAction('edit', user)}
                    >
                      <Edit size={16} />
                      Edit User
                    </button>

                    {!user.is_email_verified && (
                      <button
                        className="dropdown-item"
                        onClick={() => handleUserAction('verify-email', user)}
                      >
                        <CheckCircle size={16} />
                        Verify Email
                      </button>
                    )}

                    <div className="dropdown-divider" />

                    <button
                      className={`dropdown-item ${user.is_active ? 'danger' : 'success'}`}
                      onClick={() => handleUserAction('toggle-status', user)}
                    >
                      {user.is_active ? (
                        <>
                          <Ban size={16} />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck size={16} />
                          Activate
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="table-footer">
        <p>
          Showing {users.length} user{users.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
};

export default UserTable;