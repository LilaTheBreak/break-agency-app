/**
 * Founder Dependency Index API Routes
 * 
 * GET    /api/founder-dependency/:talentId       - Get index score
 * POST   /api/founder-dependency/:talentId       - Compute/update
 * GET    /api/founder-dependency/:talentId/recommendations - Get recommendations
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import * as founderDependencyService from '../../services/founderDependencyService.js';
import { requireAuth } from '../../middleware/auth.js';
import { checkTalentAccess } from '../../middleware/talentAccess.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * Get founder dependency index
 */
router.get('/:talentId', requireAuth, checkTalentAccess, async (req, res) => {
  try {
    const { talentId } = req.params;

    const index = await founderDependencyService.getFounderDependencyIndex(talentId);

    res.json({
      success: true,
      data: index,
    });
  } catch (error) {
    console.error('Error getting founder dependency index:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get founder dependency index',
    });
  }
});

/**
 * Compute or update founder dependency index
 */
router.post('/:talentId', requireAuth, checkTalentAccess, async (req, res) => {
  try {
    const { talentId } = req.params;
    const data = req.body;

    let index;

    if (Object.keys(data).length === 0) {
      // No data provided, compute from business data
      index = await founderDependencyService.computeFounderDependencyIndex(talentId);
    } else {
      // Update with provided data
      index = await founderDependencyService.updateFounderDependencyIndex(talentId, data);
    }

    res.json({
      success: true,
      data: index,
      message: 'Founder dependency index updated',
    });
  } catch (error) {
    console.error('Error updating founder dependency index:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update founder dependency index',
    });
  }
});

/**
 * Get recommendations
 */
router.get('/:talentId/recommendations', requireAuth, checkTalentAccess, async (req, res) => {
  try {
    const { talentId } = req.params;

    const index = await founderDependencyService.getFounderDependencyIndex(talentId);

    res.json({
      success: true,
      data: {
        riskRating: index.riskRating,
        score: index.overallScore,
        recommendations: index.recommendations,
        valuationPenalty: index.projectedValuationPenalty,
      },
    });
  } catch (error) {
    console.error('Error getting founder dependency recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendations',
    });
  }
});

export default router;
