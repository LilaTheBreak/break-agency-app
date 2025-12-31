# Sentry Verification Guide

## ✅ Verification Events Added

### Frontend (apps/web/src/lib/sentry.ts)
- **Location:** Inside `initSentry()` after `Sentry.init()`
- **Event:** "Sentry frontend verification event"
- **Level:** info
- **Tags:** `verification: true`, `environment`

### Backend (apps/api/src/instrument.ts)
- **Location:** After `Sentry.init()` in instrument.ts
- **Event:** "Sentry backend verification event"
- **Level:** info
- **Tags:** `verification: true`, `environment`

## 📋 Verification Steps

1. **Deploy to production** (or run locally with DSNs set in `.env.local`)
2. **Check Sentry dashboard** for:
   - "Sentry frontend verification event" (platform: javascript)
   - "Sentry backend verification event" (platform: node)
3. **Verify Sentry status** shows "Verified" (not "Waiting to verify")
4. **Once confirmed**, remove all code marked with `TEMPORARY` comments

## 🧹 Cleanup After Verification

Once events appear in Sentry dashboard:

1. Remove verification code from:
   - `apps/web/src/lib/sentry.ts` (lines ~118-131)
   - `apps/api/src/instrument.ts` (lines ~58-71)

2. Search for `TEMPORARY` comments and remove those blocks

3. Verify Sentry still works by checking:
   - Frontend: ErrorTestButton still works
   - Backend: `/debug-sentry` endpoint still works

## ⚠️ Important

- Do NOT remove `Sentry.init()` calls
- Do NOT remove error handlers
- Do NOT remove ErrorBoundaries
- Only remove the `captureMessage` verification calls

## 🧪 Testing

**Frontend:**
- Start: `cd apps/web && pnpm dev`
- Look for console log: "[Sentry] Frontend verification event sent"
- Check Sentry dashboard

**Backend:**
- Start: `cd apps/api && pnpm dev`
- Look for console log: "[Sentry] Backend verification event sent"
- Check Sentry dashboard
