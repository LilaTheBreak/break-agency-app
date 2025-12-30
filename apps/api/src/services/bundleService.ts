/**
 * Phase 5: Bundle service - Full implementation with database
 */
import prisma from "../lib/prisma.js";
import { generateId } from "../lib/utils.js";

export async function listAll() {
  return prisma.bundle.findMany({
    where: { status: "active" },
    orderBy: { createdAt: "desc" }
  });
}

export async function getById(bundleId: string) {
  return prisma.bundle.findUnique({
    where: { id: bundleId }
  });
}

export async function create(data: {
  name: string;
  description?: string;
  priceMin?: number;
  priceMax?: number;
  deliverables?: any;
  dealId?: string;
  creatorId?: string;
  createdBy: string;
}) {
  return prisma.bundle.create({
    data: {
      id: generateId(),
      name: data.name,
      description: data.description || null,
      priceMin: data.priceMin || null,
      priceMax: data.priceMax || null,
      deliverables: data.deliverables || null,
      dealId: data.dealId || null,
      creatorId: data.creatorId || null,
      status: "active",
      createdBy: data.createdBy
    }
  });
}

export async function update(bundleId: string, data: {
  name?: string;
  description?: string;
  priceMin?: number;
  priceMax?: number;
  deliverables?: any;
  status?: string;
}) {
  return prisma.bundle.update({
    where: { id: bundleId },
    data: {
      ...data,
      updatedAt: new Date()
    }
  });
}

export async function delete(bundleId: string) {
  await prisma.bundle.delete({
    where: { id: bundleId }
  });
  return { success: true };
}
