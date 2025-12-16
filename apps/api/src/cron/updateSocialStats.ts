import { CronJobDefinition } from "./types.js";

export const updateSocialStatsJob: CronJobDefinition = {
  name: "update-social-stats",
  schedule: "0 */6 * * *",
  description: "Social stats job skipped — models removed from schema.",
  handler: async () => {
    console.warn("update-social-stats skipped: social schema models removed");
    return { skipped: true };
  }
};
