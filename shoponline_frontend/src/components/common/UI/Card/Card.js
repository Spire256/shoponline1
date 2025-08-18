import React from 'react';
import './Card.css';

const Card = ({
  children,
  variant = 'default',
  size = 'medium',
  hover = false,
  clickable = false,
  onClick,
  className = '',
  shadow = true,
  border = true,
  loading = false,
  ...props
}) => {
  const cardClasses = [
    'card',
    `card--${variant}`,
    `card--${size}`,
    hover && 'card--hover',
    clickable && 'card--clickable',
    !shadow && 'card--no-shadow',
    !border && 'card--no-border',
    loading && 'card--loading',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const CardComponent = clickable || onClick ? 'button' : 'div';

  return (
    <CardComponent className={cardClasses} onClick={onClick} {...props}>
      {loading && <div className="card__loading-overlay" />}
      {children}
    </CardComponent>
  );
};

// Card Header Component
export const CardHeader = ({ title, subtitle, actions, children, className = '' }) => {
  return (
    <div className={`card__header ${className}`}>
      <div className="card__header-content">
        {title && <h3 className="card__title">{title}</h3>}
        {subtitle && <p className="card__subtitle">{subtitle}</p>}
        {children}
      </div>
      {actions && <div className="card__actions">{actions}</div>}
    </div>
  );
};

// Card Body Component
export const CardBody = ({ children, className = '' }) => {
  return <div className={`card__body ${className}`}>{children}</div>;
};

// Card Footer Component
export const CardFooter = ({ children, actions, align = 'right', className = '' }) => {
  return (
    <div className={`card__footer card__footer--${align} ${className}`}>
      {children}
      {actions && <div className="card__footer-actions">{actions}</div>}
    </div>
  );
};

// Card Image Component
export const CardImage = ({
  src,
  alt,
  aspectRatio = 'auto',
  position = 'top',
  overlay,
  className = '',
}) => {
  const imageClasses = [
    'card__image',
    `card__image--${position}`,
    `card__image--${aspectRatio}`,
    overlay && 'card__image--with-overlay',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={imageClasses}>
      <img src={src} alt={alt} />
      {overlay && <div className="card__image-overlay">{overlay}</div>}
    </div>
  );
};

export default Card;
