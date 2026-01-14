/**
 * Revenue Classification API Routes
 * 
 * GET    /api/revenue-classification/:dealId     - Get classification
 * POST   /api/revenue-classification/:dealId     - Create/update classification
 * GET    /api/revenue-classification/:dealId/validate - Validate before closing
 * POST   /api/revenue-classification/:dealId/auto-classify - Auto-classify from deal data
 * GET    /api/deals/:talentId/high-risk         - List high-risk deals
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import * as revenueClassificationService from '../../services/revenueClassificationService.js';
import { requireAuth } from '../../middleware/auth.js';
import { checkDealAccess, checkTalentAccess } from '../../middleware/talentAccess.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * Get revenue classification for a deal
 */
router.get('/:dealId', requireAuth, checkDealAccess, async (req, res) => {
  try {
    const { dealId } = req.params;

    const classification = await revenueClassificationService.getRevenueClassification(dealId);

    res.json({
      success: true,
      data: classification,
    });
  } catch (error) {
    console.error('Error getting revenue classification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get revenue classification',
    });
  }
});

/**
 * Create or update revenue classification
 */
router.post('/:dealId', requireAuth, checkDealAccess, async (req, res) => {
  try {
    const { dealId } = req.params;
    const { tags, dealValueType, revenueType, renewalLikelihood, estimatedMRR, estimatedChurnRisk } = req.body;
    const userId = (req as any).user?.id;

    // Validate required fields
    if (!tags || !dealValueType) {
      return res.status(400).json({
        success: false,
        error: 'Tags and dealValueType are required',
      });
    }

    const classification = await revenueClassificationService.upsertRevenueClassification({
      dealId,
      tags,
      dealValueType,
      revenueType: revenueType || 'OTHER',
      renewalLikelihood: renewalLikelihood || 'MEDIUM',
      estimatedMRR: estimatedMRR || 0,
      estimatedChurnRisk: estimatedChurnRisk || 0,
      classifiedBy: userId,
    });

    res.json({
      success: true,
      data: classification,
      message: classification.isHighRisk
        ? 'Classification saved - FLAGGED AS HIGH RISK'
        : 'Classification saved',
    });
  } catch (error) {
    console.error('Error upserting revenue classification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save revenue classification',
    });
  }
});

/**
 * Validate deal before closing
 */
router.get('/:dealId/validate', requireAuth, checkDealAccess, async (req, res) => {
  try {
    const { dealId } = req.params;

    const validation = await revenueClassificationService.validateDealBeforeClosing(dealId);

    res.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    console.error('Error validating deal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate deal',
    });
  }
});

/**
 * Auto-classify deal
 */
router.post('/:dealId/auto-classify', requireAuth, checkDealAccess, async (req, res) => {
  try {
    const { dealId } = req.params;

    const classification = await revenueClassificationService.autoClassifyDeal(dealId);

    res.json({
      success: true,
      data: classification,
      message: 'Deal auto-classified - please review and adjust if needed',
    });
  } catch (error) {
    console.error('Error auto-classifying deal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to auto-classify deal',
    });
  }
});

/**
 * Get high-risk deals for a talent
 */
router.get('/talent/:talentId/high-risk', requireAuth, checkTalentAccess, async (req, res) => {
  try {
    const { talentId } = req.params;

    const deals = await revenueClassificationService.getHighRiskDeals(talentId);

    res.json({
      success: true,
      data: deals,
      count: deals.length,
    });
  } catch (error) {
    console.error('Error getting high-risk deals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get high-risk deals',
    });
  }
});

export default router;
