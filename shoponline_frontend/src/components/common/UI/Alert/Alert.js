import React, { useState, useEffect } from 'react';
import './Alert.css';

const Alert = ({
  type = 'info',
  title,
  message,
  children,
  dismissible = false,
  autoClose = false,
  autoCloseDelay = 5000,
  onClose,
  className = '',
  icon: customIcon,
  actions,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      setTimeout(() => onClose(), 300); // Wait for animation to complete
    }
  };

  const getIcon = () => {
    if (customIcon) return customIcon;

    const iconProps = {
      width: '20',
      height: '20',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    };

    switch (type) {
      case 'success':
        return (
          <svg {...iconProps}>
            <path d="M9 12l2 2 4-4" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
      case 'warning':
        return (
          <svg {...iconProps}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      case 'error':
        return (
          <svg {...iconProps}>
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg {...iconProps}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        );
    }
  };

  if (!isVisible) return null;

  const alertClasses = `alert alert--${type} ${className}`.trim();

  return (
    <div className={alertClasses} role="alert">
      <div className="alert__icon">{getIcon()}</div>

      <div className="alert__content">
        {title && <div className="alert__title">{title}</div>}

        {message && <div className="alert__message">{message}</div>}

        {children && <div className="alert__children">{children}</div>}

        {actions && <div className="alert__actions">{actions}</div>}
      </div>

      {dismissible && (
        <button className="alert__close" onClick={handleClose} aria-label="Close alert">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

// Toast Alert Component for notifications
export const ToastAlert = ({ isVisible = true, position = 'top-right', ...alertProps }) => {
  if (!isVisible) return null;

  return (
    <div className={`toast-container toast-container--${position}`}>
      <Alert {...alertProps} />
    </div>
  );
};

export default Alert;
