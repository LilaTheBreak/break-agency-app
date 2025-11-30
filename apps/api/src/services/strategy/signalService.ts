import prisma from "../../lib/prisma.js";

export async function recordBrandSignal({
  brandName,
  userId,
  type,
  value,
  metadata = {}
}: {
  brandName: string;
  userId?: string;
  type: string;
  value?: string;
  metadata?: Record<string, any>;
}) {
  return prisma.brandSignal.create({
    data: {
      brandName,
      userId,
      type,
      value,
      metadata,
      weight: (metadata as any).weight || 1
    }
  });
}

export async function getSignalsForBrand(brandName: string, userId?: string) {
  return prisma.brandSignal.findMany({
    where: { brandName, userId },
    orderBy: { createdAt: "desc" },
    take: 50
  });
}
