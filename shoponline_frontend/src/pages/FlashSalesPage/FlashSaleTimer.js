// src/pages/FlashSalesPage/FlashSaleTimer.js
import React, { useState, useEffect, useCallback } from 'react';
import './FlashSaleTimer.css';

const FlashSaleTimer = ({
  flashSale,
  onExpire,
  showTitle = true,
  size = 'medium',
  layout = 'horizontal',
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  });
  const [status, setStatus] = useState('loading'); // loading, upcoming, running, expired

  const calculateTimeLeft = useCallback(() => {
    if (!flashSale) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };

    const now = new Date().getTime();
    const startTime = new Date(flashSale.start_time).getTime();
    const endTime = new Date(flashSale.end_time).getTime();

    let targetTime;
    let newStatus;

    if (now < startTime) {
      // Flash sale hasn't started yet
      targetTime = startTime;
      newStatus = 'upcoming';
    } else if (now >= startTime && now <= endTime) {
      // Flash sale is running
      targetTime = endTime;
      newStatus = 'running';
    } else {
      // Flash sale has expired
      newStatus = 'expired';
      setStatus('expired');
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    const difference = targetTime - now;

    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setStatus(newStatus);
      return { days, hours, minutes, seconds, total: difference };
    } else {
      setStatus('expired');
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }
  }, [flashSale]);

  useEffect(() => {
    if (!flashSale) return;

    // Calculate initial time
    const initialTime = calculateTimeLeft();
    setTimeLeft(initialTime);

    // Set up interval to update every second
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      // Check if timer expired
      if (newTimeLeft.total <= 0) {
        clearInterval(timer);
        if (onExpire) {
          onExpire(flashSale);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [flashSale, calculateTimeLeft, onExpire]);

  const formatTime = time => {
    return time.toString().padStart(2, '0');
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'upcoming':
        return 'Starts in:';
      case 'running':
        return 'Ends in:';
      case 'expired':
        return 'Sale Ended';
      default:
        return '';
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'upcoming':
        return 'timer-upcoming';
      case 'running':
        return 'timer-running';
      case 'expired':
        return 'timer-expired';
      default:
        return '';
    }
  };

  const getUrgencyClass = () => {
    if (status === 'expired') return 'expired';
    if (timeLeft.total <= 3600000) return 'critical'; // Less than 1 hour
    if (timeLeft.total <= 7200000) return 'urgent'; // Less than 2 hours
    if (timeLeft.total <= 86400000) return 'warning'; // Less than 1 day
    return 'normal';
  };

  if (!flashSale) {
    return null;
  }

  return (
    <div className={`flash-sale-timer ${size} ${layout} ${getStatusClass()} ${getUrgencyClass()}`}>
      {showTitle && (
        <div className="timer-header">
          <h3 className="timer-title">{flashSale.name}</h3>
          <p className="timer-status">{getStatusMessage()}</p>
        </div>
      )}

      <div className="timer-container">
        {status === 'expired' ? (
          <div className="timer-expired-message">
            <span className="expired-icon">⏰</span>
            <span className="expired-text">Sale Ended</span>
          </div>
        ) : (
          <div className="timer-display">
            {/* Days */}
            {timeLeft.days > 0 && (
              <div className="time-unit">
                <div className="time-value">{formatTime(timeLeft.days)}</div>
                <div className="time-label">Day{timeLeft.days !== 1 ? 's' : ''}</div>
              </div>
            )}

            {/* Hours */}
            <div className="time-unit">
              <div className="time-value">{formatTime(timeLeft.hours)}</div>
              <div className="time-label">Hour{timeLeft.hours !== 1 ? 's' : ''}</div>
            </div>

            <div className="time-separator">:</div>

            {/* Minutes */}
            <div className="time-unit">
              <div className="time-value">{formatTime(timeLeft.minutes)}</div>
              <div className="time-label">Min{timeLeft.minutes !== 1 ? 's' : ''}</div>
            </div>

            <div className="time-separator">:</div>

            {/* Seconds */}
            <div className="time-unit">
              <div className="time-value">{formatTime(timeLeft.seconds)}</div>
              <div className="time-label">Sec{timeLeft.seconds !== 1 ? 's' : ''}</div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {status === 'running' && (
          <div className="timer-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(
                      100,
                      (timeLeft.total /
                        (new Date(flashSale.end_time) - new Date(flashSale.start_time))) *
                        100
                    )
                  )}%`,
                }}
              />
            </div>
            <div className="progress-text">
              {timeLeft.total <= 3600000 ? 'Hurry! Sale ending soon!' : 'Limited time offer!'}
            </div>
          </div>
        )}

        {/* Status Messages */}
        {status === 'upcoming' && (
          <div className="timer-message upcoming-message">
            <span className="message-icon">🕐</span>
            <span>Get ready for amazing deals!</span>
          </div>
        )}

        {status === 'running' && timeLeft.total <= 3600000 && (
          <div className="timer-message urgent-message">
            <span className="message-icon">⚡</span>
            <span>Last chance! Sale ending soon!</span>
          </div>
        )}
      </div>

      {/* Sale Info */}
      <div className="sale-info">
        <div className="discount-info">
          <span className="discount-text">Up to {flashSale.discount_percentage}% OFF</span>
          {flashSale.max_discount_amount && (
            <span className="max-discount">
              (Max UGX {Number(flashSale.max_discount_amount).toLocaleString()} off)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlashSaleTimer;
