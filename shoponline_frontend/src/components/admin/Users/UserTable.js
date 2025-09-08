import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  CheckCircle, 
  XCircle,
  MoreVertical,
  Edit,
  Trash2,
  UserCheck
} from 'lucide-react';

const UserTable = ({ 
  users, 
  onUserSelect, 
  selectedUser, 
  loading = false,
  onUserUpdate,
  onUserDelete,
  onUserStatusToggle 
}) => {
  const [actionMenuOpen, setActionMenuOpen] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-UG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadge = (role) => {
    const roleStyles = {
      admin: 'bg-blue-100 text-blue-800 border-blue-200',
      client: 'bg-green-100 text-green-800 border-green-200'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${roleStyles[role] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {role === 'admin' ? (
          <>
            <Shield className="w-3 h-3 mr-1" />
            Administrator
          </>
        ) : (
          <>
            <User className="w-3 h-3 mr-1" />
            Client
          </>
        )}
      </span>
    );
  };

  const getStatusBadge = (user) => {
    if (!user.is_active) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Inactive
        </span>
      );
    }

    if (!user.is_email_verified) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
          <Mail className="w-3 h-3 mr-1" />
          Unverified
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </span>
    );
  };

  const handleActionClick = (action, user) => {
    setActionMenuOpen(null);
    
    switch (action) {
      case 'edit':
        onUserSelect(user);
        break;
      case 'toggleStatus':
        onUserStatusToggle && onUserStatusToggle(user.id, !user.is_active);
        break;
      case 'delete':
        if (window.confirm(`Are you sure you want to delete ${user.first_name} ${user.last_name}?`)) {
          onUserDelete && onUserDelete(user.id);
        }
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading users...</p>
        </div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-8 text-center">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-500">There are no users to display.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Login
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr 
                key={user.id} 
                className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedUser?.id === user.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => onUserSelect(user)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      {user.profile_image ? (
                        <img 
                          className="h-10 w-10 rounded-full object-cover" 
                          src={user.profile_image} 
                          alt={`${user.first_name} ${user.last_name}`}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Mail className="w-4 h-4 mr-1" />
                        {user.email}
                      </div>
                      {user.phone_number && (
                        <div className="text-xs text-gray-500 flex items-center mt-1">
                          <Phone className="w-3 h-3 mr-1" />
                          {user.phone_number}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  {getRoleBadge(user.role)}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(user)}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 flex items-center">
                    <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                    {formatDate(user.date_joined)}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDate(user.last_login)}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionMenuOpen(actionMenuOpen === user.id ? null : user.id);
                      }}
                      className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    {actionMenuOpen === user.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setActionMenuOpen(null)}
                        />
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                          <div className="py-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActionClick('edit', user);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit User
                            </button>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActionClick('toggleStatus', user);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <UserCheck className="w-4 h-4 mr-2" />
                              {user.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            
                            <hr className="my-1" />
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActionClick('delete', user);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete User
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Footer with user count */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {users.length} user{users.length !== 1 ? 's' : ''}
          </div>
          <div className="text-sm text-gray-500">
            {users.filter(u => u.role === 'admin').length} admin{users.filter(u => u.role === 'admin').length !== 1 ? 's' : ''} • {' '}
            {users.filter(u => u.role === 'client').length} client{users.filter(u => u.role === 'client').length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserTable;