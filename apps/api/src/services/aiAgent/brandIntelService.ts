import prisma from '../../lib/prisma';

export async function getBrandIntel(brandId: string) {
  return prisma.brandIntelligence.findFirst({
    where: {
      brandId
    }
  });
}

export async function updateBrandIntel(brandId: string, data: any) {
  const existing = await getBrandIntel(brandId);

  if (existing) {
    return prisma.brandIntelligence.update({
      where: { id: existing.id },
      data: {
        insights: data.insights ?? existing.insights,
        category: data.category ?? existing.category,
      }
    });
  }

  return prisma.brandIntelligence.create({
    data: {
      brandId,
      insights: data.insights ?? {},
      category: data.category ?? ""
    }
  });
}
