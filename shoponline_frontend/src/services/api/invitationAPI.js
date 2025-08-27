// src/services/api/invitationAPI.js
import apiClient, { handleApiResponse, handleApiError, buildQueryString } from './apiClient';

const invitationAPI = {
  // Get all invitations (admin only) - Fixed endpoint path
  getInvitations: async (params = {}) => {
    try {
      const queryString = buildQueryString(params);
      const url = queryString ? `/auth/invitations/?${queryString}` : '/auth/invitations/';
      const response = await apiClient.get(url);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Create new admin invitation (admin only) - Fixed to match backend expectations
  createInvitation: async invitationData => {
    try {
      const response = await apiClient.post('/auth/invitations/', {
        email: invitationData.email
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get invitation details
  getInvitation: async invitationId => {
    try {
      const response = await apiClient.get(`/auth/invitations/${invitationId}/`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Cancel/Delete invitation (admin only) - Fixed method name
  cancelInvitation: async invitationId => {
    try {
      const response = await apiClient.delete(`/auth/invitations/${invitationId}/`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Validate invitation token - Fixed to match backend endpoint
  validateInvitation: async token => {
    try {
      const response = await apiClient.get(`/auth/invitations/validate/${token}/`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Utility functions for frontend display
  formatInvitationData: invitation => {
    return {
      id: invitation.id,
      email: invitation.email,
      status: invitation.status,
      isExpired: invitation.is_expired,
      isValid: invitation.is_valid,
      invitedBy: invitation.invited_by_name,
      invitedUser: invitation.invited_user_name,
      createdAt: new Date(invitation.created_at),
      expiresAt: new Date(invitation.expires_at),
      acceptedAt: invitation.accepted_at ? new Date(invitation.accepted_at) : null,
      timeRemaining: invitation.expires_at
        ? Math.max(0, new Date(invitation.expires_at) - new Date())
        : 0,
    };
  },

  getStatusColor: status => {
    const colors = {
      pending: 'orange',
      accepted: 'green',
      expired: 'red',
      cancelled: 'gray',
    };
    return colors[status] || 'gray';
  },

  getStatusIcon: status => {
    const icons = {
      pending: '⏳',
      accepted: '✅',
      expired: '⏰',
      cancelled: '❌',
    };
    return icons[status] || '❓';
  },

  isExpiringSoon: (expiresAt, hoursThreshold = 24) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const hoursUntilExpiry = (expiry - now) / (1000 * 60 * 60);
    return hoursUntilExpiry > 0 && hoursUntilExpiry <= hoursThreshold;
  },

  validateEmail: email => {
    const adminEmailPattern = /^[a-zA-Z0-9._%+-]+@shoponline\.com$/;
    return adminEmailPattern.test(email);
  },
};

export default invitationAPI;