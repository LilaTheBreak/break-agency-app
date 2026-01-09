import express from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { logAdminActivity } from "../lib/adminActivityLogger.js";
import { logDestructiveAction, logAuditEvent } from "../lib/auditLogger.js";
import { logError } from "../lib/logger.js";
import { sendSuccess, sendList, sendEmptyList, handleApiError } from "../utils/apiResponse.js";
import { isAdmin, isSuperAdmin } from "../lib/roleHelpers.js";
import { blockAdminActionsWhileImpersonating } from "../lib/dataScopingHelpers.js";

const router = express.Router();

// All CRM routes require admin access
router.use(requireAuth);
router.use((req, res, next) => {
  // Block admin actions while impersonating
  try {
    blockAdminActionsWhileImpersonating(req);
  } catch (error) {
    return res.status(403).json({ error: "Forbidden: Cannot perform admin actions while impersonating" });
  }
  
  if (!isAdmin(req.user!) && !isSuperAdmin(req.user!)) {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }
  next();
});

// GET /api/crm-contracts - List all contracts with optional filters
router.get("/", async (req, res) => {
  try {
    const { brandId, dealId, status } = req.query;

    const where: any = {};
    if (dealId) where.dealId = dealId as string;
    if (status) where.status = status as string;
    // Use direct brandId field if available, fallback to Deal relation for backward compatibility
    if (brandId) {
      where.OR = [
        { brandId: brandId as string }, // Direct brand linkage (preferred)
        { Deal: { brandId: brandId as string } } // Fallback for contracts without brandId
      ];
    }

    const contracts = await prisma.contract.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        Brand: {
          select: {
            id: true,
            name: true,
          },
        },
        Deal: {
          include: {
            Brand: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Transform contracts to include contractName (from title) and brandId for backward compatibility
    const transformedContracts = contracts.map(contract => ({
      ...contract,
      contractName: contract.title,
      brandId: contract.brandId || contract.Deal?.brandId || null, // Use direct brandId if available
      Brand: contract.Brand || contract.Deal?.Brand || null, // Use direct Brand relation if available
    }));

    sendList(res, transformedContracts || []);
  } catch (error) {
    logError("Failed to fetch contracts", error, { userId: req.user?.id });
    sendEmptyList(res);
  }
});

// GET /api/crm-contracts/:id - Get single contract
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        Brand: {
          select: {
            id: true,
            name: true,
          },
        },
        Deal: {
          include: {
            Brand: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!contract) {
      return res.status(404).json({ error: "Contract not found" });
    }

    // Transform contract for backward compatibility
    const transformedContract = {
      ...contract,
      contractName: contract.title,
      brandId: contract.brandId || contract.Deal?.brandId || null, // Use direct brandId if available
      Brand: contract.Brand || contract.Deal?.Brand || null, // Use direct Brand relation if available
    };

    res.json({ contract: transformedContract });
  } catch (error) {
    console.error("Error fetching contract:", error);
    res.status(404).json({ error: "Contract not found" });
  }
});

