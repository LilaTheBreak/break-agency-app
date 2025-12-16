// services/categoryComplianceService.ts

/**
 * Evaluates whether a talent's categories comply with a brand's category.
 * Returns a standardized result so suitabilityService can consume it.
 *
 * Compliance levels:
 *  - "safe"        → No conflict, good match
 *  - "caution"     → Slight mismatch or unclear alignment
 *  - "conflict"    → Direct category conflict (e.g., alcohol vs under-18 audience)
 */

export interface ComplianceResult {
  level: "safe" | "caution" | "conflict";
  reasons: string[];
}

// Hard-coded conflict rules (expand later)
const CONFLICT_MAP: Record<string, string[]> = {
  alcohol: ["under18", "kids", "family"],
  gambling: ["under18", "kids", "family"],
  finance: ["crypto-scam", "adult"],
  health: ["adult", "explicit"],
  beauty: ["medical"],
};

export function checkCompliance(
  brandCategory: string = "",
  talentCategories: string[] = []
): ComplianceResult {
  try {
    const normalizedBrand = brandCategory.toLowerCase().trim();
    const normalizedTalent = talentCategories.map((c) =>
      c.toLowerCase().trim()
    );

    // No brand category? Cannot assess → caution
    if (!normalizedBrand) {
      return {
        level: "caution",
        reasons: ["No brand category provided for compliance evaluation."],
      };
    }

    // Talent has no categories? Neutral but safe
    if (normalizedTalent.length === 0) {
      return {
        level: "caution",
        reasons: [
          "Talent categories missing; unable to determine precise alignment.",
        ],
      };
    }

    const conflictingWithBrand = CONFLICT_MAP[normalizedBrand] || [];

    // Find intersections
    const conflicts = normalizedTalent.filter((c) =>
      conflictingWithBrand.includes(c)
    );

    if (conflicts.length > 0) {
      return {
        level: "conflict",
        reasons: [
          `Talent category conflicts with brand category "${brandCategory}".`,
          `Conflicting categories: ${conflicts.join(", ")}`,
        ],
      };
    }

    // If categories are unrelated but not conflicting → caution
    const overlaps = normalizedTalent.includes(normalizedBrand);

    if (!overlaps) {
      return {
        level: "caution",
        reasons: [
          "No direct category match; alignment uncertain but no conflict detected.",
        ],
      };
    }

    return {
      level: "safe",
      reasons: ["Brand and talent categories align well."],
    };
  } catch (err) {
    // Fail-safe: never break suitability scoring
    return {
      level: "caution",
      reasons: ["Compliance check failed; using safe fallback."],
    };
  }
}

export default checkCompliance;
