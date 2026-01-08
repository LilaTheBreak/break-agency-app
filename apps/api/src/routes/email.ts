import { Prisma } from "@prisma/client";
import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { EMAIL_TEMPLATE_NAMES, type EmailTemplateName } from "../emails/templates/index.js";
import { logAuditEvent } from "../lib/auditLogger.js";
import { logAdminActivity } from "../lib/adminActivityLogger.js";
import { sendTemplatedEmail, listEmailLogs } from "../services/email/emailClient.js";
import { sendTestEmail } from "../services/emailService.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = Router();

const limiter = rateLimit({
  windowMs: 1000 * 60,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

router.use(limiter);

const templateEnum = z.enum(EMAIL_TEMPLATE_NAMES as [string, ...string[]]);

const sendSchema = z.object({
  to: z.string().email(),
  template: templateEnum,
  subject: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  userId: z.string().optional()
});

router.post("/email/test", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const to = typeof req.body?.to === "string" ? req.body.to : process.env.TEST_EMAIL_TO || "";
    if (!to) {
      return res.status(400).json({ error: "Provide a test recipient via body.to or TEST_EMAIL_TO env." });
    }
    const log = await sendTestEmail(to);
    await logAuditEvent(req, {
      action: "email.test",
      entityType: "email",
      metadata: { to } as Prisma.JsonObject
    });
    await logAdminActivity(req, {
      event: "admin.email.test",
      metadata: { to } as Prisma.JsonObject
    });
    res.json({ status: "queued", logId: log.id });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to enqueue test email" });
  }
});

router.post("/email/send", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const payload = sendSchema.parse(req.body ?? {});
    const response = await sendTemplatedEmail({ ...payload, template: payload.template as EmailTemplateName });
    await logAuditEvent(req, {
      action: "email.send",
      entityType: "email",
      entityId: payload.userId ?? null,
      metadata: { to: payload.to, template: payload.template } as Prisma.JsonObject
    });
    await logAdminActivity(req, {
      event: "admin.email.send",
      metadata: { to: payload.to, template: payload.template } as Prisma.JsonObject
    });
    res.json({ status: response.status, logId: response.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.flatten() });
    }
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to enqueue email" });
  }
});

router.get("/email/logs", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? "50"), 10) || 50, 200);
    const logs = await listEmailLogs(limit);
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: "Failed to load email logs" });
  }
});

export default router;