// POST /api/crm-contracts - Create new contract
router.post("/", async (req, res) => {
  try {
    const {
      contractName,
      contractType,
      status = "draft",
      brandId,
      dealId,
      startDate,
      endDate,
      notes,
    } = req.body;

    // Validation
    if (!contractName?.trim()) {
      return res.status(400).json({ error: "Contract name is required" });
    }
    if (!dealId) {
      return res.status(400).json({ error: "Deal ID is required" });
    }

    // Verify deal exists
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        Brand: true,
      },
    });
    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    // Store extra CRM fields in metadata
    const metadata = {
      contractType: contractType || null,
      startDate: startDate || null,
      endDate: endDate || null,
      notes: notes || null,
      brandId: brandId || deal.brandId, // Store brandId in metadata for filtering
    };

    // Derive brandId from deal if not provided
    const finalBrandId = brandId || deal.brandId;

    const contract = await prisma.contract.create({
      data: {
        id: `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: contractName.trim(), // Contract model uses title, not contractName
        dealId,
        brandId: finalBrandId, // Explicit brand linkage
        status,
        metadata,
        updatedAt: new Date(),
      },
      include: {
        Deal: {
          include: {
            Brand: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Log activity
    try {
      await logAdminActivity(req as any, {
        event: "CRM_CONTRACT_CREATED",
        metadata: { contractId: contract.id, contractName: contract.title, dealId: contract.dealId }
      });
    } catch (logError) {
      console.error("Failed to log admin activity:", logError);
    }

    // Transform response
    const transformedContract = {
      ...contract,
      contractName: contract.title,
      brandId: contract.Deal?.brandId || null,
      Brand: contract.Deal?.Brand || null,
    };

    res.status(201).json({ contract: transformedContract });
  } catch (error) {
    console.error("Error creating contract:", error);
    res.status(500).json({ 
      error: "Failed to create contract",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// PATCH /api/crm-contracts/:id - Update contract
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if contract exists
    const existing = await prisma.contract.findUnique({ 
      where: { id },
      include: { Deal: true }
    });
    if (!existing) {
      return res.status(404).json({ error: "Contract not found" });
    }

    // Prepare update data
    const updateData: any = {};
    
    // Map contractName to title
    if (updates.contractName !== undefined) {
      updateData.title = updates.contractName.trim();
    }
    
    // Update status if provided
    if (updates.status !== undefined) {
      updateData.status = updates.status;
    }
    
    // Update dealId if provided (verify deal exists and update brandId)
    if (updates.dealId !== undefined && updates.dealId !== existing.dealId) {
      const deal = await prisma.deal.findUnique({
        where: { id: updates.dealId },
        select: { id: true, brandId: true },
      });
      if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
      }
      updateData.dealId = updates.dealId;
      // Update brandId to match new deal's brand
      if (deal.brandId) {
        updateData.brandId = deal.brandId;
      }
    }
    
    // Store extra CRM fields in metadata
    if (updates.contractType || updates.startDate || updates.endDate || updates.notes || updates.brandId) {
      const existingMetadata = (existing.metadata as any) || {};
      updateData.metadata = {
        ...existingMetadata,
        ...(updates.contractType !== undefined && { contractType: updates.contractType }),
        ...(updates.startDate !== undefined && { startDate: updates.startDate }),
        ...(updates.endDate !== undefined && { endDate: updates.endDate }),
        ...(updates.notes !== undefined && { notes: updates.notes }),
        ...(updates.brandId !== undefined && { brandId: updates.brandId }),
      };
    }
    
    updateData.updatedAt = new Date();

    const contract = await prisma.contract.update({
      where: { id },
      data: updateData,
      include: {
        Deal: {
          include: {
            Brand: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Log activity
    try {
      await Promise.all([
        logAdminActivity(req as any, {
          event: "CRM_CONTRACT_UPDATED",
          metadata: { contractId: contract.id, contractName: contract.title, changes: Object.keys(updateData) }
        }),
        logAuditEvent(req as any, {
          action: "CONTRACT_UPDATED",
          entityType: "Contract",
          entityId: contract.id,
          metadata: { contractName: contract.title, changes: Object.keys(updateData) }
        })
      ]);
    } catch (logError) {
      console.error("Failed to log activity/audit:", logError);
    }

    // Transform response
    const transformedContract = {
      ...contract,
      contractName: contract.title,
      brandId: contract.Deal?.brandId || null,
      Brand: contract.Deal?.Brand || null,
    };

    res.json({ contract: transformedContract });
  } catch (error) {
    console.error("Error updating contract:", error);
    res.status(500).json({ 
      error: "Failed to update contract",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// DELETE /api/crm-contracts/:id - Delete contract
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const contract = await prisma.contract.findUnique({ 
      where: { id },
      select: { id: true, title: true, dealId: true }
    });
    if (!contract) {
      return res.status(404).json({ error: "Contract not found" });
    }

    await prisma.contract.delete({ where: { id } });

    // Log destructive action
    try {
      await Promise.all([
        logAdminActivity(req as any, {
          event: "CRM_CONTRACT_DELETED",
          metadata: { contractId: contract.id, contractName: contract.title }
        }),
        logDestructiveAction(req as any, {
          action: "CONTRACT_DELETED",
          entityType: "Contract",
          entityId: contract.id,
          metadata: { contractName: contract.title }
        })
      ]);
    } catch (logError) {
      console.error("Failed to log activity/audit:", logError);
    }

    res.json({ success: true });
  } catch (error) {
    logError("Failed to delete contract", error, { contractId: req.params.id, userId: req.user?.id });
    res.status(500).json({ 
      error: "Failed to delete contract",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/crm-contracts/:id/notes - Add note to contract
router.post("/:id/notes", async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note?.trim()) {
      return res.status(400).json({ error: "Note is required" });
    }

    const contract = await prisma.contract.findUnique({ where: { id } });
    if (!contract) {
      return res.status(404).json({ error: "Contract not found" });
    }

    // Store note in metadata
    const existingMetadata = (contract.metadata as any) || {};
    const existingNotes = existingMetadata.notes || "";
    const newNote = `[${new Date().toISOString()}] ${req.user?.email || req.user?.name || "unknown"}: ${note.trim()}`;
    const updatedNotes = existingNotes ? `${existingNotes}\n${newNote}` : newNote;

    const updated = await prisma.contract.update({
      where: { id },
      data: {
        metadata: {
          ...existingMetadata,
          notes: updatedNotes,
        },
        updatedAt: new Date(),
      },
      include: {
        Deal: {
          include: {
            Brand: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Transform response
    const transformedContract = {
      ...updated,
      contractName: updated.title,
      brandId: updated.Deal?.brandId || null,
      Brand: updated.Deal?.Brand || null,
    };

    res.json({ contract: transformedContract });
  } catch (error) {
    console.error("Error adding note:", error);
    res.status(500).json({ 
      error: "Failed to add note",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/crm-contracts/batch-import - Import contracts from localStorage
router.post("/batch-import", async (req, res) => {
  try {
    const { contracts } = req.body;

    if (!Array.isArray(contracts) || contracts.length === 0) {
      return res.status(400).json({ error: "Contracts array is required" });
    }

    const imported: any[] = [];
    const errors: any[] = [];

    for (const contract of contracts) {
      try {
        // Require dealId for Contract model
        if (!contract.dealId) {
          errors.push({ contractName: contract.contractName, error: "Deal ID is required" });
          continue;
        }

        // Verify deal exists
        const deal = await prisma.deal.findUnique({
          where: { id: contract.dealId },
        });

        if (!deal) {
          errors.push({ contractName: contract.contractName, error: "Deal not found" });
          continue;
        }

        // Store extra CRM fields in metadata
        const metadata = {
          contractType: contract.contractType || null,
          startDate: contract.startDate || null,
          endDate: contract.endDate || null,
          notes: contract.notes || null,
          brandId: contract.brandId || deal.brandId,
        };

        // Derive brandId from deal
        const finalBrandId = contract.brandId || deal.brandId;

        const created = await prisma.contract.create({
          data: {
            id: `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: contract.contractName || "Untitled Contract",
            dealId: contract.dealId,
            brandId: finalBrandId, // Explicit brand linkage
            status: contract.status || "draft",
            metadata,
            updatedAt: new Date(),
          },
        });

        imported.push(created);
      } catch (error) {
        console.error("Error importing contract:", error);
        errors.push({ contractName: contract.contractName, error: String(error) });
      }
    }

    res.json({
      success: true,
      imported: imported.length,
      errors: errors.length,
      details: { imported, errors },
    });
  } catch (error) {
    console.error("Error in batch import:", error);
    res.status(500).json({ 
      error: "Failed to import contracts",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
