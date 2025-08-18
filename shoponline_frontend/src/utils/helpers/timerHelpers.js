/**
 * Timer calculation utilities for ShopOnline Uganda E-commerce Platform
 * Handles flash sale countdown timers, delivery timers, and time-based calculations
 */

/**
 * Calculate time remaining until a target date
 * @param {Date|string} targetDate - The target date/time
 * @returns {Object} Object containing days, hours, minutes, seconds, and helper methods
 */
export const calculateTimeRemaining = targetDate => {
  const target = new Date(targetDate);
  const now = new Date();
  const difference = target.getTime() - now.getTime();

  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      total: 0,
      isExpired: true,
      formatted: '00:00:00',
      formattedWithDays: '0d 00:00:00',
    };
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);

  return {
    days,
    hours,
    minutes,
    seconds,
    total: difference,
    isExpired: false,
    formatted: `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
    formattedWithDays: `${days}d ${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
  };
};

/**
 * Format time remaining for flash sale displays
 * @param {Date|string} endTime - Flash sale end time
 * @returns {Object} Formatted time display object
 */
export const formatFlashSaleTimer = endTime => {
  const timeRemaining = calculateTimeRemaining(endTime);

  if (timeRemaining.isExpired) {
    return {
      display: 'EXPIRED',
      urgency: 'expired',
      showTimer: false,
      textClass: 'text-red-600',
      bgClass: 'bg-red-100',
    };
  }

  let urgency = 'normal';
  let textClass = 'text-blue-600';
  let bgClass = 'bg-blue-100';

  // Determine urgency based on time remaining
  if (timeRemaining.total < 60 * 60 * 1000) {
    // Less than 1 hour
    urgency = 'critical';
    textClass = 'text-red-600';
    bgClass = 'bg-red-100';
  } else if (timeRemaining.total < 6 * 60 * 60 * 1000) {
    // Less than 6 hours
    urgency = 'high';
    textClass = 'text-orange-600';
    bgClass = 'bg-orange-100';
  } else if (timeRemaining.total < 24 * 60 * 60 * 1000) {
    // Less than 24 hours
    urgency = 'medium';
    textClass = 'text-yellow-600';
    bgClass = 'bg-yellow-100';
  }

  return {
    ...timeRemaining,
    display: timeRemaining.days > 0 ? timeRemaining.formattedWithDays : timeRemaining.formatted,
    urgency,
    showTimer: true,
    textClass,
    bgClass,
  };
};

/**
 * Create a countdown timer that calls a callback function
 * @param {Date|string} targetDate - Target date for countdown
 * @param {Function} callback - Function to call on each tick
 * @param {Function} onComplete - Function to call when timer completes
 * @returns {Function} Function to clear the timer
 */
export const createCountdownTimer = (targetDate, callback, onComplete = null) => {
  const updateTimer = () => {
    const timeRemaining = calculateTimeRemaining(targetDate);
    callback(timeRemaining);

    if (timeRemaining.isExpired && onComplete) {
      onComplete();
      return false; // Stop the interval
    }
    return true; // Continue the interval
  };

  // Initial call
  updateTimer();

  // Set up interval
  const interval = setInterval(() => {
    if (!updateTimer()) {
      clearInterval(interval);
    }
  }, 1000);

  // Return cleanup function
  return () => clearInterval(interval);
};

/**
 * Format duration in milliseconds to human-readable format
 * @param {number} milliseconds - Duration in milliseconds
 * @returns {string} Human-readable duration
 */
export const formatDuration = milliseconds => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
};

/**
 * Calculate delivery time estimate based on location (Uganda-specific)
 * @param {string} district - Uganda district
 * @param {string} deliveryMethod - Delivery method
 * @returns {Object} Delivery time estimate
 */
export const calculateDeliveryTime = (district, deliveryMethod = 'standard') => {
  const kampalaDistricts = ['Kampala', 'Wakiso', 'Mukono'];
  const centralRegion = ['Kampala', 'Wakiso', 'Mukono', 'Masaka', 'Mubende', 'Mityana'];

  let baseDays = 1; // Default for Kampala

  if (kampalaDistricts.includes(district)) {
    baseDays = deliveryMethod === 'express' ? 0.5 : 1; // Same day or next day
  } else if (centralRegion.includes(district)) {
    baseDays = deliveryMethod === 'express' ? 1 : 2; // Next day or 2 days
  } else {
    baseDays = deliveryMethod === 'express' ? 2 : 3; // 2-3 days for other regions
  }

  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + Math.ceil(baseDays));

  return {
    days: baseDays,
    estimatedDate,
    displayText:
      baseDays < 1
        ? 'Same day delivery'
        : `${Math.ceil(baseDays)} day${Math.ceil(baseDays) !== 1 ? 's' : ''}`,
    isExpress: deliveryMethod === 'express',
  };
};

