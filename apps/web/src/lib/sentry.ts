/**
 * Sentry Error Monitoring Configuration
 * 
 * To enable Sentry in production:
 * 
 * 1. Install Sentry:
 *    pnpm add @sentry/react
 * 
 * 2. Set environment variable in Vercel:
 *    VITE_SENTRY_DSN=your_sentry_dsn_here
 * 
 * 3. Import and initialize in main.jsx:
 *    import { initSentry } from './lib/sentry';
 *    initSentry();
 * 
 * Note: This file is ready but Sentry is not installed yet.
 * Install when production monitoring is required.
 */

export function initSentry() {
  // Only enable in production with DSN configured
  if (import.meta.env.MODE !== 'production' || !import.meta.env.VITE_SENTRY_DSN) {
    console.log('[Sentry] Not initialized (production only)');
    return;
  }

  // Uncomment when @sentry/react is installed:
  /*
  import * as Sentry from "@sentry/react";
  
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    enabled: import.meta.env.MODE === 'production',
    
    // Performance Monitoring
    tracesSampleRate: 0.1, // Capture 10% of transactions
    
    // Session Replay
    replaysSessionSampleRate: 0.01, // Capture 1% of sessions
    replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions with errors
    
    // Privacy: Don't capture sensitive data
    beforeSend(event, hint) {
      // Remove auth tokens from breadcrumbs and contexts
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
          if (breadcrumb.data) {
            delete breadcrumb.data.auth_token;
            delete breadcrumb.data.Authorization;
          }
          return breadcrumb;
        });
      }
      
      // Remove tokens from request data
      if (event.request?.headers) {
        delete event.request.headers.Authorization;
      }
      
      return event;
    },
    
    // Ignore common non-critical errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'Network request failed',
    ],
  });
  
  console.log('[Sentry] Initialized for production monitoring');
  */
  
  console.warn('[Sentry] @sentry/react not installed. Run: pnpm add @sentry/react');
}

// Error boundary helper (works without Sentry installed)
export function logError(error: Error, errorInfo?: any) {
  if (import.meta.env.MODE === 'production') {
    console.error('[Production Error]', error, errorInfo);
    // When Sentry is installed, errors will be automatically captured
  } else {
    console.error('[Dev Error]', error, errorInfo);
  }
}
