import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { requestReview } from '../services/ai/creativeReviewService';

const prisma = new PrismaClient();

// @desc    Request a review for a creative asset
// @route   POST /api/creative-review/request
export const createReviewRequest = asyncHandler(async (req: Request, res: Response) => {
  const { assetId, assetType, version } = req.body;
  const requesterId = req.user!.id;

  const review = await requestReview(assetId, assetType, version, requesterId);
  res.status(201).json(review);
});

// @desc    Get all reviews for a specific asset
// @route   GET /api/creative-review/:assetId
export const getAssetReviews = asyncHandler(async (req: Request, res: Response) => {
  const { assetId } = req.params;
  const reviews = await prisma.creativeReview.findMany({
    where: { assetId },
    include: {
      comments: {
        include: {
          author: { select: { name: true, avatarUrl: true } },
          replies: { include: { author: { select: { name: true, avatarUrl: true } } } },
        },
        orderBy: { createdAt: 'asc' },
      },
      requester: { select: { name: true } },
    },
    orderBy: { version: 'desc' },
  });
  res.status(200).json(reviews);
});

// @desc    Approve a creative review
// @route   POST /api/creative-review/:reviewId/approve
export const approveCreative = asyncHandler(async (req: Request, res: Response) => {
  const { reviewId } = req.params;
  const review = await prisma.creativeReview.update({
    where: { id: reviewId },
    data: { status: 'approved', reviewerId: req.user!.id },
  });
  res.status(200).json(review);
});

// @desc    Request changes on a creative review
// @route   POST /api/creative-review/:reviewId/request-changes
export const requestCreativeChanges = asyncHandler(async (req: Request, res: Response) => {
  const { reviewId } = req.params;
  const { message } = req.body;

  const review = await prisma.creativeReview.update({
    where: { id: reviewId },
    data: {
      status: 'changes_requested',
      reviewerId: req.user!.id,
      comments: {
        create: { authorId: req.user!.id, message },
      },
    },
  });
  res.status(200).json(review);
});

// @desc    Add a comment to a review
// @route   POST /api/creative-review/:reviewId/comment
export const addReviewComment = asyncHandler(async (req: Request, res: Response) => {
  const { reviewId } = req.params;
  const { message } = req.body;

  const comment = await prisma.creativeComment.create({
    data: {
      reviewId,
      authorId: req.user!.id,
      message,
    },
  });
  res.status(201).json(comment);
});

// @desc    Resolve a comment thread
// @route   POST /api/creative-review/comment/:commentId/resolve
export const resolveReviewComment = asyncHandler(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const comment = await prisma.creativeComment.update({
    where: { id: commentId },
    data: { resolved: true, resolvedById: req.user!.id },
  });
  res.status(200).json(comment);
});