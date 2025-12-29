interface RuleResult {
  category: string;
  urgency: "low" | "medium" | "high";
}

// Enhanced keyword patterns for better classification
const KEYWORDS: Record<string, { category: string; urgency: "low" | "medium" | "high" }> = {
  // Deal/Opportunity patterns
  "paid collaboration": { category: "deal", urgency: "high" },
  "partnership opportunity": { category: "deal", urgency: "medium" },
  "collaboration opportunity": { category: "deal", urgency: "medium" },
  "brand partnership": { category: "deal", urgency: "medium" },
  "sponsorship": { category: "deal", urgency: "medium" },
  "paid campaign": { category: "deal", urgency: "high" },
  "campaign opportunity": { category: "deal", urgency: "medium" },
  "influencer": { category: "deal", urgency: "medium" },
  "creator": { category: "deal", urgency: "medium" },
  "ambassador": { category: "deal", urgency: "medium" },
  
  // Event patterns
  "you're invited": { category: "event", urgency: "medium" },
  "event invitation": { category: "event", urgency: "medium" },
  "rsvp": { category: "event", urgency: "medium" },
  "save the date": { category: "event", urgency: "low" },
  
  // PR/Media patterns
  "press release": { category: "pr", urgency: "low" },
  "media kit": { category: "pr", urgency: "low" },
  "press kit": { category: "pr", urgency: "low" },
  
  // Payment patterns
  "invoice due": { category: "payment", urgency: "high" },
  "payment due": { category: "payment", urgency: "high" },
  "invoice": { category: "payment", urgency: "medium" },
  
  // Gifting patterns
  "gifting opportunity": { category: "gifting", urgency: "low" },
  "product sample": { category: "gifting", urgency: "low" },
  "pr package": { category: "gifting", urgency: "low" },
  
  // Newsletter/Noise patterns
  "unsubscribe": { category: "newsletter", urgency: "low" },
  "newsletter": { category: "newsletter", urgency: "low" },
  "receipt": { category: "receipt", urgency: "low" },
  "order confirmation": { category: "receipt", urgency: "low" },
  "auto-reply": { category: "auto-reply", urgency: "low" },
  "out of office": { category: "auto-reply", urgency: "low" },
  "vacation": { category: "auto-reply", urgency: "low" },
};

// Newsletter domains (common email marketing platforms)
const NEWSLETTER_DOMAINS = new Set([
  "mailchimp.com",
  "constantcontact.com",
  "campaignmonitor.com",
  "sendgrid.com",
  "mailgun.com",
  "amazon.com", // Order confirmations
  "etsy.com",
  "shopify.com",
]);

/**
 * Classifies an email based on keywords, domain patterns, and heuristics.
 * @param text - The clean text of the email.
 * @param subject - The subject of the email.
 * @param fromEmail - The sender's email address (optional, for domain-based classification).
 * @returns A classification result.
 */
export function classifyWithRules(text: string, subject: string, fromEmail?: string): RuleResult {
  const combined = `${subject.toLowerCase()} ${text.toLowerCase()}`;

  // Check for keyword matches
  for (const keyword in KEYWORDS) {
    if (combined.includes(keyword)) {
      return KEYWORDS[keyword];
    }
  }

  // Domain-based classification (newsletters, receipts)
  if (fromEmail) {
    const domain = fromEmail.toLowerCase().split("@")[1];
    if (domain && NEWSLETTER_DOMAINS.has(domain)) {
      if (combined.includes("receipt") || combined.includes("order") || combined.includes("purchase")) {
        return { category: "receipt", urgency: "low" };
      }
      return { category: "newsletter", urgency: "low" };
    }
  }

  // Auto-reply detection (common patterns)
  if (subject.toLowerCase().includes("re:") && text.length < 100) {
    return { category: "auto-reply", urgency: "low" };
  }

  return { category: "other", urgency: "low" };
}