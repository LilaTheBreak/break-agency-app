import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { contentPlanQueue } from '../worker/queues/contentPlanQueue.js';

const router = Router();

/**
 * POST /api/content-planner/create
 * Triggers the AI content plan generation from a concept.
 */
router.post('/create', async (req, res) => {
  const { conceptId } = req.body;
  await contentPlanQueue.add('build-plan', { conceptId });
  res.status(202).json({ message: 'AI content plan generation has been queued.' });
});

/**
 * GET /api/content-planner/:id
 * Fetches a content item and its versions.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const contentItem = await prisma.contentItem.findUnique({ where: { id: req.params.id }, include: { versions: { orderBy: { versionNumber: 'desc' } } } });
    res.json(contentItem);
  } catch (error) {
    next(error);
  }
});

export default router;