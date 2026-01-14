/**
 * Community Management Routes
 * 
 * API endpoints for talent community connections and engagement metrics
 */

import { Router } from "express";
import { requireAuth } from '../middleware/auth';
import {
  connectAccountHandler,
  getConnectionsHandler,
  getCommunitySnapshotHandler,
  updateMetricHandler,
  disconnectAccountHandler,
  markConnectedHandler,
} from '../controllers/communityController';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Get community snapshot for talent
router.get("/:talentId/snapshot", getCommunitySnapshotHandler);

// List all connections for talent
router.get("/:talentId/connections", getConnectionsHandler);

// Connect a new social account
router.post("/:talentId/connections", connectAccountHandler);

// Update engagement metric for connection
router.post("/:connectionId/metrics", updateMetricHandler);

// Mark connection as connected (admin/integration)
router.patch("/:connectionId/mark-connected", markConnectedHandler);

// Disconnect social account
router.delete("/:connectionId", disconnectAccountHandler);

export default router;
