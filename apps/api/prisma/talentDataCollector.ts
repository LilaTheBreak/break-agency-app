import prisma from '../../lib/prisma.js';

/**
 * Collects a comprehensive profile for a single talent.
 * @param talentId - The ID of the Talent record.
 * @returns A promise that resolves to a rich talent data object.
 */
export async function collectTalentData(talentId: string) {
  console.log(`[TALENT DATA] Collecting data for talent ${talentId}...`);
  return prisma.talent.findUnique({
    where: { id: talentId },
    include: {
      user: { include: { personaProfile: true, socialAnalytics: { take: 1, orderBy: { capturedAt: 'desc' } } } },
      pricingModels: true,
      aiSettings: true,
    },
  });
}