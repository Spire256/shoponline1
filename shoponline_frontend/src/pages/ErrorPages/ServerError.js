import React from 'react';

const ServerError = () => {
  const reloadPage = () => {
    window.location.reload();
  };

  const goHome = () => {
    window.location.href = '/';
  };

  const navigateTo = path => {
    window.location.href = path;
  };

  return (
    <div className="error-page">
      <div className="error-container">
        <div className="error-illustration">
          <div className="error-number">500</div>
          <div className="error-icon">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM13 17h-2v-6h2v6zm0-8h-2V7h2v2z"
                fill="currentColor"
                opacity="0.3"
              />
            </svg>
          </div>
        </div>

        <div className="error-content">
          <h1 className="error-title">Server Error</h1>
          <p className="error-description">
            Something went wrong on our end. Our team has been notified and is working to fix the
            issue. Please try again in a few moments.
          </p>

          <div className="error-actions">
            <button onClick={reloadPage} className="btn btn-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
                  fill="currentColor"
                />
              </svg>
              Try Again
            </button>
            <button onClick={goHome} className="btn btn-secondary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor" />
              </svg>
              Go Home
            </button>
          </div>

          <div className="error-details">
            <h3>What happened?</h3>
            <ul>
              <li>The server encountered an unexpected error</li>
              <li>This might be a temporary issue</li>
              <li>Our technical team has been automatically notified</li>
            </ul>
          </div>

          <div className="error-contact">
            <p>If the problem persists, please contact our support team:</p>
            <a href="mailto:support@shoponline.com" className="contact-link">
              support@shoponline.com
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        .error-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
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
          max-width: 500px;
          width: 100%;
          text-align: center;
          animation: shake 0.6s ease-out;
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-5px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(5px);
          }
        }

        .error-illustration {
          margin-bottom: 2rem;
        }

        .error-number {
          font-size: 6rem;
          font-weight: 800;
          color: #dc2626;
          line-height: 1;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #dc2626, #f87171);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .error-icon {
          color: #dc2626;
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

        .error-details {
          text-align: left;
          background: #fef2f2;
          padding: 1.5rem;
          border-radius: 8px;
          border-left: 4px solid #dc2626;
          margin-bottom: 1.5rem;
        }

        .error-details h3 {
          color: #1e293b;
          font-size: 1.1rem;
          margin-bottom: 1rem;
          font-weight: 600;
        }

        .error-details ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .error-details li {
          margin-bottom: 0.5rem;
          position: relative;
          padding-left: 1.5rem;
          color: #64748b;
        }

        .error-details li:before {
          content: '•';
          color: #dc2626;
          position: absolute;
          left: 0;
        }

        .error-contact {
          background: #f8fafc;
          padding: 1.5rem;
          border-radius: 8px;
          text-align: center;
        }

        .error-contact p {
          color: #64748b;
          margin-bottom: 0.5rem;
        }

        .contact-link {
          color: #2563eb;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s;
        }

        .contact-link:hover {
          color: #1e40af;
          text-decoration: underline;
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
        }
      `}</style>
    </div>
  );
};

export default ServerError;
