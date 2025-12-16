import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { hashtagQueue } from '../worker/queues'; // Assuming this queue is created

const prisma = new PrismaClient();

// @desc    Queue a job to generate hashtags for a deliverable
// @route   POST /api/hashtags/generate/:deliverableId
export const generateHashtags = asyncHandler(async (req: Request, res: Response) => {
  const { deliverableId } = req.params;

  // Check if deliverable exists
  const deliverable = await prisma.deliverableItem.findUnique({ where: { id: deliverableId } });
  if (!deliverable) {
    res.status(404).throw(new Error('Deliverable not found.'));
  }

  await hashtagQueue.add('generate-hashtags', { deliverableId });

  res.status(202).json({ message: 'Hashtag generation has been queued.' });
});

// @desc    Get the generated hashtag sets for a deliverable
// @route   GET /api/hashtags/:deliverableId
export const getHashtags = asyncHandler(async (req: Request, res: Response) => {
  const { deliverableId } = req.params;

  const hashtagSets = await prisma.hashtagSet.findMany({
    where: { deliverableId },
    orderBy: { createdAt: 'desc' },
  });

  if (!hashtagSets || hashtagSets.length === 0) {
    res.status(404).json({ error: 'No hashtags found. Please generate them first.' });
  } else {
    res.status(200).json(hashtagSets);
  }
});

// @desc    Select a final set of hashtags for a HashtagSet
// @route   POST /api/hashtags/select/:hashtagSetId
export const selectFinalHashtags = asyncHandler(async (req: Request, res: Response) => {
  const { hashtagSetId } = req.params;
  const { finalSet } = req.body;

  if (!Array.isArray(finalSet)) {
    res.status(400).json({ error: 'finalSet must be an array of strings.' });
  }

  const updatedSet = await prisma.hashtagSet.update({
    where: { id: hashtagSetId },
    data: { finalSet },
  });

  res.status(200).json(updatedSet);
});