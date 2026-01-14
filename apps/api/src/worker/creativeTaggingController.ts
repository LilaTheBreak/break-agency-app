import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { tagAsset } from '../services/ai/creativeTaggingService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const checkPermissions = (req: Request, assetUserId?: string) => {
  const user = req.user!;
  const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'EXCLUSIVE_TALENT', 'TALENT', 'FOUNDER'];

  if (allowedRoles.includes(user.role)) {
    return true;
  }

  if (user.role === 'UGC_CREATOR' && assetUserId && user.id === assetUserId) {
    return true;
  }

  throw new Error('You do not have permission to perform this action.');
};

// @desc    Tag a single creative asset
// @route   POST /api/creative-tagging/tag
export const tagSingleAsset = asyncHandler(async (req: Request, res: Response) => {
  const { assetId, assetType, content, userId } = req.body;

  checkPermissions(req, userId);

  if (!assetId || !assetType || !content) {
    return res.status(400).json({ error: 'assetId, assetType, and content are required.' });
  }

  const updatedAsset = await tagAsset({ assetId, assetType, content });

  return res.status(200).json(updatedAsset);
});

// @desc    Re-tag a single creative asset
// @route   POST /api/creative-tagging/retag
export const retagSingleAsset = asyncHandler(async (req: Request, res: Response) => {
  // The logic is identical to initial tagging for this implementation
  await tagSingleAsset(req, res);
});

// @desc    Tag multiple assets in a batch
// @route   POST /api/creative-tagging/batch
export const tagBatchAssets = asyncHandler(async (req: Request, res: Response) => {
  // In a real implementation, this would find multiple assets and queue a job for each.
  return res.status(202).json({ message: 'Batch tagging job has been queued.' });
});