/**
 * Migration Script: Backfill brandId for existing Contract records
 * 
 * This script populates the brandId field for contracts that were created
 * before the explicit brand linkage was added. It derives brandId from the
 * associated Deal's brandId.
 * 
 * Run once after schema migration:
 * npx tsx apps/api/scripts/backfillContractBrandIds.ts
 */

import prisma from "../src/lib/prisma.js";

async function backfillContractBrandIds() {
  console.log("[MIGRATION] Starting contract brandId backfill...");

  try {
    // Find all contracts without brandId
    const contractsWithoutBrand = await prisma.contract.findMany({
      where: {
        brandId: null,
      },
      include: {
        Deal: {
          select: {
            id: true,
            brandId: true,
          },
        },
      },
    });

    console.log(`[MIGRATION] Found ${contractsWithoutBrand.length} contracts without brandId`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const contract of contractsWithoutBrand) {
      try {
        if (!contract.Deal || !contract.Deal.brandId) {
          console.warn(`[MIGRATION] Contract ${contract.id} has no associated deal or deal has no brandId, skipping`);
          skipped++;
          continue;
        }

        await prisma.contract.update({
          where: { id: contract.id },
          data: { brandId: contract.Deal.brandId },
        });

        updated++;
        if (updated % 10 === 0) {
          console.log(`[MIGRATION] Updated ${updated} contracts...`);
        }
      } catch (error) {
        console.error(`[MIGRATION] Error updating contract ${contract.id}:`, error);
        errors++;
      }
    }

    console.log(`[MIGRATION] Complete!`);
    console.log(`[MIGRATION] - Updated: ${updated}`);
    console.log(`[MIGRATION] - Skipped: ${skipped}`);
    console.log(`[MIGRATION] - Errors: ${errors}`);
  } catch (error) {
    console.error("[MIGRATION] Fatal error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backfillContractBrandIds();

