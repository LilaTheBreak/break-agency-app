import OpenAI from "openai";
import prisma from "../../lib/prisma.js";
import { sendSlackAlert } from "../../integrations/slack/slackClient.js";
import { safeEnv } from "../../utils/safeEnv.js";

const OPENAI_API_KEY = safeEnv("OPENAI_API_KEY", "");
const OPENAI_MODEL = safeEnv("OPENAI_MODEL", "gpt-4o-mini");
const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

interface TalentSocialData {
  platforms: string[];
  followers: { [key: string]: number };
  content_categories: string[];
  tone: string;
  engagement_indicators: string[];
  recent_themes: string[];
}

interface BrandIntelligence {
  verticals: string[];
  creator_campaigns_active: boolean;
  alignment_signals: string[];
}

interface AISuggestion {
  brandName: string;
  vertical: string;
  rationale: string;
  suggestedCollabType: string;
  confidenceScore: "low" | "medium" | "high";
  detectedSignals: string[];
}

/**
 * Extract talent social data from linked profiles
 */
async function extractTalentSocialData(talentId: string): Promise<TalentSocialData | null> {
  try {
    const talent = await prisma.talent.findUnique({
      where: { id: talentId },
      include: {
        SocialAccountConnection: {
          include: {
            SocialProfile: {
              select: {
                followerCount: true,
                engagementRate: true,
              },
            },
          },
        },
      },
    });

    if (!talent || !talent.SocialAccountConnection?.length) {
      return null;
    }

    const platforms = talent.SocialAccountConnection.map((conn) => conn.platform);
    const followers: { [key: string]: number } = {};
    let allCategories = new Set<string>();
    let allThemes = new Set<string>();
    let tones = new Set<string>();

    talent.SocialAccountConnection.forEach((conn) => {
      if (conn.SocialProfile) {
        followers[conn.platform] = conn.SocialProfile.followerCount || 0;
      }
    });

    // Get recent content themes from social intelligence notes
    const themes = extractThemesFromNotes(talent.socialIntelligenceNotes || "");
    themes.forEach((t) => allThemes.add(t));

    return {
      platforms,
      followers,
      content_categories: Array.from(allCategories),
      tone: Array.from(tones).join(", ") || "general",
      engagement_indicators: extractEngagementSignals(talent),
      recent_themes: Array.from(allThemes),
    };
  } catch (error) {
    console.error("[AI OPPORTUNITY SUGGESTION] Error extracting talent social data:", error);
    return null;
  }
}

/**
 * Extract engagement signals from talent data
 */
function extractEngagementSignals(talent: any): string[] {
  const signals: string[] = [];

  // Check for high follower counts
  if (talent.SocialAccountConnection) {
    talent.SocialAccountConnection.forEach((conn: any) => {
      if (conn.SocialProfile?.followerCount) {
        if (conn.SocialProfile.followerCount > 1000000) {
          signals.push(`${conn.platform} - 1M+ followers (macro tier)`);
        } else if (conn.SocialProfile.followerCount > 100000) {
          signals.push(`${conn.platform} - 100K+ followers (mid-tier)`);
        } else if (conn.SocialProfile.followerCount > 10000) {
          signals.push(`${conn.platform} - 10K+ followers (micro-tier)`);
        }
      }

      if (conn.SocialProfile?.engagementRate && conn.SocialProfile.engagementRate > 5) {
        signals.push(`${conn.platform} - High engagement (${conn.SocialProfile.engagementRate.toFixed(1)}%)`);
      }
    });
  }

  return signals;
}

/**
 * Extract content themes from social intelligence notes
 */
function extractThemesFromNotes(notes: string): string[] {
  if (!notes) return [];

  // Simple theme extraction from keywords
  const themeKeywords = [
    "fashion",
    "beauty",
    "fitness",
    "wellness",
    "lifestyle",
    "finance",
    "tech",
    "food",
    "travel",
    "parenting",
    "education",
    "sports",
    "entertainment",
  ];

  const foundThemes = themeKeywords.filter((theme) => notes.toLowerCase().includes(theme));
  return foundThemes;
}

