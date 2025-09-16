// src/hooks/useAuth.js
import { useContext, useCallback } from 'react';
import AuthContext from '../contexts/AuthContext';

/**
 * Custom hook for authentication functionality
 * Provides access to auth state and methods with additional utilities
 * Enhanced with robust admin checking
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isLoading,
    error,
    role,
    login,
    registerClient,
    registerAdmin,
    logout,
    refreshToken: refreshTokenMethod,
    updateProfile,
    validateInvitation,
    clearError,
    isAdmin: contextIsAdmin,
    isClient: contextIsClient,
  } = context;

  // Enhanced isAdmin function with multiple fallback checks
  const isAdmin = useCallback(() => {
    if (!isAuthenticated || !user) return false;

    // Method 1: Use context isAdmin function
    if (typeof contextIsAdmin === 'function') {
      try {
        const result = contextIsAdmin();
        if (result) return true;
      } catch (error) {
        console.warn('Context isAdmin function error:', error);
      }
    }

    // Method 2: Check role from context
    if (role === 'admin') return true;

    // Method 3: Check user role property
    if (user.role === 'admin') return true;

    // Method 4: Check Django-style is_staff flag
    if (user.is_staff === true) return true;

    // Method 5: Check email domain (fallback for admin@shoponline.com)
    if (user.email && user.email.endsWith('@shoponline.com')) return true;

    // Method 6: Check stored user data as final fallback
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (storedUser && (
        storedUser.role === 'admin' || 
        storedUser.is_staff === true ||
        (storedUser.email && storedUser.email.endsWith('@shoponline.com'))
      )) {
        return true;
      }
    } catch (error) {
      console.warn('Error checking stored user for admin status:', error);
    }

    return false;
  }, [isAuthenticated, user, contextIsAdmin, role]);

  // Enhanced isClient function
  const isClient = useCallback(() => {
    if (!isAuthenticated || !user) return false;

    // If user is admin, they can also access client features
    if (isAdmin()) return true;

    // Method 1: Use context isClient function
    if (typeof contextIsClient === 'function') {
      try {
        const result = contextIsClient();
        if (result) return true;
      } catch (error) {
        console.warn('Context isClient function error:', error);
      }
    }

    // Method 2: Check role
    if (role === 'client' || user.role === 'client') return true;

    // Method 3: Default to client if authenticated but not admin
    return !isAdmin();
  }, [isAuthenticated, user, contextIsClient, role, isAdmin]);

  // Enhanced login with proper credentials object handling
  const loginUser = useCallback(
    async (credentials, password = null) => {
      try {
        // Handle both object and separate parameter formats
        let loginCredentials;
        if (typeof credentials === 'object' && credentials.email && credentials.password) {
          loginCredentials = credentials;
        } else if (typeof credentials === 'string' && password) {
          // Handle case where email and password are separate parameters
          loginCredentials = { email: credentials, password };
        } else {
          throw new Error('Invalid credentials format');
        }

        const result = await login(loginCredentials);

        if (result.success) {
          console.log('User logged in successfully:', {
            email: result.user?.email,
            role: result.user?.role,
            is_staff: result.user?.is_staff,
            isAdmin: result.user?.role === 'admin' || result.user?.is_staff === true
          });
          return result;
        } else {
          return result;
        }
      } catch (error) {
        console.error('Login error in hook:', error);
        return { success: false, error: error.message || 'Login failed' };
      }
    },
    [login]
  );

  // Enhanced register client with proper validation
  const registerClientUser = useCallback(
    async userData => {
      try {
        // Map form fields to API format
        const mappedData = {
          email: userData.email,
          first_name: userData.firstName || userData.first_name,
          last_name: userData.lastName || userData.last_name,
          password: userData.password,
          password_confirm: userData.passwordConfirm || userData.password_confirm,
          phone_number: userData.phoneNumber || userData.phone_number || '',
        };

        // Basic validation
        if (!mappedData.email?.endsWith('@gmail.com')) {
          return {
            success: false,
            error: { email: ['Only @gmail.com emails are allowed for client registration'] },
          };
        }

        if (mappedData.password !== mappedData.password_confirm) {
          return {
            success: false,
            error: { password_confirm: ['Passwords do not match'] },
          };
        }

        const result = await registerClient(mappedData);

        if (result.success) {
          console.log('Client registered successfully');
        }

        return result;
      } catch (error) {
        console.error('Registration error in hook:', error);
        return { success: false, error: error.message || 'Registration failed' };
      }
    },
    [registerClient]
  );

  // Enhanced register admin with proper token handling
  const registerAdminUser = useCallback(
    async userData => {
      try {
        // Map form fields to API format
        const mappedData = {
          first_name: userData.firstName || userData.first_name,
          last_name: userData.lastName || userData.last_name,
          password: userData.password,
          password_confirm: userData.passwordConfirm || userData.password_confirm,
          invitation_token: userData.invitationToken || userData.invitation_token,
        };

        // Validate required fields
        if (!mappedData.invitation_token) {
          return {
            success: false,
            error: { invitation_token: ['Invitation token is required'] },
          };
        }

        if (mappedData.password !== mappedData.password_confirm) {
          return {
            success: false,
            error: { password_confirm: ['Passwords do not match'] },
          };
        }

        const result = await registerAdmin(mappedData);

        if (result.success) {
          console.log('Admin registered successfully');
        }

        return result;
      } catch (error) {
        console.error('Admin registration error in hook:', error);
        return { success: false, error: error.message || 'Admin registration failed' };
      }
    },
    [registerAdmin]
  );

  // Enhanced logout with proper cleanup
  const logoutUser = useCallback(async () => {
    try {
      await logout();
      console.log('User logged out successfully');
      return { success: true };
    } catch (error) {
      console.error('Logout error in hook:', error);
      // Still return success since local cleanup should happen regardless
      return { success: true };
    }
  }, [logout]);

  // Update profile with proper data mapping
  const updateUserProfile = useCallback(
    async profileData => {
      try {
        // Handle both FormData and regular object
        let updateData = profileData;

        // If it's FormData, convert to regular object for processing
        if (profileData instanceof FormData) {
          updateData = {};
          for (let [key, value] of profileData.entries()) {
            updateData[key] = value;
          }
        }

        const result = await updateProfile(updateData);

        if (result.success) {
          console.log('Profile updated successfully');
        }

        return result;
      } catch (error) {
        console.error('Profile update error in hook:', error);
        return { success: false, error: error.message || 'Failed to update profile' };
      }
    },
    [updateProfile]
  );

  // Enhanced permission checking
  const hasPermission = useCallback(
    permission => {
      if (!isAuthenticated || !user) return false;

      // Admin users have all permissions
      if (isAdmin()) return true;

      // Basic permission mapping for clients
      const clientPermissions = [
        'view_profile',
        'edit_profile',
        'place_orders',
        'view_orders',
        'make_payments',
        'view_products',
        'view_categories',
        'view_flash_sales',
        'add_to_cart',
        'manage_wishlist',
      ];

      return clientPermissions.includes(permission);
    },
    [isAuthenticated, user, isAdmin]
  );

  // Check if user can access admin features
  const canAccessAdmin = useCallback(() => {
    return isAuthenticated && isAdmin();
  }, [isAuthenticated, isAdmin]);

  // Check if user can access client features
  const canAccessClient = useCallback(() => {
    return isAuthenticated && (isClient() || isAdmin());
  }, [isAuthenticated, isClient, isAdmin]);

  // Get user display name
  const getUserDisplayName = useCallback(() => {
    if (!user) return '';

    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }

    if (user.full_name) {
      return user.full_name;
    }

    return user.email || '';
  }, [user]);

  // Get user initials for avatar
  const getUserInitials = useCallback(() => {
    if (!user) return '';

    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }

    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }

    return 'U';
  }, [user]);

  // Check if token is about to expire (within 5 minutes)
  const isTokenExpiringSoon = useCallback(() => {
    if (!accessToken) return false;

    try {
      // Simple JWT decode - just get the payload
      const tokenParts = accessToken.split('.');
      if (tokenParts.length !== 3) return true;

      const payload = JSON.parse(atob(tokenParts[1]));
      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      return expiryTime - currentTime < fiveMinutes;
    } catch (error) {
      console.error('Token parsing error:', error);
      return true; // Assume expiring if we can't parse
    }
  }, [accessToken]);

  // Auto-refresh token if needed
  const ensureValidToken = useCallback(async () => {
    if (!isAuthenticated) return { success: false, error: 'Not authenticated' };

    if (isTokenExpiringSoon()) {
      console.log('Token expiring soon, refreshing...');
      const result = await refreshTokenMethod();

      if (!result.success) {
        // Force logout if refresh fails
        await logoutUser();
        return { success: false, error: 'Session expired' };
      }
    }

    return { success: true, token: accessToken };
  }, [isAuthenticated, isTokenExpiringSoon, refreshTokenMethod, accessToken, logoutUser]);

  // Get authorization header for API calls
  const getAuthHeader = useCallback(() => {
    if (!accessToken) return {};

    return {
      Authorization: `Bearer ${accessToken}`,
    };
  }, [accessToken]);

  // Enhanced session validation
  const validateSession = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      return { valid: false, error: 'No active session' };
    }

    try {
      // Get the base URL from environment
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      const apiUrl = baseUrl.includes('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;

      const response = await fetch(`${apiUrl}/auth/profile/`, {
        headers: getAuthHeader(),
      });

      if (response.ok) {
        return { valid: true };
      } else if (response.status === 401) {
        // Try to refresh token
        const refreshResult = await refreshTokenMethod();

        if (refreshResult.success) {
          return { valid: true };
        } else {
          await logoutUser();
          return { valid: false, error: 'Session expired' };
        }
      } else {
        return { valid: false, error: 'Session validation failed' };
      }
    } catch (error) {
      console.error('Session validation error:', error);
      return { valid: false, error: 'Network error' };
    }
  }, [isAuthenticated, accessToken, getAuthHeader, refreshTokenMethod, logoutUser]);

  // Clear authentication errors
  const clearAuthError = useCallback(() => {
    clearError();
  }, [clearError]);

  // Enhanced invitation validation
  const validateInvitationToken = useCallback(
    async token => {
      try {
        if (!token) {
          return { success: false, error: 'Token is required' };
        }

        const result = await validateInvitation(token);
        return result;
      } catch (error) {
        console.error('Invitation validation error:', error);
        return { success: false, error: error.message || 'Failed to validate invitation' };
      }
    },
    [validateInvitation]
  );

  // Debug function for troubleshooting (development only)
  const getDebugInfo = useCallback(() => {
    if (process.env.NODE_ENV !== 'development') {
      return 'Debug info only available in development mode';
    }

    return {
      // Auth state
      isAuthenticated,
      isLoading,
      role,
      error,

      // User info
      user,
      userEmail: user?.email,
      userRole: user?.role,
      userIsStaff: user?.is_staff,

      // Token info
      hasAccessToken: Boolean(accessToken),
      hasRefreshToken: Boolean(refreshToken),
      tokenExpiringSoon: isTokenExpiringSoon(),

      // Permission checks
      isAdmin: isAdmin(),
      isClient: isClient(),
      canAccessAdmin: canAccessAdmin(),
      canAccessClient: canAccessClient(),

      // Storage
      storedUser: (() => {
        try {
          return JSON.parse(localStorage.getItem('user') || 'null');
        } catch {
          return 'parse error';
        }
      })(),
      storedTokens: {
        access_token: localStorage.getItem('access_token'),
        refresh_token: localStorage.getItem('refresh_token'),
      },
    };
  }, [
    isAuthenticated, isLoading, role, error, user, accessToken, refreshToken,
    isTokenExpiringSoon, isAdmin, isClient, canAccessAdmin, canAccessClient
  ]);

  return {
    // State
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isLoading,
    error,
    role,

    // Enhanced Actions
    login: loginUser,
    registerClient: registerClientUser,
    registerAdmin: registerAdminUser,
    logout: logoutUser,
    updateProfile: updateUserProfile,
    validateInvitation: validateInvitationToken,
    clearError: clearAuthError,

    // Permission Checks
    isAdmin,
    isClient,
    hasPermission,
    canAccessAdmin,
    canAccessClient,

    // Utilities
    getUserDisplayName,
    getUserInitials,
    getAuthHeader,
    ensureValidToken,
    validateSession,
    isTokenExpiringSoon,

    // Debug (development only)
    getDebugInfo,

    // Raw methods (for advanced use)
    refreshToken: refreshTokenMethod,
  };
};

export default useAuth;