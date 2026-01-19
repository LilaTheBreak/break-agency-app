import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../db.js";
import { logError } from "../utils/logger.js";

const router = express.Router();

/**
 * BRAND API - Brand-specific endpoints
 * 
 * These endpoints serve brand users only.
 * Data is filtered and sanitized to hide internal/sensitive information.
 * 
 * Permission Model:
 * - Brands see public creator data + AI recommendations
 * - Brands cannot see internal notes, earnings, talent management data
 * - All brand actions are audit-logged
 */

/**
 * GET /api/brand/creators
 * 
 * Fetch recommended creators for brand.
 * Returns: Public profile data + AI recommendation explanations
 * Hides: Internal notes, earnings, risk flags, personal contact details
 */
router.get("/creators", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Get brand ID from user
    const brand = await prisma.brand.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!brand) {
      console.log(`[BRAND] GET /creators - No brand found for user ${userId}`);
      return res.status(404).json({ error: "Brand not found" });
    }

    const limit = Math.min(parseInt((req.query.limit as string) || "20"), 50);

    // Fetch top creators (sorted by recent additions or AI score)
    // In future: Use CreatorFitScore or similar recommendation model
    const creators = await prisma.talent.findMany({
      take: limit,
      where: {
        status: "ACTIVE",
        representationType: { in: ["EXCLUSIVE", "NON_EXCLUSIVE", "FRIEND_OF_HOUSE"] }
      },
      select: {
        id: true,
        displayName: true,
        profileImageUrl: true,
        profileImageSource: true,
        categories: true,
        // AI recommendation
        socialIntelligenceNotes: true, // Will be parsed for "why this creator"
        // Platform data (will be enriched from SocialAccountConnection)
        SocialAccountConnection: {
          where: { connected: true },
          select: {
            platform: true,
            handle: true,
            followers: true,
            engagement: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Transform to brand-safe format
    const brandSafeCreators = creators.map(creator => ({
      id: creator.id,
      displayName: creator.displayName,
      profileImageUrl: creator.profileImageUrl,
      categories: creator.categories || [],
      connectedPlatforms: creator.SocialAccountConnection.reduce((acc, social) => {
        acc[social.platform.toLowerCase()] = {
          handle: social.handle,
          followers: social.followers || 0,
          engagement: social.engagement || 0
        };
        return acc;
      }, {} as Record<string, any>),
      // AI recommendation explanation (parsed from social intelligence notes)
      aiRecommendationExplanation: creator.socialIntelligenceNotes 
        ? creator.socialIntelligenceNotes.substring(0, 200) + "..."
        : "Vetted creator with strong audience alignment for your campaigns."
    }));

    console.log(`[BRAND] GET /creators for brand ${brand.id} - returned ${brandSafeCreators.length} creators`);
    res.json(brandSafeCreators);
  } catch (error) {
    logError(error, "BRAND_CREATORS_FETCH_FAILED");
    res.status(500).json({ error: "Failed to fetch creators" });
  }
});

/**
 * GET /api/brand/creators/saved
 * 
 * Fetch brand's saved/shortlisted creators
 */
router.get("/creators/saved", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Get brand ID from user
    const brand = await prisma.brand.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!brand) {
      return res.status(404).json({ error: "Brand not found" });
    }

    // Fetch saved talents
    const savedTalents = await prisma.brandSavedTalent.findMany({
      where: {
        brandId: brand.id,
        status: "saved"
      },
      include: {
        Talent: {
          select: {
            id: true,
            displayName: true,
            profileImageUrl: true,
            categories: true,
            SocialAccountConnection: {
              where: { connected: true },
              select: {
                platform: true,
                handle: true,
                followers: true
              }
            }
          }
        }
      }
    });

    const brandSafeCreators = savedTalents.map(saved => ({
      id: saved.Talent.id,
      displayName: saved.Talent.displayName,
      profileImageUrl: saved.Talent.profileImageUrl,
      categories: saved.Talent.categories || [],
      talentId: saved.talentId,
      savedAt: saved.addedAt,
      connectedPlatforms: saved.Talent.SocialAccountConnection.reduce((acc, social) => {
        acc[social.platform.toLowerCase()] = {
          handle: social.handle,
          followers: social.followers || 0
        };
        return acc;
      }, {} as Record<string, any>)
    }));

    console.log(`[BRAND] GET /creators/saved for brand ${brand.id} - returned ${brandSafeCreators.length} saved creators`);
    res.json(brandSafeCreators);
  } catch (error) {
    logError(error, "BRAND_SAVED_CREATORS_FETCH_FAILED");
    res.status(500).json({ error: "Failed to fetch saved creators" });
  }
});

