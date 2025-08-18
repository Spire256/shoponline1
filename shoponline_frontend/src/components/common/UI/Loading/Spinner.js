import React from 'react';
import './Loading.css';

const Spinner = ({ size = 'medium', color = 'primary', className = '', label = 'Loading...' }) => {
  const spinnerClasses = `spinner spinner--${size} spinner--${color} ${className}`.trim();

  return (
    <div className={spinnerClasses} role="status" aria-label={label}>
      <svg className="spinner__svg" viewBox="0 0 24 24">
        <circle
          className="spinner__circle"
          cx="12"
          cy="12"
          r="10"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default Spinner;