/**
 * Get brand intelligence from internal records
 */
async function getBrandIntelligence(): Promise<BrandIntelligence[]> {
  try {
    const brands = await prisma.brand.findMany({
      take: 50, // Limit to top 50 brands
      where: {
        // Only get brands with known verticals
        industry: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        industry: true,
        values: true,
      },
    });

    return brands.map((brand) => ({
      verticals: brand.industry ? [brand.industry] : [],
      creator_campaigns_active: Math.random() > 0.5, // Placeholder - would fetch from CrmCampaign in production
      alignment_signals: brand.values || [],
    }));
  } catch (error) {
    console.error("[AI OPPORTUNITY SUGGESTION] Error getting brand intelligence:", error);
    return [];
  }
}

/**
 * Generate opportunity suggestions using AI
 */
async function generateSuggestionsWithAI(
  talentName: string,
  talentId: string,
  socialData: TalentSocialData,
  brandIntel: BrandIntelligence[]
): Promise<AISuggestion[]> {
  if (!client) {
    console.warn("[AI OPPORTUNITY SUGGESTION] OpenAI client not initialized, returning empty suggestions");
    return [];
  }

  const systemPrompt = `You are an expert talent manager and brand strategist. Your task is to suggest potential brand collaboration opportunities for a creator based on their social profile data and market intelligence.

IMPORTANT CONSTRAINTS:
- Only suggest brands that genuinely align with the creator's content, audience, and tone
- Every suggestion must have a clear, data-driven rationale (1-2 sentences max)
- Confidence scores must be based on evidence: "high" = strong match, "medium" = reasonable fit, "low" = exploratory opportunity
- Suggested collaboration types: paid_post, ambassador, event, product_launch, long_term_partnership
- Do NOT suggest brands without clear reasoning
- Output ONLY valid JSON matching the schema below

JSON OUTPUT SCHEMA:
{
  "suggestions": [
    {
      "brandName": "string",
      "vertical": "string (industry/category)",
      "rationale": "string (1-2 sentence explanation)",
      "suggestedCollabType": "string (paid_post|ambassador|event|product_launch|long_term_partnership)",
      "confidenceScore": "string (low|medium|high)",
      "detectedSignals": ["string array of signals that led to this suggestion"]
    }
  ]
}`;

  const userPrompt = `
CREATOR PROFILE:
Name: ${talentName}
Platforms: ${socialData.platforms.join(", ")}
Followers: ${JSON.stringify(socialData.followers)}
Content Categories: ${socialData.content_categories.join(", ")}
Tone/Brand Alignment: ${socialData.tone}
Recent Themes: ${socialData.recent_themes.join(", ")}
Engagement Signals: ${socialData.engagement_indicators.join(", ")}

BRAND INTELLIGENCE (Sample Active Brands):
${brandIntel
  .slice(0, 20)
  .map(
    (bi, idx) =>
      `${idx + 1}. Vertical: ${bi.verticals.join(", ")}, Creator Campaigns: ${bi.creator_campaigns_active}, Values: ${bi.alignment_signals.join(", ")}`
  )
  .join("\n")}

TASK:
Generate 5-8 highly-tailored brand collaboration opportunities. Each suggestion should:
1. Align with creator's content categories and tone
2. Match the creator's follower tier and engagement level
3. Include specific collaboration types based on creator profile
4. Have clear, evidence-based rationale
5. Include 2-3 detected signals per suggestion

Return ONLY valid JSON in the exact schema specified above. No markdown, no explanations.`;

  try {
    const completion = await client.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0].message.content || "{}";
    
    try {
      const parsed = JSON.parse(responseText);
      
      // Validate response structure
      if (!Array.isArray(parsed.suggestions)) {
        console.error("[AI OPPORTUNITY SUGGESTION] Invalid response structure:", parsed);
        return [];
      }

      // Validate each suggestion has required fields
      return parsed.suggestions.filter(
        (s: any) =>
          s.brandName &&
          s.vertical &&
          s.rationale &&
          s.suggestedCollabType &&
          s.confidenceScore &&
          Array.isArray(s.detectedSignals)
      );
    } catch (parseError) {
      console.error("[AI OPPORTUNITY SUGGESTION] JSON parse error:", parseError, "Response:", responseText);
      return [];
    }
  } catch (error) {
    console.error("[AI OPPORTUNITY SUGGESTION] OpenAI API error:", error);
    // Slack alert optional - skip if not available
    try {
      await sendSlackAlert(`AI Opportunity Suggestion Error for talent ${talentId}: ${error instanceof Error ? error.message : String(error)}`);
    } catch {} // Silently fail Slack alert
    return [];
  }
}

