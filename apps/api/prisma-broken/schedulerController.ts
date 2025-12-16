import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import {
  createScheduledPost,
  updateScheduledPost,
  cancelScheduledPost,
  fetchRecommendedPostTime,
} from '../services/schedulerService';

const prisma = new PrismaClient();

// @desc    Schedule a new post
// @route   POST /api/schedule
export const schedulePost = asyncHandler(async (req: Request, res: Response) => {
  const postData = { ...req.body, talentId: req.user!.id };
  const post = await createScheduledPost(postData);
  res.status(201).json(post);
});

// @desc    Update a scheduled post
// @route   PUT /api/schedule/:id
export const updatePost = asyncHandler(async (req: Request, res: Response) => {
  const post = await updateScheduledPost(req.params.id, req.body);
  res.status(200).json(post);
});

// @desc    Cancel a scheduled post
// @route   DELETE /api/schedule/:id
export const cancelPost = asyncHandler(async (req: Request, res: Response) => {
  await cancelScheduledPost(req.params.id);
  res.status(204).send();
});

// @desc    Get all scheduled posts for a user
// @route   GET /api/schedule/user/:userId
export const getUserSchedule = asyncHandler(async (req: Request, res: Response) => {
  // Add permission check: user can see their own, admin can see all
  const schedule = await prisma.scheduledPost.findMany({
    where: { talentId: req.params.userId },
    orderBy: { scheduledAt: 'asc' },
  });
  res.status(200).json(schedule);
});

// @desc    Get AI recommendation for posting time
// @route   GET /api/schedule/recommendation/:userId
export const getRecommendation = asyncHandler(async (req: Request, res: Response) => {
  const recommendation = await fetchRecommendedPostTime(req.params.userId);
  res.status(200).json(recommendation);
});