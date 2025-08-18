// Date manipulation utilities for the Ugandan e-commerce platform
// Handles date formatting, calculations, and timezone operations

import { APP_CONFIG } from '../constants/app';

/**
 * Date Creation and Parsing
 */
export const createDate = dateInput => {
  try {
    if (!dateInput) {
      return new Date();
    }

    if (dateInput instanceof Date) {
      return new Date(dateInput.getTime());
    }

    return new Date(dateInput);
  } catch (error) {
    console.error('Error creating date:', error);
    return new Date();
  }
};

export const parseISODate = isoString => {
  try {
    if (!isoString) {
      return null;
    }

    const date = new Date(isoString);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.error('Error parsing ISO date:', error);
    return null;
  }
};

export const parseDateString = (dateString, format = 'DD/MM/YYYY') => {
  try {
    if (!dateString) {
      return null;
    }

    let day, month, year;

    switch (format) {
      case 'DD/MM/YYYY':
        [day, month, year] = dateString.split('/');
        break;
      case 'MM/DD/YYYY':
        [month, day, year] = dateString.split('/');
        break;
      case 'YYYY-MM-DD':
        [year, month, day] = dateString.split('-');
        break;
      default:
        return new Date(dateString);
    }

    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.error('Error parsing date string:', error);
    return null;
  }
};

/**
 * Date Formatting
 */
export const formatDate = (date, format = APP_CONFIG.DATE_FORMAT) => {
  try {
    const d = createDate(date);

    if (isNaN(d.getTime())) {
      return 'Invalid Date';
    }

    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();

    switch (format) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'DD MMM YYYY':
        return d.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          timeZone: APP_CONFIG.TIMEZONE,
        });
      case 'MMM DD, YYYY':
        return d.toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
          timeZone: APP_CONFIG.TIMEZONE,
        });
      case 'dddd, MMMM DD, YYYY':
        return d.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: '2-digit',
          year: 'numeric',
          timeZone: APP_CONFIG.TIMEZONE,
        });
      default:
        return d.toLocaleDateString('en-UG', { timeZone: APP_CONFIG.TIMEZONE });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

export const formatTime = (date, format = APP_CONFIG.TIME_FORMAT) => {
  try {
    const d = createDate(date);

    if (isNaN(d.getTime())) {
      return 'Invalid Time';
    }

    const options = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: format === '12h',
      timeZone: APP_CONFIG.TIMEZONE,
    };

    if (format.includes('s')) {
      options.second = '2-digit';
    }

    return d.toLocaleTimeString('en-UG', options);
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid Time';
  }
};

export const formatDateTime = (date, options = {}) => {
  try {
    const {
      dateFormat = APP_CONFIG.DATE_FORMAT,
      timeFormat = APP_CONFIG.TIME_FORMAT,
      separator = ' ',
      showTime = true,
    } = options;

    const formattedDate = formatDate(date, dateFormat);

    if (!showTime) {
      return formattedDate;
    }

    const formattedTime = formatTime(date, timeFormat);
    return `${formattedDate}${separator}${formattedTime}`;
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'Invalid DateTime';
  }
};

export const formatRelativeTime = (date, options = {}) => {
  try {
    const { showFullDate = false, shortFormat = false } = options;

    const now = new Date();
    const target = createDate(date);
    const diffInSeconds = Math.floor((now - target) / 1000);

    if (diffInSeconds < 0) {
      // Future date
      const absDiff = Math.abs(diffInSeconds);
      if (absDiff < 60) return shortFormat ? 'in <1m' : 'in less than a minute';
      if (absDiff < 3600) {
        const minutes = Math.floor(absDiff / 60);
        return shortFormat ? `in ${minutes}m` : `in ${minutes} minute${minutes > 1 ? 's' : ''}`;
      }
      if (absDiff < 86400) {
        const hours = Math.floor(absDiff / 3600);
        return shortFormat ? `in ${hours}h` : `in ${hours} hour${hours > 1 ? 's' : ''}`;
      }
      if (showFullDate) return formatDate(date);
      const days = Math.floor(absDiff / 86400);
      return shortFormat ? `in ${days}d` : `in ${days} day${days > 1 ? 's' : ''}`;
    }

    // Past date
    if (diffInSeconds < 60) return shortFormat ? '<1m ago' : 'just now';
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return shortFormat ? `${minutes}m ago` : `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return shortFormat ? `${hours}h ago` : `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    if (diffInSeconds < 604800) {
      // 7 days
      const days = Math.floor(diffInSeconds / 86400);
      return shortFormat ? `${days}d ago` : `${days} day${days > 1 ? 's' : ''} ago`;
    }

    return showFullDate ? formatDate(date) : formatDate(date, 'MMM DD, YYYY');
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Unknown time';
  }
};

