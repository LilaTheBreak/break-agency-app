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
router.post("/:id/sign/talent", contractController.signContract);

// POST /api/contracts/:id/sign/brand - Brand signs the contract
router.post("/:id/sign/brand", contractController.signContract);

// POST /api/contracts/:id/finalise - Finalise the contract
router.post("/:id/finalise", contractController.finaliseContract);

// --- AI Analysis Endpoint ---

// POST /api/contracts/:id/analyse - Analyse a contract
router.post("/:id/analyse", contractController.analyseContract);

// --- Deal Integration Endpoint ---

// GET /api/deals/:dealId/contracts - List all contracts for a deal
router.get("/deals/:dealId/contracts", contractController.listByDeal);

export default router;