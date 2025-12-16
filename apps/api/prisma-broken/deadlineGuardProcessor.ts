import type { Job } from 'bullmq';
import prisma from '../../lib/prisma.js';
import { analyzeDeadlineRisk } from '../../services/ai/aiDeadlineGuard.js';
import { followUpQueue } from '../queues/followUpQueue.js';

/**
 * Worker to process a single deadline check.
 */
export default async function deadlineGuardProcessor(job: Job<{ deadlineId: string }>) {
  const { deadlineId } = job.data;
  console.log(`[WORKER] Running deadline guard for: ${deadlineId}`);

  const deadline = await prisma.deadlineMonitor.findUnique({ where: { id: deadlineId } });
  if (!deadline || deadline.status !== 'active') {
    console.log(`Deadline ${deadlineId} is no longer active. Skipping.`);
    return;
  }

  // 1. Evaluate time-to-deadline and apply heuristics
  const now = new Date();
  const timeToDeadlineHours = (new Date(deadline.dueAt).getTime() - now.getTime()) / (1000 * 3600);
  const riskHeuristics = [];
  let status = 'active';

  if (timeToDeadlineHours <= 0) {
    status = 'overdue';
    riskHeuristics.push('Deadline is past due.');
  } else if (timeToDeadlineHours <= 48) {
    status = 'at_risk';
    riskHeuristics.push('Deadline is less than 48 hours away.');
  }

  // 2. Call AI Deadline Guard
  const { aiSummary, riskScore } = await analyzeDeadlineRisk({
    entityType: deadline.entityType,
    timeToDeadlineHours,
    riskHeuristics,
  }) as any;

  // 3. Save the analysis results
  await prisma.deadlineMonitor.update({
    where: { id: deadlineId },
    data: { status, aiSummary, riskScore, lastChecked: now },
  });

  // 4. Trigger follow-up if at risk
  if (status === 'at_risk' || status === 'overdue') {
    console.log(`[DEADLINE GUARD] Deadline ${deadlineId} is at risk. Triggering notification/follow-up.`);
    // This could enqueue a job in the followUpQueue from S52
    // await followUpQueue.add('deadline-chaser', { entityId: deadline.entityId, type: 'DEADLINE_RISK' });
  }
}