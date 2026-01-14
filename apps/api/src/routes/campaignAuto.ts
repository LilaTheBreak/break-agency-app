import { Router } from "express";
import { requireAuth } from '../middleware/auth';
import * as campaignAutoController from '../controllers/campaignAutoController';

const router = Router();

// Middleware for authentication
router.use(requireAuth);

// POST /api/campaign/auto-plan - Trigger auto-generation of a campaign plan
router.post("/", campaignAutoController.autoPlanCampaign);

// POST /api/campaign/auto-plan/preview - Get a preview of an auto-generated plan without saving
router.post("/preview", campaignAutoController.previewAutoPlan);

// POST /api/campaign/auto-plan/debug - Get raw LLM output for debugging auto-plan generation
router.post("/debug", campaignAutoController.debugAutoPlan);

export default router;
