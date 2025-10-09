import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import contexts - Fixed: Use proper hook instead of direct context
import { useAuth } from './hooks/useAuth';
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

// Import support and information pages
import HelpPage from './pages/HelpPage/HelpPage';
import ContactPage from './pages/ContactPage/ContactPage';
import AboutPage from './pages/AboutPage/AboutPage';

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
  // Fixed: Use proper hook destructuring with correct property names
  const { user, isLoading, isAuthenticated, isAdmin } = useAuth();
  const { notifications } = useNotifications();

  // Fixed: Remove checkAuthStatus as it's handled automatically by AuthContext

  // Show loading overlay while checking authentication
  if (isLoading) {
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
          
          {/* Support and Information Pages */}
          <Route path="help" element={<HelpPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="about" element={<AboutPage />} />
          
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
          
          {/* User Account Routes - Protected */}
          <Route
            path="orders"
            element={
              <ClientRoute>
                <ProfilePage />
              </ClientRoute>
            }
          />
          
          <Route
            path="wishlist"
            element={
              <ClientRoute>
                <ProfilePage />
              </ClientRoute>
            }
          />
        </Route>

        {/* Authentication Routes - Standalone (no layout) */}
        {/* Fixed: Use proper authentication checks */}
        <Route 
          path="/auth/login" 
          element={isAuthenticated ? <Navigate to={isAdmin() ? "/admin/dashboard" : "/"} replace /> : <Login />} 
        />
        <Route 
          path="/auth/register" 
          element={isAuthenticated ? <Navigate to={isAdmin() ? "/admin/dashboard" : "/"} replace /> : <Register />} 
        />
        <Route
          path="/auth/admin/register/:token"
          element={
            isAuthenticated && isAdmin() ? <Navigate to="/admin/dashboard" replace /> : <AdminRegister />
          }
        />
        <Route
          path="/auth/forgot-password"
          element={isAuthenticated ? <Navigate to={isAdmin() ? "/admin/dashboard" : "/"} replace /> : <ForgotPassword />}
        />

        {/* Legacy routes for backwards compatibility */}
        <Route path="/login" element={<Navigate to="/auth/login" replace />} />
        <Route path="/register" element={<Navigate to="/auth/register" replace />} />

        {/* Admin Authentication Routes - Standalone */}
        <Route
          path="/admin/login"
          element={
            isAuthenticated && isAdmin() ? <Navigate to="/admin/dashboard" replace /> : <AdminLoginPage />
          }
        />
        <Route
          path="/admin/register"
          element={
            isAuthenticated && isAdmin() ? (
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

      {/* Admin Notifications - Fixed: Use proper admin check */}
      {isAuthenticated && isAdmin() && notifications.length > 0 && <NotificationCenter />}
    </div>
  );
}

export default App;