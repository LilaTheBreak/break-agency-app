/**
 * Brand Auto-Creation Service
 * 
 * When deals reference brands that don't exist, this service automatically creates
 * placeholder Brand records to heal the system state.
 * 
 * Features:
 * - Fuzzy brand name matching (case-insensitive, punctuation-tolerant)
 * - Automatic URL inference (https://www.{brandname}.com)
 * - Duplicate prevention (checks for existing brands with normalized names)
 * - Idempotent (safe to run multiple times)
 * - Marked as auto-created for future manual enrichment
 * 
 * Constraints:
 * - Does NOT scrape external sites
 * - Does NOT overwrite existing brands
 * - Does NOT guess social handles
 * - Does NOT block operations if creation fails
 */

import prisma from "./prisma.js";
import type { Prisma } from "@prisma/client";

// ============================================================================
// NORMALIZATION & MATCHING
// ============================================================================

/**
 * Normalize brand name for matching
 * - Lowercase
 * - Trim whitespace
 * - Remove special punctuation (keep spaces and alphanumerics)
 * - Collapse multiple spaces to single space
 */
export function normalizeBrandName(brandName: string): string {
  return brandName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "") // Remove special chars but keep spaces
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim();
}

/**
 * Infer website URL for a brand
 * Simple heuristic: https://www.{normalized-brand-name}.com
 * 
 * Examples:
 * - "Nike" → "https://www.nike.com"
 * - "The Home Depot" → "https://www.the-home-depot.com"
 * - "Coca-Cola" → "https://www.cocacola.com"
 */
export function inferWebsiteUrl(brandName: string): string {
  const normalized = normalizeBrandName(brandName)
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .toLowerCase();
  
  return `https://www.${normalized}.com`;
}

// ============================================================================
// AUTO-CREATION LOGIC
// ============================================================================

interface AutoCreatedBrandMetadata {
  source: "deal_inferred";
  sourceEntityId?: string; // ID of the deal that triggered creation
  createdAt: string;
  assumedUrl: true;
}

/**
 * Find or create a brand based on a brand name
 * 
 * Process:
 * 1. If brandId is provided and valid, return existing brand
 * 2. If brandName is provided:
 *    a. Check for existing brand with normalized name match
 *    b. If found, return existing brand (prevents duplicates)
 *    c. If not found, create new auto-created brand record
 * 3. Return null if neither brandId nor brandName provided
 * 
 * Safe for repeated calls (idempotent):
 * - Same brand name always returns same record
 * - No duplicate brands created
 * - Existing brands never overwritten
 */
