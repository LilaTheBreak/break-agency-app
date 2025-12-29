import { Router, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { logDestructiveAction } from "../lib/auditLogger.js";
import { enrichBrandFromUrl } from "../services/brandEnrichment.js";

const router = Router();

// GET /api/crm-brands - Get all brands
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const brands = await prisma.crmBrand.findMany({
      include: {
        CrmBrandContact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            primaryContact: true,
          },
        },
        _count: {
          select: {
            CrmBrandContact: true,
            Outreach: true,
          },
        },
      },
      orderBy: [
        { lastActivityAt: "desc" },
        { createdAt: "desc" },
      ],
    });

    // Defensive: ensure all optional fields are safe
    const safeBrands = brands.map(brand => ({
      ...brand,
      website: brand.website ?? null,
      logo: brand.logo ?? null,
      lifecycleStage: brand.lifecycleStage ?? null,
      relationshipStrength: brand.relationshipStrength ?? null,
      primaryContactId: brand.primaryContactId ?? null,
      owner: brand.owner ?? null,
      internalNotes: brand.internalNotes ?? null,
      lastActivityAt: brand.lastActivityAt ?? null,
      lastActivityLabel: brand.lastActivityLabel ?? null,
      activity: Array.isArray(brand.activity) ? brand.activity : [],
    }));

    res.json({ brands: safeBrands });
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
        CrmBrandContact: {
          orderBy: [
            { primaryContact: "desc" },
            { lastName: "asc" },
          ],
        },
        Outreach: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        _count: {
          select: {
            CrmBrandContact: true,
            Outreach: true,
          },
        },
      },
    });

    if (!brand) {
      return res.status(404).json({ error: "Brand not found" });
    }

    // Defensive: ensure all optional fields are safe
    const safeBrand = {
      ...brand,
      website: brand.website ?? null,
      logo: brand.logo ?? null,
      logoUrl: brand.logoUrl ?? null,
      about: brand.about ?? null,
      socialLinks: brand.socialLinks ?? null,
      enrichedAt: brand.enrichedAt ?? null,
      enrichmentSource: brand.enrichmentSource ?? null,
      lifecycleStage: brand.lifecycleStage ?? null,
      relationshipStrength: brand.relationshipStrength ?? null,
      primaryContactId: brand.primaryContactId ?? null,
      owner: brand.owner ?? null,
      internalNotes: brand.internalNotes ?? null,
      lastActivityAt: brand.lastActivityAt ?? null,
      lastActivityLabel: brand.lastActivityLabel ?? null,
      activity: Array.isArray(brand.activity) ? brand.activity : [],
    };

    res.json({ brand: safeBrand });
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
      lifecycleStage,
      relationshipStrength,
      primaryContactId,
      owner,
      internalNotes,
    } = req.body;

    if (!brandName?.trim()) {
      return res.status(400).json({ error: "Brand name is required" });
    }

    const now = new Date().toISOString();
    const websiteUrl = website?.trim() || null;
    
    // Create brand first (don't wait for enrichment)
    const brand = await prisma.crmBrand.create({
      data: {
        id: randomUUID(),
        brandName: brandName.trim(),
        website: websiteUrl,
        logo: logo?.trim() || null,
        industry: industry || "Other",
        status: status || "Prospect",
        lifecycleStage: lifecycleStage?.trim() || null,
        relationshipStrength: relationshipStrength?.trim() || null,
        primaryContactId: primaryContactId?.trim() || null,
        owner: owner?.trim() || null,
        internalNotes: internalNotes?.trim() || null,
        lastActivityAt: now,
        lastActivityLabel: "Brand created",
        activity: [{ at: now, label: "Brand created" }],
        updatedAt: now,
      },
    });

    // Trigger enrichment asynchronously (don't block response)
    if (websiteUrl) {
      enrichBrandFromUrl(websiteUrl, brandName.trim())
        .then(async (enrichment) => {
          if (enrichment.success) {
            const updateData: any = {
              enrichedAt: new Date().toISOString(),
              enrichmentSource: enrichment.source,
              updatedAt: new Date().toISOString(),
            };
            
            // Only update fields that were enriched (don't overwrite manual entries)
            if (enrichment.logoUrl && !logo) {
              updateData.logoUrl = enrichment.logoUrl;
            }
            if (enrichment.about) {
              updateData.about = enrichment.about;
            }
            if (enrichment.industry && industry === "Other") {
              updateData.industry = enrichment.industry;
            }
            if (enrichment.socialLinks) {
              updateData.socialLinks = enrichment.socialLinks;
            }
            
            // Add activity log
            const existing = await prisma.crmBrand.findUnique({
              where: { id: brand.id },
              select: { activity: true },
            });
            
            const activity = [
              { at: new Date().toISOString(), label: "Brand enriched from website" },
              ...(Array.isArray(existing?.activity) ? existing.activity : []),
            ];
            updateData.activity = activity;
            updateData.lastActivityAt = new Date().toISOString();
            updateData.lastActivityLabel = "Brand enriched from website";
            
            await prisma.crmBrand.update({
              where: { id: brand.id },
              data: updateData,
            });
            
            console.log(`[BRAND ENRICHMENT] Successfully enriched brand ${brand.id} from ${websiteUrl}`);
          } else {
            console.warn(`[BRAND ENRICHMENT] Failed to enrich brand ${brand.id}: ${enrichment.error}`);
          }
        })
        .catch((error) => {
          console.error(`[BRAND ENRICHMENT] Error enriching brand ${brand.id}:`, error);
          // Don't fail the request - enrichment is best-effort
        });
    }

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
      lifecycleStage,
      relationshipStrength,
      primaryContactId,
      owner,
      internalNotes,
    } = req.body;

    const existing = await prisma.crmBrand.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Brand not found" });
    }

    const now = new Date().toISOString();
    const websiteUrl = website !== undefined ? (website?.trim() || null) : existing.website;
    const websiteChanged = website !== undefined && websiteUrl !== existing.website;
    
    const activity = [
      { at: now, label: "Brand updated" },
      ...(Array.isArray(existing.activity) ? existing.activity : []),
    ];

    const brand = await prisma.crmBrand.update({
      where: { id },
      data: {
        brandName: brandName?.trim() || existing.brandName,
        website: websiteUrl,
        logo: logo !== undefined ? (logo?.trim() || null) : existing.logo,
        industry: industry || existing.industry,
        status: status || existing.status,
        lifecycleStage: lifecycleStage !== undefined ? (lifecycleStage?.trim() || null) : existing.lifecycleStage,
        relationshipStrength: relationshipStrength !== undefined ? (relationshipStrength?.trim() || null) : existing.relationshipStrength,
        primaryContactId: primaryContactId !== undefined ? (primaryContactId?.trim() || null) : existing.primaryContactId,
        owner: owner !== undefined ? (owner?.trim() || null) : existing.owner,
        internalNotes: internalNotes !== undefined ? (internalNotes?.trim() || null) : existing.internalNotes,
        lastActivityAt: now,
        lastActivityLabel: "Brand updated",
        activity,
      },
    });

    // Trigger enrichment if website was added or changed
    if (websiteUrl && websiteChanged) {
      enrichBrandFromUrl(websiteUrl, brand.brandName)
        .then(async (enrichment) => {
          if (enrichment.success) {
            const updateData: any = {
              enrichedAt: new Date().toISOString(),
              enrichmentSource: enrichment.source,
              updatedAt: new Date().toISOString(),
            };
            
            // Only update fields that were enriched (don't overwrite manual entries)
            if (enrichment.logoUrl && !logo) {
              updateData.logoUrl = enrichment.logoUrl;
            }
            if (enrichment.about) {
              updateData.about = enrichment.about;
            }
            if (enrichment.industry && industry === existing.industry) {
              updateData.industry = enrichment.industry;
            }
            if (enrichment.socialLinks) {
              updateData.socialLinks = enrichment.socialLinks;
            }
            
            // Add activity log
            const current = await prisma.crmBrand.findUnique({
              where: { id: brand.id },
              select: { activity: true },
            });
            
            const newActivity = [
              { at: new Date().toISOString(), label: "Brand enriched from website" },
              ...(Array.isArray(current?.activity) ? current.activity : []),
            ];
            updateData.activity = newActivity;
            updateData.lastActivityAt = new Date().toISOString();
            updateData.lastActivityLabel = "Brand enriched from website";
            
            await prisma.crmBrand.update({
              where: { id: brand.id },
              data: updateData,
            });
            
            console.log(`[BRAND ENRICHMENT] Successfully enriched brand ${brand.id} from ${websiteUrl}`);
          } else {
            console.warn(`[BRAND ENRICHMENT] Failed to enrich brand ${brand.id}: ${enrichment.error}`);
          }
        })
        .catch((error) => {
          console.error(`[BRAND ENRICHMENT] Error enriching brand ${brand.id}:`, error);
          // Don't fail the request - enrichment is best-effort
        });
    }

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
    const user = (req as any).user;

    // Superadmin-only check
    if (user?.role !== "SUPERADMIN") {
      return res.status(403).json({ error: "Only superadmins can delete brands" });
    }

    // Check for linked objects
    const brand = await prisma.crmBrand.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            CrmBrandContact: true,
            Outreach: true,
            CrmTask: true,
          },
        },
      },
    });

    if (!brand) {
      return res.status(404).json({ error: "Brand not found" });
    }

    // Prevent deletion if brand has linked objects
    if (brand._count.CrmBrandContact > 0 || brand._count.Outreach > 0 || brand._count.CrmTask > 0) {
      return res.status(400).json({
        error: "Cannot delete brand with linked objects",
        linkedObjects: {
          contacts: brand._count.CrmBrandContact,
          outreach: brand._count.Outreach,
          tasks: brand._count.CrmTask,
        },
      });
    }

    await prisma.crmBrand.delete({ where: { id } });

    // Log destructive action for audit trail
    await logDestructiveAction(req, {
      action: "BRAND_DELETE",
      entityType: "CrmBrand",
      entityId: id,
      metadata: {
        brandName: brand.name,
        deletedBy: user.email,
        deletedAt: new Date().toISOString()
      }
    });

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
              id: brand.id || randomUUID(),
              brandName: brand.brandName,
              website: brand.website || null,
              logo: brand.logo || null,
              industry: brand.industry || "Other",
              status: brand.status || "Prospect",
              lifecycleStage: brand.lifecycleStage || null,
              relationshipStrength: brand.relationshipStrength || null,
              primaryContactId: brand.primaryContactId || null,
              owner: brand.owner || null,
              internalNotes: brand.internalNotes || null,
              activity: Array.isArray(brand.activity) ? brand.activity : [],
              lastActivityAt: brand.lastActivityAt || brand.createdAt || new Date(),
              lastActivityLabel: brand.lastActivityLabel || "Brand created",
              createdAt: brand.createdAt || new Date(),
              updatedAt: brand.updatedAt || new Date(),
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
          await prisma.crmBrandContact.create({
            data: {
              id: contact.id || randomUUID(),
              crmBrandId: contact.brandId || contact.crmBrandId,
              firstName: contact.firstName || null,
              lastName: contact.lastName || null,
              email: contact.email || null,
              phone: contact.phone || null,
              title: contact.title || null,
              primaryContact: contact.primaryContact || false,
              notes: contact.notes || null,
              createdAt: contact.createdAt || new Date(),
              updatedAt: contact.updatedAt || new Date(),
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
          // Skip if required fields are missing
          if (!record.target || !record.createdBy) {
            console.warn("[BATCH IMPORT] Skipping outreach record - missing required fields");
            continue;
          }

          await prisma.outreach.create({
            data: {
              id: record.id || randomUUID(),
              target: record.target,
              type: record.type || "Brand",
              contact: record.contact || null,
              contactEmail: record.contactEmail || null,
              link: record.link || null,
              owner: record.owner || null,
              source: record.source || null,
              stage: record.stage || "not-started",
              status: record.status || "Not started",
              summary: record.summary || null,
              threadUrl: record.threadUrl || null,
              gmailThreadId: record.gmailThreadId || null,
              emailsSent: record.emailsSent || 0,
              emailsReplies: record.emailsReplies || 0,
              lastContact: record.lastContact || null,
              nextFollowUp: record.nextFollowUp || null,
              reminder: record.reminder || null,
              opportunityRef: record.opportunityRef || null,
              archived: record.archived || false,
              linkedCreatorId: record.linkedCreatorId || null,
              linkedBrandId: record.linkedBrandId || null,
              linkedCrmBrandId: record.brandId || record.crmBrandId || record.linkedCrmBrandId || null,
              createdBy: record.createdBy,
              createdAt: record.createdAt || new Date(),
              updatedAt: record.updatedAt || new Date(),
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
