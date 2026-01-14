import { Prisma, type User } from "@prisma/client";
import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

// Feature routers
import socialRouter from "./social";
import emailRouter from "./email";
import systemRouter from "./system";
import auditRouter from "./audit";
import adminActivityRouter from "./adminActivity";
import payoutsRouter from "./payouts";
import dashboardRouter from "./dashboard";
import dashboardRevenueRouter from "./dashboardRevenue";
import dashboardCampaignPacingRouter from "./dashboardCampaignPacing";
import dashboardExclusiveTalentRouter from "./dashboardExclusiveTalent";
import messagesRouter from "./messages";
import filesRouter from "./files";
import contractsRouter from "./contracts";
import briefsRouter from "./briefs";
import aiRouter from "./ai";
import aiFileInsightsRouter from "./aiFileInsights";
import aiSocialInsightsRouter from "./aiSocialInsights";
import aiDealExtractorRouter from "./aiDealExtractor";
import documentExtractionRouter from "./documentExtraction";
import campaignsRouter from "./campaigns";
import deckRouter from "./deck";
import queuesRouter from "./queues";
import talentAccessRouter from "./talentAccess";

// Enterprise Operating System routes
import enterpriseValueRouter from "./enterpriseValue";
import revenueClassificationRouter from "./revenueClassification";
import founderDependencyRouter from "./founderDependency";
import ownedAssetsRouter from "./ownedAssets";
import exitReadinessRouter from "./exitReadiness";

// User management & onboarding
// NOTE: authRouter is mounted in server.ts at /api/auth, not here
import onboardingRouter from './onboarding';
import adminUsersRouter from './adminUsers';

// Social OAuth routes
import instagramAuthRouter from './auth/instagram';
import tiktokAuthRouter from './auth/tiktok';
// TODO: Convert youtube auth to ES6 module
// const youtubeAuthRouter = require("./auth/youtube");
import socialAnalyticsRouter from './analytics/socials';

// ❗ You referenced these in your router but did not import them
// import agentRouter from './agent';
// import brandCRMRouter from './brandCRM';

import { logAuditEvent } from '../lib/auditLogger';
import { logAdminActivity } from '../lib/adminActivityLogger';

import { requireAuth } from '../middleware/auth';
// import {
//   requireRole,
//   requireSuperAdmin,
//   requireAdmin,
//   requireAgent,
//   requireBrand,
//   requireTalent,
// } from '../middleware/requireRole';

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
router.use("/admin", adminUsersRouter);

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
