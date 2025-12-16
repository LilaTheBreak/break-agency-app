import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { creativeConceptQueue } from '../worker/queues'; // Assuming this queue is created

const prisma = new PrismaClient();

// @desc    Queue a job to generate a creative package
// @route   POST /api/creative/generate/:deliverableId
export const generateCreative = asyncHandler(async (req: Request, res: Response) => {
  const { deliverableId } = req.params;
  const userId = req.user!.id;

  // Check if deliverable exists
  const deliverable = await prisma.deliverableItem.findUnique({ where: { id: deliverableId } });
  if (!deliverable) {
    res.status(404);
    throw new Error('Deliverable not found.');
  }

  await creativeConceptQueue.add('generate-creative', { deliverableId, userId });

  res.status(202).json({ message: 'Creative package generation has been queued.' });
});

// @desc    Get the generated creative output for a deliverable
// @route   GET /api/creative/output/:deliverableId
export const getCreative = asyncHandler(async (req: Request, res: Response) => {
  const { deliverableId } = req.params;

  const output = await prisma.creativeAIOutput.findUnique({
    where: { deliverableId },
  });

  if (!output) {
    res.status(404);
    throw new Error('No creative output found. Please generate it first.');
  }

  res.status(200).json(output);
});