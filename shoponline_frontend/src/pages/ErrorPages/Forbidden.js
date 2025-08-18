import React from 'react';

const Forbidden = () => {
  const goHome = () => {
    window.location.href = '/';
  };

  const goBack = () => {
    window.history.back();
  };

  const contactSupport = () => {
    window.location.href = 'mailto:support@shoponline.com';
  };

  return (
    <div className="error-page">
      <div className="error-container">
        <div className="error-illustration">
          <div className="error-number">403</div>
          <div className="error-icon">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
              <path
                d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11H9.2V10C9.2,8.6 10.6,7 12,7M16,12V16H8V12H16Z"
                fill="currentColor"
                opacity="0.3"
              />
            </svg>
          </div>
        </div>

        <div className="error-content">
          <h1 className="error-title">Access Forbidden</h1>
          <p className="error-description">
            You don't have sufficient permissions to access this resource. This area is restricted
            and requires special authorization.
          </p>

          <div className="error-actions">
            <button onClick={goHome} className="btn btn-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor" />
              </svg>
              Go Home
            </button>
            <button onClick={goBack} className="btn btn-secondary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
                  fill="currentColor"
                />
              </svg>
              Go Back
            </button>
          </div>

          <div className="error-reasons">
            <h3>Common reasons for this error:</h3>
            <ul>
              <li>You're trying to access an admin-only area</li>
              <li>Your account doesn't have the required role</li>
              <li>This resource is temporarily restricted</li>
              <li>You need elevated permissions</li>
            </ul>
          </div>

          <div className="permission-request">
            <h3>Need access?</h3>
            <p>
              If you believe you should have access to this resource, please contact your
              administrator or our support team.
            </p>
            <button onClick={contactSupport} className="btn btn-outline">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
                  fill="currentColor"
                />
              </svg>
              Contact Support
            </button>
          </div>

          <div className="security-notice">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="currentColor" />
            </svg>
            <p>This access attempt has been logged for security purposes.</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .error-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
            Cantarell, sans-serif;
        }

        .error-container {
          background: white;
          border-radius: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          padding: 3rem;
          max-width: 550px;
          width: 100%;
          text-align: center;
          animation: fadeInUp 0.6s ease-out;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .error-illustration {
          margin-bottom: 2rem;
        }

        .error-number {
          font-size: 6rem;
          font-weight: 800;
          color: #7c3aed;
          line-height: 1;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .error-icon {
          color: #7c3aed;
          display: flex;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .error-title {
          font-size: 2rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 1rem;
        }

        .error-description {
          color: #64748b;
          font-size: 1.1rem;
          line-height: 1.6;
          margin-bottom: 2rem;
        }

        .error-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 1rem;
        }

        .btn-primary {
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          color: white;
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #1e40af, #2563eb);
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.4);
        }

        .btn-secondary {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
        }

        .btn-secondary:hover {
          background: #e2e8f0;
          transform: translateY(-1px);
        }

        .btn-outline {
          background: transparent;
          color: #7c3aed;
          border: 2px solid #7c3aed;
          margin-top: 1rem;
        }

        .btn-outline:hover {
          background: #7c3aed;
          color: white;
          transform: translateY(-1px);
        }

        .error-reasons {
          text-align: left;
          background: #faf5ff;
          padding: 1.5rem;
          border-radius: 8px;
          border-left: 4px solid #7c3aed;
          margin-bottom: 1.5rem;
        }

        .error-reasons h3 {
          color: #1e293b;
          font-size: 1.1rem;
          margin-bottom: 1rem;
          font-weight: 600;
        }

        .error-reasons ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .error-reasons li {
          margin-bottom: 0.5rem;
          position: relative;
          padding-left: 1.5rem;
          color: #64748b;
        }

        .error-reasons li:before {
          content: '•';
          color: #7c3aed;
          position: absolute;
          left: 0;
        }

        .permission-request {
          background: #f8fafc;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .permission-request h3 {
          color: #1e293b;
          font-size: 1.1rem;
          margin-bottom: 1rem;
          font-weight: 600;
        }

        .permission-request p {
          color: #64748b;
          line-height: 1.5;
          margin-bottom: 1rem;
        }

        .security-notice {
          background: #fff7ed;
          border: 1px solid #fed7aa;
          padding: 1rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #ea580c;
          font-size: 0.9rem;
        }

        .security-notice svg {
          flex-shrink: 0;
        }

        .security-notice p {
          margin: 0;
        }

        @media (max-width: 640px) {
          .error-page {
            padding: 1rem;
          }

          .error-container {
            padding: 2rem;
          }

          .error-number {
            font-size: 4rem;
          }

          .error-title {
            font-size: 1.5rem;
          }

          .error-actions {
            flex-direction: column;
          }

          .security-notice {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default Forbidden;
