/**
 * Cron Job Observability Wrapper
 * Purpose: Add logging and monitoring to cron jobs
 * Design: Wrap cron functions with execution tracking
 */

import { sanitizeErrorForLogging } from "../utils/errorNormalizer.js";

/**
 * Initialize global cron tracking
 */
function initCronTracking() {
  if (!(global as any).cronJobs) {
    (global as any).cronJobs = {};
  }
  if (!(global as any).cronJobsRegistered) {
    (global as any).cronJobsRegistered = false;
  }
}

/**
 * Register a cron job for tracking
 * @param name - Job name
 * @param schedule - Cron schedule string
 */
export function registerCronJob(name: string, schedule: string) {
  initCronTracking();

  (global as any).cronJobs[name] = {
    name,
    schedule,
    lastRun: null,
    lastStatus: "pending",
    lastError: null,
    runCount: 0,
  };

  console.log(`[CRON] Registered job: ${name} (${schedule})`);
}

/**
 * Mark cron jobs as fully registered
 */
export function markCronJobsRegistered() {
  (global as any).cronJobsRegistered = true;
  console.log("[CRON] All cron jobs registered successfully");
}

/**
 * Wrap a cron function with observability
 * @param name - Job name
 * @param cronFunction - The actual cron function to execute
 * @returns Wrapped function with logging
 */
export function observableCron(name: string, cronFunction: () => Promise<any>) {
  return async () => {
    initCronTracking();

    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    console.log(`[CRON] ${name} - Starting execution at ${timestamp}`);

    try {
      // Update job state
      if ((global as any).cronJobs[name]) {
        (global as any).cronJobs[name].lastRun = timestamp;
        (global as any).cronJobs[name].lastStatus = "running";
      }

      // Update global last cron run time
      (global as any).lastCronRun = timestamp;

      // Execute the actual cron function
      const result = await cronFunction();

      const duration = Date.now() - startTime;
      console.log(`[CRON] ${name} - Completed successfully in ${duration}ms`);

      // Update job state
      if ((global as any).cronJobs[name]) {
        (global as any).cronJobs[name].lastStatus = "success";
        (global as any).cronJobs[name].lastError = null;
        (global as any).cronJobs[name].runCount += 1;
        (global as any).cronJobs[name].lastDuration = duration;
      }

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const sanitizedError = sanitizeErrorForLogging(error);

      console.error(`[CRON] ${name} - Failed after ${duration}ms:`, sanitizedError);

      // Update job state
      if ((global as any).cronJobs[name]) {
        (global as any).cronJobs[name].lastStatus = "failed";
        (global as any).cronJobs[name].lastError = sanitizedError.message;
        (global as any).cronJobs[name].runCount += 1;
        (global as any).cronJobs[name].lastDuration = duration;
      }

      // Re-throw so error handlers can deal with it
      throw error;
    }
  };
}

/**
 * Get status of all registered cron jobs
 */
export function getCronJobsStatus() {
  initCronTracking();

  return {
    registered: (global as any).cronJobsRegistered || false,
    jobs: (global as any).cronJobs || {},
    lastRun: (global as any).lastCronRun || null,
  };
}

export default {
  registerCronJob,
  markCronJobsRegistered,
  observableCron,
  getCronJobsStatus,
};
