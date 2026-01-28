/**
 * Email Intelligence Classification System
 * 
 * Detects deal-related emails from inbox using heuristic-based analysis.
 * Does NOT use OpenAI - relies on keywords, patterns, and business logic.
 * 
 * Usage:
 *   const result = classifyEmailForOpportunity(email);
 *   if (result.isDealRelated) {
 *     // Create opportunity
 *   }
 */

// ============================================
// KEYWORD DICTIONARIES
// ============================================

const DEAL_KEYWORDS = {
  // High confidence deal indicators
  PAID: [
    "paid partnership",
    "paid collab",
    "paid post",
    "sponsored content",
    "sponsorship",
    "budget",
    "compensation",
    "payment terms",
    "rate card",
    "pay you",
    "paying",
    "remuneration",
  ],
  CAMPAIGN: [
    "campaign brief",
    "brand campaign",
    "new campaign",
    "collaboration opportunity",
    "partnership opportunity",
    "influencer campaign",
    "creator campaign",
    "marketing campaign",
  ],
  DELIVERABLES: [
    "deliverables",
    "content deliverables",
    "posting schedule",
    "content requirements",
    "number of posts",
    "stories",
    "reels",
    "tiktoks",
    "youtube video",
    "instagram post",
  ],
  CONTRACT: [
    "contract",
    "agreement",
    "sign off",
    "terms and conditions",
    "legal review",
    "NDA",
    "non-disclosure",
  ],

  // Medium confidence indicators
  GIFTING: [
    "gifting opportunity",
    "gift collaboration",
    "send you product",
    "complimentary product",
    "sample products",
  ],
  INQUIRY: [
    "interested in working",
    "would you be interested",
    "collaboration with you",
    "partnership with you",
    "work together",
    "collaborate together",
  ],
};

const NEGATIVE_KEYWORDS = [
  "unsubscribe",
  "spam",
  "newsletter",
  "automated message",
  "noreply",
  "do not reply",
  "out of office",
  "auto-reply",
];

// Known brand email domains (heuristic for brand detection)
const BRAND_DOMAINS = [
  "pr.co",
  "brandwatch.com",
  "influence.co",
  "aspire.io",
  "tagger.com",
  "grin.co",
  "creatoriq.com",
  "upfluence.com",
  "tribegroup.co",
  "whalar.com",
];

// ============================================
// CLASSIFICATION FUNCTIONS
// ============================================

/**
 * Main classification function
 * @param {Object} email - InboundEmail object
 * @returns {Object} Classification result
 */
export function classifyEmailForOpportunity(email) {
  if (!email || !email.subject) {
    return {
      isDealRelated: false,
      confidence: 0,
      detectedType: "OTHER",
      reason: "Missing email or subject",
    };
  }

  // Combine subject + snippet for analysis
  const text = `${email.subject || ""} ${email.snippet || ""} ${email.body || ""}`.toLowerCase();
  const fromEmail = (email.fromEmail || "").toLowerCase();

  // Check for negative keywords (spam filters)
  if (hasNegativeKeywords(text)) {
    return {
      isDealRelated: false,
      confidence: 0,
      detectedType: "OTHER",
      reason: "Spam/automated message",
    };
  }

  // Check if forwarded (high signal for deal emails)
  const isForwarded = email.subject?.startsWith("Fwd:") || email.subject?.startsWith("FW:");

  // Calculate confidence score
  const signals = detectSignals(text, fromEmail, isForwarded);
  const confidence = calculateConfidence(signals);

  // Determine deal type
  const detectedType = determineType(signals);

  // Determine if deal-related (threshold: 0.4)
  const isDealRelated = confidence >= 0.4;

  // Extract brand and talent (if possible)
  const detectedBrand = extractBrand(email, fromEmail);
  const detectedTalent = extractTalent(email);

  return {
    isDealRelated,
    confidence: parseFloat(confidence.toFixed(2)),
    detectedType,
    detectedBrand,
    detectedTalent,
    signals: signals.map(s => s.type),
    reason: generateReason(signals, confidence),
  };
}

/**
 * Check for spam/automated messages
 */
function hasNegativeKeywords(text) {
  return NEGATIVE_KEYWORDS.some(keyword => text.includes(keyword));
}

/**
 * Detect all classification signals in the email
 */
