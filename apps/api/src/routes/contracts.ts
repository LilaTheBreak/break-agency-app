import { Router } from "express";
import { requireAuth } from '../middleware/auth.js';
import * as contractController from '../controllers/contractController.js';
import prisma from '../lib/prisma.js';

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
router.post("/:id/sign/talent", requireAuth, async (req, res) => {
  const enabled = process.env.CONTRACT_SIGNING_ENABLED === "true";
  if (!enabled) {
    return res.status(503).json({ 
      error: "Contract signing is disabled",
      message: "This feature is currently disabled. Contact an administrator to enable it.",
      code: "FEATURE_DISABLED"
    });
  }

  try {
    const { id } = req.params;
    const contract = await prisma.contract.findUnique({ 
      where: { id },
      include: { 
        Deal: { 
          include: {
            Talent: { select: { email: true, name: true } }
          }
        }
      }
    } as any);
    
    if (!contract) {
      return res.status(404).json({ error: "Contract not found" });
    }
    
    if (!contract.pdfUrl) {
      return res.status(400).json({ error: "Contract PDF missing" });
    }

    // Get talent email and name
    const talentEmail = (contract as any).Deal?.Talent?.email || (contract.terms as any)?.talentEmail;
    const talentName = (contract as any).Deal?.Talent?.name || (contract.terms as any)?.talentName || "Talent";

    if (!talentEmail) {
      return res.status(400).json({ error: "Talent email not found" });
    }

    // Use existing initiateSignature function
    const { initiateSignature } = await import("../services/signature/orchestrator.js");
    const result = await initiateSignature({
      ...contract,
      terms: {
        ...(contract.terms as any || {}),
        talentEmail,
        talentName
      },
      userId: (contract as any).Deal?.talentId || req.user?.id || ""
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
router.post("/:id/sign/brand", requireAuth, async (req, res) => {
  const enabled = process.env.CONTRACT_SIGNING_ENABLED === "true";
  if (!enabled) {
    return res.status(503).json({ 
      error: "Contract signing is disabled",
      message: "This feature is currently disabled. Contact an administrator to enable it.",
      code: "FEATURE_DISABLED"
    });
  }

  try {
    const { id } = req.params;
    const contract = await prisma.contract.findUnique({ 
      where: { id },
      include: { 
        Brand: { select: { id: true, name: true } },
        Deal: { select: { brandId: true } }
      }
    });
    
    if (!contract) {
      return res.status(404).json({ error: "Contract not found" });
    }
    
    if (!contract.pdfUrl) {
      return res.status(400).json({ error: "Contract PDF missing" });
    }

    // Get brand name and email from terms
    const brandEmail = (contract.terms as any)?.brandEmail || "";
    const brandName = contract.Brand?.name || (contract.terms as any)?.brandName || "Brand";

    if (!brandEmail) {
      return res.status(400).json({ error: "Brand email not found" });
    }

    // Use existing initiateSignature function
    const { initiateSignature } = await import("../services/signature/orchestrator.js");
    const result = await initiateSignature({
      ...contract,
      terms: {
        ...(contract.terms as any || {}),
        brandEmail,
        brandName
      },
      userId: contract.brandId || (contract as any).Deal?.brandId || req.user?.id || ""
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