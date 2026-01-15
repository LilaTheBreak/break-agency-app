/**
 * Email Classification Engine
 * 
 * Analyzes incoming emails and categorizes them into CRM-relevant types:
 * - MEETING_REQUEST: Calendar invites, meeting scheduling
 * - EVENT_INVITE: Event RSVPs, launches, conferences
 * - BRAND_OPPORTUNITY: Potential new brand partnerships
 * - DEAL_NEGOTIATION: Budget/proposal/partnership discussions
 * - INVOICE_PAYMENT: Financial transactions
 * - DELIVERABLE_CONTENT: Content approvals, asset uploads
 * - TASK_ACTION: Requires follow-up action
 * - SYSTEM_NOTIFICATION: Automated/system emails
 * - LOW_PRIORITY: Spam, newsletters, etc.
 */

const MEETING_KEYWORDS = [
  "meeting", "call", "schedule", "calendar", "zoom", "google meet", 
  "microsoft teams", "webinar", "sync", "standup", "1:1"
];

const EVENT_KEYWORDS = [
  "invite", "rsvp", "event", "launch", "dinner", "press", 
  "conference", "summit", "fashion week", "expo", "panel"
];

const DEAL_KEYWORDS = [
  "budget", "fee", "proposal", "campaign", "partnership", 
  "contract", "negotiate", "rate", "investment", "sponsorship"
];

const CONTENT_KEYWORDS = [
  "approval", "draft", "asset", "deliverable", "final", 
  "upload", "review", "content", "creative", "due by"
];

const ACTION_KEYWORDS = [
  "can you", "please", "confirm", "review", "let me know", 
  "awaiting", "pending", "action required", "urgent", "asap"
];

const INVOICE_KEYWORDS = [
  "invoice", "payment", "receipt", "billing", "charge", "paid", 
  "transaction", "order", "refund", "credit card"
];

const KNOWN_EVENT_PLATFORMS = [
  "eventbrite", "lunchclub", "calendly", "stripe", "outlook.calendar",
  "google.calendar", "zoom", "notion"
];

const KNOWN_NOTIFICATION_PLATFORMS = [
  "github", "vercel", "sentry", "slack", "jira", "asana", 
  "monday", "notion", "stripe", "twitter", "instagram"
];

const SYSTEM_KEYWORDS = [
  "automated", "notification", "alert", "noreply", "no-reply",
  "do not reply", "system generated"
];

/**
 * Classify an email based on content analysis
 * Returns classification object with type and confidence score
 */
export function classifyEmail(email) {
  const {
    subject = "",
    body = "",
    sender = "",
    senderEmail = "",
    attachments = [],
    participants = []
  } = email;

  const text = `${subject} ${body}`.toLowerCase();
  const classifications = [];

  // Check for calendar attachments (.ics)
  const hasCalendarAttachment = attachments?.some(a => 
    a.filename?.toLowerCase().endsWith('.ics') ||
    a.mimeType === 'text/calendar'
  );

  // 1. MEETING_REQUEST detection
  if (hasCalendarAttachment || containsKeywords(text, MEETING_KEYWORDS)) {
    classifications.push({
      type: "MEETING_REQUEST",
      confidence: hasCalendarAttachment ? 0.95 : 0.75,
      reason: hasCalendarAttachment ? "Calendar attachment detected" : "Meeting keywords found"
    });
  }

  // 2. EVENT_INVITE detection
  if (containsKeywords(text, EVENT_KEYWORDS) || 
      isFromEventPlatform(senderEmail)) {
    classifications.push({
      type: "EVENT_INVITE",
      confidence: isFromEventPlatform(senderEmail) ? 0.9 : 0.7,
      reason: isFromEventPlatform(senderEmail) ? "Event platform detected" : "Event keywords found"
    });
  }

  // 3. DEAL_NEGOTIATION detection
  if (containsKeywords(text, DEAL_KEYWORDS)) {
    classifications.push({
      type: "DEAL_NEGOTIATION",
      confidence: 0.8,
      reason: "Deal-related keywords found"
    });
  }

  // 4. DELIVERABLE_CONTENT detection
  if (containsKeywords(text, CONTENT_KEYWORDS)) {
    classifications.push({
      type: "DELIVERABLE_CONTENT",
      confidence: 0.75,
      reason: "Content/deliverable keywords found"
    });
  }

  // 5. INVOICE_PAYMENT detection
  if (containsKeywords(text, INVOICE_KEYWORDS)) {
    classifications.push({
      type: "INVOICE_PAYMENT",
      confidence: 0.85,
      reason: "Payment/invoice keywords found"
    });
  }

  // 6. TASK_ACTION detection (action items)
  if (containsKeywords(text, ACTION_KEYWORDS)) {
    classifications.push({
      type: "TASK_ACTION",
      confidence: 0.7,
      reason: "Action-required keywords found"
    });
  }

  // 7. SYSTEM_NOTIFICATION detection
  if (isSystemEmail(sender, senderEmail) || 
      isFromNotificationPlatform(senderEmail) ||
      containsKeywords(text, SYSTEM_KEYWORDS)) {
    classifications.push({
      type: "SYSTEM_NOTIFICATION",
      confidence: 0.85,
      reason: "System/notification email detected"
    });
  }

  // 8. BRAND_OPPORTUNITY detection (non-free domain, not system)
  if (!isFreeEmailDomain(senderEmail) && 
      !isSystemEmail(sender, senderEmail) &&
      !isFromNotificationPlatform(senderEmail)) {
    classifications.push({
      type: "BRAND_OPPORTUNITY",
      confidence: 0.6,
      reason: "Business domain sender detected"
    });
  }

  // Sort by confidence (highest first)
  classifications.sort((a, b) => b.confidence - a.confidence);

  // Return primary classification
  const primary = classifications[0] || {
    type: "LOW_PRIORITY",
    confidence: 0.5,
    reason: "No clear classification"
  };

  return {
    primary,
    all: classifications,
    hasAction: classifications.some(c => 
      ["MEETING_REQUEST", "EVENT_INVITE", "TASK_ACTION", "DEAL_NEGOTIATION"].includes(c.type)
    ),
    timestamp: new Date().toISOString()
  };
}

