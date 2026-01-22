import express from "express";
import { requireAuth } from "../middleware/auth.js";
import * as inboxController from "../controllers/inboxController.js";

const router = express.Router();

/**
 * Inbox Management Routes
 * Base: /api/messaging
 */

// Get all inboxes for the current user
router.get("/inboxes", requireAuth, inboxController.getInboxes);

// Get the default inbox
router.get("/inboxes/default", requireAuth, inboxController.getDefaultInbox);

// Get a specific inbox
router.get("/inboxes/:inboxId", requireAuth, inboxController.getInboxById);

// Create a new inbox (initiate connection)
router.post("/inboxes", requireAuth, inboxController.createInbox);

// Update an inbox (set as default, update sync status, etc.)
router.patch("/inboxes/:inboxId", requireAuth, inboxController.updateInbox);

// Delete an inbox
router.delete("/inboxes/:inboxId", requireAuth, inboxController.deleteInbox);

export default router;
