// IMPORTANT: Import Sentry instrumentation at the very top, before any other imports
import "./instrument.js";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import * as Sentry from "@sentry/node";

import routes from './routes/index.js';
import activityRouter from './routes/activity.js';
import auditRouter from './routes/audit.js';

// Middleware
import { requestContextMiddleware } from './middleware/requestContext.js';
import { auditMiddleware } from './middleware/audit.js';
import { attachUserFromSession } from './middleware/auth.js';
import { impersonationMiddleware } from './middleware/impersonationMiddleware.js';
import { validateGmailCredentials, requireGmailEnabled } from './middleware/gmailValidation.js';

// Jobs / Cron
import { registerEmailQueueJob } from './jobs/emailQueue.js';
import { registerCronJobs } from './cron/index.js';
import { initializeScheduledExports } from './services/scheduledExportService.js';
import { safeAsync } from './utils/safeAsync.js';

// Webhooks
import { stripeWebhookHandler, instagramWebhookVerification, instagramWebhookEventHandler } from './routes/webhooks.js';
import signatureWebhookRouter from './routes/signatureWebhooks.js';
import { metaWebhookVerificationHandler } from './routes/metaWebhook.js';

// Core Routers
import paymentsRouter from './routes/payments.js';
import filesRouter from './routes/files.js';

// Gmail & Inbox
import gmailAuthRouter from './routes/gmailAuth.js';
import gmailAnalysisRouter from './routes/gmailAnalysis.js';
import gmailInboxRouter from './routes/gmailInbox.js';
import gmailMessagesRouter from './routes/gmailMessages.js';
import gmailWebhookRouter from './routes/gmailWebhook.js';
import gmailHealthRouter from './routes/gmailHealth.js';
import messagingRouter from './routes/messaging.js';
import cronRouter from './routes/cron.js';
import inboxAwaitingRouter from './routes/inboxAwaitingReply.js';
import inboxPriorityRouter from './routes/inboxPriority.js';
import inboxTrackingRouter from './routes/inboxTracking.js';
import inboxClickTrackingRouter from './routes/inboxClickTracking.js';
import inboxAnalyticsRouter from './routes/inboxAnalytics.js';
import inboxPriorityFeedRouter from './routes/inboxPriorityFeed.js';
import inboxCountersRouter from './routes/inboxCounters.js';
import inboxThreadRouter from './routes/inboxThread.js';
import inboxRescanRouter from './routes/inboxRescan.js';
import inboxCategoriesRouter from './routes/inboxCategories.js';
import unifiedInboxRouter from './routes/unifiedInbox.js';
import emailOpportunitiesRouter from './routes/emailOpportunities.js';

// Platform Inboxes (V1.1)
import instagramInboxRouter from './routes/instagramInbox.js';
import tiktokInboxRouter from './routes/tiktokInbox.js';
import whatsappInboxRouter from './routes/whatsappInbox.js';

// AI
import aiRouter from './routes/ai.js';

// Brand Campaigns
import campaignsRouter from './routes/campaigns.js';

// Authenticity / Risk / Suitability
import authenticityRouter from './routes/authenticity.js';
import opportunitiesRouter from './routes/opportunities.js';
import submissionsRouter from './routes/submissions.js';
import resourcesRouter from './routes/resources.js';
import riskRouter from './routes/risk.js';
import suitabilityRouter from './routes/suitability.js';

// Auth
import authRouter from './routes/auth.js';

// Dev Auth (development only)
import devAuthRouter from './routes/devAuth.js';

// User Approvals
import userApprovalsRouter from './routes/userApprovals.js';
import approvalsRouter from './routes/approvals.js';

// Queues
import queuesRouter from './routes/queues.js';

// Users Management
import usersRouter from './routes/users.js';
import setupRouter from './routes/setup.js';
import impersonateRouter from './routes/impersonate.js';

// Exclusive Talent
import exclusiveRouter from './routes/exclusive.js';
import dashboardExclusiveTalentRouter from './routes/dashboardExclusiveTalent.js';

