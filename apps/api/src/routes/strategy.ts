import { Router } from "express";
import { requireAuth } from '../middleware/auth.js';
import * as strategyController from '../controllers/strategyController.js';

const router = Router();

// Middleware for authentication
router.use(requireAuth);

// POST /api/strategy/campaign-plan - Generate a full campaign plan from a brief
router.post("/campaign-plan", strategyController.generateCampaignPlan);

// POST /api/strategy/creator-fit - Compute the fit score between a talent and a brand
router.post("/creator-fit", strategyController.computeCreatorFit);

// Other strategy routes (e.g., /generate, /audience-analysis) would be added here.

export default router;
