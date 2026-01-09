import prisma from "../lib/prisma.js";
import type { RevenueGoal } from "@prisma/client";
import * as revenueSourceService from "./revenueSourceService.js";

/**
 * RevenueGoalService
 * 
 * Manages revenue goals and goal tracking for exclusive talent
 */

export interface RevenueGoalInput {
  talentId: string;
  goalType: string; // MONTHLY_TOTAL, QUARTERLY_TOTAL, ANNUAL_TOTAL, PLATFORM_SPECIFIC
  platform?: string; // Optional - for platform-specific goals
  targetAmount: number;
  currency?: string;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
}

/**
 * Create a revenue goal
 */
export async function createRevenueGoal(input: RevenueGoalInput): Promise<RevenueGoal> {
  const { talentId, goalType, platform, targetAmount, currency = "GBP", startDate, endDate, notes } = input;

  // Validate that talent exists
  const talent = await prisma.talent.findUnique({
    where: { id: talentId },
    select: { id: true },
  });

  if (!talent) {
    throw new Error(`Talent ${talentId} not found`);
  }

  // Check for duplicate goal
  const existing = await prisma.revenueGoal.findUnique({
    where: {
      talentId_goalType_platform: {
        talentId,
        goalType,
        platform: platform || null,
      },
    },
  });

  if (existing) {
    // Update instead of creating
    return updateRevenueGoal(existing.id, input);
  }

  const goal = await prisma.revenueGoal.create({
    data: {
      talentId,
      goalType,
      platform: platform || null,
      targetAmount,
      currency,
      timeframe: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      notes,
    },
  });

  return goal;
}

/**
 * Get all goals for a talent
 */
export async function getGoalsForTalent(talentId: string): Promise<RevenueGoal[]> {
  return prisma.revenueGoal.findMany({
    where: { talentId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get a specific goal
 */
export async function getRevenueGoal(goalId: string): Promise<RevenueGoal | null> {
  return prisma.revenueGoal.findUnique({
    where: { id: goalId },
  });
}

/**
 * Update a revenue goal
 */
export async function updateRevenueGoal(goalId: string, updates: Partial<RevenueGoalInput>): Promise<RevenueGoal> {
  const data: any = {};

  if (updates.targetAmount) data.targetAmount = updates.targetAmount;
  if (updates.currency) data.currency = updates.currency;
  if (updates.notes) data.notes = updates.notes;
  if (updates.startDate || updates.endDate) {
    const existing = await getRevenueGoal(goalId);
    if (existing && existing.timeframe) {
      data.timeframe = {
        startDate: updates.startDate ? updates.startDate.toISOString() : (existing.timeframe as any).startDate,
        endDate: updates.endDate ? updates.endDate.toISOString() : (existing.timeframe as any).endDate,
      };
    }
  }

  return prisma.revenueGoal.update({
    where: { id: goalId },
    data,
  });
}

/**
 * Delete a revenue goal
 */
export async function deleteRevenueGoal(goalId: string): Promise<void> {
  await prisma.revenueGoal.delete({
    where: { id: goalId },
  });
}

/**
 * Get goal progress for a talent
 * Returns actual revenue vs goal
 */
export async function getGoalProgress(
  goalId: string
): Promise<{
  goal: RevenueGoal;
  targetAmount: number;
  actualAmount: number;
  percentComplete: number;
  currency: string;
  remaining: number;
  status: "BELOW" | "ON_TRACK" | "EXCEEDED";
}> {
  const goal = await getRevenueGoal(goalId);
  if (!goal) {
    throw new Error(`Goal ${goalId} not found`);
  }

  const timeframe = goal.timeframe as any;
  const startDate = new Date(timeframe.startDate);
  const endDate = new Date(timeframe.endDate);

  let actualAmount = 0;

  if (goal.platform) {
    // Platform-specific goal
    const byPlatform = await revenueSourceService.getRevenueByPlatformForTalent(
      goal.talentId,
      startDate,
      endDate
    );
    const platform = byPlatform.find((p) => p.platform === goal.platform);
    actualAmount = platform ? platform.totalNet : 0;
  } else {
    // Total revenue goal
    const total = await revenueSourceService.getTotalRevenueForTalent(goal.talentId, startDate, endDate);
    actualAmount = total.totalNet;
  }

  const percentComplete = (actualAmount / goal.targetAmount) * 100;
  const remaining = Math.max(0, goal.targetAmount - actualAmount);
  const status =
    percentComplete >= 100 ? "EXCEEDED" : percentComplete >= 80 ? "ON_TRACK" : ("BELOW" as const);

  return {
    goal,
    targetAmount: goal.targetAmount,
    actualAmount,
    percentComplete,
    currency: goal.currency,
    remaining,
    status,
  };
}

/**
 * Get all goal progress for a talent
 */
export async function getAllGoalProgress(talentId: string): Promise<
  Array<{
    goal: RevenueGoal;
    targetAmount: number;
    actualAmount: number;
    percentComplete: number;
    currency: string;
    remaining: number;
    status: "BELOW" | "ON_TRACK" | "EXCEEDED";
  }>
> {
  const goals = await getGoalsForTalent(talentId);

  const progress = await Promise.all(goals.map((goal) => getGoalProgress(goal.id)));

  return progress;
}

export default {
  createRevenueGoal,
  getGoalsForTalent,
  getRevenueGoal,
  updateRevenueGoal,
  deleteRevenueGoal,
  getGoalProgress,
  getAllGoalProgress,
};
