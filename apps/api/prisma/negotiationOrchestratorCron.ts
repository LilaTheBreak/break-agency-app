import cron from 'node-cron';
import { runNegotiationOrchestrator } from '../services/ai/negotiationOrchestrator.js';

/**
 * Schedules the AI Negotiation Orchestrator to run every hour
 * between 8 AM and 8 PM.
 */
export function scheduleNegotiationOrchestrator() {
  console.log('[CRON] Scheduling negotiation orchestrator...');

  // Run every hour at the start of the hour
  cron.schedule('0 * * * *', () => {
    const hour = new Date().getHours();
    if (hour >= 8 && hour <= 20) {
      console.log('[CRON] Triggering hourly negotiation orchestrator run...');
      runNegotiationOrchestrator();
    }
  });
}