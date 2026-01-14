import { Router } from "express";
import { requireAuth } from '../middleware/auth';
import * as dealInsightsController from '../controllers/dealInsightsController';

const router = Router();

// Middleware for authentication
router.use(requireAuth);

// GET /api/deal-insights/summary
router.get("/summary", dealInsightsController.getDealSummary);

// GET /api/deal-insights/winrate
router.get("/winrate", dealInsightsController.getDealWinRate);

// GET /api/deal-insights/pace
router.get("/pace", dealInsightsController.getDealPace);

// GET /api/deal-insights/value-distribution
router.get("/value-distribution", dealInsightsController.getDealValueDistribution);

// GET /api/deal-insights/deliverable-performance
router.get("/deliverable-performance", dealInsightsController.getDeliverablePerformance);

export default router;
