# Sentry Error Monitoring Setup

**Status:** ✅ Fully Integrated  
**Date:** 2025-01-02

## Overview

Production-grade error monitoring has been integrated into both the frontend (React/Vite) and backend (Node/Express) using Sentry. All errors are automatically captured, grouped, and traceable without manual log hunting.

## What's Included

### ✅ Frontend Monitoring
- **Uncaught exceptions** - Automatically captured
- **Promise rejections** - Automatically captured
- **React render errors** - Caught by ErrorBoundary components
- **Browser tracing** - Performance monitoring (10% sample rate in production)
- **Route tracking** - Automatic route change tracking
- **User context** - User ID and role attached to all errors
- **Feature tagging** - Errors tagged by feature (talent, campaigns, messaging, etc.)

### ✅ Backend Monitoring
- **Unhandled exceptions** - Automatically captured
- **Unhandled promise rejections** - Automatically captured
- **Express route errors** - All API errors captured with request context
- **Request context** - Route, method, user ID attached to all errors
- **Feature tagging** - Errors tagged by feature area

### ✅ Error Boundaries
- **AppErrorBoundary** - Root-level error boundary with Sentry integration
- **RouteErrorBoundary** - Route-level error boundary with route context

### ✅ Privacy & Security
- Auth tokens automatically removed from error reports
- User emails excluded from Sentry context
- Sensitive headers filtered out
- Browser extension errors ignored

## Environment Variables

### Frontend (Vercel)
Add these to your Vercel project environment variables:

```bash
# Required
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Optional
VITE_SENTRY_ENVIRONMENT=production  # or staging, development
VITE_SENTRY_RELEASE=abc123def456   # commit hash or version
VITE_COMMIT_HASH=abc123def456     # alternative to VITE_SENTRY_RELEASE
```

### Backend (Railway)
Add these to your Railway project environment variables:

```bash
# Required
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Optional
SENTRY_ENVIRONMENT=production      # or staging, development
SENTRY_RELEASE=abc123def456        # commit hash or version
COMMIT_HASH=abc123def456           # alternative to SENTRY_RELEASE
```

## Getting Your Sentry DSN

1. **Create a Sentry account** at https://sentry.io
2. **Create a new project:**
   - Frontend: Select "React" as the platform
   - Backend: Select "Node.js" as the platform
3. **Copy the DSN** from the project settings
4. **Add DSN to environment variables** (see above)

## Release Tracking

Sentry automatically tracks releases when `SENTRY_RELEASE` or `VITE_SENTRY_RELEASE` is set. This allows you to:

- **Compare error rates** before vs after deployment
- **Filter errors by release**
- **Set up alerts** for error rate spikes after deployment

### Setting Release on Deploy

#### Vercel (Frontend)
Add to your build command or use Vercel's environment variables:
```bash
VITE_SENTRY_RELEASE=$(git rev-parse HEAD)
```

#### Railway (Backend)
Add to your Railway environment variables:
```bash
SENTRY_RELEASE=$(git rev-parse HEAD)
```

Or set it in your deployment script:
```bash
export SENTRY_RELEASE=$(git rev-parse HEAD)
```

## Error Tagging

All errors are automatically tagged with:

- **role** - User role (ADMIN, CREATOR, BRAND, etc.)
- **route** - Current route/path
- **feature** - Feature area (talent, campaigns, messaging, gmail, etc.)
- **release** - Release version (if set)

This allows filtering in Sentry like:
- "Show me all errors for ADMIN users"
- "Show me errors in the talent feature"
- "Show me errors introduced after last deploy"

## Usage Examples

### Frontend: Manual Error Capture
```javascript
import { captureException, setSentryTags } from "./lib/sentry.js";

try {
  // Some code that might fail
} catch (error) {
  setSentryTags({ feature: "talent", action: "create" });
  captureException(error, { context: "Creating talent record" });
}
```

### Backend: Manual Error Capture
```typescript
import * as Sentry from "@sentry/node";

try {
  // Some code that might fail
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: "talent", action: "create" },
    extra: { context: "Creating talent record" },
  });
}
```

## Testing

### Test Frontend Error Capture
1. Open browser console
2. Run: `throw new Error("Test error")`
3. Check Sentry dashboard - error should appear within seconds

### Test Backend Error Capture
1. Make a request to a non-existent endpoint
2. Check Sentry dashboard - 404 should appear (if configured to capture)
3. Or trigger a 500 error intentionally
4. Check Sentry dashboard - error should appear with full stack trace

## Monitoring Dashboard

Once configured, you can:

1. **View all errors** in real-time at https://sentry.io
2. **Set up alerts** for error rate spikes
3. **Filter by tags** (role, route, feature, release)
4. **Compare releases** to see if new errors were introduced
5. **View stack traces** with source maps (if configured)

## Source Maps (Optional)

For better stack traces, enable source maps:

### Frontend (Vite)
Source maps are automatically generated in production builds. Sentry will use them if:
- `VITE_SENTRY_RELEASE` is set
- Source maps are uploaded to Sentry (via Sentry CLI or build plugin)

### Backend (TypeScript)
Source maps are included in the build. Sentry will use them automatically.

## Alerts & Notifications

Set up alerts in Sentry dashboard for:
- **Error rate spikes** - Alert when errors increase by X% in Y minutes
- **New errors** - Alert when a new error type appears
- **Release issues** - Alert when error rate increases after a release

## Troubleshooting

### Errors not appearing in Sentry
1. **Check DSN is set** - Verify environment variables are correct
2. **Check environment** - Ensure DSN is set in the correct environment
3. **Check Sentry dashboard** - Verify project is active
4. **Check browser console** - Look for Sentry initialization messages

### Too many errors
- Adjust `tracesSampleRate` in `apps/web/src/lib/sentry.ts` (currently 0.1 = 10%)
- Adjust `ignoreErrors` list to filter out known non-critical errors

### Missing context
- Ensure user is logged in (for user context)
- Ensure route tracking is working (check `setSentryTags` calls)

## Files Modified

### Frontend
- `apps/web/src/lib/sentry.ts` - Sentry initialization and helpers
- `apps/web/src/main.jsx` - Early Sentry initialization
- `apps/web/src/components/AppErrorBoundary.jsx` - Sentry integration
- `apps/web/src/components/RouteErrorBoundary.jsx` - Sentry integration
- `apps/web/src/context/AuthContext.jsx` - User context tracking
- `apps/web/src/App.jsx` - Route and feature tagging

### Backend
- `apps/api/src/server.ts` - Sentry initialization and error handlers

## Next Steps

1. **Set up Sentry account** and get DSNs
2. **Add environment variables** to Vercel and Railway
3. **Test error capture** (see Testing section)
4. **Set up alerts** in Sentry dashboard
5. **Configure release tracking** for deployment safety

## Support

For Sentry-specific issues, see:
- Sentry Docs: https://docs.sentry.io
- React SDK: https://docs.sentry.io/platforms/javascript/guides/react/
- Node.js SDK: https://docs.sentry.io/platforms/node/

