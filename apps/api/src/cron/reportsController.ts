import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { aiAgentQueue } from '../worker/queues';

const prisma = new PrismaClient();

// @desc    Get the latest weekly report for a user
// @route   GET /api/reports/:userId/weekly
export const getLatestWeeklyReport = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const report = await prisma.creatorWeeklyReport.findFirst({
    where: { userId },
    orderBy: { weekEnd: 'desc' },
  });

  if (!report) {
    res.status(404).json({ message: 'No weekly report found for this user.' });
  } else {
    res.status(200).json(report);
  }
});

// @desc    Get all past weekly reports for a user
// @route   GET /api/reports/:userId/history
export const getReportHistory = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const history = await prisma.creatorWeeklyReport.findMany({
    where: { userId },
    orderBy: { weekEnd: 'desc' },
    select: { id: true, weekEnd: true, healthScore: true, grade: true },
  });
  res.status(200).json(history);
});

// @desc    Manually trigger a weekly report generation
// @route   POST /api/reports/:userId/run
export const runReportGeneration = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  await aiAgentQueue.add("WEEKLY_REPORT", { userId });
  res.status(202).json({ message: 'Weekly report generation has been queued.' });
});