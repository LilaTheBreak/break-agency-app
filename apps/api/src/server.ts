import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import routes from "./routes/index.js";
import activityRouter from "./routes/activity.js";
import auditRouter from "./routes/audit.js";

// Middleware
import { requestContextMiddleware } from "./middleware/requestContext.js";
import { auditMiddleware } from "./middleware/audit.js";
import { attachUserFromSession } from "./middleware/auth.js";

// Jobs / Cron
import { registerEmailQueueJob } from "./jobs/emailQueue.js";
import { registerCronJobs } from "./cron/index.js";

// Webhooks
import { stripeWebhookHandler } from "./routes/webhooks.js";
import signatureWebhookRouter from "./routes/signatureWebhooks.js";

// Core Routers
import paymentsRouter from "./routes/payments.js";
import filesRouter from "./routes/files.js";

// Gmail & Inbox
import gmailAuthRouter from "./routes/gmailAuth.js";
import gmailAnalysisRouter from "./routes/gmailAnalysis.js";
import gmailInboxRouter from "./routes/gmailInbox.js";
import gmailMessagesRouter from "./routes/gmailMessages.js";
import gmailWebhookRouter from "./routes/gmailWebhook.js";
import cronRouter from "./routes/cron.js";
import inboxAwaitingRouter from "./routes/inboxAwaitingReply.js";
import inboxPriorityRouter from "./routes/inboxPriority.js";
import inboxTrackingRouter from "./routes/inboxTracking.js";
import inboxAnalyticsRouter from "./routes/inboxAnalytics.js";
import inboxPriorityFeedRouter from "./routes/inboxPriorityFeed.js";
import inboxCountersRouter from "./routes/inboxCounters.js";
import inboxThreadRouter from "./routes/inboxThread.js";
import inboxRescanRouter from "./routes/inboxRescan.js";
import inboxCategoriesRouter from "./routes/inboxCategories.js";
import unifiedInboxRouter from "./routes/unifiedInbox.js";
import emailOpportunitiesRouter from "./routes/emailOpportunities.js";

// AI
import aiRouter from "./routes/ai.js";

// Authenticity / Risk / Suitability
import authenticityRouter from "./routes/authenticity.js";
import opportunitiesRouter from "./routes/opportunities.js";
import submissionsRouter from "./routes/submissions.js";
import resourcesRouter from "./routes/resources.js";
import riskRouter from "./routes/risk.js";
import suitabilityRouter from "./routes/suitability.js";

// Auth
import authRouter from "./routes/auth.js";

// Dev Auth (development only)
import devAuthRouter from "./routes/devAuth.js";

// User Approvals
import userApprovalsRouter from "./routes/userApprovals.js";
import approvalsRouter from "./routes/approvals.js";

// Queues
import queuesRouter from "./routes/queues.js";

// Users Management
import usersRouter from "./routes/users.js";
import setupRouter from "./routes/setup.js";

// Exclusive Talent
import exclusiveRouter from "./routes/exclusive.js";

// Creator Onboarding
import creatorRouter from "./routes/creator.js";

// Analytics
import analyticsRouter from "./routes/analytics.js";

// Revenue
import revenueRouter from "./routes/revenue.js";

// Admin Finance
import adminFinanceRouter from "./routes/admin/finance.js";

// Admin Users
import adminUsersRouter from "./routes/adminUsers.js";

// Creator Goals & Wellness
import creatorGoalsRouter from "./routes/creatorGoals.js";
import wellnessCheckinsRouter from "./routes/wellnessCheckins.js";

// Deals
import dealsRouter from "./routes/deals.js";
import dealTimelineRouter from "./routes/dealTimeline.js";
import dealInsightsRouter from "./routes/dealInsights.js";
// dealPackagesRouter removed - deal packages schema models were removed

// Deliverables / Contracts
import deliverablesRouter from "./routes/deliverables.js";
import contractRouter from "./routes/contracts.js";

// Campaigns
import campaignBuilderRouter from "./routes/campaignBuilder.js";
import campaignAutoRouter from "./routes/campaignAuto.js";
import campaignAutoDebugRouter from "./routes/campaignAutoDebug.js";
import campaignAutoPreviewRouter from "./routes/campaignAutoPreview.js";
import briefsRouter from "./routes/briefs.js";

