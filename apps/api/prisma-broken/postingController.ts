import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { generatePostingPlan } from '../services/ai/postingSchedulerService';

const prisma = new PrismaClient();

// @desc    Generate a posting schedule for a deliverable
// @route   POST /api/posting/generate/:deliverableId
export const generateSchedule = asyncHandler(async (req: Request, res: Response) => {
  const { deliverableId } = req.params;
  const schedule = await generatePostingPlan(deliverableId);
  res.status(201).json(schedule);
});

// @desc    Get the posting schedule for a deliverable
// @route   GET /api/posting/:deliverableId
export const getSchedule = asyncHandler(async (req: Request, res: Response) => {
  const { deliverableId } = req.params;
  const schedule = await prisma.postingSchedule.findMany({
    where: { deliverableId },
    orderBy: { scheduledAt: 'asc' },
  });
  res.status(200).json(schedule);
});

// @desc    Cancel a scheduled post
// @route   POST /api/posting/cancel/:scheduleId
export const cancelSchedule = asyncHandler(async (req: Request, res: Response) => {
  const { scheduleId } = req.params;
  const updatedSchedule = await prisma.postingSchedule.update({
    where: { id: scheduleId },
    data: { status: 'cancelled' },
  });
  res.status(200).json(updatedSchedule);
});

// @desc    Force publish a scheduled post now
// @route   POST /api/posting/publish-now/:scheduleId
export const publishNow = asyncHandler(async (req: Request, res: Response) => {
  // In a real app, this would trigger an immediate job for a single post.
  // For this mock, we'll just update the time to now and let the worker pick it up.
  const updatedSchedule = await prisma.postingSchedule.update({
    where: { id: req.params.scheduleId },
    data: { scheduledAt: new Date() },
  });
  res.status(200).json({ message: 'Post queued for immediate publishing.', schedule: updatedSchedule });
});