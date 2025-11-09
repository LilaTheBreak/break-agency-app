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
    const payload = createListingSchema.parse(req.body) as Record<string, any>;

    const listingData: Prisma.ListingUncheckedCreateInput = {
      refCode: payload.refCode as string,
      status: (payload.status as ListingStatus) ?? ListingStatus.ACTIVE,
      address: payload.address as Prisma.InputJsonValue,
      priceGuide: payload.priceGuide as number,
      tenure: payload.tenure ?? undefined,
      beds: payload.beds as number,
      baths: payload.baths as number,
      sqft: (payload.sqft as number | undefined) ?? undefined,
      features: (payload.features as string[] | undefined) ?? [],
      description: payload.description ?? undefined,
      media: (payload.media ?? []) as Prisma.InputJsonValue,
      floorplans: (payload.floorplans ?? []) as Prisma.InputJsonValue
    };
    if (typeof payload.ownerContactId === "string") {
      listingData.ownerContactId = payload.ownerContactId;
    }
    if (typeof payload.negotiatorUserId === "string") {
      listingData.negotiatorUserId = payload.negotiatorUserId;
    }

    const listing = await prisma.listing.create({
      data: listingData
    });
    res.status(201).json(listing);
  } catch (error) {
    next(error);
  }
});

listingsRouter.put("/:id", requireRole(["AGENT", "ADMIN"]), async (req, res, next) => {
  try {
    const data = updateListingSchema.parse(req.body) as Record<string, any>;
    const listingData: Prisma.ListingUncheckedUpdateInput = {};
    if (data.refCode) listingData.refCode = data.refCode as string;
    if (data.status) listingData.status = data.status as ListingStatus;
    if (data.address) listingData.address = data.address as Prisma.InputJsonValue;
    if (typeof data.priceGuide === "number") listingData.priceGuide = data.priceGuide;
    if (data.tenure !== undefined) listingData.tenure = data.tenure as string | undefined;
    if (typeof data.beds === "number") listingData.beds = data.beds;
    if (typeof data.baths === "number") listingData.baths = data.baths;
    if (typeof data.sqft === "number") listingData.sqft = data.sqft;
    if (data.features) listingData.features = data.features as string[];
    if (data.description !== undefined) listingData.description = data.description as string | undefined;
    if (data.media) listingData.media = data.media as Prisma.InputJsonValue;
    if (data.floorplans) listingData.floorplans = data.floorplans as Prisma.InputJsonValue;
    if (typeof data.ownerContactId === "string") listingData.ownerContactId = data.ownerContactId;
    if (typeof data.negotiatorUserId === "string") {
      listingData.negotiatorUserId = data.negotiatorUserId;
    }

    const listing = await prisma.listing.update({
      where: { id: req.params.id },
      data: listingData
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
