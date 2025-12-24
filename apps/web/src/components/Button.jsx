import React from "react";

/**
 * Button Component - Accessible, consistent button with all variants
 * 
 * DESIGN PRINCIPLE: Buttons are critical UI affordances.
 * If a button is unreadable, the system is broken.
 * 
 * All buttons have explicit foreground + background colors.
 * No button can render without visible text.
 * 
 * @param {object} props
 * @param {React.ReactNode} props.children - Button label (required)
 * @param {"primary"|"secondary"|"danger"|"ghost"|"text"} props.variant - Button style variant
 * @param {"button"|"submit"|"reset"} props.type - HTML button type
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.isLoading - Loading state (shows spinner or loading text)
 * @param {string} props.loadingText - Text to show when loading (defaults to "Loading…")
 * @param {function} props.onClick - Click handler
 * @param {string} props.className - Additional Tailwind classes
 * @param {object} props.rest - Any other HTML button attributes
 */
export default function Button({
  children,
  variant = "primary",
  type = "button",
  disabled = false,
  isLoading = false,
  loadingText = "Loading…",
  onClick,
  className = "",
  ...rest
}) {
  // ❌ GUARD: No button without visible text
  if (!children && !isLoading) {
    console.warn("[Button] Attempted to render button without children or loading state");
    return null;
  }

  // ✅ EXPLICIT VARIANTS: No implicit styling
  // PRIMARY = brand-red (main CTA)
  // SECONDARY = outlined black (secondary actions)
  // DANGER = red (destructive actions)
  // GHOST = transparent with border (tertiary actions)
  // TEXT = text-only (minimal actions)
  const variantClasses = {
    primary: "bg-brand-red text-white hover:bg-brand-red/90",
    secondary: "bg-transparent text-brand-black border border-brand-black/20 hover:bg-brand-black/5",
    danger: "bg-brand-red text-white hover:bg-brand-red/90",
    ghost: "bg-transparent text-brand-black border border-brand-black/20 hover:bg-brand-black/5",
    text: "bg-transparent text-brand-black hover:bg-brand-black/5"
  };

  // ✅ DISABLED STATE: Visibly disabled
  const disabledClasses = disabled || isLoading
    ? "opacity-50 cursor-not-allowed"
    : "";

  // ✅ LOADING STATE: Readable spinner or text
  const loadingClasses = isLoading
    ? "opacity-80"
    : "";

  // ✅ BASE CLASSES: Safe defaults for all buttons
  const baseClasses = "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition-colors";

  // ✅ FINAL CLASSES: Explicit composition
  const finalClasses = `${baseClasses} ${variantClasses[variant]} ${disabledClasses} ${loadingClasses} ${className}`.trim();

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={finalClasses}
      {...rest}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          {/* Loading spinner */}
          <svg
            className="h-3 w-3 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {loadingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * Button variants as separate components for convenience
 */
export function PrimaryButton(props) {
  return <Button {...props} variant="primary" />;
}

export function SecondaryButton(props) {
  return <Button {...props} variant="secondary" />;
}

export function DangerButton(props) {
  return <Button {...props} variant="danger" />;
}

export function GhostButton(props) {
  return <Button {...props} variant="ghost" />;
}

export function TextButton(props) {
  return <Button {...props} variant="text" />;
}
