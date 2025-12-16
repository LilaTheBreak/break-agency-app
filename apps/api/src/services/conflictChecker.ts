// services/conflictChecker.ts

import prisma from "../lib/prisma.js";

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
        stage: { in: ["LIVE", "APPROVED", "CONTENT_SUBMITTED", "NEGOTIATING"] }
      },
      select: {
        brand: true,
        category: true,
        startDate: true,
        endDate: true,
        exclusivityDays: true,
        fee: true
      }
    });

    if (newDeal.category) {
      for (const d of existingDeals) {
        if (d.category === newDeal.category) {
          conflicts.push(
            `Category conflict: Talent already has an active deal in '${newDeal.category}'.`
          );
          blocking = true;
        }
      }
    }

    for (const d of existingDeals) {
      if (!d.exclusivityDays || !d.endDate) continue;

      const exclusivityEnd = new Date(d.endDate);
      exclusivityEnd.setDate(exclusivityEnd.getDate() + (d.exclusivityDays || 0));

      if (newStart && newStart <= exclusivityEnd) {
        conflicts.push(
          `Exclusivity conflict: Previous deal blocks new activity until ${exclusivityEnd.toDateString()}.`
        );
        blocking = true;
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
      const avgRate =
        existingDeals.reduce((sum, d) => sum + (d.fee || 0), 0) /
        (existingDeals.length || 1);

      if (newDeal.rate < avgRate * 0.6) {
        conflicts.push(
          `Pricing warning: Proposed rate (£${newDeal.rate}) is significantly below typical (£${avgRate.toFixed(
            0
          )}).`
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
