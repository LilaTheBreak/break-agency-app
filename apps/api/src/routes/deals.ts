import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as dealController from "../controllers/dealController";

const router = Router();

// Middleware for authentication
router.use(requireAuth);

// --- Core CRUD Endpoints ---

// GET /api/deals - List all deals for the user
router.get("/", dealController.listDeals);

// POST /api/deals - Create a new deal
router.post("/", dealController.createDeal);

// GET /api/deals/:id - Get a single deal with all its relations
router.get("/:id", dealController.getDeal);

// PUT /api/deals/:id - Update an existing deal
router.put("/:id", dealController.updateDeal);

// DELETE /api/deals/:id - Archive or delete a deal
router.delete("/:id", dealController.deleteDeal);

// --- Workflow Endpoint ---

// POST /api/deals/:id/stage - Advance a deal to a new stage
router.post("/:id/stage", dealController.changeDealStage);

export default router;