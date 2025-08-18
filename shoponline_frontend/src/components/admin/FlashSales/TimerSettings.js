import React, { useState, useEffect } from 'react';
import { Clock, Calendar, AlertCircle, Info, Zap, Target } from 'lucide-react';
import './FlashSaleManagement.css';

const TimerSettings = ({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  disabled = false,
  errors = {},
  showPresets = true,
}) => {
  const [duration, setDuration] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
  });

  const [presetDurations] = useState([
    { label: '1 Hour Flash', hours: 1, icon: '⚡' },
    { label: '3 Hour Power Sale', hours: 3, icon: '💫' },
    { label: '6 Hour Special', hours: 6, icon: '🔥' },
    { label: '12 Hour Marathon', hours: 12, icon: '⭐' },
    { label: '24 Hour Event', hours: 24, icon: '🎯' },
    { label: '48 Hour Weekend', hours: 48, icon: '🏆' },
    { label: '72 Hour Extended', hours: 72, icon: '🚀' },
    { label: '1 Week Campaign', hours: 168, icon: '👑' },
  ]);

  const [timeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [warnings, setWarnings] = useState([]);

  useEffect(() => {
    if (startTime && endTime) {
      calculateDuration();
      generateWarnings();
    }
  }, [startTime, endTime]);

  const calculateDuration = () => {
    if (!startTime || !endTime) return;

    const start = new Date(startTime);
    const end = new Date(endTime);
    const totalMinutes = Math.floor((end - start) / (1000 * 60));

    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;

    setDuration({ days, hours, minutes });
  };

  const generateWarnings = () => {
    const newWarnings = [];

    if (!startTime || !endTime) return;

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();
    const totalHours = (end - start) / (1000 * 60 * 60);

    // Past time warnings
    if (start < now) {
      newWarnings.push({
        type: 'warning',
        message: 'Start time is in the past',
      });
    }

    if (end <= now) {
      newWarnings.push({
        type: 'error',
        message: 'End time must be in the future',
      });
    }

    // Duration warnings
    if (totalHours < 1) {
      newWarnings.push({
        type: 'error',
        message: 'Minimum duration is 1 hour for effective flash sales',
      });
    } else if (totalHours < 3) {
      newWarnings.push({
        type: 'warning',
        message: 'Very short duration - consider at least 3 hours for better reach',
      });
    }

    if (totalHours > 168) {
      newWarnings.push({
        type: 'warning',
        message: 'Long duration may reduce urgency effect',
      });
    }

    // Time of day warnings
    const startHour = start.getHours();
    const endHour = end.getHours();

    if (startHour < 6 || startHour > 22) {
      newWarnings.push({
        type: 'info',
        message: 'Starting outside peak hours (6 AM - 10 PM) may reduce visibility',
      });
    }

    // Weekend boost
    const startDay = start.getDay();
    const endDay = end.getDay();
    if (startDay === 0 || startDay === 6 || endDay === 0 || endDay === 6) {
      newWarnings.push({
        type: 'info',
        message: 'Weekend sales typically see higher engagement! 🎉',
      });
    }

    setWarnings(newWarnings);
  };

  const applyPresetDuration = hours => {
    if (!startTime) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 30); // Start 30 minutes from now
      now.setSeconds(0);
      now.setMilliseconds(0);
      const startISO = now.toISOString().slice(0, 16);
      onStartTimeChange(startISO);

      const end = new Date(now.getTime() + hours * 60 * 60 * 1000);
      const endISO = end.toISOString().slice(0, 16);
      onEndTimeChange(endISO);
    } else {
      const start = new Date(startTime);
      const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
      const endISO = end.toISOString().slice(0, 16);
      onEndTimeChange(endISO);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const getOptimalStartTime = () => {
    const now = new Date();
    const optimal = new Date(now);

    // Set to next optimal hour (10 AM, 2 PM, or 6 PM)
    const currentHour = now.getHours();
    let targetHour;

    if (currentHour < 10) {
      targetHour = 10;
    } else if (currentHour < 14) {
      targetHour = 14;
    } else if (currentHour < 18) {
      targetHour = 18;
    } else {
      // Next day at 10 AM
      optimal.setDate(optimal.getDate() + 1);
      targetHour = 10;
    }

    optimal.setHours(targetHour, 0, 0, 0);
    return optimal.toISOString().slice(0, 16);
  };

  const getRecommendedEndTime = () => {
    if (!startTime) return '';

    const start = new Date(startTime);
    const startHour = start.getHours();

    // Recommend duration based on start time
    let recommendedHours;
    if (startHour >= 10 && startHour <= 14) {
      recommendedHours = 6; // Lunch time sale
    } else if (startHour >= 18 && startHour <= 20) {
      recommendedHours = 4; // Evening sale
    } else {
      recommendedHours = 12; // Standard duration
    }

    const end = new Date(start.getTime() + recommendedHours * 60 * 60 * 1000);
    return end.toISOString().slice(0, 16);
  };

  const formatDuration = () => {
    const parts = [];
    if (duration.days > 0) parts.push(`${duration.days} day${duration.days > 1 ? 's' : ''}`);
    if (duration.hours > 0) parts.push(`${duration.hours} hour${duration.hours > 1 ? 's' : ''}`);
    if (duration.minutes > 0)
      parts.push(`${duration.minutes} minute${duration.minutes > 1 ? 's' : ''}`);

    return parts.length > 0 ? parts.join(', ') : 'No duration set';
  };

  const getDurationColor = () => {
    const totalHours = duration.days * 24 + duration.hours + duration.minutes / 60;

    if (totalHours < 1) return 'duration-error';
    if (totalHours < 3) return 'duration-warning';
    if (totalHours <= 24) return 'duration-optimal';
    if (totalHours <= 72) return 'duration-good';
    return 'duration-long';
  };

  const getWarningIcon = type => {
    switch (type) {
      case 'error':
        return <AlertCircle size={16} className="text-red-500" />;
      case 'warning':
        return <AlertCircle size={16} className="text-yellow-500" />;
      case 'info':
        return <Info size={16} className="text-blue-500" />;
      default:
        return <Info size={16} />;
    }
  };

  return (
    <div className="timer-settings">
      <div className="timer-header">
        <div className="section-title">
          <Clock size={20} />
          <h3>Flash Sale Timer Settings</h3>
        </div>
        <div className="timezone-info">
          <span>Timezone: {timeZone}</span>
        </div>
      </div>

      {/* Quick Start Options */}
      <div className="quick-start-section">
        <h4>Quick Start Options</h4>
        <div className="quick-actions">
          <button
            type="button"
            className="quick-action-btn"
            onClick={() => onStartTimeChange(getOptimalStartTime())}
            disabled={disabled}
          >
            <Target size={16} />
            Optimal Start Time
          </button>
          <button
            type="button"
            className="quick-action-btn"
            onClick={() => {
              if (startTime) {
                onEndTimeChange(getRecommendedEndTime());
              }
            }}
            disabled={disabled || !startTime}
          >
            <Zap size={16} />
            Recommended End
          </button>
        </div>
      </div>

      {/* Preset Durations */}
      {showPresets && (
        <div className="preset-durations">
          <h4>Popular Durations</h4>
          <div className="preset-grid">
            {presetDurations.map((preset, index) => (
              <button
                key={index}
                type="button"
                className="preset-btn"
                onClick={() => applyPresetDuration(preset.hours)}
                disabled={disabled}
              >
                <span className="preset-icon">{preset.icon}</span>
                <span className="preset-label">{preset.label}</span>
                <span className="preset-duration">{preset.hours}h</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Manual Time Settings */}
      <div className="manual-time-settings">
        <h4>Manual Time Settings</h4>

        <div className="time-inputs">
          <div className="time-input-group">
            <label htmlFor="start_time" className="required">
              <Calendar size={16} />
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              id="start_time"
              value={startTime || ''}
              onChange={e => onStartTimeChange(e.target.value)}
              min={getMinDateTime()}
              disabled={disabled}
              className={errors.start_time ? 'error' : ''}
            />
            {errors.start_time && (
              <div className="error-message">
                <AlertCircle size={16} />
                {errors.start_time}
              </div>
            )}
          </div>

          <div className="time-input-group">
            <label htmlFor="end_time" className="required">
              <Calendar size={16} />
              End Date & Time
            </label>
            <input
              type="datetime-local"
              id="end_time"
              value={endTime || ''}
              onChange={e => onEndTimeChange(e.target.value)}
              min={startTime || getMinDateTime()}
              disabled={disabled}
              className={errors.end_time ? 'error' : ''}
            />
            {errors.end_time && (
              <div className="error-message">
                <AlertCircle size={16} />
                {errors.end_time}
              </div>
            )}
          </div>
        </div>

        {/* Duration Display */}
        {startTime && endTime && (
          <div className="duration-display">
            <div className={`duration-info ${getDurationColor()}`}>
              <Clock size={18} />
              <span className="duration-text">Duration: {formatDuration()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Warnings and Tips */}
      {warnings.length > 0 && (
        <div className="warnings-section">
          <h4>Timing Analysis</h4>
          <div className="warnings-list">
            {warnings.map((warning, index) => (
              <div key={index} className={`warning-item ${warning.type}`}>
                {getWarningIcon(warning.type)}
                <span>{warning.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Best Practices */}
      <div className="best-practices">
        <h4>⚡ Timer Best Practices</h4>
        <div className="practices-grid">
          <div className="practice-item">
            <div className="practice-icon">🎯</div>
            <div className="practice-content">
              <strong>Peak Hours</strong>
              <p>10 AM - 2 PM and 6 PM - 10 PM for maximum visibility</p>
            </div>
          </div>

          <div className="practice-item">
            <div className="practice-icon">⏰</div>
            <div className="practice-content">
              <strong>Sweet Spot</strong>
              <p>3-24 hours creates urgency without fatigue</p>
            </div>
          </div>

          <div className="practice-item">
            <div className="practice-icon">📅</div>
            <div className="practice-content">
              <strong>Weekend Boost</strong>
              <p>Friday-Sunday typically see 20-30% higher engagement</p>
            </div>
          </div>

          <div className="practice-item">
            <div className="practice-icon">🚀</div>
            <div className="practice-content">
              <strong>Launch Strategy</strong>
              <p>Start 15-30 minutes ahead of peak hours for momentum</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Indicators */}
      {startTime && endTime && (
        <div className="performance-indicators">
          <h4>Expected Performance</h4>
          <div className="indicators-grid">
            {(() => {
              const start = new Date(startTime);
              const end = new Date(endTime);
              const totalHours = (end - start) / (1000 * 60 * 60);
              const startHour = start.getHours();
              const isWeekend = start.getDay() === 0 || start.getDay() === 6;

              let visibilityScore = 50;
              let urgencyScore = 50;
              let conversionScore = 50;

              // Adjust scores based on timing
              if (startHour >= 10 && startHour <= 22) visibilityScore += 30;
              if (isWeekend) visibilityScore += 20;

              if (totalHours >= 3 && totalHours <= 24) urgencyScore += 30;
              if (totalHours < 3) urgencyScore += 20;
              if (totalHours > 72) urgencyScore -= 20;

              conversionScore = Math.round((visibilityScore + urgencyScore) / 2);

              return (
                <>
                  <div className="indicator">
                    <div className="indicator-label">Visibility</div>
                    <div className="indicator-bar">
                      <div
                        className="indicator-fill visibility"
                        style={{ width: `${Math.min(visibilityScore, 100)}%` }}
                      />
                    </div>
                    <span className="indicator-score">{Math.min(visibilityScore, 100)}%</span>
                  </div>

                  <div className="indicator">
                    <div className="indicator-label">Urgency</div>
                    <div className="indicator-bar">
                      <div
                        className="indicator-fill urgency"
                        style={{ width: `${Math.min(urgencyScore, 100)}%` }}
                      />
                    </div>
                    <span className="indicator-score">{Math.min(urgencyScore, 100)}%</span>
                  </div>

                  <div className="indicator">
                    <div className="indicator-label">Expected Conversion</div>
                    <div className="indicator-bar">
                      <div
                        className="indicator-fill conversion"
                        style={{ width: `${Math.min(conversionScore, 100)}%` }}
                      />
                    </div>
                    <span className="indicator-score">{Math.min(conversionScore, 100)}%</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimerSettings;
