import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import routes from "./routes/index.js";

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
import inboxAwaitingRouter from "./routes/inboxAwaitingReply.js";
import inboxPriorityRouter from "./routes/inboxPriority.js";
import inboxTrackingRouter from "./routes/inboxTracking.js";
import inboxAnalyticsRouter from "./routes/inboxAnalytics.js";
import inboxPriorityFeedRouter from "./routes/inboxPriorityFeed.js";
import inboxCountersRouter from "./routes/inboxCounters.js";
import inboxThreadRouter from "./routes/inboxThread.js";
import inboxRescanRouter from "./routes/inboxRescan.js";
import unifiedInboxRouter from "./routes/unifiedInbox.js";

// AI
import aiRouter from "./routes/ai.js";

// Authenticity / Risk / Suitability
import authenticityRouter from "./routes/authenticity.js";
import opportunitiesRouter from "./routes/opportunities.js";
import resourcesRouter from "./routes/resources.js";
import riskRouter from "./routes/risk.js";
import suitabilityRouter from "./routes/suitability.js";

// User Approvals
import userApprovalsRouter from "./routes/userApprovals.js";

// Users Management
import usersRouter from "./routes/users.js";
import setupRouter from "./routes/setup.js";

// Exclusive Talent
import exclusiveRouter from "./routes/exclusive.js";

// Creator Onboarding
import creatorRouter from "./routes/creator.js";

// Admin Finance
import adminFinanceRouter from "./routes/admin/finance.js";

// Deals
import dealsRouter from "./routes/deals.js";
import dealTimelineRouter from "./routes/dealTimeline.js";
import dealInsightsRouter from "./routes/dealInsights.js";
import dealPackagesRouter from "./routes/dealPackages.js";

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

// Bundles
import bundlesRouter from "./routes/bundles.js";

// Notifications
import notificationsRouter from "./routes/notifications.js";

// Calendar Intelligence
import calendarIntelligenceRouter from "./routes/calendarIntelligence.js";

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
import { healthCheck } from "./routes/health.js";

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

const app = express();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || process.env.WEB_APP_URL || "http://localhost:5173";

// ------------------------------------------------------
// CORE MIDDLEWARE
// ------------------------------------------------------
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());
app.use(attachUserFromSession);

// Stripe webhook MUST run BEFORE body parsers
app.post("/webhooks/stripe", express.raw({ type: "application/json" }), stripeWebhookHandler);

// JSON parser (after stripe)
app.use(express.json({ limit: "350mb" }));
app.use(express.urlencoded({ extended: true, limit: "350mb" }));

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
app.use("/api/inbox/unified", unifiedInboxRouter);

// ------------------------------------------------------
// GMAIL
// ------------------------------------------------------
app.use("/api/gmail/auth", gmailAuthRouter);
app.use("/api/gmail/analysis", gmailAnalysisRouter);
app.use("/api/gmail/inbox", gmailInboxRouter);

// ------------------------------------------------------
// NOTIFICATIONS & CALENDAR
// ------------------------------------------------------
app.use("/api/notifications", notificationsRouter);
app.use("/api/calendar", calendarIntelligenceRouter);

// ------------------------------------------------------
// OPPORTUNITIES
// ------------------------------------------------------
app.use("/api/opportunities", opportunitiesRouter);

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
// CREATOR ONBOARDING
// ------------------------------------------------------
app.use(creatorRouter); // Routes already prefixed with /api/creator

// ------------------------------------------------------
// USER APPROVALS
// ------------------------------------------------------
app.use("/api/user-approvals", userApprovalsRouter);

// ------------------------------------------------------
// ADMIN FINANCE CONTROL ROOM
// ------------------------------------------------------
app.use("/api/admin/finance", adminFinanceRouter);

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
app.use("/api/deal-packages", dealPackagesRouter);

// ------------------------------------------------------
// CONTRACTS / DELIVERABLES
// ------------------------------------------------------
app.use("/api/contracts", contractRouter);
app.use("/api/deliverables", deliverablesRouter);

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
// HEALTH ENDPOINT
// ------------------------------------------------------
app.get("/health", healthCheck);

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
  
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal server error";
  
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5001;

// Start queue + cron
registerEmailQueueJob();
// registerCronJobs(); // TEMPORARILY DISABLED - was hanging server startup

// ------------------------------------------------------
// SERVER START
// ------------------------------------------------------
const server = app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});

// ------------------------------------------------------
// GRACEFUL ERROR HANDLING
// ------------------------------------------------------
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  // Don't crash the server, just log it
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
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
