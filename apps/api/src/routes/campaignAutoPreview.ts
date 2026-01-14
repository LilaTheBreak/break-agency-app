import { Router } from "express";
import { requireAuth } from '../middleware/auth';
import * as campaignAutoController from '../controllers/campaignAutoController';

const router = Router();

// Middleware for authentication
router.use(requireAuth);

// POST /api/campaign/auto-plan/preview - Get a preview of an auto-generated plan without saving
router.post("/", campaignAutoController.previewAutoPlan);
export default router;