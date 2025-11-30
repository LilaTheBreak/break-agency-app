import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { generateTimelineForDeliverable } from '../services/timeline/timelineEngine.js';

const router = Router();

/**
 * POST /api/timeline/generate
 * Generates a new timeline for a deliverable.
 */
router.post('/generate', async (req, res, next) => {
  const { deliverableId } = req.body;
  if (!deliverableId) {
    return res.status(400).json({ error: 'deliverableId is required.' });
  }
  try {
    const timeline = await generateTimelineForDeliverable(deliverableId);
    res.status(201).json(timeline);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/timeline/:deliverableId
 * Fetches the timeline for a specific deliverable.
 */
router.get('/:deliverableId', async (req, res, next) => {
  const { deliverableId } = req.params;
  try {
    const timelineSteps = await prisma.deliverableTimeline.findMany({
      where: { deliverableId },
      orderBy: { startDate: 'asc' },
    });
    res.json(timelineSteps);
  } catch (error) {
    next(error);
  }
});

export default router;