/**
 * Creator Roster Management Service
 * 
 * Manages brand's saved/shortlisted/active creator lists.
 * 
 * Roster Semantics:
 * - "saved": Bookmarked for future consideration (like favorites)
 * - "shortlisted": Under active consideration for a campaign
 * - "active": Currently working together (has active deals)
 * 
 * This is essentially a favorites/bookmark system for brands to track creators they're interested in.
 */

import prisma from "../lib/prisma.js";
import { generateId } from "../lib/utils.js";

export interface RosterEntry {
  id: string;
  brandId: string;
  talentId: string;
  status: "saved" | "shortlisted" | "active";
  notes: string | null;
  addedAt: Date;
  updatedAt: Date;
  talent?: any; // Will include talent details when fetched
}

/**
 * Add a creator to a brand's roster
 */
export async function addToRoster(
  brandId: string,
  talentId: string,
  status: "saved" | "shortlisted" | "active" = "saved",
  notes?: string
): Promise<RosterEntry> {
  // Check if already exists
  const existing = await prisma.brandSavedTalent.findUnique({
    where: {
      brandId_talentId: {
        brandId,
        talentId
      }
    }
  });

  if (existing) {
    // Update existing entry
    return prisma.brandSavedTalent.update({
      where: {
        brandId_talentId: {
          brandId,
          talentId
        }
      },
      data: {
        status,
        notes: notes || existing.notes,
        updatedAt: new Date()
      }
    });
  }

  // Create new roster entry
  return prisma.brandSavedTalent.create({
    data: {
      id: generateId(),
      brandId,
      talentId,
      status,
      notes: notes || null
    }
  });
}

/**
 * Remove a creator from a brand's roster
 */
export async function removeFromRoster(
  brandId: string,
  talentId: string
): Promise<void> {
  await prisma.brandSavedTalent.delete({
    where: {
      brandId_talentId: {
        brandId,
        talentId
      }
    }
  });
}

/**
 * Update roster entry (change status or notes)
 */
export async function updateRosterEntry(
  brandId: string,
  talentId: string,
  updates: {
    status?: "saved" | "shortlisted" | "active";
    notes?: string;
  }
): Promise<RosterEntry> {
  return prisma.brandSavedTalent.update({
    where: {
      brandId_talentId: {
        brandId,
        talentId
      }
    },
    data: {
      ...updates,
      updatedAt: new Date()
    }
  });
}

/**
 * Get all creators in a brand's roster
 */
export async function getBrandRoster(
  brandId: string,
  filters?: {
    status?: "saved" | "shortlisted" | "active";
  }
): Promise<Array<RosterEntry & { talent: any }>> {
  const where: any = { brandId };
  
  if (filters?.status) {
    where.status = filters.status;
  }

  return prisma.brandSavedTalent.findMany({
    where,
    include: {
      Talent: {
        include: {
          User: {
            select: {
              name: true,
              email: true,
              avatarUrl: true
            }
          }
        }
      }
    },
    orderBy: {
      updatedAt: "desc"
    }
  });
}

/**
 * Check if a talent is in a brand's roster
 */
export async function isInRoster(
  brandId: string,
  talentId: string
): Promise<boolean> {
  const entry = await prisma.brandSavedTalent.findUnique({
    where: {
      brandId_talentId: {
        brandId,
        talentId
      }
    }
  });

  return entry !== null;
}

/**
 * Get roster statistics for a brand
 */
export async function getRosterStats(brandId: string): Promise<{
  total: number;
  saved: number;
  shortlisted: number;
  active: number;
}> {
  const roster = await prisma.brandSavedTalent.findMany({
    where: { brandId },
    select: { status: true }
  });

  return {
    total: roster.length,
    saved: roster.filter(r => r.status === "saved").length,
    shortlisted: roster.filter(r => r.status === "shortlisted").length,
    active: roster.filter(r => r.status === "active").length
  };
}

/**
 * Move a talent between roster statuses
 * e.g., from "saved" to "shortlisted" when seriously considering for a campaign
 */
