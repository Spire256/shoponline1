// src/hooks/useAuth.js
import { useContext, useCallback } from 'react';
import AuthContext from '../contexts/AuthContext';

/**
 * Custom hook for authentication functionality
 * Provides access to auth state and methods with additional utilities
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
    isAdmin,
    isClient,
  } = context;

  // Enhanced login with error handling and loading state management
  const loginUser = useCallback(
    async credentials => {
      try {
        const result = await login(credentials.email, credentials.password);

        if (result.success) {
          // Could add analytics tracking here
          console.log('User logged in successfully');
          return result;
        } else {
          return result;
        }
      } catch (error) {
        console.error('Login error in hook:', error);
        return { success: false, error: 'Login failed' };
      }
    },
    [login]
  );

  // Enhanced register client with validation
  const registerClientUser = useCallback(
    async userData => {
      try {
        // Basic validation
        if (!userData.email?.endsWith('@gmail.com')) {
          return {
            success: false,
            error: { email: ['Only @gmail.com emails are allowed for client registration'] },
          };
        }

        if (userData.password !== userData.password_confirm) {
          return {
            success: false,
            error: { password: ['Passwords do not match'] },
          };
        }

        const result = await registerClient(userData);

        if (result.success) {
          console.log('Client registered successfully');
        }

        return result;
      } catch (error) {
        console.error('Registration error in hook:', error);
        return { success: false, error: 'Registration failed' };
      }
    },
    [registerClient]
  );

  // Enhanced register admin with invitation validation
  const registerAdminUser = useCallback(
    async userData => {
      try {
        // Validate invitation token first
        const invitationResult = await validateInvitation(userData.invitation_token);

        if (!invitationResult.success) {
          return {
            success: false,
            error: { invitation_token: [invitationResult.error] },
          };
        }

        if (userData.password !== userData.password_confirm) {
          return {
            success: false,
            error: { password: ['Passwords do not match'] },
          };
        }

        const result = await registerAdmin(userData);

        if (result.success) {
          console.log('Admin registered successfully');
        }

        return result;
      } catch (error) {
        console.error('Admin registration error in hook:', error);
        return { success: false, error: 'Admin registration failed' };
      }
    },
    [registerAdmin, validateInvitation]
  );

  // Enhanced logout with cleanup
  const logoutUser = useCallback(async () => {
    try {
      await logout();

      // Clear any additional app state if needed
      // Could dispatch events to other contexts here
      console.log('User logged out successfully');

      return { success: true };
    } catch (error) {
      console.error('Logout error in hook:', error);
      // Still clear local state even if server logout fails
      return { success: true };
    }
  }, [logout]);

  // Update profile with optimistic updates
  const updateUserProfile = useCallback(
    async profileData => {
      try {
        const result = await updateProfile(profileData);

        if (result.success) {
          console.log('Profile updated successfully');
        }

        return result;
      } catch (error) {
        console.error('Profile update error in hook:', error);
        return { success: false, error: 'Failed to update profile' };
      }
    },
    [updateProfile]
  );

  // Check if user has specific permission
  const hasPermission = useCallback(
    permission => {
      if (!isAuthenticated || !user) return false;

      // Admin users have all permissions
      if (isAdmin()) return true;

      // Add specific permission logic here
      const userPermissions = user.permissions || [];
      return userPermissions.includes(permission);
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
      // Decode JWT token to check expiry
      const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
      const expiryTime = tokenPayload.exp * 1000; // Convert to milliseconds
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

  // Validate current session
  const validateSession = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      return { valid: false, error: 'No active session' };
    }

    try {
      // Make a test API call to validate token
      const response = await fetch('/api/accounts/profile/', {
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
    validateInvitation,
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

    // Raw methods (for advanced use)
    refreshToken: refreshTokenMethod,
  };
};

export default useAuth;
