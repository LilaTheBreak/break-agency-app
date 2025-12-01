import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { generateAIPrediction } from '../services/ai/predictionService';

const prisma = new PrismaClient();

// @desc    Generate a new performance prediction for a deliverable
// @route   POST /api/predictions/generate
export const generatePrediction = asyncHandler(async (req: Request, res: Response) => {
  const { deliverableId } = req.body;
  const userId = req.user!.id;

  if (!deliverableId) {
    res.status(400).json({ error: 'deliverableId is required.' });
  }

  const prediction = await generateAIPrediction(deliverableId, userId);
  res.status(201).json(prediction);
});

// @desc    Get all predictions for a specific deliverable
// @route   GET /api/predictions/deliverable/:deliverableId
export const getPredictionsForDeliverable = asyncHandler(async (req: Request, res: Response) => {
  const { deliverableId } = req.params;
  const predictions = await prisma.aIPrediction.findMany({
    where: { deliverableId },
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json(predictions);
});

// @desc    Get all predictions for a user
// @route   GET /api/predictions/user/:userId
export const getPredictionsForUser = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  // Add permission check to ensure user can view these predictions
  if (req.user!.id !== userId && req.user!.role !== 'ADMIN' && req.user!.role !== 'SUPER_ADMIN') {
    res.status(403).json({ error: 'Permission denied.' });
  }
  const predictions = await prisma.aIPrediction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.status(200).json(predictions);
});