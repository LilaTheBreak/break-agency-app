import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../../middleware/asyncHandler';
import { generateTimelineFromBundle } from '../../services/ai/timelineBuilderService';

const prisma = new PrismaClient();

// @desc    Generate a timeline from a creator bundle
// @route   POST /api/ai/campaign/timeline/generate/:bundleId
export const generateTimeline = asyncHandler(async (req: Request, res: Response) => {
  const { bundleId } = req.params;
  const bundle = await prisma.creatorBundle.findUnique({ where: { id: bundleId } });

  if (!bundle) {
    res.status(404);
    throw new Error('Creator bundle not found.');
  }

  const planWithTimeline = await generateTimelineFromBundle(bundle);
  res.status(201).json(planWithTimeline);
});

// @desc    Get the timeline for a campaign (via its plan)
// @route   GET /api/campaigns/:id/timeline
export const getTimeline = asyncHandler(async (req: Request, res: Response) => {
  // Assuming campaignId is the briefId for simplicity
  const plan = await prisma.campaignAutoPlan.findFirst({
    where: { briefId: req.params.id },
    include: { timelineItems: { orderBy: { sequence: 'asc' } } },
  });

  if (!plan) {
    res.status(404);
    throw new Error('No timeline found for this campaign.');
  }

  res.status(200).json(plan.timelineItems);
});

// @desc    Update a timeline item
// @route   PATCH /api/campaigns/timeline/:timelineItemId
export const updateTimelineItem = asyncHandler(async (req: Request, res: Response) => {
  const { timelineItemId } = req.params;
  const { status, dueDate } = req.body;
  const item = await prisma.campaignTimelineItem.update({
    where: { id: timelineItemId },
    data: { status, dueDate },
  });
  res.status(200).json(item);
});

// @desc    Mark a timeline item as complete
// @route   POST /api/campaigns/timeline/:timelineItemId/complete
export const completeTimelineItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await prisma.campaignTimelineItem.update({
    where: { id: req.params.timelineItemId },
    data: { status: 'done' },
  });
  res.status(200).json(item);
});