import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { runDeliverableReview } from '../services/ai/deliverableReviewService';

const prisma = new PrismaClient();

// @desc    Submit a deliverable for AI review
// @route   POST /api/deliverables/:id/review
export const submitForReview = asyncHandler(async (req: Request, res: Response) => {
  const deliverableId = req.params.id;
  // In a real app, you'd handle file upload to S3 here and get a URL
  const { fileUrl } = req.body;

  const deliverable = await prisma.deliverable.update({
    where: { id: deliverableId },
    data: { status: 'submitted', proofFileId: fileUrl, submittedAt: new Date() },
    include: { campaign: true },
  });

  if (!deliverable.campaign) {
    res.status(400);
    throw new Error('Deliverable is not linked to a valid campaign.');
  }

  // Trigger async AI review (could be a queue job)
  const reviewId = await runDeliverableReview(deliverable, deliverable.campaign);

  res.status(202).json({ message: 'Deliverable submitted for AI review.', reviewId });
});

// @desc    Get the AI review for a deliverable
// @route   GET /api/deliverables/:id/review
export const getReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await prisma.deliverableReview.findUnique({
    where: { deliverableId: req.params.id },
  });

  if (!review) {
    res.status(404);
    throw new Error('No review found for this deliverable.');
  }

  res.status(200).json(review);
});

// @desc    Approve a deliverable
// @route   POST /api/deliverables/:id/approve
export const approveDeliverable = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.deliverable.update({
    where: { id },
    data: { status: 'approved', approvedAt: new Date() },
  });
  const review = await prisma.deliverableReview.update({
    where: { deliverableId: id },
    data: { status: 'approved' },
  });
  res.status(200).json(review);
});

// @desc    Request changes for a deliverable
// @route   POST /api/deliverables/:id/request-changes
export const requestChanges = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { feedback } = req.body;
  await prisma.deliverable.update({
    where: { id },
    data: { status: 'needs_changes', notes: feedback },
  });
  const review = await prisma.deliverableReview.update({
    where: { deliverableId: id },
    data: { status: 'needs_changes' },
  });
  res.status(200).json(review);
});