/**
 * Date Calculations and Operations
 */
export const addDays = (date, days) => {
  try {
    const result = createDate(date);
    result.setDate(result.getDate() + days);
    return result;
  } catch (error) {
    console.error('Error adding days:', error);
    return createDate(date);
  }
};

export const addHours = (date, hours) => {
  try {
    const result = createDate(date);
    result.setHours(result.getHours() + hours);
    return result;
  } catch (error) {
    console.error('Error adding hours:', error);
    return createDate(date);
  }
};

export const addMinutes = (date, minutes) => {
  try {
    const result = createDate(date);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
  } catch (error) {
    console.error('Error adding minutes:', error);
    return createDate(date);
  }
};

export const subtractDays = (date, days) => {
  return addDays(date, -days);
};

export const subtractHours = (date, hours) => {
  return addHours(date, -hours);
};

export const subtractMinutes = (date, minutes) => {
  return addMinutes(date, -minutes);
};

export const startOfDay = date => {
  try {
    const result = createDate(date);
    result.setHours(0, 0, 0, 0);
    return result;
  } catch (error) {
    console.error('Error getting start of day:', error);
    return createDate(date);
  }
};

export const endOfDay = date => {
  try {
    const result = createDate(date);
    result.setHours(23, 59, 59, 999);
    return result;
  } catch (error) {
    console.error('Error getting end of day:', error);
    return createDate(date);
  }
};

export const startOfWeek = (date, startDay = 1) => {
  // 1 = Monday, 0 = Sunday
  try {
    const result = createDate(date);
    const day = result.getDay();
    const diff = (day + 7 - startDay) % 7;
    result.setDate(result.getDate() - diff);
    return startOfDay(result);
  } catch (error) {
    console.error('Error getting start of week:', error);
    return createDate(date);
  }
};

export const endOfWeek = (date, startDay = 1) => {
  try {
    const result = startOfWeek(date, startDay);
    result.setDate(result.getDate() + 6);
    return endOfDay(result);
  } catch (error) {
    console.error('Error getting end of week:', error);
    return createDate(date);
  }
};

export const startOfMonth = date => {
  try {
    const result = createDate(date);
    result.setDate(1);
    return startOfDay(result);
  } catch (error) {
    console.error('Error getting start of month:', error);
    return createDate(date);
  }
};

export const endOfMonth = date => {
  try {
    const result = createDate(date);
    result.setMonth(result.getMonth() + 1, 0);
    return endOfDay(result);
  } catch (error) {
    console.error('Error getting end of month:', error);
    return createDate(date);
  }
};

export const startOfYear = date => {
  try {
    const result = createDate(date);
    result.setMonth(0, 1);
    return startOfDay(result);
  } catch (error) {
    console.error('Error getting start of year:', error);
    return createDate(date);
  }
};

export const endOfYear = date => {
  try {
    const result = createDate(date);
    result.setMonth(11, 31);
    return endOfDay(result);
  } catch (error) {
    console.error('Error getting end of year:', error);
    return createDate(date);
  }
};

/**
 * Date Comparison Functions
 */
export const isSameDay = (date1, date2) => {
  try {
    const d1 = createDate(date1);
    const d2 = createDate(date2);

    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  } catch (error) {
    console.error('Error comparing same day:', error);
    return false;
  }
};

export const isSameWeek = (date1, date2) => {
  try {
    const start1 = startOfWeek(date1);
    const start2 = startOfWeek(date2);

    return isSameDay(start1, start2);
  } catch (error) {
    console.error('Error comparing same week:', error);
    return false;
  }
};

export const isSameMonth = (date1, date2) => {
  try {
    const d1 = createDate(date1);
    const d2 = createDate(date2);

    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
  } catch (error) {
    console.error('Error comparing same month:', error);
    return false;
  }
};

export const isSameYear = (date1, date2) => {
  try {
    const d1 = createDate(date1);
    const d2 = createDate(date2);

    return d1.getFullYear() === d2.getFullYear();
  } catch (error) {
    console.error('Error comparing same year:', error);
    return false;
  }
};

