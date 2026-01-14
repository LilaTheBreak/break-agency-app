import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { aiAgentQueue } from '../worker/queues';

const prisma = new PrismaClient();

// @desc    Get the latest weekly report for a user
// @route   GET /api/reports/:userId/weekly
export const getLatestWeeklyReport = asyncHandler(async (req: Request, res: Response) => {
  // TODO: CreatorWeeklyReport model not yet implemented in schema
  return res.status(501).json({ 
    message: 'Weekly reports feature not yet available',
    error: 'CreatorWeeklyReport model pending implementation'
  });
});

// @desc    Get all past weekly reports for a user
// @route   GET /api/reports/:userId/history
export const getReportHistory = asyncHandler(async (req: Request, res: Response) => {
  // TODO: CreatorWeeklyReport model not yet implemented in schema
  return res.status(501).json({ 
    message: 'Weekly report history not yet available',
    error: 'CreatorWeeklyReport model pending implementation',
    history: []
  });
});

// @desc    Manually trigger a weekly report generation
// @route   POST /api/reports/:userId/run
export const runReportGeneration = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  await aiAgentQueue.add("WEEKLY_REPORT", { userId });
  return res.status(202).json({ message: 'Weekly report generation has been queued.' });
});