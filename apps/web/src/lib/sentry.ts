/**
 * Sentry Error Monitoring Configuration
 * 
 * Production-grade error monitoring for frontend and backend.
 * 
 * Environment Variables Required:
 * - VITE_SENTRY_DSN: Frontend Sentry DSN (from Sentry dashboard)
 * - SENTRY_DSN: Backend Sentry DSN (from Sentry dashboard)
 * - SENTRY_ENVIRONMENT: Environment name (production, staging, development)
 * - SENTRY_RELEASE: Release version (commit hash or version number)
 */

import * as Sentry from "@sentry/react";

/**
 * Initialize Sentry for React frontend
 * Called early in app lifecycle (main.jsx)
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE || "development";
  const release = import.meta.env.VITE_SENTRY_RELEASE || import.meta.env.VITE_COMMIT_HASH || undefined;

  // TEMPORARY — SENTRY VERIFICATION: Log DSN status at runtime
  console.log('[Sentry] Frontend DSN check:', {
    hasDsn: !!dsn,
    dsnLength: dsn ? dsn.length : 0,
    environment,
    release,
    allEnvKeys: Object.keys(import.meta.env).filter(k => k.includes('SENTRY'))
  });

  // Only initialize if DSN is provided
  if (!dsn) {
    console.warn('[Sentry] ❌ NOT INITIALIZED - No DSN provided at runtime');
    console.warn('[Sentry] Expected: VITE_SENTRY_DSN in environment variables');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    release,
    
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
    
    // Integrations
    integrations: [
      Sentry.browserTracingIntegration({
        // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
        tracePropagationTargets: [
          "localhost",
          /^https:\/\/.*\.railway\.app/,
          /^https:\/\/.*\.vercel\.app/,
          /^https:\/\/.*\.tbctbctbc\.online/,
        ],
      }),
      Sentry.replayIntegration({
        // Mask all text content and user input for privacy
        maskAllText: true,
        blockAllMedia: true,
        // Use inline worker to avoid CSP issues with blob URLs
        // This will create the worker inline instead of from a blob URL
        workerUrl: undefined, // Let Sentry handle worker creation
      }),
    ],

    // Performance Monitoring
    // Tracing: Capture 100% of the transactions in dev, 10% in production
    tracesSampleRate: environment === "production" ? 0.1 : 1.0,
    
    // Session Replay
    replaysSessionSampleRate: environment === "production" ? 0.1 : 1.0, // 10% in production, 100% in dev
    replaysOnErrorSampleRate: 1.0, // 100% when errors occur
    
    // Enable logs to be sent to Sentry
    enableLogs: true,
    
    // Privacy: Don't capture sensitive data
    beforeSend(event, hint) {
      // Remove auth tokens from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
          if (breadcrumb.data) {
            delete breadcrumb.data.auth_token;
            delete breadcrumb.data.Authorization;
            delete breadcrumb.data.token;
            delete breadcrumb.data.cookie;
          }
          return breadcrumb;
        });
      }
      
      // Remove tokens from request data
      if (event.request?.headers) {
        delete event.request.headers.Authorization;
        delete event.request.headers.Cookie;
      }
      
      // Remove sensitive data from user context
      if (event.user) {
        delete event.user.email; // Only include user ID, not email
      }
      
      return event;
    },
    
    // Ignore common non-critical errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'Network request failed',
      'Failed to fetch',
      'ChromePolyfill',
      'chrome.runtime',
      'message port closed',
    ],
    
    // Filter out browser extension errors
    denyUrls: [
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
    ],
  });
  
  console.log(`[Sentry] Initialized for ${environment} monitoring with session replay`);
  
  // TEMPORARY: Sentry verification event (will be removed after verification)
  // This fires once on initialization to verify Sentry is working
  try {
    Sentry.captureMessage("Sentry frontend verification event", {
      level: "info",
      tags: {
        verification: "true",
        environment,
      },
    });
    console.log("[Sentry] Frontend verification event sent");
  } catch (error) {
    console.warn("[Sentry] Failed to send verification event:", error);
  }
}

/**
 * Set user context for Sentry
 * Call this after user authentication
 */
export function setSentryUser(user: { id: string; role?: string; email?: string } | null) {
  if (!user) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.id,
    role: user.role,
    // Don't include email for privacy
  });
}

/**
 * Add tags to Sentry context
 * Useful for filtering errors by feature, route, etc.
 */
export function setSentryTags(tags: Record<string, string>) {
  Object.entries(tags).forEach(([key, value]) => {
    Sentry.setTag(key, value);
  });
}

/**
 * Add breadcrumb for debugging
 */
export function addSentryBreadcrumb(message: string, category?: string, level?: Sentry.SeverityLevel, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category: category || "default",
    level: level || "info",
    data,
  });
}

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Error boundary helper (works with or without Sentry)
 */
export function logError(error: Error, errorInfo?: any) {
  if (import.meta.env.VITE_SENTRY_DSN) {
    captureException(error, errorInfo);
  } else {
    console.error('[Error]', error, errorInfo);
  }
}

/**
 * Log an info message to Sentry
 */
export function logInfo(message: string, context?: Record<string, any>) {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.logger.info(message, context);
  } else {
    console.log('[Info]', message, context);
  }
}

/**
 * Increment a counter metric in Sentry (via tags)
 */
export function incrementMetric(name: string, value: number = 1, tags?: Record<string, string>) {
  if (import.meta.env.VITE_SENTRY_DSN) {
    // Use breadcrumb as alternative since metrics API may not be available
    Sentry.addBreadcrumb({
      message: `Metric: ${name}`,
      category: 'metric',
      level: 'info',
      data: {
        name,
        value,
        ...tags,
      },
    });
  }
}

/**
 * Set a gauge metric in Sentry (via tags)
 */
export function setMetric(name: string, value: number, tags?: Record<string, string>) {
  if (import.meta.env.VITE_SENTRY_DSN) {
    // Use breadcrumb as alternative since metrics API may not be available
    Sentry.addBreadcrumb({
      message: `Gauge: ${name}`,
      category: 'metric',
      level: 'info',
      data: {
        name,
        value,
        ...tags,
      },
    });
  }
}

/**
 * Count a metric in Sentry (via tags)
 */
export function countMetric(name: string, value: number = 1, tags?: Record<string, string>) {
  if (import.meta.env.VITE_SENTRY_DSN) {
    // Use breadcrumb as alternative since metrics API may not be available
    Sentry.addBreadcrumb({
      message: `Count: ${name}`,
      category: 'metric',
      level: 'info',
      data: {
        name,
        value,
        ...tags,
      },
    });
  }
}
