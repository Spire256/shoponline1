import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import RegistrationForm from './RegistrationForm';
import invitationAPI from '../../../services/api/invitationAPI';

const AdminRegister = () => {
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [invitationData, setInvitationData] = useState(null);
  const [token, setToken] = useState('');
  const { registerAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const invitationToken = searchParams.get('token');
    if (invitationToken) {
      setToken(invitationToken);
      validateInvitationToken(invitationToken);
    }
  }, [searchParams]);

  const validateInvitationToken = async invitationToken => {
    setValidating(true);
    setError('');

    try {
      const response = await invitationAPI.validateInvitation(invitationToken);
      if (response.data.valid) {
        setInvitationData(response.data);
      } else {
        setError(response.data.error || 'Invalid invitation token');
      }
    } catch (err) {
      setError('Failed to validate invitation. Please check the link.');
      console.error('Invitation validation error:', err);
    } finally {
      setValidating(false);
    }
  };

  const handleTokenSubmit = e => {
    e.preventDefault();
    if (token.trim()) {
      validateInvitationToken(token.trim());
    }
  };

  const handleRegister = async formData => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const registrationData = {
        ...formData,
        invitation_token: token,
      };

      const response = await registerAdmin(registrationData);

      if (response.success) {
        setSuccess('Admin registration successful! Redirecting to dashboard...');
        // Redirect to admin dashboard after 2 seconds
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 2000);
      } else {
        setError(response.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Admin registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const adminFormFields = [
    {
      name: 'first_name',
      type: 'text',
      label: 'First Name',
      placeholder: 'Enter your first name',
      required: true,
      autoComplete: 'given-name',
    },
    {
      name: 'last_name',
      type: 'text',
      label: 'Last Name',
      placeholder: 'Enter your last name',
      required: true,
      autoComplete: 'family-name',
    },
    {
      name: 'password',
      type: 'password',
      label: 'Password',
      placeholder: 'Create a strong password',
      required: true,
      autoComplete: 'new-password',
    },
    {
      name: 'password_confirm',
      type: 'password',
      label: 'Confirm Password',
      placeholder: 'Confirm your password',
      required: true,
      autoComplete: 'new-password',
    },
  ];

  if (validating) {
    return (
      <div className="admin-register">
        <div className="validation-loading">
          <div className="spinner-large" />
          <h3>Validating Invitation</h3>
          <p>Please wait while we verify your invitation...</p>
        </div>
      </div>
    );
  }

  if (!invitationData && !error) {
    return (
      <div className="admin-register">
        <div className="register-intro">
          <h3 className="register-type-title">Admin Registration</h3>
          <p className="register-type-description">
            Enter your invitation token to proceed with admin registration.
          </p>
        </div>

        <form onSubmit={handleTokenSubmit} className="token-form">
          <div className="form-group">
            <label htmlFor="token" className="form-label">
              Invitation Token
            </label>
            <div className="input-wrapper">
              <input
                type="text"
                id="token"
                value={token}
                onChange={e => setToken(e.target.value)}
                className="form-input"
                placeholder="Enter your invitation token"
                required
              />
              <div className="input-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <circle cx="12" cy="16" r="1" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
            </div>
          </div>

          <button type="submit" className="token-button">
            Validate Token
          </button>
        </form>

        <div className="register-note">
          <div className="note-icon">ℹ️</div>
          <div className="note-content">
            <strong>Admin Access Required:</strong> You need a valid invitation token existing admin
            to create an admin account.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-register">
      <div className="register-intro">
        <h3 className="register-type-title">Admin Registration</h3>
        <p className="register-type-description">
          Complete your admin account setup for <strong>{invitationData?.email}</strong>
        </p>
      </div>

      {invitationData && (
        <div className="invitation-info">
          <div className="invitation-card">
            <div className="invitation-header">
              <div className="invitation-icon">✉️</div>
              <div className="invitation-details">
                <h4>Invitation Details</h4>
                <p>
                  <strong>Email:</strong> {invitationData.email}
                </p>
                <p>
                  <strong>Invited by:</strong> {invitationData.invited_by}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-alert">
          <div className="error-icon">⚠</div>
          <span className="error-message">{error}</span>
        </div>
      )}

      {success && (
        <div className="success-alert">
          <div className="success-icon">✓</div>
          <span className="success-message">{success}</span>
        </div>
      )}

      <RegistrationForm
        fields={adminFormFields}
        onSubmit={handleRegister}
        loading={loading}
        submitButtonText="Create Admin Account"
        formType="admin"
      />

      <div className="register-note">
        <div className="note-icon">🛡️</div>
        <div className="note-content">
          <strong>Admin Account:</strong> You'll have access to the admin dashboard products,
          orders, and platform content.
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;
