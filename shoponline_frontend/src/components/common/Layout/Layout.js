import React, { useContext } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import Sidebar from './Sidebar';
import Breadcrumb from './Breadcrumb';
//import AuthContext from '../../contexts/AuthContext';
import AuthContext from '../../../contexts/AuthContext';
import './Layout.css';

const Layout = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const location = useLocation();

  // Determine if current route is admin
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Show sidebar only on specific routes
  const showSidebar = !['/login', '/register', '/admin/login'].includes(location.pathname);

  // Show breadcrumb on non-root and non-admin routes
  const showBreadcrumb = location.pathname !== '/' && !isAdminRoute;

  return (
    <div className="layout min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        {showSidebar && (
          <Sidebar isAdmin={isAdminRoute && isAuthenticated && user?.role === 'admin'} />
        )}
        <main className="flex-1">
          {showBreadcrumb && <Breadcrumb />}
          <div className="container mx-auto px-4 py-8"> 
            <Outlet />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};
// Layout.css
export default Layout;
