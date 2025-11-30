import prisma from '../../lib/prisma.js';

/**
 * Updates the negotiation profile for a brand based on a recent message.
 * This is a simplified stub. A real version would use AI to analyze patterns.
 * @param brandEmail - The email of the brand.
 * @param message - The latest message from the brand.
 */
export async function updateBrandNegotiationStats(brandEmail: string, message: string) {
  const brandRel = await prisma.brandRelationship.findFirst({ where: { brandEmail } });
  if (!brandRel) return;

  const profile = (brandRel.negotiationProfile as any) || { pushbackCount: 0, concessions: 0 };

  if (message.toLowerCase().includes('budget') || message.toLowerCase().includes('rate')) {
    profile.pushbackCount = (profile.pushbackCount || 0) + 1;
  }

  await prisma.brandRelationship.update({
    where: { id: brandRel.id },
    data: { negotiationProfile: profile },
  });
}

/**
 * Retrieves the negotiation profile for a brand.
 */
export async function getBrandNegotiationProfile(brandEmail: string) {
  const brandRel = await prisma.brandRelationship.findFirst({ where: { brandEmail } });
  return brandRel?.negotiationProfile;
}