// Creator Onboarding
import creatorRouter from './routes/creator.js';

// Brand Onboarding
import brandOnboardingRouter from './routes/brandOnboarding.js';

// Analytics
import analyticsRouter from './routes/analytics.js';

// Revenue
import revenueRouter from './routes/revenue.js';

// Dashboard Customization
import dashboardCustomizationRouter from './routes/dashboardCustomization.js';

// Brands (V1.0 - First-class user type)
import brandsRouter from './routes/brands.js';
import brandTeamRouter from './routes/brandTeam.js';
import brandAuditRouter from './routes/brandAudit.js';

// Community Management (Talent)
import communityRouter from './routes/community.js';

// Admin Finance
import adminFinanceRouter from './routes/admin/finance.js';

// Admin Talent
import adminTalentRouter from './routes/admin/talent.js';
import adminTalentSettingsRouter from './routes/admin/talentSettings.js';
import talentAccessRouter from './routes/talentAccess.js';
import talentCalendarRouter from './routes/talentCalendar.js';
import meetingsRouter from './routes/admin/meetings.js';
import calendarRouter from './routes/admin/calendar.js';
import intelligenceRouter from './routes/admin/intelligence.js';

// Admin Deals
import adminDealsRouter from './routes/admin/deals.js';

// Admin Duplicates
import adminDuplicatesRouter from './routes/admin/duplicates.js';

// Admin Diagnostics
import adminDiagnosticsRouter from './routes/admin/diagnostics.js';

// Admin Analytics (Global analytics command centre)
import adminAnalyticsRouter from './routes/admin/analytics.js';

// CMS: Block-Based Content Management
import contentRouter from './routes/content.js';
import { ensureCmsPagesExist } from './lib/cmsSeeder.js';

// Admin Users
import adminUsersRouter from './routes/adminUsers.js';

// Creator Goals & Wellness
import creatorGoalsRouter from './routes/creatorGoals.js';
import wellnessCheckinsRouter from './routes/wellnessCheckins.js';

// Growth Initiatives
import growthInitiativesRouter from './routes/growthInitiatives.js';

// Deals
import dealsRouter from './routes/deals.js';
import dealTimelineRouter from './routes/dealTimeline.js';
import dealInsightsRouter from './routes/dealInsights.js';
import dealIntelligenceRouter from './routes/dealIntelligence.js';
import dealManagementRouter from './routes/dealManagement.js';
import dealExtractionRouter from './routes/dealExtraction.js';
// dealPackagesRouter removed - deal packages schema models were removed

// Deliverables / Contracts
import deliverablesRouter from './routes/deliverables.js';
import contractRouter from './routes/contracts.js';

// Campaigns
import campaignBuilderRouter from './routes/campaignBuilder.js';
import campaignAutoRouter from './routes/campaignAuto.js';
import campaignAutoDebugRouter from './routes/campaignAutoDebug.js';
import campaignAutoPreviewRouter from './routes/campaignAutoPreview.js';
import briefsRouter from './routes/briefs.js';

// Brand CRM / Strategy
import brandCRMRouter from './routes/brandCRM.js';
import strategyRouter from './routes/strategy.js';
import creatorFitRouter from './routes/creatorFit.js';
import rosterRouter from './routes/roster.js';

// CRM: Brands, Contacts, Outreach, Campaigns, Events & Deals
import crmBrandsRouter from './routes/crmBrands.js';
import crmContactsRouter from './routes/crmContacts.js';
import outreachRecordsRouter from './routes/outreachRecords.js';
import crmCampaignsRouter from './routes/crmCampaigns.js';
import crmEventsRouter from './routes/crmEvents.js';
import crmDealsRouter from './routes/crmDeals.js';
import crmContractsRouter from './routes/crmContracts.js';
import crmTasksRouter from './routes/crmTasks.js';
import unifiedTasksRouter from './routes/unifiedTasks.js';
// DISABLED: Enrichment feature not production-ready (see ENRICHMENT_AUDIT_START_HERE.md)
// import enrichmentRouter from './routes/enrichment.js';

