import { CronJobDefinition } from './types';
import { runDealAutomation } from '../services/dealAutomation';

export const dealAutomationJob: CronJobDefinition = {
  name: "deal-automation",
  schedule: "0 * * * *",
  description: "Runs deal automation rules (risk, missing items, auto-advance).",
  handler: async () => {
    return runDealAutomation();
  }
};
