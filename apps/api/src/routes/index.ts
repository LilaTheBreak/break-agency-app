import { Prisma, type User } from "@prisma/client";
import { Router, Request, Response } from "express";
import prisma from "../lib/prisma.js";
import socialRouter from "./social.js";
import emailRouter from "./email.js";
import systemRouter from "./system.js";
import { logAuditEvent } from "../lib/auditLogger.js";
import auditRouter from "./audit.js";
import adminActivityRouter from "./adminActivity.js";
import payoutsRouter from "./payouts.js";
import dashboardRouter from "./dashboard.js";
import messagesRouter from "./messages.js";
import filesRouter from "./files.js";
import contractsRouter from "./contracts.js";
import briefsRouter from "./briefs.js";
import aiRouter from "./ai.js";
import campaignsRouter from "./campaigns.js";
import { logAdminActivity } from "../lib/adminActivityLogger.js";

const router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

router.use(socialRouter);
router.use(emailRouter);
router.use(systemRouter);
router.use(auditRouter);
router.use(adminActivityRouter);
router.use(payoutsRouter);
router.use(dashboardRouter);
router.use(messagesRouter);
router.use(filesRouter);
router.use(contractsRouter);
router.use(briefsRouter);
router.use(aiRouter);
router.use(campaignsRouter);

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
    res.json({ profile: formatProfile(user) });
  } catch (error) {
    console.error("Error fetching profile", error);
    res.status(500).json({ error: "Failed to load profile" });
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
      socialLinks: links.length ? links : null
    };

    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        password: null,
        ...data
      },
      update: data
    });

    const profile = formatProfile(user);
    await logAuditEvent(req, {
      action: "profile.update",
      entityType: "user",
      entityId: user.id,
      metadata: profile as Prisma.JsonObject
    });
    await logAdminActivity(req, {
      event: "admin.profile.update",
      metadata: { userId: user.id, email } as Prisma.JsonObject
    });
    res.json({ profile });
  } catch (error) {
    console.error("Error saving profile", error);
    res.status(500).json({ error: "Failed to save profile" });
  }
});

export default router;

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
      url: typeof link.url === "string" ? link.url.trim() : ""
    }))
    .filter((link) => link.url.length > 0)
    .map((link) => ({
      label: link.label || link.url,
      url: link.url
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
    updatedAt: user.updatedAt
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
    links: []
  };
}
