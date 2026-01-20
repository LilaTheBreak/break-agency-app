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
import prisma from "../lib/prisma.js";
import {
  generateAssistedOutreachDrafts,
  detectSentiment,
  type OutreachContext
} from "../services/assistedOutreachService.js";
import { sendEmailWithGmail } from "../services/email/sendOutbound.js";
import { logError } from "../lib/logger.js";

const router = Router();

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

    // Create campaign
    const campaign = await prisma.outreachCampaign.create({
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

    const drafts = await generateAssistedOutreachDrafts(context);

    console.log(`[ASSISTED_OUTREACH] Generated ${drafts.length} drafts for campaign ${campaign.id}`);

    // Return campaign with drafts
    const populatedCampaign = await prisma.outreachCampaign.findUnique({
      where: { id: campaign.id },
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

export default router;
