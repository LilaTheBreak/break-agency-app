# Sentry Cleanup Plan

**⚠️ DO NOT EXECUTE UNTIL SENTRY IS VERIFIED**

This document lists all TEMPORARY code that must be removed after Sentry verification is confirmed.

---

## Cleanup Checklist

### ✅ Step 1: Verify Sentry is Working

Before cleanup, confirm:
- [ ] Events appear in Sentry dashboard
- [ ] Both frontend and backend events are visible
- [ ] Sentry status shows "Verified" (or events are clearly being received)

---

## Files to Clean

### 1. `apps/web/src/lib/sentry.ts`

**Remove (lines ~27-31):**
```typescript
// TEMPORARY — SENTRY VERIFICATION: Log DSN status at runtime
console.log('[Sentry] Frontend DSN check:', {
  hasDsn: !!dsn,
  dsnLength: dsn ? dsn.length : 0,
  environment,
  release,
  allEnvKeys: Object.keys(import.meta.env).filter(k => k.includes('SENTRY'))
});
```

**Keep:**
- All `Sentry.init()` configuration
- All helper functions (setSentryUser, captureException, etc.)
- All error handling logic

---

### 2. `apps/api/src/instrument.ts`

**Remove (lines ~14-21):**
```typescript
// TEMPORARY — SENTRY VERIFICATION: Log DSN status at runtime
console.log('[Sentry] Backend DSN check:', {
  hasDsn: !!dsn,
  dsnLength: dsn ? dsn.length : 0,
  environment,
  release,
  allEnvKeys: Object.keys(process.env).filter(k => k.includes('SENTRY'))
});
```

**Keep:**
- All `Sentry.init()` configuration
- All error handling logic
- Export statement

---

### 3. `apps/api/src/routes/health.ts`

**Remove (line ~5):**
```typescript
// TEMPORARY — SENTRY VERIFICATION: Import Sentry for guaranteed test event
import * as Sentry from "@sentry/node";
```

**Remove (lines ~25-40 in healthCheck function):**
```typescript
// TEMPORARY — SENTRY VERIFICATION: Force a guaranteed Sentry event on every health check
try {
  Sentry.captureException(
    new Error("Sentry backend HARD verification test - health check"),
    {
      level: "info",
      tags: {
        verification: "hard_test",
        endpoint: "/health",
        source: "health_check",
      },
    }
  );
  console.log("[Sentry] Hard verification event sent from /health endpoint");
} catch (error) {
  console.warn("[Sentry] Failed to send hard verification event:", error);
}
```

**Keep:**
- All health check logic
- All database connectivity checks
- All other health check functionality

---

### 4. `apps/web/src/App.jsx`

**Remove (line ~105):**
```typescript
// TEMPORARY — SENTRY VERIFICATION: Import Sentry for guaranteed test event
import * as Sentry from "@sentry/react";
```

**Remove (lines ~284-302):**
```typescript
// TEMPORARY — SENTRY VERIFICATION: Force a guaranteed Sentry event on app mount
useEffect(() => {
  try {
    Sentry.captureException(
      new Error("Sentry frontend HARD verification test - app mount"),
      {
        level: "info",
        tags: {
          verification: "hard_test",
          source: "app_mount",
          route: location.pathname,
        },
      }
    );
    console.log("[Sentry] Hard verification event sent from App.jsx on mount");
  } catch (error) {
    console.warn("[Sentry] Failed to send hard verification event:", error);
  }
}, []); // Run once on mount
```

**Keep:**
- All App component logic
- Route tracking useEffect
- All other functionality

---

## Verification Code to Keep

**DO NOT REMOVE:**
- `Sentry.init()` calls (frontend and backend)
- `setupExpressErrorHandler()` in server.ts
- ErrorBoundary components
- All Sentry helper functions
- All error handling logic

---

## Cleanup Commands

After verification, you can use these commands to find all TEMPORARY code:

```bash
# Find all TEMPORARY Sentry verification code
grep -rn "TEMPORARY.*SENTRY VERIFICATION" apps/

# Find all hard test events
grep -rn "HARD verification test" apps/

# Find all diagnostic logging
grep -rn "DSN check:" apps/
```

---

## Post-Cleanup Verification

After removing TEMPORARY code:

1. **Test that Sentry still works:**
   - Frontend: Use ErrorTestButton component
   - Backend: Hit `/debug-sentry` endpoint
   - Verify events appear in Sentry dashboard

2. **Verify no broken imports:**
   - Frontend builds without errors
   - Backend starts without errors
   - No console errors about missing Sentry

3. **Confirm production still works:**
   - Deploy to production
   - Check that real errors are still captured
   - Verify Sentry dashboard shows new events

---

## Summary

**Total TEMPORARY blocks to remove:** 4 files, ~50 lines of code

**What stays:** All Sentry initialization, configuration, and error handling

**Estimated cleanup time:** 5-10 minutes

**Risk level:** Low (only removing diagnostic/test code, keeping all functional code)

