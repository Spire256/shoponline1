// src/hooks/useCountdown.js
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for countdown timers
 * Perfect for flash sales, limited time offers, etc.
 */
export const useCountdown = (targetDate, options = {}) => {
  const { onComplete = () => {}, onTick = () => {}, interval = 1000, autoStart = true } = options;

  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isActive, setIsActive] = useState(autoStart);
  const [isCompleted, setIsCompleted] = useState(false);
  const intervalRef = useRef(null);

  // Calculate time remaining
  const calculateTimeRemaining = useCallback(() => {
    if (!targetDate) return 0;

    const now = new Date().getTime();
    const target = new Date(targetDate).getTime();
    const difference = target - now;

    return Math.max(0, Math.floor(difference / 1000));
  }, [targetDate]);

  // Update time remaining
  const updateTimer = useCallback(() => {
    const remaining = calculateTimeRemaining();
    setTimeRemaining(remaining);

    onTick(remaining);

    if (remaining === 0 && !isCompleted) {
      setIsCompleted(true);
      setIsActive(false);
      onComplete();
    }
  }, [calculateTimeRemaining, onTick, onComplete, isCompleted]);

  // Start the timer
  const start = useCallback(() => {
    if (!isCompleted) {
      setIsActive(true);
    }
  }, [isCompleted]);

  // Stop the timer
  const stop = useCallback(() => {
    setIsActive(false);
  }, []);

  // Reset the timer
  const reset = useCallback(() => {
    setIsActive(false);
    setIsCompleted(false);
    setTimeRemaining(calculateTimeRemaining());
  }, [calculateTimeRemaining]);

  // Effect to handle the countdown interval
  useEffect(() => {
    if (isActive && !isCompleted) {
      updateTimer(); // Initial update
      intervalRef.current = setInterval(updateTimer, interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isCompleted, updateTimer, interval]);

  // Initialize time remaining on mount or when target changes
  useEffect(() => {
    const remaining = calculateTimeRemaining();
    setTimeRemaining(remaining);
    setIsCompleted(remaining === 0);

    if (remaining === 0) {
      setIsActive(false);
    }
  }, [targetDate, calculateTimeRemaining]);

  // Format time remaining into readable format
  const formatTime = useCallback((seconds, format = 'full') => {
    if (seconds <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const timeObject = { days, hours, minutes, seconds: secs };

    if (format === 'object') {
      return timeObject;
    }

    if (format === 'compact') {
      if (days > 0) return `${days}d ${hours}h`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m ${secs}s`;
    }

    if (format === 'digital') {
      if (days > 0) {
        return `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    }

    // 'full' format
    const parts = [];
    if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
    if (secs > 0 && days === 0) parts.push(`${secs} second${secs !== 1 ? 's' : ''}`);

    return parts.join(', ') || '0 seconds';
  }, []);

  // Get formatted time with different formats
  const formattedTime = {
    full: formatTime(timeRemaining, 'full'),
    compact: formatTime(timeRemaining, 'compact'),
    digital: formatTime(timeRemaining, 'digital'),
    object: formatTime(timeRemaining, 'object'),
  };

  // Get percentage of time elapsed (0-100)
  const getProgress = useCallback(() => {
    if (!targetDate) return 100;

    const start = new Date().getTime();
    const end = new Date(targetDate).getTime();
    const total = end - start;
    const remaining = timeRemaining * 1000;

    if (total <= 0) return 100;

    return Math.max(0, Math.min(100, ((total - remaining) / total) * 100));
  }, [targetDate, timeRemaining]);

  // Check if countdown is in different phases
  const isLastMinute = timeRemaining <= 60;
  const isLastHour = timeRemaining <= 3600;
  const isLastDay = timeRemaining <= 86400;

  // Get urgency level
  const getUrgencyLevel = useCallback(() => {
    if (isCompleted) return 'expired';
    if (isLastMinute) return 'critical';
    if (timeRemaining <= 300) return 'urgent'; // 5 minutes
    if (isLastHour) return 'warning';
    if (isLastDay) return 'notice';
    return 'normal';
  }, [isCompleted, isLastMinute, isLastHour, isLastDay, timeRemaining]);

  return {
    // Time data
    timeRemaining,
    formattedTime,

    // State
    isActive,
    isCompleted,

    // Status checks
    isLastMinute,
    isLastHour,
    isLastDay,

    // Controls
    start,
    stop,
    reset,

    // Utilities
    formatTime,
    getProgress,
    getUrgencyLevel: getUrgencyLevel(),
  };
};

// Hook for multiple countdowns (useful for flash sales page)
export const useMultipleCountdowns = (timers = []) => {
  const [countdowns, setCountdowns] = useState({});

  useEffect(() => {
    const intervals = {};

    timers.forEach(timer => {
      const { id, targetDate, onComplete } = timer;

      if (!targetDate) return;

      const updateTimer = () => {
        const now = new Date().getTime();
        const target = new Date(targetDate).getTime();
        const timeRemaining = Math.max(0, Math.floor((target - now) / 1000));

        setCountdowns(prev => ({
          ...prev,
          [id]: timeRemaining,
        }));

        if (timeRemaining === 0) {
          clearInterval(intervals[id]);
          delete intervals[id];
          if (onComplete) onComplete(id);
        }
      };

      updateTimer(); // Initial update
      intervals[id] = setInterval(updateTimer, 1000);
    });

    return () => {
      Object.values(intervals).forEach(interval => clearInterval(interval));
    };
  }, [timers]);

  const formatTime = (seconds, format = 'compact') => {
    if (seconds <= 0) return 'Expired';

    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (format === 'compact') {
      if (days > 0) return `${days}d ${hours}h`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m ${secs}s`;
    }

    if (format === 'digital') {
      if (days > 0) {
        return `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    }

    return { days, hours, minutes, seconds: secs };
  };

  return {
    countdowns,
    formatTime,
    getCountdown: id => countdowns[id] || 0,
    isExpired: id => (countdowns[id] || 0) === 0,
  };
};

export default useCountdown;
