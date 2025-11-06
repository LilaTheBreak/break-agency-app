import { ListingStatus, Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

import { ListingSchema, ViewingSchema, ViewingSchemaBase, withViewingTimeValidation } from "@home/shared";

import { prisma } from "../db/client.js";
import { HttpError } from "../middlewares/problem-details.js";
import { requireRole } from "../middlewares/auth.js";
import { createListingViewing } from "./viewings.js";

const listQuerySchema = z.object({
  status: z.nativeEnum(ListingStatus).optional(),
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

const createListingSchema = ListingSchema.extend({
  refCode: z.string().min(3),
  status: z.nativeEnum(ListingStatus).default(ListingStatus.ACTIVE),
  media: z.array(z.record(z.any())).optional(),
  floorplans: z.array(z.record(z.any())).optional(),
  ownerContactId: z.string().optional(),
  negotiatorUserId: z.string().optional()
});

const updateListingSchema = createListingSchema.partial();
const nestedViewingSchema = withViewingTimeValidation(
  ViewingSchemaBase.omit({ listingId: true })
);

export const listingsRouter: Router = Router();

listingsRouter.get("/", async (req, res, next) => {
  try {
    const { status, q, page, pageSize } = listQuerySchema.parse(req.query);

    const where: Prisma.ListingWhereInput = {};
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { refCode: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } }
      ];
    }

    const [items, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.listing.count({ where })
    ]);

    res.json({ items, total, page, pageSize });
  } catch (error) {
    next(error);
  }
});

listingsRouter.get("/:id", async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: {
        ownerContact: true,
        negotiator: true,
        offers: { take: 5, orderBy: { createdAt: "desc" } },
        viewings: { take: 5, orderBy: { start: "desc" } }
      }
    });

    if (!listing) throw new HttpError(404, "Listing not found");

    res.json(listing);
  } catch (error) {
    next(error);
  }
});

listingsRouter.post("/", requireRole(["AGENT", "ADMIN"]), async (req, res, next) => {
  try {
    const payload = createListingSchema.parse(req.body);
    const listing = await prisma.listing.create({
      data: {
        ...payload,
        features: payload.features ?? [],
        media: payload.media ?? [],
        floorplans: payload.floorplans ?? []
      }
    });
    res.status(201).json(listing);
  } catch (error) {
    next(error);
  }
});

listingsRouter.put("/:id", requireRole(["AGENT", "ADMIN"]), async (req, res, next) => {
  try {
    const data = updateListingSchema.parse(req.body);
    const listing = await prisma.listing.update({
      where: { id: req.params.id },
      data
    });
    res.json(listing);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return next(new HttpError(404, "Listing not found"));
    }
    next(error);
  }
});

listingsRouter.delete("/:id", requireRole(["AGENT", "ADMIN"]), async (req, res, next) => {
  try {
    await prisma.listing.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return next(new HttpError(404, "Listing not found"));
    }
    next(error);
  }
});

listingsRouter.get("/:id/viewings", requireRole(["AGENT", "ADMIN"]), async (req, res, next) => {
  try {
    const viewings = await prisma.viewing.findMany({
      where: { listingId: req.params.id },
      orderBy: { start: "desc" },
      include: {
        attendees: { include: { contact: true, user: true } }
      }
    });
    res.json(viewings);
  } catch (error) {
    next(error);
  }
});

listingsRouter.post("/:id/viewings", requireRole(["AGENT", "ADMIN"]), async (req, res, next) => {
  try {
    const payload = nestedViewingSchema.parse(req.body);
    const viewing = await createListingViewing(req.params.id, payload, req.user?.id);
    res.status(201).json(viewing);
  } catch (error) {
    next(error);
  }
});
