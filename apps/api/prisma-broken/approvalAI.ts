import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Simulates an AI evaluation of an entity (e.g., a deliverable) to be approved.
 * @param entityType The type of the entity (e.g., "DELIVERABLE").
 * @param entityId The ID of the entity.
 * @returns A JSON object with the AI's assessment.
 */
export const evaluateForApproval = async (entityType: string, entityId: string) => {
  // In a real app, you'd fetch the entity and its context (brief, creative direction, etc.)
  // const deliverable = await prisma.deliverable.findUnique({ where: { id: entityId } });
  // const creativeDirection = await prisma.creativeDirection.findUnique({ where: { campaignId: deliverable.campaignId } });

  // Mock AI analysis
  const score = Math.floor(Math.random() * 20) + 80; // 80-99

  const riskFlags = {
    compliance: 'low',
    brand_safety: 'none',
    tone_mismatch: 'medium',
  };

  const requiredFixes = score < 90 ? [
    'The call-to-action does not match the one specified in the brief.',
  ] : [];

  const suggestions = [
    'Consider adding a trending audio to potentially increase reach.',
  ];

  return {
    score,
    riskFlags,
    requiredFixes,
    suggestions,
  };
};