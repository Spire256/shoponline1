// src/components/common/ProtectedRoute/ClientRoute.js
import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
//import Loading from '../Loading/Spinner';
import Loading from '../UI/Loading/Spinner'; // Fixed: Added UI folder
//import Alert from '../UI/Alert/Alert';        // Fixed: Added UI folder

/**
 * ClientRoute component for protecting client-only routes
 * Ensures user has client role (@gmail.com email) before allowing access
 */
const ClientRoute = ({
  children,
  redirectTo = '/login',
  fallback = null,
  allowAdmin = false, // Whether to allow admin users to access client routes
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loading />
          <p className="mt-4 text-blue-600 font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  // Check if user has client role or admin role (if allowed)
  const isClient = user?.role === 'client' || user?.email?.endsWith('@gmail.com');
  const isAdmin = user?.role === 'admin' || user?.email?.endsWith('@shoponline.com');

  const hasAccess = isClient || (allowAdmin && isAdmin);

  if (!hasAccess) {
    // If fallback component is provided, show it
    if (fallback) {
      return fallback;
    }

    // Show access denied message for users without client access
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Client Access Required</h2>

            <p className="text-gray-600 mb-6">
              This area is restricted to client accounts. Please register with a Gmail account to
              access these features.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => window.history.back()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Go Back
              </button>

              <Link
                to="/register"
                className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-center"
              >
                Register as Client
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User has appropriate access, render children
  return children;
};

export default ClientRoute;