import prisma from "../lib/prisma.js";
import { logError } from "../lib/logger.js";

export const TIMEZONE = process.env.TZ || "UTC";

export type CronJobDefinition = {
  name: string;
  schedule: string;
  description: string;
  handler: () => Promise<Record<string, unknown> | void>;
};

export async function runCronJob(job: CronJobDefinition) {
  const start = new Date();
  const log = await prisma.cronLog.create({
    data: {
      name: job.name,
      status: "running",
      startedAt: start,
      message: job.description
    }
  });

  try {
    const metadata = (await job.handler()) ?? {};
    await prisma.cronLog.update({
      where: { id: log.id },
      data: {
        status: "success",
        completedAt: new Date(),
        metadata
      }
    });
  } catch (error) {
    logError(`Cron job failed: ${job.name}`, error instanceof Error ? error.message : error, { job: job.name });
    await prisma.cronLog.update({
      where: { id: log.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        error: error instanceof Error ? error.message : "Unknown error"
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
