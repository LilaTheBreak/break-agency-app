import React from "react";

/**
 * DataState Component — Platform Truth Layer
 * 
 * Provides explicit, honest feedback about data availability across the platform.
 * Replaces silent failures, empty panels, and ambiguous states with clear messaging.
 * 
 * States:
 * - loading: Data is being fetched
 * - no-data: API succeeded but returned empty results (user has no data yet)
 * - syncing: Background process is updating data
 * - limited: Only partial/public data available
 * - error: API failed or returned an error
 * - not-implemented: Feature exists but API not connected
 * - coming-soon: Feature intentionally gated/disabled
 * 
 * Usage:
 * <DataState 
 *   state="no-data"
 *   resource="campaigns"
 *   action={{ label: "Create Campaign", onClick: handleCreate }}
 * />
 */
export function DataState({ 
  state = "no-data",
  resource = "items",
  message,
  action,
  icon,
  variant = "default",
  className = ""
}) {
  const configs = {
    loading: {
      icon: (
        <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ),
      title: `Loading ${resource}...`,
      description: "Please wait while we fetch your data",
      color: "text-brand-black/40",
      bg: "bg-brand-linen/30"
    },
    "no-data": {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      ),
      title: `No ${resource} yet`,
      description: `You haven't created any ${resource} yet. Get started by creating your first one.`,
      color: "text-brand-black/60",
      bg: "bg-brand-linen/40"
    },
    syncing: {
      icon: (
        <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      title: `Syncing ${resource}...`,
      description: "We're updating your data in the background. This may take a few moments.",
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    limited: {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: `Limited ${resource} data`,
      description: "You're viewing public data only. Connect your account to see full analytics.",
      color: "text-orange-600",
      bg: "bg-orange-50"
    },
    error: {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      title: `Unable to load ${resource}`,
      description: "We encountered an error loading your data. Please try refreshing the page.",
      color: "text-red-600",
      bg: "bg-red-50"
    },
    "not-implemented": {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: `${resource} data not connected`,
      description: "This feature is being built. The API endpoint is not yet connected to live data.",
      color: "text-purple-600",
      bg: "bg-purple-50"
    },
    "coming-soon": {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: `${resource} coming soon`,
      description: "This feature is currently disabled and will be available in a future update.",
      color: "text-brand-black/50",
      bg: "bg-brand-linen/30"
    }
  };

  const config = configs[state] || configs["no-data"];
  const finalMessage = message || config.description;

  // Variants for different contexts
  const variants = {
    default: "rounded-2xl border border-brand-black/10 p-8",
    compact: "rounded-xl border border-brand-black/10 p-6",
    minimal: "p-6",
    card: "rounded-2xl border border-brand-black/10 bg-brand-white p-8 shadow-sm"
  };

  const variantClass = variants[variant] || variants.default;

  return (
    <div className={`${variantClass} ${config.bg} ${className}`}>
      <div className="mx-auto max-w-md text-center">
        {/* Icon */}
        <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${config.bg === "bg-brand-linen/30" ? "bg-brand-black/5" : "bg-white/50"}`}>
          <div className={config.color}>
            {icon || config.icon}
          </div>
        </div>

        {/* Title */}
        <h4 className={`font-display text-lg uppercase tracking-tight ${config.color}`}>
          {config.title}
        </h4>

        {/* Description */}
        <p className="mt-2 text-sm text-brand-black/60">
          {finalMessage}
        </p>

        {/* Action Button */}
        {action && (
          <button
            onClick={action.onClick}
            disabled={action.disabled}
            className="mt-6 rounded-xl border border-brand-black bg-brand-black px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-brand-white transition-all hover:bg-brand-black/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {action.label}
          </button>
        )}

        {/* State Badge */}
        {state !== "no-data" && (
          <div className="mt-4">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
              state === "loading" ? "border-brand-black/20 bg-brand-black/5 text-brand-black/40" :
              state === "syncing" ? "border-blue-200 bg-blue-50 text-blue-600" :
              state === "limited" ? "border-orange-200 bg-orange-50 text-orange-600" :
              state === "error" ? "border-red-200 bg-red-50 text-red-600" :
              state === "not-implemented" ? "border-purple-200 bg-purple-50 text-purple-600" :
              "border-brand-black/20 bg-brand-black/5 text-brand-black/40"
            }`}>
              <span className="relative flex h-2 w-2">
                {(state === "loading" || state === "syncing") && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75"></span>
                )}
                <span className="relative inline-flex h-2 w-2 rounded-full bg-current"></span>
              </span>
              {state === "loading" ? "Loading" :
               state === "syncing" ? "Syncing" :
               state === "limited" ? "Limited Data" :
               state === "error" ? "Error" :
               state === "not-implemented" ? "API Not Connected" :
               "Coming Soon"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * InlineDataState — For smaller, inline empty states
 */
export function InlineDataState({ state = "no-data", resource = "items", className = "" }) {
  const messages = {
    loading: `Loading ${resource}...`,
    "no-data": `No ${resource} yet`,
    syncing: `Syncing ${resource}...`,
    limited: `Limited ${resource} data available`,
    error: `Unable to load ${resource}`,
    "not-implemented": `${resource} API not connected`,
    "coming-soon": `${resource} coming soon`
  };

  const colors = {
    loading: "text-brand-black/40",
    "no-data": "text-brand-black/60",
    syncing: "text-blue-600",
    limited: "text-orange-600",
    error: "text-red-600",
    "not-implemented": "text-purple-600",
    "coming-soon": "text-brand-black/50"
  };

  return (
    <div className={`py-6 text-center ${className}`}>
      <p className={`text-sm ${colors[state]}`}>
        {messages[state]}
      </p>
    </div>
  );
}

/**
 * DataStateWrapper — Wraps data fetching logic with truth layer states
 */
export function DataStateWrapper({ 
  loading, 
  error, 
  data, 
  resource = "items",
  children,
  emptyAction,
  className = ""
}) {
  if (loading) {
    return <DataState state="loading" resource={resource} variant="compact" className={className} />;
  }

  if (error) {
    return (
      <DataState 
        state="error" 
        resource={resource} 
        message={error.message || `Failed to load ${resource}. Please try again.`}
        variant="compact"
        className={className}
      />
    );
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <DataState 
        state="no-data" 
        resource={resource} 
        action={emptyAction}
        variant="compact"
        className={className}
      />
    );
  }

  return <>{children}</>;
}
