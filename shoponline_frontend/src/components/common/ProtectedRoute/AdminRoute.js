// src/components/common/ProtectedRoute/AdminRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import Loading from '../UI/Loading/Spinner'; // Fixed: Added UI folder
import Alert from '../UI/Alert/Alert'; // Fixed: Added UI folder

/**
 * AdminRoute component for protecting admin-only routes
 * Ensures user has admin role (@shoponline.com email) before allowing access
 */
const AdminRoute = ({
  children,
  redirectTo = '/login',
  fallback = null
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
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
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  // Check if user has admin role
  const isAdmin = user?.role === 'admin' || user?.email?.endsWith('@shoponline.com');

  if (!isAdmin) {
    // If fallback component is provided, show it
    if (fallback) {
      return fallback;
    }

    // Show access denied message for non-admin users
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

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>

            <p className="text-gray-600 mb-6">
              You don't have permission to access this area. Admin access is required.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => window.history.back()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Go Back
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
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