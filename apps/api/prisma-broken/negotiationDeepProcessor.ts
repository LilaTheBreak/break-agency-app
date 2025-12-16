import type { Job } from 'bullmq';
import { analyzeAndStrategize } from '../../agent/negotiation/negotiationEngine.js';

/**
 * Worker to run the AI Negotiation Deep Assistant pipeline.
 */
export default async function negotiationDeepProcessor(job: Job<{ emailId: string }>) {
  const { emailId } = job.data;
  console.log(`[WORKER] Running deep negotiation analysis for email: ${emailId}`);
  await analyzeAndStrategize(emailId).catch(err => {
    console.error(`[WORKER ERROR] Deep negotiation analysis failed for email ${emailId}:`, err);
    throw err;
  });
}