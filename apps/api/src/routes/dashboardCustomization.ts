import express, { Router } from "express";
import {
  getDashboardConfigHandler,
  getSnapshotsDataHandler,
  updateDashboardConfigHandler,
  resetDashboardHandler,
  reorderSnapshotsHandler,
  toggleSnapshotHandler,
  getAvailableSnapshotsHandler,
} from '../controllers/dashboardCustomizationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/**
 * Dashboard Customization Routes
 *
 * GET    /api/dashboard/config              - Get user's dashboard config
 * GET    /api/dashboard/snapshots           - Get snapshot data for dashboard
 * GET    /api/dashboard/snapshots/available - Get all available snapshots
 * POST   /api/dashboard/config              - Update dashboard config
 * POST   /api/dashboard/config/reset        - Reset to defaults
 * POST   /api/dashboard/config/reorder      - Reorder snapshots
 * POST   /api/dashboard/config/toggle       - Toggle snapshot visibility
 */

// Get routes
router.get("/config", requireAuth, getDashboardConfigHandler);
router.get("/snapshots/available", requireAuth, getAvailableSnapshotsHandler);
router.get("/snapshots", requireAuth, getSnapshotsDataHandler);

// Update routes
router.post("/config", requireAuth, updateDashboardConfigHandler);
router.post("/config/reset", requireAuth, resetDashboardHandler);
router.post("/config/reorder", requireAuth, reorderSnapshotsHandler);
router.post("/config/toggle", requireAuth, toggleSnapshotHandler);

export default router;
