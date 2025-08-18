import React, { useEffect, useRef } from 'react';
import './Modal.css';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscapeKey = true,
  className = '',
  headerActions,
  footer,
}) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousActiveElement.current = document.activeElement;

      // Focus the modal
      if (modalRef.current) {
        modalRef.current.focus();
      }

      // Prevent body scrolling
      document.body.style.overflow = 'hidden';

      // Add escape key listener
      if (closeOnEscapeKey) {
        document.addEventListener('keydown', handleEscapeKey);
      }
    } else {
      // Restore body scrolling
      document.body.style.overflow = 'unset';

      // Restore focus to previously active element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, closeOnEscapeKey]);

  const handleEscapeKey = e => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleOverlayClick = e => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalClasses = `modal modal--${size} ${className}`.trim();

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        ref={modalRef}
        className={modalClasses}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        tabIndex={-1}
      >
        {(title || showCloseButton || headerActions) && (
          <div className="modal__header">
            <div className="modal__header-content">
              {title && (
                <h2 id="modal-title" className="modal__title">
                  {title}
                </h2>
              )}

              {headerActions && <div className="modal__header-actions">{headerActions}</div>}
            </div>

            {showCloseButton && (
              <button className="modal__close-button" onClick={onClose} aria-label="Close modal">
                <svg
                  width="24"
                  height="24"
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
          </div>
        )}

        <div className="modal__body">{children}</div>

        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  );
};

// Modal confirmation component
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      footer={
        <div className="modal__footer-actions">
          <button className={`btn btn--${variant}`} onClick={handleConfirm}>
            {confirmText}
          </button>
          <button className="btn btn--secondary" onClick={onClose}>
            {cancelText}
          </button>
        </div>
      }
    >
      <p className="modal__confirmation-message">{message}</p>
    </Modal>
  );
};

export default Modal;
