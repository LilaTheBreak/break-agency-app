import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as contractController from "../controllers/contractController.js";

const router = Router();

// Middleware for authentication
router.use(requireAuth);

// --- CRUD Endpoints ---

// GET /api/contracts - List all contracts with optional filters
router.get("/", contractController.listContracts);

// POST /api/contracts - Create a new contract
router.post("/", contractController.createContract);

// GET /api/contracts/:id - Get a single contract
router.get("/:id", contractController.getContract);

// PUT /api/contracts/:id - Update an existing contract
router.put("/:id", contractController.updateContract);

// DELETE /api/contracts/:id - Delete a contract
router.delete("/:id", contractController.deleteContract);

// --- Workflow Endpoints ---

// POST /api/contracts/:id/upload - Upload a contract PDF
router.post("/:id/upload", contractController.uploadContract);

// POST /api/contracts/:id/send - Send a contract
router.post("/:id/send", contractController.sendContract);

// POST /api/contracts/:id/sign/talent - Talent signs the contract
// REMOVED: E-signature feature uses stub providers - disabled until real providers are implemented
router.post("/:id/sign/talent", requireAuth, async (_req, res) => {
  res.status(410).json({ 
    error: "E-signature feature removed",
    message: "This feature uses stub providers and has been removed. E-signature integration is not yet implemented.",
    alternative: "Use manual signature tracking until e-signature providers are configured"
  });
});

// POST /api/contracts/:id/sign/brand - Brand signs the contract
// REMOVED: E-signature feature uses stub providers - disabled until real providers are implemented
router.post("/:id/sign/brand", requireAuth, async (_req, res) => {
  res.status(410).json({ 
    error: "E-signature feature removed",
    message: "This feature uses stub providers and has been removed. E-signature integration is not yet implemented.",
    alternative: "Use manual signature tracking until e-signature providers are configured"
  });
});

// POST /api/contracts/:id/finalise - Finalise the contract
router.post("/:id/finalise", contractController.finaliseContract);

// --- AI Analysis Endpoint ---

// POST /api/contracts/:id/analyse - Analyse a contract
router.post("/:id/analyse", contractController.analyseContract);

// --- Deal Integration Endpoint ---

// GET /api/deals/:dealId/contracts - List all contracts for a deal
router.get("/deals/:dealId/contracts", contractController.listByDeal);

// POST /api/deals/:dealId/contracts - Create contract from deal
router.post("/deals/:dealId/contracts", contractController.createFromDeal);

// POST /api/contracts/:id/generate-pdf - Generate PDF for contract
router.post("/:id/generate-pdf", contractController.generatePDF);

export default router;