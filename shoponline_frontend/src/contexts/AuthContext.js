// src/contexts/AuthContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Auth action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  REFRESH_TOKEN: 'REFRESH_TOKEN',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Initial state
const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  role: null, // 'admin' or 'client'
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.tokens.access,
        refreshToken: action.payload.tokens.refresh,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        role: action.payload.user.role,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        role: null,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        isLoading: false,
      };

    case AUTH_ACTIONS.UPDATE_PROFILE:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    case AUTH_ACTIONS.REFRESH_TOKEN:
      return {
        ...state,
        accessToken: action.payload.access,
        refreshToken: action.payload.refresh,
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Check authentication status function
  const checkAuthStatus = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      const userData = localStorage.getItem('user');
      const accessToken = localStorage.getItem('accessToken') || localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refreshToken') || localStorage.getItem('refresh_token');

      if (userData && accessToken && refreshToken) {
        const user = JSON.parse(userData);

        // Get the base URL from environment
        const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
        const apiUrl = baseUrl.includes('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;

        // Verify token is still valid by making a test request
        try {
          const response = await fetch(`${apiUrl}/auth/profile/`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (response.ok) {
            // Token is valid, set authenticated state
            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: {
                user,
                tokens: { access: accessToken, refresh: refreshToken },
              },
            });
          } else if (response.status === 401) {
            // Token expired, try to refresh
            const refreshResult = await refreshTokenMethod();
            if (!refreshResult.success) {
              // Refresh failed, clear storage and set unauthenticated
              clearAuthStorage();
              dispatch({ type: AUTH_ACTIONS.LOGOUT });
            }
          } else {
            // Other error, clear storage
            clearAuthStorage();
            dispatch({ type: AUTH_ACTIONS.LOGOUT });
          }
        } catch (error) {
          // Network error or other issues, try with stored data
          console.warn('Auth check failed, using stored data:', error);
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: {
              user,
              tokens: { access: accessToken, refresh: refreshToken },
            },
          });
        }
      } else {
        // No stored auth data
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    } catch (error) {
      console.error('Failed to check auth status:', error);
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Clear authentication storage
  const clearAuthStorage = () => {
    const keysToRemove = [
      'user',
      'accessToken',
      'access_token',
      'refreshToken',
      'refresh_token',
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
  };

  // FIXED: Login function now accepts credentials object
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      // Get the base URL from environment
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      const apiUrl = baseUrl.includes('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;

      const response = await fetch(`${apiUrl}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store tokens and user data using multiple keys for compatibility
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('accessToken', data.tokens.access);
        localStorage.setItem('access_token', data.tokens.access);
        localStorage.setItem('refreshToken', data.tokens.refresh);
        localStorage.setItem('refresh_token', data.tokens.refresh);

        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: data,
        });

        return { success: true, user: data.user, data };
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: data.error || data.detail || 'Login failed',
        });
        return { success: false, error: data.error || data.detail || 'Login failed' };
      }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Register client function
  const registerClient = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });

    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      const apiUrl = baseUrl.includes('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;

      const response = await fetch(`${apiUrl}/auth/register/client/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store tokens and user data
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('accessToken', data.tokens.access);
        localStorage.setItem('access_token', data.tokens.access);
        localStorage.setItem('refreshToken', data.tokens.refresh);
        localStorage.setItem('refresh_token', data.tokens.refresh);

        dispatch({
          type: AUTH_ACTIONS.REGISTER_SUCCESS,
          payload: data,
        });

        return { success: true, data };
      } else {
        dispatch({
          type: AUTH_ACTIONS.REGISTER_FAILURE,
          payload: data.error || 'Registration failed',
        });
        return { success: false, error: data };
      }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.';
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Register admin function
  const registerAdmin = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });

    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      const apiUrl = baseUrl.includes('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;

      const response = await fetch(`${apiUrl}/auth/register/admin/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store tokens and user data
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('accessToken', data.tokens.access);
        localStorage.setItem('access_token', data.tokens.access);
        localStorage.setItem('refreshToken', data.tokens.refresh);
        localStorage.setItem('refresh_token', data.tokens.refresh);

        dispatch({
          type: AUTH_ACTIONS.REGISTER_SUCCESS,
          payload: data,
        });

        return { success: true, data };
      } else {
        dispatch({
          type: AUTH_ACTIONS.REGISTER_FAILURE,
          payload: data.error || 'Registration failed',
        });
        return { success: false, error: data };
      }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.';
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout endpoint to blacklist refresh token
      const refreshTokenValue = localStorage.getItem('refreshToken') || localStorage.getItem('refresh_token');
      const accessToken = localStorage.getItem('accessToken') || localStorage.getItem('access_token');
      
      if (refreshTokenValue) {
        const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
        const apiUrl = baseUrl.includes('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;

        await fetch(`${apiUrl}/auth/logout/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refresh: refreshTokenValue }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear localStorage and state
      clearAuthStorage();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Refresh token function
  const refreshTokenMethod = async () => {
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken') || localStorage.getItem('refresh_token');
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      const apiUrl = baseUrl.includes('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;

      const response = await fetch(`${apiUrl}/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshTokenValue }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('accessToken', data.access);
        localStorage.setItem('access_token', data.access);
        if (data.refresh) {
          localStorage.setItem('refreshToken', data.refresh);
          localStorage.setItem('refresh_token', data.refresh);
        }

        dispatch({
          type: AUTH_ACTIONS.REFRESH_TOKEN,
          payload: data,
        });

        return { success: true, accessToken: data.access };
      } else {
        // Refresh token is invalid, logout user
        logout();
        return { success: false, error: 'Session expired' };
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return { success: false, error: 'Session expired' };
    }
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      const accessToken = localStorage.getItem('accessToken') || localStorage.getItem('access_token');
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      const apiUrl = baseUrl.includes('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;

      const response = await fetch(`${apiUrl}/auth/profile/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (response.ok) {
        // Update user data in localStorage
        const updatedUser = { ...state.user, ...data };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        dispatch({
          type: AUTH_ACTIONS.UPDATE_PROFILE,
          payload: data,
        });

        return { success: true, data };
      } else {
        return { success: false, error: data };
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      return { success: false, error: 'Failed to update profile' };
    }
  };

  // Validate invitation token
  const validateInvitation = async (token) => {
    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      const apiUrl = baseUrl.includes('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;

      const response = await fetch(`${apiUrl}/auth/invitations/validate/${token}/`);
      const data = await response.json();
      return response.ok ? { success: true, data } : { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: 'Failed to validate invitation' };
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Helper functions
  const isAdmin = () => state.role === 'admin';
  const isClient = () => state.role === 'client';

  // Context value
  const value = {
    // State
    user: state.user,
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    role: state.role,

    // Actions
    login,
    registerClient,
    registerAdmin,
    logout,
    refreshToken: refreshTokenMethod,
    updateProfile,
    validateInvitation,
    clearError,
    checkAuthStatus,

    // Helpers
    isAdmin,
    isClient,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;