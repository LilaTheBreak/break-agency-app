import { Prisma, type User } from "@prisma/client";
import { Router, Request, Response } from "express";
import prisma from "../lib/prisma.js";

// Feature routers
import socialRouter from "./social.js";
import emailRouter from "./email.js";
import systemRouter from "./system.js";
import auditRouter from "./audit.js";
import adminActivityRouter from "./adminActivity.js";
import payoutsRouter from "./payouts.js";
import dashboardRouter from "./dashboard.js";
import dashboardRevenueRouter from "./dashboardRevenue.js";
import dashboardCampaignPacingRouter from "./dashboardCampaignPacing.js";
import dashboardExclusiveTalentRouter from "./dashboardExclusiveTalent.js";
import messagesRouter from "./messages.js";
import filesRouter from "./files.js";
import contractsRouter from "./contracts.js";
import briefsRouter from "./briefs.js";
import aiRouter from "./ai.js";
import aiFileInsightsRouter from "./aiFileInsights.js";
import aiSocialInsightsRouter from "./aiSocialInsights.js";
import aiDealExtractorRouter from "./aiDealExtractor.js";
import documentExtractionRouter from "./documentExtraction.js";
import campaignsRouter from "./campaigns.js";
import deckRouter from "./deck.js";
import queuesRouter from "./queues.js";
import talentAccessRouter from "./talentAccess.js";
import opportunitiesRouter from "./opportunities.js";

// Enterprise Operating System routes
import enterpriseValueRouter from "./enterpriseValue.js";
import revenueClassificationRouter from "./revenueClassification.js";
import founderDependencyRouter from "./founderDependency.js";
import ownedAssetsRouter from "./ownedAssets.js";
import exitReadinessRouter from "./exitReadiness.js";

// User management & onboarding
// NOTE: authRouter is mounted in server.ts at /api/auth, not here
import onboardingRouter from './onboarding.js';
import adminUsersRouter from './adminUsers.js';
import talentRouter from './talent.js';
import brandRouter from './brand.js';
import brandsRouter from './brands.js';

// Social OAuth routes
import instagramAuthRouter from './auth/instagram.js';
import tiktokAuthRouter from './auth/tiktok.js';
// TODO: Convert youtube auth to ES6 module
// const youtubeAuthRouter = require("./auth/youtube");
import socialAnalyticsRouter from './analytics/socials.js';

// Meetings & calendar
import meetingsRouter from './admin/meetings.js';
import { router as outreachRouter } from './admin/outreach.js';
import adminReportsRouter from './admin/reports.js';

// Assisted Outreach (Premium feature)
import assistedOutreachRouter from './assistedOutreach.js';

// ❗ You referenced these in your router but did not import them
// import agentRouter from './agent.js';
// import brandCRMRouter from './brandCRM.js';

import { logAuditEvent } from '../lib/auditLogger.js';
import { logAdminActivity } from '../lib/adminActivityLogger.js';

import { requireAuth } from '../middleware/auth.js';
// import {
//   requireRole,
//   requireSuperAdmin,
//   requireAdmin,
//   requireAgent,
//   requireBrand,
//   requireTalent,
// } from '../middleware/requireRole.js';

const router = Router();

/* -------------------------------------------------------
   PUBLIC ROUTES
-------------------------------------------------------- */
// Health check moved to /health (not /api/health) - see server.ts
// router.get("/health", (_req: Request, res: Response) => {
//   res.json({ status: "ok" });
// });

// NOTE: Auth routes are mounted in server.ts at /api/auth
// Do NOT mount authRouter here to avoid duplicate routes

/* -------------------------------------------------------
   AUTH REQUIRED FOR EVERYTHING BELOW
-------------------------------------------------------- */
router.use(requireAuth);

// Onboarding is the first step after auth
router.use(onboardingRouter);

/* -------------------------------------------------------
   ROLE-BASED ROUTES
-------------------------------------------------------- */

// SUPER ADMIN ONLY
// router.use("/system", requireSuperAdmin, systemRouter);

// ADMIN + SUPER ADMIN
// router.use("/admin", requireAdmin, adminUsersRouter);

// AGENT + ADMIN + SUPER ADMIN
// router.use("/agent", requireAgent, agentRouter);

// BRAND users only
// router.use("/brand", requireBrand, brandCRMRouter);

// TALENT roles
// router.use("/talent", requireTalent, messagesRouter); // or a dedicated talent router

