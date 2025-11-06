import { Prisma, ViewingStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

import { ViewingSchema, ViewingSchemaBase, withViewingTimeValidation } from "@home/shared";

import { prisma } from "../db/client.js";
import { requireRole } from "../middlewares/auth.js";
import { HttpError } from "../middlewares/problem-details.js";

const listQuerySchema = z.object({
  listingId: z.string().optional(),
  status: z.nativeEnum(ViewingStatus).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

const updateViewingSchema = withViewingTimeValidation(ViewingSchemaBase.partial());

type ViewingPayload = z.infer<typeof ViewingSchema>;
type ViewingAttendeePayload = ViewingPayload["attendees"][number];

export const viewingsRouter: Router = Router();

viewingsRouter.get("/", requireRole(["AGENT", "ADMIN"]), async (req, res, next) => {
  try {
    const { listingId, status, from, to, page, pageSize } = listQuerySchema.parse(req.query);

    const where = {
      ...(listingId ? { listingId } : {}),
      ...(status ? { status } : {}),
      ...(from || to
        ? {
            start: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {})
            }
          }
        : {})
    };

    const [items, total] = await Promise.all([
      prisma.viewing.findMany({
        where,
        orderBy: { start: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          listing: { select: { id: true, refCode: true, status: true } },
          attendees: { include: { contact: true, user: true } }
        }
      }),
      prisma.viewing.count({ where })
    ]);

    res.json({ items, total, page, pageSize });
  } catch (error) {
    next(error);
  }
});

viewingsRouter.get("/:id", requireRole(["AGENT", "ADMIN"]), async (req, res, next) => {
  try {
    const viewing = await prisma.viewing.findUnique({
      where: { id: req.params.id },
      include: {
        listing: { select: { id: true, refCode: true, status: true, address: true } },
        attendees: { include: { contact: true, user: true } }
      }
    });
    if (!viewing) throw new HttpError(404, "Viewing not found");
    res.json(viewing);
  } catch (error) {
    next(error);
  }
});

viewingsRouter.post("/", requireRole(["AGENT", "ADMIN"]), async (req, res, next) => {
  try {
    const payload = ViewingSchema.parse(req.body);
    const viewing = await createViewing(payload, req.user?.id);
    res.status(201).json(viewing);
  } catch (error) {
    next(error);
  }
});

viewingsRouter.put("/:id", requireRole(["AGENT", "ADMIN"]), async (req, res, next) => {
  try {
    const data = updateViewingSchema.parse(req.body);

    const viewing = await prisma.viewing.update({
      where: { id: req.params.id },
      data: {
        start: data.start,
        end: data.end,
        status: data.status,
        notes: data.notes,
        feedback: data.feedback
      }
    });

    if (data.attendees !== undefined) {
      await prisma.viewingAttendee.deleteMany({ where: { viewingId: viewing.id } });
      if (data.attendees.length) {
        await prisma.viewingAttendee.createMany({
          data: data.attendees.map((attendee: ViewingAttendeePayload) => ({
            viewingId: viewing.id,
            contactId: attendee.contactId,
            userId: attendee.userId,
            role: attendee.role
          }))
        });
      }
    }

    const refreshed = await prisma.viewing.findUnique({
      where: { id: viewing.id },
      include: {
        listing: { select: { id: true, refCode: true, status: true } },
        attendees: { include: { contact: true, user: true } }
      }
    });

    res.json(refreshed);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return next(new HttpError(404, "Viewing not found"));
    }
    next(error);
  }
});

viewingsRouter.delete("/:id", requireRole(["AGENT", "ADMIN"]), async (req, res, next) => {
  try {
    await prisma.viewing.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return next(new HttpError(404, "Viewing not found"));
    }
    next(error);
  }
});

async function createViewing(payload: ViewingPayload, createdByUserId?: string) {
  const { attendees, ...data } = payload;
  const viewing = await prisma.viewing.create({
    data: {
      ...data,
      createdByUserId,
      attendees: attendees.length
        ? {
            create: attendees.map((attendee: ViewingAttendeePayload) => ({
              contactId: attendee.contactId,
              userId: attendee.userId,
              role: attendee.role
            }))
          }
        : undefined
    },
    include: {
      listing: { select: { id: true, refCode: true, status: true } },
      attendees: { include: { contact: true, user: true } }
    }
  });
  return viewing;
}

export async function createListingViewing(
  listingId: string,
  input: Omit<ViewingPayload, "listingId">,
  userId?: string
) {
  return await createViewing({ ...input, listingId }, userId);
}
