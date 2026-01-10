import React from 'react';

/**
 * TabContentWrapper - Unified container for tab content sections
 * 
 * Provides consistent styling, animations, and structure for all tab content.
 * Features:
 * - Smooth fade-in animation
 * - Consistent spacing and borders
 * - Empty state handling
 * - Title/header support
 */
export function TabContentWrapper({
  children,
  title,
  subtitle,
  emptyMessage,
  isEmpty = false,
  icon: Icon,
}) {
  if (isEmpty) {
    return (
      <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-12 text-center animate-fade-in">
        <div className="flex flex-col items-center gap-3">
          {Icon && <Icon className="w-8 h-8 text-brand-black/40" />}
          <p className="text-brand-black/60">{emptyMessage || 'No items found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <h3 className="font-display text-2xl uppercase text-brand-black mb-1">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
