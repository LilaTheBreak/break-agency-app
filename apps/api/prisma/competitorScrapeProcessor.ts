import type { Job } from 'bullmq';
import prisma from '../../lib/prisma.js';
import { competitorAnalysisQueue } from '../queues/competitorQueues.js';

/**
 * "Scrapes" posts for a given competitor profile.
 * This is a stub for a real scraping service.
 */
export default async function competitorScrapeProcessor(job: Job<{ competitorProfileId: string }>) {
  const { competitorProfileId } = job.data;
  console.log(`[WORKER] Scraping posts for competitor profile: ${competitorProfileId}`);

  // Mocked post data
  const mockPosts = [
    { platformPostId: 'post1', caption: 'Loving the new skincare routine!', postedAt: new Date() },
    { platformPostId: 'post2', caption: 'My top 5 travel hacks for 2025.', postedAt: new Date() },
  ];

  for (const post of mockPosts) {
    await prisma.competitorPost.upsert({
      where: { competitorProfileId_platformPostId: { competitorProfileId, platformPostId: post.platformPostId } },
      create: { competitorProfileId, ...post },
      update: { ...post },
    });
  }

  // Enqueue an analysis job for this competitor
  await competitorAnalysisQueue.add('analyze-competitor', { competitorProfileId });
}