import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

const AdminNavigation = ({
  breadcrumbs = [],
  currentPage,
  showBackButton = false,
  onBack,
  actions = [],
}) => {
  const handleBreadcrumbClick = path => {
    console.log('Navigate to breadcrumb:', path);
  };

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      console.log('Navigate back');
    }
  };

  const renderBreadcrumbs = () => {
    if (breadcrumbs.length === 0) return null;

    return (
      <nav className="admin-breadcrumbs" aria-label="Breadcrumb">
        <ol className="breadcrumb-list">
          <li className="breadcrumb-item">
            <button
              className="breadcrumb-link"
              onClick={() => handleBreadcrumbClick('/admin/dashboard')}
            >
              <Home size={16} />
              <span>Dashboard</span>
            </button>
          </li>

          {breadcrumbs.map((crumb, index) => (
            <li key={index} className="breadcrumb-item">
              <ChevronRight size={16} className="breadcrumb-separator" />
              {index === breadcrumbs.length - 1 ? (
                <span className="breadcrumb-current">{crumb.label}</span>
              ) : (
                <button
                  className="breadcrumb-link"
                  onClick={() => handleBreadcrumbClick(crumb.path)}
                >
                  {crumb.label}
                </button>
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  };

  return (
    <div className="admin-navigation">
      <div className="navigation-content">
        <div className="navigation-left">
          {showBackButton && (
            <button className="back-button" onClick={handleBackClick}>
              <ChevronRight size={16} className="back-icon" />
              Back
            </button>
          )}

          <div className="page-info">
            {renderBreadcrumbs()}
            {currentPage && <h1 className="page-title">{currentPage}</h1>}
          </div>
        </div>

        <div className="navigation-right">
          {actions.length > 0 && (
            <div className="page-actions">
              {actions.map((action, index) => (
                <button
                  key={index}
                  className={`action-btn ${action.variant || 'primary'} ${
                    action.disabled ? 'disabled' : ''
                  }`}
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  {action.icon && <action.icon size={16} className="action-icon" />}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Navigation Hook for managing navigation state
export const useAdminNavigation = () => {
  const [navigationState, setNavigationState] = React.useState({
    breadcrumbs: [],
    currentPage: '',
    showBackButton: false,
    actions: [],
  });

  const setBreadcrumbs = breadcrumbs => {
    setNavigationState(prev => ({ ...prev, breadcrumbs }));
  };

  const setCurrentPage = currentPage => {
    setNavigationState(prev => ({ ...prev, currentPage }));
  };

  const setShowBackButton = showBackButton => {
    setNavigationState(prev => ({ ...prev, showBackButton }));
  };

  const setActions = actions => {
    setNavigationState(prev => ({ ...prev, actions }));
  };

  const resetNavigation = () => {
    setNavigationState({
      breadcrumbs: [],
      currentPage: '',
      showBackButton: false,
      actions: [],
    });
  };

  return {
    navigationState,
    setBreadcrumbs,
    setCurrentPage,
    setShowBackButton,
    setActions,
    resetNavigation,
  };
};

export default AdminNavigation;
