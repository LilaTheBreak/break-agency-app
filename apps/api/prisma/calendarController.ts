import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { autoSchedulePost } from '../services/ai/schedulingService';

const prisma = new PrismaClient();

// @desc    Auto-schedule a posting slot for a deliverable
// @route   POST /api/calendar/auto-schedule/:deliverableId
export const generateSlot = asyncHandler(async (req: Request, res: Response) => {
  const deliverable = await prisma.deliverable.findUnique({
    where: { id: req.params.deliverableId },
  });
  if (!deliverable) {
    res.status(404);
    throw new Error('Deliverable not found.');
  }
  const slot = await autoSchedulePost(deliverable);
  res.status(201).json(slot);
});

// @desc    Get all posting slots with filters
// @route   GET /api/calendar/slots
export const getSlots = asyncHandler(async (req: Request, res: Response) => {
  const { userId, platform, status, startDate, endDate } = req.query;
  const where: any = {};

  if (userId) where.userId = userId as string;
  if (platform) where.platform = platform as any;
  if (status) where.status = status as string;
  if (startDate && endDate) {
    where.scheduledFor = {
      gte: new Date(startDate as string),
      lt: new Date(endDate as string),
    };
  }

  // Role-based filtering would be applied here based on req.user

  const slots = await prisma.postingSlot.findMany({
    where,
    include: { deliverable: { select: { title: true } }, user: { select: { name: true } } },
    orderBy: { scheduledFor: 'asc' },
  });
  res.status(200).json(slots);
});

// @desc    Manually schedule or approve a slot
// @route   POST /api/calendar/slots/:slotId/schedule
export const scheduleSlot = asyncHandler(async (req: Request, res: Response) => {
  const { scheduledFor } = req.body;
  const slot = await prisma.postingSlot.update({
    where: { id: req.params.slotId },
    data: { status: 'scheduled', scheduledFor: scheduledFor || undefined },
  });
  res.status(200).json(slot);
});

// @desc    Approve a scheduled slot
// @route   POST /api/calendar/slots/:slotId/approve
export const approveSlot = asyncHandler(async (req: Request, res: Response) => {
  const slot = await prisma.postingSlot.update({
    where: { id: req.params.slotId },
    data: { status: 'approved' },
  });
  res.status(200).json(slot);
});

// @desc    Mark a slot as posted
// @route   POST /api/calendar/slots/:slotId/mark-posted
export const markAsPosted = asyncHandler(async (req: Request, res: Response) => {
  const slot = await prisma.postingSlot.update({
    where: { id: req.params.slotId },
    data: { status: 'posted', postedAt: new Date() },
  });
  res.status(200).json(slot);
});