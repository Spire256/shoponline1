import React from 'react';

const NotFound = () => {
  const goHome = () => {
    window.location.href = '/';
  };

  const goBack = () => {
    window.history.back();
  };

  const navigateTo = path => {
    window.location.href = path;
  };

  return (
    <div className="error-page">
      <div className="error-container">
        <div className="error-illustration">
          <div className="error-number">404</div>
          <div className="error-icon">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
                fill="currentColor"
                opacity="0.3"
              />
            </svg>
          </div>
        </div>

        <div className="error-content">
          <h1 className="error-title">Page Not Found</h1>
          <p className="error-description">
            Oops! The page you're looking for doesn't exist. It might have been moved, you entered
            the wrong URL.
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

          <div className="error-suggestions">
            <h3>You might want to:</h3>
            <ul>
              <li>
                <a
                  href="/products"
                  onClick={e => {
                    e.preventDefault();
                    navigateTo('/products');
                  }}
                >
                  Browse all products
                </a>
              </li>
              <li>
                <a
                  href="/flash-sales"
                  onClick={e => {
                    e.preventDefault();
                    navigateTo('/flash-sales');
                  }}
                >
                  Check flash sales
                </a>
              </li>
              <li>
                <a
                  href="/categories"
                  onClick={e => {
                    e.preventDefault();
                    navigateTo('/categories');
                  }}
                >
                  Explore categories
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        .error-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
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
          animation: slideUp 0.6s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
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
          color: #2563eb;
          line-height: 1;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #2563eb, #60a5fa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .error-icon {
          color: #64748b;
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

        .error-suggestions {
          text-align: left;
          background: #f8fafc;
          padding: 1.5rem;
          border-radius: 8px;
          border-left: 4px solid #2563eb;
        }

        .error-suggestions h3 {
          color: #1e293b;
          font-size: 1.1rem;
          margin-bottom: 1rem;
          font-weight: 600;
        }

        .error-suggestions ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .error-suggestions li {
          margin-bottom: 0.5rem;
        }

        .error-suggestions a {
          color: #2563eb;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }

        .error-suggestions a:hover {
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

export default NotFound;
