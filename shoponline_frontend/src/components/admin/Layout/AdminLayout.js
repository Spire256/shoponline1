import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Package, FolderOpen, Zap, ShoppingCart, 
  Users, Home, BarChart3, Bell, Settings, ChevronDown, 
  ChevronRight, X, Menu, Search, User, LogOut 
} from 'lucide-react';
import './AdminLayout.css';

// Complete Admin Header Component
const AdminHeader = ({ user, sidebarOpen, onToggleSidebar, unreadNotifications = 0, notifications = [] }) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    console.log('Logout clicked');
    // Implement actual logout logic
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Search query:', searchQuery);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.notification-dropdown')) {
        setNotificationMenuOpen(false);
      }
      if (!event.target.closest('.user-dropdown')) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
              className="admin-search-input"
            />
          </div>
        </div>
      </div>

      <div className="admin-header-right">
        {/* Notifications */}
        <div className="notification-dropdown">
          <button
            className="notification-btn"
            onClick={(e) => {
              e.stopPropagation();
              setNotificationMenuOpen(!notificationMenuOpen);
            }}
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
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
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
                  ))
                ) : (
                  <div className="notification-item">
                    <div className="notification-content">
                      <p>No notifications</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="notification-footer">
                <button className="view-all-btn">View All Notifications</button>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="user-dropdown">
          <button
            className="user-menu-btn"
            onClick={(e) => {
              e.stopPropagation();
              setUserMenuOpen(!userMenuOpen);
            }}
            aria-label="User menu"
          >
            <div className="user-avatar">
              {user?.profile_image ? (
                <img src={user.profile_image} alt="Profile" />
              ) : (
                <div className="avatar-placeholder">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </div>
              )}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.full_name || 'User'}</span>
              <span className="user-role">Administrator</span>
            </div>
            <ChevronDown size={16} className="dropdown-arrow" />
          </button>

          {userMenuOpen && (
            <div className="user-menu">
              <div className="user-menu-header">
                <div className="user-avatar large">
                  {user?.profile_image ? (
                    <img src={user.profile_image} alt="Profile" />
                  ) : (
                    <div className="avatar-placeholder">
                      {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </div>
                  )}
                </div>
                <div className="user-details">
                  <h4>{user?.full_name || 'User'}</h4>
                  <p>{user?.email || 'No email'}</p>
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

// Complete Admin Sidebar Component
const AdminSidebar = ({ isOpen, isMobileOpen, onClose, currentPath, user, menuItems = [] }) => {
  const [expandedMenus, setExpandedMenus] = useState({
    products: false,
    orders: false,
    analytics: false,
  });

  const toggleMenu = (menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

  const handleMenuItemClick = (path) => {
    console.log('Navigate to:', path);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const defaultMenuItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/admin/dashboard',
      active: currentPath === '/admin/dashboard',
    },
    {
      key: 'products',
      label: 'Products',
      icon: Package,
      expandable: true,
      expanded: expandedMenus.products,
      children: [
        {
          key: 'product-list',
          label: 'All Products',
          path: '/admin/products',
          active: currentPath === '/admin/products',
        },
        {
          key: 'add-product',
          label: 'Add Product',
          path: '/admin/products/add',
          active: currentPath === '/admin/products/add',
        },
        {
          key: 'bulk-actions',
          label: 'Bulk Actions',
          path: '/admin/products/bulk',
          active: currentPath === '/admin/products/bulk',
        },
      ],
    },
    {
      key: 'categories',
      label: 'Categories',
      icon: FolderOpen,
      path: '/admin/categories',
      active: currentPath === '/admin/categories',
    },
    {
      key: 'flash-sales',
      label: 'Flash Sales',
      icon: Zap,
      path: '/admin/flash-sales',
      active: currentPath === '/admin/flash-sales',
    },
    {
      key: 'orders',
      label: 'Orders',
      icon: ShoppingCart,
      expandable: true,
      expanded: expandedMenus.orders,
      children: [
        {
          key: 'all-orders',
          label: 'All Orders',
          path: '/admin/orders',
          active: currentPath === '/admin/orders',
        },
        {
          key: 'cod-orders',
          label: 'COD Orders',
          path: '/admin/orders/cod',
          active: currentPath === '/admin/orders/cod',
        },
        {
          key: 'pending-orders',
          label: 'Pending Orders',
          path: '/admin/orders/pending',
          active: currentPath === '/admin/orders/pending',
        },
      ],
    },
    {
      key: 'users',
      label: 'Users',
      icon: Users,
      path: '/admin/users',
      active: currentPath === '/admin/users',
    },
    {
      key: 'homepage',
      label: 'Homepage',
      icon: Home,
      path: '/admin/homepage',
      active: currentPath === '/admin/homepage',
    },
    {
      key: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      expandable: true,
      expanded: expandedMenus.analytics,
      children: [
        {
          key: 'sales-analytics',
          label: 'Sales Analytics',
          path: '/admin/analytics/sales',
          active: currentPath === '/admin/analytics/sales',
        },
        {
          key: 'product-analytics',
          label: 'Product Analytics',
          path: '/admin/analytics/products',
          active: currentPath === '/admin/analytics/products',
        },
        {
          key: 'user-analytics',
          label: 'User Analytics',
          path: '/admin/analytics/users',
          active: currentPath === '/admin/analytics/users',
        },
        {
          key: 'flash-sales-analytics',
          label: 'Flash Sales Analytics',
          path: '/admin/analytics/flash-sales',
          active: currentPath === '/admin/analytics/flash-sales',
        },
      ],
    },
    {
      key: 'notifications',
      label: 'Notifications',
      icon: Bell,
      path: '/admin/notifications',
      active: currentPath === '/admin/notifications',
    },
  ];

  const items = menuItems.length > 0 ? menuItems : defaultMenuItems;

  const renderMenuItem = (item) => {
    const Icon = item.icon;
    const isActive = item.active;
    const hasChildren = item.expandable && item.children;

    if (hasChildren) {
      return (
        <div key={item.key} className="menu-item-group">
          <button
            className={`menu-item ${isActive ? 'active' : ''} ${item.expanded ? 'expanded' : ''}`}
            onClick={() => toggleMenu(item.key)}
          >
            <div className="menu-item-content">
              <div className="menu-item-left">
                <Icon size={20} className="menu-icon" />
                <span className="menu-label">{item.label}</span>
              </div>
              <div className="menu-item-right">
                {item.badge && <span className="menu-badge">{item.badge}</span>}
                {item.expanded ? (
                  <ChevronDown size={16} className="expand-icon" />
                ) : (
                  <ChevronRight size={16} className="expand-icon" />
                )}
              </div>
            </div>
          </button>

          {item.expanded && (
            <div className="submenu">
              {item.children.map((child) => (
                <button
                  key={child.key}
                  className={`submenu-item ${child.active ? 'active' : ''}`}
                  onClick={() => handleMenuItemClick(child.path)}
                >
                  <span className="submenu-label">{child.label}</span>
                  {child.badge && <span className="menu-badge small">{child.badge}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        key={item.key}
        className={`menu-item ${isActive ? 'active' : ''}`}
        onClick={() => handleMenuItemClick(item.path)}
      >
        <div className="menu-item-content">
          <div className="menu-item-left">
            <Icon size={20} className="menu-icon" />
            <span className="menu-label">{item.label}</span>
          </div>
          {item.badge && <span className="menu-badge">{item.badge}</span>}
        </div>
      </button>
    );
  };

  return (
    <>
      <aside
        className={`admin-sidebar ${isOpen ? 'open' : 'closed'} ${
          isMobileOpen ? 'mobile-open' : ''
        }`}
      >
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">SO</div>
            <div className="logo-text">
              <h2>ShopOnline</h2>
              <span>Admin Panel</span>
            </div>
          </div>

          <button className="mobile-close-btn" onClick={onClose} aria-label="Close sidebar">
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-content">
          <nav className="sidebar-nav">
            <div className="nav-section">
              <h3 className="nav-section-title">Main</h3>
              <div className="nav-items">{items.slice(0, 1).map(renderMenuItem)}</div>
            </div>

            <div className="nav-section">
              <h3 className="nav-section-title">E-commerce</h3>
              <div className="nav-items">{items.slice(1, 6).map(renderMenuItem)}</div>
            </div>

            <div className="nav-section">
              <h3 className="nav-section-title">Management</h3>
              <div className="nav-items">{items.slice(6, 8).map(renderMenuItem)}</div>
            </div>

            <div className="nav-section">
              <h3 className="nav-section-title">System</h3>
              <div className="nav-items">{items.slice(8).map(renderMenuItem)}</div>
            </div>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="admin-info">
            <div className="admin-avatar">
              {user?.profile_image ? (
                <img src={user.profile_image} alt="Admin" />
              ) : (
                <div className="avatar-placeholder">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </div>
              )}
            </div>
            <div className="admin-details">
              <h4>{user?.full_name || 'User'}</h4>
              <p>Administrator</p>
            </div>
          </div>

          <button className="settings-btn" onClick={() => handleMenuItemClick('/admin/settings')}>
            <Settings size={20} />
          </button>
        </div>
      </aside>
    </>
  );
};

// Main Admin Layout Component
const AdminLayout = ({ 
  children, 
  currentPath = '/admin/dashboard',
  user = null,
  isAuthenticated = false,
  loading = false,
  notifications = [],
  unreadCount = 0,
  menuItems = [],
  onNavigate = () => {}
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
        setMobileSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <div className="admin-loading-screen">
        <div className="admin-loading-spinner">
          <div className="spinner-ring" />
          <p>Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="admin-auth-required">
        <div className="auth-prompt">
          <h2>Admin Access Required</h2>
          <p>Please log in with admin credentials to access the dashboard.</p>
          <button className="btn-primary" onClick={() => console.log('Navigate to login')}>
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setMobileSidebarOpen(!mobileSidebarOpen);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <div className="admin-layout">
      <AdminHeader
        user={user}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
        unreadNotifications={unreadCount}
        notifications={notifications}
      />

      <div className="admin-layout-body">
        <AdminSidebar
          isOpen={sidebarOpen}
          isMobileOpen={mobileSidebarOpen}
          onClose={closeMobileSidebar}
          currentPath={currentPath}
          user={user}
          menuItems={menuItems}
        />

        <main className={`admin-main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <div className="admin-content-wrapper">
            {children || (
              <div className="admin-dashboard-demo">
                <h1>Welcome to ShopOnline Uganda Admin Dashboard</h1>
                <p>Select a menu item to manage your e-commerce platform.</p>
                <div className="dashboard-stats">
                  <div className="stat-card">
                    <h3>Total Orders</h3>
                    <div className="stat-value">-</div>
                  </div>
                  <div className="stat-card">
                    <h3>Active Products</h3>
                    <div className="stat-value">-</div>
                  </div>
                  <div className="stat-card">
                    <h3>Flash Sales</h3>
                    <div className="stat-value">-</div>
                  </div>
                  <div className="stat-card">
                    <h3>Revenue (UGX)</h3>
                    <div className="stat-value">-</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {mobileSidebarOpen && (
        <div className="admin-mobile-overlay" onClick={closeMobileSidebar} aria-hidden="true" />
      )}
    </div>
  );
};

export default AdminLayout;