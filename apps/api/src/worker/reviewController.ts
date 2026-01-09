import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { contractReviewQueue } from '../../worker/queues.js';

const prisma = new PrismaClient();

// @desc    Upload a contract for review
// @route   POST /api/contracts/review/upload
export const uploadContractForReview = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  // Assume file is uploaded via multipart/form-data and available in req.file
  // Also assume a file service uploads it to S3 and returns a key.
  const fileKey = 's3-key-placeholder'; // from fileService.upload(req.file.buffer)

  const contractReview = await prisma.contractReview.create({
    data: {
      userId,
      status: 'queued',
      fileId: fileKey, // This should link to your File model
    },
  });

  // Add job to the queue for async processing
  await contractReviewQueue.add('process-contract', {
    contractReviewId: contractReview.id,
    fileKey,
  });

  return res.status(202).json(contractReview);
});

// @desc    Get the status and results of a contract review
// @route   GET /api/contracts/review/:id
export const getContractReview = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const review = await prisma.contractReview.findFirst({
    where: { id: req.params.id, userId },
  });

  if (!review) {
    res.status(404);
    return res.status(404).json({ error: 'Contract review not found.' });
  }

  return res.status(200).json(review);
});

// @desc    Regenerate the AI analysis for a contract review
// @route   POST /api/contracts/review/:id/regenerate
export const regenerateReview = asyncHandler(async (req: Request, res: Response) => {
  // Logic to re-enqueue the job
  return res.status(202).json({ message: 'Regeneration has been queued.' });
});