function detectSignals(text, fromEmail, isForwarded) {
  const signals = [];

  // Check for paid partnership keywords (high weight)
  DEAL_KEYWORDS.PAID.forEach(keyword => {
    if (text.includes(keyword)) {
      signals.push({ type: "paid_partnership", weight: 0.3, keyword });
    }
  });

  // Check for campaign keywords (high weight)
  DEAL_KEYWORDS.CAMPAIGN.forEach(keyword => {
    if (text.includes(keyword)) {
      signals.push({ type: "campaign", weight: 0.25, keyword });
    }
  });

  // Check for deliverables keywords (medium weight)
  DEAL_KEYWORDS.DELIVERABLES.forEach(keyword => {
    if (text.includes(keyword)) {
      signals.push({ type: "deliverables", weight: 0.2, keyword });
    }
  });

  // Check for contract keywords (medium weight)
  DEAL_KEYWORDS.CONTRACT.forEach(keyword => {
    if (text.includes(keyword)) {
      signals.push({ type: "contract", weight: 0.2, keyword });
    }
  });

  // Check for gifting keywords (low-medium weight)
  DEAL_KEYWORDS.GIFTING.forEach(keyword => {
    if (text.includes(keyword)) {
      signals.push({ type: "gifting", weight: 0.15, keyword });
    }
  });

  // Check for inquiry keywords (low weight)
  DEAL_KEYWORDS.INQUIRY.forEach(keyword => {
    if (text.includes(keyword)) {
      signals.push({ type: "inquiry", weight: 0.1, keyword });
    }
  });

  // Check for known brand domains (medium weight)
  const domain = fromEmail.split("@")[1];
  if (domain && BRAND_DOMAINS.some(brandDomain => domain.includes(brandDomain))) {
    signals.push({ type: "brand_domain", weight: 0.2, keyword: domain });
  }

  // Forwarded email bonus (medium weight)
  if (isForwarded) {
    signals.push({ type: "forwarded", weight: 0.15, keyword: "Fwd:" });
  }

  return signals;
}

/**
 * Calculate confidence score (0-1)
 */
function calculateConfidence(signals) {
  if (signals.length === 0) return 0;

  // Sum weights, but cap at 1.0
  const totalWeight = signals.reduce((sum, signal) => sum + signal.weight, 0);
  return Math.min(totalWeight, 1.0);
}

/**
 * Determine the type of opportunity
 */
function determineType(signals) {
  const types = signals.map(s => s.type);

  // Priority: paid > campaign > gifting > inquiry
  if (types.includes("paid_partnership")) return "DEAL";
  if (types.includes("campaign")) return "CAMPAIGN";
  if (types.includes("contract")) return "DEAL";
  if (types.includes("gifting")) return "GIFTING";
  if (types.includes("inquiry")) return "INQUIRY";

  return "OTHER";
}

/**
 * Extract brand name from email (heuristic)
 */
function extractBrand(email, fromEmail) {
  // Try to extract from sender name
  const senderName = email.metadata?.fromName || email.fromEmail?.split("@")[0] || "";
  
  // Try to extract from email domain
  const domain = fromEmail.split("@")[1]?.split(".")[0] || "";

  // Heuristic: Use sender name if it looks like a brand (capitalized, 2+ words)
  if (senderName && senderName.includes(" ")) {
    return senderName;
  }

  // Fallback: Use domain name (capitalize first letter)
  if (domain && domain !== "gmail" && domain !== "yahoo" && domain !== "outlook") {
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  }

  return null;
}

/**
 * Extract talent name from email (if mentioned in body)
 * This is a simple heuristic - could be improved with NER
 */
function extractTalent(email) {
  // For now, we can't reliably extract talent names without more context
  // This would require:
  // 1. Database of talent names
  // 2. Named Entity Recognition
  // 3. Or matching against existing CRM records
  return null;
}

/**
 * Generate human-readable reason for classification
 */
function generateReason(signals, confidence) {
  if (signals.length === 0) {
    return "No deal indicators found";
  }

  const topSignals = signals.slice(0, 3).map(s => s.keyword);
  
  if (confidence >= 0.7) {
    return `High confidence: Found ${topSignals.join(", ")}`;
  } else if (confidence >= 0.4) {
    return `Medium confidence: Found ${topSignals.join(", ")}`;
  } else {
    return `Low confidence: Found ${topSignals.join(", ")}`;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Classify multiple emails in batch
 */
export function classifyEmailBatch(emails) {
  return emails.map(email => ({
    emailId: email.id,
    ...classifyEmailForOpportunity(email),
  }));
}

/**
 * Filter emails to only those that are deal-related
 */
export function filterDealEmails(emails, minConfidence = 0.4) {
  return emails
    .map(email => ({
      email,
      classification: classifyEmailForOpportunity(email),
    }))
    .filter(({ classification }) => 
      classification.isDealRelated && 
      classification.confidence >= minConfidence
    );
}

/**
 * Check if an email has already been classified (to avoid reprocessing)
 */
export function shouldClassifyEmail(email, existingOpportunities) {
  // Check if we already have an opportunity for this email/thread
  const emailId = email.id || email.gmailId;
  const threadId = email.threadId;

  return !existingOpportunities.some(opp => 
    opp.sourceEmailId === emailId || 
    opp.metadata?.threadId === threadId
  );
}
