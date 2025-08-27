// src/services/api/authAPI.js
import apiClient, { handleApiResponse, handleApiError } from './apiClient';

// Enhanced token management with multiple fallbacks
const getAccessToken = () => {
  const sources = [
    localStorage.getItem('accessToken'),
    localStorage.getItem('access_token'),
  ];

  for (const source of sources) {
    if (source) {
      try {
        const parsed = JSON.parse(source);
        return parsed.access || parsed.access_token || parsed.accessToken;
      } catch (e) {
        return source;
      }
    }
  }
  return null;
};

const getRefreshToken = () => {
  const sources = [
    localStorage.getItem('refreshToken'),
    localStorage.getItem('refresh_token'),
  ];

  for (const source of sources) {
    if (source) {
      try {
        const parsed = JSON.parse(source);
        return parsed.refresh || parsed.refresh_token || parsed.refreshToken;
      } catch (e) {
        if (source === localStorage.getItem('refresh_token') || 
            source === localStorage.getItem('refreshToken')) {
          return source;
        }
      }
    }
  }
  return null;
};

// Store tokens with multiple keys for compatibility
const storeTokens = (accessToken, refreshToken) => {
  if (accessToken) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('access_token', accessToken);
  }
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('refresh_token', refreshToken);
  }
};

// Clear all tokens from all storage locations
const clearAllTokens = () => {
  const keysToRemove = [
    'accessToken',
    'access_token', 
    'refreshToken',
    'refresh_token',
    'user',
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
        first_name: userData.first_name,
        last_name: userData.last_name,
        password: userData.password,
        password_confirm: userData.password_confirm,
      });
      
      const data = handleApiResponse(response);
      
      // Store tokens and user data
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
        first_name: userData.first_name,
        last_name: userData.last_name,
        password: userData.password,
        password_confirm: userData.password_confirm,
        invitation_token: userData.invitation_token,
      });
      
      const data = handleApiResponse(response);
      
      // Store tokens and user data
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

      // Store tokens and user data
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
      if (refreshToken) {
        await apiClient.post('/auth/logout/', {
          refresh: refreshToken,
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

      // Store new tokens
      storeTokens(data.access, data.refresh);

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

  // Helper methods
  isAuthenticated: () => {
    const token = getAccessToken();
    return Boolean(token);
  },

  getUserRole: () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.role;
      }
      return null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  isAdmin: () => {
    return authAPI.getUserRole() === 'admin';
  },

  isClient: () => {
    return authAPI.getUserRole() === 'client';
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
};

export default authAPI;