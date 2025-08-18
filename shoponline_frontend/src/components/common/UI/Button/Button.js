import React from 'react';
import './Button.css';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
  startIcon,
  endIcon,
  ...props
}) => {
  const getButtonClasses = () => {
    let classes = `btn btn--${variant} btn--${size}`;

    if (disabled || loading) classes += ' btn--disabled';
    if (fullWidth) classes += ' btn--full-width';
    if (loading) classes += ' btn--loading';
    if (className) classes += ` ${className}`;

    return classes;
  };

  return (
    <button
      type={type}
      className={getButtonClasses()}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <span className="btn__spinner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="32"
              strokeDashoffset="32"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="0 12 12;360 12 12"
                dur="1s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
        </span>
      )}

      {startIcon && !loading && <span className="btn__icon btn__icon--start">{startIcon}</span>}

      <span className="btn__text">{children}</span>

      {endIcon && !loading && <span className="btn__icon btn__icon--end">{endIcon}</span>}
    </button>
  );
};

export default Button;
