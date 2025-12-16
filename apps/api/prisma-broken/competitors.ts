import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { competitorDiscoveryQueue } from '../worker/queues/competitorQueues.js';

const router = Router();
const MOCK_USER_ID = 'clxrz45gn000008l4hy285p0g'; // Mock user for demonstration

/**
 * POST /api/competitors/discover
 * Triggers the auto-discovery process for the current user.
 */
router.post('/discover', async (req, res) => {
  await competitorDiscoveryQueue.add('discover', { userId: MOCK_USER_ID });
  res.status(202).json({ message: 'Competitor discovery process has been started.' });
});

/**
 * GET /api/competitors/:userId
 * Fetches all discovered competitors for a given user.
 */
router.get('/:userId', async (req, res, next) => {
  try {
    const competitors = await prisma.competitorProfile.findMany({
      where: { userId: req.params.userId },
    });
    res.json(competitors);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/competitors/:id/posts
 * Fetches all scraped posts for a specific competitor.
 */
router.get('/:id/posts', async (req, res) => {
  const posts = await prisma.competitorPost.findMany({ where: { competitorProfileId: req.params.id } });
  res.json(posts);
});

export default router;