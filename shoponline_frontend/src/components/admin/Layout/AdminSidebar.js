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
  CreditCard,
  Globe,
  FileText,
  HelpCircle,
  User
} from 'lucide-react';

const AdminSidebar = ({ 
  isOpen = true, 
  isMobileOpen = false, 
  onClose, 
  currentPath = '/admin/dashboard',
  onNavigate,
  menuBadges = {}
}) => {
  const [expandedMenus, setExpandedMenus] = useState({
    products: false,
    orders: false,
    analytics: false,
    users: false,
  });

  const toggleMenu = (menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

  const handleMenuItemClick = (path) => {
    if (onNavigate) {
      onNavigate(path);
    }
    
    // Close mobile menu after navigation
    if (typeof window !== 'undefined' && window.innerWidth < 1024 && onClose) {
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
      tooltip: 'Dashboard Overview'
    },
    {
      key: 'products',
      label: 'Products',
      icon: Package,
      expandable: true,
      expanded: expandedMenus.products,
      tooltip: 'Product Management',
      badge: menuBadges.products,
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
        {
          key: 'product-reviews',
          label: 'Reviews',
          path: '/admin/products/reviews',
          active: currentPath === '/admin/products/reviews',
          badge: menuBadges.reviews,
        },
        {
          key: 'inventory',
          label: 'Inventory',
          path: '/admin/products/inventory',
          active: currentPath === '/admin/products/inventory',
          badge: menuBadges.lowStock,
        },
      ],
    },
    {
      key: 'categories',
      label: 'Categories',
      icon: FolderOpen,
      path: '/admin/categories',
      active: currentPath === '/admin/categories',
      tooltip: 'Product Categories'
    },
    {
      key: 'flash-sales',
      label: 'Flash Sales',
      icon: Zap,
      path: '/admin/flash-sales',
      active: currentPath === '/admin/flash-sales',
      badge: menuBadges.flashSales,
      tooltip: 'Flash Sales & Promotions'
    },
    {
      key: 'orders',
      label: 'Orders',
      icon: ShoppingCart,
      expandable: true,
      expanded: expandedMenus.orders,
      badge: menuBadges.orders,
      tooltip: 'Order Management',
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
          badge: menuBadges.codOrders,
        },
        {
          key: 'pending-orders',
          label: 'Pending Orders',
          path: '/admin/orders/pending',
          active: currentPath === '/admin/orders/pending',
          badge: menuBadges.pendingOrders,
        },
        {
          key: 'completed-orders',
          label: 'Completed',
          path: '/admin/orders/completed',
          active: currentPath === '/admin/orders/completed',
        },
        {
          key: 'cancelled-orders',
          label: 'Cancelled',
          path: '/admin/orders/cancelled',
          active: currentPath === '/admin/orders/cancelled',
        },
      ],
    },
    {
      key: 'users',
      label: 'Users',
      icon: Users,
      expandable: true,
      expanded: expandedMenus.users,
      tooltip: 'User Management',
      children: [
        {
          key: 'all-users',
          label: 'All Users',
          path: '/admin/users',
          active: currentPath === '/admin/users',
        },
        {
          key: 'admin-invitations',
          label: 'Admin Invitations',
          path: '/admin/users/invitations',
          active: currentPath === '/admin/users/invitations',
          badge: menuBadges.invitations,
        },
        {
          key: 'user-roles',
          label: 'User Roles',
          path: '/admin/users/roles',
          active: currentPath === '/admin/users/roles',
        },
      ],
    },
    {
      key: 'payments',
      label: 'Payments',
      icon: CreditCard,
      path: '/admin/payments',
      active: currentPath === '/admin/payments',
      tooltip: 'Payment Management'
    },
    {
      key: 'homepage',
      label: 'Homepage',
      icon: Home,
      path: '/admin/homepage',
      active: currentPath === '/admin/homepage',
      tooltip: 'Homepage Settings'
    },
    {
      key: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      expandable: true,
      expanded: expandedMenus.analytics,
      tooltip: 'Analytics & Reports',
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
        {
          key: 'traffic-analytics',
          label: 'Traffic Analytics',
          path: '/admin/analytics/traffic',
          active: currentPath === '/admin/analytics/traffic',
        },
      ],
    },
    {
      key: 'notifications',
      label: 'Notifications',
      icon: Bell,
      path: '/admin/notifications',
      active: currentPath === '/admin/notifications',
      badge: menuBadges.notifications,
      tooltip: 'Notification Center'
    },
    {
      key: 'reports',
      label: 'Reports',
      icon: FileText,
      path: '/admin/reports',
      active: currentPath === '/admin/reports',
      tooltip: 'System Reports'
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/admin/settings',
      active: currentPath === '/admin/settings',
      tooltip: 'System Settings'
    },
  ];

  const renderMenuItem = (item) => {
    const Icon = item.icon;
    const isActive = item.active || (item.children && item.children.some(child => child.active));
    const hasChildren = item.expandable && item.children;

    if (hasChildren) {
      return (
        <div key={item.key} className="menu-item-group">
          <button
            className={`menu-item ${isActive ? 'active' : ''} ${item.expanded ? 'expanded' : ''}`}
            onClick={() => toggleMenu(item.key)}
            data-tooltip={item.tooltip}
            aria-expanded={item.expanded}
            aria-label={`Toggle ${item.label} menu`}
          >
            <div className="menu-item-content">
              <div className="menu-item-left">
                <Icon size={20} className="menu-icon" />
                <span className="menu-label">{item.label}</span>
              </div>
              <div className="menu-item-right">
                {item.badge && (
                  <span className="menu-badge" aria-label={`${item.badge} items`}>
                    {typeof item.badge === 'number' ? (item.badge > 99 ? '99+' : item.badge) : item.badge}
                  </span>
                )}
                {item.expanded ? (
                  <ChevronDown size={16} className="expand-icon" />
                ) : (
                  <ChevronRight size={16} className="expand-icon" />
                )}
              </div>
            </div>
          </button>

          {item.expanded && (
            <div className="submenu" role="group" aria-label={`${item.label} submenu`}>
              {item.children.map((child) => (
                <button
                  key={child.key}
                  className={`submenu-item ${child.active ? 'active' : ''}`}
                  onClick={() => handleMenuItemClick(child.path)}
                  aria-label={child.label}
                >
                  <span className="submenu-label">{child.label}</span>
                  {child.badge && (
                    <span className="menu-badge small" aria-label={`${child.badge} items`}>
                      {typeof child.badge === 'number' ? (child.badge > 99 ? '99+' : child.badge) : child.badge}
                    </span>
                  )}
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
        data-tooltip={item.tooltip}
        aria-label={item.label}
      >
        <div className="menu-item-content">
          <div className="menu-item-left">
            <Icon size={20} className="menu-icon" />
            <span className="menu-label">{item.label}</span>
          </div>
          {item.badge && (
            <span className="menu-badge" aria-label={`${item.badge} items`}>
              {typeof item.badge === 'number' ? (item.badge > 99 ? '99+' : item.badge) : item.badge}
            </span>
          )}
        </div>
      </button>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="admin-mobile-overlay show" 
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              onClose();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar overlay"
        />
      )}

      <aside
        className={`admin-sidebar ${isOpen ? 'open' : 'closed'} ${
          isMobileOpen ? 'mobile-open' : ''
        }`}
        role="navigation"
        aria-label="Admin navigation"
      >
        {/* Aligned Navigation Header */}
        <div className="sidebar-header-navigation">
          <div className="navigation-title">
            <span className="nav-text">Navigation</span>
          </div>

          {/* Mobile close button */}
          {isMobileOpen && (
            <button 
              className="mobile-close-btn" 
              onClick={onClose} 
              aria-label="Close sidebar"
              type="button"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="sidebar-content">
          <nav className="sidebar-nav" role="navigation" aria-label="Main navigation">
            <div className="nav-section">
              {(isOpen || isMobileOpen) && <h3 className="nav-section-title">Overview</h3>}
              <div className="nav-items" role="group">
                {menuItems.slice(0, 1).map(renderMenuItem)}
              </div>
            </div>

            <div className="nav-section">
              {(isOpen || isMobileOpen) && <h3 className="nav-section-title">E-Commerce</h3>}
              <div className="nav-items" role="group">
                {menuItems.slice(1, 6).map(renderMenuItem)}
              </div>
            </div>

            <div className="nav-section">
              {(isOpen || isMobileOpen) && <h3 className="nav-section-title">Management</h3>}
              <div className="nav-items" role="group">
                {menuItems.slice(6, 9).map(renderMenuItem)}
              </div>
            </div>

            <div className="nav-section">
              {(isOpen || isMobileOpen) && <h3 className="nav-section-title">System</h3>}
              <div className="nav-items" role="group">
                {menuItems.slice(9).map(renderMenuItem)}
              </div>
            </div>
          </nav>

          {/* Enhanced Sidebar Footer */}
          {(isOpen || isMobileOpen) && (
            <div className="sidebar-footer">
              <div className="admin-info">
                <div className="admin-avatar">
                  <div className="avatar-placeholder">
                    AU
                  </div>
                </div>
                <div className="admin-details">
                  <h4>Admin User</h4>
                  <p>System Administrator</p>
                </div>
                <button 
                  className="settings-btn"
                  onClick={() => handleMenuItemClick('/admin/profile')}
                  aria-label="Admin settings"
                  type="button"
                >
                  <Settings size={16} />
                </button>
              </div>
              
              <div className="help-section">
                <button 
                  className="help-btn"
                  onClick={() => handleMenuItemClick('/admin/help')}
                  type="button"
                >
                  <HelpCircle size={16} />
                  <span>Help & Support</span>
                </button>
              </div>
              
              <div className="version-info">
                <span>Version 2.1.0</span>
              </div>
            </div>
          )}
        </div>

        {/* Additional CSS for navigation header */}
        <style jsx>{`
          .sidebar-header-navigation {
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            padding: 1rem 1.5rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            position: relative;
            display: flex;
            align-items: center;
            min-height: 80px;
          }

          .navigation-title {
            flex: 1;
            display: flex;
            align-items: center;
          }

          .nav-text {
            color: white;
            font-size: 1.25rem;
            font-weight: 600;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            letter-spacing: 0.025em;
            opacity: 0.95;
          }

          .mobile-close-btn {
            background: rgba(255, 255, 255, 0.15);
            border: none;
            border-radius: 8px;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            cursor: pointer;
            transition: all 0.2s ease;
            backdrop-filter: blur(10px);
          }

          .mobile-close-btn:hover {
            background: rgba(255, 255, 255, 0.25);
          }

          @media (min-width: 1024px) {
            .mobile-close-btn {
              display: none;
            }
          }

          /* Ensure collapsed sidebar still shows properly */
          .admin-sidebar.closed .sidebar-header-navigation {
            padding: 1rem;
            justify-content: center;
          }

          .admin-sidebar.closed .nav-text {
            display: none;
          }
        `}</style>
      </aside>
    </>
  );
};

export default AdminSidebar;