// Bundles
import bundlesRouter from './routes/bundles.js';

// Notifications
import notificationsRouter from './routes/notifications.js';

// Calendar Intelligence
import calendarIntelligenceRouter from './routes/calendarIntelligence.js';

// Integrations (V1.1)
import integrationsRouter from './routes/integrations.js';

// Outreach System
import outreachRouter from './routes/outreach.js';
import outreachLeadsRouter from './routes/outreachLeads.js';
import outreachSequencesRouter from './routes/outreachSequences.js';
import outreachTemplatesRouter from './routes/outreachTemplates.js';
import outreachMetricsRouter from './routes/outreachMetrics.js';
import salesOpportunitiesRouter from './routes/salesOpportunities.js';

// Agent
import agentRouter from './routes/agent.js';

// Threads
import threadRouter from './routes/threads.js';

// Insights
import insightsRouter from './routes/insights.js';

// Health
import { healthCheck, detailedHealthCheck, cronStatusCheck } from './routes/health.js';

// Monitoring utilities
import { normalizeError } from './utils/errorNormalizer.js';
import { sendAlert, logErrorForSummary } from './utils/alerting.js';

// Performance monitoring
import { initializeSlowQueryLogging, requestDurationMiddleware, startMemoryTracking } from './utils/slowQueryDetection.js';
import prisma from './db/client.js';

// Performance dashboard
import performanceRouter from './routes/admin/performance.js';

// Load .env only in non-production environments (development/staging)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// CRITICAL: Database environment validation MUST RUN IMMEDIATELY
// This prevents accidental use of wrong database in any environment
import { validateDatabaseEnvironment, logDatabaseOperation } from './lib/dbGuards.js';

try {
  validateDatabaseEnvironment();
  logDatabaseOperation({
    operation: 'SERVER_STARTUP',
    environment: process.env.NODE_ENV || 'development',
    status: 'STARTED',
    additionalInfo: {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
    },
  });
} catch (dbError) {
  console.error('❌ FATAL: Database environment validation failed');
  console.error(dbError);
  process.exit(1);
}

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
console.log(">>> WEBHOOK_VERIFY_TOKEN =", process.env.WEBHOOK_VERIFY_TOKEN ? `${process.env.WEBHOOK_VERIFY_TOKEN.slice(0, 4)}****` : "[MISSING]");
console.log(">>> GCS_PROJECT_ID =", process.env.GCS_PROJECT_ID || "break-agency-storage (default)");
console.log(">>> GCS_BUCKET_NAME =", process.env.GCS_BUCKET_NAME || "break-agency-app-storage (default)");
console.log(">>> GOOGLE_CLOUD_PROJECT =", process.env.GOOGLE_CLOUD_PROJECT || "[using GCS_PROJECT_ID]");
console.log(">>> GOOGLE_WORKLOAD_IDENTITY_PROVIDER =", process.env.GOOGLE_WORKLOAD_IDENTITY_PROVIDER ? "[SET]" : "[NOT SET]");
console.log(">>> GOOGLE_SERVICE_ACCOUNT_EMAIL =", process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? "[SET]" : "[NOT SET]");
console.log(">>> OIDC_TOKEN (Railway) =", process.env.OIDC_TOKEN ? "[SET]" : "[NOT SET]");
console.log(">>> DATABASE_MIGRATION_CHECK - Prisma Client Ready with All Schema Updates");

// ------------------------------------------------------
// VALIDATE PRODUCTION CREDENTIALS
// ------------------------------------------------------
import { validateProductionCredentials } from './lib/env.js';

// ------------------------------------------------------
// VALIDATE META WEBHOOK VERIFY TOKEN
// ------------------------------------------------------
if (!process.env.WEBHOOK_VERIFY_TOKEN) {
  console.warn("\n⚠️  WARNING: WEBHOOK_VERIFY_TOKEN environment variable is not set");
  console.warn("   Meta webhook verification will fail until this is configured");
  console.warn("   Set WEBHOOK_VERIFY_TOKEN in your environment variables");
} else {
  console.log("✅ WEBHOOK_VERIFY_TOKEN is configured");
}