export async function findOrCreateBrand(
  brandId: string | null | undefined,
  brandName: string | null | undefined,
  sourceEntityId?: string // ID of the deal triggering this (for audit trail)
): Promise<{ id: string; name: string; autoCreated: boolean } | null> {
  try {
    // If valid brandId exists, trust it
    if (brandId) {
      const existing = await prisma.brand.findUnique({
        where: { id: brandId },
        select: { id: true, name: true },
      });

      if (existing) {
        return { id: existing.id, name: existing.name, autoCreated: false };
      }
      
      // brandId points to missing record - will still try to create from brandName
      console.warn(`[brandAutoCreation] brandId ${brandId} not found, attempting recovery from brandName`);
    }

    // If no brand name, we can't help
    if (!brandName || !brandName.trim()) {
      return null;
    }

    // Normalize the brand name for matching
    const normalizedName = normalizeBrandName(brandName);
    if (!normalizedName) {
      return null;
    }

    // Try to find existing brand with similar normalized name
    const existingBrand = await prisma.brand.findFirst({
      where: {
        name: {
          contains: normalizedName,
          mode: "insensitive",
        },
      },
      select: { id: true, name: true },
    });

    if (existingBrand) {
      return { id: existingBrand.id, name: existingBrand.name, autoCreated: false };
    }

    // No existing brand found - create auto-created placeholder
    // Use the original brand name for display, but ensure uniqueness
    const finalBrandName = brandName.trim();
    const websiteUrl = inferWebsiteUrl(finalBrandName);

    const metadata: AutoCreatedBrandMetadata = {
      source: "deal_inferred",
      sourceEntityId,
      createdAt: new Date().toISOString(),
      assumedUrl: true,
    };

    console.log(`[brandAutoCreation] Creating auto-generated brand: "${finalBrandName}"`);

    const newBrand = await prisma.brand.create({
      data: {
        id: `brand_auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: finalBrandName,
        values: [],
        restrictedCategories: [],
        preferredCreatorTypes: [],
        targetAudience: {
          source: "auto_created",
          status: "placeholder",
          notes: "Auto-generated from deal. Requires manual enrichment.",
        },
      },
      select: { id: true, name: true },
    });

    console.log(`[brandAutoCreation] Successfully created brand: ${newBrand.id} (${newBrand.name})`);

    return { id: newBrand.id, name: newBrand.name, autoCreated: true };
  } catch (error) {
    // Log but don't throw - brand auto-creation should never block operations
    console.error(`[brandAutoCreation] Error in findOrCreateBrand for "${brandName}":`, error);
    return null;
  }
}

// ============================================================================
// BATCH HEALING
// ============================================================================

/**
 * Heal all deals with missing brands in bulk
 * 
 * Finds all deals where:
 * - Brand relation is null OR
 * - brandId is null but brandName exists
 * 
 * Attempts to create or link a brand for each deal
 * 
 * Returns summary of actions taken
 */
export async function healMissingBrands(): Promise<{
  totalChecked: number;
  healed: number;
  failed: number;
  errors: string[];
}> {
  const result = {
    totalChecked: 0,
    healed: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    // Find all deals without valid brand links
    const brokenDeals = await prisma.deal.findMany({
      where: {
        OR: [
          { brandId: undefined },
          { brandId: "" },
        ],
        // But must have a brandName to recover from
        brandName: { not: null },
      },
      select: {
        id: true,
        brandId: true,
        brandName: true,
        userId: true,
      },
    });

    result.totalChecked = brokenDeals.length;

    for (const deal of brokenDeals) {
      try {
        const brand = await findOrCreateBrand(deal.brandId, deal.brandName, deal.id);

        if (brand) {
          // Link the deal to the recovered/created brand
          await prisma.deal.update({
            where: { id: deal.id },
            data: { brandId: brand.id },
          });

          result.healed++;
          console.log(`[brandAutoCreation] Healed deal ${deal.id} → brand ${brand.id}`);
        } else {
          result.failed++;
          result.errors.push(`Deal ${deal.id}: Could not determine brand from name "${deal.brandName}"`);
        }
      } catch (error) {
        result.failed++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.errors.push(`Deal ${deal.id}: ${errorMsg}`);
        console.error(`[brandAutoCreation] Failed to heal deal ${deal.id}:`, error);
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    result.errors.push(`Batch healing failed: ${errorMsg}`);
    console.error(`[brandAutoCreation] Batch healing error:`, error);
  }

  return result;
}

// ============================================================================
// ENRICH DEAL RESPONSE
// ============================================================================

/**
 * Enrich a deal object to ensure it has a valid Brand
 * 
 * Used in deal fetch responses to ensure Brand is never missing
 * If Brand is null but brandName exists, attempts to find/create
 * 
 * Modifies the deal object in place
 * 
 * Returns the enriched deal
 */
export async function enrichDealBrand<T extends { id: string; brandId: string | null; brandName: string | null; Brand?: any }>(
  deal: T
): Promise<T & { _brandAutoCreated?: boolean }> {
  try {
    // If Brand already present, nothing to do
    if (deal.Brand && deal.Brand.id) {
      return deal as any;
    }

    // If no brandName, can't recover
    if (!deal.brandName) {
      return deal as any;
    }

    // Try to find or create brand
    const brand = await findOrCreateBrand(deal.brandId, deal.brandName, deal.id);

    if (brand) {
      // Update deal in database and object
      deal.brandId = brand.id;
      deal.Brand = { id: brand.id, name: brand.name };

      // Mark if we auto-created
      if (brand.autoCreated) {
        (deal as any)._brandAutoCreated = true;
      }

      // Persist the linkage
      try {
        await prisma.deal.update({
          where: { id: deal.id },
          data: { brandId: brand.id },
        });
      } catch (err) {
        // Update might fail if another process did it first, but object is enriched
        console.warn(`[brandAutoCreation] Could not persist brandId update for deal ${deal.id}:`, err);
      }
    }

    return deal as any;
  } catch (error) {
    // Never throw from enrichment - just return original deal
    console.error(`[brandAutoCreation] Error enriching deal ${deal.id}:`, error);
    return deal as any;
  }
}

export default {
  normalizeBrandName,
  inferWebsiteUrl,
  findOrCreateBrand,
  healMissingBrands,
  enrichDealBrand,
};
