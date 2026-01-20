/**
 * Assisted Outreach Routes (Premium Feature)
 * 
 * Semi-automated, approval-based outreach system
 * - AI-generated draft emails (3 versions)
 * - Human approval required
 * - Reply tracking & sentiment analysis
 * - Booking trigger on positive replies
 */

import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { createRateLimiter, RATE_LIMITS } from "../middleware/rateLimit.js";
import prisma from "../lib/prisma.js";
import {
  generateAssistedOutreachDrafts,
  generateFallbackDrafts,
  detectSentiment,
  type OutreachContext
} from "../services/assistedOutreachService.js";
import { sendEmailWithGmail } from "../services/email/sendOutbound.js";
import { logError } from "../lib/logger.js";

const router = Router();

// Rate limiter for sending outreach emails (max 5 per minute per user)
const outreachSendLimiter = createRateLimiter({
  ...RATE_LIMITS.EMAIL_SEND,
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 5, // 5 emails per minute
  message: "Too many outreach emails sent. Maximum 5 per minute. Please try again later.",
  keyGenerator: (req) => (req as any).user?.id || req.ip || "unknown",
});

// ============================================================================
// PERMISSION CHECKS
// ============================================================================

async function checkAdminPermission(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });
  return user?.role === "ADMIN" || user?.role === "SUPERADMIN";
}

// ============================================================================
// POST /api/assisted-outreach/campaigns - Create new campaign + generate drafts
// ============================================================================

router.post("/campaigns", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Check permissions
    const isAdmin = await checkAdminPermission(userId);
    if (!isAdmin) {
      return res.status(403).json({ error: "Only admin can create assisted outreach campaigns" });
    }

    const { brandId, contactId, goal, senderUserId } = req.body;

    // Validate inputs
    if (!brandId || !contactId || !goal || !senderUserId) {
      return res.status(400).json({ error: "Missing required fields: brandId, contactId, goal, senderUserId" });
    }

    const validGoals = ["STRATEGY_AUDIT", "CREATIVE_CONCEPTS", "CREATOR_MATCHING"];
    if (!validGoals.includes(goal)) {
      return res.status(400).json({ error: `Invalid goal. Must be one of: ${validGoals.join(", ")}` });
    }

    // Fetch brand and contact
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      select: {
        id: true,
        name: true,
        domain: true,
        websiteUrl: true,
        industry: true
      }
    });

    if (!brand) {
      return res.status(404).json({ error: "Brand not found" });
    }

    const contact = await prisma.crmBrandContact.findUnique({
      where: { id: contactId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        title: true,
        email: true,
        crmBrandId: true
      }
    });

    if (!contact || contact.crmBrandId !== brandId) {
      return res.status(404).json({ error: "Contact not found or doesn't belong to brand" });
    }

    if (!contact.email) {
      return res.status(400).json({ error: "Contact must have an email address" });
    }

    // Fetch sender
    const sender = await prisma.user.findUnique({
      where: { id: senderUserId },
      select: { id: true, name: true, email: true }
    });

    if (!sender) {
      return res.status(404).json({ error: "Sender not found" });
    }

    // Create campaign and drafts in transaction to prevent orphaned records
    const { campaign: newCampaign } = await prisma.$transaction(async (tx) => {
      // Create campaign
      const campaign = await tx.outreachCampaign.create({
        data: {
          brandId,
          contactId,
          goal,
          status: "DRAFT_REQUIRES_APPROVAL",
          createdByUserId: userId,
          senderUserId
        }
      });

      console.log(`[ASSISTED_OUTREACH] Campaign created: ${campaign.id}`);

      // Generate AI drafts
      const context: OutreachContext = {
        campaignId: campaign.id,
        brandName: brand.name,
        brandWebsite: brand.websiteUrl || "",
        brandIndustry: brand.industry || "",
        contactFirstName: contact.firstName || "there",
        contactLastName: contact.lastName || "",
        contactRole: contact.title || "Contact",
        contactEmail: contact.email,
        goal,
        senderName: sender.name || sender.id
      };

      let drafts;
      try {
        drafts = await generateAssistedOutreachDrafts(context);
        console.log(`[ASSISTED_OUTREACH] Generated ${drafts.length} AI drafts for campaign ${campaign.id}`);
      } catch (aiError) {
        console.warn(`[ASSISTED_OUTREACH] AI generation failed for campaign ${campaign.id}, using fallback templates:`, aiError);
        // Use fallback templates if AI fails
        drafts = generateFallbackDrafts(context);
        console.log(`[ASSISTED_OUTREACH] Generated ${drafts.length} fallback drafts for campaign ${campaign.id}`);
        
        // Save fallback drafts within transaction
        await Promise.all(
          drafts.map(draft =>
            tx.outreachDraft.create({
              data: {
                campaignId: campaign.id,
                version: draft.version,
                subject: draft.subject,
                body: draft.body,
                isApproved: false,
                wasEdited: false
              }
            })
          )
        );
      }

      return { campaign, drafts };
    });

    // Fetch full campaign with drafts for response
    const populatedCampaign = await prisma.outreachCampaign.findUnique({
      where: { id: newCampaign.id },
      include: {
        drafts: true,
        brand: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true, title: true } },
        senderUser: { select: { id: true, name: true, email: true } },
        createdByUser: { select: { id: true, name: true } }
      }
    });

    res.status(201).json({
      success: true,
      campaign: populatedCampaign,
      message: "Campaign created. 3 drafts generated. Review and approve one to send."
    });
  } catch (error) {
    console.error("[ASSISTED_OUTREACH] Error creating campaign:", error);
    logError("Failed to create assisted outreach campaign", error as any);
    res.status(500).json({ error: "Failed to create campaign" });
  }
});

