# MONITORING & OPERATIONAL SAFETY SETUP

**Date:** December 26, 2025  
**Status:** ✅ Ready for implementation  
**Purpose:** Guide for setting up production monitoring and alerting

---

## OVERVIEW

This guide explains how to set up monitoring and operational safety for the Break Agency platform. The implementation is minimal, reliable, and focused on critical failures.

---

## 1. ERROR TRACKING WITH SENTRY

### Frontend Setup (React)

**Install Sentry:**
```bash
cd apps/web
npm install @sentry/react
```

**Configure in `apps/web/src/main.jsx`:**
```javascript
import * as Sentry from "@sentry/react";

// Initialize Sentry (only in production)
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay(),
    ],
    
    // Performance monitoring
    tracesSampleRate: 0.1, // 10% of transactions
    
    // Session replay (for debugging)
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    
    // Filter sensitive data
    beforeSend(event, hint) {
      // Remove sensitive data from events
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
      }
      return event;
    },
  });
}
```

**Environment Variable:**
```
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

---

### Backend Setup (Node.js)

**Install Sentry:**
```bash
cd apps/api
npm install @sentry/node
```

**Configure in `apps/api/src/server.ts`:**
```typescript
import * as Sentry from "@sentry/node";

// Initialize Sentry (only in production)
if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1, // 10% of transactions
    
    // Filter sensitive data
    beforeSend(event, hint) {
      // Remove sensitive request data
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers?.authorization;
        delete event.request.headers?.cookie;
      }
      return event;
    },
  });
  
  console.log("[SENTRY] Error tracking initialized");
}

// Add Sentry middleware FIRST
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// ... your routes ...

// Add Sentry error handler LAST (before other error handlers)
app.use(Sentry.Handlers.errorHandler());
```

**Environment Variable:**
```
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

---

## 2. HEALTH ENDPOINTS

### Available Endpoints

**Basic Health Check:**
```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-26T10:00:00.000Z",
  "database": "connected",
  "uptime": 12345
}
```

**Detailed Health Check:**
```
GET /health/detailed
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-26T10:00:00.000Z",
  "uptime": 12345,
  "checks": {
    "database": {
      "status": "healthy",
      "message": "Database connection successful"
    },
    "memory": {
      "status": "healthy",
      "usage": {
        "rss": 256,
        "heapTotal": 128,
        "heapUsed": 64,
        "external": 8
      },
      "message": "Memory usage normal"
    },
    "environment": {
      "status": "healthy",
      "message": "All required environment variables set",
      "missing": []
    },
    "cron": {
      "status": "healthy",
      "message": "Cron jobs running normally",
      "registered": true,
      "lastRun": "2025-12-26T09:55:00.000Z",
      "minutesSinceLastRun": 5
    },
    "gmailWebhook": {
      "status": "healthy",
      "message": "Gmail webhook receiving notifications",
      "registered": true,
      "url": "https://api.breakagency.com"
    }
  }
}
```

**Cron Status:**
```
GET /api/cron/status
```

**Response:**
```json
{
  "registered": true,
  "jobs": [
    {
      "name": "gmail-sync",
      "schedule": "*/5 * * * *",
      "lastRun": "2025-12-26T09:55:00.000Z",
      "lastStatus": "success",
      "lastError": null,
      "runCount": 145,
      "lastDuration": 2340
    },
    {
      "name": "webhook-renewal",
      "schedule": "0 0 * * *",
      "lastRun": "2025-12-26T00:00:00.000Z",
      "lastStatus": "success",
      "lastError": null,
      "runCount": 7,
      "lastDuration": 450
    }
  ]
}
```

---

## 3. UPTIME MONITORING

### Recommended Services

**Option 1: UptimeRobot (Free)**
- Monitor: `https://api.breakagency.com/health`
- Check interval: 5 minutes
- Alert on: Status code != 200
- Notification: Email/SMS

**Option 2: Better Uptime**
- Monitor: `https://api.breakagency.com/health/detailed`
- Check interval: 1 minute
- Parse JSON response for component health
- Alert on: Any check status = "unhealthy"

