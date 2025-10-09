// src/components/common/ProtectedRoute/ProtectedRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import Loading from '../UI/Loading/Spinner';

/**
 * ProtectedRoute component for authenticating users before allowing access to routes
 * Redirects unauthenticated users to login page
 */
const ProtectedRoute = ({
  children,
  redirectTo = '/auth/login', // Fixed: Use proper auth route
  requireAuth = true,
  fallback = null,
}) => {
  // Fixed: Use proper property names from useAuth hook
  const { user, isLoading, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loading />
          <p className="mt-4 text-blue-600 font-medium">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Save the current location for redirect after login
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If authentication is not required but user is authenticated (e.g., login page)
  if (!requireAuth && isAuthenticated) {
    // Fixed: Use proper admin check function and redirect logic
    const redirectPath = location.state?.from?.pathname || (isAdmin() ? '/admin/dashboard' : '/');
    return <Navigate to={redirectPath} replace />;
  }

  // Show fallback component if provided and conditions aren't met
  if (fallback && requireAuth && !isAuthenticated) {
    return fallback;
  }

  // Render children if all conditions are met
  return children;
};

export default ProtectedRoute;