/**
 * Owned Assets & IP Hub API Routes
 * 
 * GET    /api/owned-assets/:talentId             - List all assets
 * POST   /api/owned-assets/:talentId             - Create asset
 * PUT    /api/owned-assets/:assetId              - Update asset
 * DELETE /api/owned-assets/:assetId              - Delete asset
 * GET    /api/owned-assets/:talentId/inventory  - Full IP inventory
 */

import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { checkTalentAccess } from '../middleware/talentAccess.js';

const router = Router();

/**
 * List all owned assets for a talent
 */
router.get('/:talentId', requireAuth, checkTalentAccess, async (req, res) => {
  try {
    const { talentId } = req.params;
    const { type } = req.query;

    const where: any = { talentId };
    if (type) {
      where.type = type;
    }

    const assets = await prisma.ownedAsset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: assets,
      count: assets.length,
    });
  } catch (error) {
    console.error('Error listing owned assets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list owned assets',
    });
  }
});

/**
 * Get full IP inventory for a talent
 */
router.get('/:talentId/inventory', requireAuth, checkTalentAccess, async (req, res) => {
  try {
    const { talentId } = req.params;

    const assets = await prisma.ownedAsset.findMany({
      where: { talentId },
    });

    // Organize by type
    const inventory: any = {};
    const assetTypes = ['EMAIL_LIST', 'COMMUNITY', 'COURSE', 'SAAS', 'DOMAIN', 'TRADEMARK', 'DATA', 'OTHER'];

    for (const type of assetTypes) {
      inventory[type] = assets.filter((a) => a.type === type);
    }

    // Calculate totals
    const totalValue = assets.reduce((sum, a) => sum + Number(a.estimatedValue || 0), 0);
    const totalRevenue = assets.reduce((sum, a) => sum + Number(a.revenueGeneratedAnnual || 0), 0);
    const protectedAssets = assets.filter((a) => a.legalStatus === 'PROTECTED').length;
    const revenueGenerating = assets.filter((a) => Number(a.revenueGeneratedAnnual) > 0).length;

    res.json({
      success: true,
      data: {
        inventory,
        summary: {
          totalAssets: assets.length,
          totalEstimatedValue: totalValue,
          totalAnnualRevenue: totalRevenue,
          protectedAssets,
          revenueGeneratingAssets: revenueGenerating,
          avgScalabilityScore: assets.length > 0
            ? Math.round(assets.reduce((sum, a) => sum + a.scalabilityScore, 0) / assets.length)
            : 0,
        },
      },
    });
  } catch (error) {
    console.error('Error getting IP inventory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get IP inventory',
    });
  }
});

/**
 * Create new owned asset
 */
router.post('/:talentId', requireAuth, checkTalentAccess, async (req, res) => {
  try {
    const { talentId } = req.params;
    const {
      name,
      type,
      description,
      ownershipStatus,
      legalStatus,
      transferableIndependently,
      revenueGeneratedAnnual,
      growthRatePercent,
      scalabilityScore,
      estimatedValue,
      notes,
    } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: 'Name and type are required',
      });
    }

    const asset = await prisma.ownedAsset.create({
      data: {
        talentId,
        name,
        type,
        description,
        ownershipStatus: ownershipStatus || 'OWNED',
        legalStatus: legalStatus || 'UNPROTECTED',
        transferableIndependently: transferableIndependently !== false,
        revenueGeneratedAnnual: revenueGeneratedAnnual || 0,
        growthRatePercent: growthRatePercent || 0,
        scalabilityScore: scalabilityScore || 50,
        estimatedValue: estimatedValue || null,
        notes,
      },
    });

    res.json({
      success: true,
      data: asset,
      message: 'Asset created',
    });
  } catch (error) {
    console.error('Error creating owned asset:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create owned asset',
    });
  }
});

/**
 * Update owned asset
 */
router.put('/:assetId', requireAuth, async (req, res) => {
  try {
    const { assetId } = req.params;
    const data = req.body;

    // Verify ownership
    const asset = await prisma.ownedAsset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found',
      });
    }

    // Check access
    const userTalentId = (req as any).user?.talentId;
    if (asset.talentId !== userTalentId && (req as any).user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const updated = await prisma.ownedAsset.update({
      where: { id: assetId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: updated,
      message: 'Asset updated',
    });
  } catch (error) {
    console.error('Error updating owned asset:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update owned asset',
    });
  }
});

/**
 * Delete owned asset
 */
router.delete('/:assetId', requireAuth, async (req, res) => {
  try {
    const { assetId } = req.params;

    // Verify ownership
    const asset = await prisma.ownedAsset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found',
      });
    }

    // Check access
    const userTalentId = (req as any).user?.talentId;
    if (asset.talentId !== userTalentId && (req as any).user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    await prisma.ownedAsset.delete({
      where: { id: assetId },
    });

    res.json({
      success: true,
      message: 'Asset deleted',
    });
  } catch (error) {
    console.error('Error deleting owned asset:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete owned asset',
    });
  }
});

export default router;
