/**
 * Creator Roster Routes
 * Manage brand's saved/shortlisted/active creator lists
 */

import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as rosterController from "../controllers/rosterController.js";

const router = Router();

// All roster routes require authentication
router.use(requireAuth);

// POST /api/roster - Add creator to roster
router.post("/", rosterController.addToRoster);

// DELETE /api/roster/:talentId - Remove creator from roster
router.delete("/:talentId", rosterController.removeFromRoster);

// PATCH /api/roster/:talentId - Update roster entry
router.patch("/:talentId", rosterController.updateRosterEntry);

// GET /api/roster - Get brand's roster (with optional status filter)
router.get("/", rosterController.getBrandRoster);

// GET /api/roster/check/:talentId - Check if talent is in roster
router.get("/check/:talentId", rosterController.checkInRoster);

// GET /api/roster/stats - Get roster statistics
router.get("/stats", rosterController.getRosterStats);

// POST /api/roster/bulk - Bulk add talents to roster
router.post("/bulk", rosterController.bulkAddToRoster);

// POST /api/roster/sync-active - Sync active status based on deals
router.post("/sync-active", rosterController.syncActiveStatus);

export default router;
