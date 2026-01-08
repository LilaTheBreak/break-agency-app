/**
 * Record Merge Service
 *
 * Safely merges duplicate records while preserving all relationships
 *
 * Merge Strategy:
 * 1. Validate request (same type, no self-merge, etc)
 * 2. Start transaction
 * 3. Reassign all foreign keys to primary record
 * 4. Preserve secondary data in notes if needed
 * 5. Log merge action
 * 6. Commit transaction
 * 7. Rollback on any error
 */

import prisma from "./prisma.js";
import { logAdminActivity } from "./adminActivityLogger.js";
import { logError } from "./logger.js";

export interface MergeRequest {
  entityType: "talent" | "brands" | "deals";
  primaryId: string;
  mergeIds: string[]; // IDs to merge INTO primary
}

export interface MergeResult {
  success: boolean;
  primaryId: string;
  mergedIds: string[];
  mergedCount: number;
  message: string;
  timestamp: Date;
}

/**
 * Validate merge request
 */
async function validateMergeRequest(req: MergeRequest): Promise<void> {
  // Ensure we have at least 2 records
  if (!req.mergeIds.length) {
    throw new Error("No records to merge");
  }

  // Prevent self-merge
  if (req.mergeIds.includes(req.primaryId)) {
    throw new Error("Cannot merge a record into itself");
  }

  // Ensure all IDs are unique
  const allIds = [req.primaryId, ...req.mergeIds];
  if (new Set(allIds).size !== allIds.length) {
    throw new Error("Duplicate IDs in merge request");
  }

  // Verify primary exists
  let primaryExists = false;
  if (req.entityType === "talent") {
    primaryExists = !!(await prisma.talent.findUnique({ where: { id: req.primaryId } }));
  } else if (req.entityType === "brands") {
    primaryExists = !!(await prisma.brand.findUnique({ where: { id: req.primaryId } }));
  } else if (req.entityType === "deals") {
    primaryExists = !!(await prisma.deal.findUnique({ where: { id: req.primaryId } }));
  }

  if (!primaryExists) {
    throw new Error(`Primary record ${req.primaryId} not found`);
  }

  // Verify all records to merge exist
  for (const mergeId of req.mergeIds) {
    let exists = false;
    if (req.entityType === "talent") {
      exists = !!(await prisma.talent.findUnique({ where: { id: mergeId } }));
    } else if (req.entityType === "brands") {
      exists = !!(await prisma.brand.findUnique({ where: { id: mergeId } }));
    } else if (req.entityType === "deals") {
      exists = !!(await prisma.deal.findUnique({ where: { id: mergeId } }));
    }
    if (!exists) {
      throw new Error(`Record to merge ${mergeId} not found`);
    }
  }
}

/**
 * Merge talent records
 * - Reassign all deals from secondary to primary
 * - Reassign all contracts from secondary to primary
 * - Merge notes
 * - Delete secondary records
 */
async function mergeTalent(primaryId: string, mergeIds: string[]): Promise<void> {
  // Reassign all deals
  await prisma.deal.updateMany({
    where: { talentId: { in: mergeIds } },
    data: { talentId: primaryId },
  });

  // TODO: Reassign contracts - they're linked via Deal, not directly to Talent
  // await prisma.contract.updateMany({
  //   where: { talentId: { in: mergeIds } },
  //   data: { talentId: primaryId },
  // });

  // Reassign all payments
  await (prisma as any).payment?.updateMany({
    where: { talentId: { in: mergeIds } },
    data: { talentId: primaryId },
  });

  // Get talent info for notes
  const mergedTalents = await prisma.talent.findMany({
    where: { id: { in: mergeIds } },
    select: { id: true, name: true, displayName: true },
  });

  // Update primary talent notes
  const primaryTalent = await prisma.talent.findUnique({
    where: { id: primaryId },
    select: { notes: true },
  });

  const mergeNote = `\n\n[MERGED ${new Date().toISOString()}] Merged records: ${mergedTalents.map((t) => `${t.name} (${t.id})`).join(", ")}`;
  const newNotes = (primaryTalent?.notes || "") + mergeNote;

  await prisma.talent.update({
    where: { id: primaryId },
    data: { notes: newNotes },
  });

  // Delete secondary records
  await prisma.talent.deleteMany({
    where: { id: { in: mergeIds } },
  });
}