// ------------------------------------------------------
// VALIDATE GOOGLE CLOUD STORAGE CONFIGURATION
// ------------------------------------------------------
import { validateGCSConfig, getAuthMethod } from './services/storage/googleCloudStorage.js';

const gcsValidation = validateGCSConfig();
if (!gcsValidation.valid) {
  console.warn("\n⚠️  WARNING: GCS CONFIGURATION INCOMPLETE:");
  gcsValidation.errors.forEach(err => console.warn(`   ❌ ${err}`));
  gcsValidation.warnings.forEach(warn => console.warn(`   ⚠️  ${warn}`));
  console.warn("   File uploads will fail until GCS is configured");
  console.warn("   For Workload Identity Federation setup:");
  console.warn("     1. Create Identity Pool & Provider in Google Cloud");
  console.warn("     2. Set GOOGLE_WORKLOAD_IDENTITY_PROVIDER environment variable");
  console.warn("     3. Set GOOGLE_SERVICE_ACCOUNT_EMAIL environment variable");
  console.warn("     4. Configure IAM binding between service account and OIDC provider");
  console.warn("     5. Enable OIDC in Railway environment");
  console.warn("   Server will continue to run, but file operations will error");
} else {
  console.log("✅ GCS configuration validated");
  console.log(`   Auth method: ${getAuthMethod()}`);
  if (gcsValidation.warnings.length > 0) {
    console.warn("   Warnings:");
    gcsValidation.warnings.forEach(warn => console.warn(`     ⚠️  ${warn}`));
  }
}

// Validate and initialize Gmail credentials
// If invalid, Gmail integration will be disabled gracefully (returns 503 on /api/gmail requests)
// This prevents platform outage due to credential issues
validateGmailCredentials();

console.log("[SERVER] Initializing Express app...");
const app = express();

// Webhook verification endpoint (temporary)
// Used for Instagram/Meta webhook verification while DNS is configured
app.get("/__meta_test__", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  
  const VERIFY_TOKEN = (process.env.INSTAGRAM_VERIFY_TOKEN || "").trim();
  
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).type("text/plain").send(challenge);
  }
  
  return res.sendStatus(403);
});

// ========================================================
// COMPREHENSIVE BOOT LOGGING
// ========================================================
console.log("\n" + "=".repeat(60));
console.log("SERVER BOOT ENVIRONMENT");
console.log("=".repeat(60));
console.log({
  NODE_ENV: process.env.NODE_ENV || "development",
  hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
  hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
  hasGoogleRedirectUri: !!process.env.GOOGLE_REDIRECT_URI,
  hasFrontendOrigin: !!process.env.FRONTEND_ORIGIN,
  hasWebAppUrl: !!process.env.WEB_APP_URL,
  hasWebhookToken: !!process.env.WEBHOOK_VERIFY_TOKEN,
  hasDatabase: !!process.env.DATABASE_URL,
  loadedFromDotenv: process.env.NODE_ENV !== 'production',
  timestamp: new Date().toISOString()
});
console.log("=".repeat(60) + "\n");

// Add Sentry request handler (must be first middleware)
// Note: setupExpressErrorHandler sets up both request and error handlers
// But we need to call it after routes are defined, so we'll set it up later
// For now, we use the request handler middleware
const sentryDsn = process.env.SENTRY_DSN;

// CRITICAL: Combine FRONTEND_ORIGIN and WEB_APP_URL to support both
// Railway has FRONTEND_ORIGIN set to Vercel preview URL
// WEB_APP_URL has the actual production custom domains
const frontendOriginRaw = process.env.FRONTEND_ORIGIN || "";
const webAppUrlRaw = process.env.WEB_APP_URL || "";
const defaultOrigins = "https://www.tbctbctbc.online,http://localhost:5173,http://localhost:3000";

