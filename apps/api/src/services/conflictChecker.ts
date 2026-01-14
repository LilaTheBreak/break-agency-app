// services/conflictChecker.ts

import prisma from '../lib/prisma.js';

export interface ConflictResult {
  hasConflict: boolean;
  conflicts: string[];
  blocking: boolean;
}

interface DealLike {
  brand?: string;
  category?: string;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  exclusivityDays?: number | null;
  rate?: number | null;
}

function normaliseDate(d?: Date | string | null): Date | null {
  if (!d) return null;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export async function checkForConflicts(
  talentId: string,
  newDeal: DealLike
): Promise<ConflictResult> {
  try {
    const conflicts: string[] = [];
    let blocking = false;

    const newStart = normaliseDate(newDeal.startDate);
    const newEnd = normaliseDate(newDeal.endDate);

    const existingDeals = await prisma.deal.findMany({
      where: {
        talentId,
        stage: { in: ["NEGOTIATION", "CONTRACT_SENT", "CONTRACT_SIGNED", "DELIVERABLES_IN_PROGRESS"] }
      },
      select: {
        Brand: { select: { name: true } },
        startDate: true,
        endDate: true
      }
    });

    if (newDeal.category) {
      // Category-based conflict checking is not yet implemented
      // as Deal model doesn't have a category field
    }

    for (const d of existingDeals) {
      // Exclusivity logic simplified
      if (d.endDate) {
        const exclusivityEnd = new Date(d.endDate);
        exclusivityEnd.setDate(exclusivityEnd.getDate() + 30); // Default 30 days

        if (newStart && newStart <= exclusivityEnd) {
          conflicts.push(
            `Exclusivity conflict: Previous deal blocks new activity until ${exclusivityEnd.toDateString()}.`
          );
          blocking = true;
        }
      }
    }

    if (newStart && newEnd) {
      for (const d of existingDeals) {
        const s = normaliseDate(d.startDate);
        const e = normaliseDate(d.endDate);
        if (!s || !e) continue;

        const overlapping = newStart <= e && newEnd >= s;
        if (overlapping) {
          conflicts.push(
            `Date overlap: New project overlaps with an existing campaign (${s.toDateString()} → ${e.toDateString()}).`
          );
        }
      }
    }

    if (newDeal.rate) {
      const avgRate = 0; // Simplified - no fee field
      if (newDeal.rate < (avgRate || 1) * 0.6) {
        conflicts.push(
          `Pricing warning: Proposed rate (£${newDeal.rate}) is significantly below typical.`
        );
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
      blocking
    };
  } catch (err) {
    return {
      hasConflict: false,
      conflicts: ["Conflict check failed; unable to evaluate."],
      blocking: false
    };
  }
}

export default checkForConflicts;
export { checkForConflicts as checkConflicts };
