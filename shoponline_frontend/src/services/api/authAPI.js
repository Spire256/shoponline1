// src/services/api/authAPI.js
import apiClient, { handleApiResponse, handleApiError } from './apiClient';

// Fixed: Use consistent storage keys throughout
const getAccessToken = () => {
  return localStorage.getItem('access_token') || 
         localStorage.getItem('accessToken') || 
         localStorage.getItem('shoponline_access_token');
};

const getRefreshToken = () => {
  return localStorage.getItem('refresh_token') || 
         localStorage.getItem('refreshToken') || 
         localStorage.getItem('shoponline_refresh_token');
};

// Fixed: Store tokens with consistent keys only
const storeTokens = (accessToken, refreshToken) => {
  if (accessToken) {
    localStorage.setItem('access_token', accessToken);
  }
  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken);
  }
};

// Fixed: Clear all tokens from all storage locations
const clearAllTokens = () => {
  const keysToRemove = [
    'access_token',
    'refresh_token',
    'user',
    // Legacy keys for backwards compatibility
    'accessToken',
    'refreshToken',
    'shoponline_access_token',
    'shoponline_refresh_token',
    'shoponline_user',
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
};

const authAPI = {
  // Client Registration - Fixed to match backend field names
  registerClient: async userData => {
    try {
      const response = await apiClient.post('/auth/register/client/', {
        email: userData.email,
        first_name: userData.first_name || userData.firstName,
        last_name: userData.last_name || userData.lastName,
        password: userData.password,
        password_confirm: userData.password_confirm || userData.passwordConfirm,
        phone_number: userData.phone_number || userData.phoneNumber || '',
      });
      
      const data = handleApiResponse(response);
      
      // Store tokens and user data with consistent keys
      if (data.tokens) {
        storeTokens(data.tokens.access, data.tokens.refresh);
      }
      
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Admin Registration - Fixed to match backend field names
  registerAdmin: async userData => {
    try {
      const response = await apiClient.post('/auth/register/admin/', {
        first_name: userData.first_name || userData.firstName,
        last_name: userData.last_name || userData.lastName,
        password: userData.password,
        password_confirm: userData.password_confirm || userData.passwordConfirm,
        invitation_token: userData.invitation_token || userData.invitationToken,
      });
      
      const data = handleApiResponse(response);
      
      // Store tokens and user data with consistent keys
      if (data.tokens) {
        storeTokens(data.tokens.access, data.tokens.refresh);
      }
      
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Login - Fixed to match backend expectations
  login: async credentials => {
    try {
      const response = await apiClient.post('/auth/login/', {
        email: credentials.email,
        password: credentials.password,
      });
      
      const data = handleApiResponse(response);

      // Store tokens and user data with consistent keys
      if (data.tokens) {
        storeTokens(data.tokens.access, data.tokens.refresh);
      }
      
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Logout
  logout: async () => {
    try {
      const refreshToken = getRefreshToken();
      const accessToken = getAccessToken();
      
      if (refreshToken && accessToken) {
        await apiClient.post('/auth/logout/', {
          refresh: refreshToken,
        }, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      clearAllTokens();
    }
  },

  // Refresh Token
  refreshToken: async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post('/auth/token/refresh/', {
        refresh: refreshToken,
      });

      const data = handleApiResponse(response);

      // Store new tokens with consistent keys
      storeTokens(data.access, data.refresh || refreshToken);

      return data;
    } catch (error) {
      clearAllTokens();
      throw handleApiError(error);
    }
  },

  // Get Current User Profile
  getProfile: async () => {
    try {
      const response = await apiClient.get('/auth/profile/');
      const data = handleApiResponse(response);
      
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(data));
      
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update User Profile
  updateProfile: async userData => {
    try {
      const response = await apiClient.patch('/auth/profile/', userData);
      const data = handleApiResponse(response);

      // Update stored user data
      const currentUser = localStorage.getItem('user');
      if (currentUser) {
        const user = JSON.parse(currentUser);
        const updatedUser = { ...user, ...data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Validate invitation token
  validateInvitation: async token => {
    try {
      const response = await apiClient.get(`/auth/invitations/validate/${token}/`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Check authentication status
  checkAuthStatus: async () => {
    try {
      const token = getAccessToken();
      const user = localStorage.getItem('user');
      const refreshToken = getRefreshToken();

      if (!token || !user || !refreshToken) {
        return { isAuthenticated: false, user: null };
      }

      // Verify token by making a profile request
      const response = await apiClient.get('/auth/profile/');
      const profileData = handleApiResponse(response);

      // Update stored user data
      localStorage.setItem('user', JSON.stringify(profileData));

      return {
        isAuthenticated: true,
        user: profileData,
        accessToken: token,
        refreshToken: refreshToken,
      };
    } catch (error) {
      clearAllTokens();
      return { isAuthenticated: false, user: null };
    }
  },

  // Fixed: Helper methods with enhanced admin detection
  isAuthenticated: () => {
    const token = getAccessToken();
    const user = localStorage.getItem('user');
    return Boolean(token && user);
  },

  getUserRole: () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.role || (user.is_staff ? 'admin' : 'client');
      }
      return null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  isAdmin: () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.role === 'admin' || 
               user.is_staff === true ||
               (user.email && user.email.endsWith('@shoponline.com'));
      }
      return false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  },

  isClient: () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.role === 'client' || (!authAPI.isAdmin() && authAPI.isAuthenticated());
      }
      return false;
    } catch (error) {
      console.error('Error checking client status:', error);
      return false;
    }
  },

  getUserData: () => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  clearAuthData: () => {
    clearAllTokens();
  },

  getAccessToken: () => {
    return getAccessToken();
  },

  getRefreshToken: () => {
    return getRefreshToken();
  },

  // Additional helper methods
  hasPermission: (permission) => {
    if (!authAPI.isAuthenticated()) return false;
    if (authAPI.isAdmin()) return true; // Admins have all permissions
    
    // Basic client permissions
    const clientPermissions = [
      'view_profile',
      'edit_profile', 
      'place_orders',
      'view_orders',
      'make_payments',
      'view_products',
      'view_categories',
      'view_flash_sales',
    ];
    
    return clientPermissions.includes(permission);
  },

  // Get formatted user display name
  getUserDisplayName: () => {
    const user = authAPI.getUserData();
    if (!user) return '';

    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }

    if (user.full_name) {
      return user.full_name;
    }

    return user.email || 'User';
  },

  // Get user initials for avatar
  getUserInitials: () => {
    const user = authAPI.getUserData();
    if (!user) return 'U';

    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }

    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }

    return 'U';
  },
};

export default authAPI;