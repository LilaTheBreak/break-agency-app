interface RuleResult {
  category: string;
  urgency: "low" | "medium" | "high";
}

const KEYWORDS: Record<string, { category: string; urgency: "low" | "medium" | "high" }> = {
  "paid collaboration": { category: "deal", urgency: "high" },
  "partnership opportunity": { category: "deal", urgency: "medium" },
  "you're invited": { category: "event", urgency: "medium" },
  "press release": { category: "pr", urgency: "low" },
  "invoice due": { category: "payment", urgency: "high" },
  "gifting opportunity": { category: "gifting", urgency: "low" }
};

/**
 * Classifies an email based on keywords in its subject and body.
 * @param text - The clean text of the email.
 * @param subject - The subject of the email.
 * @returns A classification result.
 */
export function classifyWithRules(text: string, subject: string): RuleResult {
  const combined = `${subject.toLowerCase()} ${text.toLowerCase()}`;

  for (const keyword in KEYWORDS) {
    if (combined.includes(keyword)) {
      return KEYWORDS[keyword];
    }
  }

  return { category: "other", urgency: "low" };
}