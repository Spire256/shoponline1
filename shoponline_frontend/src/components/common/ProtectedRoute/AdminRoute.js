// src/components/common/ProtectedRoute/AdminRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import Loading from '../UI/Loading/Spinner';

/**
 * AdminRoute component for protecting admin-only routes
 * Ensures user has admin role before allowing access
 */
const AdminRoute = ({ 
  children, 
  redirectTo = '/auth/login',
  fallback = null 
}) => {
  const { user, isLoading, isAuthenticated, isAdmin, role } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loading />
          <p className="mt-4 text-blue-600 font-medium">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Enhanced admin access check with multiple fallback methods
  const hasAdminAccess = (() => {
    if (!user) return false;

    // Method 1: Use the isAdmin function from hook (primary method)
    if (typeof isAdmin === 'function') {
      try {
        const hookResult = isAdmin();
        if (hookResult) return true;
      } catch (error) {
        console.warn('isAdmin function error:', error);
      }
    }

    // Method 2: Check role from context state
    if (role === 'admin') return true;

    // Method 3: Check user object role property
    if (user.role === 'admin') return true;

    // Method 4: Check Django-style is_staff flag
    if (user.is_staff === true) return true;

    // Method 5: Check email domain as fallback (for admin@shoponline.com)
    if (user.email && user.email.endsWith('@shoponline.com')) return true;

    // Method 6: Check stored user data directly (fallback)
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (storedUser && (
        storedUser.role === 'admin' || 
        storedUser.is_staff === true ||
        (storedUser.email && storedUser.email.endsWith('@shoponline.com'))
      )) {
        return true;
      }
    } catch (error) {
      console.warn('Error checking stored user:', error);
    }

    return false;
  })();

  // Enhanced debug logging for troubleshooting
  if (process.env.NODE_ENV === 'development') {
    console.log('AdminRoute Debug Info:', {
      user,
      role,
      isAuthenticated,
      hasAdminAccess,
      isAdminFunction: typeof isAdmin === 'function' ? isAdmin() : 'not a function',
      userRole: user?.role,
      userIsStaff: user?.is_staff,
      userEmail: user?.email,
      location: location.pathname,
      tokenExists: Boolean(localStorage.getItem('access_token')),
      storedUser: (() => {
        try {
          return JSON.parse(localStorage.getItem('user') || 'null');
        } catch {
          return 'parse error';
        }
      })(),
    });
  }

  if (!hasAdminAccess) {
    // If fallback component is provided, show it
    if (fallback) {
      return fallback;
    }

    // Show enhanced access denied message with debug info
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
            
            <p className="text-gray-600 mb-4">
              You don't have permission to access this area. Admin access is required.
            </p>

            {/* Debug info for development environment */}
            {process.env.NODE_ENV === 'development' && user && (
              <div className="bg-gray-100 p-3 rounded text-sm text-left mb-4">
                <p className="font-semibold mb-2">Debug Info:</p>
                <p>Email: {user.email || 'undefined'}</p>
                <p>Role: {user.role || 'undefined'}</p>
                <p>Is Staff: {String(user.is_staff)}</p>
                <p>Context Role: {role || 'undefined'}</p>
                <p>isAdmin(): {String(typeof isAdmin === 'function' ? isAdmin() : 'not function')}</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => window.history.back()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Go Back
              </button>
              
              <button
                onClick={() => {
                  // Clear auth data and redirect to login
                  localStorage.clear();
                  window.location.href = '/auth/login';
                }}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Logout and Try Different Account
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Return to Homepage
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated and has admin role, render children
  return children;
};

export default AdminRoute;