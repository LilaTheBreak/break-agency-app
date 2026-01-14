import prisma from '../lib/prisma';

export async function detectBrand(email: any) {
  const from = email?.raw?.from || email?.from;
  if (!from) return null;

  const domain = from.split("@")[1]?.toLowerCase();
  if (!domain) return null;

  let brand = await prisma.brand.findFirst({
    where: { name: domain.split(".")[0] }
  });

  if (!brand) {
    brand = await prisma.brand.create({
      data: {
        id: `brand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: domain.split(".")[0],
        values: [],
        restrictedCategories: [],
        preferredCreatorTypes: []
      }
    });
  }

  return brand;
}
