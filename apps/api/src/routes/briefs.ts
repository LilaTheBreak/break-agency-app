import { Router } from "express";
import { createVersion, getVersions, restoreVersion } from "../services/briefs/versioning.js";
import prisma from "../lib/prisma.js";
import { logAuditEvent } from "../lib/auditLogger.js";
import { sendTemplatedEmail } from "../services/email/emailClient.js";

const router = Router();

router.get("/briefs/:briefId/versions", ensureUser, async (req, res) => {
  try {
    const versions = await getVersions(req.params.briefId);
    res.json({ versions });
  } catch (error) {
    res.status(404).json({ error: error instanceof Error ? error.message : "Brief not found" });
  }
});

router.post("/briefs/:briefId/version", ensureUser, async (req, res) => {
  try {
    const data = req.body?.data ?? {};
    const version = await createVersion(req.params.briefId, req.user?.id ?? null, data);
    res.status(201).json({ version });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Unable to save version" });
  }
});

router.post("/briefs/restore/:versionId", ensureUser, async (req, res) => {
  try {
    const { restored, newVersion } = await restoreVersion(req.params.versionId, req.user?.id ?? null);
    const brief = await prisma.brief.findUnique({ where: { id: restored.briefId } });
    if (brief && req.user) {
      await logAuditEvent(req, {
        action: "brief.restore",
        entityType: "brief",
        entityId: brief.id,
        metadata: { versionRestored: restored.versionNumber, restoredBy: req.user.id }
      });
      await notifyParties(brief, restored);
    }
    const versions = await getVersions(restored.briefId);
    res.json({ versions, restored: newVersion });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Unable to restore version" });
  }
});

async function notifyParties(
  brief: { metadata: unknown; title: string },
  version: { versionNumber: number; data: unknown }
) {
  const recipients = extractEmails(brief.metadata) || [];
  if (!recipients.length) return;
  await Promise.all(
    recipients.slice(0, 5).map((email) =>
      sendTemplatedEmail({
        to: email,
        template: "systemAlert",
        data: {
          subject: `Brief restored: ${brief.title}`,
          headline: `Brief reverted to v${version.versionNumber}`,
          detail: `A previous version of ${brief.title} was restored. Please review the updates.`
        }
      }).catch(() => null)
    )
  );
}

function extractEmails(metadata: unknown) {
  if (Array.isArray(metadata)) {
    return metadata
      .map((entry) => (typeof entry === "string" ? entry : entry?.email))
      .filter((email) => typeof email === "string");
  }
  if (metadata && typeof metadata === "object") {
    const value = (metadata as Record<string, unknown>).recipients;
    if (Array.isArray(value)) {
      return value
        .map((entry) => (typeof entry === "string" ? entry : entry?.email))
        .filter((email) => typeof email === "string");
    }
  }
  return [];
}

function ensureUser(req, res, next) {
  if (!req.user?.id) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export default router;
