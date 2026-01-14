import prisma from '../lib/prisma';
import { logError } from '../lib/logger';

export const TIMEZONE = process.env.TZ || "UTC";

export type CronJobDefinition = {
  name: string;
  schedule: string;
  description: string;
  handler: () => Promise<Record<string, unknown> | void>;
};

export async function runCronJob(job: CronJobDefinition) {
  const start = new Date();
  // Note: cronLog model doesn't exist - using AuditLog instead
  const logId = `cron_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const log = await prisma.auditLog.create({
    data: {
      id: logId,
      action: "CRON_JOB_STARTED",
      entityType: "CronJob",
      metadata: {
        name: job.name,
        status: "running",
        startedAt: start,
        message: job.description
      }
    }
  });

  try {
    const metadata = (await job.handler()) ?? {};
    await prisma.auditLog.update({
      where: { id: log.id },
      data: {
        action: "CRON_JOB_SUCCESS",
        metadata: {
          ...(log.metadata as any || {}),
          status: "success",
          completedAt: new Date(),
          ...metadata
        }
      }
    });
  } catch (error) {
    logError(`Cron job failed: ${job.name}`, error instanceof Error ? error.message : error, { job: job.name });
    await prisma.auditLog.update({
      where: { id: log.id },
      data: {
        action: "CRON_JOB_FAILED",
        metadata: {
          ...(log.metadata as any || {}),
          status: "failed",
          completedAt: new Date(),
          error: error instanceof Error ? error.message : "Unknown error"
        }
      }
    });
  }
}

export function parseCommaList(value?: string) {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}