// Combine all origins from both env vars plus defaults
const combinedOrigins = [frontendOriginRaw, webAppUrlRaw, defaultOrigins]
  .filter(Boolean)
  .join(',');

const allowedOrigins = combinedOrigins
  .split(',')
  .map(o => o.trim())
  .filter(Boolean) // Remove empty strings
  .filter((v, i, arr) => arr.indexOf(v) === i); // Remove duplicates

// Validate each origin is a valid URL
const invalidOrigins: string[] = [];
allowedOrigins.forEach((origin, index) => {
  try {
    new URL(origin);
  } catch (error) {
    console.warn(`\n⚠️  INVALID FRONTEND_ORIGIN[${index}]: "${origin}"`);
    console.warn(`   Each comma-separated origin must be a valid URL (e.g., https://domain.com)`);
    console.warn(`   This origin will be skipped`);
    invalidOrigins.push(origin);
  }
});

// Remove invalid origins
const validOrigins = allowedOrigins.filter(o => !invalidOrigins.includes(o));

// Warn if all origins are invalid
if (validOrigins.length === 0) {
  console.warn("\n⚠️  WARNING: No valid FRONTEND_ORIGIN found. CORS disabled for safety.");
  console.warn("   Set FRONTEND_ORIGIN or WEB_APP_URL to valid HTTPS URLs");
  console.warn("   Example: FRONTEND_ORIGIN=https://app.yourdomain.com");
}

console.log("✅ FRONTEND_ORIGIN validation complete:");
if (validOrigins.length > 0) {
  validOrigins.forEach((origin, i) => {
    console.log(`   [${i}] "${origin}"`);
  });
  console.log(`   Total: ${validOrigins.length} valid origins`);
} else {
  console.log("   (No valid origins - CORS will be restricted)");
}

// Use validOrigins instead of allowedOrigins
const finalAllowedOrigins = validOrigins;

// ------------------------------------------------------
// CORE MIDDLEWARE
// ------------------------------------------------------

// Initialize performance monitoring
console.log("[MONITORING] Initializing performance monitoring...");
initializeSlowQueryLogging(prisma);
startMemoryTracking(60000); // Sample every 60 seconds
console.log("[MONITORING] Performance monitoring initialized");

console.log("[SERVER] Setting up core middleware...");
// CORS Configuration - MUST be first middleware
// Use custom origin function with explicit logging
app.use(cors({
  origin: (origin, callback) => {
    console.log(`[CORS] Incoming origin: "${origin}"`);
    console.log(`[CORS] Allowed origins:`, finalAllowedOrigins);
    
    // Allow requests with no origin (server-to-server, Postman, etc.)
    if (!origin) {
      console.log("[CORS] No origin header - allowing");
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (finalAllowedOrigins.includes(origin)) {
      console.log(`[CORS] Origin "${origin}" is ALLOWED`);
      return callback(null, true);
    }
    
    // Allow Vercel preview URLs (dynamic per deployment)
    // Pattern: https://break-agency-*.vercel.app or https://*.vercel.app
    if (origin.includes('.vercel.app')) {
      console.log(`[CORS] Origin "${origin}" is ALLOWED (Vercel preview)`);
      return callback(null, true);
    }
    
    // Origin not allowed
    console.warn(`[CORS] Origin "${origin}" is BLOCKED`);
    console.warn(`[CORS] Allowed origins are:`, finalAllowedOrigins);
    return callback(null, false); // Don't throw error, just don't add CORS headers
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS", "PUT"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Set-Cookie"],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Helmet AFTER CORS to avoid interference
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://fonts.cdnfonts.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://fonts.cdnfonts.com"],
      connectSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      workerSrc: ["'self'", "blob:"], // CRITICAL: Allow blob workers for Sentry/similar
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  }
}));
app.use(morgan("dev"));
app.use(cookieParser());

// Request duration tracking (must be early in middleware chain)
app.use(requestDurationMiddleware);

