// services/audienceOverlapService.ts

/**
 * Computes the overlap between two audience distributions.
 * Each audience should be an object where the keys are categories
 * (e.g. "UK", "Female", "18-24") and the values are percentages (0–100).
 *
 * Example:
 *  { UK: 60, US: 20, Female: 80 }
 *  { UK: 40, US: 30, Female: 75 }
 */

export interface AudienceMap {
  [key: string]: number;
}

export interface AudienceOverlapResult {
  score: number;            // 0–100 overlap score
  sharedKeys: string[];     // categories both audiences share
  details: {
    [key: string]: {
      a: number;
      b: number;
      diff: number;
    };
  };
}

export function computeOverlap(
  audienceA: AudienceMap = {},
  audienceB: AudienceMap = {}
): AudienceOverlapResult {
  try {
    const shared = Object.keys(audienceA).filter((k) => k in audienceB);

    if (shared.length === 0) {
      return {
        score: 0,
        sharedKeys: [],
        details: {}
      };
    }

    let totalDiff = 0;
    const details: AudienceOverlapResult["details"] = {};

    for (const key of shared) {
      const a = audienceA[key] || 0;
      const b = audienceB[key] || 0;
      const diff = Math.abs(a - b);

      totalDiff += diff;

      details[key] = { a, b, diff };
    }

    // Convert difference into similarity score
    const avgDiff = totalDiff / shared.length;
    const score = Math.max(0, 100 - avgDiff); // 0–100 scale

    return {
      score,
      sharedKeys: shared,
      details
    };
  } catch (err) {
    // Fail-safe: never allow suitability to crash the app
    return {
      score: 0,
      sharedKeys: [],
      details: {}
    };
  }
}

export default computeOverlap;
