import React from 'react';

/**
 * LoadingSkeletonCard - Animated placeholder for loading states
 * 
 * Features:
 * - Shimmer animation for visual feedback
 * - Multiple layout options (deal card, health card, etc.)
 * - Smooth fade-in/out transitions
 * - Tailwind-based styling for consistency
 */
export function LoadingSkeletonCard({ variant = 'deal', count = 1 }) {
  const skeletons = Array.from({ length: count });

  if (variant === 'deal') {
    return (
      <div className="space-y-4">
        {skeletons.map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-brand-black/10 bg-brand-white p-4 animate-pulse"
          >
            {/* Brand and status header */}
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 bg-brand-black/5 rounded w-32" />
              <div className="h-6 bg-brand-black/5 rounded w-20" />
            </div>
            {/* Value line */}
            <div className="h-6 bg-brand-black/5 rounded w-24 mb-3" />
            {/* Description lines */}
            <div className="space-y-2 mb-3">
              <div className="h-3 bg-brand-black/5 rounded w-full" />
              <div className="h-3 bg-brand-black/5 rounded w-3/4" />
            </div>
            {/* Footer buttons */}
            <div className="flex gap-2">
              <div className="h-8 bg-brand-black/5 rounded w-8" />
              <div className="h-8 bg-brand-black/5 rounded w-8" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'health') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {skeletons.map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4 animate-pulse"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-3 bg-brand-black/5 rounded w-24" />
              <div className="h-4 bg-brand-black/5 rounded-full w-4" />
            </div>
            <div className="h-8 bg-brand-black/5 rounded w-16" />
            <div className="h-2 bg-brand-black/5 rounded w-28 mt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-6 animate-pulse">
        <div className="h-4 bg-brand-black/5 rounded w-32 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i}>
              <div className="h-3 bg-brand-black/5 rounded w-24 mb-2" />
              <div className="h-6 bg-brand-black/5 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

/**
 * LoadingSpinner - Centered loading spinner
 */
export function LoadingSpinner({ size = 'md' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex justify-center items-center">
      <div
        className={`${sizeClasses[size]} border-2 border-brand-black/10 border-t-brand-red rounded-full animate-spin`}
      />
    </div>
  );
}
