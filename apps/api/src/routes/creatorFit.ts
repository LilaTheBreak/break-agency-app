import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as creatorFitController from "../controllers/creatorFitController";

const router = Router();

// Middleware for authentication
router.use(requireAuth);

// POST /api/creator-fit/calculate - Calculate fit for a single creator-brand pair
router.post("/calculate", creatorFitController.calculateCreatorFit);

// POST /api/creator-fit/batch - Calculate fit for multiple creators
router.post("/batch", creatorFitController.calculateBatchFit);

// GET /api/creator-fit/talent/:talentId - Get all fit scores for a talent
router.get("/talent/:talentId", creatorFitController.fetchTalentFit);

// GET /api/creator-fit/brand/:brandId - Get all fit scores for a brand
router.get("/brand/:brandId", creatorFitController.fetchBrandFit);

export default router;