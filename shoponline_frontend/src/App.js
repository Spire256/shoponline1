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

// Import admin pages - using only existing ones from architecture
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
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <Layout>
              <HomePage />
            </Layout>
          }
        />

        <Route
          path="/categories/:slug"
          element={
            <Layout>
              <CategoryPage />
            </Layout>
          }
        />

        <Route
          path="/products/:slug"
          element={
            <Layout>
              <ProductPage />
            </Layout>
          }
        />

        <Route
          path="/flash-sales"
          element={
            <Layout>
              <FlashSalesPage />
            </Layout>
          }
        />

        <Route
          path="/search"
          element={
            <Layout>
              <SearchPage />
            </Layout>
          }
        />

        <Route
          path="/cart"
          element={
            <Layout>
              <CartPage />
            </Layout>
          }
        />

        {/* Authentication Routes */}
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

        {/* Admin Authentication Routes */}
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

        {/* Client Protected Routes */}
        <Route
          path="/checkout"
          element={
            <ClientRoute>
              <Layout>
                <CheckoutPage />
              </Layout>
            </ClientRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ClientRoute>
              <Layout>
                <ProfilePage />
              </Layout>
            </ClientRoute>
          }
        />

        {/* Admin Protected Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Navigate to="/admin/dashboard" replace />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminDashboardPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/products"
          element={
            <AdminRoute>
              <AdminLayout>
                <ProductManagementPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <AdminLayout>
                <OrderManagementPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/flash-sales"
          element={
            <AdminRoute>
              <AdminLayout>
                <FlashSalesManagementPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/homepage"
          element={
            <AdminRoute>
              <AdminLayout>
                <HomepageManagementPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        {/* Error Routes */}
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