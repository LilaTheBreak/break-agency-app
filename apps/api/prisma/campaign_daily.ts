import cron from 'node-cron';
import { runDailyWorkflow } from '../services/campaigns/campaignWorkflowEngine.js';

/**
 * Schedules the daily campaign workflow to run once a day.
 */
export function scheduleDailyCampaignWorkflow() {
  console.log('[CRON] Scheduling daily campaign workflow...');
  // Run every day at 8 AM
  cron.schedule('0 8 * * *', runDailyWorkflow);
}