/**
 * Check if a flash sale is currently active
 * @param {Object} flashSale - Flash sale object with start_time and end_time
 * @returns {boolean} Whether the flash sale is active
 */
export const isFlashSaleActive = flashSale => {
  const now = new Date();
  const startTime = new Date(flashSale.start_time);
  const endTime = new Date(flashSale.end_time);

  return now >= startTime && now <= endTime;
};

/**
 * Get flash sale status based on timing
 * @param {Object} flashSale - Flash sale object
 * @returns {Object} Status information
 */
export const getFlashSaleStatus = flashSale => {
  const now = new Date();
  const startTime = new Date(flashSale.start_time);
  const endTime = new Date(flashSale.end_time);

  if (now < startTime) {
    return {
      status: 'upcoming',
      timeUntilStart: calculateTimeRemaining(startTime),
      message: 'Coming Soon',
    };
  } else if (now >= startTime && now <= endTime) {
    return {
      status: 'active',
      timeRemaining: calculateTimeRemaining(endTime),
      message: 'Active Now',
    };
  } else {
    return {
      status: 'expired',
      timeExpired: calculateTimeRemaining(now) - calculateTimeRemaining(endTime),
      message: 'Expired',
    };
  }
};

/**
 * Format time for Uganda timezone (EAT - East Africa Time)
 * @param {Date|string} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted time string
 */
export const formatUgandaTime = (date, options = {}) => {
  const defaultOptions = {
    timeZone: 'Africa/Kampala',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };

  return new Date(date).toLocaleString('en-UG', defaultOptions);
};

/**
 * Create a timer for order timeout (for payments)
 * @param {number} timeoutMinutes - Timeout in minutes
 * @param {Function} onTick - Callback for each second
 * @param {Function} onTimeout - Callback when timer expires
 * @returns {Function} Cleanup function
 */
export const createOrderTimer = (timeoutMinutes = 15, onTick, onTimeout) => {
  const endTime = new Date();
  endTime.setMinutes(endTime.getMinutes() + timeoutMinutes);

  return createCountdownTimer(endTime, onTick, onTimeout);
};

/**
 * Calculate business hours for order processing (Uganda context)
 * @param {Date} date - Date to check
 * @returns {Object} Business hours information
 */
export const getBusinessHours = (date = new Date()) => {
  const ugandaTime = new Date(date.toLocaleString('en-US', { timeZone: 'Africa/Kampala' }));
  const dayOfWeek = ugandaTime.getDay();
  const hour = ugandaTime.getHours();

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  const isBusinessHours = hour >= 8 && hour < 18; // 8 AM to 6 PM

  const nextBusinessDay = new Date(ugandaTime);
  if (isWeekend || !isBusinessHours) {
    // Calculate next business day
    if (dayOfWeek === 6) {
      // Saturday
      nextBusinessDay.setDate(nextBusinessDay.getDate() + 2); // Monday
    } else if (dayOfWeek === 0) {
      // Sunday
      nextBusinessDay.setDate(nextBusinessDay.getDate() + 1); // Monday
    } else if (hour >= 18) {
      // After hours
      nextBusinessDay.setDate(nextBusinessDay.getDate() + 1); // Next day
    }
    nextBusinessDay.setHours(8, 0, 0, 0); // 8 AM
  }

  return {
    isBusinessHours: !isWeekend && isBusinessHours,
    isWeekend,
    currentHour: hour,
    nextBusinessDay,
    message:
      isBusinessHours && !isWeekend
        ? 'Orders are being processed now'
        : `Orders will be processed at ${formatUgandaTime(nextBusinessDay, {
          weekday: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })}`,
  };
};

/**
 * Utility to debounce timer updates for performance
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounceTimer = (func, delay = 100) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Create multiple synchronized timers
 * @param {Array} timers - Array of timer configurations
 * @returns {Function} Cleanup function for all timers
 */
export const createSynchronizedTimers = timers => {
  const cleanupFunctions = timers.map(timer =>
    createCountdownTimer(timer.targetDate, timer.callback, timer.onComplete)
  );

  return () => {
    cleanupFunctions.forEach(cleanup => cleanup());
  };
};

/**
 * Format time remaining with appropriate units
 * @param {number} milliseconds - Time in milliseconds
 * @returns {Object} Formatted time with appropriate unit
 */
