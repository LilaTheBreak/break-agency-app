import express from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { logError } from "../lib/logger.js";

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

    // Get brand ID from BrandUser join table
    const brandUser = await prisma.brandUser.findFirst({
      where: { userId },
      select: { brandId: true }
    });

    if (!brandUser) {
      console.log(`[BRAND] GET /creators - No brand found for user ${userId}`);
      return res.status(403).json({ error: "You are not linked to any brand. Contact your admin to link you to a brand." });
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
      include: {
        SocialAccountConnection: {
          where: { connected: true },
          include: {
            SocialProfile: {
              select: {
                platform: true,
                handle: true,
                displayName: true,
                followerCount: true
              }
            }
          }
        }
      }
    });

    // Transform to brand-safe format
    const brandSafeCreators = creators.map(creator => {
      const connectedPlatforms: Record<string, any> = {};
      
      creator.SocialAccountConnection.forEach(connection => {
        if (connection.SocialProfile) {
          const platform = connection.platform.toLowerCase();
          connectedPlatforms[platform] = {
            handle: connection.SocialProfile.handle,
            followers: connection.SocialProfile.followerCount || 0
          };
        }
      });

      return {
        id: creator.id,
        displayName: creator.displayName,
        profileImageUrl: creator.profileImageUrl,
        categories: creator.categories || [],
        connectedPlatforms,
        // AI recommendation explanation (parsed from social intelligence notes)
        aiRecommendationExplanation: creator.socialIntelligenceNotes 
          ? creator.socialIntelligenceNotes.substring(0, 200)
          : "Vetted creator with strong audience alignment for your campaigns."
      };
    });

    console.log(`[BRAND] GET /creators for brand ${brandUser.brandId} - returned ${brandSafeCreators.length} creators`);
    res.json(brandSafeCreators);
  } catch (error) {
    console.error("[BRAND] Error fetching creators:", error);
    logError("Failed to fetch creators", error as any);
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

    // Get brand ID from BrandUser join table
    const brandUser = await prisma.brandUser.findFirst({
      where: { userId },
      select: { brandId: true }
    });

    if (!brandUser) {
      return res.status(403).json({ error: "You are not linked to any brand. Contact your admin to link you to a brand." });
    }

    // Fetch saved talents
    const savedTalents = await prisma.brandSavedTalent.findMany({
      where: {
        brandId: brandUser.brandId,
        status: "saved"
      },
      include: {
        Talent: {
          include: {
            SocialAccountConnection: {
              where: { connected: true },
              include: {
                SocialProfile: {
                  select: {
                    platform: true,
                    handle: true,
                    displayName: true,
                    followerCount: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const brandSafeCreators = savedTalents.map(saved => {
      const connectedPlatforms: Record<string, any> = {};
      
      saved.Talent.SocialAccountConnection.forEach(connection => {
        if (connection.SocialProfile) {
          const platform = connection.platform.toLowerCase();
          connectedPlatforms[platform] = {
            handle: connection.SocialProfile.handle,
            followers: connection.SocialProfile.followerCount || 0
          };
        }
      });

      return {
        id: saved.Talent.id,
        displayName: saved.Talent.displayName,
        profileImageUrl: saved.Talent.profileImageUrl,
        categories: saved.Talent.categories || [],
        talentId: saved.talentId,
        savedAt: saved.addedAt,
        connectedPlatforms,
        aiRecommendationExplanation: saved.Talent.socialIntelligenceNotes 
          ? saved.Talent.socialIntelligenceNotes.substring(0, 200)
          : "Vetted creator with strong audience alignment for your campaigns."
      };
    });

    console.log(`[BRAND] GET /creators/saved for brand ${brandUser.brandId} - returned ${brandSafeCreators.length} saved creators`);
    res.json(brandSafeCreators);
  } catch (error) {
    console.error("[BRAND] Error fetching saved creators:", error);
    logError("Failed to fetch saved creators", error as any);
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

    // Get brand ID from BrandUser join table
    const brandUser = await prisma.brandUser.findFirst({
      where: { userId },
      select: { brandId: true }
    });

    if (!brandUser) {
      return res.status(403).json({ error: "You are not linked to any brand. Contact your admin to link you to a brand." });
    }

    // Verify talent exists
    const talent = await prisma.talent.findUnique({
      where: { id: talentId },
      select: { id: true, status: true }
    });

    if (!talent || talent.status !== "ACTIVE") {
      return res.status(404).json({ error: "Creator not found or inactive" });
    }

    // Create or update saved talent
    const saved = await prisma.brandSavedTalent.upsert({
      where: {
        brandId_talentId: {
          brandId: brandUser.brandId,
          talentId
        }
      },
      create: {
        id: `${brandUser.brandId}_${talentId}_${Date.now()}`,
        brandId: brandUser.brandId,
        talentId,
        status: "saved"
      },
      update: {
        status: "saved",
        updatedAt: new Date()
      }
    });

    console.log(`[BRAND] POST /creators/saved - Brand ${brandUser.brandId} saved creator ${talentId}`);
    res.json({ success: true, saved });
  } catch (error) {
    console.error("[BRAND] Error saving creator:", error);
    logError("Failed to save creator", error as any);
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

    // Get brand ID from BrandUser join table
    const brandUser = await prisma.brandUser.findFirst({
      where: { userId },
      select: { brandId: true }
    });

    if (!brandUser) {
      return res.status(403).json({ error: "You are not linked to any brand. Contact your admin to link you to a brand." });
    }

    // Delete saved talent entry
    await prisma.brandSavedTalent.delete({
      where: {
        brandId_talentId: {
          brandId: brandUser.brandId,
          talentId
        }
      }
    });

    console.log(`[BRAND] DELETE /creators/saved/${talentId} - Brand ${brandUser.brandId} unsaved creator ${talentId}`);
    res.json({ success: true });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Saved creator not found" });
    }
    console.error("[BRAND] Error removing saved creator:", error);
    logError("Failed to remove saved creator", error);
    res.status(500).json({ error: "Failed to remove saved creator" });
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

    // Get brand ID from BrandUser join table
    const brandUser = await prisma.brandUser.findFirst({
      where: { userId },
      select: { brandId: true }
    });

    if (!brandUser) {
      return res.status(403).json({ error: "You are not linked to any brand. Contact your admin to link you to a brand." });
    }

    // Verify creator exists and is active
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

    // Log campaign request (future: create formal CrmCampaign or Outreach record)
    console.log(`[BRAND] POST /creators/${talentId}/request-campaign - Brand ${brandUser.brandId} requested campaign with creator ${talentId}`);
    if (campaignBrief) console.log(`  Brief: ${campaignBrief}`);
    if (budget) console.log(`  Budget: ${budget}`);
    if (timeline) console.log(`  Timeline: ${timeline}`);

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
    console.error("[BRAND] Error requesting campaign:", error);
    logError("Failed to request campaign", error as any);
    res.status(500).json({ error: "Failed to request campaign" });
  }
});

/**
 * PATCH /api/brand/onboarding
 * 
 * Mark onboarding step as complete
 */
router.patch("/onboarding", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { completedStep } = req.body;

    if (!userId || !completedStep) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const validSteps = ["profile", "billing", "goals", "creators", "approve"];
    if (!validSteps.includes(completedStep)) {
      return res.status(400).json({ error: "Invalid onboarding step" });
    }

    // Get brand by ID (Brand model doesn't have userId, need to find via BrandUser)
    const brandUser = await prisma.brandUser.findFirst({
      where: { userId },
      select: { brandId: true }
    });

    if (!brandUser) {
      return res.status(403).json({ error: "You are not linked to any brand. Contact your admin to link you to a brand." });
    }

    // Get brand to check for existing onboarding status
    const brand = await prisma.brand.findUnique({
      where: { id: brandUser.brandId },
      select: { id: true }
    });

    if (!brand) {
      return res.status(403).json({ error: "Brand access denied" });
    }

    // For now, just log the update
    // In future: Add onboardingStatus field to Brand model
    console.log(`[BRAND] PATCH /onboarding - Brand ${brand.id} completed step: ${completedStep}`);

    res.json({ success: true, message: `Step ${completedStep} marked complete` });
  } catch (error) {
    console.error("[BRAND] Error updating onboarding:", error);
    logError("Failed to update onboarding", error as any);
    res.status(500).json({ error: "Failed to update onboarding" });
  }
});

/**
 * GET /api/brand/onboarding
 * 
 * Get brand's onboarding status
 */
router.get("/onboarding", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Get brand ID from BrandUser join table
    const brandUser = await prisma.brandUser.findFirst({
      where: { userId },
      select: { brandId: true }
    });

    if (!brandUser) {
      return res.status(403).json({ error: "You are not linked to any brand. Contact your admin to link you to a brand." });
    }

    const brand = await prisma.brand.findUnique({
      where: { id: brandUser.brandId },
      select: { id: true }
    });

    if (!brand) {
      return res.status(403).json({ error: "Brand access denied" });
    }

    console.log(`[BRAND] GET /onboarding - Brand ${brand.id}`);
    
    // Return empty object for now (onboardingStatus not yet on Brand model)
    res.json({});
  } catch (error) {
    console.error("[BRAND] Error fetching onboarding:", error);
    logError("Failed to fetch onboarding status", error as any);
    res.status(500).json({ error: "Failed to fetch onboarding status" });
  }
});

export default router;

