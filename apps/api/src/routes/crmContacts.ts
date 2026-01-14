import { Router, type Request, type Response } from "express";
import { requireAuth } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { isAdmin, isSuperAdmin } from '../lib/roleHelpers.js';
import { logError } from '../lib/logger.js';

const router = Router();

// All CRM routes require admin access
router.use(requireAuth);
router.use((req: Request, res: Response, next) => {
  if (!isAdmin(req.user!) && !isSuperAdmin(req.user!)) {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }
  next();
});

// GET /api/crm-contacts - Get all contacts (optionally filter by brandId)
router.get("/", async (req: Request, res: Response) => {
  try {
    const { brandId } = req.query;

    const where = brandId ? { brandId: String(brandId) } : {};

    const contacts = await prisma.crmBrandContact.findMany({
      where: brandId ? { crmBrandId: String(brandId) } : {},
      include: {
        CrmBrand: {
          select: {
            id: true,
            brandName: true,
            status: true,
          },
        },
      },
      orderBy: [
        { primaryContact: "desc" },
        { lastName: "asc" },
      ],
    });

    // CRITICAL: Return direct array for consistency with campaigns/events/deals endpoints
    // Frontend expects: direct array, not wrapped object
    res.json(contacts || []);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch contacts";
    logError("Failed to fetch contacts", error, { userId: req.user?.id, route: req.path });
    return res.status(500).json({ 
      success: false,
      error: errorMessage,
      message: errorMessage,
      code: "CONTACTS_FETCH_FAILED"
    });
  }
});

// GET /api/crm-contacts/:id - Get single contact
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const contact = await prisma.crmBrandContact.findUnique({
      where: { id },
      include: {
        CrmBrand: true,
      },
    });

    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    res.json({ contact });
  } catch (error) {
    console.error("[CRM CONTACTS] Error fetching contact:", error);
    if (error instanceof Error) {
      return res.status(400).json({
        code: "CONTACT_FETCH_FAILED",
        message: error.message,
      });
    }
    return res.status(400).json({
      code: "CONTACT_FETCH_FAILED",
      message: "Failed to fetch contact",
    });
  }
});

// POST /api/crm-contacts - Create contact
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      brandId,
      firstName,
      lastName,
      role,
      email,
      phone,
      linkedInUrl,
      relationshipStatus,
      preferredContactMethod,
      primaryContact,
      owner,
    } = req.body;

    if (!brandId) {
      return res.status(400).json({ error: "Brand ID is required" });
    }

    if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({ error: "First name and last name are required" });
    }

    // If this contact is being set as primary, unset other primary contacts for this brand
    if (primaryContact) {
      await prisma.crmBrandContact.updateMany({
        where: { crmBrandId: brandId, primaryContact: true },
        data: { primaryContact: false },
      });
    }

    const contact = await prisma.crmBrandContact.create({
      data: {
        id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        crmBrandId: brandId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        title: role?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        primaryContact: Boolean(primaryContact),
        notes: null,
        updatedAt: new Date(),
      },
      include: {
        CrmBrand: {
          select: {
            id: true,
            brandName: true,
            status: true,
          },
        },
      },
    });

    res.json({ contact });
  } catch (error) {
    console.error("[CRM CONTACTS] Error creating contact:", error);
    if (error instanceof Error) {
      // Check for Prisma validation errors
      if (error.message.includes("Unique constraint") || error.message.includes("Foreign key constraint")) {
        return res.status(400).json({
          code: "CONTACT_CREATE_FAILED",
          message: error.message,
        });
      }
      return res.status(400).json({
        code: "CONTACT_CREATE_FAILED",
        message: error.message,
      });
    }
    return res.status(400).json({
      code: "CONTACT_CREATE_FAILED",
      message: "Invalid contact input",
    });
  }
});

// PATCH /api/crm-contacts/:id - Update contact
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      role,
      email,
      phone,
      linkedInUrl,
      relationshipStatus,
      preferredContactMethod,
      primaryContact,
      owner,
    } = req.body;

    const existing = await prisma.crmBrandContact.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Contact not found" });
    }

    // If setting as primary, unset other primary contacts for this brand
    if (primaryContact && !existing.primaryContact) {
      await prisma.crmBrandContact.updateMany({
        where: { crmBrandId: existing.crmBrandId, primaryContact: true },
        data: { primaryContact: false },
      });
    }

    const contact = await prisma.crmBrandContact.update({
      where: { id },
      data: {
        firstName: firstName?.trim() || existing.firstName,
        lastName: lastName?.trim() || existing.lastName,
        title: role !== undefined ? (role?.trim() || null) : existing.title,
        email: email !== undefined ? (email?.trim() || null) : existing.email,
        phone: phone !== undefined ? (phone?.trim() || null) : existing.phone,
        primaryContact: primaryContact !== undefined ? Boolean(primaryContact) : existing.primaryContact,
        notes: existing.notes,
      },
      include: {
        CrmBrand: {
          select: {
            id: true,
            brandName: true,
            status: true,
          },
        },
      },
    });

    res.json({ contact });
  } catch (error) {
    console.error("[CRM CONTACTS] Error updating contact:", error);
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint") || error.message.includes("Foreign key constraint")) {
        return res.status(400).json({
          code: "CONTACT_UPDATE_FAILED",
          message: error.message,
        });
      }
      return res.status(400).json({
        code: "CONTACT_UPDATE_FAILED",
        message: error.message,
      });
    }
    return res.status(400).json({
      code: "CONTACT_UPDATE_FAILED",
      message: "Invalid contact input",
    });
  }
});

// DELETE /api/crm-contacts/:id - Delete contact
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.crmBrandContact.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error("[CRM CONTACTS] Error deleting contact:", error);
    if (error instanceof Error) {
      return res.status(400).json({
        code: "CONTACT_DELETE_FAILED",
        message: error.message,
      });
    }
    return res.status(400).json({
      code: "CONTACT_DELETE_FAILED",
      message: "Failed to delete contact",
    });
  }
});

// POST /api/crm-contacts/:id/notes - Add note to contact
router.post("/:id/notes", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { text, author } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ error: "Note text is required" });
    }

    const contact = await prisma.crmBrandContact.findUnique({ where: { id } });
    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    const note = {
      at: new Date().toISOString(),
      author: author || "Admin",
      text: text.trim(),
    };

    const existingNotes = contact.notes ? (typeof contact.notes === 'string' ? JSON.parse(contact.notes) : contact.notes) : [];
    const notes = JSON.stringify([note, ...existingNotes]);

    const updated = await prisma.crmBrandContact.update({
      where: { id },
      data: { notes },
      include: {
        CrmBrand: {
          select: {
            id: true,
            brandName: true,
            status: true,
          },
        },
      },
    });

    res.json({ contact: updated });
  } catch (error) {
    console.error("[CRM CONTACTS] Error adding note:", error);
    if (error instanceof Error) {
      return res.status(400).json({
        code: "CONTACT_NOTE_FAILED",
        message: error.message,
      });
    }
    return res.status(400).json({
      code: "CONTACT_NOTE_FAILED",
      message: "Failed to add note",
    });
  }
});

export default router;