// Brand CRM / Strategy
import brandCRMRouter from "./routes/brandCRM.js";
import strategyRouter from "./routes/strategy.js";
import creatorFitRouter from "./routes/creatorFit.js";
import rosterRouter from "./routes/roster.js";

// CRM: Brands, Contacts, Outreach, Campaigns, Events & Deals
import crmBrandsRouter from "./routes/crmBrands.js";
import crmContactsRouter from "./routes/crmContacts.js";
import outreachRecordsRouter from "./routes/outreachRecords.js";
import crmCampaignsRouter from "./routes/crmCampaigns.js";
import crmEventsRouter from "./routes/crmEvents.js";
import crmDealsRouter from "./routes/crmDeals.js";
import crmContractsRouter from "./routes/crmContracts.js";
import crmTasksRouter from "./routes/crmTasks.js";

// Bundles
import bundlesRouter from "./routes/bundles.js";

// Notifications
import notificationsRouter from "./routes/notifications.js";

// Calendar Intelligence
import calendarIntelligenceRouter from "./routes/calendarIntelligence.js";
import calendarRouter from "./routes/calendar.js";

// Outreach System
import outreachRouter from "./routes/outreach.js";
import outreachLeadsRouter from "./routes/outreachLeads.js";
import outreachSequencesRouter from "./routes/outreachSequences.js";
import outreachTemplatesRouter from "./routes/outreachTemplates.js";
import outreachMetricsRouter from "./routes/outreachMetrics.js";
import salesOpportunitiesRouter from "./routes/salesOpportunities.js";

// Agent
import agentRouter from "./routes/agent.js";

// Threads
import threadRouter from "./routes/threads.js";

// Insights
import insightsRouter from "./routes/insights.js";

// Health
import { healthCheck, detailedHealthCheck, cronStatusCheck } from "./routes/health.js";

// Monitoring utilities
import { normalizeError } from "./utils/errorNormalizer.js";
import { sendAlert, logErrorForSummary } from "./utils/alerting.js";

// Performance monitoring
import { initializeSlowQueryLogging, requestDurationMiddleware, startMemoryTracking } from "./utils/slowQueryDetection.js";
import { prisma } from "./utils/prismaClient.js";

// Performance dashboard
import performanceRouter from "./routes/admin/performance.js";

dotenv.config();

// ------------------------------------------------------
// ENV DEBUG LOGGING
// ------------------------------------------------------
console.log(">>> ENV LOADED FROM =", process.env?.ENV_FILE ?? ".env (default)");
console.log(">>> PROCESS CWD =", process.cwd());
console.log(">>> GOOGLE_CLIENT_ID =", process.env.GOOGLE_CLIENT_ID);
console.log(
  ">>> GOOGLE_CLIENT_SECRET =",
  process.env.GOOGLE_CLIENT_SECRET ? `${process.env.GOOGLE_CLIENT_SECRET.slice(0, 4)}****` : "[MISSING]"
);
console.log(">>> GOOGLE_REDIRECT_URI =", process.env.GOOGLE_REDIRECT_URI);

// ------------------------------------------------------
// VALIDATE PRODUCTION CREDENTIALS
// ------------------------------------------------------
import { validateProductionCredentials } from "./lib/env.js";

const credentialValidation = validateProductionCredentials();

if (!credentialValidation.valid) {
  console.error("\n❌ INVALID GOOGLE OAUTH CREDENTIALS:");
  credentialValidation.errors.forEach(err => console.error(`   - ${err}`));
  
  if (process.env.NODE_ENV === "production") {
    console.error("\n🚨 FATAL: Cannot start server in production with invalid credentials");
    console.error("   Please set valid GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI");
    process.exit(1);
  } else {
    console.warn("\n⚠️  WARNING: Invalid credentials detected in development mode");
    console.warn("   Gmail features will not work correctly");
  }
} else {
  console.log("✅ Google OAuth credentials validated");
}

const app = express();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || process.env.WEB_APP_URL || "http://localhost:5173";
// Support multiple origins (comma-separated)
const allowedOrigins = FRONTEND_ORIGIN.split(',').map(o => o.trim());