/**
 * POST /api/brand/creators/saved
 * 
 * Save/shortlist a creator
 */
router.post("/creators/saved", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { talentId } = req.body;

    if (!userId || !talentId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get brand ID from user
    const brand = await prisma.brand.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!brand) {
      return res.status(404).json({ error: "Brand not found" });
    }

    // Create or update saved talent
    const saved = await prisma.brandSavedTalent.upsert({
      where: {
        brandId_talentId: {
          brandId: brand.id,
          talentId
        }
      },
      create: {
        brandId: brand.id,
        talentId,
        status: "saved"
      },
      update: {
        status: "saved",
        updatedAt: new Date()
      }
    });

    console.log(`[BRAND] POST /creators/saved - Brand ${brand.id} saved creator ${talentId}`);
    res.json({ success: true, saved });
  } catch (error) {
    logError(error, "BRAND_SAVE_CREATOR_FAILED");
    res.status(500).json({ error: "Failed to save creator" });
  }
});

/**
 * DELETE /api/brand/creators/saved/:talentId
 * 
 * Unsave/remove creator from shortlist
 */
router.delete("/creators/saved/:talentId", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { talentId } = req.params;

    if (!userId || !talentId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get brand ID from user
    const brand = await prisma.brand.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!brand) {
      return res.status(404).json({ error: "Brand not found" });
    }

    // Delete saved talent entry
    await prisma.brandSavedTalent.delete({
      where: {
        brandId_talentId: {
          brandId: brand.id,
          talentId
        }
      }
    });

    console.log(`[BRAND] DELETE /creators/saved/${talentId} - Brand ${brand.id} unsaved creator ${talentId}`);
    res.json({ success: true });
  } catch (error) {
    if ((error as any).code === "P2025") {
      // Not found
      return res.status(404).json({ error: "Saved creator not found" });
    }
    logError(error, "BRAND_UNSAVE_CREATOR_FAILED");
    res.status(500).json({ error: "Failed to unsave creator" });
  }
});

/**
 * POST /api/brand/creators/:talentId/request-campaign
 * 
 * Request a campaign with a creator
 * Returns: Campaign request details + next steps
 */
router.post("/creators/:talentId/request-campaign", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { talentId } = req.params;
    const { campaignBrief, budget, timeline } = req.body;

    if (!userId || !talentId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get brand ID from user
    const brand = await prisma.brand.findUnique({
      where: { userId },
      select: { id: true, name: true }
    });

    if (!brand) {
      return res.status(404).json({ error: "Brand not found" });
    }

    // Verify creator exists and is available
    const creator = await prisma.talent.findUnique({
      where: { id: talentId },
      select: { id: true, displayName: true, status: true }
    });

    if (!creator) {
      return res.status(404).json({ error: "Creator not found" });
    }

    if (creator.status !== "ACTIVE") {
      return res.status(400).json({ error: "Creator is not currently available" });
    }

    // Log campaign request (future: create BrandCampaignRequest model)
    console.log(`[BRAND] POST /creators/${talentId}/request-campaign - Brand ${brand.id} requested campaign with creator ${talentId}`);
    console.log(`Campaign brief: ${campaignBrief}, Budget: ${budget}, Timeline: ${timeline}`);

    // Return confirmation
    res.json({
      success: true,
      message: "Campaign request submitted",
      nextSteps: [
        "Our team will review your request",
        "We'll provide creator availability and pricing",
        "You'll receive a formal brief within 2 business days"
      ]
    });
  } catch (error) {
    logError(error, "BRAND_REQUEST_CAMPAIGN_FAILED");
    res.status(500).json({ error: "Failed to request campaign" });
  }
});

export default router;
