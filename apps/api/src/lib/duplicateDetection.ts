/**
 * Duplicate Detection Service
 *
 * Identifies potential duplicates across Talent, Brands, and Deals
 * Returns candidates with confidence indicators (HIGH | MEDIUM | LOW)
 *
 * Detection Rules:
 * - Talent: Same name, email, similar names
 * - Brands: Same name, normalized names
 * - Deals: Same brand+talent, overlapping dates, similar values
 */

import prisma from "./prisma.js";

export type DuplicateConfidence = "HIGH" | "MEDIUM" | "LOW";

export interface DuplicateCandidate {
  id: string;
  name: string;
  email?: string;
  type: string;
  createdAt: Date;
}

export interface DuplicateGroup {
  candidates: DuplicateCandidate[];
  confidence: DuplicateConfidence;
  reason: string;
  matchingFields: string[];
}

/**
 * Normalize string for comparison:
 * - lowercase
 * - trim whitespace
 * - remove punctuation
 * - normalize spaces
 */
function normalizeString(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "") // Remove punctuation
    .replace(/\s+/g, " ") // Normalize spaces
    .trim();
}

/**
 * Levenshtein distance for fuzzy matching
 * Returns similarity score (0-1, where 1 is identical)
 */
function stringSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;

  const normalA = normalizeString(a);
  const normalB = normalizeString(b);
  if (normalA === normalB) return 1;

  const matrix: number[][] = [];
  for (let i = 0; i <= normalB.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= normalA.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= normalB.length; i++) {
    for (let j = 1; j <= normalA.length; j++) {
      const cost = normalA[j - 1] === normalB[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i][j - 1] + 1,
        matrix[i - 1][j] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[normalB.length][normalA.length];
  const maxLength = Math.max(normalA.length, normalB.length);
  return 1 - distance / maxLength;
}

/**
 * Detect duplicate talents
 * Rules:
 * - HIGH: Same normalized name
 * - HIGH: Same email
 * - MEDIUM: Similar names (>80% match)
 */
export async function detectTalentDuplicates(): Promise<DuplicateGroup[]> {
  const talents = await prisma.talent.findMany({
    select: {
      id: true,
      name: true,
      displayName: true,
      primaryEmail: true,
      createdAt: true,
    },
  });

  const groups: Map<string, DuplicateCandidate[]> = new Map();
  const processed = new Set<string>();

  for (let i = 0; i < talents.length; i++) {
    if (processed.has(talents[i].id)) continue;

    const current = talents[i];
    const currentNormalized = normalizeString(current.name);
    const duplicates: DuplicateCandidate[] = [
      {
        id: current.id,
        name: current.name,
        email: current.primaryEmail || undefined,
        type: "Talent",
        createdAt: current.createdAt,
      },
    ];
    const matchingFields: Set<string> = new Set();

    processed.add(current.id);

    // Check against all subsequent talents
    for (let j = i + 1; j < talents.length; j++) {
      if (processed.has(talents[j].id)) continue;

      const candidate = talents[j];
      const candidateNormalized = normalizeString(candidate.name);

      let isMatch = false;
      let reason = "";

      // Rule 1: Exact name match (normalized)
      if (currentNormalized === candidateNormalized) {
        isMatch = true;
        matchingFields.add("name");
        reason = "Exact name match (normalized)";
      }

      // Rule 2: Same email
      if (
        current.primaryEmail &&
        candidate.primaryEmail &&
        current.primaryEmail.toLowerCase() === candidate.primaryEmail.toLowerCase()
      ) {
        isMatch = true;
        matchingFields.add("primaryEmail");
        reason = "Same email";
      }

      // Rule 3: Fuzzy name match >80%
      const similarity = stringSimilarity(current.name, candidate.name);
      if (similarity > 0.8) {
        isMatch = true;
        matchingFields.add("name");
        reason = `Similar name (${(similarity * 100).toFixed(0)}% match)`;
      }

      if (isMatch) {
        duplicates.push({
          id: candidate.id,
          name: candidate.name,
          email: candidate.primaryEmail || undefined,
          type: "Talent",
          createdAt: candidate.createdAt,
        });
        processed.add(candidate.id);
      }
    }

    if (duplicates.length > 1) {
      const key = duplicates.map((d) => d.id).sort().join("|");
      groups.set(key, duplicates);
    }
  }

  return Array.from(groups.values()).map((candidates) => {
    const confidence =
      candidates.length >= 3 ? "HIGH" : candidates.length === 2 ? "MEDIUM" : "LOW";
    return {
      candidates,
      confidence,
      reason: `${candidates.length} potential duplicate talents detected`,
      matchingFields: Array.from(new Set(["name"])),
    };
  });
}

/**
 * Detect duplicate brands
 * Rules:
 * - HIGH: Same normalized name
 * - MEDIUM: Similar names after stripping common suffixes (Ltd, Inc, LLC, etc)
 */
export async function detectBrandDuplicates(): Promise<DuplicateGroup[]> {
  const brands = await prisma.brand.findMany({
    select: {
      id: true,
      name: true,
      createdAt: true,
    },
  });

  const groups: Map<string, DuplicateCandidate[]> = new Map();
  const processed = new Set<string>();

  const suffixes = [
    "ltd",
    "limited",
    "inc",
    "incorporated",
    "llc",
    "co",
    "company",
    "&co",
    "gmbh",
    "sa",
    "ag",
    "plc",
  ];

  function normalizeBrandName(name: string): string {
    let normalized = normalizeString(name);
    // Remove common suffixes
    for (const suffix of suffixes) {
      const regex = new RegExp(`\\b${suffix}\\b`, "g");
      normalized = normalized.replace(regex, "");
    }
    return normalized.replace(/\s+/g, " ").trim();
  }

  for (let i = 0; i < brands.length; i++) {
    if (processed.has(brands[i].id)) continue;

    const current = brands[i];
    const currentNormalized = normalizeBrandName(current.name);
    const duplicates: DuplicateCandidate[] = [
      {
        id: current.id,
        name: current.name,
        type: "Brand",
        createdAt: current.createdAt,
      },
    ];

    processed.add(current.id);

    for (let j = i + 1; j < brands.length; j++) {
      if (processed.has(brands[j].id)) continue;

      const candidate = brands[j];
      const candidateNormalized = normalizeBrandName(candidate.name);

      let isMatch = false;

      // Rule 1: Exact name match (with suffix normalization)
      if (currentNormalized === candidateNormalized) {
        isMatch = true;
      }

      // Rule 2: Fuzzy match >85%
      const similarity = stringSimilarity(current.name, candidate.name);
      if (similarity > 0.85) {
        isMatch = true;
      }

      if (isMatch) {
        duplicates.push({
          id: candidate.id,
          name: candidate.name,
          type: "Brand",
          createdAt: candidate.createdAt,
        });
        processed.add(candidate.id);
      }
    }

    if (duplicates.length > 1) {
      const key = duplicates.map((d) => d.id).sort().join("|");
      groups.set(key, duplicates);
    }
  }

  return Array.from(groups.values()).map((candidates) => ({
    candidates,
    confidence: candidates.length > 1 ? "HIGH" : "MEDIUM",
    reason: `${candidates.length} potential duplicate brands detected`,
    matchingFields: ["name"],
  }));
}

/**
 * Detect duplicate deals
 * Rules:
 * - HIGH: Same brand + talent + overlapping dates
 * - MEDIUM: Same brand + talent (different dates)
 * - MEDIUM: Similar campaign names + same brand
 * - LOW: Similar values (within 5%) + same brand
 */
export async function detectDealDuplicates(): Promise<DuplicateGroup[]> {
  const deals = await prisma.deal.findMany({
    select: {
      id: true,
      brandName: true,
      brandId: true,
      talentId: true,
      campaignName: true,
      value: true,
      startDate: true,
      endDate: true,
      stage: true,
      createdAt: true,
    },
  });

  const groups: Map<string, DuplicateCandidate[]> = new Map();
  const processed = new Set<string>();

  for (let i = 0; i < deals.length; i++) {
    if (processed.has(deals[i].id)) continue;

    const current = deals[i];
    const duplicates: DuplicateCandidate[] = [
      {
        id: current.id,
        name: current.campaignName || current.brandName,
        type: "Deal",
        createdAt: current.createdAt,
      },
    ];

    processed.add(current.id);

    for (let j = i + 1; j < deals.length; j++) {
      if (processed.has(deals[j].id)) continue;

      const candidate = deals[j];
      let isMatch = false;

      // Rule 1: Same brand + talent
      if (current.brandId === candidate.brandId && current.talentId === candidate.talentId) {
        // Check for overlapping dates
        if (
          current.startDate &&
          candidate.startDate &&
          current.endDate &&
          candidate.endDate
        ) {
          const overlap =
            current.startDate <= candidate.endDate && current.endDate >= candidate.startDate;
          if (overlap) {
            isMatch = true; // HIGH confidence
          }
        } else {
          // No dates or partial info - MEDIUM confidence
          isMatch = true;
        }
      }

      // Rule 2: Same brand + similar campaign names
      if (
        current.brandId === candidate.brandId &&
        current.campaignName &&
        candidate.campaignName
      ) {
        const similarity = stringSimilarity(current.campaignName, candidate.campaignName);
        if (similarity > 0.8) {
          isMatch = true;
        }
      }

      // Rule 3: Same brand + similar value (within 5%)
      if (current.brandId === candidate.brandId && current.value && candidate.value) {
        const diff = Math.abs(current.value - candidate.value);
        const percentDiff = (diff / Math.max(current.value, candidate.value)) * 100;
        if (percentDiff < 5 && percentDiff > 0) {
          isMatch = true;
        }
      }

      if (isMatch) {
        duplicates.push({
          id: candidate.id,
          name: candidate.campaignName || candidate.brandName,
          type: "Deal",
          createdAt: candidate.createdAt,
        });
        processed.add(candidate.id);
      }
    }

    if (duplicates.length > 1) {
      const key = duplicates.map((d) => d.id).sort().join("|");
      groups.set(key, duplicates);
    }
  }

  return Array.from(groups.values()).map((candidates) => ({
    candidates,
    confidence:
      candidates.length >= 3 ? "HIGH" : candidates.length === 2 ? "MEDIUM" : "LOW",
    reason: `${candidates.length} potential duplicate deals detected`,
    matchingFields: ["brand", "talent"],
  }));
}

/**
 * Get all duplicates for a specific entity type
 */
export async function getAllDuplicates(
  entityType: "talent" | "brands" | "deals"
): Promise<DuplicateGroup[]> {
  switch (entityType) {
    case "talent":
      return detectTalentDuplicates();
    case "brands":
      return detectBrandDuplicates();
    case "deals":
      return detectDealDuplicates();
    default:
      return [];
  }
}
