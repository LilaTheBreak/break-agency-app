import { Router } from "express";
import { requireAuth } from '../middleware/auth';
import * as campaignAutoController from '../controllers/campaignAutoController';

const router = Router();

// Middleware for authentication
router.use(requireAuth);

// POST /api/campaign/auto-plan/debug - Get raw LLM output for debugging auto-plan generation
router.post("/", campaignAutoController.debugAutoPlan);
export default router;