/* -------------------------------------------------------
   GENERAL AUTHENTICATED ROUTES (no RBAC restrictions)
-------------------------------------------------------- */
router.use(socialRouter);
router.use(emailRouter);
router.use(auditRouter);
router.use(adminActivityRouter);
router.use(payoutsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/dashboard", dashboardRevenueRouter);
router.use("/dashboard", dashboardCampaignPacingRouter);
router.use("/dashboard", dashboardExclusiveTalentRouter);
router.use("/queues", queuesRouter);
router.use("/talent", talentAccessRouter);
router.use("/talent", talentRouter);
router.use(messagesRouter);
router.use(filesRouter);
router.use(contractsRouter);
router.use(briefsRouter);
router.use(aiRouter);
router.use(aiFileInsightsRouter);
router.use(aiSocialInsightsRouter);
router.use("/ai", aiDealExtractorRouter);
router.use(documentExtractionRouter);
router.use(campaignsRouter);
router.use("/deck", deckRouter);
router.use("/opportunities", opportunitiesRouter);
router.use("/admin", adminUsersRouter);
router.use("/brand", brandRouter);
router.use("/brands", brandsRouter);

// Enterprise Operating System routes
router.use("/enterprise-value", enterpriseValueRouter);
router.use("/revenue-classification", revenueClassificationRouter);
router.use("/founder-dependency", founderDependencyRouter);
router.use("/owned-assets", ownedAssetsRouter);
router.use("/exit-readiness", exitReadinessRouter);

// Social media OAuth and analytics
router.use("/auth/instagram", instagramAuthRouter);
router.use("/auth/tiktok", tiktokAuthRouter);
// TODO: Restore YouTube auth when converted to ES6
// router.use("/auth/youtube", youtubeAuthRouter);
router.use("/analytics/socials", socialAnalyticsRouter);

// Meetings & calendar
router.use("/meetings", meetingsRouter);
router.use(meetingsRouter); // Also mount without prefix for /api/talent/:talentId/meetings
router.use("/outreach", outreachRouter);
router.use(outreachRouter); // Also mount without prefix for convenience
router.use("/assisted-outreach", assistedOutreachRouter);
router.use("/admin/campaigns/:campaignId/report", adminReportsRouter);

/* -------------------------------------------------------
   PROFILE ROUTES (authenticated)
-------------------------------------------------------- */

router.get("/profiles/:email", async (req: Request, res: Response) => {
  const email = (req.params.email || "").toLowerCase();
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.json({ profile: createDefaultProfile(email) });
    }
    return res.json({ profile: formatProfile(user) });
  } catch (error) {
    console.error("Error fetching profile", error);
    return res.status(500).json({ error: "Failed to load profile" });
  }
});

router.put("/profiles/:email", async (req: Request, res: Response) => {
  const email = (req.params.email || "").toLowerCase();
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  try {
    const payload = req.body as ProfileRequestBody;
    const links = normalizeLinks(payload.links);

    const data = {
      name: payload.name ?? null,
      location: payload.location ?? null,
      timezone: payload.timezone ?? null,
      pronouns: payload.pronouns ?? null,
      accountType: payload.accountType ?? payload.status ?? null,
      status: payload.status ?? payload.accountType ?? null,
      bio: payload.bio ?? null,
      socialLinks: links.length ? links : null,
    };

    const user = await prisma.user.upsert({
      where: { email },
      create: {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        password: null,
        name: data.name,
        location: data.location,
        timezone: data.timezone,
        pronouns: data.pronouns,
        accountType: data.accountType,
        status: data.status,
        bio: data.bio,
        socialLinks: data.socialLinks || undefined,
        updatedAt: new Date(),
      },
      update: {
        ...data,
        socialLinks: data.socialLinks || undefined,
      },
    });

    const profile = formatProfile(user);
    await logAuditEvent(req, {
      action: "profile.update",
      entityType: "user",
      entityId: user.id,
      metadata: profile as any,
    });
    await logAdminActivity(req, {
      event: "admin.profile.update",
      metadata: { userId: user.id, email } as any,
    });

    return res.json({ profile });
  } catch (error) {
    console.error("Error saving profile", error);
    return res.status(500).json({ error: "Failed to save profile" });
  }
});

export default router;

/* -------------------------------------------------------
   Helpers
-------------------------------------------------------- */

type ProfileRequestBody = {
  name?: string;
  location?: string;
  timezone?: string;
  pronouns?: string;
  accountType?: string;
  status?: string;
  bio?: string;
  links?: Array<{ label?: string; url?: string }>;
};

function normalizeLinks(links?: Array<{ label?: string; url?: string }>) {
  if (!Array.isArray(links)) return [];
  return links
    .map((link) => ({
      label: typeof link.label === "string" ? link.label.trim() : "",
      url: typeof link.url === "string" ? link.url.trim() : "",
    }))
    .filter((link) => link.url.length > 0)
    .map((link) => ({
      label: link.label || link.url,
      url: link.url,
    }));
}

function formatProfile(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? user.email,
    location: user.location ?? "",
    timezone: user.timezone ?? "",
    pronouns: user.pronouns ?? "",
    accountType: user.accountType ?? "",
    status: user.status ?? "",
    bio: user.bio ?? "",
    links: Array.isArray(user.socialLinks) ? user.socialLinks : [],
    updatedAt: user.updatedAt,
  };
}

function createDefaultProfile(email: string) {
  return {
    id: null,
    email,
    name: email,
    location: "",
    timezone: "",
    pronouns: "",
    accountType: "",
    status: "",
    bio: "",
    links: [],
  };
}
