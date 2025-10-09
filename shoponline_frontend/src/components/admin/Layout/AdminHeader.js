import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, LogOut, Settings, ChevronDown, Menu, CheckCircle } from 'lucide-react';

const AdminHeader = ({ 
  user = null, 
  onToggleSidebar, 
  notifications = [],
  unreadCount = 0,
  onSearch,
  onLogout,
  onNavigate
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userMenuRef = useRef(null);
  const notificationMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
        setNotificationMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setUserMenuOpen(false);
        setNotificationMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleLogout = () => {
    setUserMenuOpen(false);
    if (onLogout) {
      onLogout();
    }
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery.trim());
      }
      setSearchQuery('');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
      setSearchQuery('');
    }
  };

  const handleNavigation = (path) => {
    if (onNavigate) {
      onNavigate(path);
    }
    setUserMenuOpen(false);
    setNotificationMenuOpen(false);
  };

  const handleNotificationClick = (notification) => {
    if (notification.path && onNavigate) {
      onNavigate(notification.path);
    }
    setNotificationMenuOpen(false);
  };

  const markAllAsRead = () => {
    // This would typically make an API call to mark all notifications as read
    setNotificationMenuOpen(false);
  };

  const getUserInitials = () => {
    if (!user) return 'AU';
    const firstName = user.first_name || user.firstName || '';
    const lastName = user.last_name || user.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'AU';
  };

  const getUserName = () => {
    if (!user) return 'Admin User';
    return user.full_name || user.fullName || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Admin User';
  };

  const getUserEmail = () => {
    return user?.email || 'admin@shoponline.ug';
  };

  const formatNotificationTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <header className="admin-header" role="banner">
      <div className="admin-header-left">
        <button
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar navigation"
          type="button"
        >
          <Menu size={20} />
        </button>

        <div className="admin-logo">
          <h1>ShopOnline Uganda</h1>
          <span className="admin-badge">Admin Panel</span>
        </div>
      </div>

      <div className="admin-header-center">
        <form className="admin-search-form" onSubmit={handleSearchSubmit} role="search">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="search"
              placeholder="Search products, orders, customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearch}
              className="admin-search-input"
              aria-label="Search admin content"
              autoComplete="off"
            />
          </div>
        </form>
      </div>

      <div className="admin-header-right">
        {/* Enhanced Notifications Dropdown */}
        <div className="notification-dropdown" ref={notificationMenuRef}>
          <button
            className="notification-btn"
            onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
            aria-label={`View notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            aria-expanded={notificationMenuOpen}
            type="button"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="notification-badge" aria-label={`${unreadCount} unread notifications`}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {notificationMenuOpen && (
            <div className="notification-menu" role="dialog" aria-label="Notifications menu">
              <div className="notification-header">
                <h3>Notifications</h3>
                {unreadCount > 0 && (
                  <span className="notification-count">{unreadCount} new</span>
                )}
              </div>

              <div className="notification-list">
                {notifications.length > 0 ? (
                  <>
                    {notifications.slice(0, 5).map((notification) => (
                      <button
                        key={notification.id}
                        className={`notification-item ${notification.unread || !notification.is_read ? 'unread' : ''}`}
                        onClick={() => handleNotificationClick(notification)}
                        type="button"
                      >
                        <div className="notification-content">
                          <h4>{notification.title}</h4>
                          <p>{notification.message}</p>
                          <span className="notification-time">
                            {formatNotificationTime(notification.created_at || notification.timestamp)}
                          </span>
                        </div>
                        {(notification.unread || !notification.is_read) && (
                          <div className="unread-indicator" aria-label="Unread notification" />
                        )}
                      </button>
                    ))}
                    {notifications.length > 5 && (
                      <div className="notification-item more-notifications">
                        <div className="notification-content">
                          <p>+{notifications.length - 5} more notifications</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="no-notifications">
                    <Bell size={24} className="no-notifications-icon" />
                    <p>No notifications</p>
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="notification-footer">
                  {unreadCount > 0 && (
                    <button 
                      className="mark-all-read-btn"
                      onClick={markAllAsRead}
                      type="button"
                      aria-label="Mark all notifications as read"
                    >
                      <CheckCircle size={14} />
                      Mark all as read
                    </button>
                  )}
                  <button 
                    className="view-all-btn"
                    onClick={() => handleNavigation('/admin/notifications')}
                    type="button"
                  >
                    View All Notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Enhanced User Dropdown */}
        <div className="user-dropdown" ref={userMenuRef}>
          <button
            className="user-menu-btn"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            aria-label="User menu"
            aria-expanded={userMenuOpen}
            type="button"
          >
            <div className="user-avatar">
              {user?.profile_image || user?.profileImage ? (
                <img 
                  src={user.profile_image || user.profileImage} 
                  alt="Profile" 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="avatar-placeholder" 
                style={user?.profile_image || user?.profileImage ? { display: 'none' } : {}}
              >
                {getUserInitials()}
              </div>
            </div>
            <div className="user-info">
              <span className="user-name">{getUserName()}</span>
              <span className="user-role">Administrator</span>
            </div>
            <ChevronDown 
              size={16} 
              className={`dropdown-arrow ${userMenuOpen ? 'rotated' : ''}`} 
            />
          </button>

          {userMenuOpen && (
            <div className="user-menu" role="dialog" aria-label="User menu">
              <div className="user-menu-header">
                <div className="user-avatar large">
                  {user?.profile_image || user?.profileImage ? (
                    <img 
                      src={user.profile_image || user.profileImage} 
                      alt="Profile" 
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="avatar-placeholder large" 
                    style={user?.profile_image || user?.profileImage ? { display: 'none' } : {}}
                  >
                    {getUserInitials()}
                  </div>
                </div>
                <div className="user-details">
                  <h4>{getUserName()}</h4>
                  <p>{getUserEmail()}</p>
                </div>
              </div>

              <div className="user-menu-items">
                <button 
                  className="user-menu-item"
                  onClick={() => handleNavigation('/admin/profile')}
                  type="button"
                >
                  <User size={16} />
                  <span>Profile Settings</span>
                </button>
                <button 
                  className="user-menu-item"
                  onClick={() => handleNavigation('/admin/settings')}
                  type="button"
                >
                  <Settings size={16} />
                  <span>Admin Settings</span>
                </button>
                <hr className="menu-divider" />
                <button 
                  className="user-menu-item logout" 
                  onClick={handleLogout}
                  type="button"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .admin-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 80px;
          background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
          border: none;
          padding: 0 2rem;
          color: white;
          width: 100%;
          box-sizing: border-box;
          backdrop-filter: blur(10px);
        }

        .admin-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent 48%, rgba(255,255,255,0.1) 50%, transparent 52%);
          pointer-events: none;
        }

        .admin-header-left {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          flex-shrink: 0;
          z-index: 1;
        }

        .sidebar-toggle-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          cursor: pointer;
          color: white;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(10px);
        }

        .sidebar-toggle-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .admin-logo {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .admin-logo h1 {
          font-size: 1.5rem;
          font-weight: 800;
          margin: 0;
          text-shadow: 0 2px 8px rgba(0,0,0,0.3);
          background: linear-gradient(135deg, #ffffff 0%, #dbeafe 100%);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          white-space: nowrap;
        }

        .admin-badge {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.2));
          color: white;
          padding: 0.375rem 1rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: 1px solid rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(10px);
          white-space: nowrap;
        }

        .admin-header-center {
          flex: 1;
          max-width: 500px;
          margin: 0 2rem;
          z-index: 1;
        }

        .admin-search-form {
          width: 100%;
        }

        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          color: #64748b;
          pointer-events: none;
          z-index: 2;
        }

        .admin-search-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          padding: 1rem 1rem 1rem 3rem;
          font-size: 0.875rem;
          color: #0f172a;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(10px);
        }

        .admin-search-input:focus {
          outline: none;
          background: white;
          border-color: #60a5fa;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
          transform: translateY(-1px);
        }

        .admin-search-input::placeholder {
          color: #64748b;
        }

        .admin-header-right {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-shrink: 0;
          z-index: 1;
        }

        .notification-dropdown,
        .user-dropdown {
          position: relative;
        }

        .notification-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          cursor: pointer;
          color: white;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(10px);
        }

        .notification-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .notification-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(220, 38, 38, 0.4);
          animation: pulse 2s infinite;
        }

        .user-menu-btn {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.5rem 1rem;
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(10px);
          color: white;
        }

        .user-menu-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          background: linear-gradient(135deg, #60a5fa, #3b82f6);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 2px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          position: relative;
        }

        .user-avatar.large {
          width: 56px;
          height: 56px;
        }

        .user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          font-weight: 700;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar-placeholder.large {
          font-size: 18px;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
          min-width: 0;
        }

        .user-name {
          font-size: 14px;
          font-weight: 700;
          line-height: 1.2;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 120px;
        }

        .user-role {
          font-size: 12px;
          opacity: 0.9;
          line-height: 1.2;
          font-weight: 500;
          white-space: nowrap;
        }

        .dropdown-arrow {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
        }

        .dropdown-arrow.rotated {
          transform: rotate(180deg);
        }

        .notification-menu,
        .user-menu {
          position: fixed;
          top: calc(80px + 1rem);
          right: 2rem;
          width: 360px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          z-index: 1200;
          overflow: hidden;
          animation: slideDown 0.3s ease-out;
        }

        .user-menu {
          width: 300px;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .notification-header {
          padding: 1.5rem;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, #eff6ff, #ffffff);
        }

        .notification-header h3 {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .notification-count {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 12px;
        }

        .notification-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .notification-item {
          width: 100%;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #f8fafc;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          background: transparent;
          border-left: none;
          border-right: none;
          border-top: none;
          text-align: left;
        }

        .notification-item:hover {
          background: #f8fafc;
        }

        .notification-item.unread {
          background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
          border-left: 4px solid #3b82f6;
        }

        .notification-item:last-child {
          border-bottom: none;
        }

        .notification-content {
          flex: 1;
          min-width: 0;
        }

        .notification-content h4 {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 6px 0;
          line-height: 1.3;
        }

        .notification-content p {
          font-size: 13px;
          color: #475569;
          margin: 0 0 8px 0;
          line-height: 1.4;
        }

        .notification-time {
          font-size: 11px;
          color: #64748b;
          font-weight: 500;
        }

        .unread-indicator {
          width: 8px;
          height: 8px;
          background: #3b82f6;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 4px;
        }

        .more-notifications {
          font-style: italic;
          color: #64748b;
        }

        .no-notifications {
          padding: 3rem 1.5rem;
          text-align: center;
          color: #64748b;
        }

        .no-notifications-icon {
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .no-notifications p {
          margin: 0;
          font-size: 14px;
        }

        .notification-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid #f1f5f9;
          background: #f8fafc;
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .mark-all-read-btn,
        .view-all-btn {
          flex: 1;
          min-width: 120px;
          padding: 0.75rem 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .mark-all-read-btn {
          background: white;
          color: #059669;
          border-color: #059669;
        }

        .mark-all-read-btn:hover {
          background: #f0fdf4;
        }

        .view-all-btn {
          background: #2563eb;
          color: white;
          border-color: #2563eb;
        }

        .view-all-btn:hover {
          background: #1d4ed8;
        }

        .user-menu-header {
          padding: 1.5rem;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          gap: 1rem;
          background: linear-gradient(135deg, #eff6ff, #ffffff);
        }

        .user-details {
          flex: 1;
          min-width: 0;
        }

        .user-details h4 {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-details p {
          font-size: 13px;
          color: #64748b;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-menu-items {
          padding: 0.5rem 0;
        }

        .user-menu-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1.5rem;
          border: none;
          background: transparent;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          color: #374151;
          font-weight: 500;
        }

        .user-menu-item:hover {
          background: #f8fafc;
          color: #2563eb;
        }

        .user-menu-item.logout {
          color: #dc2626;
        }

        .user-menu-item.logout:hover {
          background: #fef2f2;
          color: #b91c1c;
        }

        .menu-divider {
          margin: 0.5rem 0;
          border: none;
          border-top: 1px solid #f1f5f9;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        @media (max-width: 1024px) {
          .admin-header-center {
            display: none;
          }

          .user-info {
            display: none;
          }

          .notification-menu,
          .user-menu {
            right: 1rem;
            width: 320px;
          }

          .user-menu {
            width: 280px;
          }
        }

        @media (max-width: 768px) {
          .admin-header {
            padding: 0 1rem;
            height: 70px;
          }

          .admin-header-left {
            gap: 1rem;
          }

          .admin-logo h1 {
            font-size: 1.25rem;
          }

          .admin-badge {
            display: none;
          }

          .sidebar-toggle-btn,
          .notification-btn {
            width: 40px;
            height: 40px;
          }

          .user-avatar {
            width: 36px;
            height: 36px;
          }

          .notification-menu,
          .user-menu {
            top: calc(70px + 1rem);
            right: 0.5rem;
            width: calc(100vw - 1rem);
            max-width: 360px;
          }

          .user-menu {
            width: calc(100vw - 1rem);
            max-width: 280px;
          }
        }

        @media (max-width: 480px) {
          .admin-header {
            padding: 0 0.75rem;
          }

          .admin-header-left {
            gap: 0.75rem;
          }

          .admin-logo h1 {
            font-size: 1.125rem;
          }

          .notification-menu,
          .user-menu {
            right: 0.25rem;
            width: calc(100vw - 0.5rem);
            max-width: 320px;
          }

          .user-menu {
            width: calc(100vw - 0.5rem);
            max-width: 280px;
          }
        }
      `}</style>
    </header>
  );
};

export default AdminHeader;