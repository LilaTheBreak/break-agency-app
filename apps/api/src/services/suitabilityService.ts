type TalentProfile = {
  categories: string[];
  audienceInterests: string[];
  avgEngagementRate: number;
  platforms: string[];
  brandSafetyFlags: string[];
};

type BrandBrief = {
  industry: string;
  targetInterests: string[];
  goals: string[];
  requiredPlatforms: string[];
  excludedCategories: string[];
};

export function calculateSuitabilityScore(talent: TalentProfile, brief: BrandBrief) {
  const warnings: string[] = [];
  let score = 0;

  const sharedCategories = (talent.categories || []).filter((c) => (brief.targetInterests || []).includes(c.toLowerCase()));
  score += sharedCategories.length * 10;

  const matchingPlatforms = (talent.platforms || []).filter((p) => (brief.requiredPlatforms || []).includes(p.toLowerCase()));
  score += matchingPlatforms.length * 15;

  if (talent.avgEngagementRate > 4) score += 15;
  else if (talent.avgEngagementRate > 2) score += 10;
  else score += 5;

  const conflicts = (talent.categories || []).filter((c) => (brief.excludedCategories || []).includes(c.toLowerCase()));
  if (conflicts.length) {
    warnings.push(`Talent category conflicts with exclusions: ${conflicts.join(", ")}`);
    score -= 20;
  }

  if ((talent.brandSafetyFlags || []).length) {
    warnings.push("Talent has brand-safety risk markers.");
    score -= 15;
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    sharedCategories,
    matchingPlatforms,
    warnings
  };
}
