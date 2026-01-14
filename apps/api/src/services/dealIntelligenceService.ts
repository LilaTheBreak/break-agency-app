import prisma from '../lib/prisma.js';
import { aiClient } from './ai/aiClient.js';
import { logError } from '../lib/logger.js';

interface DealIntelligenceResult {
  suggestedValueRange: {
    min: number;
    ideal: number;
    max: number;
  };
  confidenceScore: number; // 0-100
  explanation: string;
  reasoning: {
    historicalBenchmark?: string;
    brandCategoryBenchmark?: string;
    talentPerformance?: string;
    riskFactors?: string[];
  };
}

/**
 * Collect historical deal values for the talent
 */
async function getHistoricalDealValues(talentId: string) {
  const historicalDeals = await prisma.deal.findMany({
    where: {
      talentId,
      stage: { in: ["PAYMENT_RECEIVED", "COMPLETED"] },
      value: { not: null }
    },
    select: {
      value: true,
      currency: true,
      brandId: true,
      closedAt: true
    },
    orderBy: { closedAt: "desc" },
    take: 20 // Last 20 closed deals
  });

  return historicalDeals.map(d => ({
    value: d.value || 0,
    currency: d.currency || "USD",
    brandId: d.brandId,
    closedAt: d.closedAt
  }));
}

/**
 * Get brand category information
 */
async function getBrandCategoryInfo(brandId: string) {
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    select: {
      name: true,
      values: true,
      restrictedCategories: true,
      preferredCreatorTypes: true
    }
  });

  // Get other deals with this brand
  const brandDeals = await prisma.deal.findMany({
    where: {
      brandId,
      stage: { in: ["PAYMENT_RECEIVED", "COMPLETED"] },
      value: { not: null }
    },
    select: {
      value: true,
      talentId: true
    },
    take: 10
  });

  return {
    brand,
    brandDeals: brandDeals.map(d => ({ value: d.value || 0, talentId: d.talentId }))
  };
}

/**
 * Get talent performance data
 */
async function getTalentPerformanceData(talentId: string) {
  // Get social profiles for the talent
  const connections = await prisma.socialAccountConnection.findMany({
    where: {
      creatorId: talentId,
      connected: true
    },
    include: {
      SocialProfile: {
        select: {
          followerCount: true,
          engagementRate: true,
          postCount: true,
          platform: true
        }
      }
    }
  });

  const profiles = connections
    .map(c => c.SocialProfile)
    .filter(p => p !== null);

  // Calculate aggregate metrics
  const totalFollowers = profiles.reduce((sum, p) => sum + (p?.followerCount || 0), 0);
  const avgEngagementRate = profiles.length > 0
    ? profiles.reduce((sum, p) => sum + (p?.engagementRate || 0), 0) / profiles.length
    : 0;
  const totalPosts = profiles.reduce((sum, p) => sum + (p?.postCount || 0), 0);

  return {
    totalFollowers,
    avgEngagementRate,
    totalPosts,
    platformCount: profiles.length
  };
}

/**
 * Generate deal intelligence using AI
 */
