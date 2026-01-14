/**
 * Enterprise Value API Routes
 * 
 * GET    /api/enterprise-value/:talentId          - Get full metrics
 * POST   /api/enterprise-value/:talentId          - Create/update metrics
 * GET    /api/enterprise-value/:talentId/history - Get 12-month history
 * POST   /api/enterprise-value/:talentId/compute - Force recomputation
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import * as enterpriseValueService from '../services/enterpriseValueService.js';
import { requireAuth } from '../middleware/auth.js';
import { checkTalentAccess } from '../middleware/talentAccess.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * Get enterprise value metrics
 */
router.get('/:talentId', requireAuth, checkTalentAccess, async (req, res) => {
  try {
    const { talentId } = req.params;

    const metrics = await enterpriseValueService.getEnterpriseValueMetrics(talentId);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Error getting enterprise value metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get enterprise value metrics',
    });
  }
});

/**
 * Create or update enterprise value metrics
 */
router.post('/:talentId', requireAuth, checkTalentAccess, async (req, res) => {
  try {
    const { talentId } = req.params;
    const data = req.body;

    const metrics = await enterpriseValueService.updateEnterpriseValueMetrics(talentId, {
      talentId,
      ...data,
    });

    res.json({
      success: true,
      data: metrics,
      message: 'Enterprise value metrics updated',
    });
  } catch (error) {
    console.error('Error updating enterprise value metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update enterprise value metrics',
    });
  }
});

/**
 * Force recomputation of enterprise value metrics
 */
router.post('/:talentId/compute', requireAuth, checkTalentAccess, async (req, res) => {
  try {
    const { talentId } = req.params;

    const metrics = await enterpriseValueService.computeEnterpriseValueMetrics(talentId);

    res.json({
      success: true,
      data: metrics,
      message: 'Enterprise value metrics computed from business data',
    });
  } catch (error) {
    console.error('Error computing enterprise value metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compute enterprise value metrics',
    });
  }
});

/**
 * Get historical enterprise value metrics (12 months)
 */
router.get('/:talentId/history', requireAuth, checkTalentAccess, async (req, res) => {
  try {
    const { talentId } = req.params;
    const { months = 12 } = req.query;

    const history = await enterpriseValueService.getEnterpriseValueHistory(
      talentId,
      parseInt(months as string) || 12
    );

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error getting enterprise value history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get enterprise value history',
    });
  }
});

export default router;
