import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';

const prisma = new PrismaClient();

// @desc    Get all algorithm alerts for the authenticated user
// @route   GET /api/alerts/algorithm
export const getAlgorithmAlerts = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const alerts = await prisma.algorithmAlert.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json(alerts);
});

// @desc    Get a single algorithm alert by ID
// @route   GET /api/alerts/algorithm/:alertId
export const getAlgorithmAlertById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { alertId } = req.params;
  const alert = await prisma.algorithmAlert.findFirst({
    where: { id: alertId, userId },
  });
  if (!alert) {
    res.status(404);
    throw new Error('Alert not found');
  }
  res.status(200).json(alert);
});

// @desc    Delete (or mark as read) an algorithm alert
// @route   DELETE /api/alerts/algorithm/:alertId
export const deleteAlgorithmAlert = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { alertId } = req.params;
  // Ensures user can only delete their own alerts
  await prisma.algorithmAlert.deleteMany({ where: { id: alertId, userId } });
  res.status(204).send();
});