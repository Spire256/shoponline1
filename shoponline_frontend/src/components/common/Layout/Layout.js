import React, { useContext, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import Sidebar from './Sidebar';
import Breadcrumb from './Breadcrumb';
import AuthContext from '../../../contexts/AuthContext';
import './Layout.css';

const Layout = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Determine if current route is admin
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Show sidebar only on specific routes
  const showSidebar = !['/login', '/register', '/admin/login'].includes(location.pathname);

  // Show breadcrumb on non-root and non-admin routes
  const showBreadcrumb = location.pathname !== '/' && !isAdminRoute;

  // Handle sidebar toggle
  const handleSidebarToggle = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  return (
    <div className="layout">
      {/* Header spans full width */}
      <Header />
      
      {/* Main content area with sidebar and content */}
      <div className="layout-body">
        {showSidebar && (
          <Sidebar 
            isAdmin={isAdminRoute && isAuthenticated && user?.role === 'admin'}
            onToggle={handleSidebarToggle}
          />
        )}
        
        {/* Main content area */}
        <main 
          className={`main-content ${showSidebar ? 'with-sidebar' : 'without-sidebar'} ${
            sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'
          }`}
        >
          {showBreadcrumb && <Breadcrumb />}
          <div className="content-container">
            <Outlet />
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default Layout;