export const isAfter = (date1, date2) => {
  try {
    const d1 = createDate(date1);
    const d2 = createDate(date2);

    return d1 > d2;
  } catch (error) {
    console.error('Error comparing dates (after):', error);
    return false;
  }
};

export const isBefore = (date1, date2) => {
  try {
    const d1 = createDate(date1);
    const d2 = createDate(date2);

    return d1 < d2;
  } catch (error) {
    console.error('Error comparing dates (before):', error);
    return false;
  }
};

export const isToday = date => {
  return isSameDay(date, new Date());
};

export const isYesterday = date => {
  const yesterday = addDays(new Date(), -1);
  return isSameDay(date, yesterday);
};

export const isTomorrow = date => {
  const tomorrow = addDays(new Date(), 1);
  return isSameDay(date, tomorrow);
};

export const isWeekend = date => {
  try {
    const d = createDate(date);
    const day = d.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  } catch (error) {
    console.error('Error checking weekend:', error);
    return false;
  }
};

export const isWeekday = date => {
  return !isWeekend(date);
};

/**
 * Date Difference Calculations
 */
export const diffInDays = (date1, date2) => {
  try {
    const d1 = startOfDay(createDate(date1));
    const d2 = startOfDay(createDate(date2));
    const diffTime = Math.abs(d1 - d2);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.error('Error calculating days difference:', error);
    return 0;
  }
};

export const diffInHours = (date1, date2) => {
  try {
    const d1 = createDate(date1);
    const d2 = createDate(date2);
    const diffTime = Math.abs(d1 - d2);
    return Math.floor(diffTime / (1000 * 60 * 60));
  } catch (error) {
    console.error('Error calculating hours difference:', error);
    return 0;
  }
};

export const diffInMinutes = (date1, date2) => {
  try {
    const d1 = createDate(date1);
    const d2 = createDate(date2);
    const diffTime = Math.abs(d1 - d2);
    return Math.floor(diffTime / (1000 * 60));
  } catch (error) {
    console.error('Error calculating minutes difference:', error);
    return 0;
  }
};

export const diffInSeconds = (date1, date2) => {
  try {
    const d1 = createDate(date1);
    const d2 = createDate(date2);
    const diffTime = Math.abs(d1 - d2);
    return Math.floor(diffTime / 1000);
  } catch (error) {
    console.error('Error calculating seconds difference:', error);
    return 0;
  }
};

/**
 * Business and Working Days
 */
export const isBusinessDay = date => {
  try {
    const d = createDate(date);
    const day = d.getDay();
    // Monday to Friday (1-5)
    return day >= 1 && day <= 5;
  } catch (error) {
    console.error('Error checking business day:', error);
    return false;
  }
};

export const addBusinessDays = (date, businessDays) => {
  try {
    let result = createDate(date);
    let addedDays = 0;

    while (addedDays < businessDays) {
      result = addDays(result, 1);
      if (isBusinessDay(result)) {
        addedDays++;
      }
    }

    return result;
  } catch (error) {
    console.error('Error adding business days:', error);
    return createDate(date);
  }
};

export const getBusinessDaysBetween = (startDate, endDate) => {
  try {
    let count = 0;
    let current = createDate(startDate);
    const end = createDate(endDate);

    while (current <= end) {
      if (isBusinessDay(current)) {
        count++;
      }
      current = addDays(current, 1);
    }

    return count;
  } catch (error) {
    console.error('Error calculating business days between:', error);
    return 0;
  }
};

/**
 * Date Validation
 */
export const isValidDate = date => {
  try {
    const d = createDate(date);
    return !isNaN(d.getTime());
  } catch (error) {
    return false;
  }
};

export const isValidDateRange = (startDate, endDate) => {
  try {
    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      return false;
    }

    const start = createDate(startDate);
    const end = createDate(endDate);

    return start <= end;
  } catch (error) {
    console.error('Error validating date range:', error);
    return false;
  }
};

export const isExpired = expiryDate => {
  try {
    if (!isValidDate(expiryDate)) {
      return true;
    }

    const expiry = createDate(expiryDate);
    const now = new Date();

    return now > expiry;
  } catch (error) {
    console.error('Error checking expiry:', error);
    return true;
  }
};

