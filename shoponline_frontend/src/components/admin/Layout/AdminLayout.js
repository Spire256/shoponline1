import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import './AdminLayout.css';

/**
 * AdminLayout Component
 * 
 * Main layout wrapper for the admin dashboard. Handles authentication,
 * sidebar state management, and provides the overall structure for admin pages.
 */
const AdminLayout = () => {
  // State management
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Persist sidebar state in localStorage for desktop users
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      const saved = localStorage.getItem('admin-sidebar-open');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return false;
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [menuCounts, setMenuCounts] = useState({});

  // Hooks
  const { user, isLoading, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Calculate unread notifications count
  const unreadCount = useMemo(() => {
    return notifications.filter(n => n.unread).length;
  }, [notifications]);

  // Memoized menu badges to prevent unnecessary re-renders
  const menuBadges = useMemo(() => {
    return {
      orders: menuCounts?.totalOrders || 0,
      pendingOrders: menuCounts?.pendingOrders || 0,
      codOrders: menuCounts?.codOrders || 0,
      notifications: unreadCount || 0,
      reviews: menuCounts?.pendingReviews || 0,
      lowStock: menuCounts?.lowStockItems || 0,
      flashSales: menuCounts?.activeFlashSales || 0,
      invitations: menuCounts?.pendingInvitations || 0,
      products: menuCounts?.totalProducts || 0
    };
  }, [menuCounts, unreadCount]);

  // Persist sidebar state changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      localStorage.setItem('admin-sidebar-open', JSON.stringify(sidebarOpen));
    }
  }, [sidebarOpen]);

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 1024;
      
      if (isMobile) {
        setSidebarOpen(false);
        setMobileSidebarOpen(false);
      } else {
        // Restore desktop sidebar state from localStorage
        const saved = localStorage.getItem('admin-sidebar-open');
        setSidebarOpen(saved !== null ? JSON.parse(saved) : true);
        setMobileSidebarOpen(false);
      }
    };

    // Debounce resize handler for better performance
    let timeoutId;
    const debouncedHandleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', debouncedHandleResize);
    handleResize(); // Call on mount

    return () => {
      window.removeEventListener('resize', debouncedHandleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Load notifications and menu counts on mount
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        // Replace with your actual API call
        // const response = await fetch('/api/admin/notifications');
        // const data = await response.json();
        // setNotifications(data);
        
        // For now, set empty array - you can add your API call here
        setNotifications([]);
      } catch (error) {
        console.error('Error loading notifications:', error);
        setNotifications([]);
      }
    };

    const loadMenuCounts = async () => {
      try {
        // Replace with your actual API call
        // const response = await fetch('/api/admin/counts');
        // const data = await response.json();
        // setMenuCounts(data);
        
        // For now, set empty object - you can add your API call here
        setMenuCounts({});
      } catch (error) {
        console.error('Error loading menu counts:', error);
        setMenuCounts({});
      }
    };

    if (isAuthenticated && isAdmin()) {
      loadNotifications();
      loadMenuCounts();
    }
  }, [isAuthenticated, isAdmin]);

  // Handle logout with error handling and cleanup
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      // Clear any persisted admin state
      localStorage.removeItem('admin-sidebar-open');
      localStorage.removeItem('admin-search-history');
      navigate('/auth/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout fails
      localStorage.clear();
      window.location.href = '/auth/login';
    }
  }, [logout, navigate]);

  // Handle navigation with proper error handling
  const handleNavigate = useCallback((path) => {
    if (!path || typeof path !== 'string') {
      console.warn('Invalid navigation path:', path);
      return;
    }

    try {
      navigate(path);
      
      // Close mobile sidebar after navigation
      if (window.innerWidth < 1024) {
        setMobileSidebarOpen(false);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback navigation
      window.location.href = path;
    }
  }, [navigate]);

  // Handle search with history tracking
  const handleSearch = useCallback((query) => {
    if (!query || typeof query !== 'string' || !query.trim()) {
      return;
    }

    const trimmedQuery = query.trim();
    
    try {
      // Save search to history
      const searchHistory = JSON.parse(
        localStorage.getItem('admin-search-history') || '[]'
      );
      
      // Add to history (avoid duplicates and limit to 10 items)
      const updatedHistory = [
        trimmedQuery,
        ...searchHistory.filter(item => item !== trimmedQuery)
      ].slice(0, 10);
      
      localStorage.setItem('admin-search-history', JSON.stringify(updatedHistory));
      
      // Navigate to search results
      navigate(`/admin/search?q=${encodeURIComponent(trimmedQuery)}`);
    } catch (error) {
      console.error('Search error:', error);
      // Fallback: simple navigation without history
      navigate(`/admin/search?q=${encodeURIComponent(trimmedQuery)}`);
    }
  }, [navigate]);

  // Toggle sidebar with responsive handling
  const toggleSidebar = useCallback(() => {
    if (window.innerWidth < 1024) {
      setMobileSidebarOpen(prev => !prev);
    } else {
      setSidebarOpen(prev => !prev);
    }
  }, []);

  // Close mobile sidebar
  const closeMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  // Handle notification interactions
  const handleNotificationClick = useCallback(async (notification) => {
    try {
      // Mark notification as read
      if (notification.unread) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id ? { ...n, unread: false } : n
          )
        );
        
        // Make API call to mark as read
        // await fetch(`/api/admin/notifications/${notification.id}/read`, { method: 'POST' });
      }
      
      // Navigate to related page if available
      if (notification.path) {
        handleNavigate(notification.path);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
      // Still navigate even if marking as read fails
      if (notification.path) {
        handleNavigate(notification.path);
      }
    }
  }, [handleNavigate]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, unread: false }))
      );
      
      // Make API call to mark all as read
      // await fetch('/api/admin/notifications/mark-all-read', { method: 'POST' });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="admin-loading-screen" role="status" aria-label="Loading admin dashboard">
        <div className="admin-loading-spinner">
          <div className="spinner-ring" aria-hidden="true" />
          <p>Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  // Authentication guard
  if (!isAuthenticated || !isAdmin()) {
    return (
      <div className="admin-auth-required">
        <div className="auth-prompt">
          <h2>Admin Access Required</h2>
          <p>Please log in with admin credentials to access the dashboard.</p>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/auth/login', { replace: true })}
            type="button"
          >
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminHeader
        user={user}
        onToggleSidebar={toggleSidebar}
        notifications={notifications}
        unreadCount={unreadCount}
        onSearch={handleSearch}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
      />

      <div className="admin-layout-body">
        <AdminSidebar
          isOpen={sidebarOpen}
          isMobileOpen={mobileSidebarOpen}
          onClose={closeMobileSidebar}
          currentPath={location.pathname}
          onNavigate={handleNavigate}
          menuBadges={menuBadges}
        />

        <main 
          className={`admin-main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}
          role="main"
          aria-label="Admin dashboard content"
        >
          <div className="admin-content-wrapper">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div 
          className="admin-mobile-overlay" 
          onClick={closeMobileSidebar} 
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              closeMobileSidebar();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
        />
      )}
    </div>
  );
};

export default React.memo(AdminLayout);