import React from 'react';
import Spinner from './Spinner';
import './Loading.css';

const LoadingOverlay = ({
  isVisible = true,
  message = 'Loading...',
  size = 'large',
  backdrop = true,
  position = 'fixed', // 'fixed' or 'absolute'
}) => {
  if (!isVisible) return null;

  const overlayClasses = `loading-overlay loading-overlay--${position} ${
    !backdrop ? 'loading-overlay--no-backdrop' : ''
  }`.trim();

  return (
    <div className={overlayClasses}>
      <div className="loading-overlay__content">
        <Spinner size={size} color="white" />
        {message && <div className="loading-overlay__message">{message}</div>}
      </div>
    </div>
  );
};

export default LoadingOverlay;
