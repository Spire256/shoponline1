import React, { useState, useRef, useEffect } from 'react';
import { Bell, Menu, Search, User, LogOut, Settings, ChevronDown } from 'lucide-react';

const AdminHeader = ({ user, sidebarOpen, onToggleSidebar, unreadNotifications = 0 }) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userMenuRef = useRef(null);
  const notificationMenuRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
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

  const handleLogout = () => {
    // Implement logout logic
    console.log('Logout clicked');
  };

  const handleSearch = e => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Search query:', searchQuery);
      // Implement search logic
    }
  };

  // Mock notifications
  const notifications = [
    {
      id: 1,
      type: 'cod_order',
      title: 'New COD Order',
      message: 'Order #12345 requires confirmation',
      time: '5 minutes ago',
      unread: true,
    },
    {
      id: 2,
      type: 'low_stock',
      title: 'Low Stock Alert',
      message: 'Samsung Galaxy A14 has only 3 items left',
      time: '1 hour ago',
      unread: true,
    },
    {
      id: 3,
      type: 'flash_sale_ending',
      title: 'Flash Sale Ending',
      message: 'Electronics Flash Sale ends in 2 hours',
      time: '2 hours ago',
      unread: false,
    },
  ];

  return (
    <header className="admin-header">
      <div className="admin-header-left">
        <button
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        <div className="admin-logo">
          <h1>ShopOnline Uganda</h1>
          <span className="admin-badge">Admin</span>
        </div>
      </div>

      <div className="admin-header-center">
        <div className="admin-search-form">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search products, orders, customers..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSearch(e)}
              className="admin-search-input"
            />
          </div>
        </div>
      </div>

      <div className="admin-header-right">
        {/* Notifications */}
        <div className="notification-dropdown" ref={notificationMenuRef}>
          <button
            className="notification-btn"
            onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
            aria-label="View notifications"
          >
            <Bell size={20} />
            {unreadNotifications > 0 && (
              <span className="notification-badge">{unreadNotifications}</span>
            )}
          </button>

          {notificationMenuOpen && (
            <div className="notification-menu">
              <div className="notification-header">
                <h3>Notifications</h3>
                <span className="notification-count">{unreadNotifications} new</span>
              </div>

              <div className="notification-list">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`notification-item ${notification.unread ? 'unread' : ''}`}
                  >
                    <div className="notification-content">
                      <h4>{notification.title}</h4>
                      <p>{notification.message}</p>
                      <span className="notification-time">{notification.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="notification-footer">
                <button className="view-all-btn">View All Notifications</button>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="user-dropdown" ref={userMenuRef}>
          <button
            className="user-menu-btn"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            aria-label="User menu"
          >
            <div className="user-avatar">
              {user.profile_image ? (
                <img src={user.profile_image} alt="Profile" />
              ) : (
                <User size={20} />
              )}
            </div>
            <div className="user-info">
              <span className="user-name">{user.full_name}</span>
              <span className="user-role">Administrator</span>
            </div>
            <ChevronDown size={16} className="dropdown-arrow" />
          </button>

          {userMenuOpen && (
            <div className="user-menu">
              <div className="user-menu-header">
                <div className="user-avatar large">
                  {user.profile_image ? (
                    <img src={user.profile_image} alt="Profile" />
                  ) : (
                    <User size={24} />
                  )}
                </div>
                <div className="user-details">
                  <h4>{user.full_name}</h4>
                  <p>{user.email}</p>
                </div>
              </div>

              <div className="user-menu-items">
                <button className="user-menu-item">
                  <User size={16} />
                  <span>Profile Settings</span>
                </button>
                <button className="user-menu-item">
                  <Settings size={16} />
                  <span>Admin Settings</span>
                </button>
                <hr className="menu-divider" />
                <button className="user-menu-item logout" onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
