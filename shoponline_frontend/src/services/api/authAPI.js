// src/services/api/authAPI.js
import apiClient, { handleApiResponse, handleApiError } from './apiClient';

// Enhanced token management with multiple fallbacks (aligned with apiClient.js)
const getAccessToken = () => {
  // Try multiple storage locations
  const sources = [
    localStorage.getItem('access_token'),
    localStorage.getItem('accessToken'),
    localStorage.getItem(process.env.REACT_APP_SESSION_STORAGE_KEY),
    localStorage.getItem(process.env.REACT_APP_LOCAL_STORAGE_KEY)
  ];

  for (const source of sources) {
    if (source) {
      try {
        // Try to parse as JSON first
        const parsed = JSON.parse(source);
        return parsed.access || parsed.access_token || parsed.accessToken;
      } catch (e) {
        // If not JSON, assume it's a plain token string
        return source;
      }
    }
  }
  return null;
};

const getRefreshToken = () => {
  const sources = [
    localStorage.getItem('refresh_token'),
    localStorage.getItem('refreshToken'),
    localStorage.getItem(process.env.REACT_APP_SESSION_STORAGE_KEY),
    localStorage.getItem(process.env.REACT_APP_LOCAL_STORAGE_KEY)
  ];

  for (const source of sources) {
    if (source) {
      try {
        const parsed = JSON.parse(source);
        return parsed.refresh || parsed.refresh_token || parsed.refreshToken;
      } catch (e) {
        // If not JSON and this is from refresh_token key, use as is
        if (source === localStorage.getItem('refresh_token') || 
            source === localStorage.getItem('refreshToken')) {
          return source;
        }
      }
    }
  }
  return null;
};

// Store tokens with multiple storage locations
const storeTokens = (accessToken, refreshToken) => {
  // Store with primary keys
  if (accessToken) {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('accessToken', accessToken); // Legacy support
  }
  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('refreshToken', refreshToken); // Legacy support
  }

  // Update other storage locations if they exist
  if (process.env.REACT_APP_SESSION_STORAGE_KEY) {
    try {
      const existingData = localStorage.getItem(process.env.REACT_APP_SESSION_STORAGE_KEY);
      const data = existingData ? JSON.parse(existingData) : {};
      if (accessToken) data.access = accessToken;
      if (refreshToken) data.refresh = refreshToken;
      localStorage.setItem(process.env.REACT_APP_SESSION_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      if (accessToken) {
        localStorage.setItem(process.env.REACT_APP_SESSION_STORAGE_KEY, accessToken);
      }
    }
  }

  if (process.env.REACT_APP_LOCAL_STORAGE_KEY) {
    try {
      const existingData = localStorage.getItem(process.env.REACT_APP_LOCAL_STORAGE_KEY);
      const data = existingData ? JSON.parse(existingData) : {};
      if (accessToken) data.access = accessToken;
      if (refreshToken) data.refresh = refreshToken;
      localStorage.setItem(process.env.REACT_APP_LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      if (accessToken) {
        localStorage.setItem(process.env.REACT_APP_LOCAL_STORAGE_KEY, accessToken);
      }
    }
  }
};

// Clear all tokens from all storage locations
const clearAllTokens = () => {
  const keysToRemove = [
    'access_token',
    'accessToken', 
    'refresh_token',
    'refreshToken',
    'user',
    process.env.REACT_APP_SESSION_STORAGE_KEY,
    process.env.REACT_APP_LOCAL_STORAGE_KEY
  ].filter(Boolean);
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
};

const authAPI = {
  // Client Registration
  registerClient: async userData => {
    try {
      const response = await apiClient.post('/auth/register/client/', userData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Admin Registration (with invitation token)
  registerAdmin: async userData => {
    try {
      const response = await apiClient.post('/auth/register/admin/', userData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Login
  login: async credentials => {
    try {
      const response = await apiClient.post('/auth/login/', credentials);
      const data = handleApiResponse(response);

      // Store tokens using enhanced storage method
      storeTokens(data.access, data.refresh);
      
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
      // Clear all storage locations
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

      // Store tokens using enhanced storage method
      storeTokens(data.access, data.refresh);

      return data;
    } catch (error) {
      // Clear tokens on refresh failure
      clearAllTokens();
      throw handleApiError(error);
    }
  },

  // Get Current User Profile
  getProfile: async () => {
    try {
      const response = await apiClient.get('/auth/profile/');
      return handleApiResponse(response);
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

  // Change Password
  changePassword: async passwordData => {
    try {
      const response = await apiClient.post('/auth/change-password/', passwordData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Forgot Password
  forgotPassword: async email => {
    try {
      const response = await apiClient.post('/auth/forgot-password/', { email });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Reset Password
  resetPassword: async resetData => {
    try {
      const response = await apiClient.post('/auth/reset-password/', resetData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Verify Email
  verifyEmail: async token => {
    try {
      const response = await apiClient.post('/auth/verify-email/', { token });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Resend Email Verification
  resendEmailVerification: async () => {
    try {
      const response = await apiClient.post('/auth/resend-verification/');
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
      // If profile request fails, clear storage and return unauthenticated
      clearAllTokens();

      return { isAuthenticated: false, user: null };
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = getAccessToken();
    return Boolean(token);
  },

  // Get user role
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

  // Check if user is admin
  isAdmin: () => {
    return authAPI.getUserRole() === 'admin';
  },

  // Check if user is client
  isClient: () => {
    return authAPI.getUserRole() === 'client';
  },

  // Get stored user data
  getUserData: () => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  // Store user data
  storeUserData: userData => {
    localStorage.setItem('user', JSON.stringify(userData));
  },

  // Clear all auth data
  clearAuthData: () => {
    clearAllTokens();
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

  // Get current access token (uses enhanced token retrieval)
  getAccessToken: () => {
    return getAccessToken();
  },

  // Get current refresh token (uses enhanced token retrieval)
  getRefreshToken: () => {
    return getRefreshToken();
  },
};

export default authAPI;