/**
 * Extract structured data from classified email
 */
export function extractEmailData(email, classification) {
  const { subject = "", body = "", senderEmail = "", sender = "" } = email;

  const data = {
    classification: classification.primary.type,
    confidence: classification.primary.confidence,
    extractedFields: {}
  };

  // Common extractions
  data.extractedFields.senderEmail = senderEmail;
  data.extractedFields.senderName = extractNameFromEmail(sender);

  // Type-specific extractions
  switch (classification.primary.type) {
    case "MEETING_REQUEST":
      data.extractedFields = {
        ...data.extractedFields,
        ...extractMeetingData(email)
      };
      break;
    case "EVENT_INVITE":
      data.extractedFields = {
        ...data.extractedFields,
        ...extractEventData(email)
      };
      break;
    case "DEAL_NEGOTIATION":
      data.extractedFields = {
        ...data.extractedFields,
        dealHint: extractBudgetAmount(body) || "amount not specified"
      };
      break;
    case "INVOICE_PAYMENT":
      data.extractedFields = {
        ...data.extractedFields,
        amount: extractBudgetAmount(body),
        dueDate: extractDueDate(body)
      };
      break;
    case "DELIVERABLE_CONTENT":
      data.extractedFields = {
        ...data.extractedFields,
        dueDate: extractDueDate(body),
        hasAttachments: email.attachments?.length > 0
      };
      break;
    case "BRAND_OPPORTUNITY":
      data.extractedFields = {
        ...data.extractedFields,
        brandDomain: extractDomain(senderEmail),
        brandName: extractBrandName(senderEmail)
      };
      break;
  }

  return data;
}

// ============ HELPER FUNCTIONS ============

function containsKeywords(text, keywords) {
  return keywords.some(keyword => text.includes(keyword.toLowerCase()));
}

function isFreeEmailDomain(email) {
  if (!email) return true;
  const freeDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "protonmail.com"];
  const domain = email.split("@")[1]?.toLowerCase();
  return freeDomains.includes(domain);
}

function isSystemEmail(sender, email) {
  const patterns = [
    /noreply/i, /no-reply/i, /do-not-reply/i, /notification/i,
    /automated/i, /system/i, /alert/i
  ];
  const text = `${sender || ""} ${email || ""}`.toLowerCase();
  return patterns.some(p => p.test(text));
}

function isFromEventPlatform(email) {
  if (!email) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  return KNOWN_EVENT_PLATFORMS.some(platform => 
    domain?.includes(platform.toLowerCase())
  );
}

function isFromNotificationPlatform(email) {
  if (!email) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  return KNOWN_NOTIFICATION_PLATFORMS.some(platform => 
    domain?.includes(platform.toLowerCase())
  );
}

function extractDomain(email) {
  if (!email) return null;
  const parts = email.split("@");
  return parts.length === 2 ? parts[1] : null;
}

function extractNameFromEmail(sender) {
  if (!sender) return "Unknown";
  // Remove email address if present
  const nameOnly = sender.replace(/<[^>]+>/g, "").trim();
  return nameOnly || "Unknown";
}

function extractBrandName(email) {
  const domain = extractDomain(email);
  if (!domain) return null;
  // Extract primary domain without TLD
  return domain
    .replace(/\.com$|\.co\.uk$|\.io$|\.net$|\.org$/, "")
    .split(".")
    .pop()
    .split(/[-_]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function extractMeetingData(email) {
  const { subject = "", body = "" } = email;
  const text = `${subject} ${body}`;
  
  return {
    title: subject.replace(/^(re:|fwd:)\s*/i, "").trim(),
    hasLink: /zoom\.us|meet\.google|teams\.microsoft|calendar/.test(text),
    linkType: extractMeetingLinkType(text),
    hasTime: /\d{1,2}:\d{2}|am|pm|pst|est|utc/.test(text)
  };
}

function extractEventData(email) {
  const { subject = "", body = "" } = email;
  
  return {
    eventName: subject.replace(/^(re:|fwd:)\s*/i, "").trim(),
    hasLocation: /location|venue|address|room|auditorium/.test(body.toLowerCase()),
    requiresRSVP: /rsvp|please confirm|accept|decline|attending/.test(body.toLowerCase())
  };
}

function extractMeetingLinkType(text) {
  if (text.includes("zoom")) return "ZOOM";
  if (text.includes("meet.google")) return "GOOGLE_MEET";
  if (text.includes("teams.microsoft")) return "TEAMS";
  if (text.includes("slack")) return "SLACK_HUDDLE";
  return "PHONE_CALL";
}

function extractBudgetAmount(text) {
  if (!text) return null;
  // Match currency amounts: $1000, 1000 USD, etc.
  const match = text.match(/\$[\d,]+|[\d,]+\s*(usd|eur|gbp|jpy)/i);
  return match ? match[0] : null;
}

function extractDueDate(text) {
  if (!text) return null;
  // Simple due date detection: "due by", "deadline", dates
  const datePatterns = [
    /due\s+(?:by|on|date)?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /deadline[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /by\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}
