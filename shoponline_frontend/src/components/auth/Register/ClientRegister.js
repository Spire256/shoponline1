import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import RegistrationForm from './RegistrationForm';

const ClientRegister = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { registerClient } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async formData => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await registerClient(formData);

      if (response.success) {
        setSuccess('Registration successful! You can now sign in.');
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/auth/login', {
            state: { message: 'Registration successful! Please sign in.' },
          });
        }, 2000);
      } else {
        setError(response.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const clientFormFields = [
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
      name: 'email',
      type: 'email',
      label: 'Email Address',
      placeholder: 'Enter your Gmail address',
      required: true,
      autoComplete: 'email',
      validation: {
        pattern: /^[^\s@]+@gmail\.com$/,
        message: 'Please use a valid Gmail address (@gmail.com)',
      },
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

  return (
    <div className="client-register">
      <div className="register-intro">
        <h3 className="register-type-title">Customer Registration</h3>
        <p className="register-type-description">
          Create your customer account to start shopping on ShopOnline Uganda. Use your Gmail
          address to get started.
        </p>
      </div>

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
        fields={clientFormFields}
        onSubmit={handleRegister}
        loading={loading}
        submitButtonText="Create Customer Account"
        formType="client"
      />

      <div className="register-note">
        <div className="note-icon">ℹ️</div>
        <div className="note-content">
          <strong>Note:</strong> Please use a valid Gmail address for customer registration. receive
          order updates and promotional offers on this email.
        </div>
      </div>
    </div>
  );
};

export default ClientRegister;
