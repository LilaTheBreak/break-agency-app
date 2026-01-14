/**
 * Admin Diagnostics API
 * 
 * Provides visibility into system health, integration status, and background job health.
 * Admin-only endpoints for operational monitoring.
 */

import { Router, type Request, type Response } from "express";
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/requireRole';
import prisma from '../../lib/prisma';
import { logError } from '../../lib/logger';

const router = Router();

// All routes require admin access
router.use(requireAuth, requireRole(["ADMIN", "SUPERADMIN"]));

/**
 * GET /api/admin/diagnostics/integrations
 * 
 * Returns connection status, last sync timestamps, and last errors for all integrations.
 */
router.get("/integrations", async (_req: Request, res: Response) => {
  try {
    const integrations = {
      gmail: await getGmailDiagnostics(),
      googleCalendar: await getGoogleCalendarDiagnostics(),
      instagram: await getInstagramDiagnostics(),
      tiktok: await getTikTokDiagnostics(),
      youtube: await getYouTubeDiagnostics(),
      xero: await getXeroDiagnostics(),
      docusign: await getDocuSignDiagnostics(),
      slack: await getSlackDiagnostics(),
      notion: await getNotionDiagnostics(),
      googleDrive: await getGoogleDriveDiagnostics(),
    };

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      integrations,
    });
  } catch (error) {
    logError("Failed to fetch integration diagnostics", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch integration diagnostics",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/admin/diagnostics/background-jobs
 * 
 * Returns status of all background jobs (cron jobs and queues).
 */
router.get("/background-jobs", async (_req: Request, res: Response) => {
  try {
    const { CRON_JOBS } = await import("../../cron/index.js");
    
    // Get last run status for each cron job
    const cronJobs = await Promise.all(
      CRON_JOBS.map(async (job) => {
        const lastRun = await prisma.auditLog.findFirst({
          where: {
            entityType: "CronJob",
            metadata: {
              path: ["name"],
              equals: job.name,
            },
          },
          orderBy: { createdAt: "desc" },
        });

        return {
          name: job.name,
          schedule: job.schedule,
          description: job.description,
          lastRun: lastRun
            ? {
                status: (lastRun.metadata as any)?.status || "unknown",
                startedAt: (lastRun.metadata as any)?.startedAt || lastRun.createdAt,
                completedAt: (lastRun.metadata as any)?.completedAt || null,
                error: (lastRun.metadata as any)?.error || null,
              }
            : null,
        };
      })
    );

    // Get queue statistics (if Redis is configured)
    const queues = await getQueueStatistics();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      cronJobs,
      queues,
    });
  } catch (error) {
    logError("Failed to fetch background job diagnostics", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch background job diagnostics",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Helper functions for integration diagnostics

async function getGmailDiagnostics() {
  const connections = await prisma.gmailToken.findMany({
    select: {
      userId: true,
      lastSyncedAt: true,
      lastError: true,
      lastErrorAt: true,
      expiryDate: true,
    },
    orderBy: { lastSyncedAt: "desc" },
    take: 10,
  });

  const totalConnections = await prisma.gmailToken.count();
  const connectedCount = await prisma.gmailToken.count({
    where: { refreshToken: { not: null } },
  });
  const errorCount = await prisma.gmailToken.count({
    where: { lastError: { not: null } },
  });

  return {
    platform: "gmail",
    totalConnections,
    connectedCount,
    errorCount,
    recentConnections: connections.map((c) => ({
      userId: c.userId,
      lastSyncedAt: c.lastSyncedAt,
      lastError: c.lastError,
      lastErrorAt: c.lastErrorAt,
      tokenExpiresAt: c.expiryDate,
      status: c.lastError ? "error" : c.lastSyncedAt ? "connected" : "disconnected",
    })),
  };
}

async function getGoogleCalendarDiagnostics() {
  const connections = await prisma.googleAccount.findMany({
    select: {
      userId: true,
      expiresAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  const totalConnections = await prisma.googleAccount.count();
  const activeConnections = await prisma.googleAccount.count({
    where: {
      expiresAt: { gt: new Date() },
    },
  });

  return {
    platform: "google_calendar",
    totalConnections,
    activeConnections,
    recentConnections: connections.map((c) => ({
      userId: c.userId,
      lastUpdated: c.updatedAt,
      tokenExpiresAt: c.expiresAt,
      status: c.expiresAt && c.expiresAt > new Date() ? "active" : "expired",
    })),
  };
}

async function getInstagramDiagnostics() {
  const connections = await prisma.socialAccountConnection.findMany({
    where: { platform: "INSTAGRAM" },
    select: {
      id: true,
      creatorId: true,
      connected: true,
      lastSyncedAt: true,
      expiresAt: true,
      updatedAt: true,
    },
    orderBy: { lastSyncedAt: "desc" },
    take: 10,
  });

  const totalConnections = await prisma.socialAccountConnection.count({
    where: { platform: "INSTAGRAM" },
  });
  const connectedCount = await prisma.socialAccountConnection.count({
    where: { platform: "INSTAGRAM", connected: true },
  });

  // Get last sync errors from SocialSyncLog
  const lastSyncErrors = await prisma.socialSyncLog.findMany({
    where: {
      platform: "INSTAGRAM",
      status: "failed",
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      connectionId: true,
      errorMessage: true,
      errorCode: true,
      createdAt: true,
    },
  });

  return {
    platform: "instagram",
    totalConnections,
    connectedCount,
    recentConnections: connections.map((c) => ({
      creatorId: c.creatorId,
      connected: c.connected,
      lastSyncedAt: c.lastSyncedAt,
      tokenExpiresAt: c.expiresAt,
      status: c.connected ? "connected" : "disconnected",
    })),
    lastSyncErrors: lastSyncErrors.map((e) => ({
      connectionId: e.connectionId,
      error: e.errorMessage,
      errorCode: e.errorCode,
      occurredAt: e.createdAt,
    })),
  };
}

async function getTikTokDiagnostics() {
  const connections = await prisma.socialAccountConnection.findMany({
    where: { platform: "TIKTOK" },
    select: {
      id: true,
      creatorId: true,
      connected: true,
      lastSyncedAt: true,
      expiresAt: true,
      updatedAt: true,
    },
    orderBy: { lastSyncedAt: "desc" },
    take: 10,
  });

  const totalConnections = await prisma.socialAccountConnection.count({
    where: { platform: "TIKTOK" },
  });
  const connectedCount = await prisma.socialAccountConnection.count({
    where: { platform: "TIKTOK", connected: true },
  });

  const lastSyncErrors = await prisma.socialSyncLog.findMany({
    where: {
      platform: "TIKTOK",
      status: "failed",
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      connectionId: true,
      errorMessage: true,
      errorCode: true,
      createdAt: true,
    },
  });

  return {
    platform: "tiktok",
    totalConnections,
    connectedCount,
    recentConnections: connections.map((c) => ({
      creatorId: c.creatorId,
      connected: c.connected,
      lastSyncedAt: c.lastSyncedAt,
      tokenExpiresAt: c.expiresAt,
      status: c.connected ? "connected" : "disconnected",
    })),
    lastSyncErrors: lastSyncErrors.map((e) => ({
      connectionId: e.connectionId,
      error: e.errorMessage,
      errorCode: e.errorCode,
      occurredAt: e.createdAt,
    })),
  };
}

async function getYouTubeDiagnostics() {
  const connections = await prisma.socialAccountConnection.findMany({
    where: { platform: "YOUTUBE" },
    select: {
      id: true,
      creatorId: true,
      connected: true,
      lastSyncedAt: true,
      expiresAt: true,
      updatedAt: true,
    },
    orderBy: { lastSyncedAt: "desc" },
    take: 10,
  });

  const totalConnections = await prisma.socialAccountConnection.count({
    where: { platform: "YOUTUBE" },
  });
  const connectedCount = await prisma.socialAccountConnection.count({
    where: { platform: "YOUTUBE", connected: true },
  });

  const lastSyncErrors = await prisma.socialSyncLog.findMany({
    where: {
      platform: "YOUTUBE",
      status: "failed",
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      connectionId: true,
      errorMessage: true,
      errorCode: true,
      createdAt: true,
    },
  });

  return {
    platform: "youtube",
    totalConnections,
    connectedCount,
    recentConnections: connections.map((c) => ({
      creatorId: c.creatorId,
      connected: c.connected,
      lastSyncedAt: c.lastSyncedAt,
      tokenExpiresAt: c.expiresAt,
      status: c.connected ? "connected" : "disconnected",
    })),
    lastSyncErrors: lastSyncErrors.map((e) => ({
      connectionId: e.connectionId,
      error: e.errorMessage,
      errorCode: e.errorCode,
      occurredAt: e.createdAt,
    })),
  };
}

async function getXeroDiagnostics() {
  const connections = await prisma.xeroConnection.findMany({
    select: {
      userId: true,
      tenantId: true,
      expiresAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  const totalConnections = await prisma.xeroConnection.count();
  const activeConnections = await prisma.xeroConnection.count({
    where: {
      expiresAt: { gt: new Date() },
    },
  });

  // Get invoices with sync errors
  const invoicesWithErrors = await prisma.invoice.findMany({
    where: {
      xeroSyncError: { not: null },
    },
    select: {
      id: true,
      xeroSyncError: true,
      lastSyncedAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  return {
    platform: "xero",
    totalConnections,
    activeConnections,
    recentConnections: connections.map((c) => ({
      userId: c.userId,
      tenantId: c.tenantId,
      lastUpdated: c.updatedAt,
      tokenExpiresAt: c.expiresAt,
      status: c.expiresAt && c.expiresAt > new Date() ? "active" : "expired",
    })),
    syncErrors: invoicesWithErrors.map((i) => ({
      invoiceId: i.id,
      error: i.xeroSyncError,
      lastSyncedAt: i.lastSyncedAt,
      occurredAt: i.updatedAt,
    })),
  };
}

async function getDocuSignDiagnostics() {
  // DocuSign uses XeroConnection model structure (reused)
  const connections = await prisma.xeroConnection.findMany({
    where: {
      // Note: This is a placeholder - DocuSign would need its own model or metadata field
      // For now, we'll return empty as DocuSign model structure isn't clear
    },
    take: 0,
  });

  // Get contracts with signature errors
  const contractsWithErrors = await prisma.contract.findMany({
    where: {
      status: { in: ["SIGNATURE_FAILED", "SIGNATURE_ERROR"] },
    },
    select: {
      id: true,
      status: true,
      envelopeId: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  return {
    platform: "docusign",
    totalConnections: 0, // Placeholder
    activeConnections: 0,
    recentConnections: [],
    signatureErrors: contractsWithErrors.map((c) => ({
      contractId: c.id,
      status: c.status,
      envelopeId: c.envelopeId,
      occurredAt: c.updatedAt,
    })),
  };
}

async function getSlackDiagnostics() {
  const connections = await prisma.integrationConnection.findMany({
    where: { platform: "slack" },
    select: {
      userId: true,
      connected: true,
      updatedAt: true,
      metadata: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  const totalConnections = await prisma.integrationConnection.count({
    where: { platform: "slack" },
  });
  const connectedCount = await prisma.integrationConnection.count({
    where: { platform: "slack", connected: true },
  });

  return {
    platform: "slack",
    totalConnections,
    connectedCount,
    recentConnections: connections.map((c) => ({
      userId: c.userId,
      connected: c.connected,
      lastUpdated: c.updatedAt,
      status: c.connected ? "connected" : "disconnected",
    })),
  };
}

async function getNotionDiagnostics() {
  const connections = await prisma.integrationConnection.findMany({
    where: { platform: "notion" },
    select: {
      userId: true,
      connected: true,
      updatedAt: true,
      workspaceId: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  const totalConnections = await prisma.integrationConnection.count({
    where: { platform: "notion" },
  });
  const connectedCount = await prisma.integrationConnection.count({
    where: { platform: "notion", connected: true },
  });

  return {
    platform: "notion",
    totalConnections,
    connectedCount,
    recentConnections: connections.map((c) => ({
      userId: c.userId,
      connected: c.connected,
      workspaceId: c.workspaceId,
      lastUpdated: c.updatedAt,
      status: c.connected ? "connected" : "disconnected",
    })),
  };
}

async function getGoogleDriveDiagnostics() {
  const connections = await prisma.integrationConnection.findMany({
    where: { platform: "google_drive" },
    select: {
      userId: true,
      connected: true,
      updatedAt: true,
      expiresAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  const totalConnections = await prisma.integrationConnection.count({
    where: { platform: "google_drive" },
  });
  const connectedCount = await prisma.integrationConnection.count({
    where: { platform: "google_drive", connected: true },
  });

  return {
    platform: "google_drive",
    totalConnections,
    connectedCount,
    recentConnections: connections.map((c) => ({
      userId: c.userId,
      connected: c.connected,
      lastUpdated: c.updatedAt,
      tokenExpiresAt: c.expiresAt,
      status: c.connected && (!c.expiresAt || c.expiresAt > new Date()) ? "active" : "disconnected",
    })),
  };
}

async function getQueueStatistics() {
  try {
    // Check if Redis is configured
    const redisHost = process.env.REDIS_HOST || "";
    const redisUrl = process.env.REDIS_URL || "";
    const hasRedis = !!(redisUrl || redisHost);

    if (!hasRedis) {
      return {
        redisConfigured: false,
        message: "Redis not configured - queues are stubbed",
        queues: [],
      };
    }

    // Import queues to get statistics
    const { gmailQueue, socialQueue, emailQueue, triageQueue, dealExtractionQueue } = await import("../../worker/queues.js");

    const queueStats = await Promise.all([
      getQueueStats(gmailQueue, "gmail-ingest"),
      getQueueStats(socialQueue, "social-refresh"),
      getQueueStats(emailQueue, "email-send"),
      getQueueStats(triageQueue, "inbox-triage"),
      getQueueStats(dealExtractionQueue, "deal-extraction"),
    ]);

    return {
      redisConfigured: true,
      queues: queueStats.filter((q) => q !== null),
    };
  } catch (error) {
    return {
      redisConfigured: false,
      error: error instanceof Error ? error.message : "Unknown error",
      queues: [],
    };
  }
}

async function getQueueStats(queue: any, name: string) {
  try {
    if (!queue || !queue.getJobCounts) {
      return null;
    }

    const counts = await queue.getJobCounts();
    return {
      name,
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
    };
  } catch (error) {
    return null;
  }
}

export default router;

