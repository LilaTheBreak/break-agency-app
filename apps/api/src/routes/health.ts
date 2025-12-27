import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /health
 * 
 * Basic health check endpoint for monitoring system status.
 * Returns basic system information and database connectivity.
 * No authentication required.
 */
export async function healthCheck(req: Request, res: Response) {
  const healthData: {
    status: string;
    timestamp: string;
    database: string;
    uptime: number;
  } = {
    status: "ok",
    timestamp: new Date().toISOString(),
    database: "disconnected",
    uptime: process.uptime()
  };

  try {
    // Simple database connectivity check
    await prisma.$queryRaw`SELECT 1`;
    healthData.database = "connected";
  } catch (error) {
    console.error("Health check database error:", error);
    healthData.status = "degraded";
    healthData.database = "error";
  }

  // Return 200 if status is ok, 503 if degraded
  const statusCode = healthData.status === "ok" ? 200 : 503;
  res.status(statusCode).json(healthData);
}

/**
 * GET /health/detailed
 * 
 * Detailed health check with all system components
 */
export async function detailedHealthCheck(_req: Request, res: Response) {
  const checks: any = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {},
  };

  // 1. Database connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.checks.database = {
      status: "healthy",
      message: "Database connection successful",
    };
  } catch (error: any) {
    checks.status = "degraded";
    checks.checks.database = {
      status: "unhealthy",
      message: error.message || "Database connection failed",
    };
  }

  // 2. Memory usage
  const memUsage = process.memoryUsage();
  const memUsageMB = {
    rss: Math.round(memUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024),
  };

  checks.checks.memory = {
    status: memUsageMB.heapUsed < 500 ? "healthy" : "warning",
    usage: memUsageMB,
    message: memUsageMB.heapUsed < 500 ? "Memory usage normal" : "Memory usage high",
  };

  // 3. Environment variables
  const requiredEnvVars = [
    "DATABASE_URL",
    "SESSION_SECRET",
    "JWT_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
  ];

  const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  checks.checks.environment = {
    status: missingEnvVars.length === 0 ? "healthy" : "unhealthy",
    message:
      missingEnvVars.length === 0
        ? "All required environment variables set"
        : `Missing: ${missingEnvVars.join(", ")}`,
    missing: missingEnvVars,
  };

  if (missingEnvVars.length > 0) {
    checks.status = "unhealthy";
  }

  // 4. Cron job status
  const cronStatus = getCronJobStatus();
  checks.checks.cron = cronStatus;

  // 5. Gmail webhook status
  const gmailWebhookStatus = getGmailWebhookStatus();
  checks.checks.gmailWebhook = gmailWebhookStatus;

  // Set overall status
  const unhealthyChecks = Object.values(checks.checks).filter(
    (check: any) => check.status === "unhealthy"
  );
  if (unhealthyChecks.length > 0) {
    checks.status = "unhealthy";
  }

  const httpStatus = checks.status === "unhealthy" ? 503 : 200;
  res.status(httpStatus).json(checks);
}

/**
 * GET /api/cron/status
 * 
 * Cron job status endpoint
 */
export async function cronStatusCheck(_req: Request, res: Response) {
  const cronStatus: any = {
    registered: (global as any).cronJobsRegistered || false,
    jobs: [],
  };

  if (!cronStatus.registered) {
    return res.json({
      ...cronStatus,
      message: "Cron jobs not yet registered",
    });
  }

  // Get cron job execution history from global state
  const cronJobs = (global as any).cronJobs || {};

  Object.keys(cronJobs).forEach((jobName) => {
    const job = cronJobs[jobName];
    cronStatus.jobs.push({
      name: jobName,
      schedule: job.schedule || "unknown",
      lastRun: job.lastRun || null,
      lastStatus: job.lastStatus || "unknown",
      lastError: job.lastError || null,
      runCount: job.runCount || 0,
      lastDuration: job.lastDuration || null,
    });
  });

  res.json(cronStatus);
}

/**
 * Helper: Get cron job registration status
 */
function getCronJobStatus() {
  const cronRegistered = (global as any).cronJobsRegistered || false;
  const lastCronRun = (global as any).lastCronRun || null;

  if (!cronRegistered) {
    return {
      status: "unknown",
      message: "Cron jobs not yet registered",
      registered: false,
    };
  }

  if (!lastCronRun) {
    return {
      status: "healthy",
      message: "Cron jobs registered, waiting for first run",
      registered: true,
      lastRun: null,
    };
  }

  const timeSinceLastRun = Date.now() - new Date(lastCronRun).getTime();
  const minutesSinceLastRun = Math.floor(timeSinceLastRun / 1000 / 60);

  // If no cron ran in the last 10 minutes, something might be wrong
  const isStale = minutesSinceLastRun > 10;

  return {
    status: isStale ? "warning" : "healthy",
    message: isStale
      ? `No cron execution in ${minutesSinceLastRun} minutes`
      : "Cron jobs running normally",
    registered: true,
    lastRun: lastCronRun,
    minutesSinceLastRun,
  };
}

/**
 * Helper: Get Gmail webhook registration status
 */
function getGmailWebhookStatus() {
  const webhookUrl = process.env.GMAIL_WEBHOOK_URL || process.env.BACKEND_URL;

  if (!webhookUrl) {
    return {
      status: "disabled",
      message: "Gmail webhook URL not configured (using cron fallback)",
      registered: false,
    };
  }

  const webhookRegistered = (global as any).gmailWebhookRegistered || false;
  const lastWebhookReceived = (global as any).lastGmailWebhookReceived || null;

  if (!webhookRegistered) {
    return {
      status: "warning",
      message: "Gmail webhook URL configured but not registered",
      registered: false,
      url: webhookUrl,
    };
  }

  if (!lastWebhookReceived) {
    return {
      status: "healthy",
      message: "Gmail webhook registered, waiting for first notification",
      registered: true,
      url: webhookUrl,
    };
  }

  const timeSinceLastWebhook = Date.now() - new Date(lastWebhookReceived).getTime();
  const minutesSinceLastWebhook = Math.floor(timeSinceLastWebhook / 1000 / 60);

  return {
    status: "healthy",
    message: "Gmail webhook receiving notifications",
    registered: true,
    url: webhookUrl,
    lastReceived: lastWebhookReceived,
    minutesSinceLastReceived: minutesSinceLastWebhook,
  };
}
