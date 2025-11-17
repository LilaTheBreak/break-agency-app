import prisma from "../lib/prisma.js";
import { CronJobDefinition } from "./types.js";
import { refreshSocialAnalytics } from "../services/socialService.js";

export const updateSocialStatsJob: CronJobDefinition = {
  name: "update-social-stats",
  schedule: "0 */6 * * *",
  description: "Refreshes creator social analytics every six hours.",
  handler: async () => {
    const accounts = await prisma.socialAccount.findMany({
      distinct: ["userId"],
      select: { userId: true }
    });
    let processed = 0;
    for (const account of accounts) {
      try {
        await refreshSocialAnalytics({ userId: account.userId });
        processed += 1;
      } catch (error) {
        console.error("update social stats error", error);
      }
    }
    return { users: accounts.length, processed };
  }
};
