# MONITORING QUICK REFERENCE

**Phase 8 Implementation** — December 26, 2025

---

## HEALTH CHECK ENDPOINTS

```bash
# Basic health (uptime, database)
curl https://api.breakagency.com/health

# Detailed health (all components)
curl https://api.breakagency.com/health/detailed

# Cron job status
curl https://api.breakagency.com/api/cron/status
```

---

## ERROR HANDLING IN ROUTES

```typescript
import { normalizeError } from "../utils/errorNormalizer";
import { sendAlert, logErrorForSummary } from "../utils/alerting";

try {
  // Your code here
  const result = await prisma.deal.findUnique({ where: { id } });
} catch (error) {
  // 1. Normalize error
  const normalized = normalizeError(error);
  
  // 2. Log for daily summary
  logErrorForSummary(error);
  
  // 3. Send alert if critical (async, don't block)
  sendAlert(error, { 
    endpoint: req.path, 
    userId: req.user?.id 
  }).catch(console.error);
  
  // 4. Return user-friendly message
  res.status(500).json({ error: normalized.userMessage });
  
  // 5. Log technical details
  console.error("[API ERROR]", normalized.message);
}
```

---

## CRON JOB SETUP

```typescript
import { registerCronJob, observableCron, markCronJobsRegistered } from "../utils/cronObservability";
import cron from "node-cron";

// 1. Register all jobs
registerCronJob("gmail-sync", "*/5 * * * *");
registerCronJob("webhook-renewal", "0 0 * * *");

// 2. Wrap with observability
const wrappedGmailSync = observableCron("gmail-sync", async () => {
  await syncInboxForAllUsers();
});

const wrappedWebhookRenewal = observableCron("webhook-renewal", async () => {
  await renewGmailWebhooks();
});

// 3. Schedule jobs
cron.schedule("*/5 * * * *", wrappedGmailSync);
cron.schedule("0 0 * * *", wrappedWebhookRenewal);

// 4. Mark registration complete (IMPORTANT)
markCronJobsRegistered();
```

---

## ENVIRONMENT VARIABLES

### Monitoring (Recommended)
```bash
# Slack alerts (instant notifications)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Email alerts (backup notifications)
ALERT_EMAILS=admin@breakagency.com,devops@breakagency.com

# Error tracking (Sentry)
SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id
VITE_SENTRY_DSN=https://your-frontend-dsn@sentry.io/project-id
```

### Email Alerts (Optional)
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
ALERT_FROM_EMAIL=alerts@breakagency.com
```

---

## DAILY ERROR SUMMARY (CRON)

```typescript
import { sendDailyErrorSummary } from "../utils/alerting";

// Send summary at 9 AM daily
cron.schedule("0 9 * * *", observableCron("daily-error-summary", async () => {
  console.log("[CRON] Sending daily error summary");
  await sendDailyErrorSummary();
}));
```

---

## ALERT EXAMPLES

### Slack Alert Format
```
🚨 **Critical Error Alert**

**Time:** 2025-12-26T10:30:00.000Z
**Error:** Prisma P2025: Record not found
**Endpoint:** /api/crm-deals/123
**User ID:** user_abc123
**Environment:** production

**User-Facing Message:** The record you're trying to update or delete doesn't exist.

**Stack Trace (first 500 chars):**
Error: Record to update not found...
```

### Daily Summary Format
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

## ERROR NORMALIZATION EXAMPLES

### Prisma Errors
```typescript
// Input: PrismaClientKnownRequestError (P2025)
// User Message: "The record you're trying to update or delete doesn't exist."
// Technical: "Prisma P2025: Record to update not found."

// Input: PrismaClientKnownRequestError (P2002)
// User Message: "A record with this value already exists."
// Technical: "Prisma P2002: Unique constraint failed"
```

### HTTP Errors
```typescript
// Input: 401 Unauthorized
// User Message: "Please log in to continue."
// Technical: "Unauthorized: 401"

