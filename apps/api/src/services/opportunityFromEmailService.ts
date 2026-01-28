/**
 * Opportunity Creation from Email Service
 * 
 * Creates Opportunity records from classified emails.
 * Handles deduplication, brand/talent linking, and metadata storage.
 */

import prisma from '../lib/prisma.js';
import { classifyEmailForOpportunity } from '../lib/emailIntelligence.js';
import { randomUUID } from 'crypto';

/**
 * Create an opportunity from a classified email
 * 
 * @param {Object} email - InboundEmail record
 * @param {Object} classification - Classification result from emailIntelligence
 * @returns {Promise<Object>} Created opportunity or null if duplicate/invalid
 */
export async function createOpportunityFromEmail(email, classification) {
  try {
    // Check for duplicate (same email already has opportunity)
    const existing = await prisma.opportunity.findFirst({
      where: {
        sourceEmailId: email.id,
      },
    });

    if (existing) {
      console.log(`[OPPORTUNITY] Duplicate detected for email ${email.id}, skipping`);
      return null;
    }

    // Generate opportunity data from email
    const opportunityId = `opp_email_${Date.now()}_${randomUUID().substring(0, 8)}`;
    
    // Extract title from subject (remove Re:, Fwd:, etc.)
    const title = cleanSubject(email.subject || "Untitled Opportunity");
    
    // Use detected brand or fallback to sender
    const brand = classification.detectedBrand || extractBrandFromSender(email.fromEmail);
    
    // Create opportunity
    const opportunity = await prisma.opportunity.create({
      data: {
        id: opportunityId,
        title,
        brand,
        location: "", // Unknown from email
        deliverables: classification.signals?.join(", ") || "",
        payment: "", // Unknown from email
        deadline: "", // Unknown from email
        status: "Inbox Detected · Needs Review",
        image: "", // No image from email
        logo: "", // No logo from email
        type: classification.detectedType || "OTHER",
        isActive: false, // Inactive until reviewed
        createdBy: "system",
        
        // Email-sourced fields
        source: "email",
        sourceEmailId: email.id,
        confidence: classification.confidence,
        detectedType: classification.detectedType,
        detectedBrandId: classification.detectedBrandId || null,
        detectedTalentId: classification.detectedTalentId || null,
        reviewStatus: "unreviewed",
        metadata: {
          threadId: email.threadId,
          fromEmail: email.fromEmail,
          toEmail: email.toEmail,
          receivedAt: email.receivedAt,
          snippet: email.snippet,
          classificationReason: classification.reason,
          signals: classification.signals,
        },
      },
    });

    console.log(`[OPPORTUNITY] Created opportunity ${opportunityId} from email ${email.id} (confidence: ${classification.confidence})`);
    return opportunity;
    
  } catch (error) {
    console.error(`[OPPORTUNITY] Failed to create opportunity from email ${email.id}:`, error);
    return null; // Fail silently to avoid breaking email sync
  }
}

/**
 * Process a batch of emails and create opportunities for deal-related ones
 * 
 * @param {Array} emails - Array of InboundEmail records
 * @returns {Promise<Object>} Stats about created opportunities
 */
export async function processEmailBatchForOpportunities(emails) {
  const stats = {
    processed: 0,
    dealRelated: 0,
    created: 0,
    skipped: 0,
    failed: 0,
  };

  for (const email of emails) {
    stats.processed++;

    try {
      // Classify email
      const classification = classifyEmailForOpportunity(email);

      if (!classification.isDealRelated) {
        stats.skipped++;
        continue;
      }

      stats.dealRelated++;

      // Create opportunity
      const opportunity = await createOpportunityFromEmail(email, classification);

      if (opportunity) {
        stats.created++;
      } else {
        stats.skipped++; // Duplicate
      }

    } catch (error) {
      console.error(`[OPPORTUNITY] Error processing email ${email.id}:`, error);
      stats.failed++;
    }
  }

  console.log(`[OPPORTUNITY] Batch processed: ${stats.created} created, ${stats.skipped} skipped, ${stats.failed} failed`);
  return stats;
}

/**
 * Get unreviewed opportunities from inbox (for admin review)
 * 
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} Unreviewed opportunities
 */
export async function getInboxDetectedOpportunities(filters = {}) {
  const { minConfidence = 0, status = 'unreviewed' } = filters;

  return await prisma.opportunity.findMany({
    where: {
      source: "email",
      reviewStatus: status,
      ...(minConfidence > 0 && { confidence: { gte: minConfidence } }),
    },
    orderBy: [
      { confidence: 'desc' }, // High confidence first
      { createdAt: 'desc' },
    ],
    take: 50, // Limit to prevent overload
  });
}

/**
 * Approve an opportunity (convert to active opportunity or deal)
 * 
 * @param {string} opportunityId - Opportunity ID
 * @param {string} userId - User ID approving
 * @param {Object} updates - Optional updates to opportunity
 * @returns {Promise<Object>} Updated opportunity
 */
export async function approveOpportunity(opportunityId, userId, updates = {}) {
  return await prisma.opportunity.update({
    where: { id: opportunityId },
    data: {
      reviewStatus: "approved",
      reviewedBy: userId,
      reviewedAt: new Date(),
      isActive: true, // Make it active/live
      ...updates,
    },
  });
}

/**
 * Dismiss an opportunity (false positive)
 * 
 * @param {string} opportunityId - Opportunity ID
 * @param {string} userId - User ID dismissing
 * @param {string} reason - Optional reason for dismissal
 * @returns {Promise<Object>} Updated opportunity
 */
export async function dismissOpportunity(opportunityId, userId, reason = null) {
  return await prisma.opportunity.update({
    where: { id: opportunityId },
    data: {
      reviewStatus: "dismissed",
      reviewedBy: userId,
      reviewedAt: new Date(),
      isActive: false,
      metadata: {
        ...((await prisma.opportunity.findUnique({ where: { id: opportunityId } }))?.metadata || {}),
        dismissalReason: reason,
      },
    },
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Clean email subject (remove Re:, Fwd:, etc.)
 */
function cleanSubject(subject) {
  return subject
    .replace(/^(Re:|RE:|Fwd:|FW:|Fw:)\s*/gi, "")
    .trim()
    .substring(0, 200); // Limit length
}

/**
 * Extract brand name from sender email
 */
function extractBrandFromSender(email) {
  if (!email) return "Unknown Brand";
  
  const domain = email.split("@")[1]?.split(".")[0] || "";
  
  // Capitalize first letter
  if (domain && domain !== "gmail" && domain !== "yahoo" && domain !== "outlook") {
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  }
  
  return email.split("@")[0] || "Unknown Brand";
}