export const getMinSelectableDate = (daysFromNow = 0) => {
  try {
    const date = addDays(new Date(), daysFromNow);
    return formatDate(date, 'YYYY-MM-DD');
  } catch (error) {
    console.error('Error getting min selectable date:', error);
    return formatDate(new Date(), 'YYYY-MM-DD');
  }
};

export const getMaxSelectableDate = (daysFromNow = 365) => {
  try {
    const date = addDays(new Date(), daysFromNow);
    return formatDate(date, 'YYYY-MM-DD');
  } catch (error) {
    console.error('Error getting max selectable date:', error);
    return formatDate(addDays(new Date(), 365), 'YYYY-MM-DD');
  }
};

/**
 * Time Zone Utilities
 */
export const toUgandaTime = date => {
  try {
    const d = createDate(date);
    return new Date(d.toLocaleString('en-US', { timeZone: APP_CONFIG.TIMEZONE }));
  } catch (error) {
    console.error('Error converting to Uganda time:', error);
    return createDate(date);
  }
};

export const toUTC = date => {
  try {
    const d = createDate(date);
    return new Date(d.getTime() + d.getTimezoneOffset() * 60000);
  } catch (error) {
    console.error('Error converting to UTC:', error);
    return createDate(date);
  }
};

export const getTimezoneOffset = () => {
  try {
    const ugandaTime = new Date().toLocaleString('en-US', { timeZone: APP_CONFIG.TIMEZONE });
    const localTime = new Date().toLocaleString('en-US');

    return new Date(ugandaTime) - new Date(localTime);
  } catch (error) {
    console.error('Error getting timezone offset:', error);
    return 0;
  }
};

/**
 * Calendar and Period Utilities
 */
