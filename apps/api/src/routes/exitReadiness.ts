/**
 * Exit Readiness Scorecard API Routes
 * 
 * GET    /api/exit-readiness/:talentId           - Get scorecard
 * POST   /api/exit-readiness/:talentId/compute   - Compute score
 * GET    /api/exit-readiness/:talentId/breakdown - Detailed metrics
 * GET    /api/exit-readiness/:talentId/recommendations - Action plan
 */

import { Router } from 'express';
import * as exitReadinessService from '../../services/exitReadinessService.js';
import { requireAuth } from '../../middleware/auth.js';
import { checkTalentAccess } from '../../middleware/talentAccess.js';
import prisma from '../../lib/prisma.js';

const router = Router();

/**
 * Get exit readiness scorecard
 */
router.get('/:talentId', requireAuth, checkTalentAccess, async (req, res) => {
  try {
    const { talentId } = req.params;

    const scorecard = await exitReadinessService.getExitReadinessScore(talentId);

    res.json({
      success: true,
      data: scorecard,
    });
  } catch (error) {
    console.error('Error getting exit readiness score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get exit readiness score',
    });
  }
});

/**
 * Force computation of exit readiness score
 */
router.post('/:talentId/compute', requireAuth, checkTalentAccess, async (req, res) => {
  try {
    const { talentId } = req.params;

    const scorecard = await exitReadinessService.computeExitReadinessScore(talentId);

    res.json({
      success: true,
      data: scorecard,
      message: 'Exit readiness score computed from business data',
    });
  } catch (error) {
    console.error('Error computing exit readiness score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compute exit readiness score',
    });
  }
});

/**
 * Get detailed metric breakdown
 */
router.get('/:talentId/breakdown', requireAuth, checkTalentAccess, async (req, res) => {
  try {
    const { talentId } = req.params;

    const scorecard = await exitReadinessService.getExitReadinessScore(talentId);

    const breakdown = {
      overall: {
        score: scorecard.overallScore,
        category: scorecard.category,
      },
      components: {
        revenuePredicability: {
          score: scorecard.revenuePredicability,
          weight: 0.2,
          display: 'Revenue Predictability',
          description: 'MRR consistency, churn rate, contract length',
        },
        founderIndependence: {
          score: scorecard.founderIndependence,
          weight: 0.2,
          display: 'Founder Independence',
          description: 'Business survival without founder presence',
        },
        teamDepth: {
          score: scorecard.teamDepth,
          weight: 0.15,
          display: 'Team & System Depth',
          description: 'SOPs, staff training, process documentation',
        },
        ipOwnership: {
          score: scorecard.ipOwnership,
          weight: 0.15,
          display: 'IP Ownership',
          description: 'Revenue from owned assets vs personal brand',
        },
        grossMargin: {
          score: scorecard.grossMargin,
          weight: 0.1,
          display: 'Gross Margin',
          description: 'Net revenue after COGS and commissions',
        },
        platformRisk: {
          score: scorecard.platformRisk,
          weight: 0.1,
          display: 'Platform Risk',
          description: 'Single-platform dependency, algorithm risk',
        },
        recurringRevenuePercent: {
          score: scorecard.recurringRevenuePercent,
          weight: 0.1,
          display: 'Recurring Revenue %',
          description: 'Percentage that auto-renews',
        },
      },
    };

    res.json({
      success: true,
      data: breakdown,
    });
  } catch (error) {
    console.error('Error getting exit readiness breakdown:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get breakdown',
    });
  }
});

/**
 * Get actionable recommendations
 */
router.get('/:talentId/recommendations', requireAuth, checkTalentAccess, async (req, res) => {
  try {
    const { talentId } = req.params;

    const scorecard = await exitReadinessService.getExitReadinessScore(talentId);

    // Get recommendations sorted by priority and impact
    const recommendations = scorecard.recommendations as any[];

    const sorted = recommendations.sort((a: any, b: any) => {
      const priorityOrder = { HIGH: 1, MEDIUM: 2, LOW: 3 };
      const priorityDiff =
        (priorityOrder[a.priority] || 999) - (priorityOrder[b.priority] || 999);
      if (priorityDiff !== 0) return priorityDiff;
      return (b.estimatedImpact || 0) - (a.estimatedImpact || 0);
    });

    res.json({
      success: true,
      data: {
        score: scorecard.overallScore,
        category: scorecard.category,
        recommendations: sorted,
      },
    });
  } catch (error) {
    console.error('Error getting exit readiness recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendations',
    });
  }
});

export default router;
