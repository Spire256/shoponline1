// src/contexts/AuthContext.js
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

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
  role: null,
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
        role: action.payload.user.role || (action.payload.user.is_staff ? 'admin' : 'client'),
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
        refreshToken: action.payload.refresh || state.refreshToken,
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

  // Get API base URL
  const getAPIBaseURL = useCallback(() => {
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
    return baseUrl.includes('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;
  }, []);

  // Clear authentication storage - Fixed to use consistent keys
  const clearAuthStorage = useCallback(() => {
    const keysToRemove = [
      'user',
      'access_token',
      'refresh_token',
      // Legacy keys for backwards compatibility
      'accessToken',
      'refreshToken',
      'shoponline_user',
      'shoponline_access_token',
      'shoponline_refresh_token',
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
  }, []);

  // Store tokens with consistent keys
  const storeTokens = useCallback((user, tokens) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
  }, []);

  // Get stored tokens with fallback to legacy keys
  const getStoredTokens = useCallback(() => {
    return {
      user: (() => {
        try {
          return JSON.parse(
            localStorage.getItem('user') || 
            localStorage.getItem('shoponline_user') || 
            'null'
          );
        } catch {
          return null;
        }
      })(),
      accessToken: localStorage.getItem('access_token') || 
                    localStorage.getItem('accessToken') || 
                    localStorage.getItem('shoponline_access_token'),
      refreshToken: localStorage.getItem('refresh_token') || 
                    localStorage.getItem('refreshToken') || 
                    localStorage.getItem('shoponline_refresh_token'),
    };
  }, []);

  // Refresh token function
  const refreshTokenMethod = useCallback(async () => {
    try {
      const { refreshToken: refreshTokenValue } = getStoredTokens();
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      const apiUrl = getAPIBaseURL();
      const response = await fetch(`${apiUrl}/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshTokenValue }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('access_token', data.access);
        if (data.refresh) {
          localStorage.setItem('refresh_token', data.refresh);
        }

        dispatch({
          type: AUTH_ACTIONS.REFRESH_TOKEN,
          payload: data,
        });

        return { success: true, accessToken: data.access };
      } else {
        clearAuthStorage();
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
        return { success: false, error: 'Session expired' };
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAuthStorage();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      return { success: false, error: 'Session expired' };
    }
  }, [getAPIBaseURL, clearAuthStorage, getStoredTokens]);

  // Check authentication status function
  const checkAuthStatus = useCallback(async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      const { user: userData, accessToken, refreshToken } = getStoredTokens();

      if (userData && accessToken && refreshToken) {
        const apiUrl = getAPIBaseURL();

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
                user: userData,
                tokens: { access: accessToken, refresh: refreshToken },
              },
            });
          } else if (response.status === 401) {
            // Token expired, try to refresh
            const refreshResult = await refreshTokenMethod();
            if (!refreshResult.success) {
              clearAuthStorage();
              dispatch({ type: AUTH_ACTIONS.LOGOUT });
            }
          } else {
            clearAuthStorage();
            dispatch({ type: AUTH_ACTIONS.LOGOUT });
          }
        } catch (error) {
          // Network error, use stored data but don't retry automatically
          console.warn('Auth check failed, using stored data:', error);
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: {
              user: userData,
              tokens: { access: accessToken, refresh: refreshToken },
            },
          });
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    } catch (error) {
      console.error('Failed to check auth status:', error);
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  }, [getAPIBaseURL, refreshTokenMethod, clearAuthStorage, getStoredTokens]);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      if (mounted) {
        await checkAuthStatus();
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // Login function
  const login = useCallback(async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const apiUrl = getAPIBaseURL();
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
        storeTokens(data.user, data.tokens);

        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: data,
        });

        return { success: true, user: data.user, data };
      } else {
        const errorMessage = data.detail || data.error || 'Login failed';
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: errorMessage,
        });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  }, [getAPIBaseURL, storeTokens]);

  // Register client function
  const registerClient = useCallback(async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });

    try {
      const apiUrl = getAPIBaseURL();
      const response = await fetch(`${apiUrl}/auth/register/client/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          first_name: userData.first_name || userData.firstName,
          last_name: userData.last_name || userData.lastName,
          password: userData.password,
          password_confirm: userData.password_confirm || userData.passwordConfirm,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        storeTokens(data.user, data.tokens);

        dispatch({
          type: AUTH_ACTIONS.REGISTER_SUCCESS,
          payload: data,
        });

        return { success: true, data };
      } else {
        dispatch({
          type: AUTH_ACTIONS.REGISTER_FAILURE,
          payload: data,
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
  }, [getAPIBaseURL, storeTokens]);

  // Register admin function
  const registerAdmin = useCallback(async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });

    try {
      const apiUrl = getAPIBaseURL();
      const response = await fetch(`${apiUrl}/auth/register/admin/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: userData.first_name || userData.firstName,
          last_name: userData.last_name || userData.lastName,
          password: userData.password,
          password_confirm: userData.password_confirm || userData.passwordConfirm,
          invitation_token: userData.invitation_token || userData.invitationToken,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        storeTokens(data.user, data.tokens);

        dispatch({
          type: AUTH_ACTIONS.REGISTER_SUCCESS,
          payload: data,
        });

        return { success: true, data };
      } else {
        dispatch({
          type: AUTH_ACTIONS.REGISTER_FAILURE,
          payload: data,
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
  }, [getAPIBaseURL, storeTokens]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      const { refreshToken: refreshTokenValue, accessToken } = getStoredTokens();
      
      if (refreshTokenValue) {
        const apiUrl = getAPIBaseURL();

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
      clearAuthStorage();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  }, [getAPIBaseURL, clearAuthStorage, getStoredTokens]);

  // Update profile function
  const updateProfile = useCallback(async (profileData) => {
    try {
      const { accessToken } = getStoredTokens();
      const apiUrl = getAPIBaseURL();

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
  }, [getAPIBaseURL, state.user, getStoredTokens]);

  // Validate invitation token
  const validateInvitation = useCallback(async (token) => {
    try {
      const apiUrl = getAPIBaseURL();
      const response = await fetch(`${apiUrl}/auth/invitations/validate/${token}/`);
      const data = await response.json();
      return response.ok ? { success: true, data } : { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: 'Failed to validate invitation' };
    }
  }, [getAPIBaseURL]);

  // Clear error function
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // Helper functions - Enhanced with multiple fallback checks
  const isAdmin = useCallback(() => {
    if (!state.user) return false;
    
    // Check multiple possible admin indicators
    return state.user.role === 'admin' || 
           state.user.is_staff === true ||
           state.role === 'admin' ||
           (state.user.email && state.user.email.endsWith('@shoponline.com'));
  }, [state.user, state.role]);

  const isClient = useCallback(() => {
    if (!state.user) return false;
    
    return state.user.role === 'client' || 
           state.role === 'client' ||
           (!isAdmin() && state.isAuthenticated);
  }, [state.user, state.role, state.isAuthenticated, isAdmin]);

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