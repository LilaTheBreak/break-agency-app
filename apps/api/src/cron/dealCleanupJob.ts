import { CronJobDefinition } from "./types.js";
import prisma from "../lib/prisma.js";

export const dealCleanupJob: CronJobDefinition = {
  name: "deal-cleanup",
  schedule: "0 4 * * *",
  description: "Cleanup low-confidence deal drafts.",
  handler: async () => {
    const deleted = await prisma.dealDraft.deleteMany({
      where: { confidence: { lt: 0.3 } }
    });
    return { deleted: deleted.count };
  }
};
