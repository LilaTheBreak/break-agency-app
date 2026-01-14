import * as cheerio from "cheerio";

/**
 * Extracts plain text from an HTML string.
 */
export function extractPlainText(html: string): string {
  try {
    const $ = cheerio.load(html);
    return $.text();
  } catch (error) {
    console.error("Error parsing HTML:", error);
    return "";
  }
}

/**
 * Removes common email clutter like signatures and quoted replies.
 */
export function cleanEmailBody(text: string): string {
  let cleaned = text;
  cleaned = stripQuotedReplies(cleaned);
  cleaned = extractSignature(cleaned).mainBody;
  return cleaned.trim();
}

/**
 * Attempts to separate the signature from the main body of an email.
 */
export function extractSignature(text: string): { mainBody: string; signature: string | null } {
  const signaturePatterns = [
    /(--|––|—)\s*$/, // Standard signature delimiter
    /Best,?/i,
    /Regards,?/i,
    /Sincerely,?/i,
    /Thanks,?/i
  ];
  for (const pattern of signaturePatterns) {
    const match = text.split(pattern);
    if (match.length > 1) {
      return { mainBody: match[0].trim(), signature: match.slice(1).join("").trim() };
    }
  }
  return { mainBody: text, signature: null };
}

export function stripQuotedReplies(text: string): string {
  return text.replace(/(>|On.*wrote:).*/gs, "").trim();
}