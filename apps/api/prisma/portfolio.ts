import { Router } from 'express';
import prisma from '../../lib/prisma.js';

const router = Router();

// Middleware to get userId from session/token would be here
const getUserId = () => 'some_ugc_user_id'; // Mock

/**
 * GET /api/ugc/portfolio/me
 * Fetches the portfolio for the currently authenticated UGC creator.
 */
router.get('/portfolio/me', async (req, res, next) => {
  try {
    const userId = getUserId();
    const portfolio = await prisma.uGCPortfolio.findUnique({ where: { userId } });
    res.json(portfolio);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ugc/portfolio
 * Creates or updates the portfolio for the currently authenticated UGC creator.
 */
router.post('/portfolio', async (req, res, next) => {
  try {
    const userId = getUserId();
    const { bio, categories, sampleLinks } = req.body;
    const portfolio = await prisma.uGCPortfolio.upsert({
      where: { userId },
      create: { userId, bio, categories, sampleLinks },
      update: { bio, categories, sampleLinks },
    });
    res.status(201).json(portfolio);
  } catch (error) {
    next(error);
  }
});

export default router;