import dns from "dns/promises";

const FREE_EMAIL_PROVIDERS = [
  "gmail.com",
  "outlook.com",
  "yahoo.com",
  "hotmail.com",
  "icloud.com",
  "aol.com",
  "protonmail.com"
];

function extractDomain(email?: string | null) {
  if (!email) return null;
  const match = String(email).match(/@([^>\\s]+)$/);
  return match ? match[1].toLowerCase().trim() : null;
}

function looksLikeBrandMismatch(text: string, domain: string) {
  const brand = text.match(/(?:brand|company|from)\\s+([A-Za-z0-9]+)/i)?.[1]?.toLowerCase()?.trim();
  if (!brand) return false;
  return !domain.includes(brand);
}

export async function analyseAuthenticity({
  senderEmail,
  messageText,
  links
}: {
  senderEmail?: string;
  messageText: string;
  links: string[];
}) {
  const warnings: Array<{ id: string; message: string; severity: string }> = [];
  const domain = extractDomain(senderEmail);

  if (!domain) {
    warnings.push({
      id: "no-domain",
      severity: "medium",
      message: "Sender email domain could not be identified."
    });
  } else {
    if (FREE_EMAIL_PROVIDERS.includes(domain)) {
      warnings.push({
        id: "free-provider",
        severity: "medium",
        message: `Sender is using a free email provider (${domain}). Legitimate brand outreach usually comes from a brand-owned domain.`
      });
    }

    if (looksLikeBrandMismatch(messageText || "", domain)) {
      warnings.push({
        id: "brand-mismatch",
        severity: "high",
        message: `The claimed brand in the message does not appear to match the sender's email domain (${domain}).`
      });
    }

    try {
      await dns.resolveMx(domain);
    } catch {
      warnings.push({
        id: "invalid-domain",
        severity: "high",
        message: `The domain \"${domain}\" does not appear to have valid mail settings.`
      });
    }
  }

  links.forEach((url) => {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes("bit.ly") || parsed.hostname.includes("tinyurl")) {
        warnings.push({
          id: "shortlink",
          severity: "medium",
          message: "Message contains shortlink URLs. These can hide the true destination."
        });
      }
    } catch {
      warnings.push({
        id: "invalid-url",
        severity: "low",
        message: "Message contains invalid or malformed URLs."
      });
    }
  });

  const summary =
    warnings.length === 0 ? "No obvious authenticity flags detected." : `${warnings.length} authenticity-related indicators found.`;

  return { summary, warnings };
}
