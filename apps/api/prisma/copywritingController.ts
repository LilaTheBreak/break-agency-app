import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { generateCopy } from '../services/ai/copywritingService';

const prisma = new PrismaClient();

// @desc    Generate copy for a deliverable
// @route   POST /api/copy/generate/:deliverableId
export const generateCopyForDeliverable = asyncHandler(async (req: Request, res: Response) => {
  const deliverable = await prisma.deliverable.findUnique({
    where: { id: req.params.deliverableId },
  });

  if (!deliverable) {
    res.status(404);
    throw new Error('Deliverable not found.');
  }

  // Add permission check here based on req.user.role

  const copy = await generateCopy(deliverable);
  res.status(201).json(copy);
});

// @desc    Get generated copy for a deliverable
// @route   GET /api/copy/:deliverableId
export const getGeneratedCopy = asyncHandler(async (req: Request, res: Response) => {
  const copy = await prisma.generatedCopy.findFirst({
    where: { deliverableId: req.params.deliverableId },
    orderBy: { createdAt: 'desc' },
  });

  if (!copy) {
    res.status(404);
    throw new Error('No copy has been generated for this deliverable yet.');
  }

  res.status(200).json(copy);
});

// @desc    Update generated copy
// @route   POST /api/copy/:copyId/update
export const updateCopy = asyncHandler(async (req: Request, res: Response) => {
  const { copyId } = req.params;
  const data = req.body;

  // Add permission check here

  const updatedCopy = await prisma.generatedCopy.update({
    where: { id: copyId },
    data,
  });

  res.status(200).json(updatedCopy);
});

// @desc    Regenerate copy
// @route   POST /api/copy/:copyId/regenerate
export const regenerateCopy = asyncHandler(async (req: Request, res: Response) => {
  const originalCopy = await prisma.generatedCopy.findUnique({
    where: { id: req.params.copyId },
    include: { deliverable: true },
  });
  if (!originalCopy) throw new Error('Original copy not found.');

  const newCopy = await generateCopy(originalCopy.deliverable);
  res.status(201).json(newCopy);
});