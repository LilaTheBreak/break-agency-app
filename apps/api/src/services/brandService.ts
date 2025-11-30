import prisma from "../lib/prisma.js";

export async function detectBrand(email: any) {
  const from = email?.raw?.from || email?.from;
  if (!from) return null;

  const domain = from.split("@")[1]?.toLowerCase();
  if (!domain) return null;

  let brand = await prisma.brand.findFirst({
    where: { domains: { has: domain } }
  });

  if (!brand) {
    brand = await prisma.brand.create({
      data: {
        name: domain.split(".")[0],
        domains: [domain],
        emails: [from]
      }
    });
  }

  return brand;
}
