import prisma from '../../lib/prisma.js';

/**
 * Retrieves the latest policy for a given brand.
 * @param brandId - The ID of the brand.
 */
export async function getPolicyForBrand(brandId: string) {
  const policy = await prisma.brandPolicy.findUnique({
    where: { brandId },
    include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
  });
  return policy?.versions[0] || null;
}

/**
 * Updates a brand's policy from a new source, creating a new version.
 * @param brandId - The ID of the brand.
 * @param newRules - The new rules to merge into the policy.
 * @param source - The source of these new rules (e.g., "contract_S41").
 */
export async function updatePolicyFromSource(brandId: string, newRules: any, source: string) {
  const policy = await prisma.brandPolicy.upsert({
    where: { brandId },
    create: { brandId, name: `Policy for Brand ${brandId}` },
    update: {},
    include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
  });

  const currentRules = (policy.versions[0]?.rules as any) || {};
  const mergedRules = { ...currentRules, ...newRules }; // Simple merge, can be more sophisticated

  return prisma.brandPolicyVersion.create({
    data: {
      policyId: policy.id,
      version: (policy.versions[0]?.version || 0) + 1,
      rules: mergedRules,
      source,
    },
  });
}