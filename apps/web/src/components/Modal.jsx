import React, { useEffect, useRef } from "react";

/**
 * Unified Modal Component
 * 
 * Features:
 * - Consistent backdrop with blur effect
 * - Focus trap (keeps focus inside modal)
 * - Escape key support
 * - Consistent z-index (z-50)
 * - Prevents body scroll when open
 * - Accessible (role="dialog", aria-modal)
 * 
 * Usage:
 * <Modal isOpen={isOpen} onClose={handleClose} title="Modal Title">
 *   <p>Modal content goes here</p>
 * </Modal>
 */

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  size = "medium", // "small" | "medium" | "large" | "full"
  preventClose = false, // Set true to prevent closing via backdrop/escape
  className = "",
}) {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === "Escape" && !preventClose) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, preventClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      document.body.style.overflow = "hidden";
      
      // Focus first focusable element in modal
      setTimeout(() => {
        const firstFocusable = modalRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }, 100);
    } else {
      document.body.style.overflow = "";
      // Restore focus to element that opened modal
      previousActiveElement.current?.focus();
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleTab = (e) => {
      if (e.key !== "Tab") return;

      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    small: "max-w-md",
    medium: "max-w-2xl",
    large: "max-w-4xl",
    full: "max-w-7xl",
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !preventClose) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-brand-black/40 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        ref={modalRef}
        className={`relative w-full ${sizeClasses[size]} rounded-3xl border border-brand-black/10 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.3)] ${className}`}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between border-b border-brand-black/10 px-6 py-4">
            <h2
              id="modal-title"
              className="font-display text-2xl uppercase tracking-wide text-brand-black"
            >
              {title}
            </h2>
            {!preventClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-brand-black/60 transition hover:bg-brand-black/5 hover:text-brand-black"
                aria-label="Close modal"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/**
 * Modal Footer Component
 * Use inside Modal for consistent button placement
 */
export function ModalFooter({ children, className = "" }) {
  return (
    <div
      className={`flex items-center justify-end gap-3 border-t border-brand-black/10 px-6 py-4 ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Confirmation Modal
 * Pre-styled modal for yes/no confirmations
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "danger", // "danger" | "primary"
}) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="small">
      <p className="text-sm text-brand-black/80">{message}</p>
      <ModalFooter className="border-t-0 px-0 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-brand-black/20 px-4 py-2 text-sm font-medium text-brand-black transition hover:bg-brand-black/5"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            confirmVariant === "danger"
              ? "bg-brand-red text-white hover:bg-brand-red/90"
              : "bg-brand-black text-white hover:bg-brand-black/90"
          }`}
        >
          {confirmText}
        </button>
      </ModalFooter>
    </Modal>
  );
}
