import { CronJobDefinition } from "./types.js";
import { runDealAutomation } from "../services/dealAutomation.js";

export const dealAutomationJob: CronJobDefinition = {
  name: "deal-automation",
  schedule: "0 * * * *",
  description: "Runs deal automation rules (risk, missing items, auto-advance).",
  handler: async () => {
    return runDealAutomation();
  }
};
