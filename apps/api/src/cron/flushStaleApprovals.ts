import prisma from "../lib/prisma.js";
import { CronJobDefinition } from "./types.js";

export const flushStaleApprovalsJob: CronJobDefinition = {
  name: "flush-stale-approvals",
  schedule: "0 */12 * * *",
  description: "Marks admin approval emails older than 48h as expired.",
  handler: async () => {
    const cutoff = new Date(Date.now() - 1000 * 60 * 60 * 48);
    // Note: emailLog model doesn't exist - using AuditLog instead
    // This cron job needs to be refactored to work with AuditLog
    // For now, return empty result
    const result = { count: 0 };
    // TODO: Refactor to use AuditLog with proper metadata filtering
    // const result = await prisma.auditLog.updateMany({
    //   where: {
    //     entityType: "Email",
    //     action: "EMAIL_QUEUED",
    //     createdAt: { lt: cutoff },
    //     metadata: {
    //       path: ["template"],
    //       equals: "admin-approval"
    //     }
    //   },
    //   data: {
    //     action: "EMAIL_EXPIRED",
    //     metadata: {
    //       ...(existing metadata),
    //       status: "expired"
    //     }
    //   }
    // });
    return { updated: result.count };
  }
};
