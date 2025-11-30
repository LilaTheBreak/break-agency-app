import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { generateSnapshot } from '../services/talentHealth/healthEngine.js';

const router = Router();

/**
 * POST /api/talent-health/snapshot
 * Generates and stores a new health snapshot for a talent.
 */
router.post('/snapshot', async (req, res, next) => {
  const { talentId } = req.body; // In a real app, you'd get this from the user's session or permissions
  try {
    const snapshot = await generateSnapshot(talentId);
    res.status(201).json(snapshot);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/talent-health/summary
 * Retrieves the latest health snapshot for a talent.
 */
router.get('/summary', async (req, res, next) => {
  try {
    // Assuming a userId is available on req.user
    const userId = 'clxrz45gn000008l4hy285p0g'; // Mock user
    const latestSnapshot = await prisma.talentHealthSnapshot.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(latestSnapshot);
  } catch (error) {
    next(error);
  }
});

export default router;