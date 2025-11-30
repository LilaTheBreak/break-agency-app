export const FALLBACK_CAMPAIGN_CONFIG = [
  {
    id: "residency",
    title: "Creator Residency NYC",
    stage: "ACTIVE",
    creatorTeams: [{ name: "Premium pod", members: ["exclusive@talent.com", "ugc@creator.com"] }],
    brandSummaries: [
      {
        id: "luxury@brand.com",
        name: "Luxury Hospitality",
        reach: 210000,
        revenue: 42000,
        pacing: 0.65,
        matches: [{ name: "Exclusive Creator" }, { name: "UGC Creator" }],
        opportunities: ["VIP dinner series", "Travel day experience"]
      },
      {
        id: "experiential@brand.com",
        name: "Experiential Collective",
        reach: 98000,
        revenue: 18000,
        pacing: 0.45,
        matches: [{ name: "Break Talent" }],
        opportunities: ["Retail pop-up hosts"]
      }
    ],
    metadata: { notes: "Waiting on final assets from creative lead." }
  },
  {
    id: "q3launch",
    title: "Q3 AI finance launch",
    stage: "PLANNING",
    creatorTeams: [{ name: "Product pod", members: ["talent@thebreakco.com"] }],
    brandSummaries: [
      {
        id: "fintech@brand.com",
        name: "Fintech Labs",
        reach: 150000,
        revenue: 32000,
        pacing: 0.3,
        matches: [{ name: "Break Talent" }],
        opportunities: ["Webinar series", "Paid media whitelisting"]
      }
    ],
    metadata: { notes: "Paid media reserved; confirm influencer whitelisting." }
  }
];

export const FALLBACK_CAMPAIGNS = FALLBACK_CAMPAIGN_CONFIG.map((campaign) => ({
  ...campaign,
  aggregated: buildAggregates(campaign.brandSummaries)
}));

export function buildAggregates(brands = []) {
  const totalReach = brands.reduce((sum, brand) => sum + (brand.reach || 0), 0);
  const revenuePerBrand = brands.reduce((acc, brand) => {
    acc[brand.name] = brand.revenue || 0;
    return acc;
  }, {});
  const pacingPerBrand = brands.reduce((acc, brand) => {
    acc[brand.name] = brand.pacing || 0;
    return acc;
  }, {});
  return { totalReach, revenuePerBrand, pacingPerBrand };
}
