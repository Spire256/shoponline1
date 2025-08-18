// src/services/api/invitationAPI.js
import apiClient, { handleApiResponse, handleApiError, buildQueryString } from './apiClient';

const invitationAPI = {
  // Get all invitations (admin only)
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

  // Create new admin invitation (admin only)
  createInvitation: async invitationData => {
    try {
      const response = await apiClient.post('/auth/invitations/', invitationData);
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

  // Update invitation (admin only)
  updateInvitation: async (invitationId, updateData) => {
    try {
      const response = await apiClient.patch(`/auth/invitations/${invitationId}/`, updateData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Delete invitation (admin only)
  deleteInvitation: async invitationId => {
    try {
      const response = await apiClient.delete(`/auth/invitations/${invitationId}/`);
      return handleApiResponse(response);
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

  // Cancel invitation (admin only)
  cancelInvitation: async invitationId => {
    try {
      const response = await apiClient.post(`/auth/invitations/${invitationId}/cancel/`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Resend invitation (admin only)
  resendInvitation: async invitationId => {
    try {
      const response = await apiClient.post(`/auth/invitations/${invitationId}/resend/`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Bulk invite admins (admin only)
  bulkInvite: async invitationsData => {
    try {
      const response = await apiClient.post('/auth/invitations/bulk/', {
        invitations: invitationsData,
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get invitation statistics (admin only)
  getInvitationStats: async () => {
    try {
      const response = await apiClient.get('/auth/invitations/stats/');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get pending invitations count (admin only)
  getPendingCount: async () => {
    try {
      const response = await apiClient.get('/auth/invitations/pending-count/');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Bulk actions on invitations (admin only)
  bulkAction: async (action, invitationIds) => {
    try {
      const response = await apiClient.post('/auth/invitations/bulk-action/', {
        action,
        invitation_ids: invitationIds,
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Check if email can be invited
  checkEmailAvailability: async email => {
    try {
      const response = await apiClient.post('/auth/invitations/check-email/', { email });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get invitation by token (for registration page)
  getInvitationByToken: async token => {
    try {
      const response = await apiClient.get(`/auth/invitations/token/${token}/`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Accept invitation and complete registration
  acceptInvitation: async (token, userData) => {
    try {
      const response = await apiClient.post(`/auth/invitations/${token}/accept/`, userData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Decline invitation
  declineInvitation: async token => {
    try {
      const response = await apiClient.post(`/auth/invitations/${token}/decline/`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get invitation history for an email
  getInvitationHistory: async email => {
    try {
      const response = await apiClient.get(
        `/auth/invitations/history/?email=${encodeURIComponent(email)}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Utility functions
  formatInvitationData: invitation => {
    return {
      id: invitation.id,
      email: invitation.email,
      status: invitation.status,
      statusDisplay: invitation.status_display,
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