export const getCalendarMonth = (year, month) => {
  try {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const weeks = [];
    let currentWeek = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      currentWeek.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(new Date(year, month, day));

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Add empty cells for remaining days in the last week
    while (currentWeek.length < 7 && currentWeek.length > 0) {
      currentWeek.push(null);
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  } catch (error) {
    console.error('Error getting calendar month:', error);
    return [];
  }
};

export const getDateRangeArray = (startDate, endDate) => {
  try {
    const dates = [];
    let current = createDate(startDate);
    const end = createDate(endDate);

    while (current <= end) {
      dates.push(new Date(current));
      current = addDays(current, 1);
    }

    return dates;
  } catch (error) {
    console.error('Error getting date range array:', error);
    return [];
  }
};

/**
 * Utility Functions for Common Operations
 */
export const getAge = birthDate => {
  try {
    const birth = createDate(birthDate);
    const today = new Date();

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return Math.max(0, age);
  } catch (error) {
    console.error('Error calculating age:', error);
    return 0;
  }
};

export const getQuarter = date => {
  try {
    const d = createDate(date);
    const month = d.getMonth();
    return Math.floor(month / 3) + 1;
  } catch (error) {
    console.error('Error getting quarter:', error);
    return 1;
  }
};

export const getWeekNumber = date => {
  try {
    const d = createDate(date);
    const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
    const pastDaysOfYear = (d - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  } catch (error) {
    console.error('Error getting week number:', error);
    return 1;
  }
};

export const getDayName = (date, format = 'long') => {
  try {
    const d = createDate(date);
    const options = {
      weekday: format,
      timeZone: APP_CONFIG.TIMEZONE,
    };
    return d.toLocaleDateString('en-UG', options);
  } catch (error) {
    console.error('Error getting day name:', error);
    return '';
  }
};

export const getMonthName = (date, format = 'long') => {
  try {
    const d = createDate(date);
    const options = {
      month: format,
      timeZone: APP_CONFIG.TIMEZONE,
    };
    return d.toLocaleDateString('en-UG', options);
  } catch (error) {
    console.error('Error getting month name:', error);
    return '';
  }
};

/**
 * Flash Sale and Timer Specific Functions
 */
export const calculateTimeRemaining = endTime => {
  try {
    const now = new Date();
    const end = createDate(endTime);
    const diff = end - now;

    if (diff <= 0) {
      return {
        expired: true,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalMilliseconds: 0,
      };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      expired: false,
      days,
      hours,
      minutes,
      seconds,
      totalMilliseconds: diff,
    };
  } catch (error) {
    console.error('Error calculating time remaining:', error);
    return {
      expired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMilliseconds: 0,
    };
  }
};

export const formatCountdown = (timeRemaining, options = {}) => {
  try {
    const {
      showDays = true,
      showHours = true,
      showMinutes = true,
      showSeconds = true,
      separator = ':',
      padZeros = true,
    } = options;

    if (timeRemaining.expired) {
      return 'Expired';
    }

    const parts = [];

    if (showDays && timeRemaining.days > 0) {
      parts.push(
        padZeros ? timeRemaining.days.toString().padStart(2, '0') : timeRemaining.days.toString()
      );
    }

    if (showHours) {
      parts.push(
        padZeros ? timeRemaining.hours.toString().padStart(2, '0') : timeRemaining.hours.toString()
      );
    }

    if (showMinutes) {
      parts.push(
        padZeros
          ? timeRemaining.minutes.toString().padStart(2, '0')
          : timeRemaining.minutes.toString()
      );
    }

    if (showSeconds) {
      parts.push(
        padZeros
          ? timeRemaining.seconds.toString().padStart(2, '0')
          : timeRemaining.seconds.toString()
      );
    }

    return parts.join(separator);
  } catch (error) {
    console.error('Error formatting countdown:', error);
    return '00:00:00';
  }
};

export const isNearExpiry = (endTime, warningThresholdMinutes = 60) => {
  try {
    const timeRemaining = calculateTimeRemaining(endTime);

    if (timeRemaining.expired) {
      return false;
    }

    const totalMinutes =
      timeRemaining.days * 24 * 60 + timeRemaining.hours * 60 + timeRemaining.minutes;

    return totalMinutes <= warningThresholdMinutes;
  } catch (error) {
    console.error('Error checking near expiry:', error);
    return false;
  }
};

/**
 * Date Range Presets for Filters
 */
export const getDateRangePresets = () => {
  const now = new Date();

  return {
    today: {
      label: 'Today',
      startDate: startOfDay(now),
      endDate: endOfDay(now),
    },
    yesterday: {
      label: 'Yesterday',
      startDate: startOfDay(addDays(now, -1)),
      endDate: endOfDay(addDays(now, -1)),
    },
    thisWeek: {
      label: 'This Week',
      startDate: startOfWeek(now),
      endDate: endOfWeek(now),
    },
    lastWeek: {
      label: 'Last Week',
      startDate: startOfWeek(addDays(now, -7)),
      endDate: endOfWeek(addDays(now, -7)),
    },
    thisMonth: {
      label: 'This Month',
      startDate: startOfMonth(now),
      endDate: endOfMonth(now),
    },
    lastMonth: {
      label: 'Last Month',
      startDate: startOfMonth(addDays(now, -30)),
      endDate: endOfMonth(addDays(now, -30)),
    },
    last30Days: {
      label: 'Last 30 Days',
      startDate: startOfDay(addDays(now, -30)),
      endDate: endOfDay(now),
    },
    last90Days: {
      label: 'Last 90 Days',
      startDate: startOfDay(addDays(now, -90)),
      endDate: endOfDay(now),
    },
    thisYear: {
      label: 'This Year',
      startDate: startOfYear(now),
      endDate: endOfYear(now),
    },
    lastYear: {
      label: 'Last Year',
      startDate: startOfYear(addDays(now, -365)),
      endDate: endOfYear(addDays(now, -365)),
    },
  };
};

// Default export with all date helper functions
export default {
  createDate,
  parseISODate,
  parseDateString,
  formatDate,
  formatTime,
  formatDateTime,
  formatRelativeTime,
  addDays,
  addHours,
  addMinutes,
  subtractDays,
  subtractHours,
  subtractMinutes,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isSameDay,
  isSameWeek,
  isSameMonth,
  isSameYear,
  isAfter,
  isBefore,
  isToday,
  isYesterday,
  isTomorrow,
  isWeekend,
  isWeekday,
  diffInDays,
  diffInHours,
  diffInMinutes,
  diffInSeconds,
  isBusinessDay,
  addBusinessDays,
  getBusinessDaysBetween,
  isValidDate,
  isValidDateRange,
  isExpired,
  getMinSelectableDate,
  getMaxSelectableDate,
  toUgandaTime,
  toUTC,
  getTimezoneOffset,
  getCalendarMonth,
  getDateRangeArray,
  getAge,
  getQuarter,
  getWeekNumber,
  getDayName,
  getMonthName,
  calculateTimeRemaining,
  formatCountdown,
  isNearExpiry,
  getDateRangePresets,
};
