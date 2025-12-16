import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { createVersion, rollbackToVersion } from '../services/ai/creativeVersionService';

const prisma = new PrismaClient();

// @desc    Create a new version for an asset
// @route   POST /api/creative-versions/create
export const createAssetVersion = asyncHandler(async (req: Request, res: Response) => {
  const { assetId, assetType, content, metadata } = req.body;
  const userId = req.user!.id;

  const newVersion = await createVersion({ assetId, assetType, content, metadata, userId });
  res.status(201).json(newVersion);
});

// @desc    Get the version history for an asset
// @route   GET /api/creative-versions/history/:assetId
export const getVersionHistory = asyncHandler(async (req: Request, res: Response) => {
  const { assetId } = req.params;
  const history = await prisma.creativeVersion.findMany({
    where: { assetId },
    orderBy: { version: 'desc' },
    include: { createdBy: { select: { name: true, avatarUrl: true } } },
  });
  res.status(200).json(history);
});

// @desc    Get a specific version of an asset
// @route   GET /api/creative-versions/version/:assetId/:version
export const getSpecificVersion = asyncHandler(async (req: Request, res: Response) => {
  const { assetId, version } = req.params;
  const versionData = await prisma.creativeVersion.findUnique({
    where: { assetId_version: { assetId, version: parseInt(version, 10) } },
  });
  if (!versionData) {
    res.status(404);
    throw new Error('Version not found.');
  }
  res.status(200).json(versionData);
});

// @desc    Roll back an asset to a specific version
// @route   POST /api/creative-versions/rollback
export const rollbackVersion = asyncHandler(async (req: Request, res: Response) => {
  const { assetId, version } = req.body;
  const userId = req.user!.id;

  if (!assetId || !version) {
    res.status(400);
    throw new Error('assetId and version are required.');
  }

  const newVersion = await rollbackToVersion(assetId, parseInt(version, 10), userId);
  res.status(201).json({ message: 'Rollback successful. New version created.', newVersion });
});