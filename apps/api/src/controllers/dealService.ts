import prisma from "../db/client.js";
import { Prisma, Deal } from "@prisma/client";
import { addEvent as addTimelineEntry } from "../services/dealTimelineService.js";

type DealCreateData = {
  talentId: string;
  brandName: string;
  value?: number;
  brief?: string;
};

type DealUpdateData = Omit<Partial<Deal>, "id" | "createdAt" | "updatedAt">;

/**
 * Creates a new deal and adds an initial timeline event.
 */
export async function createDeal(userId: string, data: DealCreateData): Promise<Deal> {
  const deal = await prisma.deal.create({
    data: {
      id: `deal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      talentId: data.talentId,
      brandId: data.brandName || "unknown", // Map brandName to actual brandId
      value: data.value,
      currency: "USD",
      notes: data.brief,
      stage: "NEW_LEAD",
      updatedAt: new Date()
    }
  });

  await addTimelineEntry(deal.id, {
    type: "deal_created",
    message: `Deal created for brand "${data.brandName}".`,
    createdById: userId,
  });

  return deal;
}

/**
 * Lists all deals a user has access to.
 */
export async function listDealsForUser(userId: string): Promise<Deal[]> {
  // In a real app, you'd add role-based access control here
  return prisma.deal.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" }
  });
}

/**
 * Gets a single deal by its ID, including all its relations.
 */
export async function getDealById(dealId: string, userId: string): Promise<any | null> {
  return prisma.deal.findFirst({
    where: { id: dealId, userId }, // Basic ownership check
    include: {
      DealTimeline: { orderBy: { createdAt: "desc" } },
      Deliverable: true,
      Payment: true
      // In a real app, you'd also include:
      // contract: true,
      // talent: { include: { user: true } },
      // brand: true,
    }
  });
}

/**
 * Updates a deal and creates timeline events for significant changes.
 */
export async function updateDeal(
  dealId: string,
  userId: string,
  data: DealUpdateData
): Promise<Deal | null> {
  const existingDeal = await prisma.deal.findFirst({ where: { id: dealId, userId } });
  if (!existingDeal) return null;

  const updatedDeal = await prisma.deal.update({
    where: { id: dealId },
    data
  });

  // Create timeline events for specific changes
  if (data.value && data.value !== existingDeal.value) {
    await addTimelineEntry(dealId, {
      type: "value_changed",
      message: `Deal value updated from ${existingDeal.value || 0} to ${data.value}.`,
      metadata: { oldValue: existingDeal.value, newValue: data.value },
      createdById: userId,
    });
  }

  return updatedDeal;
}

/**
 * Deletes a deal. In a real system, this should be a soft delete (archiving).
 */
export async function deleteDeal(dealId: string, userId: string): Promise<boolean> {
  const deal = await prisma.deal.findFirst({ where: { id: dealId, userId } });
  if (!deal) return false;

  // This is a hard delete. For soft delete, you'd add an `isArchived` flag.
  await prisma.deal.delete({
    where: { id: dealId }
  });

  return true;
}