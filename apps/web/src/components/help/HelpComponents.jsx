import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

/**
 * Tooltip component for inline help
 * Shows helpful information on hover or click
 * 
 * Usage:
 * <Tooltip content="Explanation text">
 *   <button>Action</button>
 * </Tooltip>
 */
export function Tooltip({ children, content, position = 'top' }) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          className={`
            absolute z-50 w-64 p-3 text-sm text-white bg-gray-900 rounded-lg shadow-lg
            ${positionClasses[position]}
          `}
        >
          <div className="relative">
            {content}
            <div
              className={`
                absolute w-2 h-2 bg-gray-900 transform rotate-45
                ${position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' : ''}
                ${position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' : ''}
                ${position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' : ''}
                ${position === 'right' ? 'left-[-4px] top-1/2 -translate-y-1/2' : ''}
              `}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Help icon with tooltip
 * Displays a ? icon that shows help text on hover
 * 
 * Usage:
 * <HelpTooltip content="This action will..." />
 */
export function HelpTooltip({ content, position = 'top' }) {
  return (
    <Tooltip content={content} position={position}>
      <button
        type="button"
        className="inline-flex items-center justify-center w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Help"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
    </Tooltip>
  );
}

/**
 * Help link component
 * Links to documentation or help pages
 * 
 * Usage:
 * <HelpLink href="/docs/gmail-setup">Learn more about Gmail setup</HelpLink>
 */
export function HelpLink({ href, children, external = false }) {
  const linkProps = external
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};

  return (
    <a
      href={href}
      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline"
      {...linkProps}
    >
      <HelpCircle className="w-4 h-4" />
      {children}
    </a>
  );
}

/**
 * Popover help component
 * Shows detailed help in a dismissible popover
 * 
 * Usage:
 * <HelpPopover title="How it works" content={<div>...</div>} />
 */
export function HelpPopover({ title, content, trigger = 'What is this?' }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
      >
        <HelpCircle className="w-4 h-4" />
        {trigger}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/0"
            onClick={() => setIsOpen(false)}
          />

          {/* Popover */}
          <div className="absolute z-50 w-80 p-4 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl">
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-sm text-gray-600">
              {content}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Inline help banner
 * Shows persistent help text with optional link
 * 
 * Usage:
 * <InlineHelp
 *   message="Gmail sync runs every 5 minutes"
 *   linkText="Learn more"
 *   linkHref="/docs/gmail"
 * />
 */
export function InlineHelp({ message, linkText, linkHref, variant = 'info' }) {
  const variantClasses = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  return (
    <div className={`p-3 border rounded-lg ${variantClasses[variant]}`}>
      <div className="flex items-start gap-2">
        <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm">{message}</p>
          {linkText && linkHref && (
            <a
              href={linkHref}
              className="text-sm font-medium underline mt-1 inline-block"
            >
              {linkText}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Contextual help card
 * Shows help information in a card format
 * 
 * Usage:
 * <HelpCard
 *   title="First time here?"
 *   description="Start by connecting your Gmail account to sync your inbox."
 *   action={{ text: "Connect Gmail", onClick: () => {} }}
 * />
 */
export function HelpCard({ title, description, action, onDismiss }) {
  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            {title}
          </h3>
          <p className="text-sm text-gray-600 mb-3">{description}</p>
          
          <div className="flex items-center gap-2">
            {action && (
              <button
                onClick={action.onClick}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                {action.text}
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default {
  Tooltip,
  HelpTooltip,
  HelpLink,
  HelpPopover,
  InlineHelp,
  HelpCard,
};
