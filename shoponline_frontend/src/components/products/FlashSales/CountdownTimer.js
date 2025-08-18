import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Clock, AlertCircle } from 'lucide-react';
import './FlashSales.css';

const CountdownTimer = ({
  endTime,
  onExpiry,
  showIcon = true,
  size = 'medium',
  format = 'full',
  className = '',
  autoHide = false,
}) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate time remaining
  const calculateTimeLeft = () => {
    if (!endTime) return null;

    const now = new Date().getTime();
    const targetTime = new Date(endTime).getTime();
    const difference = targetTime - now;

    if (difference <= 0) {
      return null;
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, total: difference };
  };

  useEffect(() => {
    if (!endTime) {
      setIsLoading(false);
      return;
    }

    // Initial calculation
    const initialTimeLeft = calculateTimeLeft();
    if (initialTimeLeft) {
      setTimeLeft(initialTimeLeft);
      setIsLoading(false);
    } else {
      setIsExpired(true);
      setIsLoading(false);
      if (onExpiry) {
        onExpiry();
      }
      return;
    }

    // Set up interval
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();

      if (newTimeLeft) {
        setTimeLeft(newTimeLeft);
      } else {
        setIsExpired(true);
        clearInterval(timer);
        if (onExpiry) {
          onExpiry();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, onExpiry]);

  const formatTime = time => {
    if (!time) return null;

    switch (format) {
      case 'compact':
        if (time.days > 0) {
          return `${time.days}d ${time.hours}h ${time.minutes}m`;
        } else if (time.hours > 0) {
          return `${time.hours}h ${time.minutes}m ${time.seconds}s`;
        } else {
          return `${time.minutes}m ${time.seconds}s`;
        }

      case 'short':
        return `${String(time.hours + time.days * 24).padStart(2, '0')}:${String(
          time.minutes
        ).padStart(2, '0')}:${String(time.seconds).padStart(2, '0')}`;

      case 'full':
      default:
        const parts = [];
        if (time.days > 0) parts.push(`${time.days} day${time.days !== 1 ? 's' : ''}`);
        if (time.hours > 0) parts.push(`${time.hours} hour${time.hours !== 1 ? 's' : ''}`);
        if (time.minutes > 0) parts.push(`${time.minutes} min${time.minutes !== 1 ? 's' : ''}`);
        if (time.seconds > 0 && time.days === 0)
          parts.push(`${time.seconds} sec${time.seconds !== 1 ? 's' : ''}`);

        return parts.join(', ');
    }
  };

  const getUrgencyClass = () => {
    if (!timeLeft) return '';

    const totalMinutes = Math.floor(timeLeft.total / (1000 * 60));

    if (totalMinutes <= 5) return 'countdown-critical';
    if (totalMinutes <= 30) return 'countdown-urgent';
    if (totalMinutes <= 120) return 'countdown-warning';

    return 'countdown-normal';
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'countdown-small';
      case 'large':
        return 'countdown-large';
      case 'medium':
      default:
        return 'countdown-medium';
    }
  };

  // Auto-hide if expired and autoHide is true
  if (isExpired && autoHide) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={`countdown-timer countdown-loading ${getSizeClass()} ${className}`}>
        <div className="countdown-skeleton">
          {showIcon && <div className="countdown-icon-skeleton" />}
          <div className="countdown-text-skeleton" />
        </div>
      </div>
    );
  }

  // Expired state
  if (isExpired) {
    return (
      <div className={`countdown-timer countdown-expired ${getSizeClass()} ${className}`}>
        <div className="countdown-content">
          {showIcon && (
            <AlertCircle
              className="countdown-icon"
              size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
            />
          )}
          <span className="countdown-text">Sale Ended</span>
        </div>
      </div>
    );
  }

  // Active countdown
  return (
    <div className={`countdown-timer ${getUrgencyClass()} ${getSizeClass()} ${className}`}>
      <div className="countdown-content">
        {showIcon && (
          <Clock
            className="countdown-icon"
            size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
          />
        )}
        <div className="countdown-display">
          {format === 'blocks' && timeLeft ? (
            <div className="countdown-blocks">
              {timeLeft.days > 0 && (
                <div className="countdown-block">
                  <span className="countdown-number">{timeLeft.days}</span>
                  <span className="countdown-label">Day{timeLeft.days !== 1 ? 's' : ''}</span>
                </div>
              )}
              <div className="countdown-block">
                <span className="countdown-number">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="countdown-label">Hours</span>
              </div>
              <div className="countdown-block">
                <span className="countdown-number">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="countdown-label">Mins</span>
              </div>
              <div className="countdown-block">
                <span className="countdown-number">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="countdown-label">Secs</span>
              </div>
            </div>
          ) : (
            <span className="countdown-text">
              {timeLeft ? formatTime(timeLeft) : 'Calculating...'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

CountdownTimer.propTypes = {
  endTime: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
  onExpiry: PropTypes.func,
  showIcon: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  format: PropTypes.oneOf(['full', 'short', 'compact', 'blocks']),
  className: PropTypes.string,
  autoHide: PropTypes.bool,
};

// Higher-order component for flash sale countdown
export const FlashSaleCountdown = ({ flashSale, ...props }) => {
  const handleExpiry = () => {
    // Could trigger flash sale expiry actions here
    console.log(`Flash sale "${flashSale?.name}" has expired`);
  };

  return <CountdownTimer endTime={flashSale?.end_time} onExpiry={handleExpiry} {...props} />;
};

FlashSaleCountdown.propTypes = {
  flashSale: PropTypes.shape({
    name: PropTypes.string,
    end_time: PropTypes.string,
  }).isRequired,
};

// Utility component for countdown in different contexts
export const ProductCountdown = ({ product, ...props }) => {
  // Get flash sale info from product
  const flashSale = product?.flash_sale_info;

  if (!flashSale || !flashSale.end_time) {
    return null;
  }

  return <CountdownTimer endTime={flashSale.end_time} format="compact" size="small" {...props} />;
};

ProductCountdown.propTypes = {
  product: PropTypes.object.isRequired,
};

export default CountdownTimer;