// Input: 503 Service Unavailable
// User Message: "The service is temporarily unavailable. Please try again shortly."
// Technical: "Service unavailable: 503"
```

### Network Errors
```typescript
// Input: ECONNREFUSED
// User Message: "Unable to connect to the service. Please check your connection."
// Technical: "Network error: Connection refused (ECONNREFUSED)"

// Input: ETIMEDOUT
// User Message: "The request took too long. Please try again."
// Technical: "Network error: Connection timeout (ETIMEDOUT)"
```

---

## TESTING MONITORING

### Test Health Endpoints
```bash
# Should return 200 with database status
curl http://localhost:5001/health

# Should return detailed system health
curl http://localhost:5001/health/detailed

# Should return cron job list
curl http://localhost:5001/api/cron/status
```

### Test Error Normalization
```typescript
// Add to any route temporarily
app.get("/test-error", (req, res) => {
  const error = new Error("Test error");
  error.code = "P2025"; // Simulate Prisma error
  throw error;
});

// Response should have user-friendly message:
// { "error": "The record you're trying to update or delete doesn't exist." }
```

### Test Alerting
```typescript
// Add to any route temporarily
import { sendAlert } from "./utils/alerting";

app.get("/test-alert", async (req, res) => {
  const testError = new Error("Test critical error");
  await sendAlert(testError, { endpoint: "/test-alert" });
  res.json({ sent: true });
});

// Check Slack for alert message
```

---

## TROUBLESHOOTING

### Health check returns 503
1. Check database connection (`DATABASE_URL`)
2. Review detailed health response for failing component
3. Check memory usage (warning at 500MB)
4. Verify required environment variables are set

### Cron jobs not tracked
1. Verify `registerCronJob()` called for each job
2. Check `markCronJobsRegistered()` called after all registrations
3. Review `/api/cron/status` for job list
4. Check server logs for "[CRON] Registered job" messages

### Alerts not sending
1. **Slack:** Verify `SLACK_WEBHOOK_URL` is set correctly
2. **Email:** Verify `ALERT_EMAILS` and SMTP credentials
3. Check logs for "[ALERT] Sending alert" messages
4. Test webhook: `curl -X POST $SLACK_WEBHOOK_URL -d '{"text":"Test"}'`

### Sentry not receiving errors
1. Verify `SENTRY_DSN` is set (backend) and `VITE_SENTRY_DSN` (frontend)
2. Check for "[SENTRY] Error tracking initialized" in logs
3. Test with intentional error: `throw new Error("Test Sentry")`
4. Check Sentry project settings (rate limits, filters)

---

## FILES TO REFERENCE

**Core Utilities:**
- `/apps/api/src/utils/errorNormalizer.ts` - Error translation
- `/apps/api/src/utils/cronObservability.ts` - Cron tracking
- `/apps/api/src/utils/alerting.ts` - Alert system

**Endpoints:**
- `/apps/api/src/routes/health.ts` - Health checks

**Integration:**
- `/apps/api/src/server.ts` - Global error handler

**Documentation:**
- `/MONITORING_SETUP_GUIDE.md` - Comprehensive setup guide
- `/PHASE_8_MONITORING_COMPLETE.md` - Implementation summary

---

## PRODUCTION CHECKLIST

**Pre-Deployment:**
- ✅ Error normalizer created
- ✅ Health endpoints implemented
- ✅ Cron observability added
- ✅ Alerting system configured
- ✅ Global error handler integrated

**Deployment:**
- ⏳ Set `SLACK_WEBHOOK_URL`
- ⏳ Set `ALERT_EMAILS`
- ⏳ Create Sentry projects
- ⏳ Set `SENTRY_DSN` variables
- ⏳ Add health endpoint to uptime monitor

**Post-Deployment:**
- ⏳ Test health endpoints
- ⏳ Verify cron jobs running
- ⏳ Confirm alerts sending
- ⏳ Review daily error summary
- ⏳ Monitor Sentry for errors

---

**Monitoring System Ready** — December 26, 2025
