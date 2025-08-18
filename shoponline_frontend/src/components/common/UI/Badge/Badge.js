import React from 'react';
import './Badge.css';

const Badge = ({
  children,
  variant = 'default',
  size = 'medium',
  shape = 'rounded',
  icon,
  dot = false,
  removable = false,
  onRemove,
  className = '',
  ...props
}) => {
  const badgeClasses = [
    'badge',
    `badge--${variant}`,
    `badge--${size}`,
    `badge--${shape}`,
    dot && 'badge--dot',
    removable && 'badge--removable',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (dot) {
    return <span className={badgeClasses} {...props} />;
  }

  return (
    <span className={badgeClasses} {...props}>
      {icon && <span className="badge__icon">{icon}</span>}

      <span className="badge__text">{children}</span>

      {removable && (
        <button
          className="badge__remove"
          onClick={onRemove}
          aria-label={`Remove ${children}`}
          type="button"
        >
          <svg
            width="12"
            height="12"
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
    </span>
  );
};

// Status Badge with predefined variants
export const StatusBadge = ({ status, ...props }) => {
  const statusConfig = {
    online: { variant: 'success', children: 'Online' },
    offline: { variant: 'error', children: 'Offline' },
    away: { variant: 'warning', children: 'Away' },
    busy: { variant: 'error', children: 'Busy' },
    active: { variant: 'success', children: 'Active' },
    inactive: { variant: 'secondary', children: 'Inactive' },
    pending: { variant: 'warning', children: 'Pending' },
    approved: { variant: 'success', children: 'Approved' },
    rejected: { variant: 'error', children: 'Rejected' },
    draft: { variant: 'secondary', children: 'Draft' },
    published: { variant: 'success', children: 'Published' },
    archived: { variant: 'secondary', children: 'Archived' },
  };

  const config = statusConfig[status] || { variant: 'default', children: status };

  return <Badge {...config} {...props} />;
};

// Notification Badge for showing counts
export const NotificationBadge = ({
  count = 0,
  max = 99,
  showZero = false,
  position = 'top-right',
  children,
  ...props
}) => {
  if (count === 0 && !showZero) return children;

  const displayCount = count > max ? `${max}+` : count;

  return (
    <span className={`notification-badge notification-badge--${position}`}>
      {children}
      <Badge
        variant="error"
        size="small"
        shape="pill"
        className="notification-badge__count"
        {...props}
      >
        {displayCount}
      </Badge>
    </span>
  );
};

export default Badge;
