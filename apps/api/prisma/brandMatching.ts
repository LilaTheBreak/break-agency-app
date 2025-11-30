import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { computeBrandMatch, generateRecommendations } from '../services/brandMatching/matchEngine.js';

const router = Router();

/**
 * POST /api/brand-matching/run
 * Runs the matching engine for a specific creator and brand.
 */
router.post('/run', async (req, res, next) => {
  const { creatorId, brandName } = req.body;
  try {
    const result = await computeBrandMatch(creatorId, brandName);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/brand-matching/top
 * Gets the top-scoring brand matches for a creator.
 */
router.get('/top', async (req, res, next) => {
  const userId = 'clxrz45gn000008l4hy285p0g'; // Mock user
  try {
    const topMatches = await prisma.brandMatchScore.findMany({
      where: { userId },
      orderBy: { fitScore: 'desc' },
      take: 10,
    });
    res.json(topMatches);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/brand-matching/recommend-for-creator
 * Generates a new set of smart deal recommendations.
 */
router.post('/recommend-for-creator', async (req, res, next) => {
  const { creatorId } = req.body;
  try {
    const recommendations = await generateRecommendations(creatorId);
    res.status(201).json(recommendations);
  } catch (error) {
    next(error);
  }
});

export default router;