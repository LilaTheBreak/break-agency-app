import type { Job } from 'bullmq';
import { handleAgentEvent } from '../../services/agent/agentOrchestrator.js';

/**
 * The main worker for the autonomous agent. It processes events from the master queue.
 */
export default async function agentProcessor(job: Job<{ type: string; payload: any }>) {
  const { type, payload } = job.data;
  console.log(`[AGENT WORKER] Processing event job: ${type}`);
  await handleAgentEvent({ type, payload }).catch(err => {
    console.error(`[AGENT WORKER ERROR] Event processing failed for type ${type}:`, err);
    throw err;
  });
}