import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as bundlesController from "../controllers/bundlesController.js";

const router = Router();

// Middleware for authentication
router.use(requireAuth);

// --- CRUD Endpoints ---
router.get("/", bundlesController.listBundles);
router.post("/", bundlesController.createBundle);
router.get("/:id", bundlesController.getBundle);
router.put("/:id", bundlesController.updateBundle);
router.delete("/:id", bundlesController.deleteBundle);

// --- AI Endpoints ---

// This endpoint can be used for both creation and AI generation
router.post("/generate", bundlesController.generateAIBundle);

// The other routes would be created similarly
// routes/bundleRecommendations.ts
// router.post("/", bundlesController.recommendBundles);

// routes/bundlePricing.ts
// router.post("/", bundlesController.estimateBundlePrice);

export default router;
