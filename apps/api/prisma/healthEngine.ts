import prisma from '../../lib/prisma.js';
import { scoreWorkload } from '../ai/workloadScorer.js';
import { scoreEnergy } from '../ai/energyScorer.js';
import { predictBurnout } from '../ai/burnoutPredictor.js';
import { forecastCapacity } from '../ai/capacityForecaster.js';
import { generateHealthSummary } from '../ai/talentHealthSummary.js';

/**
 * Generates a complete health snapshot for a given talent.
 * @param talentId - The ID of the talent to analyze.
 */
export async function generateSnapshot(talentId: string) {
  // In a real app, you would use the talentId to fetch the associated userId
  const userId = 'clxrz45gn000008l4hy285p0g'; // Mock user for demonstration

  // 1. Gather context from different modules
  const upcomingEvents = await prisma.talentEvent.findMany({
    where: { userId, startTime: { gte: new Date() } },
  });
  const recentDeliverables = await prisma.deliverable.findMany({
    where: { userId, dueDate: { gte: new Date() } },
  });
  const activeNegotiations = await prisma.negotiationThread.findMany({
    where: { userId, status: 'active' },
  });
  const recentMessages = await prisma.negotiationTurn.findMany({
    where: { thread: { userId }, actor: 'ai' },
    take: 10,
    orderBy: { createdAt: 'desc' },
  });

  const workloadContext = {
    eventCount: upcomingEvents.length,
    deliverableCount: recentDeliverables.length,
    negotiationCount: activeNegotiations.length,
  };

  const energyContext = { recentMessages };

  // 2. Run AI analysis modules
  const { workloadScore } = await scoreWorkload(workloadContext);
  const { energyScore } = await scoreEnergy(energyContext);
  const travelLoad = upcomingEvents.reduce((acc, event) => acc + (event.travelTimeMinutes || 0), 0) / 60; // Total travel in hours

  const { burnoutRisk } = await predictBurnout({ workloadScore, energyScore, travelLoad });
  const capacityForecast = await forecastCapacity({ upcomingEvents, recentDeliverables });

  const snapshotData = {
    userId,
    workloadScore,
    energyScore,
    burnoutRisk,
    capacityForecast,
    travelLoad,
    rawMetrics: { ...workloadContext, travelHours: travelLoad },
  };

  // 3. Generate final summary and recommendations
  const { summary, recommendations } = await generateHealthSummary(snapshotData);

  const finalSnapshot = {
    ...snapshotData,
    contextualSummary: summary,
    recommendations,
  };

  // 4. Store the snapshot
  return storeSnapshot(finalSnapshot);
}

/**
 * Stores a generated health snapshot in the database.
 * @param snapshotData - The complete snapshot data to save.
 */
async function storeSnapshot(snapshotData: any) {
  const snapshot = await prisma.talentHealthSnapshot.create({
    data: {
      userId: snapshotData.userId,
      workloadScore: snapshotData.workloadScore,
      energyScore: snapshotData.energyScore,
      burnoutRisk: snapshotData.burnoutRisk,
      capacityForecast: snapshotData.capacityForecast,
      travelLoad: snapshotData.travelLoad,
      contextualSummary: snapshotData.contextualSummary,
      recommendations: snapshotData.recommendations,
      rawMetrics: snapshotData.rawMetrics,
    },
  });
  console.log(`[HEALTH ENGINE] Stored new health snapshot ${snapshot.id} for user ${snapshot.userId}`);
  return snapshot;
}