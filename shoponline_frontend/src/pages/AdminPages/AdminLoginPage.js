import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, Mail, Lock, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading, isAuthenticated, user, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Check if already authenticated and redirect
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    } else if (isAuthenticated && user?.role === 'client') {
      // If client tries to access admin login, redirect to homepage
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Clear errors when user starts typing
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [formData, error, clearError]);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear field-specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }

    // Clear global error
    if (error) {
      clearError();
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation - must match Django backend validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (!formData.email.endsWith('@shoponline.com')) {
      newErrors.email = 'Only @shoponline.com admin emails are allowed';
    }

    // Password validation - basic validation, server handles detailed validation
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setShowSuccess(false);

    try {
      // Call the login function from AuthContext which handles the API call
      const result = await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (result.success) {
        // Check if user is admin (matches Django backend role validation)
        if (result.user.role === 'admin' || result.user.email.endsWith('@shoponline.com')) {
          setShowSuccess(true);
          
          // Show success message briefly before redirect
          setTimeout(() => {
            navigate('/admin/dashboard', { replace: true });
          }, 1000);
        } else {
          // User is authenticated but not an admin
          setErrors({
            submit: 'Access denied. Admin privileges required for this portal.',
          });
        }
      } else {
        // Handle different types of errors from the backend
        let errorMessage = 'Login failed. Please try again.';
        
        if (typeof result.error === 'string') {
          errorMessage = result.error;
        } else if (result.error?.detail) {
          errorMessage = result.error.detail;
        } else if (result.error?.non_field_errors) {
          errorMessage = result.error.non_field_errors.join(', ');
        } else if (result.error?.email) {
          setErrors({ email: Array.isArray(result.error.email) ? result.error.email[0] : result.error.email });
          return;
        } else if (result.error?.password) {
          setErrors({ password: Array.isArray(result.error.password) ? result.error.password[0] : result.error.password });
          return;
        }

        setErrors({ submit: errorMessage });
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrors({
        submit: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToStore = () => {
    navigate('/');
  };

  const handleForgotPassword = () => {
    navigate('/auth/forgot-password');
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float-delayed"></div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float-slow"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Back to Store Button */}
        <div className="absolute -top-16 left-0">
          <button
            onClick={handleBackToStore}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors duration-200 group"
            type="button"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="text-sm">Back to Store</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30 mb-6 relative">
            <Shield className="h-10 w-10 text-white" />
            <div className="absolute inset-0 bg-white rounded-2xl opacity-20 blur-sm"></div>
          </div>
          
          <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-3">
            Admin Portal
          </h2>
          <p className="text-slate-400 text-lg">
            Access your administrative dashboard
          </p>
          <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          {/* Success Message */}
          {showSuccess && (
            <div className="mb-6 bg-green-500/20 backdrop-blur-sm border border-green-500/50 rounded-xl p-4 flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-green-200 font-medium">Login Successful!</p>
                <p className="text-sm text-green-300 mt-1">Redirecting to admin dashboard...</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {(errors.submit || error) && !showSuccess && (
            <div className="mb-6 bg-red-500/20 backdrop-blur-sm border border-red-500/50 rounded-xl p-4 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-200 font-medium">Login Failed</p>
                <p className="text-sm text-red-300 mt-1">{errors.submit || error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-200 mb-3">
                Admin Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  disabled={isSubmitting}
                  className={`block w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border-2 rounded-xl 
                    text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 
                    ${
                      errors.email
                        ? 'border-red-500 focus:border-red-400 focus:ring-red-500/20 bg-red-500/10'
                        : 'border-white/20 focus:border-blue-400 focus:ring-blue-500/20 hover:border-white/30'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  placeholder="admin@shoponline.com"
                  value={formData.email}
                  onChange={handleInputChange}
                />
                {formData.email && !errors.email && formData.email.endsWith('@shoponline.com') && (
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                )}
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-200 mb-3">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  className={`block w-full pl-12 pr-16 py-4 bg-white/10 backdrop-blur-sm border-2 rounded-xl 
                    text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 
                    ${
                      errors.password
                        ? 'border-red-500 focus:border-red-400 focus:ring-red-500/20 bg-red-500/10'
                        : 'border-white/20 focus:border-blue-400 focus:ring-blue-500/20 hover:border-white/30'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-white/10 rounded-r-xl transition-colors duration-200"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-200 transition-colors duration-200" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400 hover:text-slate-200 transition-colors duration-200" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isSubmitting}
                />
                <div className={`w-4 h-4 border-2 rounded flex items-center justify-center mr-2 transition-colors duration-200 ${
                  rememberMe 
                    ? 'bg-blue-500 border-blue-500' 
                    : 'border-white/20 bg-white/10'
                }`}>
                  {rememberMe && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm text-slate-300">Remember me</span>
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200 underline-offset-4 hover:underline"
                disabled={isSubmitting}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="group relative w-full flex justify-center py-4 px-6 border border-transparent 
                text-base font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700
                hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 
                focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:shadow-xl transform hover:-translate-y-0.5
                disabled:hover:transform-none disabled:hover:shadow-lg"
            >
              {isSubmitting || isLoading ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </div>
              ) : (
                <>
                  <Shield className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                  Access Admin Dashboard
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-300">Security Notice</h3>
              <p className="mt-1 text-sm text-blue-200">
                Admin access is restricted to authorized personnel only. All login attempts are
                logged and monitored for security purposes.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-slate-400">
            © 2024 ShopOnline Uganda. All rights reserved.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 6s ease-in-out infinite;
          animation-delay: 2s;
        }
        .animate-float-slow {
          animation: float 6s ease-in-out infinite;
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default AdminLoginPage;