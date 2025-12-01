import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../../middleware/asyncHandler';
import { analyzeContent } from '../../services/ai/content/contentAnalysisService';

const prisma = new PrismaClient();

// @desc    Analyze a piece of content
// @route   POST /api/content/analyze
export const runContentAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { platform, caption, hook, thumbnailUrl } = req.body;

  // In a real app, you might use a queue for heavy analysis.
  // For now, we process it directly.
  const analysisId = await analyzeContent({ userId, platform, caption, hook, thumbnailUrl });

  const result = await prisma.contentAnalysis.findUnique({ where: { id: analysisId } });

  res.status(201).json(result);
});

// @desc    Get analysis history for the user
// @route   GET /api/content/history
export const getAnalysisHistory = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const history = await prisma.contentAnalysis.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  res.status(200).json(history);
});

// @desc    Get a single analysis by ID
// @route   GET /api/content/:id
export const getAnalysisById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const analysis = await prisma.contentAnalysis.findFirst({
    where: { id: req.params.id, userId },
  });
  if (!analysis) {
    res.status(404);
    throw new Error('Analysis not found');
  }
  res.status(200).json(analysis);
});

// @desc    Delete an analysis record
// @route   DELETE /api/content/:id
export const deleteAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  await prisma.contentAnalysis.deleteMany({ where: { id: req.params.id, userId } });
  res.status(204).send();
});