export const formatTimeRemaining = milliseconds => {
  const timeRemaining = calculateTimeRemaining(new Date(Date.now() + milliseconds));

  if (timeRemaining.days > 0) {
    return {
      value: timeRemaining.days,
      unit: 'day',
      display: `${timeRemaining.days} day${timeRemaining.days !== 1 ? 's' : ''}`,
    };
  } else if (timeRemaining.hours > 0) {
    return {
      value: timeRemaining.hours,
      unit: 'hour',
      display: `${timeRemaining.hours} hour${timeRemaining.hours !== 1 ? 's' : ''}`,
    };
  } else if (timeRemaining.minutes > 0) {
    return {
      value: timeRemaining.minutes,
      unit: 'minute',
      display: `${timeRemaining.minutes} min${timeRemaining.minutes !== 1 ? 's' : ''}`,
    };
  } else {
    return {
      value: timeRemaining.seconds,
      unit: 'second',
      display: `${timeRemaining.seconds} sec${timeRemaining.seconds !== 1 ? 's' : ''}`,
    };
  }
};

/**
 * Calculate optimal timer update interval based on time remaining
 * @param {number} timeRemaining - Time remaining in milliseconds
 * @returns {number} Optimal update interval in milliseconds
 */
export const getOptimalUpdateInterval = timeRemaining => {
  if (timeRemaining < 60 * 1000) {
    // Less than 1 minute
    return 1000; // Update every second
  } else if (timeRemaining < 60 * 60 * 1000) {
    // Less than 1 hour
    return 1000; // Update every second
  } else if (timeRemaining < 24 * 60 * 60 * 1000) {
    // Less than 1 day
    return 60 * 1000; // Update every minute
  } else {
    return 5 * 60 * 1000; // Update every 5 minutes
  }
};

/**
 * Flash sale timer with automatic cleanup and performance optimization
 */
export class FlashSaleTimer {
  constructor(endTime, onUpdate, onExpire) {
    this.endTime = new Date(endTime);
    this.onUpdate = onUpdate;
    this.onExpire = onExpire;
    this.interval = null;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.tick();

    const updateInterval = () => {
      const remaining = this.endTime.getTime() - Date.now();
      return getOptimalUpdateInterval(remaining);
    };

    const scheduleNext = () => {
      if (!this.isRunning) return;

      const interval = updateInterval();
      this.interval = setTimeout(() => {
        this.tick();
        scheduleNext();
      }, interval);
    };

    scheduleNext();
  }

  tick() {
    const timeData = formatFlashSaleTimer(this.endTime);

    if (this.onUpdate) {
      this.onUpdate(timeData);
    }

    if (timeData.urgency === 'expired') {
      this.stop();
      if (this.onExpire) {
        this.onExpire();
      }
    }
  }

  stop() {
    this.isRunning = false;
    if (this.interval) {
      clearTimeout(this.interval);
      this.interval = null;
    }
  }

  updateEndTime(newEndTime) {
    this.endTime = new Date(newEndTime);
    if (this.isRunning) {
      this.tick(); // Immediate update
    }
  }
}

/**
 * Create a React-friendly timer hook utility
 * @param {Date|string} targetDate - Target date
 * @returns {Object} Timer state and controls
 */
export const createTimerState = targetDate => {
  let timeRemaining = calculateTimeRemaining(targetDate);
  let interval = null;

  const start = updateCallback => {
    if (interval) return;

    interval = setInterval(() => {
      timeRemaining = calculateTimeRemaining(targetDate);
      updateCallback(timeRemaining);

      if (timeRemaining.isExpired) {
        stop();
      }
    }, 1000);

    // Initial call
    updateCallback(timeRemaining);
  };

  const stop = () => {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  };

  const getCurrentTime = () => timeRemaining;

  return {
    start,
    stop,
    getCurrentTime,
    isExpired: () => timeRemaining.isExpired,
  };
};

/**
 * Validate timer inputs and dates
 * @param {Date|string} date - Date to validate
 * @returns {Object} Validation result
 */
export const validateTimerDate = date => {
  try {
    const targetDate = new Date(date);
    const now = new Date();

    if (isNaN(targetDate.getTime())) {
      return {
        isValid: false,
        error: 'Invalid date format',
      };
    }

    if (targetDate <= now) {
      return {
        isValid: false,
        error: 'Target date must be in the future',
      };
    }

    return {
      isValid: true,
      date: targetDate,
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Failed to parse date',
    };
  }
};

/**
 * Timer utilities for specific use cases
 */
export const TimerUtils = {
  flashSale: {
    create: (endTime, onUpdate, onExpire) => new FlashSaleTimer(endTime, onUpdate, onExpire),
    format: formatFlashSaleTimer,
    isActive: sale => isFlashSaleActive(sale),
  },

  order: {
    timeout: (minutes, onTick, onTimeout) => createOrderTimer(minutes, onTick, onTimeout),
    delivery: calculateDeliveryTime,
  },

  business: {
    hours: getBusinessHours,
    isBusinessTime: date => getBusinessHours(date).isBusinessHours,
  },

  format: {
    remaining: calculateTimeRemaining,
    duration: formatDuration,
    uganda: formatUgandaTime,
  },

  validate: validateTimerDate,
};
