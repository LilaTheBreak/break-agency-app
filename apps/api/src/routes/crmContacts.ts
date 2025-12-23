import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

const router = Router();

// GET /api/crm-contacts - Get all contacts (optionally filter by brandId)
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { brandId } = req.query;

    const where = brandId ? { brandId: String(brandId) } : {};

    const contacts = await prisma.crmContact.findMany({
      where,
      include: {
        Brand: {
          select: {
            id: true,
            brandName: true,
            status: true,
          },
        },
        _count: {
          select: {
            OutreachRecords: true,
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

    const contact = await prisma.crmContact.findUnique({
      where: { id },
      include: {
        Brand: true,
        OutreachRecords: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        _count: {
          select: {
            OutreachRecords: true,
          },
        },
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
      await prisma.crmContact.updateMany({
        where: { brandId, primaryContact: true },
        data: { primaryContact: false },
      });
    }

    const contact = await prisma.crmContact.create({
      data: {
        brandId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: role?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        linkedInUrl: linkedInUrl?.trim() || null,
        relationshipStatus: relationshipStatus || "New",
        preferredContactMethod: preferredContactMethod?.trim() || null,
        primaryContact: Boolean(primaryContact),
        owner: owner?.trim() || null,
      },
      include: {
        Brand: {
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

    const existing = await prisma.crmContact.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Contact not found" });
    }

    // If setting as primary, unset other primary contacts for this brand
    if (primaryContact && !existing.primaryContact) {
      await prisma.crmContact.updateMany({
        where: { brandId: existing.brandId, primaryContact: true },
        data: { primaryContact: false },
      });
    }

    const contact = await prisma.crmContact.update({
      where: { id },
      data: {
        firstName: firstName?.trim() || existing.firstName,
        lastName: lastName?.trim() || existing.lastName,
        role: role !== undefined ? (role?.trim() || null) : existing.role,
        email: email !== undefined ? (email?.trim() || null) : existing.email,
        phone: phone !== undefined ? (phone?.trim() || null) : existing.phone,
        linkedInUrl: linkedInUrl !== undefined ? (linkedInUrl?.trim() || null) : existing.linkedInUrl,
        relationshipStatus: relationshipStatus || existing.relationshipStatus,
        preferredContactMethod: preferredContactMethod !== undefined ? (preferredContactMethod?.trim() || null) : existing.preferredContactMethod,
        primaryContact: primaryContact !== undefined ? Boolean(primaryContact) : existing.primaryContact,
        owner: owner !== undefined ? (owner?.trim() || null) : existing.owner,
      },
      include: {
        Brand: {
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

    await prisma.crmContact.delete({ where: { id } });

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

    const contact = await prisma.crmContact.findUnique({ where: { id } });
    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    const note = {
      at: new Date().toISOString(),
      author: author || "Admin",
      text: text.trim(),
    };

    const notes = [note, ...(contact.notes as any[])];

    const updated = await prisma.crmContact.update({
      where: { id },
      data: { notes },
      include: {
        Brand: {
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
