import prisma from '../../lib/prisma.js';
import { aiClient } from './aiClient.js';

/**
 * Gathers all necessary inputs for a creator health check.
 */
export async function buildHealthInput(userId: string) {
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 3600 * 1000);

  const upcomingDeliverables = await prisma.deliverable.count({
    where: { userId, status: { not: 'delivered' }, dueDate: { lte: sevenDaysFromNow } },
  });

  const upcomingEvents = await prisma.talentEvent.count({
    where: { userId, startTime: { lte: sevenDaysFromNow } },
  });

  const activeNegotiations = await prisma.dealThread.count({
    where: { userId, status: 'open' },
  });

  return {
    userId,
    upcomingDeliverables,
    upcomingEvents,
    activeNegotiations,
  };
}

const healthPrompt = (input: any) => `
You are an AI that analyzes a creator's wellbeing. Based on the following data, generate a health assessment.

**Input Data:**
- Upcoming Deliverables (next 7 days): ${input.upcomingDeliverables}
- Upcoming Events (next 7 days): ${input.upcomingEvents}
- Active Deal Negotiations: ${input.activeNegotiations}

**Instructions:**
Provide a full assessment in a structured JSON format.
- **workloadScore**: A score from 0 (no load) to 100 (extreme overload).
- **burnoutRisk**: A probability from 0.0 to 1.0.
- **capacityForecast**: A percentage of available capacity for the next 30 days.
- **recommendations**: A list of 2-3 actionable recommendations to improve health.
- **aiSummary**: A one-sentence summary of the creator's current status.

**JSON Output Schema:**
{
  "workloadScore": "number",
  "burnoutRisk": "number",
  "capacityForecast": "number",
  "recommendations": ["string"],
  "aiSummary": "string"
}
`;

/**
 * Runs the full AI prediction suite for creator health.
 */
export async function predictCreatorHealth(input: any) {
  try {
    const prompt = healthPrompt(input);
    return await aiClient.json(prompt);
  } catch (error) {
    console.error('[AI CREATOR HEALTH ERROR]', error);
    return { workloadScore: 50, burnoutRisk: 0.3, capacityForecast: 60, recommendations: ['AI engine offline.'], aiSummary: 'Health check unavailable.' };
  }
}

/**
 * Saves the health check result to the database.
 */
export async function saveCreatorHealth(talentId: string, userId: string, result: any) {
  const healthData = { talentId, userId, ...result };
  return prisma.creatorHealth.upsert({
    where: { talentId },
    create: healthData,
    update: healthData,
  });
}