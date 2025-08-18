// src/components/common/ProtectedRoute/ProtectedRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
//import Loading from '../Loading/Spinner';
import Loading from '../UI/Loading/Spinner'; // Fixed: Added UI folder
//import Alert from '../UI/Alert/Alert';        // Fixed: Added UI folder

/**
 * ProtectedRoute component for authenticating users before allowing access to routes
 * Redirects unauthenticated users to login page
 */
const ProtectedRoute = ({
  children,
  redirectTo = '/login',
  requireAuth = true,
  fallback = null,
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loading />
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Save the current location for redirect after login
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  // If authentication is not required but user is authenticated (e.g., login page)
  if (!requireAuth && isAuthenticated) {
    // Redirect authenticated users away from login/register pages
    const redirectPath = location.state?.from || (user?.role === 'admin' ? '/admin' : '/');
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
