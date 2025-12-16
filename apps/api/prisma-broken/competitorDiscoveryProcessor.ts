import type { Job } from 'bullmq';
import prisma from '../../lib/prisma.js';
import { competitorScrapeQueue } from '../queues/competitorQueues.js';

/**
 * "Discovers" competitors for a given user.
 * This is a stub for a more complex AI-driven discovery process.
 */
export default async function competitorDiscoveryProcessor(job: Job<{ userId: string }>) {
  const { userId } = job.data;
  console.log(`[WORKER] Discovering competitors for user: ${userId}`);

  // Mocked discovery
  const mockCompetitors = [
    { username: 'competitor_a', platform: 'INSTAGRAM' },
    { username: 'competitor_b', platform: 'INSTAGRAM' },
  ];

  for (const comp of mockCompetitors) {
    const profile = await prisma.competitorProfile.upsert({
      where: { userId_platform_username: { userId, ...comp } },
      create: { userId, ...comp },
      update: {},
    });

    // Enqueue a scrape job for the newly discovered competitor
    await competitorScrapeQueue.add('scrape-competitor', { competitorProfileId: profile.id });
  }
}