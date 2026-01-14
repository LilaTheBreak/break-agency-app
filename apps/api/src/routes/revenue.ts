import { Router, type Request, type Response } from "express";
import { requireAuth } from '../middleware/auth';
import {
  getRevenueMetrics,
  getRevenueByBrand,
  getCreatorEarnings,
  getRevenueTimeSeries,
  getBrandFinancialSummary
} from '../services/revenueCalculationService';

const router = Router();

// Admin-only middleware
const requireAdmin = (req: Request, res: Response, next: Function) => {
  const userRole = req.user?.role;
  if (userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }
  next();
};

// Brand-only middleware  
const requireBrand = (req: Request, res: Response, next: Function) => {
  const userRole = req.user?.role;
  if (userRole !== "BRAND" && userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
    return res.status(403).json({ error: "Forbidden: Brand access required" });
  }
  next();
};

router.use(requireAuth);

// ============================================================================
// ADMIN REVENUE ENDPOINTS
// ============================================================================

/**
 * GET /api/revenue/metrics
 * Get overall revenue metrics
 * 
 * Query params:
 * - startDate: ISO date string
 * - endDate: ISO date string
 * - brandId: Filter by brand
 * - userId: Filter by user
 */
router.get("/metrics", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, brandId, userId } = req.query;

    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (brandId) filters.brandId = brandId as string;
    if (userId) filters.userId = userId as string;

    const metrics = await getRevenueMetrics(filters);

    res.json({
      success: true,
      data: metrics,
      labels: {
        projected: "Projected Revenue",
        contracted: "Contracted Revenue",
        paid: "Paid Revenue (Manual)"
      }
    });
  } catch (error) {
    console.error("Error fetching revenue metrics:", error);
    return res.status(500).json({ 
      error: "Failed to fetch revenue metrics",
      success: false
    });
  }
});

/**
 * GET /api/revenue/by-brand
 * Get revenue breakdown by brand
 * 
 * Query params:
 * - startDate: ISO date string
 * - endDate: ISO date string
 */
router.get("/by-brand", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const breakdown = await getRevenueByBrand(filters);

    res.json({
      success: true,
      data: breakdown,
      count: breakdown.length
    });
  } catch (error) {
    console.error("Error fetching revenue by brand:", error);
    return res.status(500).json({ 
      error: "Failed to fetch revenue by brand",
      success: false
    });
  }
});

/**
 * GET /api/revenue/creator-earnings
 * Get creator earnings projections
 * 
 * Query params:
 * - startDate: ISO date string
 * - endDate: ISO date string
 * - talentId: Filter by creator
 */
router.get("/creator-earnings", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, talentId } = req.query;

    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (talentId) filters.talentId = talentId as string;

    const earnings = await getCreatorEarnings(filters);

    res.json({
      success: true,
      data: earnings,
      count: earnings.length,
      labels: {
        projected: "Projected Earnings",
        contracted: "Contracted Earnings",
        paid: "Paid Earnings (Manual)"
      }
    });
  } catch (error) {
    console.error("Error fetching creator earnings:", error);
    return res.status(500).json({ 
      error: "Failed to fetch creator earnings",
      success: false
    });
  }
});

/**
 * GET /api/revenue/time-series
 * Get revenue over time
 * 
 * Query params:
 * - startDate: ISO date string
 * - endDate: ISO date string
 * - groupBy: 'day' | 'week' | 'month'
 */
router.get("/time-series", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, groupBy } = req.query;

    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (groupBy) filters.groupBy = groupBy as 'day' | 'week' | 'month';

    const timeSeries = await getRevenueTimeSeries(filters);

    res.json({
      success: true,
      data: timeSeries,
      count: timeSeries.length
    });
  } catch (error) {
    console.error("Error fetching revenue time series:", error);
    return res.status(500).json({ 
      error: "Failed to fetch revenue time series",
      success: false
    });
  }
});

// ============================================================================
// BRAND-SPECIFIC REVENUE ENDPOINTS
// ============================================================================

/**
 * GET /api/revenue/brand/:brandId/summary
 * Get financial summary for a specific brand
 * 
 * Accessible by:
 * - Admins (any brand)
 * - Brand users (their own brand only)
 */
router.get("/brand/:brandId/summary", requireBrand, async (req: Request, res: Response) => {
  try {
    const { brandId } = req.params;
    const userRole = req.user?.role;

    // If not admin, verify brand ownership
    // TODO: Add brand ownership validation when brand-user mapping exists
    
    const summary = await getBrandFinancialSummary(brandId);

    res.json({
      success: true,
      data: summary,
      labels: {
        projected: "Projected Revenue",
        contracted: "Contracted Revenue",
        paid: "Paid Revenue (Manual)"
      },
      note: "Revenue is calculated from deal values and stages. 'Paid' must be manually updated by moving deals to PAYMENT_RECEIVED or COMPLETED stage."
    });
  } catch (error) {
    console.error("Error fetching brand financial summary:", error);
    res.status(500).json({ 
      error: "Failed to fetch brand financial summary",
      success: false
    });
  }
});

/**
 * GET /api/revenue/brand/:brandId/deals
 * Get detailed deal breakdown for a brand
 */
router.get("/brand/:brandId/deals", requireBrand, async (req: Request, res: Response) => {
  try {
    const { brandId } = req.params;

    const metrics = await getRevenueMetrics({ brandId });

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error("Error fetching brand deal breakdown:", error);
    res.status(500).json({ 
      error: "Failed to fetch brand deal breakdown",
      success: false
    });
  }
});

// ============================================================================
// MULTI-PLATFORM REVENUE SOURCES (for EXCLUSIVE talent)
// ============================================================================

import * as revenueController from '../controllers/revenueController';

/**
 * POST /api/revenue/sources
 * Create a new revenue source (admin or self-service for exclusive talent)
 */
router.post("/sources", revenueController.createRevenueSource);

/**
 * GET /api/revenue/sources/:talentId
 * Get all revenue sources for a talent
 */
router.get("/sources/:talentId", revenueController.getRevenueSourcesForTalent);

/**
 * GET /api/revenue/sources/:sourceId/details
 * Get details of a specific revenue source
 */
router.get("/sources/:sourceId/details", revenueController.getRevenueSourceDetails);

/**
 * DELETE /api/revenue/sources/:sourceId
 * Delete a revenue source
 */
router.delete("/sources/:sourceId", revenueController.deleteRevenueSource);

/**
 * GET /api/revenue/summary/:talentId
 * Get total revenue summary across all sources
 */
router.get("/summary/:talentId", revenueController.getRevenueSummary);

/**
 * GET /api/revenue/by-platform/:talentId
 * Get revenue breakdown by platform
 */
router.get("/by-platform/:talentId", revenueController.getRevenueByPlatform);

/**
 * GET /api/revenue/by-source/:talentId
 * Get revenue breakdown by individual source
 */
router.get("/by-source/:talentId", revenueController.getRevenueBySource);

/**
 * POST /api/revenue/goals
 * Create a revenue goal
 */
router.post("/goals", revenueController.createRevenueGoal);

/**
 * GET /api/revenue/goals/:talentId
 * Get all goals with progress for a talent
 */
router.get("/goals/:talentId", revenueController.getRevenueGoals);

/**
 * DELETE /api/revenue/goals/:goalId
 * Delete a goal
 */
router.delete("/goals/:goalId", revenueController.deleteRevenueGoal);

export default router;
