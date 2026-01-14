import { CronJobDefinition } from './types.js';
import { logError } from '../lib/logger.js';

// Phase 3: dealDraft model removed from schema - job disabled
export const dealCleanupJob: CronJobDefinition = {
  name: "deal-cleanup",
  schedule: "0 4 * * *",
  description: "Cleanup low-confidence deal drafts (DISABLED: dealDraft model removed from schema).",
  handler: async () => {
    logError("deal-cleanup job skipped", new Error("dealDraft model removed from schema"), { job: "deal-cleanup" });
    return { skipped: true, reason: "dealDraft model removed from schema" };
  }
};
