import prisma from '../../lib/prisma.js';
import { detectGlobalConflicts } from './conflictDetector.js';
import { negotiationInsightQueue } from '../../worker/queues/negotiationInsightQueue.js';

type ThreadHealth = {
  urgencyScore: number;
  stalenessScore: number;
  valueScore: number;
  closingLikelihood: number;
  riskLevel: number;
  recommendedAction: 'reply_now' | 'wait' | 'follow_up' | 'decline';
};

async function evaluateThreadHealth(thread: any): Promise<ThreadHealth> {
  const stalenessScore = thread.lastBrandMessageAt
    ? Math.min(100, (new Date().getTime() - new Date(thread.lastBrandMessageAt).getTime()) / (1000 * 3600))
    : 0;

  const insights = thread.dealDraft?.negotiationInsights?.[0];
  const valueScore = insights?.recommendedRange?.ideal || thread.dealDraft?.offerValue || 0;

  return {
    urgencyScore: stalenessScore > 48 ? 90 : 20,
    stalenessScore,
    valueScore,
    closingLikelihood: (insights?.brandContext as any)?.likelihoodToClose || 50,
    riskLevel: insights?.redFlags?.length > 0 ? 80 : 20,
    recommendedAction: stalenessScore > 48 ? 'follow_up' : 'reply_now',
  };
}

function computeThreadPriority(health: ThreadHealth, conflicts: any[]): 'HIGH' | 'MEDIUM' | 'LOW' | 'IGNORE' {
  const weightedScore =
    health.urgencyScore * 0.3 +
    health.valueScore * 0.001 + // Normalize value
    health.closingLikelihood * 0.4 -
    health.riskLevel * 0.2 -
    (conflicts.length > 0 ? 30 : 0);

  if (weightedScore > 75) return 'HIGH';
  if (weightedScore > 40) return 'MEDIUM';
  if (weightedScore > 10) return 'LOW';
  return 'IGNORE';
}

/**
 * The main orchestrator function that evaluates all active negotiations.
 */
export async function runNegotiationOrchestrator() {
  const runId = (await prisma.negotiationAgentRun.create({ data: { status: 'running' } })).id;
  const summary: any = { actions: [], conflicts: [], ignored: [] };

  try {
    // 1. Load all active threads with necessary relations
    const activeThreads = await prisma.negotiationThread.findMany({
      where: { status: 'active' },
      include: {
        dealDraft: {
          include: {
            negotiationInsights: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    // 2. Detect global conflicts
    const conflicts = await detectGlobalConflicts(activeThreads as any);
    summary.conflicts = conflicts;

    const decisions = [];

    // 3. Evaluate and prioritize each thread
    for (const thread of activeThreads) {
      const health = await evaluateThreadHealth(thread);
      const threadConflicts = conflicts.filter(c => c.threadA === thread.id || c.threadB === thread.id);
      const priority = computeThreadPriority(health, threadConflicts);
      decisions.push({ thread, health, priority });
    }

    // 4. Decide and enqueue actions based on priority
    for (const { thread, health, priority } of decisions) {
      if (priority === 'HIGH' && health.recommendedAction === 'reply_now') {
        // This would enqueue a job for the real-time engine from S23
        // await realtimeReplyQueue.add('generate-reply', { threadId: thread.id });
        summary.actions.push({ threadId: thread.id, action: 'ENQUEUE_REPLY', priority });
      } else if (priority === 'MEDIUM' && health.recommendedAction === 'follow_up') {
        // This would enqueue a job for the follow-up engine from S20
        // await followUpQueue.add('generate-follow-up', { threadId: thread.id });
        summary.actions.push({ threadId: thread.id, action: 'ENQUEUE_FOLLOW_UP', priority });
      } else {
        summary.ignored.push({ threadId: thread.id, reason: `Priority was ${priority}` });
      }
    }

    // 5. Log the completed run
    await prisma.negotiationAgentRun.update({
      where: { id: runId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        summary,
        context: { threadCount: activeThreads.length },
      },
    });

    console.log('[ORCHESTRATOR] Run completed.', summary);
    return summary;
  } catch (error: any) {
    console.error('[ORCHESTRATOR] Run failed:', error);
    await prisma.negotiationAgentRun.update({
      where: { id: runId },
      data: { status: 'failed', summary: { error: error.message } },
    });
  }
}