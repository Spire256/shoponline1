import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  Zap,
  ShoppingCart,
  Users,
  Home,
  BarChart3,
  Bell,
  Settings,
  ChevronDown,
  ChevronRight,
  X,
} from 'lucide-react';

const AdminSidebar = ({ isOpen, isMobileOpen, onClose, currentPath, user }) => {
  const [expandedMenus, setExpandedMenus] = useState({
    products: false,
    orders: false,
    analytics: false,
  });

  const toggleMenu = menuKey => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

  const handleMenuItemClick = path => {
    console.log('Navigate to:', path);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const menuItems = [
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
      badge: '3 Active',
    },
    {
      key: 'orders',
      label: 'Orders',
      icon: ShoppingCart,
      expandable: true,
      expanded: expandedMenus.orders,
      badge: '12 New',
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
          badge: '5 New',
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
      badge: '3',
    },
  ];

  const renderMenuItem = item => {
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
              {item.children.map(child => (
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

          {/* Mobile close button */}
          <button className="mobile-close-btn" onClick={onClose} aria-label="Close sidebar">
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-content">
          <nav className="sidebar-nav">
            <div className="nav-section">
              <h3 className="nav-section-title">Main</h3>
              <div className="nav-items">{menuItems.slice(0, 1).map(renderMenuItem)}</div>
            </div>

            <div className="nav-section">
              <h3 className="nav-section-title">E-commerce</h3>
              <div className="nav-items">{menuItems.slice(1, 6).map(renderMenuItem)}</div>
            </div>

            <div className="nav-section">
              <h3 className="nav-section-title">Management</h3>
              <div className="nav-items">{menuItems.slice(6, 8).map(renderMenuItem)}</div>
            </div>

            <div className="nav-section">
              <h3 className="nav-section-title">System</h3>
              <div className="nav-items">{menuItems.slice(8).map(renderMenuItem)}</div>
            </div>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="admin-info">
            <div className="admin-avatar">
              {user.profile_image ? (
                <img src={user.profile_image} alt="Admin" />
              ) : (
                <div className="avatar-placeholder">
                  {user.first_name?.[0]}
                  {user.last_name?.[0]}
                </div>
              )}
            </div>
            <div className="admin-details">
              <h4>{user.full_name}</h4>
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

export default AdminSidebar;
