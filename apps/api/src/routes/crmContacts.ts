import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

const router = Router();

// GET /api/crm-contacts - Get all contacts (optionally filter by brandId)
router.get("/", requireAuth, async (req: Request, res: Response) => {
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

    res.json({ contacts: contacts || [] });
  } catch (error) {
    console.error("[CRM CONTACTS] Error fetching contacts:", error);
    // Return empty array instead of 500 - graceful degradation
    res.status(200).json({ contacts: [] });
  }
});

// GET /api/crm-contacts/:id - Get single contact
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
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
    res.status(500).json({ error: "Failed to fetch contact" });
  }
});

// POST /api/crm-contacts - Create contact
router.post("/", requireAuth, async (req: Request, res: Response) => {
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
    res.status(500).json({ error: "Failed to create contact" });
  }
});

// PATCH /api/crm-contacts/:id - Update contact
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
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
    res.status(500).json({ error: "Failed to update contact" });
  }
});

// DELETE /api/crm-contacts/:id - Delete contact
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.crmBrandContact.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error("[CRM CONTACTS] Error deleting contact:", error);
    res.status(500).json({ error: "Failed to delete contact" });
  }
});

// POST /api/crm-contacts/:id/notes - Add note to contact
router.post("/:id/notes", requireAuth, async (req: Request, res: Response) => {
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
    res.status(500).json({ error: "Failed to add note" });
  }
});

export default router;
