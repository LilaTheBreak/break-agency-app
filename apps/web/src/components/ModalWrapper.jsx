import React from "react";
import { createPortal } from "react-dom";

/**
 * ModalWrapper - Reusable base component for all modals
 * 
 * This component enforces consistent modal structure and accessibility
 * across the entire application.
 * 
 * REQUIRED STRUCTURE for all modals:
 * - Header (sticky, fixed height)
 * - Body (scrollable content area)
 * - Footer (sticky action buttons)
 * 
 * Features:
 * ✅ Prevents body scroll when open
 * ✅ Keyboard navigation (Tab trap, Escape key)
 * ✅ Focus management (opens with focus in modal)
 * ✅ Portal rendering (escapes document flow)
 * ✅ Dropdown escape (z-index 9999)
 * ✅ Mobile responsive
 * ✅ Scroll management (body can scroll independently)
 * 
 * Usage:
 * ```jsx
 * <ModalWrapper
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Edit Contact"
 *   size="medium"
 * >
 *   <div className="modal-body">
 *     {formContent}
 *   </div>
 *   <div className="modal-footer">
 *     <button>Cancel</button>
 *     <button>Save</button>
 *   </div>
 * </ModalWrapper>
 * ```
 */
export function ModalWrapper({
  isOpen,
  onClose,
  children,
  title,
  size = "medium",
  className = "",
  preventClose = false,
}) {
  const [previousActiveElement, setPreviousActiveElement] = React.useState(null);
  const modalRef = React.useRef(null);

  // Handle escape key
  React.useEffect(() => {
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
  React.useEffect(() => {
    if (isOpen) {
      setPreviousActiveElement(document.activeElement);
      document.body.style.overflow = "hidden";

      // Focus first focusable element in modal
      setTimeout(() => {
        const firstFocusable = modalRef.current?.querySelector(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])"
        );
        firstFocusable?.focus();
      }, 100);
    } else {
      document.body.style.overflow = "";
      previousActiveElement?.focus();
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, previousActiveElement]);

  // Focus trap
  React.useEffect(() => {
    if (!isOpen) return;

    const handleTab = (e) => {
      if (e.key !== "Tab") return;

      const focusableElements = modalRef.current?.querySelectorAll(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])"
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
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

  const modalContent = (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-brand-black/40 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-wrapper-title" : undefined}
    >
      <div
        ref={modalRef}
        className={`relative w-full modal ${sizeClasses[size]} rounded-3xl border border-brand-black/10 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.3)] ${className}`}
      >
        {/* Title (if provided) */}
        {title && (
          <div className="modal-header">
            <div className="flex items-center justify-between">
              <h2 id="modal-wrapper-title" className="font-display text-2xl uppercase tracking-wide text-brand-black">
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
          </div>
        )}

        {/* Content */}
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );

  // Render via portal to body
  return createPortal(modalContent, document.body);
}

export default ModalWrapper;
