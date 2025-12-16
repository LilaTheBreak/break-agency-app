import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { storyboardQueue } from '../worker/queues'; // Assuming this queue is created

const prisma = new PrismaClient();

// @desc    Queue a job to generate a storyboard
// @route   POST /api/storyboard/generate/:deliverableId
export const generateStoryboard = asyncHandler(async (req: Request, res: Response) => {
  const { deliverableId } = req.params;

  // Check if deliverable exists
  const deliverable = await prisma.deliverableItem.findUnique({ where: { id: deliverableId } });
  if (!deliverable) {
    res.status(404).throw(new Error('Deliverable not found.'));
  }

  await storyboardQueue.add('generate-storyboard', { deliverableId });

  res.status(202).json({ message: 'Storyboard generation has been queued.' });
});

// @desc    Get the generated storyboard for a deliverable
// @route   GET /api/storyboard/:deliverableId
export const getStoryboard = asyncHandler(async (req: Request, res: Response) => {
  const { deliverableId } = req.params;

  const storyboard = await prisma.storyboard.findUnique({
    where: { deliverableId },
    include: { frames: { orderBy: { frameNumber: 'asc' } } },
  });

  if (!storyboard) {
    res.status(404).json({ error: 'No storyboard found. Please generate one first.' });
  } else {
    res.status(200).json(storyboard);
  }
});