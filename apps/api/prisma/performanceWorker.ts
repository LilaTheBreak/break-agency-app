import type { Job } from 'bullmq';
import prisma from '../../lib/prisma.js';
import { fetchAnalytics } from '../../services/performance/analyticsFetcher.js';
import { generatePerformanceInsights } from '../../services/performance/insightEngine.js';

/**
 * Worker to fetch performance metrics for a posted deliverable.
 */
export default async function performanceWorker(job: Job<{ deliverableId: string }>) {
  const { deliverableId } = job.data;
  console.log(`[WORKER] Fetching performance for deliverable: ${deliverableId}`);

  const deliverable = await prisma.deliverableItem.findUnique({ where: { id: deliverableId } });
  if (!deliverable || !deliverable.postedUrl) {
    console.warn(`Deliverable ${deliverableId} not found or not posted. Skipping performance check.`);
    return;
  }

  // 1. Fetch latest metrics
  const platform = 'tiktok'; // This would be dynamic
  const postId = deliverable.postedUrl.split('/').pop()!;
  const metrics = await fetchAnalytics(platform, postId);

  // 2. Save snapshot
  await prisma.postPerformance.create({
    data: {
      deliverableId,
      ...metrics,
    },
  });

  // 3. Generate and save AI summary (e.g., after a few snapshots)
  const snapshots = await prisma.postPerformance.findMany({ where: { deliverableId } });
  if (snapshots.length > 3) {
    const insights = await generatePerformanceInsights(snapshots);
    await prisma.deliverableItem.update({
      where: { id: deliverableId },
      data: { aiPerformanceSummary: insights },
    });
  }
}