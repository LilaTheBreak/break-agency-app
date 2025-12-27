import React from "react";
import { getDisabledMessage } from "../config/features.js";

/**
 * ComingSoon Component — Phase 6: Feature Boundary Enforcement
 * 
 * Replaces TODO comments and placeholder sections with clear, 
 * professional messaging about upcoming features.
 * 
 * Usage:
 * <ComingSoon 
 *   feature="CREATOR_ROSTER_ENABLED"
 *   title="Creator Roster"
 *   description="Manage your exclusive creator network"
 * />
 */
export function ComingSoon({ 
  feature, 
  title, 
  description, 
  variant = "default",
  icon,
  showNotifyButton = false,
  onNotifyClick
}) {
  const message = feature ? getDisabledMessage(feature) : "This feature is coming soon.";

  // Variant styles
  const variants = {
    default: "border-brand-black/10 bg-brand-linen/50",
    compact: "border-brand-black/10 bg-brand-linen/30 p-4",
    minimal: "border-none bg-transparent",
    highlighted: "border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50"
  };

  const variantClass = variants[variant] || variants.default;

  return (
    <div className={`rounded-2xl border ${variantClass} p-6 text-center`}>
      {/* Icon */}
      {icon && (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-black/5">
          {icon}
        </div>
      )}

      {/* Title */}
      {title && (
        <h4 className="font-display text-xl uppercase tracking-tight text-brand-black">
          {title}
        </h4>
      )}

      {/* Description */}
      {description && (
        <p className="mt-2 text-sm text-brand-black/70">{description}</p>
      )}

      {/* Coming Soon Message */}
      <div className="mt-4 rounded-xl border border-brand-black/10 bg-brand-white/80 px-4 py-3">
        <div className="flex items-center justify-center gap-2 text-sm">
          <svg 
            className="h-4 w-4 text-brand-black/40" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <span className="text-brand-black/60">{message}</span>
        </div>
      </div>

      {/* Optional Notify Button */}
      {showNotifyButton && onNotifyClick && (
        <button
          onClick={onNotifyClick}
          className="mt-4 rounded-xl border border-brand-black/20 bg-brand-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-brand-black/70 transition-all hover:border-brand-black hover:bg-brand-black hover:text-brand-white"
        >
          Notify Me When Ready
        </button>
      )}

      {/* Roadmap Link (optional) */}
      <p className="mt-4 text-xs text-brand-black/40">
        See our <a href="/roadmap" className="underline hover:text-brand-black/60">product roadmap</a> for updates
      </p>
    </div>
  );
}

/**
 * ComingSoonSection — For larger dashboard sections
 */
export function ComingSoonSection({ 
  feature, 
  title, 
  subtitle,
  description, 
  expectedTimeline,
  prerequisites,
  className = ""
}) {
  const message = feature ? getDisabledMessage(feature) : null;

  return (
    <section className={`space-y-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6 ${className}`}>
      {/* Header */}
      <div>
        {subtitle && (
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-black/40">
            {subtitle}
          </p>
        )}
        <h3 className="font-display text-3xl uppercase">{title}</h3>
        {description && (
          <p className="mt-2 text-sm text-brand-black/60">{description}</p>
        )}
      </div>

      {/* Coming Soon Card */}
      <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-8">
        <div className="mx-auto max-w-md text-center">
          {/* Icon */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-black/5">
            <svg 
              className="h-8 w-8 text-brand-black/30" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
              />
            </svg>
          </div>

          {/* Message */}
          <p className="text-lg font-semibold text-brand-black/80">Coming Soon</p>
          {message && (
            <p className="mt-2 text-sm text-brand-black/60">{message}</p>
          )}

          {/* Expected Timeline */}
          {expectedTimeline && (
            <div className="mt-4 rounded-xl border border-brand-black/10 bg-brand-white/80 px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-brand-black/50">Expected</p>
              <p className="mt-1 font-semibold text-brand-black/70">{expectedTimeline}</p>
            </div>
          )}

          {/* Prerequisites */}
          {prerequisites && prerequisites.length > 0 && (
            <div className="mt-4 text-left">
              <p className="mb-2 text-xs uppercase tracking-wider text-brand-black/50">Required to unlock:</p>
              <ul className="space-y-1 text-sm text-brand-black/60">
                {prerequisites.map((prereq, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-0.5 text-brand-black/40">•</span>
                    <span>{prereq}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * BetaBadge — For marking features in beta
 */
export function BetaBadge({ variant = "default" }) {
  const variants = {
    default: "bg-orange-50 text-orange-600 border-orange-200",
    subtle: "bg-brand-black/5 text-brand-black/60 border-brand-black/10",
    prominent: "bg-gradient-to-r from-orange-400 to-pink-400 text-white border-transparent shadow-md"
  };

  const variantClass = variants[variant] || variants.default;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${variantClass}`}>
      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
      Beta
    </span>
  );
}

export default ComingSoon;
