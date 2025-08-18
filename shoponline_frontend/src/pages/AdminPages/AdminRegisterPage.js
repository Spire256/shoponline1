import React, { useState, useEffect } from 'react';
import {
  Shield,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';

const AdminRegisterPage = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: '',
    invitation_token: '',
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [invitationData, setInvitationData] = useState(null);
  const [validatingToken, setValidatingToken] = useState(true);

  // Extract token from URL params (mock implementation)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token') || 'demo-token-123';

    if (token) {
      setFormData(prev => ({ ...prev, invitation_token: token }));
      validateInvitationToken(token);
    } else {
      setValidatingToken(false);
      setErrors({ token: 'Invalid invitation link' });
    }
  }, []);

  const validateInvitationToken = async token => {
    setValidatingToken(true);
    try {
      // Mock API call to validate token
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock successful validation
      setInvitationData({
        email: 'newadmin@shoponline.com',
        invited_by: 'John Doe',
        expires_at: '2024-01-15T10:30:00Z',
      });
      setValidatingToken(false);
    } catch (error) {
      setErrors({ token: 'Invalid or expired invitation token' });
      setValidatingToken(false);
    }
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!formData.password_confirm) {
      newErrors.password_confirm = 'Please confirm your password';
    } else if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Mock API call for admin registration
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Admin registration successful', formData);

      // Show success message or redirect
      alert('Admin account created successfully! You can now login.');
    } catch (error) {
      setErrors({
        submit: 'Registration failed. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while validating token
  if (validatingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Validating Invitation</h2>
          <div className="flex items-center justify-center space-x-2 text-blue-600">
            <Clock className="h-5 w-5 animate-spin" />
            <span>Please wait...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error if token is invalid
  if (errors.token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="mx-auto h-16 w-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
            <AlertCircle className="h-8 w-8 text-white" />
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Invitation</h2>
            <p className="text-red-600 mb-6">{errors.token}</p>
            <button
              onClick={() => (window.location.href = '/admin/login')}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Create Admin Account</h2>
          <p className="mt-2 text-sm text-gray-600">Complete your admin registration</p>
        </div>

        {/* Invitation Info */}
        {invitationData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-green-800">
                  <strong>Invitation for:</strong> {invitationData.email}
                </p>
                <p className="text-green-700 mt-1">
                  <strong>Invited by:</strong> {invitationData.invited_by}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <div className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-700">{errors.submit}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* First Name */}
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  required
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ${
                    errors.first_name
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="Enter your first name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                />
              </div>
              {errors.first_name && (
                <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  required
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ${
                    errors.last_name
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="Enter your last name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                />
              </div>
              {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>}
            </div>

            {/* Email Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={invitationData?.email || ''}
                  disabled
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">Email is pre-filled from your invitation</p>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className={`block w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ${
                    errors.password
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              <div className="mt-2 text-xs text-gray-600">
                <p>Password must contain:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li
                    className={formData.password.length >= 8 ? 'text-green-600' : 'text-gray-600'}
                  >
                    At least 8 characters
                  </li>
                  <li
                    className={
                      /(?=.*[a-z])/.test(formData.password) ? 'text-green-600' : 'text-gray-600'
                    }
                  >
                    One lowercase letter
                  </li>
                  <li
                    className={
                      /(?=.*[A-Z])/.test(formData.password) ? 'text-green-600' : 'text-gray-600'
                    }
                  >
                    One uppercase letter
                  </li>
                  <li
                    className={
                      /(?=.*\d)/.test(formData.password) ? 'text-green-600' : 'text-gray-600'
                    }
                  >
                    One number
                  </li>
                </ul>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="password_confirm"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password_confirm"
                  name="password_confirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className={`block w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ${
                    errors.password_confirm
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="Confirm your password"
                  value={formData.password_confirm}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password_confirm && (
                <p className="mt-1 text-sm text-red-600">{errors.password_confirm}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {isLoading ? (
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
                  Creating Account...
                </div>
              ) : (
                'Create Admin Account'
              )}
            </button>
          </div>

          {/* Back to Login */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => console.log('Navigate to login')}
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              Back to Login
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
          <div className="flex">
            <Shield className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Admin Account Security</h3>
              <p className="mt-1 text-sm text-yellow-700">
                Your admin account will have full access to the platform. Please use a strong,
                unique password and keep your credentials secure.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRegisterPage;
