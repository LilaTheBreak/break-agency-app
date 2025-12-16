/**
 * Calculates multipliers for various usage rights and deal terms.
 * These are simplified examples.
 */

export function calculateUsageMultiplier(usageRights: any): number {
  if (!usageRights) return 1.0;
  // e.g., "In-perpetuity" usage might be a 2.5x multiplier
  if ((usageRights.type || '').toLowerCase().includes('perpetuity')) {
    return 2.5;
  }
  // e.g., "Paid Media" usage might be a 1.5x multiplier
  if ((usageRights.type || '').toLowerCase().includes('paid')) {
    return 1.5;
  }
  return 1.2; // Default for any specified usage
}

export function calculateExclusivityMultiplier(exclusivityTerms: any[]): number {
  if (!exclusivityTerms || exclusivityTerms.length === 0) return 1.0;
  // e.g., Add 20% for each month of exclusivity
  const months = (exclusivityTerms[0].duration || '1 month').includes('3') ? 3 : 1;
  return 1.0 + (months * 0.2);
}

export function getSeasonalMultiplier(): number {
  const month = new Date().getMonth(); // 0-11
  // Q4 (Oct, Nov, Dec) has a 25% spike
  if (month >= 9) return 1.25;
  return 1.0;
}