app.use(attachUserFromSession);

// PHASE 2: Impersonation middleware (must come after attachUserFromSession)
// Detects and validates impersonation claims in JWT
app.use(impersonationMiddleware);

// PRODUCTION SAFETY GUARDS (Phase 2B)
// These middleware provide production safety for impersonation:
// 1. Write blocking - only GET/HEAD/OPTIONS allowed while impersonating
// 2. Audit logging - log all impersonation requests
import { impersonationWriteBlocker, impersonationAuditLog } from './middleware/impersonationGuards.js';
app.use(impersonationWriteBlocker);
app.use(impersonationAuditLog);

// Stripe webhook MUST run BEFORE body parsers
app.post("/webhooks/stripe", express.raw({ type: "application/json" }), stripeWebhookHandler);

// Meta (Instagram) webhook verification - PUBLIC, no auth required
// This is a GET endpoint for Meta's verification challenge only
app.get("/api/webhooks/meta", metaWebhookVerificationHandler);

// Instagram webhooks - PUBLIC, no auth required
// GET: Verification endpoint for Instagram callback URL setup
app.get("/webhooks/instagram", instagramWebhookVerification);

// POST: Event receiver for Instagram messages and interactions
app.post("/webhooks/instagram", express.json(), instagramWebhookEventHandler);

// JSON parser (after stripe)
app.use(express.json({ limit: "350mb" }));
app.use(express.urlencoded({ extended: true, limit: "350mb" }));

// ------------------------------------------------------
// PUBLIC DEBUG ENDPOINT (BEFORE AUTH)
// ------------------------------------------------------
app.get("/api/cors-debug", (_req, res) => {
  return res.json({
    allowedOrigins: finalAllowedOrigins,
    env: {
      FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || "(not set)",
      WEB_APP_URL: process.env.WEB_APP_URL || "(not set)",
      NODE_ENV: process.env.NODE_ENV
    }
  });
});

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
console.log("[SERVER] Registering auth routes...");
app.use("/api/auth", authRouter);

// ------------------------------------------------------
// MESSAGING ROUTES (multi-inbox management)
// ------------------------------------------------------
console.log("[SERVER] Registering messaging routes...");
app.use("/api/messaging", messagingRouter);

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
// PLATFORM INBOXES (V1.1)
// ------------------------------------------------------
app.use("/api/instagram-inbox", instagramInboxRouter);
app.use("/api/tiktok-inbox", tiktokInboxRouter);
app.use("/api/whatsapp-inbox", whatsappInboxRouter);

// ------------------------------------------------------
// GMAIL
// IMPORTANT: Gmail requires valid OAuth credentials to function
// If credentials are missing or placeholder values, routes return 503
// ------------------------------------------------------
// Health check endpoint (always available, doesn't require auth)
app.use("/api/gmail", gmailHealthRouter);

// Validate Gmail credentials at server startup (before routes are registered)
validateGmailCredentials();

// Register Gmail auth routes BEFORE applying Gmail validation middleware
// Users must be able to get auth URL even if credentials are missing (they're about to connect!)
app.use("/api/gmail/auth", gmailAuthRouter);

// Apply Gmail validation middleware to all OTHER Gmail routes
// This prevents data access but allows users to START the connection process
app.use("/api/gmail/analysis", gmailAnalysisRouter);
app.use("/api/gmail/inbox", gmailInboxRouter);
app.use("/api/gmail/webhook", gmailWebhookRouter);
app.use("/api/gmail", requireGmailEnabled);
app.use("/api/gmail", gmailMessagesRouter);
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
app.use("/api/intelligence", intelligenceRouter); // AI Intelligence features (reminders, agendas, briefs, overload detection, availability)

// ------------------------------------------------------
// INTEGRATIONS (V1.1)
// ------------------------------------------------------
app.use("/api/integrations", integrationsRouter);

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
// DASHBOARD CUSTOMIZATION
// ------------------------------------------------------
app.use("/api/dashboard", dashboardCustomizationRouter);

