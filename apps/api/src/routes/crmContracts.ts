import express from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

const router = express.Router();

// GET /api/crm-contracts - List all contracts with optional filters
router.get("/", requireAuth, async (req, res) => {
  try {
    const { brandId, dealId, status, owner } = req.query;

    const where: any = {};
    if (brandId) where.brandId = brandId as string;
    if (dealId) where.dealId = dealId as string;
    if (status) where.status = status as string;
    if (owner) where.internalOwner = owner as string;

    const contracts = await prisma.contract.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        Brand: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    res.json({ contracts: contracts || [] });
  } catch (error) {
    console.error("Error fetching contracts:", error);
    // Return empty array instead of 500 - graceful degradation
    res.status(200).json({ contracts: [] });
  }
});

// GET /api/crm-contracts/:id - Get single contract
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        Brand: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!contract) {
      return res.status(404).json({ error: "Contract not found" });
    }

    res.json({ contract });
  } catch (error) {
    console.error("Error fetching contract:", error);
    // Return 404 instead of 500 for missing contracts
    res.status(404).json({ error: "Contract not found" });
  }
});

// POST /api/crm-contracts - Create new contract
router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      contractName,
      contractType,
      status = "Draft",
      brandId,
      dealId,
      talentIds = [],
      internalOwner,
      startDate,
      endDate,
      renewalType = "Fixed term",
      campaignId,
      eventId,
      notes = "",
    } = req.body;

    // Validation
    if (!contractName?.trim()) {
      return res.status(400).json({ error: "Contract name is required" });
    }
    if (!brandId) {
      return res.status(400).json({ error: "Brand is required" });
    }
    if (!contractType) {
      return res.status(400).json({ error: "Contract type is required" });
    }

    // Verify brand exists
    const brand = await prisma.crmBrand.findUnique({
      where: { id: brandId },
    });
    if (!brand) {
      return res.status(404).json({ error: "Brand not found" });
    }

    const now = new Date().toISOString();
    const contract = await prisma.contract.create({
      data: {
        id: `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        contractName: contractName.trim(),
        contractType,
        status,
        brandId,
        dealId: dealId || null,
        talentIds: talentIds || [],
        internalOwner: internalOwner || null,
        startDate: startDate || null,
        endDate: endDate || null,
        renewalType,
        campaignId: campaignId || null,
        eventId: eventId || null,
        notes: notes || "",
        files: [],
        versions: [],
        tasks: [],
        activity: [{ at: now, label: "Contract created" }],
        createdBy: req.user?.id || req.user?.email || "unknown",
      },
      include: {
        Brand: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    res.status(201).json({ contract });
  } catch (error) {
    console.error("Error creating contract:", error);
    res.status(500).json({ error: "Failed to create contract" });
  }
});

// PATCH /api/crm-contracts/:id - Update contract
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if contract exists
    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Contract not found" });
    }

    // If brandId is being updated, verify it exists
    if (updates.brandId && updates.brandId !== existing.brandId) {
      const brand = await prisma.crmBrand.findUnique({
        where: { id: updates.brandId },
      });
      if (!brand) {
        return res.status(404).json({ error: "Brand not found" });
      }
    }

    // Prepare update data
    const updateData: any = {};
    const allowedFields = [
      "contractName",
      "contractType",
      "status",
      "brandId",
      "dealId",
      "talentIds",
      "internalOwner",
      "startDate",
      "endDate",
      "renewalType",
      "campaignId",
      "eventId",
      "notes",
      "files",
      "versions",
      "tasks",
      "activity",
    ];

    for (const field of allowedFields) {
      if (field in updates) {
        updateData[field] = updates[field];
      }
    }

    const contract = await prisma.contract.update({
      where: { id },
      data: updateData,
      include: {
        Brand: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    res.json({ contract });
  } catch (error) {
    console.error("Error updating contract:", error);
    res.status(500).json({ error: "Failed to update contract" });
  }
});

// DELETE /api/crm-contracts/:id - Delete contract
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.contract.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting contract:", error);
    res.status(500).json({ error: "Failed to delete contract" });
  }
});

// POST /api/crm-contracts/:id/notes - Add note to contract
router.post("/:id/notes", requireAuth, async (req, res) => {
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

    const now = new Date().toISOString();
    const activity = [
      ...(Array.isArray(contract.activity) ? contract.activity : []),
      { at: now, label: `Note added: ${note.trim().substring(0, 50)}${note.trim().length > 50 ? "..." : ""}` },
    ];

    const updated = await prisma.contract.update({
      where: { id },
      data: {
        notes: note.trim(),
        activity,
      },
      include: {
        Brand: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    res.json({ contract: updated });
  } catch (error) {
    console.error("Error adding note:", error);
    res.status(500).json({ error: "Failed to add note" });
  }
});

// POST /api/crm-contracts/batch-import - Import contracts from localStorage
router.post("/batch-import", requireAuth, async (req, res) => {
  try {
    const { contracts } = req.body;

    if (!Array.isArray(contracts) || contracts.length === 0) {
      return res.status(400).json({ error: "Contracts array is required" });
    }

    const imported: any[] = [];
    const errors: any[] = [];

    for (const contract of contracts) {
      try {
        // Verify brand exists
        const brand = await prisma.crmBrand.findUnique({
          where: { id: contract.brandId },
        });

        if (!brand) {
          errors.push({ contractName: contract.contractName, error: "Brand not found" });
          continue;
        }

        const created = await prisma.contract.create({
          data: {
            id: `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            contractName: contract.contractName || "Untitled Contract",
            contractType: contract.contractType || "Other",
            status: contract.status || "Draft",
            brandId: contract.brandId,
            dealId: contract.dealId || null,
            talentIds: contract.talentIds || [],
            internalOwner: contract.internalOwner || null,
            startDate: contract.startDate || null,
            endDate: contract.endDate || null,
            renewalType: contract.renewalType || "Fixed term",
            campaignId: contract.campaignId || null,
            eventId: contract.eventId || null,
            notes: contract.notes || "",
            files: contract.files || [],
            versions: contract.versions || [],
            tasks: contract.tasks || [],
            activity: contract.activity || [{ at: new Date().toISOString(), label: "Contract imported" }],
            createdBy: req.user?.id || req.user?.email || "migration",
            createdAt: contract.createdAt ? new Date(contract.createdAt) : undefined,
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
    res.status(500).json({ error: "Failed to import contracts" });
  }
});

export default router;
