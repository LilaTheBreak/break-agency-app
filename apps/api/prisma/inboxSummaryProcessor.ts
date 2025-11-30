import type { Job } from 'bullmq';
import prisma from '../../lib/prisma.js';
import { generateInboxSummary } from '../../services/ai/aiInboxSummariser.js';

/**
 * Worker to process and generate an inbox summary for a user.
 */
export default async function inboxSummaryProcessor(job: Job<{ userId: string; timeframe: 'daily' | 'hourly' }>) {
  const { userId, timeframe } = job.data;
  console.log(`[WORKER] Generating ${timeframe} inbox summary for user: ${userId}`);

  // 1. Fetch recent emails
  const since = new Date(Date.now() - (timeframe === 'daily' ? 24 : 1) * 3600 * 1000);
  const recentEmails = await prisma.inboundEmail.findMany({
    where: { userId, receivedAt: { gte: since } },
    select: { id: true, from: true, subject: true, aiCategory: true, aiUrgency: true },
  });

  if (recentEmails.length === 0) {
    console.log(`No new emails for user ${userId} in the last ${timeframe}. Skipping summary.`);
    return;
  }

  // 2. Enrich with other data (deadlines, etc.) - simplified for this example
  const deadlinesToday = await prisma.deadlineMonitor.count({
    where: { userId, status: 'active', dueAt: { lte: new Date(Date.now() + 24 * 3600 * 1000) } },
  });

  // 3. Call AI Summarizer
  const summaryPayload = await generateInboxSummary({ timeframe, emails: recentEmails }) as any;

  // Add enriched stats
  summaryPayload.stats.deadlinesToday = deadlinesToday;

  // 4. Save to InboxSummary
  await prisma.inboxSummary.create({
    data: {
      userId,
      timeframe,
      summary: summaryPayload.summary,
      insights: summaryPayload.insights,
      actions: summaryPayload.actions,
    },
  });

  // 5. Send notifications (Slack, Email) - stubs
  console.log(`[NOTIFY] Slack digest sent for user ${userId}.`);
}