export async function generateDealIntelligence(dealId: string): Promise<DealIntelligenceResult> {
  try {
    // Load deal with relations
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        Brand: {
          select: {
            id: true,
            name: true,
            values: true,
            restrictedCategories: true,
            preferredCreatorTypes: true
          }
        },
        Talent: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!deal) {
      throw new Error("Deal not found");
    }

    // Collect data inputs
    const historicalDeals = await getHistoricalDealValues(deal.talentId);
    const brandInfo = await getBrandCategoryInfo(deal.brandId);
    const talentPerformance = await getTalentPerformanceData(deal.talentId);

    // Calculate benchmarks
    const avgHistoricalValue = historicalDeals.length > 0
      ? historicalDeals.reduce((sum, d) => sum + d.value, 0) / historicalDeals.length
      : 0;
    const maxHistoricalValue = historicalDeals.length > 0
      ? Math.max(...historicalDeals.map(d => d.value))
      : 0;
    const minHistoricalValue = historicalDeals.length > 0
      ? Math.min(...historicalDeals.map(d => d.value))
      : 0;

    const avgBrandDealValue = brandInfo.brandDeals.length > 0
      ? brandInfo.brandDeals.reduce((sum, d) => sum + d.value, 0) / brandInfo.brandDeals.length
      : 0;

    // Build AI prompt
    const prompt = `You are an expert talent agent AI assistant analyzing a deal negotiation opportunity.

**Current Deal:**
- Deal ID: ${deal.id}
- Brand: ${deal.Brand?.name || "Unknown"}
- Current Value: ${deal.value || "Not set"}
- Stage: ${deal.stage}
- Currency: ${deal.currency || "USD"}

**Historical Deal Data (Talent's Past Deals):**
${historicalDeals.length > 0
  ? `- Average deal value: ${avgHistoricalValue.toLocaleString()} ${deal.currency}
- Range: ${minHistoricalValue.toLocaleString()} - ${maxHistoricalValue.toLocaleString()} ${deal.currency}
- Total closed deals: ${historicalDeals.length}
- Recent deals: ${JSON.stringify(historicalDeals.slice(0, 5).map(d => ({ value: d.value, date: d.closedAt })), null, 2)}`
  : "- No historical deals found for this talent"}

**Brand Category Benchmarks:**
${brandInfo.brandDeals.length > 0
  ? `- Average deal value with this brand: ${avgBrandDealValue.toLocaleString()} ${deal.currency}
- Total deals with brand: ${brandInfo.brandDeals.length}
- Brand values: ${brandInfo.brand?.values?.join(", ") || "Not specified"}`
  : "- No previous deals with this brand"}

**Talent Performance Metrics:**
- Total followers: ${talentPerformance.totalFollowers.toLocaleString()}
- Average engagement rate: ${talentPerformance.avgEngagementRate.toFixed(2)}%
- Total posts: ${talentPerformance.totalPosts}
- Connected platforms: ${talentPerformance.platformCount}

**Instructions:**
Analyze this deal opportunity and provide negotiation intelligence. Consider:
1. Historical deal values for this talent
2. Brand category benchmarks and typical spending
3. Talent's current performance metrics (followers, engagement)
4. Market conditions and industry standards

**Output JSON Schema:**
{
  "suggestedValueRange": {
    "min": number (minimum recommended value),
    "ideal": number (ideal target value),
    "max": number (maximum recommended value)
  },
  "confidenceScore": number (0-100, where 100 = very confident),
  "explanation": "string (2-3 sentence explanation of the recommendation)",
  "reasoning": {
    "historicalBenchmark": "string (how historical deals inform this)",
    "brandCategoryBenchmark": "string (how brand category informs this)",
    "talentPerformance": "string (how talent metrics inform this)",
    "riskFactors": ["string"] (any risk factors to consider)
  }
}

Return ONLY valid JSON, no markdown or code blocks.`;

    // Call AI
    let aiResponse: any;
    
    if (aiClient) {
      try {
        const jsonResult = await aiClient.json(prompt);
        aiResponse = jsonResult;
      } catch (error) {
        logError("OpenAI API call failed, using fallback", error);
        aiResponse = null;
      }
    } else {
      aiResponse = null;
    }
    
    // Fallback if AI unavailable
    if (!aiResponse) {
      aiResponse = {
        suggestedValueRange: {
          min: avgHistoricalValue * 0.8,
          ideal: avgHistoricalValue * 1.2,
          max: avgHistoricalValue * 1.5
        },
        confidenceScore: historicalDeals.length > 0 ? 60 : 30,
        explanation: historicalDeals.length > 0
          ? `Based on ${historicalDeals.length} historical deals averaging ${avgHistoricalValue.toLocaleString()} ${deal.currency}, we recommend a value range of ${(avgHistoricalValue * 0.8).toLocaleString()} - ${(avgHistoricalValue * 1.5).toLocaleString()} ${deal.currency}.`
          : "Limited data available. Recommendation based on industry standards.",
        reasoning: {
          historicalBenchmark: historicalDeals.length > 0
            ? `Based on ${historicalDeals.length} previous deals averaging ${avgHistoricalValue.toLocaleString()} ${deal.currency}`
            : "No historical data available",
          brandCategoryBenchmark: brandInfo.brandDeals.length > 0
            ? `Brand typically spends ${avgBrandDealValue.toLocaleString()} ${deal.currency} per deal`
            : "No brand-specific data available",
          talentPerformance: `Talent has ${talentPerformance.totalFollowers.toLocaleString()} followers with ${talentPerformance.avgEngagementRate.toFixed(2)}% engagement`,
          riskFactors: []
        }
      };
    }

    // Validate and structure response
    const result: DealIntelligenceResult = {
      suggestedValueRange: {
        min: typeof aiResponse.suggestedValueRange?.min === "number" ? aiResponse.suggestedValueRange.min : avgHistoricalValue * 0.8,
        ideal: typeof aiResponse.suggestedValueRange?.ideal === "number" ? aiResponse.suggestedValueRange.ideal : avgHistoricalValue * 1.2,
        max: typeof aiResponse.suggestedValueRange?.max === "number" ? aiResponse.suggestedValueRange.max : avgHistoricalValue * 1.5
      },
      confidenceScore: typeof aiResponse.confidenceScore === "number"
        ? Math.max(0, Math.min(100, aiResponse.confidenceScore))
        : historicalDeals.length > 0 ? 70 : 40,
      explanation: aiResponse.explanation || "Based on available data, here are the recommended negotiation parameters.",
      reasoning: {
        historicalBenchmark: aiResponse.reasoning?.historicalBenchmark || (historicalDeals.length > 0 ? `Based on ${historicalDeals.length} previous deals averaging ${avgHistoricalValue.toLocaleString()} ${deal.currency}` : "No historical data available"),
        brandCategoryBenchmark: aiResponse.reasoning?.brandCategoryBenchmark || (brandInfo.brandDeals.length > 0 ? `Brand typically spends ${avgBrandDealValue.toLocaleString()} ${deal.currency} per deal` : "No brand-specific data available"),
        talentPerformance: aiResponse.reasoning?.talentPerformance || `Talent has ${talentPerformance.totalFollowers.toLocaleString()} followers with ${talentPerformance.avgEngagementRate.toFixed(2)}% engagement`,
        riskFactors: Array.isArray(aiResponse.reasoning?.riskFactors) ? aiResponse.reasoning.riskFactors : []
      }
    };

    return result;
  } catch (error) {
    logError("Failed to generate deal intelligence", error, { dealId });
    throw error;
  }
}

/**
 * Save intelligence to database
 */
export async function saveDealIntelligence(dealId: string, intelligence: DealIntelligenceResult) {
  const saved = await prisma.dealIntelligence.upsert({
    where: { dealId },
    create: {
      id: `intel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dealId,
      summary: intelligence.explanation,
      riskFlags: intelligence.reasoning.riskFactors || [],
      performanceNotes: [],
      insights: intelligence as any
    },
    update: {
      summary: intelligence.explanation,
      riskFlags: intelligence.reasoning.riskFactors || [],
      insights: intelligence as any,
      updatedAt: new Date()
    }
  });

  return saved;
}