// BRANDS (V1.0 - First-class user type)
// ------------------------------------------------------
app.use("/api/brands", brandsRouter);
app.use("/api/brands/onboarding", brandOnboardingRouter);
app.use("/api/brand-team", brandTeamRouter);
app.use("/api/brand-audit", brandAuditRouter);

// COMMUNITY MANAGEMENT (Talent)
// ------------------------------------------------------
app.use("/api/community", communityRouter);

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

// ADMIN TALENT MANAGEMENT
// ------------------------------------------------------
app.use("/api/admin/talent", adminTalentRouter);
app.use("/api/admin/talent/:id/settings", adminTalentSettingsRouter);
app.use("/api/talent", talentAccessRouter);
app.use("/api/talent", meetingsRouter);
app.use("/api/talent", talentCalendarRouter);
app.use("/api/admin/dashboard", dashboardExclusiveTalentRouter);
app.use("/api/admin/deals", adminDealsRouter);
app.use("/api/admin/duplicates", adminDuplicatesRouter);
app.use("/api/admin/diagnostics", adminDiagnosticsRouter);
app.use("/api/admin/analytics", adminAnalyticsRouter);

// Growth Initiatives (Strategic growth tracking)
app.use("/api/growth-initiatives", growthInitiativesRouter);

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
app.use("/api/deals", dealManagementRouter); // Deal management (documents, emails, notes, activity)
app.use("/api/deals", dealsRouter); // Core deal routes
app.use("/api/deals/extract", dealExtractionRouter); // Deal extraction from emails
app.use("/api/deal-timeline", dealTimelineRouter);
app.use("/api/deal-insights", dealInsightsRouter);
app.use("/api/deals/intelligence", dealIntelligenceRouter);
// /api/deal-packages route removed - deal packages feature was removed from schema

// ------------------------------------------------------
// CONTRACTS / DELIVERABLES
// ------------------------------------------------------
app.use("/api/contracts", contractRouter);
app.use("/api/deliverables", deliverablesRouter);

// New contract and deliverable workflow (manual-first, with templates and file upload)
import deliverablesV2Router from './routes/deliverables-v2.js';

// Phase 5: Global Search
import searchRouter from './routes/search.js';
app.use("/api/deliverables-v2", deliverablesV2Router);
app.use("/api/search", searchRouter);

// ------------------------------------------------------
// CAMPAIGNS
// ------------------------------------------------------
app.use("/api/campaigns", campaignsRouter);
app.use("/api/campaign/builder", campaignBuilderRouter);
app.use("/api/campaign/auto-plan", campaignAutoRouter);
app.use("/api/campaign/auto-plan/debug", campaignAutoDebugRouter);
app.use("/api/campaign/auto-plan/preview", campaignAutoPreviewRouter);
// Phase 5: Briefs API re-enabled with full implementation
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
app.use("/api/tasks", unifiedTasksRouter); // Unified task queries across all models (TalentTask, CreatorTask, CrmTask, OutreachTask)
// DISABLED: Enrichment feature not production-ready (see ENRICHMENT_AUDIT_START_HERE.md)
// app.use("/api/enrichment", enrichmentRouter);
app.use("/api/notifications", notificationsRouter);

// CMS: Block-Based Content Management
app.use("/api/content", contentRouter);

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

// IMPERSONATION (View As)
// ------------------------------------------------------
app.use("/api/admin/impersonate", impersonateRouter);

// ------------------------------------------------------
// GLOBAL MIDDLEWARE (AFTER ROUTING)
// ------------------------------------------------------
app.use(requestContextMiddleware);
app.use(auditMiddleware);

// ------------------------------------------------------
// STATIC FILES
// ------------------------------------------------------
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

// Serve web app static assets in production
const webDistPath = path.resolve(process.cwd(), "../web/dist");
const webIndexPath = path.join(webDistPath, "index.html");

