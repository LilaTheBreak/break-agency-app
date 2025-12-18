import React from "react";
import { isFeatureEnabled, getDisabledMessage } from "../config/features.js";

/**
 * FeatureGate Component
 * 
 * Wraps UI elements to gate functionality without hiding the UI.
 * 
 * When feature is disabled:
 * - UI remains visible
 * - Interactions are blocked
 * - Clear messaging explains status
 * 
 * When feature is enabled:
 * - Gate is removed
 * - Full functionality restored
 * 
 * Usage:
 * <FeatureGate feature="AI_ENABLED" mode="button">
 *   <button onClick={handleAIAction}>Generate AI Insights</button>
 * </FeatureGate>
 */

export function FeatureGate({ 
  feature, 
  children, 
  mode = "button", 
  fallback = null,
  customMessage = null 
}) {
  const isEnabled = isFeatureEnabled(feature);
  const message = customMessage || getDisabledMessage(feature);

  // If feature is enabled, render children normally
  if (isEnabled) {
    return <>{children}</>;
  }

  // Feature is disabled - gate based on mode
  switch (mode) {
    case "button":
      // Render button as disabled with tooltip
      return (
        <div className="relative group">
          {React.cloneElement(children, {
            disabled: true,
            onClick: undefined,
            className: `${children.props.className || ""} opacity-50 cursor-not-allowed`,
          })}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max max-w-xs">
            <div className="rounded-lg border border-brand-black/10 bg-brand-white px-3 py-2 text-xs shadow-lg">
              {message}
            </div>
          </div>
        </div>
      );

    case "action":
      // Render with click interceptor
      return (
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Could show modal here if needed
          }}
          className="cursor-not-allowed"
        >
          {React.cloneElement(children, {
            disabled: true,
            className: `${children.props.className || ""} opacity-50 pointer-events-none`,
          })}
        </div>
      );

    case "section":
      // Render section with overlay message
      return (
        <div className="relative">
          <div className="opacity-60 pointer-events-none">{children}</div>
          <div className="absolute inset-0 flex items-center justify-center bg-brand-white/80 backdrop-blur-[1px]">
            <div className="rounded-2xl border border-brand-black/10 bg-brand-white px-6 py-4 text-center shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-brand-black/50">
                {message}
              </p>
            </div>
          </div>
        </div>
      );

    case "hide":
      // Hide completely (use sparingly - prefer other modes)
      return fallback;

    case "passive":
      // Render as-is but non-interactive
      return (
        <div className="opacity-60 pointer-events-none" title={message}>
          {children}
        </div>
      );

    default:
      return <>{children}</>;
  }
}

/**
 * useFeature Hook
 * 
 * Check if feature is enabled in component logic
 * 
 * Usage:
 * const isAIEnabled = useFeature("AI_ENABLED");
 * if (isAIEnabled) { ... }
 */
export function useFeature(featureName) {
  return isFeatureEnabled(featureName);
}

/**
 * DisabledNotice Component
 * 
 * Shows inline notice above gated sections
 * UI remains visible, notice explains status
 */
export function DisabledNotice({ feature, className = "" }) {
  const message = getDisabledMessage(feature);

  if (isFeatureEnabled(feature)) {
    return null;
  }

  return (
    <div className={`rounded-2xl border border-brand-black/10 bg-brand-linen/30 px-4 py-3 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-xl">🔒</span>
        <p className="text-xs text-brand-black/70">{message}</p>
      </div>
    </div>
  );
}

/**
 * EmptyDataState Component
 * 
 * Shows "No data yet" for gated metrics/charts
 * Replaces fake/mock data injection
 */
export function EmptyDataState({ message = "No data yet", children }) {
  return (
    <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-brand-black/10 bg-brand-linen/20">
      <div className="text-center">
        <p className="text-sm text-brand-black/50">{message}</p>
        {children}
      </div>
    </div>
  );
}
