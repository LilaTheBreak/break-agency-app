import prisma from "../lib/prisma.js";
import { CronJobDefinition } from "./types.js";

export const flushStaleApprovalsJob: CronJobDefinition = {
  name: "flush-stale-approvals",
  schedule: "0 */12 * * *",
  description: "Marks admin approval emails older than 48h as expired.",
  handler: async () => {
    const cutoff = new Date(Date.now() - 1000 * 60 * 60 * 48);
    const result = await prisma.emailLog.updateMany({
      where: {
        template: "admin-approval",
        status: "queued",
        createdAt: { lt: cutoff }
      },
      data: { status: "expired" }
    });
    return { updated: result.count };
  }
};
