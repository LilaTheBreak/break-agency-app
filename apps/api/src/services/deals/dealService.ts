import prisma from "../../lib/prisma.js";

export async function getAllDeals(userId: string) {
  return prisma.deal.findMany({
    where: { userId },
    include: {
      Talent: true,
      Brand: true,
      Deliverable: true,
      Payment: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDealById(id: string, userId: string) {
  return prisma.deal.findFirst({
    where: { id, userId },
    include: {
      Talent: true,
      Brand: true,
      Deliverable: true,
      Payment: true,
      DealTimeline: true,
      // dealPackages: true, // TODO: check if this relation exists
    },
  });
}

export interface CreateDealInput {
  userId: string;
  talentId: string;
  brandId: string;
  stage?: string;
  value?: number;
  currency?: string;
  notes?: string;
  expectedClose?: Date;
}

export async function createDeal(data: CreateDealInput) {
  return prisma.deal.create({
    data,
  });
}

export interface UpdateDealInput {
  id: string;
  userId: string;
  stage?: string;
  value?: number;
  notes?: string;
  expectedClose?: Date;
}

export async function updateDeal(input: UpdateDealInput) {
  const { id, userId, ...updates } = input;

  return prisma.deal.updateMany({
    where: { id, userId },
    data: updates,
  });
}

export async function deleteDeal(id: string, userId: string) {
  return prisma.deal.deleteMany({
    where: { id, userId },
  });
}
