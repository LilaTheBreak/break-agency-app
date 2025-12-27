import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as deliverablesController from "../controllers/deliverablesController.js";

const router = Router();

// All deliverables routes require authentication
router.use(requireAuth);

// --- CRUD Endpoints ---

// POST /api/deliverables-v2 - Create a new deliverable
router.post("/", deliverablesController.createDeliverable);

// GET /api/deliverables-v2/:id - Get a single deliverable
router.get("/:id", deliverablesController.getDeliverable);

// PUT /api/deliverables-v2/:id - Update a deliverable
router.put("/:id", deliverablesController.updateDeliverable);

// DELETE /api/deliverables-v2/:id - Delete a deliverable
router.delete("/:id", deliverablesController.deleteDeliverable);

// --- Workflow Endpoints ---

// POST /api/deliverables-v2/:id/proof - Upload proof of completion
router.post("/:id/proof", deliverablesController.uploadProof);

// POST /api/deliverables-v2/:id/approve - Approve a deliverable
router.post("/:id/approve", deliverablesController.approveDeliverable);

// POST /api/deliverables-v2/:id/revise - Request revision on a deliverable
router.post("/:id/revise", deliverablesController.requestRevision);

// POST /api/deliverables-v2/:id/reject - Reject a deliverable
router.post("/:id/reject", deliverablesController.rejectDeliverable);

// --- Deal Integration Endpoints ---

// GET /api/deals/:dealId/deliverables-v2 - List deliverables for a deal
router.get("/deals/:dealId/deliverables", deliverablesController.listDeliverablesForDeal);

// GET /api/deliverables-v2/:id/items - Get deliverable items (proof uploads)
router.get("/:id/items", deliverablesController.getDeliverableItems);

export default router;
