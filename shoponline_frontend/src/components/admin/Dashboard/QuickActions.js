import React, { useState } from 'react';
import './Dashboard.css';

const QuickActions = () => {
  const [showMore, setShowMore] = useState(false);

  const handleNavigation = path => {
    // In a real app, this would use React Router or similar
    window.location.href = path;
  };

  const primaryActions = [
    {
      id: 'add-product',
      title: 'Add Product',
      description: 'Add new product to store',
      icon: '📦',
      color: 'primary',
      path: '/admin/products/add',
      shortcut: 'Ctrl+P',
    },
    {
      id: 'create-flash-sale',
      title: 'Flash Sale',
      description: 'Create time-limited sale',
      icon: '⚡',
      color: 'warning',
      path: '/admin/flash-sales/create',
      shortcut: 'Ctrl+F',
    },
    {
      id: 'view-orders',
      title: 'View Orders',
      description: 'Manage customer orders',
      icon: '📋',
      color: 'info',
      path: '/admin/orders',
      shortcut: 'Ctrl+O',
    },
    {
      id: 'invite-admin',
      title: 'Invite Admin',
      description: 'Send admin invitation',
      icon: '👥',
      color: 'success',
      path: '/admin/users/invite',
      shortcut: 'Ctrl+I',
    },
  ];

  const secondaryActions = [
    {
      id: 'manage-categories',
      title: 'Categories',
      description: 'Organize product categories',
      icon: '📁',
      color: 'secondary',
      path: '/admin/categories',
    },
    {
      id: 'homepage-content',
      title: 'Homepage',
      description: 'Edit homepage content',
      icon: '🏠',
      color: 'purple',
      path: '/admin/homepage',
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'View detailed analytics',
      icon: '📊',
      color: 'indigo',
      path: '/admin/analytics',
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Configure store settings',
      icon: '⚙️',
      color: 'dark',
      path: '/admin/settings',
    },
  ];

  const handleActionClick = action => {
    handleNavigation(action.path);
  };

  const handleKeyboardShortcut = e => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'p':
          e.preventDefault();
          handleNavigation('/admin/products/add');
          break;
        case 'f':
          e.preventDefault();
          handleNavigation('/admin/flash-sales/create');
          break;
        case 'o':
          e.preventDefault();
          handleNavigation('/admin/orders');
          break;
        case 'i':
          e.preventDefault();
          handleNavigation('/admin/users/invite');
          break;
        default:
          break;
      }
    }
  };

  // Add keyboard shortcut listeners
  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcut);
    return () => {
      document.removeEventListener('keydown', handleKeyboardShortcut);
    };
  }, []);

  return (
    <div className="quick-actions-container">
      <div className="card">
        <div className="card-header">
          <div className="header-title">
            <h3>Quick Actions</h3>
            <p>Frequently used admin functions</p>
          </div>

          <div className="header-actions">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setShowMore(!showMore)}
            >
              {showMore ? 'Show Less' : 'Show More'}
            </button>
          </div>
        </div>

        <div className="card-body">
          {/* Primary Actions */}
          <div className="actions-section">
            <div className="actions-grid primary">
              {primaryActions.map(action => (
                <div
                  key={action.id}
                  className={`action-card ${action.color}`}
                  onClick={() => handleActionClick(action)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleActionClick(action);
                    }
                  }}
                >
                  <div className="action-content">
                    <div className="action-icon">
                      <span className="icon-emoji">{action.icon}</span>
                    </div>

                    <div className="action-details">
                      <div className="action-title">{action.title}</div>
                      <div className="action-description">{action.description}</div>
                    </div>

                    {action.shortcut && (
                      <div className="action-shortcut">
                        <kbd>{action.shortcut}</kbd>
                      </div>
                    )}
                  </div>

                  <div className="action-arrow">→</div>
                </div>
              ))}
            </div>
          </div>

          {/* Secondary Actions */}
          {showMore && (
            <div className="actions-section secondary">
              <div className="section-divider">
                <span className="divider-text">More Actions</span>
              </div>

              <div className="actions-grid secondary">
                {secondaryActions.map(action => (
                  <div
                    key={action.id}
                    className={`action-card compact ${action.color}`}
                    onClick={() => handleActionClick(action)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="action-content">
                      <div className="action-icon">
                        <span className="icon-emoji">{action.icon}</span>
                      </div>

                      <div className="action-details">
                        <div className="action-title">{action.title}</div>
                        <div className="action-description">{action.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="quick-stats-section">
            <div className="section-title">
              <h4>At a Glance</h4>
            </div>

            <div className="quick-stats-grid">
              <div className="quick-stat-card">
                <div className="stat-icon">📦</div>
                <div className="stat-content">
                  <div className="stat-number">--</div>
                  <div className="stat-label">Products Added Today</div>
                </div>
              </div>

              <div className="quick-stat-card">
                <div className="stat-icon">⚡</div>
                <div className="stat-content">
                  <div className="stat-number">--</div>
                  <div className="stat-label">Active Flash Sales</div>
                </div>
              </div>

              <div className="quick-stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <div className="stat-number">--</div>
                  <div className="stat-label">New Customers</div>
                </div>
              </div>
            </div>
          </div>

          {/* Shortcuts Help */}
          <div className="shortcuts-section">
            <div className="section-title">
              <h4>Keyboard Shortcuts</h4>
            </div>

            <div className="shortcuts-list">
              <div className="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>P</kbd>
                <span className="shortcut-description">Add Product</span>
              </div>

              <div className="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>F</kbd>
                <span className="shortcut-description">Create Flash Sale</span>
              </div>

              <div className="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>O</kbd>
                <span className="shortcut-description">View Orders</span>
              </div>

              <div className="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>I</kbd>
                <span className="shortcut-description">Invite Admin</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="activity-section">
            <div className="section-title">
              <h4>Recent Activity</h4>
            </div>

            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon">📦</div>
                <div className="activity-content">
                  <div className="activity-text">Product "Samsung Galaxy" was added</div>
                  <div className="activity-time">2 hours ago</div>
                </div>
              </div>

              <div className="activity-item">
                <div className="activity-icon">⚡</div>
                <div className="activity-content">
                  <div className="activity-text">Flash sale "Electronics Deal" created</div>
                  <div className="activity-time">1 day ago</div>
                </div>
              </div>

              <div className="activity-item">
                <div className="activity-icon">📋</div>
                <div className="activity-content">
                  <div className="activity-text">Order #SHO20241205001 was processed</div>
                  <div className="activity-time">2 days ago</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="tips-section">
            <div className="tip-card">
              <div className="tip-icon">💡</div>
              <div className="tip-content">
                <div className="tip-title">Pro Tip</div>
                <div className="tip-text">
                  Use flash sales during peak shopping hours (7-9 PM) to maximize impact on Ugandan
                  customers.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