export async function changeRosterStatus(
  brandId: string,
  talentId: string,
  newStatus: "saved" | "shortlisted" | "active",
  notes?: string
): Promise<RosterEntry> {
  return updateRosterEntry(brandId, talentId, {
    status: newStatus,
    notes
  });
}

/**
 * Bulk add talents to roster (e.g., from a search results or campaign shortlist)
 */
export async function bulkAddToRoster(
  brandId: string,
  talentIds: string[],
  status: "saved" | "shortlisted" | "active" = "saved"
): Promise<{ added: number; updated: number; errors: number }> {
  let added = 0;
  let updated = 0;
  let errors = 0;

  for (const talentId of talentIds) {
    try {
      const existing = await prisma.brandSavedTalent.findUnique({
        where: {
          brandId_talentId: {
            brandId,
            talentId
          }
        }
      });

      if (existing) {
        await prisma.brandSavedTalent.update({
          where: {
            brandId_talentId: {
              brandId,
              talentId
            }
          },
          data: {
            status,
            updatedAt: new Date()
          }
        });
        updated++;
      } else {
        await prisma.brandSavedTalent.create({
          data: {
            id: generateId(),
            brandId,
            talentId,
            status
          }
        });
        added++;
      }
    } catch (error) {
      console.error(`Failed to add talent ${talentId} to roster:`, error);
      errors++;
    }
  }

  return { added, updated, errors };
}

/**
 * Get roster entries for multiple brands (for admin views)
 */
export async function getAllBrandRosters(): Promise<Array<{
  brand: any;
  rosterCount: number;
}>> {
  const brands = await prisma.brand.findMany({
    include: {
      BrandSavedTalent: {
        select: {
          id: true
        }
      }
    }
  });

  return brands.map(brand => ({
    brand: {
      id: brand.id,
      name: brand.name
    },
    rosterCount: brand.BrandSavedTalent.length
  }));
}

/**
 * Auto-sync "active" status based on active deals
 * Run this periodically to keep roster in sync with deal status
 */
export async function syncActiveStatus(brandId: string): Promise<{
  promoted: string[]; // Talents moved to "active"
  demoted: string[]; // Talents removed from "active"
}> {
  // Find all talents with active deals for this brand
  const activeDeals = await prisma.deal.findMany({
    where: {
      brandId,
      stage: {
        in: [
          "NEGOTIATION",
          "CONTRACT_SENT",
          "CONTRACT_SIGNED",
          "DELIVERABLES_IN_PROGRESS",
          "PAYMENT_PENDING"
        ]
      }
    },
    select: {
      talentId: true
    }
  });

  const activeTalentIds = [...new Set(activeDeals.map(d => d.talentId))];

  // Get current roster with "active" status
  const currentActive = await prisma.brandSavedTalent.findMany({
    where: {
      brandId,
      status: "active"
    },
    select: {
      talentId: true
    }
  });

  const currentActiveTalentIds = currentActive.map(r => r.talentId);

  // Find talents to promote (have active deals but not marked active)
  const toPromote = activeTalentIds.filter(id => !currentActiveTalentIds.includes(id));

  // Find talents to demote (marked active but no active deals)
  const toDemote = currentActiveTalentIds.filter(id => !activeTalentIds.includes(id));

  // Promote talents to active
  for (const talentId of toPromote) {
    const existing = await prisma.brandSavedTalent.findUnique({
      where: {
        brandId_talentId: {
          brandId,
          talentId
        }
      }
    });

    if (existing) {
      await prisma.brandSavedTalent.update({
        where: {
          brandId_talentId: {
            brandId,
            talentId
          }
        },
        data: {
          status: "active",
          updatedAt: new Date()
        }
      });
    } else {
      await prisma.brandSavedTalent.create({
        data: {
          id: generateId(),
          brandId,
          talentId,
          status: "active"
        }
      });
    }
  }

  // Demote talents from active (move to "saved" instead of deleting)
  for (const talentId of toDemote) {
    await prisma.brandSavedTalent.update({
      where: {
        brandId_talentId: {
          brandId,
          talentId
        }
      },
      data: {
        status: "saved",
        updatedAt: new Date()
      }
    });
  }

  return {
    promoted: toPromote,
    demoted: toDemote
  };
}
