import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { thumbnailQueue } from '../worker/queues'; // Assuming this queue is created

const prisma = new PrismaClient();

// @desc    Queue a job to generate thumbnails for a deliverable
// @route   POST /api/thumbnails/generate/:deliverableId
export const generateThumbnails = asyncHandler(async (req: Request, res: Response) => {
  const { deliverableId } = req.params;
  const userId = req.user!.id;

  // Check if deliverable exists
  const deliverable = await prisma.deliverableItem.findUnique({ where: { id: deliverableId } });
  if (!deliverable) {
    res.status(404).throw(new Error('Deliverable not found.'));
  }

  await thumbnailQueue.add('generate-thumbnails', { deliverableId, userId });

  res.status(202).json({ message: 'Thumbnail generation has been queued.' });
});

// @desc    Get the generated thumbnails for a deliverable
// @route   GET /api/thumbnails/:deliverableId
export const getThumbnails = asyncHandler(async (req: Request, res: Response) => {
  const { deliverableId } = req.params;

  const thumbnails = await prisma.thumbnailGeneration.findUnique({
    where: { deliverableId },
  });

  if (!thumbnails) {
    res.status(404).json({ error: 'No thumbnails found. Please generate them first.' });
  } else {
    res.status(200).json(thumbnails);
  }
});