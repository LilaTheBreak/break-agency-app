import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as contractController from "../controllers/contractController.js";
import prisma from "../lib/prisma.js";

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
// Phase 5: Implemented e-signature using existing providers
router.post("/:id/sign/talent", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const contract = await prisma.contract.findUnique({ 
      where: { id },
      include: { Deal: { select: { talentId: true } } }
    });
    
    if (!contract) {
      return res.status(404).json({ error: "Contract not found" });
    }
    
    if (!contract.pdfUrl) {
      return res.status(400).json({ error: "Contract PDF missing" });
    }

    // Phase 5: Use existing initiateSignature function
    const { initiateSignature } = await import("../services/signature/orchestrator.js");
    const result = await initiateSignature({
      ...contract,
      terms: contract.terms || {},
      userId: contract.Deal?.talentId || req.user?.id || ""
    });

    // Update contract status
    await prisma.contract.update({
      where: { id },
      data: { 
        status: "pending_signature",
        updatedAt: new Date()
      }
    });

    res.json({ 
      success: true, 
      envelopeId: result.envelopeId,
      requestId: result.requestId,
      message: "Signature request sent to talent"
    });
  } catch (error) {
    console.error("Error initiating talent signature:", error);
    res.status(500).json({ 
      error: "Failed to initiate signature",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/contracts/:id/sign/brand - Brand signs the contract
// Phase 5: Implemented e-signature using existing providers
router.post("/:id/sign/brand", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const contract = await prisma.contract.findUnique({ 
      where: { id },
      include: { Brand: { select: { id: true, name: true } } }
    });
    
    if (!contract) {
      return res.status(404).json({ error: "Contract not found" });
    }
    
    if (!contract.pdfUrl) {
      return res.status(400).json({ error: "Contract PDF missing" });
    }

    // Phase 5: Use existing initiateSignature function
    const { initiateSignature } = await import("../services/signature/orchestrator.js");
    const result = await initiateSignature({
      ...contract,
      terms: contract.terms || {},
      userId: contract.brandId || req.user?.id || ""
    });

    // Update contract status
    await prisma.contract.update({
      where: { id },
      data: { 
        status: "pending_signature",
        updatedAt: new Date()
      }
    });

    res.json({ 
      success: true, 
      envelopeId: result.envelopeId,
      requestId: result.requestId,
      message: "Signature request sent to brand"
    });
  } catch (error) {
    console.error("Error initiating brand signature:", error);
    res.status(500).json({ 
      error: "Failed to initiate signature",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
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