**Option 3: Pingdom**
- Monitor: `https://api.breakagency.com/health`
- Transaction monitoring for critical flows
- Real user monitoring (RUM)

---

## 4. ALERTING SETUP

### Email Alerts

**Environment Variable:**
```
ALERT_EMAILS=admin@breakagency.com,devops@breakagency.com
```

**Configure Email Service (Optional):**
If you want to implement email alerts, uncomment the nodemailer code in `/apps/api/src/utils/alerting.ts` and add:

```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
ALERT_FROM_EMAIL=alerts@breakagency.com
```

---

### Slack Alerts

**Setup:**
1. Create Slack Incoming Webhook: https://api.slack.com/messaging/webhooks
2. Add webhook URL to environment:

```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**Alert Format:**
```
🚨 **Critical Error Alert**

**Time:** 2025-12-26T10:30:00.000Z
**Error:** Prisma P2025: Record not found
**Endpoint:** /api/crm-deals/123
**User ID:** user_abc123
**Environment:** production

**User-Facing Message:** The record you're trying to update or delete doesn't exist.

**Stack Trace (first 500 chars):**
```
Error: Record to update not found...
```
```

---

### Daily Error Summary

**Setup:**
Add to your cron jobs (in `apps/api/src/lib/cron/index.ts`):

```typescript
import { sendDailyErrorSummary } from "../utils/alerting";

// Daily error summary at 9 AM
cron.schedule("0 9 * * *", observableCron("daily-error-summary", async () => {
  console.log("[CRON] Sending daily error summary");
  await sendDailyErrorSummary();
}));
```

**Summary Format:**
```
📊 **Daily Error Summary**

**Total Errors:** 47

**Breakdown by Type:**
- Prisma P2025: 23 occurrences
- Network timeout: 12 occurrences
- Gmail sync failed: 8 occurrences
- Unknown error: 4 occurrences

**Environment:** production
**Timestamp:** 2025-12-26T09:00:00.000Z
```

---

## 5. ERROR NORMALIZATION

### Usage in API Routes

**Before (raw Prisma error):**
```typescript
try {
  const deal = await prisma.deal.findUnique({ where: { id } });
} catch (error) {
  res.status(500).json({ error: "Prisma P2025: Record to update not found." });
}
```

**After (normalized error):**
```typescript
import { normalizeError } from "../utils/errorNormalizer";
import { sendAlert, logErrorForSummary } from "../utils/alerting";

try {
  const deal = await prisma.deal.findUnique({ where: { id } });
} catch (error) {
  const normalized = normalizeError(error);
  
  // Log for daily summary
  logErrorForSummary(error);
  
  // Send alert if critical
  await sendAlert(error, { endpoint: req.path, userId: req.user?.id });
  
  // Return user-friendly message
  res.status(500).json({ error: normalized.userMessage });
  
  // Log internal message for debugging
  console.error("[API ERROR]", normalized.message);
}
```

---

## 6. CRON JOB OBSERVABILITY

### Wrap Existing Cron Jobs

**Before:**
```typescript
cron.schedule("*/5 * * * *", async () => {
  console.log("Syncing Gmail inbox...");
  await syncInboxForAllUsers();
});
```

**After:**
```typescript
import { registerCronJob, observableCron, markCronJobsRegistered } from "../utils/cronObservability";

// Register job
registerCronJob("gmail-sync", "*/5 * * * *");

// Wrap with observability
cron.schedule("*/5 * * * *", observableCron("gmail-sync", async () => {
  await syncInboxForAllUsers();
}));

