/**
 * Sentry Instrumentation
 * 
 * Initialize Sentry as early as possible in the application lifecycle.
 * This file must be imported at the very top of server.ts before any other imports.
 */

import * as Sentry from "@sentry/node";

const dsn = process.env.SENTRY_DSN;
const environment = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development";
const release = process.env.SENTRY_RELEASE || process.env.COMMIT_HASH || undefined;

// TEMPORARY — SENTRY VERIFICATION: Log DSN status at runtime
console.log('[Sentry] Backend DSN check:', {
  hasDsn: !!dsn,
  dsnLength: dsn ? dsn.length : 0,
  environment,
  release,
  allEnvKeys: Object.keys(process.env).filter(k => k.includes('SENTRY'))
});

if (!dsn) {
  console.warn("[Sentry] ❌ NOT INITIALIZED - No DSN provided at runtime");
  console.warn("[Sentry] Expected: SENTRY_DSN in environment variables");
  console.warn("[Sentry] Set SENTRY_DSN environment variable to enable error monitoring.");
} else {
  Sentry.init({
    dsn,
    environment,
    release,
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
    // Performance monitoring
    tracesSampleRate: environment === "production" ? 0.1 : 1.0, // 10% in prod, 100% in dev
    // Integrations
    integrations: [
      Sentry.httpIntegration({ tracing: true }),
      // Express integration will be set up via setupExpressErrorHandler in server.ts
    ],
    // Privacy: Filter sensitive data
    beforeSend(event, hint) {
      // Remove auth tokens from request headers
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.Authorization;
        delete event.request.headers.cookie;
        delete event.request.headers.Cookie;
      }
      // Remove email from user context
      if (event.user) {
        delete event.user.email;
      }
      return event;
    },
    // Ignore common non-critical errors
    ignoreErrors: [
      "ECONNREFUSED",
      "ENOTFOUND",
      "ETIMEDOUT",
      "Network request failed",
    ],
  });
  
  console.log(`[Sentry] Backend initialized for ${environment} monitoring`);
  
  // TEMPORARY: Sentry verification event (will be removed after verification)
  // This fires once on server start to verify Sentry is working
  try {
    Sentry.captureMessage("Sentry backend verification event", {
      level: "info",
      tags: {
        verification: "true",
        environment,
      },
    });
    console.log("[Sentry] Backend verification event sent");
  } catch (error) {
    console.warn("[Sentry] Failed to send verification event:", error);
  }
}

export default Sentry;

