import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import contexts
import { useAuth } from './contexts/AuthContext';
import { useNotifications } from './contexts/NotificationContext';

// Import layout components
import Layout from './components/common/Layout/Layout';
import AdminLayout from './components/admin/Layout/AdminLayout';

// Import pages
import HomePage from './pages/HomePage/HomePage';
import CategoryPage from './pages/CategoryPage/CategoryPage';
import ProductPage from './pages/ProductPage/ProductPage';
import FlashSalesPage from './pages/FlashSalesPage/FlashSalesPage';
import CartPage from './pages/CartPage/CartPage';
import CheckoutPage from './pages/CheckoutPage/CheckoutPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import SearchPage from './pages/SearchPage/SearchPage';

// Import auth pages
import Login from './components/auth/Login/Login';
import Register from './components/auth/Register/Register';
import AdminRegister from './components/auth/Register/AdminRegister';
import ForgotPassword from './components/auth/ForgotPassword/ForgotPassword';

// Import admin pages
import AdminDashboardPage from './pages/AdminPages/AdminDashboardPage';
import AdminLoginPage from './pages/AdminPages/AdminLoginPage';
import AdminRegisterPage from './pages/AdminPages/AdminRegisterPage';
import ProductManagementPage from './pages/AdminPages/ProductManagementPage';
import OrderManagementPage from './pages/AdminPages/OrderManagementPage';
import FlashSalesManagementPage from './pages/AdminPages/FlashSalesManagementPage';
import HomepageManagementPage from './pages/AdminPages/HomepageManagementPage';

// Import error pages
import NotFound from './pages/ErrorPages/NotFound';
import ServerError from './pages/ErrorPages/ServerError';
import Unauthorized from './pages/ErrorPages/Unauthorized';

// Import protected route components
import ProtectedRoute from './components/common/ProtectedRoute/ProtectedRoute';
import AdminRoute from './components/common/ProtectedRoute/AdminRoute';
import ClientRoute from './components/common/ProtectedRoute/ClientRoute';

// Import notification components
import NotificationCenter from './components/admin/Notifications/NotificationCenter';

// Import loading component
import LoadingOverlay from './components/common/UI/Loading/LoadingOverlay';

function App() {
  const { user, loading, checkAuthStatus } = useAuth();
  const { notifications } = useNotifications();

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Show loading overlay while checking authentication
  if (loading) {
    return <LoadingOverlay message="Initializing ShopOnline..." />;
  }

  return (
    <div className="App">
      <Routes>
        {/* Main Layout Routes - Using Outlet pattern */}
        <Route path="/" element={<Layout />}>
          {/* Public Routes */}
          <Route index element={<HomePage />} />
          <Route path="categories/:slug" element={<CategoryPage />} />
          <Route path="products/:slug" element={<ProductPage />} />
          <Route path="flash-sales" element={<FlashSalesPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="cart" element={<CartPage />} />
          
          {/* Client Protected Routes */}
          <Route
            path="checkout"
            element={
              <ClientRoute>
                <CheckoutPage />
              </ClientRoute>
            }
          />
          
          <Route
            path="profile"
            element={
              <ClientRoute>
                <ProfilePage />
              </ClientRoute>
            }
          />
        </Route>

        {/* Authentication Routes - Standalone (no layout) */}
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
        <Route
          path="/admin/register/:token"
          element={
            user?.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> : <AdminRegister />
          }
        />
        <Route
          path="/forgot-password"
          element={user ? <Navigate to="/" replace /> : <ForgotPassword />}
        />

        {/* Admin Authentication Routes - Standalone */}
        <Route
          path="/admin/login"
          element={
            user?.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> : <AdminLoginPage />
          }
        />
        <Route
          path="/admin/register-page"
          element={
            user?.role === 'admin' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <AdminRegisterPage />
            )
          }
        />

        {/* Admin Routes - Using AdminLayout with Outlet */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="products" element={<ProductManagementPage />} />
          <Route path="orders" element={<OrderManagementPage />} />
          <Route path="flash-sales" element={<FlashSalesManagementPage />} />
          <Route path="homepage" element={<HomepageManagementPage />} />
        </Route>

        {/* Error Routes - Standalone */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/server-error" element={<ServerError />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Admin Notifications */}
      {user?.role === 'admin' && notifications.length > 0 && <NotificationCenter />}
    </div>
  );
}

export default App;