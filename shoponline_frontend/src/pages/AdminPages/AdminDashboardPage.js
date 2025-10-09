// src/pages/AdminPages/AdminDashboardPage.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AdminDashboard from '../../components/admin/Dashboard/AdminDashboard';

const AdminDashboardPage = () => {
  const { user, isLoading, isAuthenticated, isAdmin } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Check authentication and admin status
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAdmin()) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Render the main dashboard - remove Outlet since this is the main dashboard page
  return (
    <div className="admin-dashboard-page">
      <AdminDashboard user={user} />
    </div>
  );
};

export default AdminDashboardPage;