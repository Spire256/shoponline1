import React, { useState, useEffect } from 'react';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import './AdminLayout.css';

// Mock hooks for demonstration - replace with actual implementations
const useAuth = () => ({
  user: {
    id: '123',
    email: 'admin@shoponline.com',
    first_name: 'John',
    last_name: 'Doe',
    role: 'admin',
    full_name: 'John Doe',
    profile_image: null,
  },
  isAuthenticated: true,
  loading: false,
});

const useNotifications = () => ({
  notifications: [],
  unreadCount: 3,
});

const AdminLayout = ({ children, currentPath = '/admin/dashboard' }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Check if user is admin
  const isAdmin = user?.role === 'admin' && user?.email?.endsWith('@shoponline.com');

  // Handle responsive sidebar
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
    handleResize(); // Call on mount

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

  // Show login prompt if not authenticated or not admin
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="admin-auth-required">
        <div className="auth-prompt">
          <h2>Admin Access Required</h2>
          <p>Please log in with admin credentials to access the dashboard.</p>
          <button className="btn-primary">Go to Admin Login</button>
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
      />

      <div className="admin-layout-body">
        <AdminSidebar
          isOpen={sidebarOpen}
          isMobileOpen={mobileSidebarOpen}
          onClose={closeMobileSidebar}
          currentPath={currentPath}
          user={user}
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
                    <div className="stat-value">247</div>
                  </div>
                  <div className="stat-card">
                    <h3>Active Products</h3>
                    <div className="stat-value">156</div>
                  </div>
                  <div className="stat-card">
                    <h3>Flash Sales</h3>
                    <div className="stat-value">3</div>
                  </div>
                  <div className="stat-card">
                    <h3>Revenue (UGX)</h3>
                    <div className="stat-value">5,240,000</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="admin-mobile-overlay" onClick={closeMobileSidebar} aria-hidden="true" />
      )}
    </div>
  );
};

export default AdminLayout;
