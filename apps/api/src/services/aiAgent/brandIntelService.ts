import prisma from "../../lib/prisma.js";

export async function getBrandIntel(brandName: string) {
  return prisma.brandIntel.findFirst({
    where: {
      brandName: { equals: brandName, mode: "insensitive" }
    }
  });
}

export async function updateBrandIntel(brandName: string, data: any) {
  const existing = await getBrandIntel(brandName);

  if (existing) {
    return prisma.brandIntel.update({
      where: { id: existing.id },
      data: {
        notes: data.notes ?? existing.notes,
        metadata: data.metadata ?? existing.metadata,
        history: data.history ?? existing.history
      }
    });
  }

  return prisma.brandIntel.create({
    data: {
      brandName,
      notes: data.notes ?? {},
      metadata: data.metadata ?? {},
      history: data.history ?? {}
    }
  });
}
