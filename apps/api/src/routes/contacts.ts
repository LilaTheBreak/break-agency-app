import { ContactType, Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

import {
  ContactCreateSchema as SharedContactCreateSchema,
  ContactUpdateSchema as SharedContactUpdateSchema,
  ContactQuerySchema
} from "@home/shared/schemas/contact.js";

import { prisma } from "../db/client.js";
import { requireRole } from "../middlewares/auth.js";
import { HttpError } from "../middlewares/problem-details.js";

const listQuerySchema = ContactQuerySchema.extend({
  type: z.nativeEnum(ContactType).optional(),
  q: z.string().trim().optional()
});

const createContactSchema = SharedContactCreateSchema.extend({
  createdByUserId: z.string().optional()
});

const updateContactSchema = SharedContactUpdateSchema.extend({
  createdByUserId: z.string().optional()
});

const mergeSchema = z.object({
  sourceIds: z.array(z.string().min(1)).min(1)
});

export const contactsRouter: Router = Router();

contactsRouter.get("/", requireRole(["AGENT", "ADMIN"]), async (req, res, next) => {
  try {
    const { type, q, page, pageSize } = listQuerySchema.parse(req.query);

    const where: Prisma.ContactWhereInput = {};
    if (type) where.type = type;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { emails: { hasSome: [q] } },
        { phones: { hasSome: [q] } }
      ];
    }

    const [items, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          listingsOwned: { select: { id: true, refCode: true, status: true } },
          offers: { select: { id: true, amount: true, status: true, listingId: true } }
        }
      }),
      prisma.contact.count({ where })
    ]);

    res.json({ items, total, page, pageSize });
  } catch (error) {
    next(error);
  }
});

contactsRouter.get("/:id", requireRole(["AGENT", "ADMIN"]), async (req, res, next) => {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: req.params.id },
      include: {
        listingsOwned: true,
        offers: { include: { listing: { select: { refCode: true, status: true } } } },
        viewingsAttended: {
          include: {
            viewing: {
              select: {
                id: true,
                start: true,
                end: true,
                status: true,
                listing: { select: { id: true, refCode: true } }
              }
            }
          }
        },
        documents: true,
        lettersTo: { select: { id: true, subject: true, status: true, sentAt: true } }
      }
    });
    if (!contact) throw new HttpError(404, "Contact not found");
    res.json(contact);
  } catch (error) {
    next(error);
  }
});

contactsRouter.post("/", requireRole(["AGENT", "ADMIN"]), async (req, res, next) => {
  try {
    const payload = createContactSchema.parse(req.body);
    const contact = await prisma.contact.create({
      data: {
        ...payload,
        emails: payload.emails ?? [],
        phones: payload.phones ?? [],
        tags: payload.tags ?? []
      }
    });
    res.status(201).json(contact);
  } catch (error) {
    next(error);
  }
});

contactsRouter.put("/:id", requireRole(["AGENT", "ADMIN"]), async (req, res, next) => {
  try {
    const data = updateContactSchema.parse(req.body);
    const contact = await prisma.contact.update({
      where: { id: req.params.id },
      data
    });
    res.json(contact);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return next(new HttpError(404, "Contact not found"));
    }
    next(error);
  }
});

contactsRouter.post("/:id/merge", requireRole(["AGENT", "ADMIN"]), async (req, res, next) => {
  try {
    const { sourceIds } = mergeSchema.parse(req.body);
    const targetId = req.params.id;

    const contacts = await prisma.contact.findMany({
      where: { id: { in: [targetId, ...sourceIds] } }
    });

    const target = contacts.find((c) => c.id === targetId);
    if (!target) throw new HttpError(404, "Target contact not found");

    const sources = contacts.filter((c) => sourceIds.includes(c.id));
    if (!sources.length) throw new HttpError(400, "No source contacts found to merge");

    const mergedEmails = Array.from(
      new Set([...target.emails, ...sources.flatMap((c) => c.emails)])
    );
    const mergedPhones = Array.from(
      new Set([...target.phones, ...sources.flatMap((c) => c.phones)])
    );
    const mergedTags = Array.from(new Set([...(target.tags ?? []), ...sources.flatMap((c) => c.tags ?? [])]));

    const updated = await prisma.contact.update({
      where: { id: targetId },
      data: {
        emails: mergedEmails,
        phones: mergedPhones,
        tags: mergedTags
      }
    });

    await prisma.contact.deleteMany({
      where: { id: { in: sources.map((c) => c.id) } }
    });

    res.json({ mergedInto: updated.id, removed: sources.map((c) => c.id) });
  } catch (error) {
    next(error);
  }
});