// ============================================================================
// GET /api/assisted-outreach/campaigns - List campaigns
// ============================================================================

router.get("/campaigns", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const campaigns = await prisma.outreachCampaign.findMany({
      where: {
        OR: [
          { createdByUserId: userId },
          { senderUserId: userId }
        ]
      },
      include: {
        brand: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        drafts: { select: { id: true, isApproved: true, version: true } },
        replies: { select: { id: true, sentiment: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    res.json({
      success: true,
      campaigns,
      count: campaigns.length
    });
  } catch (error) {
    console.error("[ASSISTED_OUTREACH] Error fetching campaigns:", error);
    logError("Failed to fetch assisted outreach campaigns", error as any);
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

// ============================================================================
// GET /api/assisted-outreach/campaigns/check-duplicate - Check for existing campaigns
// ============================================================================

router.get("/campaigns/check-duplicate", requireAuth, async (req: Request, res: Response) => {
  try {
    const { brandId, contactId } = req.query;

    if (!brandId || !contactId) {
      return res.status(400).json({ error: "brandId and contactId are required" });
    }

    // Find existing campaigns for this contact (excluding CLOSED/archived campaigns)
    const existingCampaign = await prisma.outreachCampaign.findFirst({
      where: {
        brandId: String(brandId),
        contactId: String(contactId),
        status: {
          in: ["DRAFT_REQUIRES_APPROVAL", "APPROVED", "SENT", "REPLIED", "BOOKED"]
        }
      },
      select: {
        id: true,
        status: true,
        createdAt: true
      }
    });

    if (existingCampaign) {
      return res.json({
        hasDuplicate: true,
        duplicateCampaign: existingCampaign
      });
    }

    res.json({
      hasDuplicate: false,
      duplicateCampaign: null
    });
  } catch (error) {
    console.error("[ASSISTED_OUTREACH] Error checking duplicates:", error);
    logError("Failed to check duplicate campaigns", error as any);
    res.status(500).json({ error: "Failed to check duplicates" });
  }
});

// ============================================================================
// GET /api/assisted-outreach/campaigns/:id - View campaign with drafts and replies
// ============================================================================

router.get("/campaigns/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.params;

    const campaign = await prisma.outreachCampaign.findUnique({
      where: { id },
      include: {
        drafts: {
          orderBy: { version: "asc" }
        },
        replies: {
          orderBy: { detectedAt: "desc" }
        },
        brand: { select: { id: true, name: true, websiteUrl: true, industry: true } },
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true, title: true }
        },
        senderUser: { select: { id: true, name: true, email: true } },
        createdByUser: { select: { id: true, name: true } }
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    // Permission check: only creator or admin
    const isAdmin = await checkAdminPermission(userId);
    if (campaign.createdByUserId !== userId && !isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({
      success: true,
      campaign
    });
  } catch (error) {
    console.error("[ASSISTED_OUTREACH] Error fetching campaign:", error);
    logError("Failed to fetch assisted outreach campaign", error as any);
    res.status(500).json({ error: "Failed to fetch campaign" });
  }
});

// ============================================================================
// PATCH /api/assisted-outreach/drafts/:id - Edit draft (subject/body)
// ============================================================================

router.patch("/drafts/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.params;
    const { subject, body } = req.body;

    const draft = await prisma.outreachDraft.findUnique({
      where: { id },
      include: { campaign: true }
    });

    if (!draft) {
      return res.status(404).json({ error: "Draft not found" });
    }

    // Permission check: only creator or admin
    const isAdmin = await checkAdminPermission(userId);
    if (draft.campaign.createdByUserId !== userId && !isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Cannot edit if already sent
    if (draft.sentAt) {
      return res.status(400).json({ error: "Cannot edit sent draft" });
    }

    // Update draft
    const updated = await prisma.outreachDraft.update({
      where: { id },
      data: {
        subject: subject || draft.subject,
        body: body || draft.body,
        wasEdited: true,
        editedAt: new Date(),
        editedBy: userId
      }
    });

    console.log(`[ASSISTED_OUTREACH] Draft ${id} edited by ${userId}`);

    res.json({
      success: true,
      draft: updated,
      message: "Draft updated"
    });
  } catch (error) {
    console.error("[ASSISTED_OUTREACH] Error updating draft:", error);
    logError("Failed to update assisted outreach draft", error as any);
    res.status(500).json({ error: "Failed to update draft" });
  }
});

// ============================================================================
// POST /api/assisted-outreach/drafts/:id/approve-and-send - Approve & send
// ============================================================================

router.post(
  "/drafts/:id/approve-and-send",
  requireAuth,
  outreachSendLimiter,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      // Permission check: admin only
      const isAdmin = await checkAdminPermission(userId);
      if (!isAdmin) {
        return res.status(403).json({ error: "Only admin can send assisted outreach emails" });
      }

      const { id } = req.params;

      // Fetch draft with campaign
      const draft = await prisma.outreachDraft.findUnique({
        where: { id },
        include: {
          campaign: {
            include: {
              contact: true,
              senderUser: true,
              brand: true
            }
          }
        }
      });

      if (!draft) {
        return res.status(404).json({ error: "Draft not found" });
      }

      const { campaign } = draft;

      // Validations
      if (!campaign.contact.email) {
        return res.status(400).json({ error: "Contact has no email address" });
      }

      if (draft.sentAt) {
        return res.status(400).json({ error: "This draft has already been sent" });
      }

      // Send email via Gmail
      let emailMessageId: string;
      try {
        const sendResult = await sendEmailWithGmail({
          userId: campaign.senderUserId,
          from: campaign.senderUser.email || "noreply@break.com",
          to: campaign.contact.email,
          subject: draft.subject,
          htmlBody: draft.body
        });

        if (!sendResult.success || !sendResult.messageId) {
          throw new Error("Email send failed: Unknown error");
        }

        emailMessageId = sendResult.messageId;
      } catch (emailError) {
        console.error("[ASSISTED_OUTREACH] Email send failed:", emailError);
        return res.status(500).json({ error: "Failed to send email: " + (emailError as any).message });
      }

      // Update draft
      const updatedDraft = await prisma.outreachDraft.update({
        where: { id },
        data: {
          isApproved: true,
          isApprovedVersion: true,
          approvedByUserId: userId,
          approvedAt: new Date(),
          sentAt: new Date(),
          emailMessageId
        }
      });

      // Update campaign
      const updatedCampaign = await prisma.outreachCampaign.update({
        where: { id: campaign.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          approvedDraftId: id
        }
      });

      console.log(`[ASSISTED_OUTREACH] Email sent for campaign ${campaign.id} - messageId: ${emailMessageId}`);

      res.json({
        success: true,
        campaign: updatedCampaign,
        draft: updatedDraft,
        message: `Email sent to ${campaign.contact.email}`
      });
    } catch (error) {
      console.error("[ASSISTED_OUTREACH] Error sending email:", error);
      logError("Failed to send assisted outreach email", error as any);
      res.status(500).json({ error: "Failed to send email" });
    }
  }
);

// ============================================================================
// POST /api/assisted-outreach/webhooks/reply - Webhook for incoming replies
// ============================================================================

router.post("/webhooks/reply", async (req: Request, res: Response) => {
  try {
    const {
      messageId,
      originalMessageId,
      replyText,
      senderEmail,
      senderName,
      timestamp
    } = req.body;

    if (!originalMessageId || !replyText) {
      return res.status(400).json({ error: "Missing required fields: originalMessageId, replyText" });
    }

    // Find draft by messageId
    const draft = await prisma.outreachDraft.findFirst({
      where: { emailMessageId: originalMessageId },
      include: { campaign: true }
    });

    if (!draft) {
      // Message not found - might be from non-outreach email
      console.log(`[ASSISTED_OUTREACH] Reply to untracked message: ${originalMessageId}`);
      return res.status(200).json({ message: "Message not matched to assisted outreach campaign" });
    }

    // Detect sentiment
    const { sentiment, confidence } = detectSentiment(replyText);

    // Create reply record
    const reply = await prisma.outreachReply.create({
      data: {
        campaignId: draft.campaignId,
        emailMessageId: originalMessageId,
        replyText,
        senderEmail: senderEmail || "unknown",
        senderName: senderName || "Recipient",
        sentiment,
        confidenceScore: confidence,
        detectedAt: new Date(timestamp || Date.now())
      }
    });

    console.log(`[ASSISTED_OUTREACH] Reply detected for campaign ${draft.campaignId} - sentiment: ${sentiment}`);

    // Update campaign status if positive
    if (sentiment === "POSITIVE") {
      await prisma.outreachCampaign.update({
        where: { id: draft.campaignId },
        data: {
          status: "REPLIED",
          repliedAt: new Date()
        }
      });

      console.log(`[ASSISTED_OUTREACH] Campaign ${draft.campaignId} marked as REPLIED (positive)`);
    }

    res.json({
      success: true,
      reply,
      sentiment,
      message: `Reply recorded - sentiment: ${sentiment}`
    });
  } catch (error) {
    console.error("[ASSISTED_OUTREACH] Error processing reply webhook:", error);
    logError("Failed to process assisted outreach reply", error as any);
    res.status(500).json({ error: "Failed to process reply" });
  }
});

// ============================================================================
// POST /api/assisted-outreach/campaigns/:id/book - Book a meeting from positive reply
// ============================================================================

router.post("/campaigns/:id/book", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Check permissions
    const isAdmin = await checkAdminPermission(userId);
    if (!isAdmin) {
      return res.status(403).json({ error: "Only admin can book meetings" });
    }

    const { id: campaignId } = req.params;

    // Find campaign
    const campaign = await prisma.outreachCampaign.findUnique({
      where: { id: campaignId },
      include: {
        replies: true
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    // Check if campaign has positive replies
    const positiveReply = campaign.replies?.find(r => r.sentiment === "POSITIVE");
    if (!positiveReply) {
      return res.status(400).json({ error: "Campaign must have a POSITIVE reply to book" });
    }

    // Update campaign status to BOOKED
    const updated = await prisma.outreachCampaign.update({
      where: { id: campaignId },
      data: {
        status: "BOOKED",
        bookedAt: new Date()
      },
      include: {
        brand: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        drafts: true,
        replies: true
      }
    });

    console.log(`[ASSISTED_OUTREACH] Campaign ${campaignId} booked by user ${userId}`);

    res.json({
      success: true,
      campaign: updated,
      message: "Meeting booked successfully"
    });
  } catch (error) {
    console.error("[ASSISTED_OUTREACH] Error booking campaign:", error);
    logError("Failed to book assisted outreach campaign", error as any);
    res.status(500).json({ error: "Failed to book meeting" });
  }
});

// ============================================================================
// POST /api/assisted-outreach/seed - Create test data (DEV ONLY)
// ============================================================================

router.post("/seed", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Only allow in development or for specific users
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ error: "Seed endpoint not available in production" });
    }

    // Check if test data already exists
    const existingBrand = await prisma.brand.findFirst({
      where: { name: "Test Luxury Brand" }
    });

    if (existingBrand) {
      return res.json({
        success: true,
        message: "Test data already exists",
        brandId: existingBrand.id
      });
    }

    // Create test brand
    const brand = await prisma.brand.create({
      data: {
        name: "Test Luxury Brand",
        domain: "testbrand.com",
        websiteUrl: "https://testbrand.com",
        industry: "Fashion & Luxury"
      }
    });

    // Create test contact
    const testContactId = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const contact = await prisma.crmBrandContact.create({
      data: {
        id: testContactId,
        firstName: "Jane",
        lastName: "Doe",
        email: "jane.doe+outreach-test@gmail.com",
        title: "Marketing Director",
        crmBrandId: brand.id,
        relationshipStatus: "New",
        createdAt: new Date(),
        updatedAt: new Date()
      } as any
    });

    // Get sender user (the current user or any admin)
    const sender = await prisma.user.findFirst({
      where: { role: { in: ["ADMIN", "SUPERADMIN"] } }
    });

    if (!sender) {
      return res.status(400).json({ error: "No admin user found for seed data" });
    }

    // Create test campaign
    const campaign = await prisma.outreachCampaign.create({
      data: {
        brandId: brand.id,
        contactId: contact.id,
        goal: "STRATEGY_AUDIT",
        status: "DRAFT_REQUIRES_APPROVAL",
        createdByUserId: userId,
        senderUserId: sender.id
      }
    });

    // Generate test drafts
    const context: OutreachContext = {
      campaignId: campaign.id,
      brandName: brand.name,
      brandWebsite: brand.websiteUrl,
      brandIndustry: brand.industry,
      contactFirstName: contact.firstName,
      contactLastName: contact.lastName,
      contactRole: contact.title,
      contactEmail: contact.email,
      goal: "STRATEGY_AUDIT",
      senderName: sender.name || "Break Team"
    };

    const drafts = await generateAssistedOutreachDrafts(context);

    res.json({
      success: true,
      message: "Test data created successfully",
      testData: {
        brandId: brand.id,
        brandName: brand.name,
        contactId: contact.id,
        contactEmail: contact.email,
        campaignId: campaign.id,
        draftsGenerated: drafts.length
      }
    });
  } catch (error) {
    console.error("[ASSISTED_OUTREACH] Error seeding test data:", error);
    logError("Failed to seed assisted outreach test data", error as any);
    res.status(500).json({ error: "Failed to create test data" });
  }
});

export default router;