// After registering all jobs
markCronJobsRegistered();
```

**Benefits:**
- Automatic logging of start/end times
- Execution duration tracking
- Failure detection and logging
- Exposed via `/api/cron/status` endpoint

---

## 7. PRODUCTION DEPLOYMENT CHECKLIST

### Environment Variables to Set

**Required:**
- `NODE_ENV=production`
- `DATABASE_URL` (PostgreSQL connection string)
- `SESSION_SECRET` (random string, min 32 chars)
- `JWT_SECRET` (random string, min 32 chars)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `GMAIL_REDIRECT_URI`
- `FRONTEND_ORIGIN`

**Monitoring (Recommended):**
- `SENTRY_DSN` (backend error tracking)
- `VITE_SENTRY_DSN` (frontend error tracking)
- `ALERT_EMAILS` (comma-separated)
- `SLACK_WEBHOOK_URL` (for Slack alerts)

**Optional:**
- `OPENAI_API_KEY` (for AI features)
- `STRIPE_SECRET_KEY` (for payments)
- `S3_*` variables (for file storage)
- `REDIS_URL` (for queue system)

---

### Monitoring Service Setup

1. **Sentry:**
   - Create project at https://sentry.io
   - Copy DSN to `SENTRY_DSN` and `VITE_SENTRY_DSN`
   - Set up error alerts in Sentry dashboard

2. **Uptime Monitoring:**
   - Add `/health` endpoint to UptimeRobot or similar
   - Set alert threshold: 2 failures in 5 minutes
   - Configure email/SMS notifications

3. **Log Aggregation (Optional):**
   - Use Railway logs, Papertrail, or Logtail
   - Set up log retention (30+ days recommended)
   - Create saved searches for common errors

---

## 8. DAILY OPERATIONS

### Morning Checklist

1. Check health endpoint: `curl https://api.breakagency.com/health/detailed`
2. Review Sentry errors from last 24 hours
3. Check cron status: `curl https://api.breakagency.com/api/cron/status`
4. Review daily error summary (email/Slack)

### Weekly Checklist

1. Review error trends in Sentry
2. Check database connection pool usage
3. Review memory usage trends
4. Update dependencies (security patches)

### Monthly Checklist

1. Review all monitoring alerts (true positives vs false positives)
2. Update alert thresholds if needed
3. Review cron job performance
4. Audit error normalization (are messages clear?)

---

## 9. TROUBLESHOOTING

### Health Check Returns 503

**Database unhealthy:**
- Check DATABASE_URL is correct
- Verify database is running
- Check connection pool limits

**Memory warning:**
- Review memory usage trends
- Check for memory leaks
- Consider increasing server resources

**Cron status warning:**
- Check cron logs for failures
- Verify cron jobs are registered
- Review last error in `/api/cron/status`

---

### No Cron Jobs Running

1. Check server logs for "[CRON] Registered job"
2. Verify `markCronJobsRegistered()` was called
3. Check `/api/cron/status` for job list
4. Review Railway/server logs for cron execution

---

### Sentry Not Receiving Errors

1. Verify `SENTRY_DSN` is set correctly
2. Check Sentry is initialized (look for "[SENTRY] Error tracking initialized" in logs)
3. Test with intentional error: `throw new Error("Test Sentry")`
4. Check Sentry project settings (rate limits, filters)

---

### Alerts Not Sending

**Email alerts:**
- Verify `ALERT_EMAILS` is set
- Check SMTP credentials (if using email)
- Review logs for "[ALERT] Email alert sent"

**Slack alerts:**
- Verify `SLACK_WEBHOOK_URL` is set
- Test webhook: `curl -X POST $SLACK_WEBHOOK_URL -d '{"text":"Test"}'`
- Check Slack app permissions

---

## 10. NEXT STEPS

### Immediate (Week 1):
1. ✅ Set up Sentry projects (frontend + backend)
2. ✅ Add health endpoint monitoring
3. ✅ Configure Slack webhook
4. ⏳ Test alerts with intentional errors
5. ⏳ Document alert escalation policy

### Short-term (Month 1):
1. ⏳ Review error trends and adjust normalization
2. ⏳ Set up log aggregation service
3. ⏳ Create runbooks for common errors
4. ⏳ Add performance monitoring

### Medium-term (Quarter 1 2026):
1. ⏳ Add custom Sentry dashboards
2. ⏳ Implement automated error triage
3. ⏳ Set up error rate SLOs
4. ⏳ Add distributed tracing

---

**Monitoring Setup Complete** - December 26, 2025  
**Status:** ✅ **Ready for Production**
