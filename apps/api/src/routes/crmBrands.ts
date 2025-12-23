import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

const router = Router();

// GET /api/crm-brands - Get all brands
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const brands = await prisma.crmBrand.findMany({
      include: {
        Contacts: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            primaryContact: true,
          },
        },
        _count: {
          select: {
            Contacts: true,
            OutreachRecords: true,
          },
        },
      },
      orderBy: [
        { lastActivityAt: "desc" },
        { createdAt: "desc" },
      ],
    });

    res.json({ brands });
  } catch (error) {
    console.error("[CRM BRANDS] Error fetching brands:", error);
    res.status(500).json({ error: "Failed to fetch brands" });
  }
});

// GET /api/crm-brands/:id - Get single brand with details
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const brand = await prisma.crmBrand.findUnique({
      where: { id },
      include: {
        Contacts: {
          orderBy: [
            { primaryContact: "desc" },
            { lastName: "asc" },
          ],
        },
        OutreachRecords: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        _count: {
          select: {
            Contacts: true,
            OutreachRecords: true,
          },
        },
      },
    });

    if (!brand) {
      return res.status(404).json({ error: "Brand not found" });
    }

    res.json({ brand });
  } catch (error) {
    console.error("[CRM BRANDS] Error fetching brand:", error);
    res.status(500).json({ error: "Failed to fetch brand" });
  }
});

// POST /api/crm-brands - Create brand
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      brandName,
      website,
      logo,
      industry,
      status,
      owner,
      internalNotes,
    } = req.body;

    if (!brandName?.trim()) {
      return res.status(400).json({ error: "Brand name is required" });
    }

    const now = new Date().toISOString();
    const brand = await prisma.crmBrand.create({
      data: {
        brandName: brandName.trim(),
        website: website?.trim() || null,
        logo: logo?.trim() || null,
        industry: industry || "Other",
        status: status || "Prospect",
        owner: owner?.trim() || null,
        internalNotes: internalNotes?.trim() || null,
        lastActivityAt: now,
        lastActivityLabel: "Brand created",
        activity: [{ at: now, label: "Brand created" }],
      },
    });

    res.json({ brand });
  } catch (error) {
    console.error("[CRM BRANDS] Error creating brand:", error);
    res.status(500).json({ error: "Failed to create brand" });
  }
});

// PATCH /api/crm-brands/:id - Update brand
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      brandName,
      website,
      logo,
      industry,
      status,
      owner,
      internalNotes,
    } = req.body;

    const existing = await prisma.crmBrand.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Brand not found" });
    }

    const now = new Date().toISOString();
    const activity = [
      { at: now, label: "Brand updated" },
      ...(existing.activity as any[]),
    ];

    const brand = await prisma.crmBrand.update({
      where: { id },
      data: {
        brandName: brandName?.trim() || existing.brandName,
        website: website !== undefined ? (website?.trim() || null) : existing.website,
        logo: logo !== undefined ? (logo?.trim() || null) : existing.logo,
        industry: industry || existing.industry,
        status: status || existing.status,
        owner: owner !== undefined ? (owner?.trim() || null) : existing.owner,
        internalNotes: internalNotes !== undefined ? (internalNotes?.trim() || null) : existing.internalNotes,
        lastActivityAt: now,
        lastActivityLabel: "Brand updated",
        activity,
      },
    });

    res.json({ brand });
  } catch (error) {
    console.error("[CRM BRANDS] Error updating brand:", error);
    res.status(500).json({ error: "Failed to update brand" });
  }
});

// DELETE /api/crm-brands/:id - Delete brand
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.crmBrand.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error("[CRM BRANDS] Error deleting brand:", error);
    res.status(500).json({ error: "Failed to delete brand" });
  }
});

// POST /api/crm-brands/batch-import - Import brands from localStorage
router.post("/batch-import", requireAuth, async (req: Request, res: Response) => {
  try {
    const { brands, contacts, outreach } = req.body;

    const imported = {
      brands: 0,
      contacts: 0,
      outreach: 0,
    };

    // Import brands
    if (Array.isArray(brands)) {
      for (const brand of brands) {
        try {
          await prisma.crmBrand.create({
            data: {
              id: brand.id || undefined,
              brandName: brand.brandName,
              website: brand.website || null,
              industry: brand.industry || "Other",
              status: brand.status || "Prospect",
              owner: brand.owner || null,
              internalNotes: brand.internalNotes || null,
              linkedDealsCount: brand.linkedDealsCount || 0,
              linkedTasksCount: brand.linkedTasksCount || 0,
              lastActivityAt: brand.lastActivityAt || brand.createdAt,
              lastActivityLabel: brand.lastActivityLabel || "Brand created",
              activity: brand.activity || [],
              createdAt: brand.createdAt || new Date(),
            },
          });
          imported.brands++;
        } catch (err) {
          console.error("[BATCH IMPORT] Error importing brand:", err);
        }
      }
    }

    // Import contacts
    if (Array.isArray(contacts)) {
      for (const contact of contacts) {
        try {
          await prisma.crmContact.create({
            data: {
              id: contact.id || undefined,
              brandId: contact.brandId,
              firstName: contact.firstName,
              lastName: contact.lastName,
              role: contact.role || null,
              email: contact.email || null,
              phone: contact.phone || null,
              linkedInUrl: contact.linkedInUrl || null,
              relationshipStatus: contact.relationshipStatus || "New",
              preferredContactMethod: contact.preferredContactMethod || null,
              primaryContact: contact.primaryContact || false,
              owner: contact.owner || null,
              lastContactedAt: contact.lastContactedAt || null,
              notes: contact.notes || [],
              createdAt: contact.createdAt || new Date(),
            },
          });
          imported.contacts++;
        } catch (err) {
          console.error("[BATCH IMPORT] Error importing contact:", err);
        }
      }
    }

    // Import outreach records
    if (Array.isArray(outreach)) {
      for (const record of outreach) {
        try {
          await prisma.outreachRecord.create({
            data: {
              id: record.id || undefined,
              direction: record.direction,
              channel: record.channel,
              summary: record.summary,
              fullNotes: record.fullNotes || null,
              brandId: record.brandId,
              contactId: record.contactId || null,
              dealId: record.dealId || null,
              campaignId: record.campaignId || null,
              talentId: record.talentId || null,
              outcome: record.outcome || "No reply yet",
              followUpSuggested: record.followUpSuggested || false,
              followUpBy: record.followUpBy || null,
              visibility: record.visibility || "Internal",
              createdAt: record.createdAt || new Date(),
              createdBy: record.createdBy || "Admin",
            },
          });
          imported.outreach++;
        } catch (err) {
          console.error("[BATCH IMPORT] Error importing outreach:", err);
        }
      }
    }

    res.json({
      success: true,
      imported,
    });
  } catch (error) {
    console.error("[CRM BRANDS] Error in batch import:", error);
    res.status(500).json({ error: "Failed to import data" });
  }
});

export default router;