// Only serve static web app if it exists (built in Railway/production)
try {
  const fs = require("fs");
  if (fs.existsSync(webDistPath)) {
    console.log(`[WEB] Serving static web app from ${webDistPath}`);
    
    // Serve static assets with cache headers
    app.use(express.static(webDistPath, {
      maxAge: "1d",
      etag: false,
      cacheControl: true
    }));
    
    // SPA routing: serve index.html for all non-API routes
    app.get("*", (req, res) => {
      // Don't serve index.html for API routes
      if (req.path.startsWith("/api") || req.path.startsWith("/webhooks") || req.path.startsWith("/health")) {
        return res.status(404).json({ error: "Not found" });
      }
      
      if (fs.existsSync(webIndexPath)) {
        res.sendFile(webIndexPath);
      } else {
        res.status(404).json({ error: "Web app not found" });
      }
    });
  } else {
    console.log("[WEB] Web app not found at", webDistPath, "- API mode only");
  }
} catch (err) {
  console.warn("[WEB] Could not set up web static serving:", err instanceof Error ? err.message : err);
}

// ------------------------------------------------------
// BASE ROUTE
// ------------------------------------------------------
app.get("/", (_req, res) => {
  return res.json({ status: "ok", message: "Break Agency API is running" });
});

// ------------------------------------------------------
// SENTRY DEBUG ENDPOINT (for testing)
// ------------------------------------------------------
app.get("/debug-sentry", function mainHandler(_req, res) {
  throw new Error("My first Sentry error!");
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
// SENTRY ERROR HANDLER (before custom error handler)
// The error handler must be registered before any other error middleware and after all controllers
// ------------------------------------------------------
if (sentryDsn) {
  Sentry.setupExpressErrorHandler(app);
}

// Helper to extract feature name from route for Sentry tagging
function getFeatureFromRoute(path: string): string {
  if (path.includes("/admin/talent")) return "talent";
  if (path.includes("/admin/campaigns")) return "campaigns";
  if (path.includes("/admin/messaging") || path.includes("/gmail")) return "messaging";
  if (path.includes("/admin/inbox")) return "gmail";
  if (path.includes("/opportunities")) return "opportunities";
  if (path.includes("/deals")) return "deals";
  if (path.includes("/finance") || path.includes("/revenue")) return "finance";
  if (path.includes("/auth")) return "auth";
  return "other";
}

// ------------------------------------------------------
// GLOBAL ERROR HANDLER (must be last)
// ------------------------------------------------------
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("❌ Global error handler caught:", err);
  
  // Don't send response if headers already sent
  if (res.headersSent) {
    return next(err);
  }
  
  // Capture error in Sentry with context
  if (sentryDsn) {
    Sentry.withScope((scope) => {
      // Add request context
      scope.setTag("route", req.path);
      scope.setTag("method", req.method);
      scope.setTag("feature", getFeatureFromRoute(req.path));
      
      // Add user context if available
      if ((req as any).user) {
        scope.setUser({
          id: (req as any).user.id,
          role: (req as any).user.role,
        });
        scope.setTag("role", (req as any).user.role || "unknown");
      }
      
      // Add request data
      scope.setContext("request", {
        url: req.url,
        method: req.method,
        headers: {
          "user-agent": req.headers["user-agent"],
          "referer": req.headers.referer,
        },
      });
      
      Sentry.captureException(err);
    });
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
  
  return res.status(statusCode).json({
    error: normalized.userMessage,
    ...(process.env.NODE_ENV === "development" && { 
      technicalError: normalized.message,
      stack: err.stack 
    })
  });
});

const PORT = process.env.PORT || 5001;

console.log("[SERVER] About to call registerEmailQueueJob()...");
// Start queue + cron
registerEmailQueueJob();
console.log("[SERVER] registerEmailQueueJob() complete");

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
const server = app.listen(PORT, async () => {
  console.log(`API running on port ${PORT}`);
  
  // Fire-and-forget initializations (non-blocking)
  safeAsync("CMS Pages", ensureCmsPagesExist);
  safeAsync("Scheduled Exports", initializeScheduledExports);
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
