/**
 * Growth Initiatives Routes
 */

import { Router } from "express";
import { requireAuth } from '../middleware/auth.js';
import {
  getInitiativesHandler,
  getInitiativeHandler,
  createInitiativeHandler,
  updateInitiativeHandler,
  addInputHandler,
  addOutputHandler,
  addPerformanceHandler,
  addBusinessImpactHandler,
  getInitiativeCostHandler,
  getAllInitiativesHandler,
} from '../controllers/growthInitiativeController.js';

const router = Router();

// Get all initiatives across all talent (admin)
router.get("/admin/all", requireAuth, getAllInitiativesHandler);

// Get initiatives for a specific talent
router.get("/", requireAuth, getInitiativesHandler);

// Get single initiative
router.get("/:id", requireAuth, getInitiativeHandler);

// Create initiative
router.post("/", requireAuth, createInitiativeHandler);

// Update initiative
router.patch("/:id", requireAuth, updateInitiativeHandler);

// Add input (cost driver)
router.post("/:id/inputs", requireAuth, addInputHandler);

// Add output (content produced)
router.post("/:id/outputs", requireAuth, addOutputHandler);

// Add performance metrics
router.post("/:id/performance", requireAuth, addPerformanceHandler);

// Add business impact
router.post("/:id/impact", requireAuth, addBusinessImpactHandler);

// Get cost rollup
router.get("/:id/cost", requireAuth, getInitiativeCostHandler);

export default router;
