import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { creativeConceptQueue } from '../worker/queues/creativeConceptQueue.js';

const router = Router();

/**
 * POST /api/deliverables/:id/concepts/generate
 * Triggers the AI creative concept generation pipeline.
 */
router.post('/:id/concepts/generate', async (req, res) => {
  const { id } = req.params;
  const { platform, options } = req.body;
  await creativeConceptQueue.add('generate-concept', { deliverableId: id, platform, options });
  res.status(202).json({ message: 'AI creative concept generation has been queued.' });
});

/**
 * GET /api/deliverables/:id/concepts
 * Fetches all creative concepts for a deliverable.
 */
router.get('/:id/concepts', async (req, res, next) => {
  try {
    const concepts = await prisma.creativeConcept.findMany({ where: { deliverableId: req.params.id }, orderBy: { createdAt: 'desc' } });
    res.json(concepts);
  } catch (error) {
    next(error);
  }
});

export default router;