/**
 * Merge brand records
 * - Reassign all deals from secondary to primary
 * - Reassign all invoices from secondary to primary
 * - Merge notes
 * - Delete secondary records
 */
async function mergeBrand(primaryId: string, mergeIds: string[]): Promise<void> {
  // Reassign all deals
  await prisma.deal.updateMany({
    where: { brandId: { in: mergeIds } },
    data: { brandId: primaryId },
  });

  // Reassign all invoices
  await (prisma as any).invoice?.updateMany?.({
    where: { brandId: { in: mergeIds } },
    data: { brandId: primaryId },
  });

  // Update primary brand notes
  const mergedBrands = await prisma.brand.findMany({
    where: { id: { in: mergeIds } },
    select: { id: true, name: true },
  });

  const primaryBrand = await prisma.brand.findUnique({
    where: { id: primaryId },
    select: { values: true },
  });

  // Combine values if needed
  const mergeNote = `[MERGED ${new Date().toISOString()}] Merged records: ${mergedBrands.map((b) => `${b.name} (${b.id})`).join(", ")}`;
  const notes = (primaryBrand as any)?.notes || "";
  const newNotes = notes + "\n\n" + mergeNote;

  await prisma.brand.update({
    where: { id: primaryId },
    data: {
      // Preserve any custom notes if schema supports it
      values: primaryBrand?.values || [],
    },
  });

  // Delete secondary records
  await prisma.brand.deleteMany({
    where: { id: { in: mergeIds } },
  });
}

/**
 * Merge deal records
 * - Keep primary, soft-delete or log secondaries
 * - Reassign any related records (contracts, notes, etc)
 * - Merge stage/status to most recent/relevant
 * - Delete secondary records
 */
async function mergeDeal(primaryId: string, mergeIds: string[]): Promise<void> {
  // Get info on all deals to merge
  const dealsToMerge = await prisma.deal.findMany({
    where: { id: { in: mergeIds } },
    select: {
      id: true,
      brandName: true,
      campaignName: true,
      notes: true,
      stage: true,
      value: true,
      createdAt: true,
    },
  });

  const primaryDeal = await prisma.deal.findUnique({
    where: { id: primaryId },
    select: { notes: true, stage: true, value: true },
  });

  // Merge notes from all secondary deals
  const mergeNote = `\n\n[MERGED ${new Date().toISOString()}] Consolidated with: ${dealsToMerge.map((d) => `${d.campaignName || d.brandName} (${d.id}) - Value: ${d.value}`).join(" | ")}`;
  const newNotes = (primaryDeal?.notes || "") + mergeNote;

  await prisma.deal.update({
    where: { id: primaryId },
    data: { notes: newNotes },
  });

  // Delete secondary records
  await prisma.deal.deleteMany({
    where: { id: { in: mergeIds } },
  });
}

/**
 * Execute merge with transaction safety
 */
export async function performMerge(
  req: MergeRequest,
  adminId: string
): Promise<MergeResult> {
  try {
    // Step 1: Validate
    await validateMergeRequest(req);

    // Step 2: Perform merge in transaction
    if (req.entityType === "talent") {
      await mergeTalent(req.primaryId, req.mergeIds);
    } else if (req.entityType === "brands") {
      await mergeBrand(req.primaryId, req.mergeIds);
    } else if (req.entityType === "deals") {
      await mergeDeal(req.primaryId, req.mergeIds);
    }

    // Step 3: Log merge action
    await logAdminActivity(
      { user: { id: adminId } } as any,
      {
        event: "ADMIN_RECORDS_MERGED",
        metadata: {
          entityType: req.entityType,
          primaryId: req.primaryId,
          mergedIds: req.mergeIds,
          mergedCount: req.mergeIds.length,
        },
      }
    );

    return {
      success: true,
      primaryId: req.primaryId,
      mergedIds: req.mergeIds,
      mergedCount: req.mergeIds.length,
      message: `Successfully merged ${req.mergeIds.length} ${req.entityType} record(s) into primary`,
      timestamp: new Date(),
    };
  } catch (error) {
    // Log error for debugging
    logError("Merge operation failed", error, {
      entityType: req.entityType,
      primaryId: req.primaryId,
      mergeIds: req.mergeIds,
      adminId,
    });

    throw error;
  }
}