/**
 * Main function: Generate AI suggestions for a talent
 * Only works for EXCLUSIVE talent
 */
export async function generateOpportunitySuggestions(talentId: string) {
  try {
    // 1. Verify talent exists and is EXCLUSIVE
    const talent = await prisma.talent.findUnique({
      where: { id: talentId },
      select: {
        id: true,
        name: true,
        representationType: true,
        SocialAccountConnection: {
          select: { id: true },
        },
      },
    });

    if (!talent) {
      throw new Error(`Talent not found: ${talentId}`);
    }

    if (talent.representationType !== "EXCLUSIVE") {
      throw new Error(`Feature only available for EXCLUSIVE talent. Talent is: ${talent.representationType}`);
    }

    if (!talent.SocialAccountConnection.length) {
      return {
        success: true,
        suggestions: [],
        message: "No social profiles connected. Connect social profiles to receive AI suggestions.",
      };
    }

    // 2. Extract talent social data
    const socialData = await extractTalentSocialData(talentId);
    if (!socialData) {
      return {
        success: true,
        suggestions: [],
        message: "Insufficient social profile data to generate suggestions.",
      };
    }

    // 3. Get brand intelligence
    const brandIntel = await getBrandIntelligence();

    // 4. Generate suggestions with AI
    const suggestions = await generateSuggestionsWithAI(talent.name, talentId, socialData, brandIntel);

    // 5. Store suggestions in database
    const storedSuggestions: any[] = [];
    for (const suggestion of suggestions) {
      try {
        const stored = await (prisma as any).aiSuggestedOpportunity.upsert({
          where: {
            talentId_brandName: {
              talentId,
              brandName: suggestion.brandName,
            },
          },
          update: {
            vertical: suggestion.vertical,
            rationale: suggestion.rationale,
            detectedSignals: suggestion.detectedSignals,
            suggestedCollabType: suggestion.suggestedCollabType,
            confidenceScore: suggestion.confidenceScore,
            status: "suggested",
          },
          create: {
            talentId,
            brandName: suggestion.brandName,
            vertical: suggestion.vertical,
            rationale: suggestion.rationale,
            detectedSignals: suggestion.detectedSignals,
            suggestedCollabType: suggestion.suggestedCollabType,
            confidenceScore: suggestion.confidenceScore,
            status: "suggested",
          },
        });
        storedSuggestions.push(stored);
      } catch (error) {
        console.error(`[AI OPPORTUNITY SUGGESTION] Error storing suggestion for ${suggestion.brandName}:`, error);
      }
    }

    return {
      success: true,
      suggestions: storedSuggestions,
      count: storedSuggestions.length,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[AI OPPORTUNITY SUGGESTION] Generation error:", errorMsg);
    return {
      success: false,
      error: errorMsg,
      suggestions: [],
    };
  }
}

/**
 * Get suggestions for a talent
 */
export async function getTalentSuggestions(talentId: string, status?: string) {
  try {
    const suggestions = await (prisma as any).aiSuggestedOpportunity.findMany({
      where: {
        talentId,
        ...(status && { status }),
        status: {
          not: "dismissed", // Don't show dismissed unless specifically requested
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      suggestions,
      count: suggestions.length,
    };
  } catch (error) {
    console.error("[AI OPPORTUNITY SUGGESTION] Fetch error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      suggestions: [],
    };
  }
}

/**
 * Update suggestion status (dismiss, save, or convert)
 */
export async function updateSuggestionStatus(
  suggestionId: string,
  status: "suggested" | "saved" | "dismissed" | "converted",
  metadata?: { convertedOpportunityId?: string }
) {
  try {
    const now = new Date();
    const updateData: any = { status };

    if (status === "dismissed") {
      updateData.dismissedAt = now;
    } else if (status === "converted") {
      updateData.convertedAt = now;
      if (metadata?.convertedOpportunityId) {
        updateData.convertedOpportunityId = metadata.convertedOpportunityId;
      }
    }

    updateData.lastReviewedAt = now;

    const updated = await (prisma as any).aiSuggestedOpportunity.update({
      where: { id: suggestionId },
      data: updateData,
    });

    return {
      success: true,
      suggestion: updated,
    };
  } catch (error) {
    console.error("[AI OPPORTUNITY SUGGESTION] Update error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Convert suggestion to an actual Opportunity
 * Creates a new SalesOpportunity with AI rationale preserved in notes
 */
export async function convertSuggestionToOpportunity(
  suggestionId: string,
  userId: string // Admin ID creating the opportunity
) {
  try {
    // 1. Get the suggestion
    const suggestion = await (prisma as any).aiSuggestedOpportunity.findUnique({
      where: { id: suggestionId },
      include: { Talent: true },
    });

    if (!suggestion) {
      throw new Error(`Suggestion not found: ${suggestionId}`);
    }

    // 2. Check if brand exists, create if needed
    let brand = await prisma.brand.findFirst({
      where: {
        name: {
          equals: suggestion.brandName,
          mode: "insensitive",
        },
      },
    });

    if (!brand) {
      brand = await prisma.brand.create({
        data: {
          name: suggestion.brandName,
          industry: suggestion.vertical,
        },
      });
    }

    // 3. Create Outreach record (prerequisite for SalesOpportunity)
    const outreach = await prisma.outreach.create({
      data: {
        id: `outreach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        target: suggestion.brandName,
        type: "Brand",
        stage: "not-started",
        status: "Not started",
        summary: `AI-Suggested Opportunity: ${suggestion.suggestedCollabType}`,
        linkedBrandId: brand.id,
        linkedCreatorId: suggestion.talentId,
        createdBy: userId,
        source: "AI",
        updatedAt: new Date(),
      },
    });

    // 4. Create SalesOpportunity with AI rationale in notes
    const aiNotes = `AI-SUGGESTED OPPORTUNITY
---
Brand: ${suggestion.brandName}
Vertical: ${suggestion.vertical}
Confidence: ${suggestion.confidenceScore}
Type: ${suggestion.suggestedCollabType}

Rationale:
${suggestion.rationale}

Detected Signals:
${suggestion.detectedSignals.map((s) => `• ${s}`).join("\n")}
---
`;

    const opportunity = await prisma.salesOpportunity.create({
      data: {
        id: `oppor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        outreachId: outreach.id,
        name: `${suggestion.brandName} - ${suggestion.suggestedCollabType}`,
        value: 0, // Will be filled in by admin
        notes: aiNotes,
        status: "open",
        updatedAt: new Date(),
      },
    });

    // 5. Update suggestion status to "converted"
    await updateSuggestionStatus(suggestionId, "converted", {
      convertedOpportunityId: opportunity.id,
    });

    return {
      success: true,
      opportunity,
      outreach,
      message: `Created opportunity from AI suggestion. Admin should review and set value.`,
    };
  } catch (error) {
    console.error("[AI OPPORTUNITY SUGGESTION] Conversion error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