// Validate each origin is a valid URL
allowedOrigins.forEach((origin, index) => {
  try {
    new URL(origin);
  } catch (error) {
    console.error(`\n❌ INVALID FRONTEND_ORIGIN[${index}]: "${origin}"`);
    console.error(`   Each comma-separated origin must be a valid URL (e.g., https://domain.com)`);
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
});

console.log("✅ FRONTEND_ORIGIN validated:", allowedOrigins[0], `(+${allowedOrigins.length - 1} more)`);

// ------------------------------------------------------
// CORE MIDDLEWARE
// ------------------------------------------------------

// Initialize performance monitoring
console.log("[MONITORING] Initializing performance monitoring...");
initializeSlowQueryLogging(prisma);
startMemoryTracking(60000); // Sample every 60 seconds
console.log("[MONITORING] Performance monitoring initialized");

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Blocked origin: ${origin}`);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Set-Cookie"],
    maxAge: 86400 // 24 hours - cache preflight requests
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());

// Request duration tracking (must be early in middleware chain)
app.use(requestDurationMiddleware);

app.use(attachUserFromSession);

// Stripe webhook MUST run BEFORE body parsers
app.post("/webhooks/stripe", express.raw({ type: "application/json" }), stripeWebhookHandler);

// JSON parser (after stripe)
app.use(express.json({ limit: "350mb" }));
app.use(express.urlencoded({ extended: true, limit: "350mb" }));

// ------------------------------------------------------
// DEV AUTH (development only)
// ------------------------------------------------------
if (process.env.NODE_ENV !== 'production') {
  app.use("/api/dev-auth", devAuthRouter);
}

// ------------------------------------------------------
// AUTH ROUTES (Google OAuth, session management)
// Rate limiting already applied in auth.ts routes
// ------------------------------------------------------
app.use("/api/auth", authRouter);

// ------------------------------------------------------
// INBOX ROUTES (all unique, no overlaps)
// ------------------------------------------------------
app.use("/api/inbox/awaiting-reply", inboxAwaitingRouter);
app.use("/api/inbox/priority", inboxPriorityRouter);
app.use("/api/inbox/open-tracking", inboxTrackingRouter);
app.use("/api/inbox/analytics", inboxAnalyticsRouter);
app.use("/api/inbox/priority-feed", inboxPriorityFeedRouter);
app.use("/api/inbox/counters", inboxCountersRouter);
app.use("/api/inbox/thread", inboxThreadRouter);
app.use("/api/inbox/rescan", inboxRescanRouter);
app.use("/api/inbox", inboxCategoriesRouter);
app.use("/api/inbox/unified", unifiedInboxRouter);

// ------------------------------------------------------
// GMAIL
// ------------------------------------------------------
app.use("/api/gmail/auth", gmailAuthRouter);
app.use("/api/gmail/analysis", gmailAnalysisRouter);
app.use("/api/gmail/inbox", gmailInboxRouter);
app.use("/api/gmail/webhook", gmailWebhookRouter);
app.use("/api", gmailMessagesRouter);
app.use("/api/email-opportunities", emailOpportunitiesRouter);

// ------------------------------------------------------
// CRON JOBS
// ------------------------------------------------------
app.use("/api/cron", cronRouter);

// ------------------------------------------------------
// NOTIFICATIONS & CALENDAR
// ------------------------------------------------------
app.use("/api/notifications", notificationsRouter);
app.use("/api/calendar", calendarIntelligenceRouter);
app.use("/api/calendar", calendarRouter); // Real calendar CRUD routes

// ------------------------------------------------------
// OPPORTUNITIES & SUBMISSIONS
// ------------------------------------------------------
app.use("/api/opportunities", opportunitiesRouter);
app.use("/api/submissions", submissionsRouter);

// ------------------------------------------------------
// RESOURCES
// ------------------------------------------------------
app.use("/api/resources", resourcesRouter);

// ------------------------------------------------------
// USERS MANAGEMENT
// ------------------------------------------------------
app.use("/api/users", usersRouter);
app.use("/api/setup", setupRouter);

// ------------------------------------------------------
// EXCLUSIVE TALENT
// ------------------------------------------------------
app.use("/api/exclusive", exclusiveRouter);

// ------------------------------------------------------
// CREATOR GOALS & WELLNESS
// ------------------------------------------------------
app.use("/api/creator-goals", creatorGoalsRouter);
app.use("/api/wellness-checkins", wellnessCheckinsRouter);

// ------------------------------------------------------
// ANALYTICS
// ------------------------------------------------------
app.use("/api/analytics", analyticsRouter);

// ------------------------------------------------------
// REVENUE (Deal-Based Financial Metrics)
// ------------------------------------------------------
app.use("/api/revenue", revenueRouter);

// ------------------------------------------------------
// CREATOR ONBOARDING
// ------------------------------------------------------
app.use(creatorRouter); // Routes already prefixed with /api/creator

// ------------------------------------------------------
// USER APPROVALS
// ------------------------------------------------------
app.use("/api/user-approvals", userApprovalsRouter);
app.use(approvalsRouter); // Routes already include /api/approvals prefix

// ------------------------------------------------------
// QUEUES
// ------------------------------------------------------
app.use("/api/queues", queuesRouter);

// ------------------------------------------------------
// ADMIN FINANCE CONTROL ROOM
// ------------------------------------------------------
app.use("/api/admin/finance", adminFinanceRouter);

// ------------------------------------------------------
// ADMIN PERFORMANCE DASHBOARD
// ------------------------------------------------------
app.use("/api/admin/performance", performanceRouter);

// ------------------------------------------------------
// ADMIN USER MANAGEMENT
// ------------------------------------------------------
app.use("/api/admin", adminUsersRouter);

// ------------------------------------------------------
// AI
// ------------------------------------------------------
app.use("/api/ai", aiRouter);

// ------------------------------------------------------
// AUTHENTICITY / RISK / SUITABILITY
// ------------------------------------------------------
app.use("/api/authenticity", authenticityRouter);
app.use("/api/risk", riskRouter);
app.use("/api/suitability", suitabilityRouter);

// ------------------------------------------------------
// DEALS
// ------------------------------------------------------
app.use("/api/deals", dealsRouter);
app.use("/api/deal-timeline", dealTimelineRouter);
app.use("/api/deal-insights", dealInsightsRouter);
// /api/deal-packages route removed - deal packages feature was removed from schema

// ------------------------------------------------------
// CONTRACTS / DELIVERABLES
// ------------------------------------------------------
app.use("/api/contracts", contractRouter);
app.use("/api/deliverables", deliverablesRouter);

// New contract and deliverable workflow (manual-first, with templates and file upload)
import deliverablesV2Router from "./routes/deliverables-v2.js";
app.use("/api/deliverables-v2", deliverablesV2Router);

// ------------------------------------------------------
// CAMPAIGNS
// ------------------------------------------------------
app.use("/api/campaign/builder", campaignBuilderRouter);
app.use("/api/campaign/auto-plan", campaignAutoRouter);
app.use("/api/campaign/auto-plan/debug", campaignAutoDebugRouter);
app.use("/api/campaign/auto-plan/preview", campaignAutoPreviewRouter);
app.use("/api/briefs", briefsRouter);

// ------------------------------------------------------
// BRAND CRM / STRATEGY / CREATOR FIT
// ------------------------------------------------------
app.use("/api/brand-crm", brandCRMRouter);
app.use("/api/strategy", strategyRouter);
app.use("/api/creator-fit", creatorFitRouter);
app.use("/api/roster", rosterRouter);

// ------------------------------------------------------
// CRM: BRANDS, CONTACTS, OUTREACH, CAMPAIGNS & EVENTS
// ------------------------------------------------------
app.use("/api/crm-brands", crmBrandsRouter);
app.use("/api/crm-contacts", crmContactsRouter);
app.use("/api/outreach-records", outreachRecordsRouter);
app.use("/api/crm-campaigns", crmCampaignsRouter);
app.use("/api/crm-events", crmEventsRouter);
app.use("/api/crm-deals", crmDealsRouter);
app.use("/api/crm-contracts", crmContractsRouter);
app.use("/api/crm-tasks", crmTasksRouter);
app.use("/api/notifications", notificationsRouter);

// ------------------------------------------------------
// BUNDLES
// ------------------------------------------------------
app.use("/api/bundles", bundlesRouter);

// ------------------------------------------------------
// OUTREACH
// ------------------------------------------------------
app.use("/api/outreach", outreachRouter);
app.use("/api/outreach/leads", outreachLeadsRouter);
app.use("/api/outreach/sequences", outreachSequencesRouter);
app.use("/api/outreach/templates", outreachTemplatesRouter);
app.use("/api/outreach/metrics", outreachMetricsRouter);
app.use("/api/sales-opportunities", salesOpportunitiesRouter);

// ------------------------------------------------------
// AGENT SYSTEM
// ------------------------------------------------------
app.use("/api/agent", agentRouter);

// ------------------------------------------------------
// THREADS
// ------------------------------------------------------
app.use("/api/threads", threadRouter);

// ------------------------------------------------------
// FILES / PAYMENTS
// ------------------------------------------------------
app.use("/api/files", filesRouter);
app.use("/api/payments", paymentsRouter);

// ------------------------------------------------------
// SIGNATURE WEBHOOKS
// ------------------------------------------------------
app.use("/webhooks/signature", signatureWebhookRouter);

// ------------------------------------------------------
// INSIGHTS
// ------------------------------------------------------
app.use("/api/insights", insightsRouter);

// ------------------------------------------------------
// ACTIVITY & AUDIT LOGS
// ------------------------------------------------------
app.use(activityRouter); // Routes already include /api/activity prefix
app.use(auditRouter); // Routes already include /audit prefix

// ------------------------------------------------------
// GLOBAL MIDDLEWARE (AFTER ROUTING)
// ------------------------------------------------------
app.use(requestContextMiddleware);
app.use(auditMiddleware);

// ------------------------------------------------------
// STATIC FILES
// ------------------------------------------------------
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

// ------------------------------------------------------
// BASE ROUTE
// ------------------------------------------------------
app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "Break Agency API is running" });
});

// ------------------------------------------------------
// HEALTH ENDPOINTS
// ------------------------------------------------------
app.get("/health", healthCheck);
app.get("/health/detailed", detailedHealthCheck);
app.get("/api/cron/status", cronStatusCheck);

// ------------------------------------------------------
// FALLBACK ROUTES
// ------------------------------------------------------
app.use("/api", routes);

// ------------------------------------------------------
// GLOBAL ERROR HANDLER (must be last)
// ------------------------------------------------------
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("❌ Global error handler caught:", err);
  
  // Don't send response if headers already sent
  if (res.headersSent) {
    return next(err);
  }
  
  // Normalize error for user-friendly message
  const normalized = normalizeError(err);
  
  // Log error for daily summary
  logErrorForSummary(err);
  
  // Send alert if critical (async, don't wait)
  sendAlert(err, { 
    endpoint: req.path, 
    userId: (req as any).user?.id,
    method: req.method 
  }).catch(alertError => {
    console.error("Failed to send alert:", alertError);
  });
  
  const statusCode = err.statusCode || err.status || 500;
  
  res.status(statusCode).json({
    error: normalized.userMessage,
    ...(process.env.NODE_ENV === "development" && { 
      technicalError: normalized.message,
      stack: err.stack 
    })
  });
});

const PORT = process.env.PORT || 5001;

// Start queue + cron
registerEmailQueueJob();

// Register cron jobs asynchronously to not block server startup
setTimeout(async () => {
  try {
    console.log("[INTEGRATION] Registering cron jobs...");
    registerCronJobs();
    console.log("[INTEGRATION] Cron jobs registered successfully");
  } catch (error) {
    console.error("[INTEGRATION] Failed to register cron jobs:", error);
    // Don't crash the server if cron registration fails
  }
}, 5000); // Wait 5 seconds after server starts to register crons

console.log("[SERVER] About to start listening on port", PORT);

// ------------------------------------------------------
// SERVER START
// ------------------------------------------------------
const server = app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});

// ------------------------------------------------------
// GRACEFUL ERROR HANDLING
// ------------------------------------------------------
process.on("unhandledRejection", async (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  
  // Log for monitoring
  logErrorForSummary(reason as Error);
  
  // Send critical alert
  try {
    await sendAlert(reason as Error, { context: "unhandledRejection" });
  } catch (alertError) {
    console.error("Failed to send alert for unhandled rejection:", alertError);
  }
  
  // Don't crash the server, just log it
});

process.on("uncaughtException", async (error) => {
  console.error("❌ Uncaught Exception:", error);
  
  // Log for monitoring
  logErrorForSummary(error);
  
  // Send critical alert
  try {
    await sendAlert(error, { context: "uncaughtException" });
  } catch (alertError) {
    console.error("Failed to send alert for uncaught exception:", alertError);
  }
  
  // Log but don't crash immediately to allow cleanup
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});
