// services/bundleGeneratorService.ts
import prisma from "../lib/prisma.js";

export interface BundleResult {
  dealId?: string;
  creativeConcepts: string[];
  deliverables: { type: string; description: string }[];
  schedule: { date: string; item: string }[];
  talkingPoints: string[];
  predictedPerformance: {
    estimatedReach: number;
    estimatedEngagementRate: number;
  };
}

/**
 * Generates a content + posting bundle for a given deal.
 * Safe fallback logic ensures this never crashes.
 */
export async function generateBundleForDeal(dealId: string): Promise<BundleResult> {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { talent: true }
    });

    if (!deal) {
      return fallbackBundle("unknown-deal");
    }

    const category = deal.category || "brand";
    const talentName = deal.talent?.name || "the creator";

    // --- 1. Creative concepts ---
    const creativeConcepts = [
      `A day-in-the-life featuring ${deal.brand} integrated naturally.`,
      `A storytelling video explaining why ${talentName} loves ${deal.brand}.`,
      `A trend-driven Reel/TikTok demonstrating a key product benefit.`,
      `A polished photo carousel highlighting premium features of the ${category} product.`
    ];

    // --- 2. Deliverables ---
    const deliverables = [
      { type: "Instagram Reel", description: "Primary hero content piece" },
      { type: "Story Set x3", description: "Swipe-up/CTA to drive traffic" },
      { type: "Photo Carousel", description: "Lifestyle imagery showcasing the product" }
    ];

    // --- 3. Posting schedule ---
    const schedule = [];

    const start = new Date(deal.startDate || Date.now());
    for (let i = 0; i < deliverables.length; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i * 3);
      schedule.push({
        date: date.toISOString().split("T")[0],
        item: deliverables[i].type
      });
    }

    // --- 4. Talking points ---
    const talkingPoints = [
      `Why ${talentName} genuinely uses ${deal.brand}.`,
      `Highlight a favourite feature of the product.`,
      `Emphasise authenticity and personal experience.`,
      `Add a CTA encouraging followers to try or learn more.`
    ];

    // --- 5. Predicted performance ---
    const predictedPerformance = {
      estimatedReach: Math.floor(Math.random() * 90000 + 30000), // mock but realistic
      estimatedEngagementRate: Number((Math.random() * 3 + 2).toFixed(2)) // 2%–5%
    };

    return {
      dealId,
      creativeConcepts,
      deliverables,
      schedule,
      talkingPoints,
      predictedPerformance
    };

  } catch (err) {
    console.error("Bundle generation failed:", err);
    return fallbackBundle(dealId);
  }
}

/** Generates a safe fallback bundle */
function fallbackBundle(dealId?: string): BundleResult {
  return {
    dealId,
    creativeConcepts: ["Unable to load creative concepts at this time."],
    deliverables: [{ type: "Post TBD", description: "Details unavailable" }],
    schedule: [],
    talkingPoints: ["Brand messaging unavailable."],
    predictedPerformance: {
      estimatedReach: 0,
      estimatedEngagementRate: 0
    }
  };
}

export default generateBundleForDeal;
